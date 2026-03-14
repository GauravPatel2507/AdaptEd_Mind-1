// QuestionNavigator — Bottom navigation bar for test with question dots
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes } from '../../constants/Colors';

const QuestionNavigator = ({
  totalQuestions,
  currentQuestionIndex,
  selectedAnswers,
  visitedQuestions,
  onPrevious,
  onNext,
  onJumpTo,
  onSubmit,
  showSubmitButton = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Question dots */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dotsScroll}
        contentContainerStyle={styles.dotsContent}
      >
        {Array.from({ length: totalQuestions }, (_, i) => {
          const isAnswered = selectedAnswers[i] !== undefined;
          const isCurrent = i === currentQuestionIndex;
          const isVisited = visitedQuestions.has(i);

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dot,
                isAnswered && styles.dotAnswered,
                isCurrent && styles.dotCurrent,
                !isAnswered && isVisited && styles.dotVisited,
              ]}
              onPress={() => onJumpTo(i)}
            >
              <Text style={[
                styles.dotText,
                isAnswered && styles.dotTextAnswered,
                isCurrent && styles.dotTextCurrent,
              ]}>
                {i + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={onPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentQuestionIndex === 0 ? Colors.textMuted : Colors.text} />
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex === totalQuestions - 1 || showSubmitButton ? (
          <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
            <Text style={styles.submitText}>Submit Test</Text>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingBottom: 20,
  },
  dotsScroll: {
    maxHeight: 48,
  },
  dotsContent: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: 6,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dotAnswered: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  dotCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotVisited: {
    borderColor: Colors.textMuted,
  },
  dotText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textLight,
  },
  dotTextAnswered: {
    color: Colors.primary,
  },
  dotTextCurrent: {
    color: '#fff',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
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
    gap: 4,
  },
  nextText: {
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
    gap: 4,
  },
  submitText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
  },
});

export default QuestionNavigator;
