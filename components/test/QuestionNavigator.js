// QuestionNavigator — Bottom navigation bar for test with question dots
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, FontSizes } from '../../constants/Colors';

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
          <Ionicons name="chevron-back" size={18} color={currentQuestionIndex === 0 ? Colors.textMuted : Colors.text} />
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>
            PREV
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex === totalQuestions - 1 || showSubmitButton ? (
          <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
            <Text style={styles.submitText}>SUBMIT</Text>
            <Ionicons name="checkmark-done" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextText}>NEXT</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
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
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dotAnswered: {
    backgroundColor: Colors.primary + '15',
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
    fontSize: 10,
    fontFamily: Fonts.mono,
    fontWeight: '400',
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
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    fontWeight: '400',
    color: Colors.text,
    letterSpacing: 1.5,
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
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  nextText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    fontWeight: '400',
    color: '#fff',
    letterSpacing: 1.5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  submitText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    fontWeight: '400',
    color: '#fff',
    letterSpacing: 1.5,
  },
});

export default QuestionNavigator;
