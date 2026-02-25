import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS } from '../../constants/Config';
import { FadeInDown, FadeInUp, ZoomIn } from '../../components/Animations';
import { generateAITest } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function TestsScreen() {
  const { user } = useAuth();
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [testConfig, setTestConfig] = useState({
    questions: 10,
    timeLimit: 15,
    difficulty: 'adaptive'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testHistory, setTestHistory] = useState([]);

  // Fetch real test history from Firebase
  const fetchTestHistory = useCallback(async () => {
    if (!user) return;

    try {
      const quizResultsRef = collection(db, 'quizResults');
      const q = query(quizResultsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });

      // Sort by date (newest first)
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Transform to display format
      const history = results.slice(0, 10).map(r => ({
        id: r.id,
        subject: r.subject,
        score: r.score,
        total: r.totalQuestions,
        date: formatDate(r.createdAt),
        icon: getSubjectIcon(r.subjectId || r.subject?.toLowerCase()),
        color: getSubjectColor(r.subjectId, r.subject)
      }));

      setTestHistory(history);
    } catch (error) {
      console.log('Error fetching test history:', error.message);
    }
  }, [user]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Get subject icon
  const getSubjectIcon = (subjectId) => {
    const sub = SUBJECTS.find(s => s.id === subjectId || s.name.toLowerCase() === subjectId);
    return sub?.icon || 'school';
  };

  // Get subject color
  const getSubjectColor = (subjectId, subjectName) => {
    const found = SUBJECTS.find(s => s.id === subjectId)
      || SUBJECTS.find(s => s.name.toLowerCase() === (subjectName || subjectId)?.toLowerCase());
    return found?.color || '#6366F1';
  };

  useEffect(() => {
    fetchTestHistory();
  }, [fetchTestHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTestHistory().finally(() => setRefreshing(false));
  }, [fetchTestHistory]);

  // Available subjects for mock tests
  const availableTests = SUBJECTS.slice(0, 8);

  const startTest = async () => {
    if (!selectedSubject) return;

    setIsGenerating(true);

    try {
      // Fetch user's average score for this subject (for adaptive difficulty)
      let userAvgScore = null;
      if (user && testConfig.difficulty === 'adaptive') {
        try {
          const quizResultsRef = collection(db, 'quizResults');
          const q = query(quizResultsRef, where('userId', '==', user.uid));
          const snapshot = await getDocs(q);
          const subjectResults = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.subject === selectedSubject.name || data.subjectId === selectedSubject.id) {
              subjectResults.push(data);
            }
          });
          if (subjectResults.length > 0) {
            userAvgScore = Math.round(
              subjectResults.reduce((sum, r) => sum + (r.score || 0), 0) / subjectResults.length
            );
          }
          console.log(`Adaptive difficulty: ${selectedSubject.name} avg score = ${userAvgScore ?? 'no history'}`);
        } catch (e) {
          console.log('Could not fetch progress for adaptive difficulty:', e.message);
        }
      }

      // Generate AI test
      const result = await generateAITest(selectedSubject.name, {
        numberOfQuestions: testConfig.questions,
        difficulty: testConfig.difficulty,
        timeLimit: testConfig.timeLimit,
        userAvgScore
      });

      setShowTestModal(false);
      setIsGenerating(false);

      if (result.success) {
        // Navigate to test-taking screen with generated questions
        router.push({
          pathname: '/take-test',
          params: {
            subject: selectedSubject.name,
            subjectId: selectedSubject.id,
            subjectColor: selectedSubject.color,
            questions: JSON.stringify(result.data.questions),
            timeLimit: testConfig.timeLimit,
            difficulty: result.data.difficulty,
            numberOfQuestions: testConfig.questions
          }
        });
      } else {
        console.error('Failed to generate test:', result.error);
      }
    } catch (error) {
      console.error('Error starting test:', error);
      setIsGenerating(false);
      setShowTestModal(false);
    }
  };

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
          <Text style={styles.title}>Mock Tests</Text>
          <Text style={styles.subtitle}>AI-generated personalized assessments</Text>
        </FadeInDown>

        {/* Quick Stats */}
        <FadeInDown delay={100} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{testHistory.length}</Text>
            <Text style={styles.statLabel}>Tests Taken</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {testHistory.length > 0
                ? `${Math.round(testHistory.reduce((sum, t) => sum + t.score, 0) / testHistory.length)}%`
                : '-'}
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>
              {testHistory.length >= 2
                ? `${testHistory[0].score > testHistory[1].score ? '↑' : '↓'} ${Math.abs(testHistory[0].score - testHistory[1].score)}%`
                : '-'}
            </Text>
            <Text style={styles.statLabel}>Trend</Text>
          </View>
        </FadeInDown>

        {/* Create New Test - Module 5 */}
        <FadeInDown delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Create Mock Test</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI Powered</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Select a subject to generate a personalized test
          </Text>

          <View style={styles.subjectGrid}>
            {availableTests.map((subject, index) => (
              <ZoomIn key={subject.id} delay={300 + index * 50}>
                <TouchableOpacity
                  style={[styles.subjectTestCard, { borderColor: subject.color + '50' }]}
                  onPress={() => {
                    setSelectedSubject(subject);
                    setShowTestModal(true);
                  }}
                >
                  <View style={[styles.subjectTestIcon, { backgroundColor: subject.color + '20' }]}>
                    <Ionicons
                      name={getSubjectIcon(subject.id)}
                      size={24}
                      color={subject.color}
                    />
                  </View>
                  <Text style={styles.subjectTestName}>{subject.name}</Text>
                </TouchableOpacity>
              </ZoomIn>
            ))}
          </View>
        </FadeInDown>

        {/* Test History */}
        <FadeInDown delay={400}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📊 Recent Tests</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {testHistory.length > 0 ? (
            testHistory.map((test, index) => (
              <FadeInUp key={test.id} delay={500 + index * 100}>
                <TouchableOpacity style={styles.testHistoryCard}>
                  <View style={[styles.testHistoryIcon, { backgroundColor: test.color + '20' }]}>
                    <Ionicons name={test.icon} size={24} color={test.color} />
                  </View>
                  <View style={styles.testHistoryContent}>
                    <Text style={styles.testHistorySubject}>{test.subject}</Text>
                    <Text style={styles.testHistoryDate}>{test.date}</Text>
                  </View>
                  <View style={styles.testHistoryScore}>
                    <Text style={[styles.scoreValue, getScoreColor(test.score)]}>
                      {test.score}%
                    </Text>
                    <Text style={styles.scoreLabel}>/{test.total} Q</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </FadeInUp>
            ))
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyHistoryText}>No tests taken yet</Text>
              <Text style={styles.emptyHistorySubtext}>Select a subject above to start!</Text>
            </View>
          )}
        </FadeInDown>

        {/* Performance Insights */}
        <FadeInDown delay={600} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={24} color={Colors.accent} />
            <Text style={styles.insightTitle}>AI Insight</Text>
          </View>
          <Text style={styles.insightText}>
            Based on your recent tests, we recommend focusing on <Text style={styles.insightHighlight}>Dynamic Programming</Text>
            {' '}and <Text style={styles.insightHighlight}>SQL Normalization</Text>. Your performance in these areas can improve by 15% with targeted practice.
          </Text>
          <TouchableOpacity style={styles.insightButton}>
            <Text style={styles.insightButtonText}>Start Focused Practice</Text>
          </TouchableOpacity>
        </FadeInDown>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Test Configuration Modal */}
      <Modal
        visible={showTestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Test</Text>
              <TouchableOpacity onPress={() => setShowTestModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedSubject && (
              <View style={[styles.selectedSubjectBadge, { backgroundColor: selectedSubject.color + '20' }]}>
                <Ionicons name={getSubjectIcon(selectedSubject.id)} size={20} color={selectedSubject.color} />
                <Text style={[styles.selectedSubjectText, { color: selectedSubject.color }]}>
                  {selectedSubject.name}
                </Text>
              </View>
            )}

            {/* Number of Questions */}
            <View style={styles.configSection}>
              <Text style={styles.configLabel}>Number of Questions</Text>
              <View style={styles.configOptions}>
                {[5, 10, 15, 20].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.configOption,
                      testConfig.questions === num && styles.configOptionActive
                    ]}
                    onPress={() => setTestConfig({ ...testConfig, questions: num })}
                  >
                    <Text style={[
                      styles.configOptionText,
                      testConfig.questions === num && styles.configOptionTextActive
                    ]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Limit */}
            <View style={styles.configSection}>
              <Text style={styles.configLabel}>Time Limit (minutes)</Text>
              <View style={styles.configOptions}>
                {[10, 15, 20, 30].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.configOption,
                      testConfig.timeLimit === time && styles.configOptionActive
                    ]}
                    onPress={() => setTestConfig({ ...testConfig, timeLimit: time })}
                  >
                    <Text style={[
                      styles.configOptionText,
                      testConfig.timeLimit === time && styles.configOptionTextActive
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty */}
            <View style={styles.configSection}>
              <Text style={styles.configLabel}>Difficulty</Text>
              <View style={styles.configOptions}>
                {['easy', 'medium', 'hard', 'adaptive'].map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.configOption,
                      styles.configOptionWide,
                      testConfig.difficulty === diff && styles.configOptionActive
                    ]}
                    onPress={() => setTestConfig({ ...testConfig, difficulty: diff })}
                  >
                    <Text style={[
                      styles.configOptionText,
                      testConfig.difficulty === diff && styles.configOptionTextActive
                    ]}>
                      {diff === 'adaptive' ? '🤖 AI' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.startTestButton, isGenerating && styles.startTestButtonDisabled]}
              onPress={startTest}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.startTestButtonText}>Generating...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.startTestButtonText}>Generate Test</Text>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getSubjectIcon = (subjectId) => {
  const sub = SUBJECTS.find(s => s.id === subjectId);
  return sub?.icon || 'school';
};

const getScoreColor = (score) => {
  if (score >= 90) return { color: Colors.secondary };
  if (score >= 75) return { color: Colors.primary };
  if (score >= 60) return { color: Colors.accent };
  return { color: Colors.error };
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  subjectTestCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm * 3) / 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.sm,
  },
  subjectTestIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  subjectTestName: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  testHistoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  testHistoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  testHistoryContent: {
    flex: 1,
  },
  testHistorySubject: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  testHistoryDate: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
  testHistoryScore: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  scoreValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
  },
  insightCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  insightTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.accent,
  },
  insightText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    lineHeight: 22,
  },
  insightHighlight: {
    fontWeight: '600',
    color: Colors.primary,
  },
  insightButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  insightButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  selectedSubjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  selectedSubjectText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  configSection: {
    marginBottom: Spacing.lg,
  },
  configLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  configOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  configOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  configOptionWide: {
    paddingHorizontal: Spacing.sm,
  },
  configOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  configOptionText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  configOptionTextActive: {
    color: '#fff',
  },
  startTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  startTestButtonDisabled: {
    opacity: 0.7,
  },
  startTestButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#fff',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  emptyHistoryText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptyHistorySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
