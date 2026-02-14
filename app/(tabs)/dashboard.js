import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS } from '../../constants/Config';
import { FadeInDown, FadeInRight } from '../../components/Animations';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');

// Sample notifications data
const NOTIFICATIONS = [
  {
    id: 1,
    title: 'Quiz Completed!',
    message: 'You scored 92% in Data Structures Quiz',
    type: 'success',
    time: '2h ago',
    read: false,
    icon: 'trophy',
    route: '/(tabs)/progress'
  },
  {
    id: 2,
    title: 'New Lesson Available',
    message: 'Web Technologies: React & Frontend Frameworks is now available',
    type: 'info',
    time: '5h ago',
    read: false,
    icon: 'book',
    route: '/subject/web_tech'
  },
  {
    id: 3,
    title: 'Streak Reminder 🔥',
    message: 'Complete a lesson to keep your streak!',
    type: 'warning',
    time: '1d ago',
    read: true,
    icon: 'flame',
    route: '/(tabs)/learn'
  },
];

export default function DashboardScreen() {
  const { user, userProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  // Real-time stats from Firebase
  const [stats, setStats] = useState({
    totalSubjects: 0,
    averageScore: 0,
    streak: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState({});

  // Fetch real data from Firebase
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch quiz results
      const quizResultsRef = collection(db, 'quizResults');
      const q = query(quizResultsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });

      // Sort by date
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (results.length > 0) {
        // Calculate stats
        const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
        const avgScore = Math.round(totalScore / results.length);

        // Get unique subjects
        const uniqueSubjects = [...new Set(results.map(r => r.subject))];

        // Calculate streak
        const streak = calculateStreak(results);

        setStats({
          totalSubjects: uniqueSubjects.length,
          averageScore: avgScore,
          streak: streak
        });

        // Recent activity (last 5 tests)
        const recent = results.slice(0, 5).map(r => ({
          id: r.id,
          type: 'quiz',
          title: `${r.subject} Quiz`,
          score: r.score,
          time: formatTimeAgo(r.createdAt),
          route: '/(tabs)/progress'
        }));
        setRecentActivity(recent);

        // Subject-wise progress for cards
        const subjectScores = {};
        results.forEach(r => {
          if (!subjectScores[r.subject]) {
            subjectScores[r.subject] = { total: 0, count: 0 };
          }
          subjectScores[r.subject].total += r.score || 0;
          subjectScores[r.subject].count += 1;
        });

        const progress = {};
        Object.entries(subjectScores).forEach(([subject, data]) => {
          progress[subject.toLowerCase()] = Math.round(data.total / data.count);
        });
        setSubjectProgress(progress);
      }
    } catch (error) {
      console.log('Error fetching dashboard data:', error.message);
    }
  }, [user]);

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

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  }, [fetchDashboardData]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleNotificationPress = (notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);
    if (notification.route) {
      router.push(notification.route);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return Colors.secondary;
      case 'warning': return Colors.accent;
      case 'error': return Colors.error;
      default: return Colors.primary;
    }
  };

  const quickActions = [
    { id: 'quiz', title: 'Take Quiz', icon: 'create-outline', color: Colors.primary, route: '/(tabs)/tests' },
    { id: 'lessons', title: 'Continue', icon: 'play-circle-outline', color: Colors.secondary, route: '/(tabs)/learn' },
    { id: 'progress', title: 'My Progress', icon: 'trending-up-outline', color: Colors.accent, route: '/(tabs)/progress' },
    { id: 'study', title: 'Study Path', icon: 'map-outline', color: '#8B5CF6', route: '/(tabs)/learn' },
  ];

  // Get subject progress percentage
  const getSubjectProgress = (subjectId) => {
    const subjectName = SUBJECTS.find(s => s.id === subjectId)?.name?.toLowerCase();
    return subjectProgress[subjectName] || subjectProgress[subjectId] || 0;
  };

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
        {/* Header Section */}
        <FadeInDown delay={0} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.userName}>{userProfile?.displayName || 'Student'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </FadeInDown>

        {/* Stats Summary Card */}
        <FadeInDown delay={100} style={styles.statsCard}>
          <View style={styles.statsGradient}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalSubjects || '-'}</Text>
                <Text style={styles.statLabel}>Subjects</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.averageScore ? `${stats.averageScore}%` : '-'}</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.streak || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => router.push('/(tabs)/progress')}
            >
              <Text style={styles.statsButtonText}>View Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </FadeInDown>

        {/* Quick Actions */}
        <FadeInDown delay={200}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => router.push(action.route)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeInDown>

        {/* Continue Learning */}
        <FadeInDown delay={300}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/learn')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
            {SUBJECTS.slice(0, 5).map((subject, index) => (
              <FadeInRight key={subject.id} delay={index * 100}>
                <TouchableOpacity
                  style={styles.subjectCard}
                  onPress={() => router.push(`/subject/${subject.id}`)}
                >
                  <View style={[styles.subjectIcon, { backgroundColor: `${subject.color}20` }]}>
                    <Ionicons name={getSubjectIcon(subject.id)} size={28} color={subject.color} />
                  </View>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getSubjectProgress(subject.id)}%`, backgroundColor: subject.color }]} />
                  </View>
                  <Text style={styles.progressText}>{getSubjectProgress(subject.id) > 0 ? `${getSubjectProgress(subject.id)}% Avg` : 'Not started'}</Text>
                </TouchableOpacity>
              </FadeInRight>
            ))}
          </ScrollView>
        </FadeInDown>

        {/* Recent Activity */}
        <FadeInDown delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/progress')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <FadeInDown key={activity.id} delay={500 + index * 100}>
                <TouchableOpacity
                  style={styles.activityCard}
                  onPress={() => router.push(activity.route)}
                >
                  <View style={[styles.activityIcon, {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                  }]}>
                    <Ionicons name="document-text" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityMeta}>
                      Score: {activity.score}% • {activity.time}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </FadeInDown>
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="time-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyActivityText}>No recent activity</Text>
              <Text style={styles.emptyActivitySubtext}>Take a quiz to see your activity here!</Text>
            </View>
          )}
        </FadeInDown>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={styles.modalHeaderRight}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowNotifications(false)}
                >
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.notificationsList}
              showsVerticalScrollIndicator={false}
            >
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.notificationUnread
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={[
                    styles.notificationIcon,
                    { backgroundColor: `${getNotificationColor(notification.type)}15` }
                  ]}>
                    <Ionicons
                      name={notification.icon}
                      size={24}
                      color={getNotificationColor(notification.type)}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationTitleRow}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getSubjectIcon = (subjectId) => {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  return subject?.icon || 'school';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    top: -60,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    top: 80,
    left: -40,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: {},
  greeting: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    marginBottom: 4,
  },
  userName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  statsCard: {
    marginBottom: Spacing.lg,
  },
  statsGradient: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  statsButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickActionCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm * 3) / 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionTitle: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  subjectsScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  subjectCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  subjectIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subjectName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  // Notifications Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  notificationsModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  markAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  markAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  notificationUnread: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  notificationTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: 2,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  emptyActivityText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptyActivitySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
