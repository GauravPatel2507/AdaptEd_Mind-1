import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS } from '../../constants/Config';
import { FadeInDown, FadeInRight } from '../../components/Animations';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, userProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    { id: 'quiz', title: 'Take Quiz', icon: 'create-outline', color: Colors.primary, route: '/(tabs)/tests' },
    { id: 'lessons', title: 'Continue', icon: 'play-circle-outline', color: Colors.secondary, route: '/(tabs)/learn' },
    { id: 'progress', title: 'My Progress', icon: 'trending-up-outline', color: Colors.accent, route: '/(tabs)/progress' },
    { id: 'study', title: 'Study Path', icon: 'map-outline', color: '#8B5CF6', route: '/(tabs)/learn' },
  ];

  const recentActivity = [
    { id: 1, type: 'quiz', title: 'Math Quiz', score: 85, time: '2h ago' },
    { id: 2, type: 'lesson', title: 'Algebra Basics', progress: 100, time: '5h ago' },
    { id: 3, type: 'quiz', title: 'Science Quiz', score: 92, time: '1d ago' },
  ];

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
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </FadeInDown>

        {/* Stats Summary Card */}
        <FadeInDown delay={100} style={styles.statsCard}>
          <View style={styles.statsGradient}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Courses</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>85%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>7</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.statsButton}>
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
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
            {SUBJECTS.slice(0, 5).map((subject, index) => (
              <FadeInRight key={subject.id} delay={index * 100}>
                <TouchableOpacity style={styles.subjectCard}>
                  <View style={[styles.subjectIcon, { backgroundColor: `${subject.color}20` }]}>
                    <Ionicons name={getSubjectIcon(subject.id)} size={28} color={subject.color} />
                  </View>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(index + 3) * 15}%`, backgroundColor: subject.color }]} />
                  </View>
                  <Text style={styles.progressText}>{(index + 3) * 15}% Complete</Text>
                </TouchableOpacity>
              </FadeInRight>
            ))}
          </ScrollView>
        </FadeInDown>

        {/* Recent Activity */}
        <FadeInDown delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentActivity.map((activity, index) => (
            <FadeInDown key={activity.id} delay={500 + index * 100}>
              <TouchableOpacity style={styles.activityCard}>
                <View style={[styles.activityIcon, { 
                  backgroundColor: activity.type === 'quiz' 
                    ? 'rgba(99, 102, 241, 0.1)' 
                    : 'rgba(16, 185, 129, 0.1)' 
                }]}>
                  <Ionicons 
                    name={activity.type === 'quiz' ? 'document-text' : 'play-circle'} 
                    size={24} 
                    color={activity.type === 'quiz' ? Colors.primary : Colors.secondary} 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityMeta}>
                    {activity.score ? `Score: ${activity.score}%` : `Progress: ${activity.progress}%`}
                    {' • '}{activity.time}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </FadeInDown>
          ))}
        </FadeInDown>

        {/* Bottom spacing for tab bar */}
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
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    top: 50,
    left: -50,
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
    ...Shadows.md,
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  statsCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  statsGradient: {
    padding: Spacing.lg,
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  statsButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
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
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickActionCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  subjectsScroll: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  subjectCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subjectName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
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
});
