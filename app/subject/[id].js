import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS } from '../../constants/Config';
import { FadeInDown, FadeInUp } from '../../components/Animations';

const { width } = Dimensions.get('window');

// Subject-specific lessons data
const SUBJECT_LESSONS = {
  math: [
    { id: 1, title: 'Introduction to Algebra', duration: '15 min', difficulty: 'Beginner', progress: 100 },
    { id: 2, title: 'Linear Equations', duration: '20 min', difficulty: 'Easy', progress: 75 },
    { id: 3, title: 'Quadratic Equations', duration: '25 min', difficulty: 'Medium', progress: 30 },
    { id: 4, title: 'Polynomials', duration: '30 min', difficulty: 'Medium', progress: 0 },
    { id: 5, title: 'Calculus Basics', duration: '35 min', difficulty: 'Hard', progress: 0 },
  ],
  science: [
    { id: 1, title: 'Scientific Method', duration: '10 min', difficulty: 'Beginner', progress: 100 },
    { id: 2, title: 'Matter and Energy', duration: '20 min', difficulty: 'Easy', progress: 60 },
    { id: 3, title: 'Forces and Motion', duration: '25 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Ecosystems', duration: '20 min', difficulty: 'Easy', progress: 0 },
  ],
  english: [
    { id: 1, title: 'Parts of Speech', duration: '15 min', difficulty: 'Beginner', progress: 100 },
    { id: 2, title: 'Sentence Structure', duration: '20 min', difficulty: 'Easy', progress: 80 },
    { id: 3, title: 'Essay Writing', duration: '30 min', difficulty: 'Medium', progress: 45 },
    { id: 4, title: 'Literary Analysis', duration: '25 min', difficulty: 'Hard', progress: 0 },
  ],
  physics: [
    { id: 1, title: 'Kinematics', duration: '25 min', difficulty: 'Medium', progress: 100 },
    { id: 2, title: 'Newton\'s Laws', duration: '30 min', difficulty: 'Medium', progress: 50 },
    { id: 3, title: 'Work and Energy', duration: '25 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Electromagnetic Waves', duration: '35 min', difficulty: 'Hard', progress: 0 },
  ],
  chemistry: [
    { id: 1, title: 'Atomic Structure', duration: '20 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Periodic Table', duration: '15 min', difficulty: 'Beginner', progress: 85 },
    { id: 3, title: 'Chemical Bonds', duration: '25 min', difficulty: 'Medium', progress: 20 },
    { id: 4, title: 'Organic Chemistry', duration: '40 min', difficulty: 'Hard', progress: 0 },
  ],
};

// Available quizzes per subject
const SUBJECT_QUIZZES = {
  math: [
    { id: 1, title: 'Algebra Fundamentals', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'Equation Mastery', questions: 15, duration: '15 min', difficulty: 'Medium' },
  ],
  science: [
    { id: 1, title: 'Scientific Concepts', questions: 12, duration: '12 min', difficulty: 'Easy' },
    { id: 2, title: 'Energy & Matter', questions: 15, duration: '15 min', difficulty: 'Medium' },
  ],
  english: [
    { id: 1, title: 'Grammar Basics', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'Vocabulary Challenge', questions: 20, duration: '15 min', difficulty: 'Medium' },
  ],
  physics: [
    { id: 1, title: 'Mechanics Quiz', questions: 12, duration: '15 min', difficulty: 'Medium' },
    { id: 2, title: 'Physics Fundamentals', questions: 10, duration: '10 min', difficulty: 'Easy' },
  ],
  chemistry: [
    { id: 1, title: 'Elements Quiz', questions: 15, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'Reactions Test', questions: 12, duration: '15 min', difficulty: 'Medium' },
  ],
};

const getSubjectIcon = (subjectId) => {
  const icons = {
    math: 'calculator-outline',
    science: 'flask-outline',
    english: 'book-outline',
    history: 'time-outline',
    geography: 'globe-outline',
    physics: 'planet-outline',
    chemistry: 'beaker-outline',
    biology: 'leaf-outline',
    computer: 'laptop-outline',
    arts: 'color-palette-outline',
  };
  return icons[subjectId] || 'school-outline';
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Beginner': return Colors.secondary;
    case 'Easy': return '#10B981';
    case 'Medium': return Colors.accent;
    case 'Hard': return Colors.error;
    default: return Colors.textLight;
  }
};

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('lessons');
  
  const subject = SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
  const lessons = SUBJECT_LESSONS[id] || SUBJECT_LESSONS.math;
  const quizzes = SUBJECT_QUIZZES[id] || SUBJECT_QUIZZES.math;
  
  // Calculate overall progress
  const totalProgress = lessons.reduce((sum, l) => sum + l.progress, 0);
  const overallProgress = Math.round(totalProgress / lessons.length);
  const completedLessons = lessons.filter(l => l.progress === 100).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: subject.color }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <FadeInDown delay={0} style={styles.headerInfo}>
            <View style={styles.subjectIconLarge}>
              <Ionicons name={getSubjectIcon(id)} size={40} color={subject.color} />
            </View>
            <Text style={styles.subjectTitle}>{subject.name}</Text>
            <Text style={styles.subjectMeta}>
              {completedLessons}/{lessons.length} lessons completed
            </Text>
          </FadeInDown>
          
          <FadeInDown delay={100} style={styles.progressContainer}>
            <View style={styles.progressBarLarge}>
              <View style={[styles.progressFillLarge, { width: `${overallProgress}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{overallProgress}% Complete</Text>
          </FadeInDown>
        </View>
      </View>

      {/* Tabs */}
      <FadeInUp delay={200} style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
          onPress={() => setActiveTab('lessons')}
        >
          <Ionicons 
            name="book-outline" 
            size={18} 
            color={activeTab === 'lessons' ? Colors.primary : Colors.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>
            Lessons
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'quizzes' && styles.activeTab]}
          onPress={() => setActiveTab('quizzes')}
        >
          <Ionicons 
            name="create-outline" 
            size={18} 
            color={activeTab === 'quizzes' ? Colors.primary : Colors.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'quizzes' && styles.activeTabText]}>
            Quizzes
          </Text>
        </TouchableOpacity>
      </FadeInUp>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'lessons' ? (
          <>
            {lessons.map((lesson, index) => (
              <FadeInUp key={lesson.id} delay={300 + index * 50}>
                <TouchableOpacity style={styles.lessonCard}>
                  <View style={styles.lessonLeft}>
                    <View style={[styles.lessonNumber, { 
                      backgroundColor: lesson.progress === 100 ? Colors.secondary : Colors.background 
                    }]}>
                      {lesson.progress === 100 ? (
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      ) : (
                        <Text style={styles.lessonNumberText}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <View style={styles.lessonMeta}>
                        <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                        <Text style={styles.lessonMetaText}>{lesson.duration}</Text>
                        <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(lesson.difficulty)}15` }]}>
                          <Text style={[styles.difficultyText, { color: getDifficultyColor(lesson.difficulty) }]}>
                            {lesson.difficulty}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  {lesson.progress > 0 && lesson.progress < 100 ? (
                    <View style={styles.lessonProgress}>
                      <View style={styles.miniProgressBar}>
                        <View style={[styles.miniProgressFill, { width: `${lesson.progress}%`, backgroundColor: subject.color }]} />
                      </View>
                      <Text style={styles.lessonProgressText}>{lesson.progress}%</Text>
                    </View>
                  ) : lesson.progress === 0 ? (
                    <Ionicons name="play-circle" size={32} color={subject.color} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={32} color={Colors.secondary} />
                  )}
                </TouchableOpacity>
              </FadeInUp>
            ))}
          </>
        ) : (
          <>
            {quizzes.map((quiz, index) => (
              <FadeInUp key={quiz.id} delay={300 + index * 50}>
                <TouchableOpacity 
                  style={styles.quizCard}
                  onPress={() => router.push('/(tabs)/tests')}
                >
                  <View style={[styles.quizIcon, { backgroundColor: `${subject.color}15` }]}>
                    <Ionicons name="document-text-outline" size={24} color={subject.color} />
                  </View>
                  <View style={styles.quizInfo}>
                    <Text style={styles.quizTitle}>{quiz.title}</Text>
                    <View style={styles.quizMeta}>
                      <Text style={styles.quizMetaText}>{quiz.questions} questions</Text>
                      <Text style={styles.quizDot}>•</Text>
                      <Text style={styles.quizMetaText}>{quiz.duration}</Text>
                      <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(quiz.difficulty)}15` }]}>
                        <Text style={[styles.difficultyText, { color: getDifficultyColor(quiz.difficulty) }]}>
                          {quiz.difficulty}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </FadeInUp>
            ))}
          </>
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Continue Button */}
      <FadeInUp delay={500} style={styles.continueContainer}>
        <TouchableOpacity style={[styles.continueButton, { backgroundColor: subject.color }]}>
          <Text style={styles.continueButtonText}>
            {activeTab === 'lessons' ? 'Continue Learning' : 'Start Quiz'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </FadeInUp>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerInfo: {
    alignItems: 'center',
  },
  subjectIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  subjectTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  subjectMeta: {
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.8)',
  },
  progressContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  progressBarLarge: {
    width: width - 80,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: FontSizes.sm,
    color: '#fff',
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: -20,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  activeTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  tabText: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: Spacing.md,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  lessonNumberText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textLight,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  lessonMetaText: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginRight: Spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  lessonProgress: {
    alignItems: 'flex-end',
  },
  miniProgressBar: {
    width: 50,
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  lessonProgressText: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  quizIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizMetaText: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  quizDot: {
    marginHorizontal: Spacing.xs,
    color: Colors.textMuted,
  },
  continueContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.background,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  continueButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#fff',
  },
});
