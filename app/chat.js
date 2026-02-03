import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

export default function ChatScreen() {
    const params = useLocalSearchParams();
    const { conversationId, otherUserId, otherUserName } = params;
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);

    // Listen to messages in real-time
    useEffect(() => {
        if (!conversationId) return;

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesList = [];
            snapshot.forEach(doc => {
                messagesList.push({ id: doc.id, ...doc.data() });
            });
            setMessages(messagesList);
            setLoading(false);

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }, (error) => {
            console.log('Messages listener error:', error.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [conversationId]);

    // Send message
    const sendMessage = async () => {
        if (!newMessage.trim() || !user || sending) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);
        Keyboard.dismiss();

        try {
            // Add message to messages subcollection
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            await addDoc(messagesRef, {
                senderId: user.uid,
                text: messageText,
                timestamp: serverTimestamp(),
                read: false
            });

            // Update conversation with last message
            const convRef = doc(db, 'conversations', conversationId);
            await updateDoc(convRef, {
                lastMessage: messageText,
                lastMessageTime: serverTimestamp(),
                lastMessageBy: user.uid
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageText); // Restore message on error
        } finally {
            setSending(false);
        }
    };

    // Format message time
    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;

        if (isToday) {
            return `${hour12}:${minutes} ${ampm}`;
        }

        return `${date.getMonth() + 1}/${date.getDate()} ${hour12}:${minutes} ${ampm}`;
    };

    // Get initials
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Get avatar color
    const getAvatarColor = (name) => {
        const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6'];
        const index = (name?.charCodeAt(0) || 0) % colors.length;
        return colors[index];
    };

    // Render message item
    const renderMessage = ({ item, index }) => {
        const isOwn = item.senderId === user?.uid;
        const showAvatar = !isOwn && (
            index === 0 || messages[index - 1]?.senderId !== item.senderId
        );

        return (
            <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
                {!isOwn && showAvatar && (
                    <View style={[styles.messageAvatar, { backgroundColor: getAvatarColor(otherUserName) }]}>
                        <Text style={styles.messageAvatarText}>{getInitials(otherUserName)}</Text>
                    </View>
                )}
                {!isOwn && !showAvatar && <View style={styles.avatarPlaceholder} />}

                <View style={[
                    styles.messageBubble,
                    isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther
                ]}>
                    <Text style={[
                        styles.messageText,
                        isOwn && styles.messageTextOwn
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.messageTime,
                        isOwn && styles.messageTimeOwn
                    ]}>
                        {formatMessageTime(item.timestamp)}
                    </Text>
                </View>
            </View>
        );
    };

    // Render date separator
    const renderDateSeparator = (date) => {
        const now = new Date();
        const messageDate = new Date(date);

        let dateText;
        if (messageDate.toDateString() === now.toDateString()) {
            dateText = 'Today';
        } else {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (messageDate.toDateString() === yesterday.toDateString()) {
                dateText = 'Yesterday';
            } else {
                dateText = messageDate.toLocaleDateString();
            }
        }

        return (
            <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>{dateText}</Text>
            </View>
        );
    };

    if (!user) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>Please sign in to chat</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>

                <View style={[styles.headerAvatar, { backgroundColor: getAvatarColor(otherUserName) }]}>
                    <Text style={styles.headerAvatarText}>{getInitials(otherUserName)}</Text>
                </View>

                <View style={styles.headerInfo}>
                    <Text style={styles.headerName} numberOfLines={1}>{otherUserName}</Text>
                    <Text style={styles.headerStatus}>Study Buddy</Text>
                </View>

                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.text} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.emptyChat}>
                            <View style={[styles.emptyChatAvatar, { backgroundColor: getAvatarColor(otherUserName) }]}>
                                <Text style={styles.emptyChatAvatarText}>{getInitials(otherUserName)}</Text>
                            </View>
                            <Text style={styles.emptyChatTitle}>Start chatting with {otherUserName}</Text>
                            <Text style={styles.emptyChatSubtitle}>
                                Say hello and start learning together! 👋
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        placeholderTextColor={Colors.textMuted}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={1000}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!newMessage.trim() || sending) && styles.sendButtonDisabled
                    ]}
                    onPress={sendMessage}
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
    },
    backButton: {
        padding: Spacing.xs,
        marginRight: Spacing.sm,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    headerAvatarText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
    },
    headerStatus: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
    },
    headerAction: {
        padding: Spacing.xs,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        padding: Spacing.md,
        flexGrow: 1,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
        alignItems: 'flex-end',
    },
    messageRowOwn: {
        justifyContent: 'flex-end',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.xs,
    },
    messageAvatarText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
    },
    avatarPlaceholder: {
        width: 28,
        marginRight: Spacing.xs,
    },
    messageBubble: {
        maxWidth: '75%',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    messageBubbleOwn: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: 4,
        ...Shadows.sm,
    },
    messageText: {
        fontSize: FontSizes.md,
        color: Colors.text,
        lineHeight: 22,
    },
    messageTextOwn: {
        color: '#fff',
    },
    messageTime: {
        fontSize: 10,
        color: Colors.textMuted,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    messageTimeOwn: {
        color: 'rgba(255,255,255,0.7)',
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: Spacing.md,
    },
    dateSeparatorText: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.md,
    },
    emptyChat: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xxl * 2,
    },
    emptyChatAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    emptyChatAvatarText: {
        fontSize: FontSizes.xxl,
        fontWeight: '600',
        color: '#fff',
    },
    emptyChatTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
        textAlign: 'center',
    },
    emptyChatSubtitle: {
        fontSize: FontSizes.md,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
        gap: Spacing.sm,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
        maxHeight: 120,
    },
    textInput: {
        fontSize: FontSizes.md,
        color: Colors.text,
        maxHeight: 100,
        paddingVertical: Platform.OS === 'android' ? Spacing.sm : 0,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Colors.textMuted,
    },
    errorText: {
        fontSize: FontSizes.md,
        color: Colors.textMuted,
    },
});
