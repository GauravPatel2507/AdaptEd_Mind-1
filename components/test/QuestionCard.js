// QuestionCard — Displays a single question with option buttons
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, FontSizes } from '../../constants/Colors';

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
              activeOpacity={0.7}
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
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
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
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  questionNumberBadge: {
    backgroundColor: Colors.primary + '10',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  questionNumberText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    fontWeight: '400',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  questionText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bodyMedium,
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
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '06',
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  optionLetterSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionLetterText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.mono,
    fontWeight: '400',
    color: Colors.textLight,
  },
  optionLetterTextSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: Fonts.body,
    color: Colors.text,
    lineHeight: 22,
  },
  optionTextSelected: {
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.primary,
  },
});

export default QuestionCard;
