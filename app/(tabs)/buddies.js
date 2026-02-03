import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    RefreshControl,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { FadeInDown, FadeInUp } from '../../components/Animations';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    onSnapshot,
    orderBy,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function BuddiesScreen() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('conversations');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch all users except current user
    const fetchUsers = useCallback(async () => {
        if (!user) return;

        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);

            const usersList = [];
            snapshot.forEach(doc => {
                if (doc.id !== user.uid) {
                    usersList.push({ id: doc.id, ...doc.data() });
                }
            });

            setUsers(usersList);
        } catch (error) {
            console.log('Error fetching users:', error.message);
        }
    }, [user]);

    // Listen to conversations in real-time
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const convList = [];

            for (const docSnap of snapshot.docs) {
                const convData = docSnap.data();
                const otherUserId = convData.participants.find(p => p !== user.uid);

                // Get other user's profile
                let otherUser = { displayName: 'Unknown User' };
                try {
                    const userDoc = await getDoc(doc(db, 'users', otherUserId));
                    if (userDoc.exists()) {
                        otherUser = userDoc.data();
                    }
                } catch (e) {
                    console.log('Error fetching user:', e);
                }

                convList.push({
                    id: docSnap.id,
                    ...convData,
                    otherUser: { id: otherUserId, ...otherUser }
                });
            }

            setConversations(convList);
            setLoading(false);
        }, (error) => {
            console.log('Conversation listener error:', error.message);
            setLoading(false);
        });

        fetchUsers();

        return () => unsubscribe();
    }, [user, fetchUsers]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUsers().finally(() => setRefreshing(false));
    }, [fetchUsers]);

    // Start or open conversation with a user
    const startConversation = async (otherUser) => {
        if (!user) return;

        try {
            // Check if conversation already exists
            const conversationId = [user.uid, otherUser.id].sort().join('_');
            const convRef = doc(db, 'conversations', conversationId);
            const convDoc = await getDoc(convRef);

            if (!convDoc.exists()) {
                // Create new conversation
                await setDoc(convRef, {
                    participants: [user.uid, otherUser.id],
                    createdAt: serverTimestamp(),
                    lastMessage: '',
                    lastMessageTime: serverTimestamp(),
                    lastMessageBy: ''
                });
            }

            // Navigate to chat screen
            router.push({
                pathname: '/chat',
                params: {
                    conversationId: conversationId,
                    otherUserId: otherUser.id,
                    otherUserName: otherUser.displayName || 'User'
                }
            });
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    // Filter users by search
    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get user initials
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Get avatar color based on name
    const getAvatarColor = (name) => {
        const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6'];
        const index = (name?.charCodeAt(0) || 0) % colors.length;
        return colors[index];
    };

    if (!user) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="people" size={64} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Sign in to connect</Text>
                <Text style={styles.emptySubtitle}>Find study buddies and chat with them!</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Study Buddies</Text>
                <Text style={styles.subtitle}>Connect and learn together</Text>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'conversations' && styles.tabActive]}
                    onPress={() => setActiveTab('conversations')}
                >
                    <Ionicons
                        name="chatbubbles"
                        size={20}
                        color={activeTab === 'conversations' ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[styles.tabText, activeTab === 'conversations' && styles.tabTextActive]}>
                        Chats
                    </Text>
                    {conversations.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{conversations.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
                    onPress={() => setActiveTab('discover')}
                >
                    <Ionicons
                        name="search"
                        size={20}
                        color={activeTab === 'discover' ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
                        Discover
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar (for Discover tab) */}
            {activeTab === 'discover' && (
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={Colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor={Colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                {/* Conversations Tab */}
                {activeTab === 'conversations' && (
                    <>
                        {conversations.length > 0 ? (
                            conversations.map((conv, index) => (
                                <FadeInDown key={conv.id} delay={index * 50}>
                                    <TouchableOpacity
                                        style={styles.conversationCard}
                                        onPress={() => router.push({
                                            pathname: '/chat',
                                            params: {
                                                conversationId: conv.id,
                                                otherUserId: conv.otherUser.id,
                                                otherUserName: conv.otherUser.displayName || 'User'
                                            }
                                        })}
                                    >
                                        <View style={[styles.avatar, { backgroundColor: getAvatarColor(conv.otherUser.displayName) }]}>
                                            <Text style={styles.avatarText}>
                                                {getInitials(conv.otherUser.displayName)}
                                            </Text>
                                        </View>
                                        <View style={styles.conversationContent}>
                                            <View style={styles.conversationHeader}>
                                                <Text style={styles.conversationName} numberOfLines={1}>
                                                    {conv.otherUser.displayName || 'Unknown User'}
                                                </Text>
                                                <Text style={styles.conversationTime}>
                                                    {formatTime(conv.lastMessageTime)}
                                                </Text>
                                            </View>
                                            <Text style={styles.conversationMessage} numberOfLines={1}>
                                                {conv.lastMessage || 'Start chatting...'}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                                    </TouchableOpacity>
                                </FadeInDown>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
                                <Text style={styles.emptyTitle}>No conversations yet</Text>
                                <Text style={styles.emptySubtitle}>
                                    Go to Discover tab to find study buddies!
                                </Text>
                                <TouchableOpacity
                                    style={styles.discoverButton}
                                    onPress={() => setActiveTab('discover')}
                                >
                                    <Ionicons name="search" size={20} color="#fff" />
                                    <Text style={styles.discoverButtonText}>Find Buddies</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}

                {/* Discover Tab */}
                {activeTab === 'discover' && (
                    <>
                        {filteredUsers.length > 0 ? (
                            <>
                                <Text style={styles.sectionTitle}>
                                    {searchQuery ? `Results for "${searchQuery}"` : 'All Users'}
                                </Text>
                                {filteredUsers.map((u, index) => (
                                    <FadeInUp key={u.id} delay={index * 50}>
                                        <TouchableOpacity
                                            style={styles.userCard}
                                            onPress={() => startConversation(u)}
                                        >
                                            <View style={[styles.avatar, { backgroundColor: getAvatarColor(u.displayName) }]}>
                                                <Text style={styles.avatarText}>
                                                    {getInitials(u.displayName)}
                                                </Text>
                                            </View>
                                            <View style={styles.userContent}>
                                                <Text style={styles.userName}>{u.displayName || 'Unknown'}</Text>
                                                <Text style={styles.userEmail}>{u.email}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.messageButton}
                                                onPress={() => startConversation(u)}
                                            >
                                                <Ionicons name="chatbubble" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    </FadeInUp>
                                ))}
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
                                <Text style={styles.emptyTitle}>
                                    {searchQuery ? 'No users found' : 'No other users yet'}
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {searchQuery
                                        ? 'Try a different search term'
                                        : 'Invite friends to join AdaptEd Mind!'
                                    }
                                </Text>
                            </View>
                        )}
                    </>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.background,
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
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.surface,
        gap: Spacing.xs,
        ...Shadows.sm,
    },
    tabActive: {
        backgroundColor: Colors.primary + '15',
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    tabText: {
        fontSize: FontSizes.md,
        fontWeight: '500',
        color: Colors.textMuted,
    },
    tabTextActive: {
        color: Colors.primary,
    },
    tabBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 4,
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
        ...Shadows.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: FontSizes.md,
        color: Colors.text,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    conversationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: '#fff',
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    conversationName: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
        flex: 1,
    },
    conversationTime: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        marginLeft: Spacing.sm,
    },
    conversationMessage: {
        fontSize: FontSizes.sm,
        color: Colors.textLight,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    userContent: {
        flex: 1,
    },
    userName: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
    },
    userEmail: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        marginTop: 2,
    },
    messageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    emptyTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
        marginTop: Spacing.md,
    },
    emptySubtitle: {
        fontSize: FontSizes.md,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: Spacing.xs,
        paddingHorizontal: Spacing.xl,
    },
    discoverButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.lg,
        gap: Spacing.sm,
    },
    discoverButtonText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.textLight,
    },
});
