import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Fonts, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { FadeInDown } from '../../components/Animations';
import { SectionDivider } from '../../components/EditorialComponents';

export default function TeacherProfileScreen() {
  const { user, userProfile, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            const result = await logout();
            setIsLoggingOut(false);
            if (result.success) {
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'account',
      title: 'Account Settings',
      icon: 'settings-outline',
      color: Colors.primary,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      color: Colors.info,
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      color: Colors.accent,
    },
    {
      id: 'about',
      title: 'About AdaptEd Mind',
      icon: 'information-circle-outline',
      color: Colors.secondary,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <FadeInDown delay={0} style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </FadeInDown>

        {/* Profile Card */}
        <FadeInDown delay={100}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(userProfile?.displayName || 'T').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.roleBadge}>
                <Ionicons name="school" size={10} color="#fff" />
              </View>
            </View>
            <Text style={styles.profileName}>{userProfile?.displayName || 'Teacher'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'teacher@email.com'}</Text>
            <View style={styles.roleTag}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.roleTagText}>Teacher</Text>
            </View>
          </View>
        </FadeInDown>

        <SectionDivider label="Account Info" />

        {/* Info Cards */}
        <FadeInDown delay={200}>
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {userProfile?.createdAt
                  ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>Teacher</Text>
            </View>
          </View>
        </FadeInDown>

        <SectionDivider label="Settings" />

        {/* Menu Items */}
        <FadeInDown delay={300}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </FadeInDown>

        <SectionDivider />

        {/* Logout Button */}
        <FadeInDown delay={400}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </FadeInDown>

        {/* App Version */}
        <FadeInDown delay={500}>
          <Text style={styles.versionText}>AdaptEd Mind v2.0.0</Text>
        </FadeInDown>

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
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.heading,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  // Profile Card
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: FontSizes.xxxl,
    fontFamily: Fonts.headingBold,
    fontWeight: '700',
    color: '#fff',
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  profileName: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.heading,
    fontWeight: '300',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginBottom: Spacing.md,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  roleTagText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.mono,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  // Info Cards
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
  },
  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
    color: Colors.text,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '08',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.mono,
    color: Colors.error,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  versionText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    letterSpacing: 1,
  },
});
