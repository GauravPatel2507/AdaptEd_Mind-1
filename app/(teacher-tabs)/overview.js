import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Fonts, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { FadeInDown, FadeInRight, FadeInUp } from '../../components/Animations';
import { SectionDivider } from '../../components/EditorialComponents';
import {
  getAllStudents,
  getAllQuizResults,
  getClassPerformanceOverview,
  getWeeklyTrends,
  getStudentQuizHistory,
} from '../../services/teacherService';

const { width } = Dimensions.get('window');

export default function TeacherOverviewScreen() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [weeklyTrends, setWeeklyTrendsData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [allQuizResults, setAllQuizResults] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [studentsResult, quizResult] = await Promise.all([
        getAllStudents(),
        getAllQuizResults(),
      ]);

      if (studentsResult.success && quizResult.success) {
        const students = studentsResult.data;
        const results = quizResult.data;
        setAllQuizResults(results);

        const overviewData = getClassPerformanceOverview(students, results);
        setOverview(overviewData);

        const trends = getWeeklyTrends(results);
        setWeeklyTrendsData(trends);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  const openStudentDetail = (student) => {
    setSelectedStudent(student);
    const history = getStudentQuizHistory(allQuizResults, student.id);
    setStudentHistory(history);
    setShowStudentModal(true);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return Colors.secondary;
    if (score >= 75) return Colors.primary;
    if (score >= 60) return Colors.accent;
    return Colors.error;
  };

  const getSeverityBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', color: Colors.secondary, bg: Colors.secondary + '15' };
    if (score >= 75) return { label: 'Good', color: Colors.primary, bg: Colors.primary + '15' };
    if (score >= 60) return { label: 'Average', color: Colors.accent, bg: Colors.accent + '15' };
    return { label: 'At Risk', color: Colors.error, bg: Colors.error + '15' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading class data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background decorations */}
      <View style={styles.headerBackground}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <FadeInDown delay={0} style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.roleBadge}>
              <Ionicons name="school" size={12} color={Colors.primary} />
              <Text style={styles.roleBadgeText}>Teacher Dashboard</Text>
            </View>
            <Text style={styles.headerTitle}>Performance Overview</Text>
            <Text style={styles.headerSubtitle}>
              {userProfile?.displayName || 'Teacher'} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </FadeInDown>

        {/* Class Summary Stats */}
        <FadeInDown delay={100} style={styles.summaryCard}>
          <View style={styles.summaryGradient}>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{overview?.totalStudents || 0}</Text>
                <Text style={styles.summaryLabel}>Students</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {overview?.classAverage ? `${overview.classAverage}%` : '-'}
                </Text>
                <Text style={styles.summaryLabel}>Class Avg</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{overview?.totalTests || 0}</Text>
                <Text style={styles.summaryLabel}>Tests</Text>
              </View>
            </View>
          </View>
        </FadeInDown>

        <SectionDivider />

        {/* Top Performers */}
        <FadeInDown delay={200}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trophy" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Top Performers</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{overview?.topPerformers?.length || 0}</Text>
            </View>
          </View>

          {overview?.topPerformers?.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {overview.topPerformers.slice(0, 10).map((student, index) => (
                <FadeInRight key={student.id} delay={index * 80}>
                  <TouchableOpacity
                    style={styles.performerCard}
                    onPress={() => openStudentDetail(student)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.performerAvatar}>
                      <Text style={styles.performerInitial}>
                        {(student.displayName || 'S').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.performerName} numberOfLines={1}>
                      {student.displayName || 'Student'}
                    </Text>
                    <View style={[styles.scoreBadge, { backgroundColor: Colors.secondary + '20' }]}>
                      <Text style={[styles.scoreBadgeText, { color: Colors.secondary }]}>
                        {student.averageScore}%
                      </Text>
                    </View>
                    <Text style={styles.performerTests}>{student.totalTests} tests</Text>
                  </TouchableOpacity>
                </FadeInRight>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="trophy-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptySectionText}>No top performers yet</Text>
            </View>
          )}
        </FadeInDown>

        <SectionDivider label="Alerts" />

        {/* Students At Risk */}
        <FadeInDown delay={300}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="warning" size={18} color={Colors.error} />
              <Text style={styles.sectionTitle}>Students At Risk</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: Colors.error + '15' }]}>
              <Text style={[styles.countBadgeText, { color: Colors.error }]}>
                {overview?.atRiskStudents?.length || 0}
              </Text>
            </View>
          </View>

          {overview?.atRiskStudents?.length > 0 ? (
            overview.atRiskStudents.slice(0, 5).map((student, index) => (
              <FadeInDown key={student.id} delay={350 + index * 80}>
                <TouchableOpacity
                  style={styles.atRiskCard}
                  onPress={() => openStudentDetail(student)}
                  activeOpacity={0.8}
                >
                  <View style={styles.atRiskLeft}>
                    <View style={styles.atRiskAvatar}>
                      <Text style={styles.atRiskInitial}>
                        {(student.displayName || 'S').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.atRiskInfo}>
                      <Text style={styles.atRiskName}>{student.displayName || 'Student'}</Text>
                      <Text style={styles.atRiskMeta}>
                        {student.totalTests} tests · Last: {student.lastActive ? formatTimeAgo(student.lastActive) : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.atRiskRight}>
                    <Text style={[styles.atRiskScore, { color: Colors.error }]}>
                      {student.averageScore}%
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              </FadeInDown>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.secondary} />
              <Text style={styles.emptySectionText}>No students at risk!</Text>
            </View>
          )}
        </FadeInDown>

        <SectionDivider label="Subjects" />

        {/* Subject-wise Performance */}
        <FadeInDown delay={400}>
          <Text style={styles.sectionTitle}>Subject Breakdown</Text>
          {overview?.subjectBreakdown?.length > 0 ? (
            overview.subjectBreakdown.map((subject, index) => (
              <FadeInDown key={subject.id} delay={450 + index * 60}>
                <View style={styles.subjectCard}>
                  <View style={[styles.subjectIcon, { backgroundColor: subject.color + '20' }]}>
                    <Ionicons name={subject.icon} size={20} color={subject.color} />
                  </View>
                  <View style={styles.subjectContent}>
                    <View style={styles.subjectHeader}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={[styles.subjectScore, { color: getScoreColor(subject.averageScore) }]}>
                        {subject.averageScore}%
                      </Text>
                    </View>
                    <View style={styles.subjectProgressBar}>
                      <View
                        style={[
                          styles.subjectProgressFill,
                          { width: `${subject.averageScore}%`, backgroundColor: subject.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.subjectMeta}>
                      {subject.totalTests} tests · {subject.studentCount} students
                    </Text>
                  </View>
                </View>
              </FadeInDown>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="book-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptySectionText}>No subject data yet</Text>
            </View>
          )}
        </FadeInDown>

        <SectionDivider label="Trends" />

        {/* Weekly Trends Chart */}
        <FadeInDown delay={500}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          {weeklyTrends && weeklyTrends.days.some((d) => d.count > 0) ? (
            <View style={styles.chartCard}>
              <View style={styles.chartContainer}>
                {weeklyTrends.days.map((day, index) => {
                  const barHeight = day.average > 0
                    ? Math.max((day.average / weeklyTrends.maxAverage) * 120, 8)
                    : 4;
                  return (
                    <View key={index} style={styles.chartBarColumn}>
                      <Text style={styles.chartBarValue}>
                        {day.count > 0 ? `${day.average}%` : ''}
                      </Text>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: barHeight,
                            backgroundColor: day.count > 0 ? Colors.primary : Colors.cardBorder,
                          },
                        ]}
                      />
                      <Text style={styles.chartBarLabel}>{day.label}</Text>
                      <Text style={styles.chartBarDate}>{day.fullLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="bar-chart-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptySectionText}>No activity this week</Text>
            </View>
          )}
        </FadeInDown>

        <SectionDivider label="Students" />

        {/* All Students List */}
        <FadeInDown delay={600}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Students</Text>
            <Text style={styles.seeAllText}>{overview?.totalStudents || 0} total</Text>
          </View>

          {overview?.allStudents?.map((student, index) => {
            const badge = student.averageScore !== null
              ? getSeverityBadge(student.averageScore)
              : null;

            return (
              <FadeInDown key={student.id} delay={650 + index * 50}>
                <TouchableOpacity
                  style={styles.studentCard}
                  onPress={() => openStudentDetail(student)}
                  activeOpacity={0.8}
                >
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentInitial}>
                      {(student.displayName || 'S').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentContent}>
                    <Text style={styles.studentName}>{student.displayName || 'Student'}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                  </View>
                  <View style={styles.studentRight}>
                    {badge ? (
                      <>
                        <Text style={[styles.studentScore, { color: badge.color }]}>
                          {student.averageScore}%
                        </Text>
                        <View style={[styles.severityBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.severityText, { color: badge.color }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.noDataText}>No tests</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </FadeInDown>
            );
          })}
        </FadeInDown>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Student Detail Modal */}
      <Modal
        visible={showStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.studentModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedStudent?.displayName || 'Student'}
                </Text>
                <Text style={styles.modalSubtitle}>{selectedStudent?.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStudentModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Student Stats */}
            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatCard}>
                <Text style={[styles.modalStatValue, { color: getScoreColor(selectedStudent?.averageScore || 0) }]}>
                  {selectedStudent?.averageScore ?? '-'}%
                </Text>
                <Text style={styles.modalStatLabel}>Avg Score</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatValue}>{selectedStudent?.totalTests || 0}</Text>
                <Text style={styles.modalStatLabel}>Tests</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatValue}>
                  {selectedStudent?.lastActive ? formatTimeAgo(selectedStudent.lastActive) : 'N/A'}
                </Text>
                <Text style={styles.modalStatLabel}>Last Active</Text>
              </View>
            </View>

            {/* Quiz History */}
            <Text style={styles.modalSectionTitle}>Quiz History</Text>
            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {studentHistory.length > 0 ? (
                studentHistory.map((quiz) => (
                  <View key={quiz.id} style={styles.historyItem}>
                    <View style={[styles.historyIcon, { backgroundColor: quiz.subjectColor + '20' }]}>
                      <Ionicons name={quiz.subjectIcon} size={18} color={quiz.subjectColor} />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historySubject}>{quiz.subjectName || quiz.subject}</Text>
                      <Text style={styles.historyDate}>{quiz.formattedDate}</Text>
                    </View>
                    <Text style={[styles.historyScore, { color: getScoreColor(quiz.score) }]}>
                      {quiz.score}%
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>No quiz history</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const formatTimeAgo = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: Colors.background,
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(61, 112, 104, 0.06)',
    top: -60,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(74, 140, 126, 0.05)',
    top: 80,
    left: -40,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerLeft: {},
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.heading,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    color: Colors.textLight,
    marginTop: 4,
  },
  // Summary Card
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryGradient: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.heading,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  countBadge: {
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  countBadgeText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
    color: Colors.accent,
  },
  // Top Performers
  horizontalScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  performerCard: {
    width: 120,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  performerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  performerInitial: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.headingBold,
    fontWeight: '700',
    color: Colors.secondary,
  },
  performerName: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  scoreBadgeText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
  },
  performerTests: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  // At Risk Students
  atRiskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error + '20',
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  atRiskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  atRiskAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  atRiskInitial: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.headingBold,
    fontWeight: '700',
    color: Colors.error,
  },
  atRiskInfo: {
    flex: 1,
  },
  atRiskName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
  },
  atRiskMeta: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  atRiskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  atRiskScore: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
  },
  // Subject Breakdown
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  subjectContent: {
    flex: 1,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  subjectName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  subjectScore: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
  },
  subjectProgressBar: {
    height: 3,
    backgroundColor: Colors.cardBorder,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  subjectProgressFill: {
    height: '100%',
    borderRadius: 0,
  },
  subjectMeta: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  // Weekly Trends Chart
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  chartBarColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.primary,
    marginBottom: 4,
    fontWeight: '700',
  },
  chartBar: {
    width: 24,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  chartBarLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.text,
    fontWeight: '500',
  },
  chartBarDate: {
    fontSize: 7,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  // All Students
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  studentInitial: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.headingBold,
    fontWeight: '700',
    color: Colors.primary,
  },
  studentContent: {
    flex: 1,
  },
  studentName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
  },
  studentEmail: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  studentRight: {
    alignItems: 'flex-end',
    marginRight: Spacing.xs,
  },
  studentScore: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    marginTop: 2,
  },
  severityText: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noDataText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  // Empty sections
  emptySection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.md,
  },
  emptySectionText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  // Student Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  studentModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.heading,
    fontWeight: '300',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  modalStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalStatValue: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
    color: Colors.text,
  },
  modalStatLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  modalSectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.heading,
    fontWeight: '300',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  historyList: {
    paddingHorizontal: Spacing.lg,
    maxHeight: 300,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  historyContent: {
    flex: 1,
  },
  historySubject: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
  },
  historyDate: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  historyScore: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
  },
});
