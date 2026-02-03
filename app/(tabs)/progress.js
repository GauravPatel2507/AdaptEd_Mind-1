import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS, PERFORMANCE_THRESHOLDS } from '../../constants/Config';
import { FadeInDown, FadeInUp } from '../../components/Animations';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    totalStudyTime: 0,
    streak: 0
  });
  const [recentTests, setRecentTests] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], strokeWidth: 3 }]
  });
  const [learningGaps, setLearningGaps] = useState([]);

  const periods = ['week', 'month', 'year'];

  // Fetch all progress data
  const fetchProgressData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get quiz results from Firebase
      const quizResultsRef = collection(db, 'quizResults');
      const q = query(
        quizResultsRef,
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });

      // Sort by date (newest first) after fetching
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      console.log(`Loaded ${results.length} quiz results for progress`);

      // Calculate statistics
      if (results.length > 0) {
        // Total tests and average score
        const totalTests = results.length;
        const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
        const averageScore = Math.round(totalScore / totalTests);

        // Total study time (in minutes)
        const totalStudyTime = results.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
        const studyHours = Math.round(totalStudyTime / 60);

        // Calculate streak (consecutive days with tests)
        const streak = calculateStreak(results);

        setStats({
          totalTests,
          averageScore,
          totalStudyTime: studyHours,
          streak
        });

        // Recent tests (last 5)
        setRecentTests(results.slice(0, 5));

        // Subject-wise progress
        const subjectScores = {};
        results.forEach(result => {
          const subject = result.subject;
          if (!subjectScores[subject]) {
            subjectScores[subject] = { total: 0, count: 0 };
          }
          subjectScores[subject].total += result.score || 0;
          subjectScores[subject].count += 1;
        });

        const subjectData = Object.entries(subjectScores).map(([name, data]) => {
          const subjectInfo = SUBJECTS.find(s => s.name === name) || {};
          return {
            id: subjectInfo.id || name.toLowerCase(),
            name,
            progress: Math.round(data.total / data.count),
            tests: data.count,
            color: subjectInfo.color || '#6366F1'
          };
        }).sort((a, b) => b.tests - a.tests);

        setSubjectProgress(subjectData);

        // Chart data (last 7 days)
        const last7Days = getLast7DaysData(results);
        setChartData({
          labels: last7Days.labels,
          datasets: [{ data: last7Days.data, strokeWidth: 3 }]
        });

        // Learning gaps (subjects with low scores)
        const gaps = subjectData
          .filter(s => s.progress < 70)
          .map(s => ({
            subject: s.name,
            topic: `Average: ${s.progress}%`,
            confidence: s.progress,
            icon: getSubjectIcon(s.id)
          }));
        setLearningGaps(gaps);
      }
    } catch (error) {
      console.log('Error fetching progress:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedPeriod]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProgressData();
  }, [fetchProgressData]);

  // Calculate streak
  const calculateStreak = (results) => {
    if (results.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = results.map(r => {
      const date = new Date(r.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

    let streak = 0;
    let currentDate = today.getTime();

    for (const date of uniqueDates) {
      if (date === currentDate || date === currentDate - 86400000) {
        streak++;
        currentDate = date;
      } else {
        break;
      }
    }

    return streak;
  };

  // Get last 7 days chart data
  const getLast7DaysData = (results) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      last7Days.push({
        label: days[date.getDay()],
        date: date.getTime()
      });
    }

    last7Days.forEach(day => {
      const dayResults = results.filter(r => {
        const resultDate = new Date(r.createdAt);
        resultDate.setHours(0, 0, 0, 0);
        return resultDate.getTime() === day.date;
      });

      if (dayResults.length > 0) {
        const avg = dayResults.reduce((sum, r) => sum + (r.score || 0), 0) / dayResults.length;
        data.push(Math.round(avg));
      } else {
        data.push(0);
      }
    });

    return {
      labels: last7Days.map(d => d.label),
      data: data.map(d => d || 0)
    };
  };

  const getSubjectIcon = (subjectId) => {
    const icons = {
      math: 'calculator', mathematics: 'calculator',
      science: 'flask',
      english: 'book',
      history: 'time',
      geography: 'globe',
      physics: 'nuclear',
      chemistry: 'beaker',
      biology: 'leaf',
      computer: 'laptop', 'computer science': 'laptop',
      arts: 'color-palette'
    };
    return icons[subjectId?.toLowerCase()] || 'school';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>Sign in to track progress</Text>
        <Text style={styles.emptySubtitle}>Your test results will be saved here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
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
            <ProgressRing progress={stats.averageScore} size={140} strokeWidth={12} color={Colors.primary}>
              <Text style={styles.ringValue}>{stats.averageScore}%</Text>
              <Text style={styles.ringLabel}>Average</Text>
            </ProgressRing>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.secondary} />
                <Text style={styles.statBoxValue}>{stats.totalTests}</Text>
                <Text style={styles.statBoxLabel}>Tests Taken</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="time" size={24} color={Colors.accent} />
                <Text style={styles.statBoxValue}>{stats.totalStudyTime}h</Text>
                <Text style={styles.statBoxLabel}>Study Time</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="flame" size={24} color={Colors.error} />
                <Text style={styles.statBoxValue}>{stats.streak}</Text>
                <Text style={styles.statBoxLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        </FadeInDown>

        {/* Performance Chart */}
        <FadeInDown delay={200} style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Weekly Performance</Text>
          {chartData.datasets[0].data.some(d => d > 0) ? (
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
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyChartText}>Take tests to see your performance chart</Text>
            </View>
          )}
        </FadeInDown>

        {/* Recent Tests */}
        {recentTests.length > 0 && (
          <FadeInDown delay={300}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📝 Recent Tests</Text>
            </View>
            {recentTests.map((test, index) => (
              <FadeInUp key={test.id} delay={400 + index * 50}>
                <View style={styles.testCard}>
                  <View style={[styles.testIcon, { backgroundColor: getScoreColor(test.score) + '20' }]}>
                    <Ionicons name={getSubjectIcon(test.subject)} size={24} color={getScoreColor(test.score)} />
                  </View>
                  <View style={styles.testContent}>
                    <Text style={styles.testSubject}>{test.subject}</Text>
                    <Text style={styles.testDate}>{formatDate(test.createdAt)}</Text>
                  </View>
                  <View style={styles.testScore}>
                    <Text style={[styles.testScoreValue, { color: getScoreColor(test.score) }]}>
                      {test.score}%
                    </Text>
                    <Text style={styles.testScoreLabel}>
                      {test.correctAnswers}/{test.totalQuestions}
                    </Text>
                  </View>
                </View>
              </FadeInUp>
            ))}
          </FadeInDown>
        )}

        {/* Learning Gaps */}
        {learningGaps.length > 0 && (
          <FadeInDown delay={300}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎯 Areas to Improve</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Subjects that need more practice</Text>

            {learningGaps.map((gap, index) => (
              <FadeInUp key={gap.subject} delay={400 + index * 100}>
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
        )}

        {/* Subject Progress */}
        {subjectProgress.length > 0 && (
          <FadeInDown delay={500}>
            <Text style={styles.sectionTitle}>Subject Progress</Text>
            {subjectProgress.map((subject, index) => (
              <View key={subject.id} style={styles.subjectProgressCard}>
                <View style={styles.subjectProgressHeader}>
                  <Text style={styles.subjectProgressName}>{subject.name}</Text>
                  <View style={styles.subjectProgressStats}>
                    <Text style={styles.subjectTestCount}>{subject.tests} tests</Text>
                    <Text style={[styles.subjectProgressValue, { color: subject.color }]}>
                      {subject.progress}%
                    </Text>
                  </View>
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
        )}

        {/* Empty state */}
        {stats.totalTests === 0 && (
          <FadeInDown delay={200} style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No tests taken yet</Text>
            <Text style={styles.emptySubtitle}>Take your first test to start tracking progress!</Text>
          </FadeInDown>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const getScoreColor = (score) => {
  if (score >= 90) return '#10B981';
  if (score >= 75) return '#6366F1';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
};

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
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  subjectProgressName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
  },
  subjectProgressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subjectTestCount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
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
  // New styles for dynamic progress
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  emptyChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // Recent Tests styles
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  testIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  testContent: {
    flex: 1,
  },
  testSubject: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  testDate: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  testScore: {
    alignItems: 'flex-end',
  },
  testScoreValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  testScoreLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
});
