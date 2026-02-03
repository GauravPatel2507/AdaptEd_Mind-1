import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Dimensions,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { FadeInDown } from '../../components/Animations';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, userProfile, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real stats from Firebase
  const [stats, setStats] = useState({
    streak: 0,
    badges: 0,
    studyTime: 0,
    totalTests: 0,
    averageScore: 0
  });

  // Fetch user stats from Firebase
  const fetchUserStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const quizResultsRef = collection(db, 'quizResults');
      const q = query(quizResultsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });

      if (results.length > 0) {
        // Calculate total tests
        const totalTests = results.length;

        // Calculate average score
        const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
        const averageScore = Math.round(totalScore / totalTests);

        // Calculate total study time (in hours)
        const totalStudyTime = results.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
        const studyHours = Math.round(totalStudyTime / 60);

        // Calculate streak
        const streak = calculateStreak(results);

        // Calculate badges (based on achievements)
        const badges = calculateBadges(results, averageScore, streak);

        setStats({
          streak,
          badges,
          studyTime: studyHours,
          totalTests,
          averageScore
        });
      }
    } catch (error) {
      console.log('Error fetching user stats:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // Calculate badges based on achievements
  const calculateBadges = (results, avgScore, streak) => {
    let badges = 0;

    // First test badge
    if (results.length >= 1) badges++;

    // 10 tests badge
    if (results.length >= 10) badges++;

    // 50 tests badge
    if (results.length >= 50) badges++;

    // High scorer badge (avg > 80%)
    if (avgScore >= 80) badges++;

    // Perfect score badge (any 100%)
    if (results.some(r => r.score === 100)) badges++;

    // Streak badges
    if (streak >= 3) badges++;
    if (streak >= 7) badges++;
    if (streak >= 30) badges++;

    // Subject master (90%+ in any subject)
    const subjectScores = {};
    results.forEach(r => {
      if (!subjectScores[r.subject]) {
        subjectScores[r.subject] = { total: 0, count: 0 };
      }
      subjectScores[r.subject].total += r.score || 0;
      subjectScores[r.subject].count += 1;
    });

    Object.values(subjectScores).forEach(data => {
      if (data.total / data.count >= 90) badges++;
    });

    return badges;
  };

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserStats();
  }, [fetchUserStats]);

  // Quick settings
  const settingsItems = [
    { id: 'notifications', icon: 'notifications-outline', title: 'Notifications', type: 'toggle', value: notifications, onToggle: setNotifications },
    { id: 'darkMode', icon: 'moon-outline', title: 'Dark Mode', type: 'toggle', value: darkMode, onToggle: setDarkMode },
    { id: 'language', icon: 'language-outline', title: 'Language', type: 'arrow', value: 'English' },
    { id: 'privacy', icon: 'shield-checkmark-outline', title: 'Privacy & Security', type: 'arrow', onPress: () => setShowPrivacyModal(true) },
    { id: 'about', icon: 'information-circle-outline', title: 'About', type: 'arrow', onPress: () => setShowAboutModal(true) },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const handleSettingsPress = (item) => {
    if (item.onPress) {
      item.onPress();
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
        {/* Profile Header */}
        <FadeInDown delay={0} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🎓</Text>
            </View>
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </View>
          <Text style={styles.userName}>{userProfile?.displayName || 'Student'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'student@example.com'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="school" size={14} color={Colors.primary} />
            <Text style={styles.roleText}>
              {userProfile?.role === 'teacher' ? 'Teacher' : 'Student'}
            </Text>
          </View>
        </FadeInDown>

        {/* Stats Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FadeInDown delay={100} style={styles.statsGrid}>
            <View style={styles.statsCard}>
              <Ionicons name="flame" size={24} color={Colors.error} />
              <Text style={styles.statsValue}>{stats.streak}</Text>
              <Text style={styles.statsLabel}>Day Streak</Text>
            </View>
            <View style={styles.statsCard}>
              <Ionicons name="trophy" size={24} color={Colors.accent} />
              <Text style={styles.statsValue}>{stats.badges}</Text>
              <Text style={styles.statsLabel}>Badges</Text>
            </View>
            <View style={styles.statsCard}>
              <Ionicons name="time" size={24} color={Colors.secondary} />
              <Text style={styles.statsValue}>{stats.studyTime}h</Text>
              <Text style={styles.statsLabel}>Study Time</Text>
            </View>
          </FadeInDown>
        )}

        {/* Reports - Module 8 */}
        <FadeInDown delay={200}>
          <Text style={styles.sectionTitle}>📊 Reports</Text>
          <TouchableOpacity style={styles.reportCard}>
            <View style={styles.reportIcon}>
              <Ionicons name="document-text" size={24} color={Colors.primary} />
            </View>
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>Weekly Progress Report</Text>
              <Text style={styles.reportSubtitle}>Auto-generated every Sunday</Text>
            </View>
            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons name="download-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportCard}>
            <View style={styles.reportIcon}>
              <Ionicons name="analytics" size={24} color={Colors.secondary} />
            </View>
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>Performance Analysis</Text>
              <Text style={styles.reportSubtitle}>Detailed insights & recommendations</Text>
            </View>
            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons name="download-outline" size={20} color={Colors.secondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </FadeInDown>

        {/* Settings */}
        <FadeInDown delay={300}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>
          <View style={styles.settingsCard}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingsItem,
                  index < settingsItems.length - 1 && styles.settingsItemBorder
                ]}
                onPress={() => handleSettingsPress(item)}
                disabled={item.type === 'toggle'}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={styles.settingsIcon}>
                    <Ionicons name={item.icon} size={20} color={Colors.textLight} />
                  </View>
                  <Text style={styles.settingsItemTitle}>{item.title}</Text>
                </View>
                {item.type === 'toggle' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: Colors.cardBorder, true: Colors.primary + '50' }}
                    thumbColor={item.value ? Colors.primary : Colors.textMuted}
                  />
                ) : (
                  <View style={styles.settingsItemRight}>
                    {item.value && <Text style={styles.settingsItemValue}>{item.value}</Text>}
                    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </FadeInDown>

        {/* Logout Button */}
        <FadeInDown delay={400}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </FadeInDown>

        {/* App Version */}
        <Text style={styles.versionText}>AdaptEd Mind v1.0.0</Text>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About AdaptEd Mind</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.aboutLogo}>
                <Text style={styles.aboutLogoEmoji}>🎓</Text>
                <Text style={styles.aboutAppName}>AdaptEd Mind</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              </View>

              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>📚 Our Mission</Text>
                <Text style={styles.aboutText}>
                  AdaptEd Mind is an AI-powered adaptive learning platform designed to personalize education for every student. We believe that every learner is unique, and our technology adapts to your learning style, pace, and preferences.
                </Text>
              </View>

              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>✨ Key Features</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="sparkles" size={18} color={Colors.primary} />
                  <Text style={styles.featureText}>AI-generated personalized tests</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="trending-up" size={18} color={Colors.secondary} />
                  <Text style={styles.featureText}>Real-time progress tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="people" size={18} color={Colors.accent} />
                  <Text style={styles.featureText}>Study buddy connections</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="play-circle" size={18} color={Colors.error} />
                  <Text style={styles.featureText}>Curated video lessons</Text>
                </View>
              </View>

              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>👨‍💻 Development Team</Text>
                <Text style={styles.aboutText}>
                  Built with ❤️ by passionate developers committed to transforming education through technology.
                </Text>
              </View>

              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>📧 Contact Us</Text>
                <Text style={styles.aboutText}>
                  Email: support@adaptedmind.com{'\n'}
                  Website: www.adaptedmind.com
                </Text>
              </View>

              <Text style={styles.copyright}>
                © 2024 AdaptEd Mind. All rights reserved.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy & Security Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy & Security</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.privacySection}>
                <Text style={styles.privacySectionTitle}>🔒 Data Protection</Text>
                <Text style={styles.privacyText}>
                  Your data is encrypted and stored securely. We use industry-standard security measures to protect your personal information.
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacySectionTitle}>📋 Terms of Service</Text>
                <Text style={styles.privacyText}>
                  1. <Text style={styles.boldText}>Account Responsibility:</Text> You are responsible for maintaining the confidentiality of your account credentials.{'\n\n'}
                  2. <Text style={styles.boldText}>Acceptable Use:</Text> You agree to use AdaptEd Mind for educational purposes only and not engage in any harmful or illegal activities.{'\n\n'}
                  3. <Text style={styles.boldText}>Content Ownership:</Text> All educational content, including AI-generated tests and materials, remains the property of AdaptEd Mind.{'\n\n'}
                  4. <Text style={styles.boldText}>User Data:</Text> Your learning progress and performance data is used to personalize your experience and improve our services.{'\n\n'}
                  5. <Text style={styles.boldText}>Termination:</Text> We reserve the right to suspend or terminate accounts that violate these terms.
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacySectionTitle}>🔐 Privacy Policy</Text>
                <Text style={styles.privacyText}>
                  <Text style={styles.boldText}>Information We Collect:</Text>{'\n'}
                  • Email address and display name{'\n'}
                  • Learning progress and quiz results{'\n'}
                  • Usage patterns and preferences{'\n\n'}

                  <Text style={styles.boldText}>How We Use Your Data:</Text>{'\n'}
                  • Personalize learning recommendations{'\n'}
                  • Generate adaptive assessments{'\n'}
                  • Track and display your progress{'\n'}
                  • Improve our AI algorithms{'\n\n'}

                  <Text style={styles.boldText}>Data Sharing:</Text>{'\n'}
                  We do not sell your personal information to third parties. Your data may be shared only with service providers who help us operate the platform.
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacySectionTitle}>👤 Your Rights</Text>
                <Text style={styles.privacyText}>
                  • Access your personal data at any time{'\n'}
                  • Request data deletion{'\n'}
                  • Opt-out of non-essential communications{'\n'}
                  • Export your learning history{'\n'}
                  • Update your profile information
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacySectionTitle}>🍪 Cookies & Tracking</Text>
                <Text style={styles.privacyText}>
                  We use cookies and similar technologies to enhance your experience, analyze usage patterns, and remember your preferences.
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacySectionTitle}>📞 Contact</Text>
                <Text style={styles.privacyText}>
                  For privacy concerns or data requests, contact us at:{'\n'}
                  privacy@adaptedmind.com
                </Text>
              </View>

              <Text style={styles.lastUpdated}>
                Last Updated: February 2024
              </Text>
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
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  userName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  userEmail: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  roleText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statsValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statsLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  reportSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingsItemTitle: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingsItemValue: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  logoutButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.error,
  },
  versionText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  // About Modal Styles
  aboutLogo: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  aboutLogoEmoji: {
    fontSize: 60,
    marginBottom: Spacing.sm,
  },
  aboutAppName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  aboutVersion: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  aboutSection: {
    marginBottom: Spacing.lg,
  },
  aboutSectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  aboutText: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  copyright: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  // Privacy Modal Styles  
  privacySection: {
    marginBottom: Spacing.lg,
  },
  privacySectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  privacyText: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '600',
    color: Colors.text,
  },
  lastUpdated: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
