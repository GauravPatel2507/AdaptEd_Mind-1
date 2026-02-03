import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS, PERFORMANCE_THRESHOLDS } from '../../constants/Config';
import { FadeInDown, FadeInUp } from '../../components/Animations';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const periods = ['week', 'month', 'year'];
  
  // Sample data for charts
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [65, 78, 72, 85, 80, 88, 92],
      strokeWidth: 3,
    }],
  };
  
  const learningGaps = [
    { subject: 'Math', topic: 'Quadratic Equations', confidence: 45, icon: 'calculator' },
    { subject: 'Physics', topic: 'Electromagnetic Waves', confidence: 38, icon: 'nuclear' },
    { subject: 'Chemistry', topic: 'Organic Reactions', confidence: 52, icon: 'flask' },
  ];
  
  const subjectProgress = [
    { id: 'math', name: 'Mathematics', progress: 78, color: '#6366F1' },
    { id: 'science', name: 'Science', progress: 85, color: '#10B981' },
    { id: 'english', name: 'English', progress: 92, color: '#F59E0B' },
    { id: 'physics', name: 'Physics', progress: 65, color: '#3B82F6' },
    { id: 'chemistry', name: 'Chemistry', progress: 71, color: '#EF4444' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <FadeInDown delay={0} style={styles.header}>
          <Text style={styles.title}>My Progress</Text>
          <Text style={styles.subtitle}>Track your learning journey</Text>
        </FadeInDown>

        {/* Overall Progress Card */}
        <FadeInDown delay={100} style={styles.overallCard}>
          <View style={styles.overallHeader}>
            <Text style={styles.overallTitle}>Overall Performance</Text>
            <View style={styles.periodSelector}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.progressRingSection}>
            <ProgressRing progress={82} size={140} strokeWidth={12} color={Colors.primary}>
              <Text style={styles.ringValue}>82%</Text>
              <Text style={styles.ringLabel}>Average</Text>
            </ProgressRing>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.secondary} />
                <Text style={styles.statBoxValue}>156</Text>
                <Text style={styles.statBoxLabel}>Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="time" size={24} color={Colors.accent} />
                <Text style={styles.statBoxValue}>48h</Text>
                <Text style={styles.statBoxLabel}>Study Time</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="flame" size={24} color={Colors.error} />
                <Text style={styles.statBoxValue}>7</Text>
                <Text style={styles.statBoxLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        </FadeInDown>

        {/* Performance Chart */}
        <FadeInDown delay={200} style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Weekly Performance</Text>
          <LineChart
            data={chartData}
            width={width - Spacing.lg * 4}
            height={180}
            chartConfig={{
              backgroundColor: Colors.surface,
              backgroundGradientFrom: Colors.surface,
              backgroundGradientTo: Colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => Colors.textLight,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: Colors.primary,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: Colors.cardBorder,
              },
            }}
            bezier
            style={styles.chart}
          />
        </FadeInDown>

        {/* Learning Gaps - Module 1 */}
        <FadeInDown delay={300}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Learning Gaps</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Topics that need more practice</Text>
          
          {learningGaps.map((gap, index) => (
            <FadeInUp key={gap.topic} delay={400 + index * 100}>
              <TouchableOpacity style={styles.gapCard}>
                <View style={[styles.gapIcon, { backgroundColor: getConfidenceColor(gap.confidence) + '20' }]}>
                  <Ionicons name={gap.icon} size={24} color={getConfidenceColor(gap.confidence)} />
                </View>
                <View style={styles.gapContent}>
                  <Text style={styles.gapSubject}>{gap.subject}</Text>
                  <Text style={styles.gapTopic}>{gap.topic}</Text>
                  <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceFill, { 
                      width: `${gap.confidence}%`,
                      backgroundColor: getConfidenceColor(gap.confidence)
                    }]} />
                  </View>
                </View>
                <View style={styles.gapAction}>
                  <Text style={[styles.confidenceText, { color: getConfidenceColor(gap.confidence) }]}>
                    {gap.confidence}%
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            </FadeInUp>
          ))}
        </FadeInDown>

        {/* Subject Progress */}
        <FadeInDown delay={500}>
          <Text style={styles.sectionTitle}>Subject Progress</Text>
          {subjectProgress.map((subject, index) => (
            <View key={subject.id} style={styles.subjectProgressCard}>
              <View style={styles.subjectProgressHeader}>
                <Text style={styles.subjectProgressName}>{subject.name}</Text>
                <Text style={[styles.subjectProgressValue, { color: subject.color }]}>
                  {subject.progress}%
                </Text>
              </View>
              <View style={styles.subjectProgressBar}>
                <View 
                  style={[styles.subjectProgressFill, { 
                    width: `${subject.progress}%`,
                    backgroundColor: subject.color
                  }]} 
                />
              </View>
            </View>
          ))}
        </FadeInDown>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// Progress Ring Component
const ProgressRing = ({ progress, size, strokeWidth, color, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          stroke={Colors.cardBorder}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        {children}
      </View>
    </View>
  );
};

const getConfidenceColor = (confidence) => {
  if (confidence >= PERFORMANCE_THRESHOLDS.good) return Colors.secondary;
  if (confidence >= PERFORMANCE_THRESHOLDS.average) return Colors.accent;
  return Colors.error;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    marginTop: 4,
  },
  overallCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  overallTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    fontWeight: '500',
  },
  periodTextActive: {
    color: Colors.textOnPrimary,
  },
  progressRingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ringValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  ringLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  statsGrid: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statBoxValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  statBoxLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  chart: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  gapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  gapIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  gapContent: {
    flex: 1,
  },
  gapSubject: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gapTopic: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  gapAction: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  confidenceText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectProgressCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  subjectProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  subjectProgressName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
  },
  subjectProgressValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  subjectProgressBar: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
  },
  subjectProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
