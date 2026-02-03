import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS } from '../../constants/Config';
import { FadeInDown, FadeInRight, FadeInUp } from '../../components/Animations';

const { width } = Dimensions.get('window');

// Subject-specific topics and YouTube videos
const SUBJECT_CONTENT = {
  math: {
    topics: [
      { id: 1, title: 'Algebra Basics', description: 'Variables, equations, and expressions', duration: '15 min' },
      { id: 2, title: 'Quadratic Equations', description: 'Solving and graphing quadratics', duration: '20 min' },
      { id: 3, title: 'Geometry Fundamentals', description: 'Shapes, angles, and proofs', duration: '25 min' },
      { id: 4, title: 'Trigonometry', description: 'Sin, cos, tan and applications', duration: '30 min' },
      { id: 5, title: 'Calculus Introduction', description: 'Limits, derivatives, and integrals', duration: '35 min' },
    ],
    videos: [
      { id: 1, title: 'Algebra Full Course', thumbnail: '🔢', videoId: 'NybHckSEQBI', channel: 'freeCodeCamp' },
      { id: 2, title: 'Quadratic Equations Explained', thumbnail: '📐', videoId: 'i7idZfS8t8w', channel: 'Khan Academy' },
      { id: 3, title: 'Learn Geometry', thumbnail: '📏', videoId: '302eJ3TzJQU', channel: 'Math Antics' },
      { id: 4, title: 'Trigonometry Basics', thumbnail: '📊', videoId: 'PUB0TaZ7bhA', channel: 'Khan Academy' },
      { id: 5, title: 'Calculus 1 - Full Course', thumbnail: '∫', videoId: 'HfACrKJ_Y2w', channel: 'freeCodeCamp' },
      { id: 6, title: 'Linear Algebra', thumbnail: '🔷', videoId: 'fNk_zzaMoSs', channel: '3Blue1Brown' },
    ]
  },
  science: {
    topics: [
      { id: 1, title: 'Scientific Method', description: 'Observation, hypothesis, experiment', duration: '10 min' },
      { id: 2, title: 'Matter and Energy', description: 'States of matter and energy forms', duration: '20 min' },
      { id: 3, title: 'Forces and Motion', description: 'Newton\'s laws and mechanics', duration: '25 min' },
      { id: 4, title: 'Ecosystems', description: 'Living organisms and their environment', duration: '20 min' },
      { id: 5, title: 'Human Body Systems', description: 'Organs and their functions', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'Science 101', thumbnail: '🔬', videoId: 'bXsKj_Vs0Ss', channel: 'Nat Geo' },
      { id: 2, title: 'Newton\'s Laws of Motion', thumbnail: '🚀', videoId: 'kKKM8Y-u7ds', channel: 'Crash Course' },
      { id: 3, title: 'The Scientific Method', thumbnail: '🧪', videoId: 'N6IAzlugWw0', channel: 'SciShow' },
      { id: 4, title: 'States of Matter', thumbnail: '💧', videoId: 'YRLJUvPKN0A', channel: 'Crash Course' },
      { id: 5, title: 'Energy and Power', thumbnail: '⚡', videoId: 'w4QFJb9a8vo', channel: 'Khan Academy' },
      { id: 6, title: 'Ecosystems Explained', thumbnail: '🌿', videoId: 'sHIo0FKDz-k', channel: 'National Geographic' },
    ]
  },
  english: {
    topics: [
      { id: 1, title: 'Grammar Essentials', description: 'Parts of speech and sentence structure', duration: '15 min' },
      { id: 2, title: 'Essay Writing', description: 'Structure, thesis, and arguments', duration: '25 min' },
      { id: 3, title: 'Reading Comprehension', description: 'Analysis and interpretation', duration: '20 min' },
      { id: 4, title: 'Vocabulary Building', description: 'Word roots and context clues', duration: '15 min' },
      { id: 5, title: 'Creative Writing', description: 'Storytelling and narrative techniques', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'English Grammar Course', thumbnail: '📚', videoId: '7Bmj-dPVBzs', channel: 'English Addict' },
      { id: 2, title: 'Essay Writing Tips', thumbnail: '✍️', videoId: 'dZVzuFLUaF8', channel: 'TED-Ed' },
      { id: 3, title: 'Improve Vocabulary', thumbnail: '📖', videoId: 'WnlBZ_5bS0Y', channel: 'English Lessons' },
      { id: 4, title: 'Reading Comprehension', thumbnail: '📕', videoId: 'OLjXy0BPBnE', channel: 'Khan Academy' },
      { id: 5, title: 'Creative Writing Basics', thumbnail: '🖊️', videoId: 'frz6g1M3pEE', channel: 'Skillshare' },
      { id: 6, title: 'Public Speaking Skills', thumbnail: '🎤', videoId: 'H6qgkCvJWiU', channel: 'TED-Ed' },
    ]
  },
  physics: {
    topics: [
      { id: 1, title: 'Mechanics', description: 'Motion, forces, and energy', duration: '30 min' },
      { id: 2, title: 'Waves and Sound', description: 'Wave properties and acoustics', duration: '25 min' },
      { id: 3, title: 'Electricity', description: 'Circuits, current, and voltage', duration: '30 min' },
      { id: 4, title: 'Magnetism', description: 'Magnetic fields and electromagnetism', duration: '25 min' },
      { id: 5, title: 'Optics', description: 'Light, reflection, and refraction', duration: '20 min' },
    ],
    videos: [
      { id: 1, title: 'Physics Full Course', thumbnail: '⚛️', videoId: 'ZM8ECpBuQYE', channel: 'freeCodeCamp' },
      { id: 2, title: 'Electricity Explained', thumbnail: '⚡', videoId: 'mc979OhitAg', channel: 'Crash Course' },
      { id: 3, title: 'Waves and Light', thumbnail: '🌊', videoId: 'Io-HXZTepH4', channel: 'Khan Academy' },
      { id: 4, title: 'Quantum Mechanics Intro', thumbnail: '🔬', videoId: 'Usu9xZfabPM', channel: 'PBS Space Time' },
      { id: 5, title: 'Thermodynamics Basics', thumbnail: '🌡️', videoId: 'NyOYW07-L5g', channel: 'Khan Academy' },
      { id: 6, title: 'Magnetism Explained', thumbnail: '🧲', videoId: 'hFAOXdXZ5TM', channel: 'Veritasium' },
    ]
  },
  chemistry: {
    topics: [
      { id: 1, title: 'Atomic Structure', description: 'Protons, neutrons, and electrons', duration: '20 min' },
      { id: 2, title: 'Periodic Table', description: 'Elements and their properties', duration: '25 min' },
      { id: 3, title: 'Chemical Bonding', description: 'Ionic, covalent, and metallic bonds', duration: '30 min' },
      { id: 4, title: 'Chemical Reactions', description: 'Reaction types and balancing', duration: '25 min' },
      { id: 5, title: 'Organic Chemistry', description: 'Carbon compounds and hydrocarbons', duration: '35 min' },
    ],
    videos: [
      { id: 1, title: 'Chemistry Basics', thumbnail: '🧪', videoId: 'bka20Q9TN6M', channel: 'Crash Course' },
      { id: 2, title: 'Periodic Table Explained', thumbnail: '⚗️', videoId: 'rz4Dd1I_fX0', channel: 'TED-Ed' },
      { id: 3, title: 'Chemical Bonding', thumbnail: '🔗', videoId: 'CGA8sRwqIFg', channel: 'Professor Dave' },
      { id: 4, title: 'Organic Chemistry Intro', thumbnail: '🔬', videoId: 'GOBFw0vVDlI', channel: 'Khan Academy' },
      { id: 5, title: 'Chemical Reactions', thumbnail: '💥', videoId: 'kzlUyrccbos', channel: 'Crash Course' },
      { id: 6, title: 'Acids and Bases', thumbnail: '🧫', videoId: 'vt8fB3MFzLk', channel: 'Bozeman Science' },
    ]
  },
  biology: {
    topics: [
      { id: 1, title: 'Cell Biology', description: 'Cell structure and functions', duration: '25 min' },
      { id: 2, title: 'Genetics', description: 'DNA, genes, and inheritance', duration: '30 min' },
      { id: 3, title: 'Evolution', description: 'Natural selection and adaptation', duration: '25 min' },
      { id: 4, title: 'Human Anatomy', description: 'Body systems and organs', duration: '35 min' },
      { id: 5, title: 'Ecology', description: 'Ecosystems and biodiversity', duration: '20 min' },
    ],
    videos: [
      { id: 1, title: 'Biology Full Course', thumbnail: '🧬', videoId: 'QnQe0xW_JY4', channel: 'Crash Course' },
      { id: 2, title: 'DNA Explained', thumbnail: '🔬', videoId: '8kK2zwjRV0M', channel: 'Kurzgesagt' },
      { id: 3, title: 'Cell Biology', thumbnail: '🦠', videoId: 'URUJD5NEXC8', channel: 'Amoeba Sisters' },
      { id: 4, title: 'Evolution Explained', thumbnail: '🐒', videoId: 'hOfRN0KihOU', channel: 'Stated Clearly' },
      { id: 5, title: 'Photosynthesis', thumbnail: '🌱', videoId: 'g78utcLQrJ4', channel: 'Bozeman Science' },
      { id: 6, title: 'Human Body Systems', thumbnail: '❤️', videoId: 'lYXj-5lWFg', channel: 'Crash Course' },
    ]
  },
  history: {
    topics: [
      { id: 1, title: 'Ancient Civilizations', description: 'Egypt, Greece, and Rome', duration: '30 min' },
      { id: 2, title: 'Medieval Period', description: 'Feudalism and the Dark Ages', duration: '25 min' },
      { id: 3, title: 'Renaissance', description: 'Art, science, and cultural rebirth', duration: '20 min' },
      { id: 4, title: 'World Wars', description: 'WWI and WWII major events', duration: '35 min' },
      { id: 5, title: 'Modern History', description: 'Cold War to present day', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'World History Course', thumbnail: '🏛️', videoId: 'Yocja_N5s1I', channel: 'Crash Course' },
      { id: 2, title: 'Ancient Egypt', thumbnail: '🏺', videoId: 'hO1tzmi1V5g', channel: 'National Geographic' },
      { id: 3, title: 'World War II', thumbnail: '⚔️', videoId: 'Q78COTwT7nE', channel: 'Oversimplified' },
      { id: 4, title: 'Renaissance Period', thumbnail: '🎨', videoId: 'Vufba_ZcoR0', channel: 'TED-Ed' },
      { id: 5, title: 'Industrial Revolution', thumbnail: '⚙️', videoId: 'zhL5DCizj5c', channel: 'Crash Course' },
      { id: 6, title: 'Cold War History', thumbnail: '🌐', videoId: 'I79TpDe3t2g', channel: 'Oversimplified' },
    ]
  },
  geography: {
    topics: [
      { id: 1, title: 'Physical Geography', description: 'Landforms and natural features', duration: '20 min' },
      { id: 2, title: 'Climate Zones', description: 'World climates and weather patterns', duration: '25 min' },
      { id: 3, title: 'Maps and Navigation', description: 'Reading and using maps', duration: '15 min' },
      { id: 4, title: 'Human Geography', description: 'Population and culture', duration: '20 min' },
      { id: 5, title: 'Environmental Issues', description: 'Climate change and conservation', duration: '25 min' },
    ],
    videos: [
      { id: 1, title: 'Geography Now!', thumbnail: '🌍', videoId: 'UhXF5FMUdQA', channel: 'Geography Now' },
      { id: 2, title: 'Climate Zones Explained', thumbnail: '🌡️', videoId: '5lYXj-5lWFg', channel: 'Crash Course' },
      { id: 3, title: 'Planet Earth', thumbnail: '🌎', videoId: 'i8r3roDnvh8', channel: 'BBC Earth' },
      { id: 4, title: 'Plate Tectonics', thumbnail: '🌋', videoId: 'pwODwwgE6rA', channel: 'National Geographic' },
      { id: 5, title: 'World Biomes', thumbnail: '🌲', videoId: 'bpj8ybJkYHs', channel: 'Crash Course' },
      { id: 6, title: 'Map Reading Skills', thumbnail: '🗺️', videoId: 'NAye4Ir_5Qs', channel: 'Geography Skills' },
    ]
  },
  computer: {
    topics: [
      { id: 1, title: 'Programming Basics', description: 'Variables, loops, and functions', duration: '30 min' },
      { id: 2, title: 'Web Development', description: 'HTML, CSS, and JavaScript', duration: '35 min' },
      { id: 3, title: 'Data Structures', description: 'Arrays, lists, and trees', duration: '30 min' },
      { id: 4, title: 'Algorithms', description: 'Sorting, searching, and optimization', duration: '35 min' },
      { id: 5, title: 'Computer Networks', description: 'Internet and protocols', duration: '25 min' },
    ],
    videos: [
      { id: 1, title: 'Programming for Beginners', thumbnail: '💻', videoId: 'zOjov-2OZ0E', channel: 'freeCodeCamp' },
      { id: 2, title: 'Web Development Course', thumbnail: '🌐', videoId: 'pQN-pnXPaVg', channel: 'freeCodeCamp' },
      { id: 3, title: 'Data Structures', thumbnail: '📊', videoId: 'RBSGKlAvoiM', channel: 'freeCodeCamp' },
      { id: 4, title: 'Python Full Course', thumbnail: '🐍', videoId: '_uQrJ0TkZlc', channel: 'Programming with Mosh' },
      { id: 5, title: 'JavaScript Tutorial', thumbnail: '⚡', videoId: 'PkZNo7MFNFg', channel: 'freeCodeCamp' },
      { id: 6, title: 'Algorithms Explained', thumbnail: '🔍', videoId: '8hly31xKli0', channel: 'CS Dojo' },
    ]
  },
  arts: {
    topics: [
      { id: 1, title: 'Art History', description: 'Major movements and artists', duration: '25 min' },
      { id: 2, title: 'Drawing Fundamentals', description: 'Lines, shapes, and shading', duration: '20 min' },
      { id: 3, title: 'Color Theory', description: 'Color wheel and harmonies', duration: '15 min' },
      { id: 4, title: 'Painting Techniques', description: 'Watercolor, acrylic, and oil', duration: '30 min' },
      { id: 5, title: 'Digital Art', description: 'Digital tools and techniques', duration: '25 min' },
    ],
    videos: [
      { id: 1, title: 'Art History Overview', thumbnail: '🎨', videoId: 'lB6Be0tkdBE', channel: 'Crash Course' },
      { id: 2, title: 'Drawing for Beginners', thumbnail: '✏️', videoId: 'ewMksAbgdBI', channel: 'Proko' },
      { id: 3, title: 'Color Theory Basics', thumbnail: '🖌️', videoId: 'Qj1FK8n7WgY', channel: 'Blender Guru' },
      { id: 4, title: 'Watercolor Techniques', thumbnail: '💧', videoId: 'ZiGKS8JhwP8', channel: 'Mind of Watercolor' },
      { id: 5, title: 'Digital Art Tutorial', thumbnail: '🖥️', videoId: 'iwRNeZAa-GY', channel: 'Aaron Blaise' },
      { id: 6, title: 'Portrait Drawing', thumbnail: '👤', videoId: 'VGLEKLFOSqU', channel: 'Proko' },
    ]
  }
};

export default function LearnScreen() {
  const [selectedSubject, setSelectedSubject] = useState('math');

  // Get current subject content
  const currentContent = SUBJECT_CONTENT[selectedSubject] || SUBJECT_CONTENT.math;
  const currentSubjectData = SUBJECTS.find(s => s.id === selectedSubject) || SUBJECTS[0];

  // Open YouTube video
  const openVideo = (videoId) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    Linking.openURL(url).catch(err => console.error('Error opening video:', err));
  };

  // Get subject icon
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

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <FadeInDown delay={0} style={styles.header}>
          <Text style={styles.title}>Learn</Text>
          <Text style={styles.subtitle}>Your personalized learning journey</Text>
        </FadeInDown>

        {/* Subject Selection - Horizontal Scroll */}
        <FadeInDown delay={100}>
          <Text style={styles.sectionTitle}>📖 Choose Subject</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subjectScroll}
            contentContainerStyle={styles.subjectScrollContent}
          >
            {SUBJECTS.slice(0, 10).map((subject, index) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectChip,
                  selectedSubject === subject.id && {
                    backgroundColor: subject.color,
                    borderColor: subject.color
                  }
                ]}
                onPress={() => setSelectedSubject(subject.id)}
              >
                <Ionicons
                  name={getSubjectIcon(subject.id)}
                  size={18}
                  color={selectedSubject === subject.id ? '#fff' : subject.color}
                />
                <Text style={[
                  styles.subjectChipText,
                  selectedSubject === subject.id && { color: '#fff' }
                ]}>
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FadeInDown>

        {/* Current Subject Header */}
        <FadeInDown delay={150}>
          <View style={[styles.subjectHeader, { backgroundColor: currentSubjectData.color + '15' }]}>
            <View style={[styles.subjectHeaderIcon, { backgroundColor: currentSubjectData.color }]}>
              <Ionicons name={getSubjectIcon(selectedSubject)} size={28} color="#fff" />
            </View>
            <View style={styles.subjectHeaderInfo}>
              <Text style={styles.subjectHeaderTitle}>{currentSubjectData.name}</Text>
              <Text style={styles.subjectHeaderStats}>
                {currentContent.topics.length} Topics • {currentContent.videos.length} Videos
              </Text>
            </View>
          </View>
        </FadeInDown>

        {/* Topics Section */}
        <FadeInDown delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Topics</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI Curated</Text>
            </View>
          </View>

          {currentContent.topics.map((topic, index) => (
            <FadeInUp key={topic.id} delay={250 + index * 50}>
              <TouchableOpacity style={styles.topicCard}>
                <View style={[styles.topicNumber, { backgroundColor: currentSubjectData.color + '20' }]}>
                  <Text style={[styles.topicNumberText, { color: currentSubjectData.color }]}>
                    {topic.id}
                  </Text>
                </View>
                <View style={styles.topicContent}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicDescription}>{topic.description}</Text>
                </View>
                <View style={styles.topicMeta}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.topicDuration}>{topic.duration}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </FadeInUp>
          ))}
        </FadeInDown>

        {/* YouTube Videos Section */}
        <FadeInDown delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎬 Video Lessons</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.videosScroll}
          >
            {currentContent.videos.map((video, index) => (
              <FadeInRight key={video.id} delay={450 + index * 100}>
                <TouchableOpacity
                  style={styles.videoCard}
                  onPress={() => openVideo(video.videoId)}
                >
                  <View style={[styles.videoThumbnail, { backgroundColor: currentSubjectData.color + '20' }]}>
                    <Text style={styles.videoEmoji}>{video.thumbnail}</Text>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={24} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                    <View style={styles.videoMeta}>
                      <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                      <Text style={styles.videoChannel}>{video.channel}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </FadeInRight>
            ))}
          </ScrollView>
        </FadeInDown>

        {/* Quick Tips */}
        <FadeInDown delay={500}>
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={24} color={Colors.accent} />
              <Text style={styles.tipsTitle}>Study Tip</Text>
            </View>
            <Text style={styles.tipsText}>
              Watch video lessons first, then practice with topics.
              Take quizzes to test your understanding! 🎯
            </Text>
          </View>
        </FadeInDown>

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
  header: {
    marginBottom: Spacing.lg,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  subjectScroll: {
    marginHorizontal: -Spacing.lg,
  },
  subjectScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  subjectChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.md,
  },
  subjectHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  subjectHeaderInfo: {
    flex: 1,
  },
  subjectHeaderTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  subjectHeaderStats: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  topicNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  topicNumberText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  topicDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
    gap: 4,
  },
  topicDuration: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  videosScroll: {
    marginHorizontal: -Spacing.lg,
    paddingLeft: Spacing.lg,
  },
  videoCard: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  videoThumbnail: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoEmoji: {
    fontSize: 48,
  },
  playButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: Spacing.md,
  },
  videoTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoChannel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  tipsCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.accent,
  },
  tipsText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 22,
  },
});
