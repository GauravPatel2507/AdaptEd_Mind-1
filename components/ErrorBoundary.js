import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/Colors';

/**
 * Global Error Boundary: catches JS errors anywhere in the child component tree,
 * logs them and shows a friendly fallback UI with retry.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Ionicons name="alert-circle" size={64} color="#EF4444" />
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.message}>
                            An unexpected error occurred. Please try again.
                        </Text>
                        <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                            <Ionicons name="refresh" size={20} color="#fff" />
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: Spacing.lg,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        ...Shadows.lg,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.text,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: FontSizes.md,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: Spacing.sm,
        lineHeight: 22,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.xl,
        gap: Spacing.xs,
    },
    retryText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: '#fff',
    },
});
