import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS, PERFORMANCE_THRESHOLDS } from '../../constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    totalStudyTime: 0,
    streak: 0,
    smartScore: 0
  });
  const [recentTests, setRecentTests] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], strokeWidth: 3 }]
  });
  const [learningGaps, setLearningGaps] = useState([]);

  const periods = ['week', 'month', 'year'];
  const periodDays = { week: 7, month: 30, year: 365 };

  // --- Fetch data once, then filter by period ---
  const fetchAllResults = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
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

      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllResults(results);
    } catch (error) {
      console.log('Error fetching progress:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllResults();
  }, [fetchAllResults]);

  // --- Filter results by selected period ---
  const filteredResults = useMemo(() => {
    if (allResults.length === 0) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays[selectedPeriod]);
    return allResults.filter(r => new Date(r.createdAt) >= cutoff);
  }, [allResults, selectedPeriod]);

  // --- Compute all derived state from filtered results ---
  useEffect(() => {
    if (allResults.length === 0) return;

    const results = filteredResults;

    if (results.length > 0) {
      const totalTests = results.length;
      const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
      const averageScore = Math.round(totalScore / totalTests);

      const totalStudyTime = results.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
      const studyHours = Math.round(totalStudyTime / 60);

      // Streak with 1-day grace period
      const streak = calculateStreak(allResults);

      // Smart score: avg (40%) + consistency (30%) + trend (30%)
      const consistency = calculateConsistency(results);
      const trend = calculateTrend(results);
      const smartScore = Math.round(averageScore * 0.4 + consistency * 0.3 + trend * 0.3);

      setStats({
        totalTests,
        averageScore,
        totalStudyTime: studyHours,
        streak,
        smartScore: Math.min(100, Math.max(0, smartScore))
      });

      setRecentTests(results.slice(0, 5));

      // Subject-wise progress
      const subjectScores = {};
      results.forEach(result => {
        const subjectName = result.subject;
        const subjectId = result.subjectId;
        const key = subjectName || subjectId || 'Unknown';
        if (!subjectScores[key]) {
          subjectScores[key] = { total: 0, count: 0, subjectId: subjectId };
        }
        subjectScores[key].total += result.score || 0;
        subjectScores[key].count += 1;
        if (subjectId && !subjectScores[key].subjectId) {
          subjectScores[key].subjectId = subjectId;
        }
      });

      const subjectData = Object.entries(subjectScores).map(([name, data]) => {
        const subjectInfo = SUBJECTS.find(s => s.id === data.subjectId)
          || SUBJECTS.find(s => s.name === name)
          || {};
        return {
          id: subjectInfo.id || data.subjectId || name.toLowerCase(),
          name: subjectInfo.name || name,
          progress: Math.round(data.total / data.count),
          tests: data.count,
          color: subjectInfo.color || '#6366F1'
        };
      }).sort((a, b) => b.tests - a.tests);

      setSubjectProgress(subjectData);

      // Chart data based on period
      const chartInfo = getChartData(results, selectedPeriod);
      setChartData({
        labels: chartInfo.labels,
        datasets: [{ data: chartInfo.data, strokeWidth: 3 }]
      });

      // Learning gaps
      const gaps = subjectData
        .filter(s => s.progress < 70)
        .map(s => ({
          subject: s.name,
          subjectId: s.id,
          topic: `Average: ${s.progress}%`,
          confidence: s.progress,
          icon: getSubjectIcon(s.id)
        }));
      setLearningGaps(gaps);
    } else {
      setStats({ totalTests: 0, averageScore: 0, totalStudyTime: 0, streak: calculateStreak(allResults), smartScore: 0 });
      setRecentTests([]);
      setSubjectProgress([]);
      setLearningGaps([]);
      setChartData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], strokeWidth: 3 }]
      });
    }
  }, [filteredResults, allResults]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllResults();
  }, [fetchAllResults]);

  // Streak with 1-day grace period
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
    const DAY = 86400000;

    let streak = 0;
    let currentDate = today.getTime();
    let graceUsed = false;

    for (const date of uniqueDates) {
      const diff = currentDate - date;
      if (diff === 0 || diff === DAY) {
        streak++;
        currentDate = date;
      } else if (diff === DAY * 2 && !graceUsed) {
        // 1-day grace: skip one gap
        graceUsed = true;
        streak++;
        currentDate = date;
      } else {
        break;
      }
    }

    return streak;
  };

  // Consistency score (0-100): how regularly user tests
  const calculateConsistency = (results) => {
    if (results.length < 2) return 50;
    const dates = [...new Set(results.map(r => {
      const d = new Date(r.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort();
    const daysCovered = (dates[dates.length - 1] - dates[0]) / 86400000 + 1;
    const activeDays = dates.length;
    return Math.min(100, Math.round((activeDays / Math.max(daysCovered, 1)) * 100));
  };

  // Trend score (0-100): improving = high, declining = low
  const calculateTrend = (results) => {
    if (results.length < 2) return 50;
    const sorted = [...results].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);
    const firstAvg = firstHalf.reduce((s, r) => s + (r.score || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, r) => s + (r.score || 0), 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    return Math.min(100, Math.max(0, 50 + diff));
  };

  // Chart data helper: adapts labels based on period
  const getChartData = (results, period) => {
    if (period === 'week') {
      return getLast7DaysData(results);
    } else if (period === 'month') {
      return getLastNWeeksData(results, 4);
    } else {
      return getLastNMonthsData(results, 6);
    }
  };

  const getLast7DaysData = (results) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push({ label: days[date.getDay()], date: date.getTime() });
    }

    last7Days.forEach(day => {
      const dayResults = results.filter(r => {
        const d = new Date(r.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === day.date;
      });
      data.push(dayResults.length > 0
        ? Math.round(dayResults.reduce((s, r) => s + (r.score || 0), 0) / dayResults.length)
        : 0
      );
    });

    return { labels: last7Days.map(d => d.label), data: data.map(d => d || 0) };
  };

  const getLastNWeeksData = (results, n) => {
    const labels = [];
    const data = [];
    for (let i = n - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      labels.push(`W${n - i}`);
      const weekResults = results.filter(r => {
        const d = new Date(r.createdAt);
        return d >= start && d < end;
      });
      data.push(weekResults.length > 0
        ? Math.round(weekResults.reduce((s, r) => s + (r.score || 0), 0) / weekResults.length)
        : 0
      );
    }
    return { labels, data: data.map(d => d || 0) };
  };

  const getLastNMonthsData = (results, n) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const data = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      labels.push(months[d.getMonth()]);
      const monthResults = results.filter(r => {
        const rd = new Date(r.createdAt);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      });
      data.push(monthResults.length > 0
        ? Math.round(monthResults.reduce((s, r) => s + (r.score || 0), 0) / monthResults.length)
        : 0
      );
    }
    return { labels, data: data.map(d => d || 0) };
  };

  const getSubjectIcon = (subjectId) => {
    const subject = SUBJECTS.find(s => s.id === subjectId || s.name.toLowerCase() === subjectId?.toLowerCase());
    return subject?.icon || 'school';
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

  // --- AI Study Recommendation ---
  const aiRecommendation = useMemo(() => {
    if (subjectProgress.length === 0) return null;
    const weakest = [...subjectProgress].sort((a, b) => a.progress - b.progress)[0];
    if (!weakest) return null;
    return {
      subject: weakest.name,
      subjectId: weakest.id,
      score: weakest.progress,
      message: `Practice ${weakest.name} today — you scored ${weakest.progress}% last time`
    };
  }, [subjectProgress]);

  // --- Predictive Insight ---
  const predictiveInsight = useMemo(() => {
    if (subjectProgress.length === 0 || allResults.length < 3) return null;
    // Find subject with most improvement potential
    const improving = subjectProgress.filter(s => s.progress >= 50 && s.progress < 85 && s.tests >= 2);
    if (improving.length === 0) return null;
    const best = improving.sort((a, b) => b.progress - a.progress)[0];
    // Estimate weeks: assume 5% improvement per week of practice
    const remaining = 85 - best.progress;
    const weeksNeeded = Math.max(1, Math.ceil(remaining / 5));
    return {
      subject: best.name,
      weeks: weeksNeeded,
      message: `At this pace, you'll master ${best.name} in ~${weeksNeeded} week${weeksNeeded > 1 ? 's' : ''}`
    };
  }, [subjectProgress, allResults]);

  // --- Achievement Badges ---
  const badges = useMemo(() => {
    const earned = [];
    if (stats.streak >= 7) earned.push({ icon: 'flame', label: '7-Day Streak', color: '#EF4444', bg: '#EF444420' });
    if (stats.streak >= 3 && stats.streak < 7) earned.push({ icon: 'flame', label: `${stats.streak}-Day Streak`, color: '#F97316', bg: '#F9731620' });
    if (allResults.length >= 10) earned.push({ icon: 'trophy', label: '10+ Tests', color: '#F59E0B', bg: '#F59E0B20' });
    if (allResults.length >= 5 && allResults.length < 10) earned.push({ icon: 'ribbon', label: `${allResults.length} Tests`, color: '#6366F1', bg: '#6366F120' });
    if (stats.averageScore >= 90) earned.push({ icon: 'star', label: '90%+ Scorer', color: '#10B981', bg: '#10B98120' });
    if (stats.averageScore >= 75 && stats.averageScore < 90) earned.push({ icon: 'star-half', label: '75%+ Average', color: '#22C55E', bg: '#22C55E20' });
    return earned;
  }, [stats, allResults]);

  // Navigation handlers
  const navigateToTests = useCallback(() => {
    router.push('/(tabs)/tests');
  }, []);

  const navigateToLearn = useCallback((subjectId) => {
    router.push('/(tabs)/learn');
  }, []);

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
        <View style={styles.header}>
          <Text style={styles.title}>My Progress</Text>
          <Text style={styles.subtitle}>Track your learning journey</Text>
        </View>

        {/* Overall Progress Card */}
        <View style={styles.overallCard}>
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
            <ProgressRing progress={stats.smartScore} size={140} strokeWidth={12} color={Colors.primary}>
              <Text style={styles.ringValue}>{stats.smartScore}%</Text>
              <Text style={styles.ringLabel}>Smart Score</Text>
            </ProgressRing>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.secondary} />
                <Text style={styles.statBoxValue}>{stats.totalTests}</Text>
                <Text style={styles.statBoxLabel}>Tests</Text>
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
        </View>

        {/* Achievement Badges */}
        {badges.length > 0 && (
          <View style={styles.badgesRow}>
            {badges.map((badge, i) => (
              <View key={i} style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Ionicons name={badge.icon} size={16} color={badge.color} />
                <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Study Recommendation */}
        {aiRecommendation && stats.totalTests > 0 && (
          <TouchableOpacity
            style={styles.aiRecCard}
            onPress={() => navigateToLearn(aiRecommendation.subjectId)}
            activeOpacity={0.7}
          >
            <View style={styles.aiRecIcon}>
              <Ionicons name="sparkles" size={20} color={Colors.accent} />
            </View>
            <View style={styles.aiRecContent}>
              <Text style={styles.aiRecLabel}>AI Recommendation</Text>
              <Text style={styles.aiRecMessage}>{aiRecommendation.message}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Predictive Insight */}
        {predictiveInsight && (
          <View style={styles.predictCard}>
            <Ionicons name="trending-up" size={20} color={Colors.secondary} />
            <Text style={styles.predictText}>{predictiveInsight.message}</Text>
          </View>
        )}

        {/* Performance Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>
            {selectedPeriod === 'week' ? 'Weekly' : selectedPeriod === 'month' ? 'Monthly' : 'Yearly'} Performance
          </Text>
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
              <Text style={styles.emptyChartText}>No data for this period</Text>
            </View>
          )}
        </View>

        {/* Learning Gaps - tappable */}
        {learningGaps.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{'\u{1F3AF}'} Areas to Improve</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Tap to practice this subject</Text>

            {learningGaps.map((gap, index) => (
              <TouchableOpacity
                key={gap.subject}
                style={styles.gapCard}
                onPress={() => navigateToLearn(gap.subjectId)}
                activeOpacity={0.7}
              >
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
            ))}
          </View>
        )}

        {/* Recent Tests */}
        {recentTests.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{'\u{1F4DD}'} Recent Tests</Text>
            </View>
            {recentTests.map((test) => (
              <View key={test.id} style={styles.testCard}>
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
            ))}
          </View>
        )}

        {/* Subject Progress - tappable */}
        {subjectProgress.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Subject Progress</Text>
            {subjectProgress.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={styles.subjectProgressCard}
                onPress={() => navigateToLearn(subject.id)}
                activeOpacity={0.7}
              >
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
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Subject Performance Bar Chart */}
        {subjectProgress.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{'\u{1F4CA}'} Subject Performance</Text>
            <View style={styles.barChartCard}>
              <BarChart
                data={{
                  labels: subjectProgress.slice(0, 6).map(s => s.name.length > 8 ? s.name.substring(0, 7) + '\u2026' : s.name),
                  datasets: [{ data: subjectProgress.slice(0, 6).map(s => s.progress) }]
                }}
                width={width - Spacing.lg * 2 - Spacing.md * 2}
                height={200}
                fromZero
                showValuesOnTopOfBars
                chartConfig={{
                  backgroundColor: Colors.surface,
                  backgroundGradientFrom: Colors.surface,
                  backgroundGradientTo: Colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  labelColor: () => Colors.textLight,
                  barPercentage: 0.6,
                  propsForLabels: { fontSize: 10 },
                }}
                style={{ borderRadius: BorderRadius.md }}
              />
            </View>
          </View>
        )}

        {/* You're Great At - Strengths */}
        {subjectProgress.filter(s => s.progress >= 75).length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{'\u{1F3C6}'} You're Great At</Text>
            </View>
            {subjectProgress.filter(s => s.progress >= 75).map((subject) => (
              <View key={subject.id} style={styles.strengthCard}>
                <View style={[styles.strengthIcon, { backgroundColor: subject.color + '20' }]}>
                  <Ionicons name={getSubjectIcon(subject.id)} size={22} color={subject.color} />
                </View>
                <View style={styles.strengthContent}>
                  <Text style={styles.strengthName}>{subject.name}</Text>
                  <Text style={styles.strengthMeta}>{subject.tests} tests \u2022 Avg {subject.progress}%</Text>
                </View>
                <View style={[styles.strengthBadge, { backgroundColor: subject.progress >= 90 ? '#10B981' + '20' : '#6366F1' + '20' }]}>
                  <Ionicons name={subject.progress >= 90 ? 'trophy' : 'star'} size={16} color={subject.progress >= 90 ? '#10B981' : '#6366F1'} />
                  <Text style={[styles.strengthScore, { color: subject.progress >= 90 ? '#10B981' : '#6366F1' }]}>{subject.progress}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Gamified Empty state */}
        {stats.totalTests === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="rocket-outline" size={64} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Ready to Start Learning?</Text>
            <Text style={styles.emptySubtitle}>Take your first AI-powered test and watch your progress grow!</Text>
            <TouchableOpacity style={styles.emptyCTA} onPress={navigateToTests}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.emptyCTAText}>Take Your First Test</Text>
            </TouchableOpacity>
          </View>
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
  // Badges
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  // AI Recommendation
  aiRecCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    ...Shadows.sm,
  },
  aiRecIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  aiRecContent: {
    flex: 1,
  },
  aiRecLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiRecMessage: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    marginTop: 2,
  },
  // Predictive insight
  predictCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  predictText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    fontWeight: '500',
    flex: 1,
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
  // New styles
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
    paddingHorizontal: Spacing.lg,
  },
  emptyCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  emptyCTAText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
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
  // Bar chart card
  barChartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
    alignItems: 'center',
  },
  // Strength card styles
  strengthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  strengthIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  strengthContent: {
    flex: 1,
  },
  strengthName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  strengthMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
  strengthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  strengthScore: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
});
