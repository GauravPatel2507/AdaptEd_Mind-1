// QuestionCard — Displays a single question with option buttons
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';

const QuestionCard = ({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}) => {
  if (!question) return null;

  return (
    <View>
      {/* Question */}
      <View style={styles.questionCard}>
        <View style={styles.questionNumberBadge}>
          <Text style={styles.questionNumberText}>Q{questionIndex + 1}</Text>
        </View>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
              ]}
              onPress={() => !disabled && onSelectAnswer(questionIndex, index)}
              disabled={disabled}
            >
              <View style={[
                styles.optionLetter,
                isSelected && styles.optionLetterSelected,
              ]}>
                <Text style={[
                  styles.optionLetterText,
                  isSelected && styles.optionLetterTextSelected,
                ]}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
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
    </View>
  );
};

const styles = StyleSheet.create({
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  questionNumberBadge: {
    backgroundColor: Colors.primary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  questionNumberText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
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
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    ...Shadows.sm,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
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
    fontWeight: '700',
    color: Colors.textLight,
  },
  optionLetterTextSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 22,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default QuestionCard;
