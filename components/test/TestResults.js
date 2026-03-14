// TestResults — Displays score, grade, AI insight, and answer review
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';

const TestResults = ({
  questions,
  selectedAnswers,
  score,
  subject,
  savingResults,
  aiInsight,
  onRetry,
  onPracticeIncorrect,
  onFinish,
}) => {
  const [expandedReview, setExpandedReview] = useState(null);
  const percentage = Math.round((score / questions.length) * 100);

  const getGradeInfo = () => {
    if (percentage >= 90) return { grade: 'A+', color: '#4a8c7e', message: 'Excellent! Outstanding performance!' };
    if (percentage >= 80) return { grade: 'A', color: '#5a9e93', message: 'Great job! Very well done!' };
    if (percentage >= 70) return { grade: 'B', color: '#3d7068', message: 'Good work! Keep it up!' };
    if (percentage >= 60) return { grade: 'C', color: '#c49a3c', message: 'Not bad! Room for improvement.' };
    if (percentage >= 50) return { grade: 'D', color: '#F97316', message: 'Keep practicing!' };
    return { grade: 'F', color: '#c45c4a', message: 'You need more practice.' };
  };

  const gradeInfo = getGradeInfo();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Test Complete! 🎉</Text>
        <Text style={styles.subject}>{subject}</Text>
      </View>

      {/* Grade Card */}
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

      {/* AI Insight */}
      {aiInsight && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="sparkles" size={20} color={Colors.accent} />
            <Text style={styles.insightLabel}>AI LEARNING INSIGHT</Text>
          </View>
          <Text style={styles.insightTitle}>{aiInsight.title}</Text>
          <Text style={styles.insightMessage}>{aiInsight.message}</Text>
          {aiInsight.tips?.length > 0 && (
            <View style={styles.tipsContainer}>
              {aiInsight.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.secondary} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.recommendation}>
            <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} />
            <Text style={styles.recommendationText}>
              Recommended: {aiInsight.recommendation}
            </Text>
          </View>
        </View>
      )}

      {/* Review Section */}
      <Text style={styles.reviewTitle}>📋 Review Answers</Text>
      {questions.map((question, index) => (
        <ReviewCard
          key={index}
          question={question}
          index={index}
          userAnswer={selectedAnswers[index]}
          isExpanded={expandedReview === index}
          onToggle={() => setExpandedReview(expandedReview === index ? null : index)}
        />
      ))}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
          <Text style={styles.retryText}>RETRY TEST</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.practiceButton} onPress={onPracticeIncorrect}>
          <Ionicons name="fitness" size={20} color={Colors.accent} />
          <Text style={styles.practiceText}>PRACTICE</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
        <Text style={styles.finishText}>BACK TO TESTS</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

// ── ReviewCard Sub-component ────────────────────────────────────────
const ReviewCard = ({ question, index, userAnswer, isExpanded, onToggle }) => {
  const isCorrect = userAnswer === question.correct;
  const wasAnswered = userAnswer !== undefined;

  return (
    <TouchableOpacity style={styles.reviewCard} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewNumber}>Q{index + 1}</Text>
        <View style={styles.reviewHeaderRight}>
          <View style={[
            styles.reviewStatus,
            { backgroundColor: isCorrect ? '#10B98120' : '#EF444420' },
          ]}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={isCorrect ? '#10B981' : '#EF4444'}
            />
            <Text style={[
              styles.reviewStatusText,
              { color: isCorrect ? '#10B981' : '#EF4444' },
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
                    isUserAnswer && !isCorrectOption && styles.reviewOptionWrong,
                  ]}
                >
                  <Text style={[
                    styles.reviewOptionText,
                    isCorrectOption && { color: '#10B981', fontWeight: '600' },
                    isUserAnswer && !isCorrectOption && { color: '#EF4444', fontWeight: '600' },
                  ]}>
                    {String.fromCharCode(65 + optIndex)}. {option}
                  </Text>
                  {isCorrectOption && <Ionicons name="checkmark" size={18} color="#10B981" />}
                  {isUserAnswer && !isCorrectOption && <Ionicons name="close" size={18} color="#EF4444" />}
                </View>
              );
            })}
          </View>
          {question.explanation && (
            <View style={styles.explanation}>
              <Ionicons name="bulb" size={16} color={Colors.accent} />
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSizes.xxl, fontFamily: Fonts.heading, fontWeight: '300', color: Colors.text, letterSpacing: -0.5 },
  subject: { fontSize: FontSizes.sm, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 2 },
  gradeCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.xl, alignItems: 'center', borderWidth: 2,
    marginBottom: Spacing.lg, borderColor: Colors.cardBorder,
  },
  gradeText: { fontSize: 56, fontFamily: Fonts.monoBold, fontWeight: '700' },
  percentageText: { fontSize: FontSizes.xxl, fontFamily: Fonts.monoBold, fontWeight: '700', color: Colors.text, marginTop: 4 },
  scoreText: { fontSize: FontSizes.sm, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 4, letterSpacing: 0.5 },
  gradeMessage: { fontSize: FontSizes.md, fontFamily: Fonts.body, color: Colors.text, marginTop: Spacing.sm, textAlign: 'center' },
  savingBadge: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.xs },
  savingText: { fontSize: FontSizes.sm, fontFamily: Fonts.mono, color: Colors.textMuted, letterSpacing: 0.5 },
  insightCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderLeftWidth: 3, borderLeftColor: Colors.accent,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  insightLabel: { fontSize: FontSizes.xs, fontFamily: Fonts.mono, fontWeight: '400', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 2 },
  insightTitle: { fontSize: FontSizes.lg, fontFamily: Fonts.heading, fontWeight: '300', color: Colors.text, marginBottom: 4, letterSpacing: -0.3 },
  insightMessage: { fontSize: FontSizes.md, fontFamily: Fonts.body, color: Colors.textLight, lineHeight: 22 },
  tipsContainer: { marginTop: Spacing.md, gap: 6 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  tipText: { fontSize: FontSizes.sm, fontFamily: Fonts.body, color: Colors.text, flex: 1 },
  recommendation: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.xs },
  recommendationText: { fontSize: FontSizes.sm, fontFamily: Fonts.mono, fontWeight: '400', color: Colors.primary, letterSpacing: 0.3 },
  reviewTitle: { fontSize: FontSizes.lg, fontFamily: Fonts.heading, fontWeight: '300', color: Colors.text, marginBottom: Spacing.md, letterSpacing: -0.3 },
  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewNumber: { fontSize: FontSizes.sm, fontFamily: Fonts.mono, fontWeight: '400', color: Colors.primary, letterSpacing: 1 },
  reviewHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.sm, gap: 4 },
  reviewStatusText: { fontSize: FontSizes.xs, fontFamily: Fonts.mono, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewQuestion: { fontSize: FontSizes.md, fontFamily: Fonts.bodyMedium, color: Colors.text, marginTop: Spacing.md, lineHeight: 22 },
  reviewOptions: { marginTop: Spacing.sm, gap: 6 },
  reviewOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.background },
  reviewOptionCorrect: { backgroundColor: '#10B98115' },
  reviewOptionWrong: { backgroundColor: '#EF444415' },
  reviewOptionText: { fontSize: FontSizes.sm, fontFamily: Fonts.body, color: Colors.text, flex: 1 },
  explanation: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.accent + '10', borderRadius: BorderRadius.sm },
  explanationText: { fontSize: FontSizes.sm, fontFamily: Fonts.body, color: Colors.text, flex: 1, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  retryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, padding: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.primary },
  retryText: { fontSize: FontSizes.xs, fontFamily: Fonts.mono, fontWeight: '400', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5 },
  practiceButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, padding: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.accent },
  practiceText: { fontSize: FontSizes.xs, fontFamily: Fonts.mono, fontWeight: '400', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1.5 },
  finishButton: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, alignItems: 'center' },
  finishText: { fontSize: FontSizes.sm, fontFamily: Fonts.mono, fontWeight: '400', color: '#fff', textTransform: 'uppercase', letterSpacing: 2 },
});

export default TestResults;
