// TestHeader — Timer, progress bar, and question counter for the test screen
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, FontSizes } from '../../constants/Colors';

const TestHeader = ({
  subject,
  currentQuestionIndex,
  totalQuestions,
  timeRemaining,
  answeredCount,
  onExit,
  formatTime,
  getTimerColor,
}) => {
  const timerColor = getTimerColor();
  const answeredPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const positionPercentage = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <View>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} style={styles.backButton}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{subject}</Text>
          <Text style={styles.headerSubtitle}>
            QUESTION {currentQuestionIndex + 1} OF {totalQuestions}
          </Text>
        </View>
        <View style={[styles.timerBadge, { backgroundColor: timerColor + '10', borderColor: timerColor + '20' }]}>
          <Ionicons name="time-outline" size={14} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      {/* Progress bars */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarWrapper}>
          <View style={styles.positionBar}>
            <View style={[styles.positionFill, { width: `${positionPercentage}%` }]} />
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${answeredPercentage}%` }]} />
          </View>
        </View>
        <Text style={styles.progressText}>{answeredCount}/{totalQuestions}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.heading,
    fontWeight: '400',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 4,
    borderWidth: 1,
  },
  timerText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  progressBarWrapper: {
    flex: 1,
    gap: 3,
  },
  positionBar: {
    height: 2,
    backgroundColor: Colors.cardBorder,
    borderRadius: 1,
    overflow: 'hidden',
  },
  positionFill: {
    height: '100%',
    backgroundColor: Colors.textMuted,
    borderRadius: 1,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    fontWeight: '400',
    color: Colors.textLight,
    minWidth: 35,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
});

export default TestHeader;
