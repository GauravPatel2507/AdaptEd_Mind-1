// EditorialComponents — Shared visual primitives for editorial tech aesthetic
import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, Animated, StyleSheet, Easing } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, FontSizes } from '../constants/Colors';

// ── Section Divider ─────────────────────────────────────────────────
// 1px horizontal line with optional mono uppercase label
export const SectionDivider = ({ label, style }) => {
  if (label) {
    return (
      <View style={[dividerStyles.labeledContainer, style]}>
        <View style={dividerStyles.line} />
        <Text style={dividerStyles.label}>{label}</Text>
        <View style={dividerStyles.line} />
      </View>
    );
  }
  return <View style={[dividerStyles.simpleLine, style]} />;
};

const dividerStyles = StyleSheet.create({
  simpleLine: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: Spacing.lg,
  },
  labeledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
});

// ── Editorial Loading Bar ───────────────────────────────────────────
// 2px animated sliding bar — editorial status indicator
export const EditorialLoadingBar = ({ color = '#3b82f6', style }) => {
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 2000,
        easing: Easing.bezier(0.8, 0, 0.2, 1),
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={[loadingStyles.track, style]}>
      <Animated.View
        style={[
          loadingStyles.bar,
          { backgroundColor: color },
          {
            transform: [{
              translateX: translateX.interpolate({
                inputRange: [-1, 1],
                outputRange: [-200, 200],
              }),
            }],
          },
        ]}
      />
    </View>
  );
};

const loadingStyles = StyleSheet.create({
  track: {
    height: 2,
    backgroundColor: Colors.cardBorder,
    overflow: 'hidden',
    borderRadius: 1,
  },
  bar: {
    height: '100%',
    width: '40%',
    borderRadius: 1,
  },
});

// ── Editorial Label ─────────────────────────────────────────────────
// Mono uppercase label with configurable letter-spacing
export const EditorialLabel = ({ children, color = Colors.textMuted, size = 9, spacing = 3, style }) => (
  <Text style={[
    { fontSize: size, fontFamily: Fonts.mono, color, textTransform: 'uppercase', letterSpacing: spacing },
    style,
  ]}>
    {children}
  </Text>
);

// ── Bottom Border Input ─────────────────────────────────────────────
// Text input with only bottom border — editorial form aesthetic
export const BottomBorderInput = ({ placeholder, value, onChangeText, style, ...props }) => (
  <View style={[inputStyles.container, style]}>
    <TextInput
      style={inputStyles.input}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      value={value}
      onChangeText={onChangeText}
      {...props}
    />
  </View>
);

const inputStyles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    paddingVertical: Spacing.sm,
  },
  input: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.body,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
});

// ── Stat Card ────────────────────────────────────────────────────────
// Bordered card with icon box, serif number, and mono label
export const EditorialStatCard = ({ icon, value, label, iconColor = Colors.primary, style }) => (
  <View style={[statStyles.card, style]}>
    {icon && (
      <View style={[statStyles.iconBox, { borderColor: iconColor + '30' }]}>
        {icon}
      </View>
    )}
    <Text style={statStyles.value}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.monoBold,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default {
  SectionDivider,
  EditorialLoadingBar,
  EditorialLabel,
  BottomBorderInput,
  EditorialStatCard,
};
