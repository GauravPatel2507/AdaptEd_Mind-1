import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Switch,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { FadeInDown, FadeInRight } from '../../components/Animations';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, userProfile, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Sample study buddies for Module 9
  const studyBuddies = [
    { id: 1, name: 'Alex Johnson', subject: 'Mathematics', avatar: '👨‍🎓', online: true },
    { id: 2, name: 'Sarah Williams', subject: 'Physics', avatar: '👩‍🎓', online: true },
    { id: 3, name: 'Michael Chen', subject: 'Chemistry', avatar: '👨‍🔬', online: false },
  ];
  
  // Quick settings
  const settingsItems = [
    { id: 'notifications', icon: 'notifications-outline', title: 'Notifications', type: 'toggle', value: notifications, onToggle: setNotifications },
    { id: 'darkMode', icon: 'moon-outline', title: 'Dark Mode', type: 'toggle', value: darkMode, onToggle: setDarkMode },
    { id: 'language', icon: 'language-outline', title: 'Language', type: 'arrow', value: 'English' },
    { id: 'privacy', icon: 'shield-checkmark-outline', title: 'Privacy & Security', type: 'arrow' },
    { id: 'about', icon: 'information-circle-outline', title: 'About', type: 'arrow' },
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

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
        <FadeInDown delay={100} style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Ionicons name="flame" size={24} color={Colors.error} />
            <Text style={styles.statsValue}>7</Text>
            <Text style={styles.statsLabel}>Day Streak</Text>
          </View>
          <View style={styles.statsCard}>
            <Ionicons name="trophy" size={24} color={Colors.accent} />
            <Text style={styles.statsValue}>12</Text>
            <Text style={styles.statsLabel}>Badges</Text>
          </View>
          <View style={styles.statsCard}>
            <Ionicons name="time" size={24} color={Colors.secondary} />
            <Text style={styles.statsValue}>48h</Text>
            <Text style={styles.statsLabel}>Study Time</Text>
          </View>
        </FadeInDown>

        {/* Study Buddies - Module 9 */}
        <FadeInDown delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Study Buddies</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Find More</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Connect with peers for collaborative learning</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buddiesScroll}>
            {studyBuddies.map((buddy, index) => (
              <FadeInRight key={buddy.id} delay={300 + index * 100}>
                <TouchableOpacity style={styles.buddyCard}>
                  <View style={styles.buddyAvatarContainer}>
                    <View style={styles.buddyAvatar}>
                      <Text style={styles.buddyAvatarEmoji}>{buddy.avatar}</Text>
                    </View>
                    {buddy.online && <View style={styles.onlineIndicator} />}
                  </View>
                  <Text style={styles.buddyName}>{buddy.name.split(' ')[0]}</Text>
                  <Text style={styles.buddySubject}>{buddy.subject}</Text>
                  <TouchableOpacity style={styles.chatButton}>
                    <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </FadeInRight>
            ))}
            {/* Add new buddy card */}
            <TouchableOpacity style={styles.addBuddyCard}>
              <View style={styles.addBuddyIcon}>
                <Ionicons name="person-add" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.addBuddyText}>Find Study</Text>
              <Text style={styles.addBuddyText}>Partners</Text>
            </TouchableOpacity>
          </ScrollView>
        </FadeInDown>

        {/* Reports - Module 8 */}
        <FadeInDown delay={300}>
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
        <FadeInDown delay={400}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>
          <View style={styles.settingsCard}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity 
                key={item.id}
                style={[
                  styles.settingsItem,
                  index < settingsItems.length - 1 && styles.settingsItemBorder
                ]}
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
        <FadeInDown delay={500}>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  buddiesScroll: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  buddyCard: {
    width: 100,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  buddyAvatarContainer: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  buddyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buddyAvatarEmoji: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  buddyName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  buddySubject: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  chatButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBuddyCard: {
    width: 100,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  addBuddyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  addBuddyText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '500',
    textAlign: 'center',
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
});
