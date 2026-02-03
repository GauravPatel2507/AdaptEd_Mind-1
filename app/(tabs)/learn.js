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
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS } from '../../constants/Config';
import { FadeInDown, FadeInRight } from '../../components/Animations';

const { width } = Dimensions.get('window');

export default function LearnScreen() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [currentDifficulty, setCurrentDifficulty] = useState('medium');
  
  // Study path steps (Module 6)
  const studyPath = [
    { id: 1, title: 'Fundamentals', description: 'Basic concepts and introduction', completed: true },
    { id: 2, title: 'Core Concepts', description: 'Deep dive into main topics', completed: true },
    { id: 3, title: 'Practice', description: 'Solve problems and exercises', active: true, completed: false },
    { id: 4, title: 'Advanced Topics', description: 'Complex theories and applications', completed: false },
    { id: 5, title: 'Mastery', description: 'Final assessment and review', completed: false },
  ];

  // Current lesson based on difficulty (Module 3)
  const currentLesson = {
    title: 'Quadratic Equations',
    subject: 'Mathematics',
    difficulty: currentDifficulty,
    duration: '25 min',
    progress: 45,
  };

  const difficultyLevels = ['easy', 'medium', 'hard'];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <FadeInDown delay={0} style={styles.header}>
          <Text style={styles.title}>Learn</Text>
          <Text style={styles.subtitle}>Your personalized learning journey</Text>
        </FadeInDown>

        {/* Current Lesson with Difficulty Adjuster - Module 3 */}
        <FadeInDown delay={100}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Current Lesson</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI Adjusted</Text>
            </View>
          </View>
          
          <View style={styles.lessonCard}>
            <View style={styles.lessonHeader}>
              <View style={styles.lessonIconContainer}>
                <Ionicons name="calculator" size={24} color={Colors.primary} />
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
                <Text style={styles.lessonSubject}>{currentLesson.subject}</Text>
              </View>
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                <Text style={styles.durationText}>{currentLesson.duration}</Text>
              </View>
            </View>
            
            {/* Difficulty Selector */}
            <View style={styles.difficultySection}>
              <Text style={styles.difficultyLabel}>Difficulty Level:</Text>
              <View style={styles.difficultyButtons}>
                {difficultyLevels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      currentDifficulty === level && styles.difficultyButtonActive
                    ]}
                    onPress={() => setCurrentDifficulty(level)}
                  >
                    <Text style={[
                      styles.difficultyButtonText,
                      currentDifficulty === level && styles.difficultyButtonTextActive
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Progress */}
            <View style={styles.lessonProgress}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{currentLesson.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${currentLesson.progress}%` }]} />
              </View>
            </View>

            <TouchableOpacity style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continue Learning</Text>
              <Ionicons name="play" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </FadeInDown>

        {/* Study Path - Module 6 */}
        <FadeInDown delay={200}>
          <Text style={styles.sectionTitle}>🎯 Study Path Guide</Text>
          <View style={styles.pathContainer}>
            {studyPath.map((step, index) => (
              <FadeInDown key={step.id} delay={300 + index * 100}>
                <View style={styles.pathStep}>
                  <View style={styles.pathLine}>
                    <View style={[
                      styles.pathDot,
                      step.completed && styles.pathDotCompleted,
                      step.active && styles.pathDotActive
                    ]}>
                      {step.completed ? (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      ) : (
                        <Text style={styles.pathDotText}>{step.id}</Text>
                      )}
                    </View>
                    {index < studyPath.length - 1 && (
                      <View style={[
                        styles.pathConnector,
                        step.completed && styles.pathConnectorCompleted
                      ]} />
                    )}
                  </View>
                  <View style={[
                    styles.pathContent,
                    step.active && styles.pathContentActive
                  ]}>
                    <Text style={[
                      styles.pathTitle,
                      step.completed && styles.pathTitleCompleted
                    ]}>
                      {step.title}
                    </Text>
                    <Text style={styles.pathDescription}>{step.description}</Text>
                    {step.active && (
                      <TouchableOpacity style={styles.pathButton}>
                        <Text style={styles.pathButtonText}>Start Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </FadeInDown>
            ))}
          </View>
        </FadeInDown>

        {/* Subject Selection */}
        <FadeInDown delay={400}>
          <Text style={styles.sectionTitle}>📖 Browse Subjects</Text>
          <View style={styles.subjectsGrid}>
            {SUBJECTS.slice(0, 8).map((subject, index) => (
              <FadeInRight key={subject.id} delay={500 + index * 50}>
                <TouchableOpacity 
                  style={[
                    styles.subjectCard,
                    selectedSubject === subject.id && styles.subjectCardSelected
                  ]}
                  onPress={() => setSelectedSubject(subject.id)}
                >
                  <View style={[styles.subjectIcon, { backgroundColor: `${subject.color}20` }]}>
                    <Ionicons name={getSubjectIcon(subject.id)} size={24} color={subject.color} />
                  </View>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                </TouchableOpacity>
              </FadeInRight>
            ))}
          </View>
        </FadeInDown>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
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
  lessonCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  lessonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  lessonSubject: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  durationText: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
  },
  difficultySection: {
    marginBottom: Spacing.md,
  },
  difficultyLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  difficultyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  difficultyButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
  lessonProgress: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  progressValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  continueButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
  },
  pathContainer: {
    marginBottom: Spacing.lg,
  },
  pathStep: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  pathLine: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  pathDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathDotCompleted: {
    backgroundColor: Colors.secondary,
  },
  pathDotActive: {
    backgroundColor: Colors.primary,
  },
  pathDotText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textLight,
  },
  pathConnector: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 4,
  },
  pathConnectorCompleted: {
    backgroundColor: Colors.secondary,
  },
  pathContent: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  pathContentActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: -Spacing.xs,
  },
  pathTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  pathTitleCompleted: {
    color: Colors.secondary,
  },
  pathDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  pathButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  pathButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#fff',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  subjectCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm * 3) / 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadows.sm,
  },
  subjectCardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  subjectName: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
});
