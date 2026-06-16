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
import { FadeInDown, FadeInUp, ZoomIn } from '../../components/Animations';
import { SectionDivider } from '../../components/EditorialComponents';
import {
  getAllStudents,
  getAllQuizResults,
  getLearningGapAnalysis,
  generateInterventionSuggestions,
  getStudentQuizHistory,
} from '../../services/teacherService';

const { width } = Dimensions.get('window');

export default function LearningGapMonitorScreen() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gapData, setGapData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

        const gaps = getLearningGapAnalysis(students, results);
        setGapData(gaps);

        const interventions = generateInterventionSuggestions(gaps);
        setSuggestions(interventions);
      }
    } catch (error) {
      console.error('Error fetching gap data:', error);
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
    setShowDetailModal(true);
  };

  const toggleExpanded = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return { label: 'Critical', color: Colors.error, icon: 'alert-circle', bg: Colors.error + '15' };
      case 'warning':
        return { label: 'Warning', color: '#F59E0B', icon: 'warning', bg: '#F59E0B15' };
      case 'watch':
        return { label: 'Watch', color: Colors.info, icon: 'eye', bg: Colors.info + '15' };
      default:
        return { label: 'Info', color: Colors.textMuted, icon: 'information-circle', bg: Colors.textMuted + '15' };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high':
        return { color: Colors.error, bg: Colors.error + '10', borderColor: Colors.error + '30' };
      case 'medium':
        return { color: '#F59E0B', bg: '#F59E0B10', borderColor: '#F59E0B30' };
      case 'low':
        return { color: Colors.info, bg: Colors.info + '10', borderColor: Colors.info + '30' };
      default:
        return { color: Colors.secondary, bg: Colors.secondary + '10', borderColor: Colors.secondary + '30' };
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return Colors.secondary;
    if (score >= 75) return Colors.primary;
    if (score >= 60) return Colors.accent;
    return Colors.error;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyzing learning gaps...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background */}
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
          <View style={styles.roleBadge}>
            <Ionicons name="analytics" size={12} color={Colors.primary} />
            <Text style={styles.roleBadgeText}>Learning Analytics</Text>
          </View>
          <Text style={styles.headerTitle}>Learning Gap Monitor</Text>
          <Text style={styles.headerSubtitle}>
            Identify struggles and take action
          </Text>
        </FadeInDown>

        {/* Summary Stats */}
        <FadeInDown delay={100} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.statValue}>
              {gapData?.priorityStudents?.filter((s) => s.severity === 'critical').length || 0}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.statValue}>
              {gapData?.priorityStudents?.filter((s) => s.severity === 'warning').length || 0}
            </Text>
            <Text style={styles.statLabel}>Warning</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="eye" size={20} color={Colors.info} />
            <Text style={styles.statValue}>
              {gapData?.priorityStudents?.filter((s) => s.severity === 'watch').length || 0}
            </Text>
            <Text style={styles.statLabel}>Watch</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="layers" size={20} color={Colors.accent} />
            <Text style={styles.statValue}>{gapData?.commonGaps?.length || 0}</Text>
            <Text style={styles.statLabel}>Gaps</Text>
          </View>
        </FadeInDown>

        <SectionDivider label="Priority" />

        {/* Priority Students */}
        <FadeInDown delay={200}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flag" size={18} color={Colors.error} />
              <Text style={styles.sectionTitle}>Priority Students</Text>
            </View>
          </View>

          {gapData?.priorityStudents?.length > 0 ? (
            gapData.priorityStudents.map((student, index) => {
              const severity = getSeverityConfig(student.severity);
              const isExpanded = expandedStudent === student.id;

              return (
                <FadeInDown key={student.id} delay={250 + index * 60}>
                  <TouchableOpacity
                    style={[styles.priorityCard, { borderLeftColor: severity.color }]}
                    onPress={() => toggleExpanded(student.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.priorityHeader}>
                      <View style={styles.priorityLeft}>
                        <View style={styles.priorityRank}>
                          <Text style={styles.priorityRankText}>{index + 1}</Text>
                        </View>
                        <View style={styles.priorityInfo}>
                          <Text style={styles.priorityName}>
                            {student.displayName || 'Student'}
                          </Text>
                          <Text style={styles.priorityMeta}>
                            {student.gapCount} weak topic{student.gapCount !== 1 ? 's' : ''} · Avg: {student.overallAverage}%
                          </Text>
                        </View>
                      </View>
                      <View style={styles.priorityRight}>
                        <View style={[styles.severityBadge, { backgroundColor: severity.bg }]}>
                          <Ionicons name={severity.icon} size={12} color={severity.color} />
                          <Text style={[styles.severityText, { color: severity.color }]}>
                            {severity.label}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={Colors.textMuted}
                        />
                      </View>
                    </View>

                    {/* Expanded: Weak Topics */}
                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        <View style={styles.expandedDivider} />
                        <Text style={styles.expandedTitle}>Weak Topics</Text>
                        {student.weakTopics.slice(0, 5).map((topic, tIndex) => (
                          <View key={tIndex} style={styles.weakTopicRow}>
                            <Text style={styles.weakTopicName}>{topic.topic}</Text>
                            <View style={styles.weakTopicRight}>
                              <View style={styles.weakTopicBar}>
                                <View
                                  style={[
                                    styles.weakTopicBarFill,
                                    {
                                      width: `${topic.averageScore}%`,
                                      backgroundColor: getScoreColor(topic.averageScore),
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={[styles.weakTopicScore, { color: getScoreColor(topic.averageScore) }]}>
                                {topic.averageScore}%
                              </Text>
                            </View>
                          </View>
                        ))}
                        <TouchableOpacity
                          style={styles.viewDetailButton}
                          onPress={() => openStudentDetail(student)}
                        >
                          <Text style={styles.viewDetailText}>View Full History</Text>
                          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                </FadeInDown>
              );
            })
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="checkmark-circle" size={32} color={Colors.secondary} />
              <Text style={styles.emptySectionTitle}>All Clear!</Text>
              <Text style={styles.emptySectionText}>
                No students are currently below the threshold.
              </Text>
            </View>
          )}
        </FadeInDown>

        <SectionDivider label="Class Gaps" />

        {/* Common Class-Wide Gaps */}
        <FadeInDown delay={400}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="layers" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Common Weak Topics</Text>
            </View>
          </View>

          {gapData?.commonGaps?.length > 0 ? (
            gapData.commonGaps.slice(0, 8).map((gap, index) => (
              <ZoomIn key={index} delay={450 + index * 60}>
                <View style={styles.gapCard}>
                  <View style={styles.gapLeft}>
                    <View style={[styles.gapIndicator, { backgroundColor: getScoreColor(gap.averageScore) }]} />
                    <View style={styles.gapInfo}>
                      <Text style={styles.gapTopic}>{gap.topic}</Text>
                      <Text style={styles.gapMeta}>
                        {gap.totalAttempts} attempts · {gap.studentsAttempted} students
                      </Text>
                    </View>
                  </View>
                  <View style={styles.gapRight}>
                    <Text style={[styles.gapScore, { color: getScoreColor(gap.averageScore) }]}>
                      {gap.averageScore}%
                    </Text>
                    <Text style={styles.gapFailRate}>avg score</Text>
                  </View>
                </View>
              </ZoomIn>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="thumbs-up" size={32} color={Colors.secondary} />
              <Text style={styles.emptySectionTitle}>No Common Gaps!</Text>
              <Text style={styles.emptySectionText}>
                Students are performing well across all topics.
              </Text>
            </View>
          )}
        </FadeInDown>

        <SectionDivider label="AI Suggestions" />

        {/* AI Intervention Suggestions */}
        <FadeInDown delay={500}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Intervention Suggestions</Text>
            </View>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={10} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>

          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => {
              const priorityConfig = getPriorityConfig(suggestion.priority);
              return (
                <FadeInUp key={index} delay={550 + index * 80}>
                  <View
                    style={[
                      styles.suggestionCard,
                      {
                        backgroundColor: priorityConfig.bg,
                        borderColor: priorityConfig.borderColor,
                      },
                    ]}
                  >
                    <View style={styles.suggestionHeader}>
                      <View style={[styles.suggestionIconBox, { backgroundColor: suggestion.color + '20' }]}>
                        <Ionicons name={suggestion.icon} size={20} color={suggestion.color} />
                      </View>
                      <View style={styles.suggestionTitleArea}>
                        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                        <View style={[styles.priorityTag, { backgroundColor: priorityConfig.color + '20' }]}>
                          <Text style={[styles.priorityTagText, { color: priorityConfig.color }]}>
                            {suggestion.priority.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                    <TouchableOpacity style={[styles.suggestionAction, { backgroundColor: suggestion.color + '15' }]}>
                      <Text style={[styles.suggestionActionText, { color: suggestion.color }]}>
                        {suggestion.actionLabel}
                      </Text>
                      <Ionicons name="arrow-forward" size={14} color={suggestion.color} />
                    </TouchableOpacity>
                  </View>
                </FadeInUp>
              );
            })
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="sparkles-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptySectionText}>No suggestions yet</Text>
            </View>
          )}
        </FadeInDown>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Student Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.studentModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedStudent?.displayName || 'Student'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Avg: {selectedStudent?.overallAverage ?? '-'}% · {selectedStudent?.gapCount || 0} weak topics
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Weak Topics */}
            {selectedStudent?.weakTopics?.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Weak Topics</Text>
                {selectedStudent.weakTopics.map((topic, index) => (
                  <View key={index} style={styles.modalTopicRow}>
                    <Text style={styles.modalTopicName}>{topic.topic}</Text>
                    <View style={styles.modalTopicRight}>
                      <View style={styles.modalTopicBar}>
                        <View
                          style={[
                            styles.modalTopicBarFill,
                            {
                              width: `${topic.averageScore}%`,
                              backgroundColor: getScoreColor(topic.averageScore),
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.modalTopicScore, { color: getScoreColor(topic.averageScore) }]}>
                        {topic.averageScore}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Quiz History */}
            <Text style={styles.modalSectionTitle}>Recent Tests</Text>
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
                  <Text style={styles.emptySectionText}>No test history</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
    backgroundColor: 'rgba(196, 154, 60, 0.06)',
    top: -60,
    left: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(74, 140, 126, 0.05)',
    top: 80,
    right: -40,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
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
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 2,
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  aiBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.primary,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Priority Students
  priorityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  priorityRankText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
    color: Colors.primary,
  },
  priorityInfo: {
    flex: 1,
  },
  priorityName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
  },
  priorityMeta: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  priorityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  severityText: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Expanded Content
  expandedContent: {
    marginTop: Spacing.sm,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginBottom: Spacing.sm,
  },
  expandedTitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  weakTopicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  weakTopicName: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  weakTopicRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  weakTopicBar: {
    width: 60,
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  weakTopicBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  weakTopicScore: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.sm,
  },
  viewDetailText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  // Common Gaps
  gapCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  gapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gapIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  gapInfo: {
    flex: 1,
  },
  gapTopic: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
  },
  gapMeta: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  gapRight: {
    alignItems: 'flex-end',
  },
  gapScore: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
  },
  gapFailRate: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Intervention Suggestions
  suggestionCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  suggestionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTitleArea: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  priorityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  priorityTagText: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    letterSpacing: 1,
  },
  suggestionDescription: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  suggestionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  suggestionActionText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // Empty
  emptySection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.md,
  },
  emptySectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptySectionText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  // Modal
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
  modalSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  modalSectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.heading,
    fontWeight: '300',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  modalTopicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTopicName: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  modalTopicRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalTopicBar: {
    width: 80,
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  modalTopicBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  modalTopicScore: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
  historyList: {
    paddingHorizontal: Spacing.lg,
    maxHeight: 250,
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
