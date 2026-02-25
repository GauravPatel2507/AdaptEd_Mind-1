import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
    Modal,
    Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/Colors';
import { SUBJECTS } from '../constants/Config';
import { generateAITest } from '../services/aiService';
import { updateProgress } from '../services/progressService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const AUTOSAVE_KEY = 'test_autosave_state';

export default function TakeTestScreen() {
    const params = useLocalSearchParams();
    const { subject, subjectId: subjectIdParam, subjectColor, questions: questionsParam, timeLimit: timeLimitParam, difficulty, numberOfQuestions: numberOfQuestionsParam } = params;
    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [testCompleted, setTestCompleted] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [savingResults, setSavingResults] = useState(false);
    const [aiInsight, setAiInsight] = useState(null);
    // New state
    const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
    const [expandedReview, setExpandedReview] = useState(null);
    const [showExitModal, setShowExitModal] = useState(false);

    const timerRef = useRef(null);
    const totalTimeRef = useRef(0);
    const hasVibratedRef = useRef(false);

    // Derived values (memoized)
    const answeredCount = useMemo(() => Object.keys(selectedAnswers).length, [selectedAnswers]);
    const answeredPercentage = useMemo(
        () => questions.length > 0 ? (answeredCount / questions.length) * 100 : 0,
        [answeredCount, questions.length]
    );
    const positionPercentage = useMemo(
        () => questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0,
        [currentQuestionIndex, questions.length]
    );
    const showFloatingSubmit = useMemo(
        () => !testCompleted && answeredPercentage >= 70,
        [testCompleted, answeredPercentage]
    );

    // Timer color gradient based on remaining time percentage
    const getTimerColor = useCallback(() => {
        if (totalTimeRef.current === 0) return Colors.primary;
        const pct = timeRemaining / totalTimeRef.current;
        if (pct > 0.5) return '#10B981';
        if (pct > 0.25) return '#F59E0B';
        if (pct > 0.1) return '#F97316';
        return '#EF4444';
    }, [timeRemaining]);

    // --- Autosave / Restore ---
    const saveTestState = useCallback(async (answers, qIndex, time, visited) => {
        try {
            await AsyncStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
                subject,
                subjectIdParam,
                difficulty,
                questionsData: questions,
                answers,
                currentQuestionIndex: qIndex,
                timeRemaining: time,
                visitedQuestions: [...visited],
                totalTime: totalTimeRef.current,
                savedAt: Date.now(),
            }));
        } catch (e) { /* silent */ }
    }, [subject, subjectIdParam, difficulty, questions]);

    const clearSavedState = useCallback(async () => {
        try { await AsyncStorage.removeItem(AUTOSAVE_KEY); } catch (e) { /* silent */ }
    }, []);

    // --- Initialize test ---
    useEffect(() => {
        const initializeTest = async () => {
            // Check for saved state first
            try {
                const saved = await AsyncStorage.getItem(AUTOSAVE_KEY);
                if (saved) {
                    const state = JSON.parse(saved);
                    // Resume only if same subject and saved within last 2 hours
                    if (state.subject === subject && (Date.now() - state.savedAt) < 2 * 60 * 60 * 1000 && state.questionsData?.length > 0) {
                        return new Promise((resolve) => {
                            Alert.alert(
                                'Resume Test?',
                                `You have a saved ${subject} test in progress. Resume where you left off?`,
                                [
                                    {
                                        text: 'Start Fresh',
                                        style: 'destructive',
                                        onPress: async () => {
                                            await clearSavedState();
                                            await loadFreshTest();
                                            resolve();
                                        }
                                    },
                                    {
                                        text: 'Resume',
                                        onPress: () => {
                                            setQuestions(state.questionsData);
                                            setSelectedAnswers(state.answers || {});
                                            setCurrentQuestionIndex(state.currentQuestionIndex || 0);
                                            setTimeRemaining(state.timeRemaining || parseInt(timeLimitParam || 15) * 60);
                                            totalTimeRef.current = state.totalTime || parseInt(timeLimitParam || 15) * 60;
                                            setVisitedQuestions(new Set(state.visitedQuestions || [0]));
                                            setIsLoading(false);
                                            resolve();
                                        }
                                    }
                                ]
                            );
                        });
                    } else {
                        await clearSavedState();
                    }
                }
            } catch (e) { /* ignore */ }
            await loadFreshTest();
        };

        const loadFreshTest = async () => {
            if (questionsParam) {
                try {
                    const parsedQuestions = JSON.parse(questionsParam);
                    setQuestions(parsedQuestions);
                    const time = parseInt(timeLimitParam || 15) * 60;
                    setTimeRemaining(time);
                    totalTimeRef.current = time;
                    setIsLoading(false);
                } catch (e) {
                    console.error('Error parsing questions:', e);
                    await generateNewTest();
                }
            } else {
                await generateNewTest();
            }
        };

        const generateNewTest = async () => {
            try {
                const result = await generateAITest(subject, {
                    numberOfQuestions: parseInt(numberOfQuestionsParam || 10),
                    difficulty: difficulty || 'adaptive',
                    timeLimit: parseInt(timeLimitParam || 15)
                });

                if (result.success) {
                    setQuestions(result.data.questions);
                    const time = result.data.timeLimit * 60;
                    setTimeRemaining(time);
                    totalTimeRef.current = time;
                } else {
                    Alert.alert('Error', 'Failed to generate test. Please try again.');
                    router.back();
                }
            } catch (error) {
                console.error('Error generating test:', error);
                Alert.alert('Error', 'Failed to generate test. Please try again.');
                router.back();
            } finally {
                setIsLoading(false);
            }
        };

        initializeTest();
    }, []);

    // Timer effect with vibration at 30s
    useEffect(() => {
        if (!isLoading && !testCompleted && timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmitTest();
                        return 0;
                    }
                    // Vibrate at 30s
                    if (prev === 31 && !hasVibratedRef.current) {
                        hasVibratedRef.current = true;
                        try { Vibration.vibrate([0, 300, 100, 300]); } catch (e) { /* silent */ }
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isLoading, testCompleted]);

    // Autosave on answer/navigation changes
    useEffect(() => {
        if (!isLoading && !testCompleted && questions.length > 0) {
            saveTestState(selectedAnswers, currentQuestionIndex, timeRemaining, visitedQuestions);
        }
    }, [selectedAnswers, currentQuestionIndex]);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const handleSelectAnswer = useCallback((questionIndex, answerIndex) => {
        if (testCompleted) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [questionIndex]: answerIndex
        }));
    }, [testCompleted]);

    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            const nextIdx = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIdx);
            setVisitedQuestions(prev => new Set([...prev, nextIdx]));
        }
    }, [currentQuestionIndex, questions.length]);

    const handlePreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            const prevIdx = currentQuestionIndex - 1;
            setCurrentQuestionIndex(prevIdx);
            setVisitedQuestions(prev => new Set([...prev, prevIdx]));
        }
    }, [currentQuestionIndex]);

    const jumpToQuestion = useCallback((index) => {
        setCurrentQuestionIndex(index);
        setVisitedQuestions(prev => new Set([...prev, index]));
    }, []);

    // Exit confirmation
    const handleExitPress = useCallback(() => {
        if (testCompleted) {
            router.back();
        } else {
            setShowExitModal(true);
        }
    }, [testCompleted]);

    const confirmExit = useCallback(async () => {
        setShowExitModal(false);
        await clearSavedState();
        if (timerRef.current) clearInterval(timerRef.current);
        router.back();
    }, [clearSavedState]);

    const handleSubmitTest = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        // Clear autosave
        await clearSavedState();

        // Calculate score
        let correctCount = 0;
        const questionResults = [];

        questions.forEach((question, index) => {
            const isCorrect = selectedAnswers[index] === question.correct;
            if (isCorrect) {
                correctCount++;
            }
            questionResults.push({
                questionId: question.id,
                correct: isCorrect,
                userAnswer: selectedAnswers[index],
                correctAnswer: question.correct
            });
        });

        const percentage = Math.round((correctCount / questions.length) * 100);

        setScore(correctCount);
        setTestCompleted(true);
        setShowResults(true);
        setSavingResults(true);

        // Generate smarter AI insight
        const insight = generateSmartInsight(percentage, correctCount, questions, selectedAnswers);
        setAiInsight(insight);

        // Save to Firebase if user is logged in
        if (user) {
            try {
                await addDoc(collection(db, 'quizResults'), {
                    userId: user.uid,
                    subject: subject,
                    subjectId: subjectIdParam || (SUBJECTS.find(s => s.name === subject)?.id) || subject.toLowerCase().replace(/\s+/g, ''),
                    score: percentage,
                    correctAnswers: correctCount,
                    totalQuestions: questions.length,
                    difficulty: difficulty || 'adaptive',
                    timeSpent: totalTimeRef.current - timeRemaining,
                    questionResults: questionResults,
                    createdAt: new Date().toISOString()
                });

                const resolvedSubjectId = subjectIdParam || (SUBJECTS.find(s => s.name === subject)?.id) || subject.toLowerCase().replace(/\s+/g, '');
                await updateProgress(user.uid, resolvedSubjectId, {
                    lastQuizScore: percentage,
                    totalQuizzesTaken: 1,
                    lastActivity: new Date().toISOString(),
                    averageScore: percentage
                });

                console.log('Quiz results saved successfully!');
            } catch (error) {
                console.error('Error saving quiz results:', error);
            }
        }

        setSavingResults(false);
    };

    // Smarter AI insight — analyzes wrong answers by topic/pattern
    const generateSmartInsight = (percentage, correct, qs, answers) => {
        const wrongQuestions = qs.filter((q, i) => answers[i] !== q.correct);
        const skippedQuestions = qs.filter((q, i) => answers[i] === undefined);

        // Group wrong answers by topic if available
        const wrongTopics = wrongQuestions.map(q => q.topic || q.category || subject).filter(Boolean);
        const topicCounts = {};
        wrongTopics.forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; });
        const weakestTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0];

        const timeUsed = totalTimeRef.current - timeRemaining;
        const avgTimePerQ = qs.length > 0 ? Math.round(timeUsed / qs.length) : 0;
        const wasRushed = avgTimePerQ < 30;

        if (percentage >= 90) {
            return {
                type: 'excellent',
                title: '\u{1F31F} Outstanding Performance!',
                message: `You mastered this test! ${correct}/${qs.length} correct in ${formatTime(timeUsed)}. Consider trying a harder difficulty.`,
                recommendation: 'Challenge yourself with harder difficulty',
                tips: ['Try timing yourself with less time', `Explore advanced ${subject} topics`]
            };
        } else if (percentage >= 75) {
            return {
                type: 'good',
                title: '\u{1F44F} Great Job!',
                message: `Solid performance! You missed ${qs.length - correct} question${qs.length - correct > 1 ? 's' : ''}.${weakestTopic ? ` Focus on "${weakestTopic[0]}" where you missed ${weakestTopic[1]} question(s).` : ''}`,
                recommendation: weakestTopic ? `Review ${weakestTopic[0]}` : 'Review missed questions',
                tips: [`Practice "${weakestTopic?.[0] || subject}" problems`, 'Review explanations for missed questions']
            };
        } else if (percentage >= 60) {
            return {
                type: 'average',
                title: '\u{1F4AA} Keep Going!',
                message: `You're making progress! ${wasRushed ? 'You may have rushed — try spending more time per question. ' : ''}${weakestTopic ? `Weakest area: "${weakestTopic[0]}" (${weakestTopic[1]} wrong). ` : ''}${skippedQuestions.length > 0 ? `You skipped ${skippedQuestions.length} question(s).` : ''}`,
                recommendation: weakestTopic ? `Focus on ${weakestTopic[0]}` : 'Practice more',
                tips: [weakestTopic ? `Study ${weakestTopic[0]} fundamentals` : `Review ${subject} basics`, wasRushed ? 'Read questions more carefully' : 'Practice with timed tests']
            };
        } else if (percentage >= 40) {
            return {
                type: 'needsWork',
                title: '\u{1F4DA} More Practice Needed',
                message: `Don't give up! ${weakestTopic ? `"${weakestTopic[0]}" seems challenging. ` : ''}${skippedQuestions.length > 0 ? `Try answering all questions next time. ` : ''}Review the learning material before retrying.`,
                recommendation: 'Start with fundamentals',
                tips: ['Review the learning section for this subject', weakestTopic ? `Focus on ${weakestTopic[0]}` : 'Take notes while studying', 'Try easier difficulty']
            };
        } else {
            return {
                type: 'struggling',
                title: '\u{1F3AF} Let\'s Build Your Foundation',
                message: `Start with beginner lessons in ${subject}. ${weakestTopic ? `"${weakestTopic[0]}" needs the most attention. ` : ''}Understanding basics will help you score much higher.`,
                recommendation: 'Start from basics',
                tips: ['Go through learning material first', 'Try with easier difficulty', 'Take untimed practice tests']
            };
        }
    };

    const confirmSubmit = useCallback(() => {
        const unansweredCount = questions.length - answeredCount;

        if (unansweredCount > 0) {
            Alert.alert(
                'Submit Test?',
                `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Submit', onPress: handleSubmitTest }
                ]
            );
        } else {
            handleSubmitTest();
        }
    }, [questions.length, answeredCount]);

    // Retry test handler
    const handleRetryTest = useCallback(() => {
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        setVisitedQuestions(new Set([0]));
        setTestCompleted(false);
        setShowResults(false);
        setScore(0);
        setAiInsight(null);
        setExpandedReview(null);
        hasVibratedRef.current = false;
        setTimeRemaining(totalTimeRef.current);
    }, []);

    // Practice incorrect only
    const handlePracticeIncorrect = useCallback(() => {
        const incorrectQuestions = questions.filter((q, i) => selectedAnswers[i] !== q.correct);
        if (incorrectQuestions.length === 0) {
            Alert.alert('Perfect Score!', 'You answered everything correctly!');
            return;
        }
        const practiceTime = Math.max(incorrectQuestions.length * 90, 120);
        setQuestions(incorrectQuestions);
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        setVisitedQuestions(new Set([0]));
        setTestCompleted(false);
        setShowResults(false);
        setScore(0);
        setAiInsight(null);
        setExpandedReview(null);
        hasVibratedRef.current = false;
        setTimeRemaining(practiceTime);
        totalTimeRef.current = practiceTime;
    }, [questions, selectedAnswers]);

    // Loading screen
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={[Colors.background, Colors.surface]}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingTitle}>Generating Your Test</Text>
                    <Text style={styles.loadingSubtitle}>
                        AI is creating personalized questions for {subject}...
                    </Text>
                    <View style={styles.loadingDots}>
                        <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                        <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
                        <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
                    </View>
                </LinearGradient>
            </View>
        );
    }

    // Results screen
    if (showResults) {
        const percentage = Math.round((score / questions.length) * 100);
        const getGradeInfo = () => {
            if (percentage >= 90) return { grade: 'A+', color: '#10B981', message: 'Excellent! Outstanding performance!' };
            if (percentage >= 80) return { grade: 'A', color: '#22C55E', message: 'Great job! Very well done!' };
            if (percentage >= 70) return { grade: 'B', color: '#6366F1', message: 'Good work! Keep it up!' };
            if (percentage >= 60) return { grade: 'C', color: '#F59E0B', message: 'Not bad! Room for improvement.' };
            if (percentage >= 50) return { grade: 'D', color: '#F97316', message: 'Keep practicing!' };
            return { grade: 'F', color: '#EF4444', message: 'You need more practice.' };
        };

        const gradeInfo = getGradeInfo();

        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.resultsContent}>
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsTitle}>Test Complete! 🎉</Text>
                    <Text style={styles.resultsSubject}>{subject}</Text>
                </View>

                <View style={[styles.gradeCard, { borderColor: gradeInfo.color }]}>
                    <Text style={[styles.gradeText, { color: gradeInfo.color }]}>{gradeInfo.grade}</Text>
                    <Text style={styles.percentageText}>{percentage}%</Text>
                    <Text style={styles.scoreText}>{score} / {questions.length} correct</Text>
                    <Text style={styles.gradeMessage}>{gradeInfo.message}</Text>
                    {savingResults && (
                        <View style={styles.savingBadge}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.savingText}>Saving progress...</Text>
                        </View>
                    )}
                </View>

                {/* AI Insight Card - Enhanced with tips */}
                {aiInsight && (
                    <View style={styles.aiInsightCard}>
                        <View style={styles.aiInsightHeader}>
                            <Ionicons name="sparkles" size={20} color={Colors.accent} />
                            <Text style={styles.aiInsightLabel}>AI Learning Insight</Text>
                        </View>
                        <Text style={styles.aiInsightTitle}>{aiInsight.title}</Text>
                        <Text style={styles.aiInsightMessage}>{aiInsight.message}</Text>
                        {aiInsight.tips && aiInsight.tips.length > 0 && (
                            <View style={styles.tipsContainer}>
                                {aiInsight.tips.map((tip, i) => (
                                    <View key={i} style={styles.tipRow}>
                                        <Ionicons name="checkmark-circle-outline" size={16} color={Colors.secondary} />
                                        <Text style={styles.tipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        <View style={styles.aiRecommendation}>
                            <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} />
                            <Text style={styles.aiRecommendationText}>
                                Recommended: {aiInsight.recommendation}
                            </Text>
                        </View>
                    </View>
                )}

                <Text style={styles.reviewTitle}>📋 Review Answers</Text>

                {/* Collapsible review cards */}
                {questions.map((question, index) => {
                    const userAnswer = selectedAnswers[index];
                    const isCorrect = userAnswer === question.correct;
                    const wasAnswered = userAnswer !== undefined;
                    const isExpanded = expandedReview === index;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.reviewCard}
                            onPress={() => setExpandedReview(isExpanded ? null : index)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewQuestionNumber}>Q{index + 1}</Text>
                                <View style={styles.reviewHeaderRight}>
                                    <View style={[
                                        styles.reviewStatus,
                                        { backgroundColor: isCorrect ? '#10B98120' : '#EF444420' }
                                    ]}>
                                        <Ionicons
                                            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                                            size={16}
                                            color={isCorrect ? '#10B981' : '#EF4444'}
                                        />
                                        <Text style={[
                                            styles.reviewStatusText,
                                            { color: isCorrect ? '#10B981' : '#EF4444' }
                                        ]}>
                                            {isCorrect ? 'Correct' : wasAnswered ? 'Incorrect' : 'Skipped'}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={18}
                                        color={Colors.textLight}
                                    />
                                </View>
                            </View>

                            {isExpanded && (
                                <>
                                    <Text style={styles.reviewQuestion}>{question.question}</Text>

                                    <View style={styles.reviewOptions}>
                                        {question.options.map((option, optIndex) => {
                                            const isCorrectOption = optIndex === question.correct;
                                            const isUserAnswer = optIndex === userAnswer;

                                            return (
                                                <View
                                                    key={optIndex}
                                                    style={[
                                                        styles.reviewOption,
                                                        isCorrectOption && styles.reviewOptionCorrect,
                                                        isUserAnswer && !isCorrectOption && styles.reviewOptionWrong
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.reviewOptionText,
                                                        isCorrectOption && styles.reviewOptionTextCorrect,
                                                        isUserAnswer && !isCorrectOption && styles.reviewOptionTextWrong
                                                    ]}>
                                                        {String.fromCharCode(65 + optIndex)}. {option}
                                                    </Text>
                                                    {isCorrectOption && (
                                                        <Ionicons name="checkmark" size={18} color="#10B981" />
                                                    )}
                                                    {isUserAnswer && !isCorrectOption && (
                                                        <Ionicons name="close" size={18} color="#EF4444" />
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>

                                    {question.explanation && (
                                        <View style={styles.explanationBox}>
                                            <Ionicons name="bulb" size={16} color={Colors.accent} />
                                            <Text style={styles.explanationText}>{question.explanation}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </TouchableOpacity>
                    );
                })}

                {/* Retry action buttons */}
                <View style={styles.resultActions}>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetryTest}>
                        <Ionicons name="refresh" size={20} color={Colors.primary} />
                        <Text style={styles.retryButtonText}>Retry Test</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.practiceButton} onPress={handlePracticeIncorrect}>
                        <Ionicons name="fitness" size={20} color={Colors.accent} />
                        <Text style={styles.practiceButtonText}>Practice Incorrect</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.finishButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.finishButtonText}>Back to Tests</Text>
                </TouchableOpacity>

                <View style={{ height: 50 }} />
            </ScrollView>
        );
    }

    // Test taking screen
    const currentQuestion = questions[currentQuestionIndex];
    const timerColor = getTimerColor();

    return (
        <View style={styles.container}>
            {/* Exit Confirmation Modal */}
            <Modal
                visible={showExitModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowExitModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Ionicons name="warning" size={48} color="#F59E0B" />
                        <Text style={styles.modalTitle}>Leave Test?</Text>
                        <Text style={styles.modalMessage}>
                            Leaving will discard your test progress. Your answers won't be saved.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowExitModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Continue Test</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalLeaveButton}
                                onPress={confirmExit}
                            >
                                <Text style={styles.modalLeaveText}>Leave</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleExitPress} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{subject}</Text>
                    <Text style={styles.headerSubtitle}>
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </Text>
                </View>
                <View style={[styles.timerBadge, { backgroundColor: timerColor + '15' }]}>
                    <Ionicons
                        name="time"
                        size={16}
                        color={timerColor}
                    />
                    <Text style={[styles.timerText, { color: timerColor }]}>
                        {formatTime(timeRemaining)}
                    </Text>
                </View>
            </View>

            {/* Dual Progress bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBarWrapper}>
                    {/* Position indicator (thin) */}
                    <View style={styles.positionBar}>
                        <View style={[styles.positionFill, { width: `${positionPercentage}%` }]} />
                    </View>
                    {/* Answered percentage (main) */}
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${answeredPercentage}%` }]} />
                    </View>
                </View>
                <Text style={styles.progressText}>{answeredCount}/{questions.length}</Text>
            </View>

            {/* Question */}
            <ScrollView
                style={styles.questionContainer}
                contentContainerStyle={styles.questionContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.questionCard}>
                    <View style={styles.questionNumberBadge}>
                        <Text style={styles.questionNumberText}>Q{currentQuestionIndex + 1}</Text>
                    </View>
                    <Text style={styles.questionText}>{currentQuestion?.question}</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {currentQuestion?.options.map((option, index) => {
                        const isSelected = selectedAnswers[currentQuestionIndex] === index;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionCard,
                                    isSelected && styles.optionCardSelected
                                ]}
                                onPress={() => handleSelectAnswer(currentQuestionIndex, index)}
                            >
                                <View style={[
                                    styles.optionLetter,
                                    isSelected && styles.optionLetterSelected
                                ]}>
                                    <Text style={[
                                        styles.optionLetterText,
                                        isSelected && styles.optionLetterTextSelected
                                    ]}>
                                        {String.fromCharCode(65 + index)}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.optionText,
                                    isSelected && styles.optionTextSelected
                                ]}>
                                    {option}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Floating Submit Button */}
            {showFloatingSubmit && (
                <TouchableOpacity
                    style={styles.floatingSubmit}
                    onPress={confirmSubmit}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                    <Text style={styles.floatingSubmitText}>Submit Test</Text>
                </TouchableOpacity>
            )}

            {/* Navigation */}
            <View style={styles.navigation}>
                {/* Question dots - 3 states */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dotsContainer}
                >
                    {questions.map((_, index) => {
                        const isActive = currentQuestionIndex === index;
                        const isAnswered = selectedAnswers[index] !== undefined;
                        const isVisited = visitedQuestions.has(index) && !isAnswered;

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.questionDot,
                                    isActive && styles.questionDotActive,
                                    isAnswered && styles.questionDotAnswered,
                                    isVisited && !isActive && styles.questionDotVisited,
                                ]}
                                onPress={() => jumpToQuestion(index)}
                            >
                                <Text style={[
                                    styles.questionDotText,
                                    isActive && styles.questionDotTextActive,
                                    isAnswered && styles.questionDotTextAnswered,
                                    isVisited && !isActive && styles.questionDotTextVisited,
                                ]}>
                                    {index + 1}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Navigation buttons */}
                <View style={styles.navButtons}>
                    <TouchableOpacity
                        style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
                        onPress={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                    >
                        <Ionicons name="chevron-back" size={20} color={currentQuestionIndex === 0 ? Colors.textMuted : Colors.text} />
                        <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>
                            Previous
                        </Text>
                    </TouchableOpacity>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={confirmSubmit}
                        >
                            <Text style={styles.submitButtonText}>Submit Test</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={handleNextQuestion}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                            <Ionicons name="chevron-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
    },
    loadingGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    loadingTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.text,
        marginTop: Spacing.lg,
    },
    loadingSubtitle: {
        fontSize: FontSizes.md,
        color: Colors.textLight,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    loadingDots: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerCenter: {
        flex: 1,
        marginHorizontal: Spacing.md,
    },
    headerTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: FontSizes.sm,
        color: Colors.textLight,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        gap: Spacing.xs,
    },
    timerText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        gap: Spacing.md,
    },
    progressBarWrapper: {
        flex: 1,
        gap: 3,
    },
    positionBar: {
        height: 3,
        backgroundColor: Colors.cardBorder,
        borderRadius: 2,
        overflow: 'hidden',
    },
    positionFill: {
        height: '100%',
        backgroundColor: Colors.primary + '60',
        borderRadius: 2,
    },
    progressBar: {
        height: 6,
        backgroundColor: Colors.cardBorder,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.secondary,
        borderRadius: 3,
    },
    progressText: {
        fontSize: FontSizes.sm,
        color: Colors.textLight,
    },
    questionContainer: {
        flex: 1,
    },
    questionContent: {
        padding: Spacing.lg,
    },
    questionCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.md,
    },
    questionNumberBadge: {
        backgroundColor: Colors.primary + '20',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.md,
    },
    questionNumberText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.primary,
    },
    questionText: {
        fontSize: FontSizes.lg,
        fontWeight: '500',
        color: Colors.text,
        lineHeight: 28,
    },
    optionsContainer: {
        gap: Spacing.sm,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.cardBorder,
        ...Shadows.sm,
    },
    optionCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    optionLetter: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    optionLetterSelected: {
        backgroundColor: Colors.primary,
    },
    optionLetterText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
    },
    optionLetterTextSelected: {
        color: '#fff',
    },
    optionText: {
        flex: 1,
        fontSize: FontSizes.md,
        color: Colors.text,
    },
    optionTextSelected: {
        color: Colors.primary,
        fontWeight: '500',
    },
    // Floating submit
    floatingSubmit: {
        position: 'absolute',
        bottom: 140,
        right: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        gap: Spacing.xs,
        ...Shadows.lg,
        elevation: 8,
    },
    floatingSubmitText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
    },
    navigation: {
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
        paddingTop: Spacing.sm,
        paddingBottom: 30,
        paddingHorizontal: Spacing.lg,
    },
    dotsContainer: {
        paddingVertical: Spacing.sm,
        gap: Spacing.xs,
    },
    questionDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    questionDotActive: {
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    questionDotAnswered: {
        backgroundColor: Colors.secondary + '30',
        borderColor: Colors.secondary,
    },
    questionDotVisited: {
        borderColor: '#F59E0B',
        borderWidth: 2,
        backgroundColor: '#F59E0B10',
    },
    questionDotText: {
        fontSize: FontSizes.xs,
        color: Colors.textLight,
        fontWeight: '500',
    },
    questionDotTextActive: {
        color: Colors.primary,
    },
    questionDotTextAnswered: {
        color: Colors.secondary,
    },
    questionDotTextVisited: {
        color: '#F59E0B',
    },
    navButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        gap: Spacing.xs,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: FontSizes.md,
        color: Colors.text,
    },
    navButtonTextDisabled: {
        color: Colors.textMuted,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
    },
    nextButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
    },
    submitButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
    },
    // Exit Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        ...Shadows.lg,
    },
    modalTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.text,
        marginTop: Spacing.md,
    },
    modalMessage: {
        fontSize: FontSizes.md,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: Spacing.sm,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.xl,
        width: '100%',
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: FontSizes.md,
    },
    modalLeaveButton: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    modalLeaveText: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: FontSizes.md,
    },
    // Results styles
    resultsContent: {
        padding: Spacing.lg,
        paddingTop: 60,
    },
    resultsHeader: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    resultsTitle: {
        fontSize: FontSizes.xxl,
        fontWeight: '700',
        color: Colors.text,
    },
    resultsSubject: {
        fontSize: FontSizes.lg,
        color: Colors.textLight,
        marginTop: Spacing.xs,
    },
    gradeCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.xl,
        borderWidth: 3,
        ...Shadows.lg,
    },
    gradeText: {
        fontSize: 64,
        fontWeight: '800',
    },
    percentageText: {
        fontSize: FontSizes.xxl,
        fontWeight: '700',
        color: Colors.text,
        marginTop: Spacing.xs,
    },
    scoreText: {
        fontSize: FontSizes.md,
        color: Colors.textLight,
        marginTop: Spacing.xs,
    },
    gradeMessage: {
        fontSize: FontSizes.md,
        color: Colors.text,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    // Review
    reviewTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    reviewCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reviewHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    reviewQuestionNumber: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.primary,
    },
    reviewStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    reviewStatusText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    reviewQuestion: {
        fontSize: FontSizes.md,
        color: Colors.text,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
        lineHeight: 22,
    },
    reviewOptions: {
        gap: Spacing.xs,
    },
    reviewOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.sm,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
    },
    reviewOptionCorrect: {
        backgroundColor: '#10B98120',
    },
    reviewOptionWrong: {
        backgroundColor: '#EF444420',
    },
    reviewOptionText: {
        fontSize: FontSizes.sm,
        color: Colors.text,
        flex: 1,
    },
    reviewOptionTextCorrect: {
        color: '#10B981',
        fontWeight: '500',
    },
    reviewOptionTextWrong: {
        color: '#EF4444',
    },
    explanationBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.accent + '15',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
        gap: Spacing.xs,
    },
    explanationText: {
        flex: 1,
        fontSize: FontSizes.sm,
        color: Colors.text,
        lineHeight: 20,
    },
    // Result actions
    resultActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    retryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary + '15',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    retryButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.primary,
    },
    practiceButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.accent + '15',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.accent + '30',
    },
    practiceButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.accent,
    },
    finishButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    finishButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
    },
    // AI Insight styles
    savingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.md,
        gap: Spacing.xs,
    },
    savingText: {
        fontSize: FontSizes.sm,
        color: Colors.textLight,
    },
    aiInsightCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.accent + '40',
        ...Shadows.md,
    },
    aiInsightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    aiInsightLabel: {
        fontSize: FontSizes.sm,
        color: Colors.accent,
        fontWeight: '600',
    },
    aiInsightTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    aiInsightMessage: {
        fontSize: FontSizes.md,
        color: Colors.textLight,
        lineHeight: 22,
        marginBottom: Spacing.md,
    },
    tipsContainer: {
        marginBottom: Spacing.md,
        gap: Spacing.xs,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    tipText: {
        fontSize: FontSizes.sm,
        color: Colors.text,
        flex: 1,
    },
    aiRecommendation: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '10',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
    },
    aiRecommendationText: {
        fontSize: FontSizes.sm,
        color: Colors.primary,
        fontWeight: '500',
    },
});
