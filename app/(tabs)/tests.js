import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS } from '../../constants/Config';
import { FadeInDown, FadeInUp, ZoomIn } from '../../components/Animations';

const { width, height } = Dimensions.get('window');

export default function TestsScreen() {
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [testConfig, setTestConfig] = useState({
    questions: 10,
    timeLimit: 15,
    difficulty: 'adaptive'
  });
  
  // Mock test history
  const testHistory = [
    { id: 1, subject: 'Mathematics', score: 85, total: 10, date: 'Today', icon: 'calculator', color: '#6366F1' },
    { id: 2, subject: 'Science', score: 92, total: 15, date: 'Yesterday', icon: 'flask', color: '#10B981' },
    { id: 3, subject: 'Physics', score: 78, total: 10, date: '2 days ago', icon: 'nuclear', color: '#3B82F6' },
  ];
  
  // Available subjects for mock tests
  const availableTests = SUBJECTS.slice(0, 8);

  const startTest = () => {
    setShowTestModal(false);
    // Navigate to test screen (would be implemented)
    console.log('Starting test:', { subject: selectedSubject, ...testConfig });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <FadeInDown delay={0} style={styles.header}>
          <Text style={styles.title}>Mock Tests</Text>
          <Text style={styles.subtitle}>AI-generated personalized assessments</Text>
        </FadeInDown>

        {/* Quick Stats */}
        <FadeInDown delay={100} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Tests Taken</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>↑ 12%</Text>
            <Text style={styles.statLabel}>Improvement</Text>
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
          
          {testHistory.map((test, index) => (
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
                  <Text style={styles.scoreLabel}>{test.score}/{test.total}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </FadeInUp>
          ))}
        </FadeInDown>

        {/* Performance Insights */}
        <FadeInDown delay={600} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={24} color={Colors.accent} />
            <Text style={styles.insightTitle}>AI Insight</Text>
          </View>
          <Text style={styles.insightText}>
            Based on your recent tests, we recommend focusing on <Text style={styles.insightHighlight}>Quadratic Equations</Text> 
            {' '}and <Text style={styles.insightHighlight}>Chemical Balancing</Text>. Your performance in these areas can improve by 15% with targeted practice.
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
            
            <TouchableOpacity style={styles.startTestButton} onPress={startTest}>
              <Text style={styles.startTestButtonText}>Generate Test</Text>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getSubjectIcon = (subjectId) => {
  const icons = {
    math: 'calculator',
    science: 'flask',
    english: 'book',
    history: 'time',
    geography: 'globe',
    physics: 'nuclear',
    chemistry: 'beaker',
    biology: 'leaf',
    computer: 'laptop',
    arts: 'color-palette',
  };
  return icons[subjectId] || 'school';
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
  startTestButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#fff',
  },
});
