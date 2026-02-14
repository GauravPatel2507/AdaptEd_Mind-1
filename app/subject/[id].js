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
  c_programming: [
    { id: 1, title: 'Introduction to C Programming', duration: '20 min', difficulty: 'Beginner', progress: 100 },
    { id: 2, title: 'Data Types, Variables & Operators', duration: '25 min', difficulty: 'Easy', progress: 75 },
    { id: 3, title: 'Control Flow & Loops', duration: '25 min', difficulty: 'Easy', progress: 30 },
    { id: 4, title: 'Functions & Recursion', duration: '30 min', difficulty: 'Medium', progress: 0 },
    { id: 5, title: 'Pointers & Dynamic Memory', duration: '35 min', difficulty: 'Hard', progress: 0 },
  ],
  data_structures: [
    { id: 1, title: 'Arrays & Linked Lists', duration: '25 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Stacks & Queues', duration: '25 min', difficulty: 'Easy', progress: 60 },
    { id: 3, title: 'Trees & Binary Search Trees', duration: '30 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Graphs & Traversals', duration: '35 min', difficulty: 'Hard', progress: 0 },
  ],
  oop: [
    { id: 1, title: 'Classes, Objects & Encapsulation', duration: '25 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Inheritance & Polymorphism', duration: '30 min', difficulty: 'Medium', progress: 50 },
    { id: 3, title: 'Interfaces & Abstraction', duration: '25 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Design Patterns (Singleton, Factory)', duration: '35 min', difficulty: 'Hard', progress: 0 },
  ],
  dbms: [
    { id: 1, title: 'ER Model & Relational Schema', duration: '25 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'SQL Queries & Joins', duration: '30 min', difficulty: 'Medium', progress: 60 },
    { id: 3, title: 'Normalization (1NF to BCNF)', duration: '25 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Transactions & Concurrency', duration: '30 min', difficulty: 'Hard', progress: 0 },
  ],
  os: [
    { id: 1, title: 'Process Management & Scheduling', duration: '30 min', difficulty: 'Medium', progress: 100 },
    { id: 2, title: 'Memory Management & Paging', duration: '30 min', difficulty: 'Medium', progress: 50 },
    { id: 3, title: 'Deadlocks & Synchronization', duration: '25 min', difficulty: 'Hard', progress: 0 },
    { id: 4, title: 'File Systems & I/O', duration: '25 min', difficulty: 'Medium', progress: 0 },
  ],
  networks: [
    { id: 1, title: 'OSI & TCP/IP Model', duration: '25 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'IP Addressing & Subnetting', duration: '30 min', difficulty: 'Medium', progress: 40 },
    { id: 3, title: 'Routing & Transport Layer', duration: '30 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Application Layer Protocols', duration: '25 min', difficulty: 'Easy', progress: 0 },
  ],
  software_eng: [
    { id: 1, title: 'SDLC Models (Agile, Waterfall)', duration: '25 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Requirements & UML Diagrams', duration: '30 min', difficulty: 'Medium', progress: 55 },
    { id: 3, title: 'Testing Strategies & QA', duration: '25 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'DevOps & CI/CD Pipelines', duration: '30 min', difficulty: 'Hard', progress: 0 },
  ],
  web_tech: [
    { id: 1, title: 'HTML, CSS & Responsive Design', duration: '25 min', difficulty: 'Beginner', progress: 100 },
    { id: 2, title: 'JavaScript ES6+ Essentials', duration: '30 min', difficulty: 'Easy', progress: 70 },
    { id: 3, title: 'React & Frontend Frameworks', duration: '35 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Node.js & REST APIs', duration: '30 min', difficulty: 'Medium', progress: 0 },
    { id: 5, title: 'Full-Stack MERN Project', duration: '40 min', difficulty: 'Hard', progress: 0 },
  ],
  comp_org: [
    { id: 1, title: 'Number Systems & Logic Gates', duration: '25 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Combinational & Sequential Circuits', duration: '30 min', difficulty: 'Medium', progress: 45 },
    { id: 3, title: 'CPU Architecture & Pipelining', duration: '30 min', difficulty: 'Hard', progress: 0 },
    { id: 4, title: 'Memory Hierarchy & Cache', duration: '25 min', difficulty: 'Medium', progress: 0 },
  ],
  discrete_math: [
    { id: 1, title: 'Propositional & Predicate Logic', duration: '20 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Set Theory & Relations', duration: '25 min', difficulty: 'Medium', progress: 65 },
    { id: 3, title: 'Graph Theory Fundamentals', duration: '30 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Combinatorics & Recurrences', duration: '30 min', difficulty: 'Hard', progress: 0 },
  ],
  algorithms: [
    { id: 1, title: 'Asymptotic Analysis (Big-O)', duration: '20 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Divide & Conquer', duration: '30 min', difficulty: 'Medium', progress: 50 },
    { id: 3, title: 'Greedy Algorithms', duration: '25 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Dynamic Programming', duration: '35 min', difficulty: 'Hard', progress: 0 },
    { id: 5, title: 'Backtracking & Branch-and-Bound', duration: '30 min', difficulty: 'Hard', progress: 0 },
  ],
  ai: [
    { id: 1, title: 'Intro to AI & Intelligent Agents', duration: '20 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Search Algorithms (BFS, DFS, A*)', duration: '30 min', difficulty: 'Medium', progress: 45 },
    { id: 3, title: 'Knowledge Representation & Logic', duration: '25 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'NLP & AI Ethics', duration: '30 min', difficulty: 'Hard', progress: 0 },
  ],
  ml: [
    { id: 1, title: 'Supervised & Unsupervised Learning', duration: '30 min', difficulty: 'Medium', progress: 100 },
    { id: 2, title: 'Neural Networks & Backpropagation', duration: '35 min', difficulty: 'Hard', progress: 40 },
    { id: 3, title: 'Deep Learning (CNN, RNN)', duration: '35 min', difficulty: 'Hard', progress: 0 },
    { id: 4, title: 'Model Evaluation & Tuning', duration: '25 min', difficulty: 'Medium', progress: 0 },
  ],
  cloud: [
    { id: 1, title: 'Cloud Fundamentals (IaaS, PaaS, SaaS)', duration: '20 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'AWS Core Services', duration: '30 min', difficulty: 'Medium', progress: 55 },
    { id: 3, title: 'Docker & Kubernetes', duration: '30 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Serverless Architecture', duration: '25 min', difficulty: 'Hard', progress: 0 },
  ],
  cyber: [
    { id: 1, title: 'Security Fundamentals & CIA Triad', duration: '20 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Cryptography & PKI', duration: '30 min', difficulty: 'Medium', progress: 50 },
    { id: 3, title: 'Ethical Hacking & Pen Testing', duration: '30 min', difficulty: 'Hard', progress: 0 },
    { id: 4, title: 'Incident Response & Forensics', duration: '25 min', difficulty: 'Hard', progress: 0 },
  ],
  mobile_dev: [
    { id: 1, title: 'Mobile App Fundamentals', duration: '20 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'React Native Essentials', duration: '35 min', difficulty: 'Medium', progress: 60 },
    { id: 3, title: 'Flutter & Dart', duration: '35 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Publishing to App Stores', duration: '20 min', difficulty: 'Easy', progress: 0 },
  ],
  big_data: [
    { id: 1, title: 'Big Data Concepts & 5 Vs', duration: '20 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Hadoop & MapReduce', duration: '30 min', difficulty: 'Medium', progress: 45 },
    { id: 3, title: 'Apache Spark & Data Pipelines', duration: '30 min', difficulty: 'Hard', progress: 0 },
    { id: 4, title: 'Data Warehousing & OLAP', duration: '25 min', difficulty: 'Medium', progress: 0 },
  ],
  data_science: [
    { id: 1, title: 'Data Science Workflow & EDA', duration: '20 min', difficulty: 'Easy', progress: 100 },
    { id: 2, title: 'Python for Data Science (NumPy, Pandas)', duration: '30 min', difficulty: 'Medium', progress: 55 },
    { id: 3, title: 'Statistical Analysis & Visualization', duration: '25 min', difficulty: 'Medium', progress: 0 },
    { id: 4, title: 'Predictive Modeling & Pipelines', duration: '30 min', difficulty: 'Hard', progress: 0 },
  ],
};

// Available quizzes per subject
const SUBJECT_QUIZZES = {
  c_programming: [
    { id: 1, title: 'C Basics & Data Types', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'Pointers & Memory Management', questions: 15, duration: '15 min', difficulty: 'Hard' },
  ],
  data_structures: [
    { id: 1, title: 'Linear Data Structures', questions: 12, duration: '12 min', difficulty: 'Easy' },
    { id: 2, title: 'Trees & Graphs', questions: 15, duration: '15 min', difficulty: 'Medium' },
  ],
  oop: [
    { id: 1, title: 'OOP Fundamentals', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'Design Patterns & SOLID', questions: 12, duration: '15 min', difficulty: 'Hard' },
  ],
  dbms: [
    { id: 1, title: 'SQL & Relational Algebra', questions: 12, duration: '12 min', difficulty: 'Medium' },
    { id: 2, title: 'Normalization & Transactions', questions: 15, duration: '15 min', difficulty: 'Hard' },
  ],
  os: [
    { id: 1, title: 'Process & Memory Management', questions: 12, duration: '15 min', difficulty: 'Medium' },
    { id: 2, title: 'Deadlocks & Scheduling', questions: 10, duration: '10 min', difficulty: 'Hard' },
  ],
  networks: [
    { id: 1, title: 'OSI Model & Protocols', questions: 12, duration: '12 min', difficulty: 'Easy' },
    { id: 2, title: 'Subnetting & Routing', questions: 10, duration: '15 min', difficulty: 'Medium' },
  ],
  software_eng: [
    { id: 1, title: 'SDLC & Agile Methods', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'Testing & DevOps', questions: 12, duration: '12 min', difficulty: 'Medium' },
  ],
  web_tech: [
    { id: 1, title: 'HTML, CSS & JS Basics', questions: 12, duration: '12 min', difficulty: 'Easy' },
    { id: 2, title: 'React & Node.js', questions: 15, duration: '15 min', difficulty: 'Medium' },
  ],
  comp_org: [
    { id: 1, title: 'Logic Gates & Number Systems', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'CPU & Memory Architecture', questions: 12, duration: '15 min', difficulty: 'Hard' },
  ],
  discrete_math: [
    { id: 1, title: 'Logic & Set Theory', questions: 12, duration: '12 min', difficulty: 'Easy' },
    { id: 2, title: 'Graph Theory & Combinatorics', questions: 15, duration: '15 min', difficulty: 'Hard' },
  ],
  algorithms: [
    { id: 1, title: 'Sorting & Searching', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'DP & Greedy Algorithms', questions: 15, duration: '20 min', difficulty: 'Hard' },
  ],
  ai: [
    { id: 1, title: 'AI Fundamentals & Search', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'NLP & Knowledge Representation', questions: 12, duration: '15 min', difficulty: 'Medium' },
  ],
  ml: [
    { id: 1, title: 'ML Algorithms Overview', questions: 12, duration: '12 min', difficulty: 'Medium' },
    { id: 2, title: 'Neural Networks & Deep Learning', questions: 15, duration: '15 min', difficulty: 'Hard' },
  ],
  cloud: [
    { id: 1, title: 'Cloud Basics & Service Models', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'AWS & Containers', questions: 12, duration: '15 min', difficulty: 'Medium' },
  ],
  cyber: [
    { id: 1, title: 'Security Fundamentals', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'Cryptography & Ethical Hacking', questions: 15, duration: '15 min', difficulty: 'Hard' },
  ],
  mobile_dev: [
    { id: 1, title: 'Mobile Dev Fundamentals', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'React Native & Flutter', questions: 12, duration: '12 min', difficulty: 'Medium' },
  ],
  big_data: [
    { id: 1, title: 'Big Data Concepts', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'Hadoop & Spark', questions: 12, duration: '15 min', difficulty: 'Medium' },
  ],
  data_science: [
    { id: 1, title: 'Data Science Basics', questions: 10, duration: '10 min', difficulty: 'Easy' },
    { id: 2, title: 'Statistics & Predictive Modeling', questions: 15, duration: '15 min', difficulty: 'Hard' },
  ],
};

const getSubjectIcon = (subjectId) => {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  return subject?.icon ? `${subject.icon}-outline` : 'school-outline';
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
