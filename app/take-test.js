import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/Colors';
import { generateAITest } from '../services/aiService';
import { updateProgress } from '../services/progressService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function TakeTestScreen() {
    const params = useLocalSearchParams();
    const { subject, subjectColor, questions: questionsParam, timeLimit: timeLimitParam, difficulty } = params;
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
    const timerRef = useRef(null);

    // Parse questions if passed as param, otherwise generate
    useEffect(() => {
        const initializeTest = async () => {
            if (questionsParam) {
                // Questions were passed directly
                try {
                    const parsedQuestions = JSON.parse(questionsParam);
                    setQuestions(parsedQuestions);
                    setTimeRemaining(parseInt(timeLimitParam || 15) * 60);
                    setIsLoading(false);
                } catch (e) {
                    console.error('Error parsing questions:', e);
                    await generateNewTest();
                }
            } else {
                // Generate new test
                await generateNewTest();
            }
        };

        const generateNewTest = async () => {
            try {
                const result = await generateAITest(subject, {
                    numberOfQuestions: 10,
                    difficulty: difficulty || 'adaptive',
                    timeLimit: parseInt(timeLimitParam || 15)
                });

                if (result.success) {
                    setQuestions(result.data.questions);
                    setTimeRemaining(result.data.timeLimit * 60);
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

    // Timer effect
    useEffect(() => {
        if (!isLoading && !testCompleted && timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmitTest();
                        return 0;
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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSelectAnswer = (questionIndex, answerIndex) => {
        if (testCompleted) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [questionIndex]: answerIndex
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitTest = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

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

        // Generate AI insight based on performance
        const insight = generateAIInsight(percentage, correctCount, questions.length);
        setAiInsight(insight);

        // Save to Firebase if user is logged in
        if (user) {
            try {
                // Save quiz result
                await addDoc(collection(db, 'quizResults'), {
                    userId: user.uid,
                    subject: subject,
                    score: percentage,
                    correctAnswers: correctCount,
                    totalQuestions: questions.length,
                    difficulty: difficulty || 'adaptive',
                    timeSpent: (parseInt(timeLimitParam || 15) * 60) - timeRemaining,
                    questionResults: questionResults,
                    createdAt: new Date().toISOString()
                });

                // Update progress for this subject
                const subjectId = subject.toLowerCase().replace(/\s+/g, '');
                await updateProgress(user.uid, subjectId, {
                    lastQuizScore: percentage,
                    totalQuizzesTaken: 1, // Will be incremented in service
                    lastActivity: new Date().toISOString(),
                    averageScore: percentage // Service will calculate running average
                });

                console.log('Quiz results saved successfully!');
            } catch (error) {
                console.error('Error saving quiz results:', error);
            }
        }
        
        setSavingResults(false);
    };

    // Generate AI insight based on quiz performance
    const generateAIInsight = (percentage, correct, total) => {
        if (percentage >= 90) {
            return {
                type: 'excellent',
                title: '🌟 Outstanding Performance!',
                message: `You mastered this topic! Consider trying harder difficulty or exploring advanced concepts in ${subject}.`,
                recommendation: 'Move to next level'
            };
        } else if (percentage >= 75) {
            return {
                type: 'good',
                title: '👏 Great Job!',
                message: `You have a solid understanding. Focus on the ${total - correct} question(s) you missed to achieve mastery.`,
                recommendation: 'Review weak areas'
            };
        } else if (percentage >= 60) {
            return {
                type: 'average',
                title: '💪 Keep Going!',
                message: `You're on the right track! Practice more ${subject} problems to strengthen your understanding.`,
                recommendation: 'Practice more'
            };
        } else if (percentage >= 40) {
            return {
                type: 'needsWork',
                title: '📚 More Practice Needed',
                message: `Don't worry! Review the basics of ${subject} and try again. Each attempt helps you learn.`,
                recommendation: 'Review fundamentals'
            };
        } else {
            return {
                type: 'struggling',
                title: '🎯 Let\'s Build Your Foundation',
                message: `Start with beginner lessons in ${subject}. Take your time to understand core concepts before testing again.`,
                recommendation: 'Start from basics'
            };
        }
    };

    const confirmSubmit = () => {
        const answeredCount = Object.keys(selectedAnswers).length;
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
    };

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

                {/* AI Insight Card */}
                {aiInsight && (
                    <View style={styles.aiInsightCard}>
                        <View style={styles.aiInsightHeader}>
                            <Ionicons name="sparkles" size={20} color={Colors.accent} />
                            <Text style={styles.aiInsightLabel}>AI Learning Insight</Text>
                        </View>
                        <Text style={styles.aiInsightTitle}>{aiInsight.title}</Text>
                        <Text style={styles.aiInsightMessage}>{aiInsight.message}</Text>
                        <View style={styles.aiRecommendation}>
                            <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} />
                            <Text style={styles.aiRecommendationText}>
                                Recommended: {aiInsight.recommendation}
                            </Text>
                        </View>
                    </View>
                )}

                <Text style={styles.reviewTitle}>📋 Review Answers</Text>

                {questions.map((question, index) => {
                    const userAnswer = selectedAnswers[index];
                    const isCorrect = userAnswer === question.correct;
                    const wasAnswered = userAnswer !== undefined;

                    return (
                        <View key={index} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewQuestionNumber}>Q{index + 1}</Text>
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
                            </View>

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
                        </View>
                    );
                })}

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
    const answeredCount = Object.keys(selectedAnswers).length;
    const progressPercentage = (answeredCount / questions.length) * 100;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{subject}</Text>
                    <Text style={styles.headerSubtitle}>
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </Text>
                </View>
                <View style={[styles.timerBadge, timeRemaining < 60 && styles.timerBadgeUrgent]}>
                    <Ionicons
                        name="time"
                        size={16}
                        color={timeRemaining < 60 ? '#EF4444' : Colors.primary}
                    />
                    <Text style={[
                        styles.timerText,
                        timeRemaining < 60 && styles.timerTextUrgent
                    ]}>
                        {formatTime(timeRemaining)}
                    </Text>
                </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                </View>
                <Text style={styles.progressText}>{answeredCount}/{questions.length} answered</Text>
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

            {/* Navigation */}
            <View style={styles.navigation}>
                {/* Question dots */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dotsContainer}
                >
                    {questions.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.questionDot,
                                currentQuestionIndex === index && styles.questionDotActive,
                                selectedAnswers[index] !== undefined && styles.questionDotAnswered
                            ]}
                            onPress={() => setCurrentQuestionIndex(index)}
                        >
                            <Text style={[
                                styles.questionDotText,
                                currentQuestionIndex === index && styles.questionDotTextActive,
                                selectedAnswers[index] !== undefined && styles.questionDotTextAnswered
                            ]}>
                                {index + 1}
                            </Text>
                        </TouchableOpacity>
                    ))}
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
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        gap: Spacing.xs,
    },
    timerBadgeUrgent: {
        backgroundColor: '#EF444420',
    },
    timerText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.primary,
    },
    timerTextUrgent: {
        color: '#EF4444',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        gap: Spacing.md,
    },
    progressBar: {
        flex: 1,
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
        marginBottom: Spacing.sm,
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
    finishButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.lg,
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
