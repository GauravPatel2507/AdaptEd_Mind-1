import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

// Animated card component with scale effect
export const AnimatedCard = ({ 
  children, 
  style, 
  delay = 0, 
  onPress
}) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View style={[styles.card, animatedStyle, style]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// Stat card for dashboard
export const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = Colors.primary,
  delay = 0 
}) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.statCard, 
        { borderLeftColor: color },
        { transform: [{ translateY }], opacity }
      ]}
    >
      <View style={styles.statIconContainer}>
        <Text style={[styles.statIcon, { color }]}>{icon}</Text>
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </Animated.View>
  );
};

// Progress ring component
export const ProgressRing = ({ 
  progress = 0, 
  size = 100, 
  strokeWidth = 10,
  color = Colors.primary,
  children 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          stroke={Colors.cardBorder}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.progressRingContent}>
        {children}
      </View>
    </View>
  );
};

// Floating animated background circles
export const FloatingCircles = () => {
  const translateY1 = useRef(new Animated.Value(0)).current;
  const translateY2 = useRef(new Animated.Value(0)).current;
  const translateY3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (anim, toValue, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: toValue,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(translateY1, -20, 3000);
    animate(translateY2, -15, 2500);
    animate(translateY3, -25, 3500);
  }, []);

  return (
    <View style={styles.floatingContainer}>
      <Animated.View style={[styles.floatingCircle1, { transform: [{ translateY: translateY1 }] }]} />
      <Animated.View style={[styles.floatingCircle2, { transform: [{ translateY: translateY2 }] }]} />
      <Animated.View style={[styles.floatingCircle3, { transform: [{ translateY: translateY3 }] }]} />
    </View>
  );
};

// Learning path step component
export const LearningPathStep = ({ 
  step, 
  title, 
  description, 
  completed = false,
  active = false,
  delay = 0
}) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.pathStepContainer,
        { transform: [{ translateY }], opacity }
      ]}
    >
      <View style={styles.pathStepLine}>
        <View style={[
          styles.pathStepDot,
          completed && styles.pathStepDotCompleted,
          active && styles.pathStepDotActive
        ]}>
          {completed && <Text style={styles.checkmark}>✓</Text>}
          {!completed && <Text style={styles.stepNumber}>{step}</Text>}
        </View>
        <View style={[styles.pathStepLineLower, completed && styles.pathStepLineCompleted]} />
      </View>
      <View style={[styles.pathStepContent, active && styles.pathStepContentActive]}>
        <Text style={[styles.pathStepTitle, completed && styles.pathStepTitleCompleted]}>
          {title}
        </Text>
        <Text style={styles.pathStepDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
};

// Fade In View wrapper
export const FadeInView = ({ children, delay = 0, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statIcon: {
    fontSize: 24,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  statTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
  progressRingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floatingCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    top: -50,
    right: -50,
  },
  floatingCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    top: height * 0.3,
    left: -30,
  },
  floatingCircle3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    bottom: 100,
    right: -40,
  },
  pathStepContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  pathStepLine: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  pathStepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathStepDotCompleted: {
    backgroundColor: Colors.secondary,
  },
  pathStepDotActive: {
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepNumber: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  pathStepLineLower: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.cardBorder,
    marginTop: 4,
  },
  pathStepLineCompleted: {
    backgroundColor: Colors.secondary,
  },
  pathStepContent: {
    flex: 1,
    paddingBottom: Spacing.lg,
  },
  pathStepContentActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: -8,
  },
  pathStepTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  pathStepTitleCompleted: {
    color: Colors.secondary,
  },
  pathStepDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
});

export default {
  AnimatedCard,
  StatCard,
  ProgressRing,
  FloatingCircles,
  LearningPathStep,
  FadeInView,
};
