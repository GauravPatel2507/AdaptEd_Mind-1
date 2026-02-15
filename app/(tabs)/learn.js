import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Image,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/Colors';
import { SUBJECTS } from '../../constants/Config';
import { FadeInDown, FadeInRight, FadeInUp } from '../../components/Animations';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Subject-specific topics with embedded YouTube videos per topic
const SUBJECT_CONTENT = {
  c_programming: {
    topics: [
      {
        id: 1, title: 'Introduction to C', description: 'History, structure, compilation process', duration: '20 min',
        videos: [
          { id: 1, title: 'C Programming Full Course', thumbnail: '💻', videoId: 'KJgsSFOSQv0', channel: 'freeCodeCamp' },
          { id: 3, title: 'C in 100 Seconds', thumbnail: '⚡', videoId: 'U3aXWizDbQ4', channel: 'Fireship' },
        ]
      },
      {
        id: 2, title: 'Data Types & Operators', description: 'Variables, constants, type casting', duration: '25 min',
        videos: [
          { id: 4, title: 'C Programming for Beginners', thumbnail: '📘', videoId: 'ss0B62SKaOk', channel: 'Programiz' },
        ]
      },
      {
        id: 3, title: 'Control Structures', description: 'If-else, switch, loops', duration: '25 min',
        videos: [
          { id: 4, title: 'C Programming for Beginners', thumbnail: '📘', videoId: 'ss0B62SKaOk', channel: 'Programiz' },
        ]
      },
      {
        id: 4, title: 'Functions & Recursion', description: 'Function types, call by value/reference', duration: '30 min',
        videos: [
          { id: 6, title: 'File Handling in C', thumbnail: '📂', videoId: 'WljVkCfG1jI', channel: 'Neso Academy' },
          { id: 1, title: 'C Programming Full Course', thumbnail: '💻', videoId: 'KJgsSFOSQv0', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 5, title: 'Pointers & Memory', description: 'Pointer arithmetic, dynamic allocation', duration: '35 min',
        videos: [
          { id: 2, title: 'Pointers in C Explained', thumbnail: '👉', videoId: 'zuegQmMdy8M', channel: 'freeCodeCamp' },
          { id: 5, title: 'Dynamic Memory in C', thumbnail: '🧠', videoId: 'xDVC3wKjS64', channel: 'mycodeschool' },
        ]
      },
    ],
  },
  data_structures: {
    topics: [
      {
        id: 1, title: 'Arrays & Linked Lists', description: 'Linear data structures basics', duration: '25 min',
        videos: [
          { id: 1, title: 'Data Structures Full Course', thumbnail: '🌳', videoId: 'RBSGKlAvoiM', channel: 'freeCodeCamp' },
          { id: 2, title: 'Linked List in 6 Minutes', thumbnail: '🔗', videoId: 'HB7TcYklBHY', channel: 'CS Dojo' },
        ]
      },
      {
        id: 2, title: 'Stacks & Queues', description: 'LIFO, FIFO, implementations', duration: '25 min',
        videos: [
          { id: 6, title: 'Stack vs Queue', thumbnail: '📚', videoId: 'wjI1WNcIntg', channel: 'mycodeschool' },
        ]
      },
      {
        id: 3, title: 'Trees & BST', description: 'Binary trees, traversals, BST operations', duration: '30 min',
        videos: [
          { id: 3, title: 'Binary Trees Explained', thumbnail: '🌲', videoId: 'fAAZixBzIAI', channel: 'mycodeschool' },
        ]
      },
      {
        id: 4, title: 'Graphs', description: 'BFS, DFS, adjacency representations', duration: '35 min',
        videos: [
          { id: 4, title: 'Graph Algorithms', thumbnail: '📊', videoId: 'tWVWeAqZ0WU', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 5, title: 'Hashing & Heaps', description: 'Hash tables, priority queues', duration: '30 min',
        videos: [
          { id: 5, title: 'Hash Tables Explained', thumbnail: '#️⃣', videoId: 'shs0KM3wKv8', channel: 'CS Dojo' },
        ]
      },
    ],
  },
  oop: {
    topics: [
      {
        id: 1, title: 'Classes & Objects', description: 'Encapsulation, constructors, this keyword', duration: '25 min',
        videos: [
          { id: 1, title: 'OOP in Java Full Course', thumbnail: '☕', videoId: 'xk4_1vDrzzo', channel: 'Bro Code' },
          { id: 2, title: 'OOP in Python', thumbnail: '🐍', videoId: 'Ej_02ICOIgs', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 2, title: 'Inheritance & Polymorphism', description: 'Method overriding, abstract classes', duration: '30 min',
        videos: [
          { id: 6, title: 'Polymorphism Explained', thumbnail: '🔄', videoId: 'jhDUxynEQRI', channel: 'Programming with Mosh' },
          { id: 3, title: 'C++ OOP Crash Course', thumbnail: '⚙️', videoId: 'wN0x9eZLix4', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 3, title: 'Interfaces & Abstraction', description: 'Interfaces, abstract methods, design', duration: '25 min',
        videos: [
          { id: 4, title: 'SOLID Principles', thumbnail: '🧱', videoId: '_jDNAf3CzeY', channel: 'Fireship' },
        ]
      },
      {
        id: 4, title: 'Design Patterns', description: 'Singleton, Factory, Observer patterns', duration: '35 min',
        videos: [
          { id: 5, title: 'Design Patterns Explained', thumbnail: '🏗️', videoId: 'tv-_1er1mWI', channel: 'Fireship' },
        ]
      },
      {
        id: 5, title: 'Exception Handling', description: 'Try-catch, custom exceptions, best practices', duration: '20 min',
        videos: [
          { id: 1, title: 'OOP in Java Full Course', thumbnail: '☕', videoId: 'xk4_1vDrzzo', channel: 'Bro Code' },
        ]
      },
    ],
  },
  dbms: {
    topics: [
      {
        id: 1, title: 'ER Model & Relations', description: 'Entity-relationship diagrams, keys', duration: '25 min',
        videos: [
          { id: 2, title: 'Database Design Course', thumbnail: '📐', videoId: 'ztHopE5Wnpc', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 2, title: 'SQL Fundamentals', description: 'SELECT, JOIN, subqueries, aggregation', duration: '30 min',
        videos: [
          { id: 1, title: 'SQL Full Course', thumbnail: '🗄️', videoId: 'HXV3zeQKqGY', channel: 'freeCodeCamp' },
          { id: 5, title: 'SQL Joins Explained', thumbnail: '🔗', videoId: '9yeOJ0ZMUYw', channel: 'Joey Blue' },
        ]
      },
      {
        id: 3, title: 'Normalization', description: '1NF, 2NF, 3NF, BCNF', duration: '25 min',
        videos: [
          { id: 3, title: 'Normalization Explained', thumbnail: '📊', videoId: 'UrYLYV7WSHM', channel: 'Decomplexify' },
        ]
      },
      {
        id: 4, title: 'Transactions & ACID', description: 'Concurrency control, serializability', duration: '30 min',
        videos: [
          { id: 6, title: 'ACID Properties', thumbnail: '⚗️', videoId: 'yaQ5YMWkxq4', channel: 'Hussein Nasser' },
        ]
      },
      {
        id: 5, title: 'Indexing & NoSQL', description: 'B-trees, hashing, MongoDB basics', duration: '25 min',
        videos: [
          { id: 4, title: 'MongoDB Crash Course', thumbnail: '🍃', videoId: 'ofme2o29ngU', channel: 'Web Dev Simplified' },
        ]
      },
    ],
  },
  os: {
    topics: [
      {
        id: 1, title: 'Process Management', description: 'Processes, threads, scheduling algorithms', duration: '30 min',
        videos: [
          { id: 1, title: 'Operating Systems Full Course', thumbnail: '🖥️', videoId: 'yK1uBHPdp30', channel: 'Neso Academy' },
          { id: 2, title: 'Process vs Thread', thumbnail: '🔀', videoId: 'exbKr6fnoUw', channel: 'IBM Technology' },
          { id: 5, title: 'CPU Scheduling', thumbnail: '⏱️', videoId: '2h3eWaPx8SA', channel: 'Neso Academy' },
        ]
      },
      {
        id: 2, title: 'Memory Management', description: 'Paging, segmentation, virtual memory', duration: '30 min',
        videos: [
          { id: 3, title: 'Virtual Memory Explained', thumbnail: '🧠', videoId: 'A9WLYbE0p-I', channel: 'Computerphile' },
        ]
      },
      {
        id: 3, title: 'File Systems', description: 'File allocation, directory structures', duration: '25 min',
        videos: [
          { id: 6, title: 'Linux OS Internals', thumbnail: '🐧', videoId: 'wBp0Rb-ZJak', channel: 'The Linux Channel' },
        ]
      },
      {
        id: 4, title: 'Deadlocks', description: 'Detection, prevention, avoidance strategies', duration: '25 min',
        videos: [
          { id: 4, title: 'Deadlock Explained', thumbnail: '🔒', videoId: 'UVo9mGARkhQ', channel: 'Neso Academy' },
        ]
      },
      {
        id: 5, title: 'Synchronization', description: 'Semaphores, monitors, critical sections', duration: '30 min',
        videos: [
          { id: 1, title: 'Operating Systems Full Course', thumbnail: '🖥️', videoId: 'yK1uBHPdp30', channel: 'Neso Academy' },
        ]
      },
    ],
  },
  networks: {
    topics: [
      {
        id: 1, title: 'OSI & TCP/IP Model', description: 'Network layers and protocols', duration: '25 min',
        videos: [
          { id: 1, title: 'Computer Networking Full Course', thumbnail: '🌐', videoId: 'qiQR5rTSshw', channel: 'freeCodeCamp' },
          { id: 3, title: 'OSI Model Explained', thumbnail: '📶', videoId: 'vv4y_uOneC0', channel: 'TechTerms' },
        ]
      },
      {
        id: 2, title: 'IP Addressing & Subnetting', description: 'IPv4, IPv6, CIDR notation', duration: '30 min',
        videos: [
          { id: 2, title: 'Subnetting Made Easy', thumbnail: '🔢', videoId: 'ecCuyq-Wprc', channel: 'Practical Networking' },
        ]
      },
      {
        id: 3, title: 'Routing & Switching', description: 'Routing algorithms, VLANs', duration: '30 min',
        videos: [
          { id: 1, title: 'Computer Networking Full Course', thumbnail: '🌐', videoId: 'qiQR5rTSshw', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 4, title: 'Transport Layer', description: 'TCP, UDP, flow control', duration: '25 min',
        videos: [
          { id: 4, title: 'TCP vs UDP', thumbnail: '📡', videoId: 'uwoD5YsGACg', channel: 'Fireship' },
        ]
      },
      {
        id: 5, title: 'Application Layer Protocols', description: 'HTTP, DNS, SMTP, FTP', duration: '25 min',
        videos: [
          { id: 5, title: 'DNS Explained', thumbnail: '🔍', videoId: '72snZctFFtA', channel: 'Fireship' },
          { id: 6, title: 'How HTTPS Works', thumbnail: '🔒', videoId: 'j9QmMEWmcfo', channel: 'ByteByteGo' },
        ]
      },
    ],
  },
  software_eng: {
    topics: [
      {
        id: 1, title: 'SDLC Models', description: 'Waterfall, Agile, Spiral, V-model', duration: '25 min',
        videos: [
          { id: 1, title: 'Software Engineering Basics', thumbnail: '⚙️', videoId: 'O753uuutqH8', channel: 'freeCodeCamp' },
          { id: 2, title: 'Agile vs Waterfall', thumbnail: '🔄', videoId: 'GzzkpAOxHXs', channel: 'Atlassian' },
        ]
      },
      {
        id: 2, title: 'Requirements Engineering', description: 'SRS, use cases, user stories', duration: '20 min',
        videos: [
          { id: 3, title: 'UML Diagrams Course', thumbnail: '📐', videoId: 'WnMQ8HlmeXc', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 3, title: 'Software Design', description: 'UML diagrams, architectural patterns', duration: '30 min',
        videos: [
          { id: 3, title: 'UML Diagrams Course', thumbnail: '📐', videoId: 'WnMQ8HlmeXc', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 4, title: 'Testing & QA', description: 'Unit, integration, system testing', duration: '25 min',
        videos: [
          { id: 1, title: 'Software Engineering Basics', thumbnail: '⚙️', videoId: 'O753uuutqH8', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 5, title: 'DevOps & CI/CD', description: 'Git, Docker, Jenkins pipelines', duration: '30 min',
        videos: [
          { id: 4, title: 'Git & GitHub Crash Course', thumbnail: '🐙', videoId: 'RGOj5yH7evk', channel: 'Traversy Media' },
          { id: 5, title: 'Docker in 1 Hour', thumbnail: '🐳', videoId: 'pTFZFxd4hOI', channel: 'Programming with Mosh' },
          { id: 6, title: 'CI/CD Explained', thumbnail: '🚀', videoId: 'scEDHsr3APg', channel: 'Fireship' },
        ]
      },
    ],
  },
  web_tech: {
    topics: [
      {
        id: 1, title: 'HTML & CSS Fundamentals', description: 'Page structure, Flexbox, Grid', duration: '25 min',
        videos: [
          { id: 1, title: 'HTML & CSS Full Course', thumbnail: '🌐', videoId: 'mU6anWqZJcc', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 2, title: 'JavaScript Essentials', description: 'ES6+, DOM manipulation, async', duration: '30 min',
        videos: [
          { id: 2, title: 'JavaScript in 1 Hour', thumbnail: '⚡', videoId: 'PkZNo7MFNFg', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 3, title: 'React & Frontend Frameworks', description: 'Components, hooks, state management', duration: '35 min',
        videos: [
          { id: 3, title: 'React JS Full Course', thumbnail: '⚛️', videoId: 'bMknfKXIFA8', channel: 'freeCodeCamp' },
          { id: 6, title: 'Next.js in 100 Seconds', thumbnail: '▲', videoId: 'Sklc_fQBmcs', channel: 'Fireship' },
        ]
      },
      {
        id: 4, title: 'Node.js & Backend', description: 'Express, REST APIs, middleware', duration: '30 min',
        videos: [
          { id: 4, title: 'Node.js Tutorial', thumbnail: '🟢', videoId: 'Oe421EPjeBE', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 5, title: 'Full-Stack Projects', description: 'MERN stack, deployment, hosting', duration: '35 min',
        videos: [
          { id: 5, title: 'MERN Stack Project', thumbnail: '🏗️', videoId: '-0exw-9YJBo', channel: 'JavaScript Mastery' },
        ]
      },
    ],
  },
  comp_org: {
    topics: [
      {
        id: 1, title: 'Number Systems & Boolean Algebra', description: 'Binary, octal, hex, logic gates', duration: '25 min',
        videos: [
          { id: 3, title: 'Logic Gates Explained', thumbnail: '🔌', videoId: 'fw-N9P38mi4', channel: 'Crash Course' },
        ]
      },
      {
        id: 2, title: 'Combinational Circuits', description: 'Adders, multiplexers, decoders', duration: '25 min',
        videos: [
          { id: 1, title: 'Computer Architecture Full Course', thumbnail: '🔧', videoId: 'F3kAL_TdEzo', channel: 'Neso Academy' },
        ]
      },
      {
        id: 3, title: 'Sequential Circuits', description: 'Flip-flops, registers, counters', duration: '25 min',
        videos: [
          { id: 1, title: 'Computer Architecture Full Course', thumbnail: '🔧', videoId: 'F3kAL_TdEzo', channel: 'Neso Academy' },
        ]
      },
      {
        id: 4, title: 'CPU Architecture', description: 'ALU, control unit, instruction cycle', duration: '30 min',
        videos: [
          { id: 2, title: 'How CPU Works', thumbnail: '⚙️', videoId: 'cNN_tTXABkM', channel: 'In One Lesson' },
          { id: 5, title: 'Assembly Language Tutorial', thumbnail: '🔢', videoId: 'wLXIWKUWpSs', channel: 'Fireship' },
          { id: 6, title: 'Pipelining in CPU', thumbnail: '🏭', videoId: 'FhRXmjudRHE', channel: 'Neso Academy' },
        ]
      },
      {
        id: 5, title: 'Memory Hierarchy & I/O', description: 'Cache, RAM, DMA, interrupts', duration: '30 min',
        videos: [
          { id: 4, title: 'Cache Memory Explained', thumbnail: '💾', videoId: '6JpLD3PUAZk', channel: 'Computerphile' },
        ]
      },
    ],
  },
  discrete_math: {
    topics: [
      {
        id: 1, title: 'Propositional Logic', description: 'Truth tables, logical equivalences', duration: '20 min',
        videos: [
          { id: 3, title: 'Logic & Proofs', thumbnail: '🧮', videoId: 'OM1ANmsKD24', channel: 'Kimberly Brehm' },
          { id: 1, title: 'Discrete Math Full Course', thumbnail: '🔢', videoId: 'rdXw7Ps9vxc', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 2, title: 'Set Theory & Relations', description: 'Sets, functions, relations, equivalence', duration: '25 min',
        videos: [
          { id: 5, title: 'Set Theory Basics', thumbnail: '📐', videoId: 'yCwnifwVjIg', channel: 'Eddie Woo' },
          { id: 6, title: 'Relations & Functions', thumbnail: '↔️', videoId: 'ouipbDkwHWA', channel: 'Neso Academy' },
        ]
      },
      {
        id: 3, title: 'Graph Theory', description: 'Euler/Hamilton paths, planar graphs, coloring', duration: '30 min',
        videos: [
          { id: 2, title: 'Graph Theory Intro', thumbnail: '📊', videoId: 'LFKZLXVO-Dg', channel: 'Reducible' },
        ]
      },
      {
        id: 4, title: 'Combinatorics', description: 'Permutations, combinations, pigeonhole', duration: '25 min',
        videos: [
          { id: 4, title: 'Combinatorics Crash Course', thumbnail: '🎲', videoId: 'p8vIcmr_Pqo', channel: 'Crash Course' },
        ]
      },
      {
        id: 5, title: 'Recurrence Relations', description: 'Solving recurrences, generating functions', duration: '30 min',
        videos: [
          { id: 1, title: 'Discrete Math Full Course', thumbnail: '🔢', videoId: 'rdXw7Ps9vxc', channel: 'freeCodeCamp' },
        ]
      },
    ],
  },
  algorithms: {
    topics: [
      {
        id: 1, title: 'Asymptotic Analysis', description: 'Big-O, Omega, Theta notation', duration: '20 min',
        videos: [
          { id: 2, title: 'Big-O Notation Explained', thumbnail: '📈', videoId: 'BgLTDT03QtU', channel: 'NeetCode' },
          { id: 1, title: 'Algorithms Full Course', thumbnail: '🎯', videoId: '8hly31xKli0', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 2, title: 'Divide & Conquer', description: 'Merge sort, quick sort, binary search', duration: '30 min',
        videos: [
          { id: 4, title: 'Sorting Algorithms Visualized', thumbnail: '📊', videoId: 'kPRA0W1kECg', channel: 'Timo Bingmann' },
        ]
      },
      {
        id: 3, title: 'Greedy Algorithms', description: 'Activity selection, Huffman coding', duration: '25 min',
        videos: [
          { id: 5, title: 'Greedy Algorithms', thumbnail: '💡', videoId: 'bC7o8P_Ste4', channel: 'Abdul Bari' },
        ]
      },
      {
        id: 4, title: 'Dynamic Programming', description: 'Memoization, tabulation, classic problems', duration: '35 min',
        videos: [
          { id: 3, title: 'Dynamic Programming', thumbnail: '🧩', videoId: 'oBt53YbR9Kk', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 5, title: 'Backtracking & Branch and Bound', description: 'N-Queens, subset sum, TSP', duration: '30 min',
        videos: [
          { id: 6, title: 'Backtracking Explained', thumbnail: '🔙', videoId: 'Zq4upTEaQyM', channel: 'NeetCode' },
        ]
      },
    ],
  },
  ai: {
    topics: [
      {
        id: 1, title: 'Introduction to AI', description: 'History, Turing test, intelligent agents', duration: '20 min',
        videos: [
          { id: 1, title: 'AI Full Course', thumbnail: '🤖', videoId: 'JMUxmLyrhSk', channel: 'Edureka' },
          { id: 2, title: 'AI in 100 Seconds', thumbnail: '⚡', videoId: 'PeMlggyqz0Y', channel: 'Fireship' },
          { id: 6, title: 'AI vs ML vs DL', thumbnail: '📊', videoId: 'pXJfyj2MXZE', channel: 'Simplilearn' },
        ]
      },
      {
        id: 2, title: 'Search Algorithms', description: 'BFS, DFS, A*, heuristics', duration: '30 min',
        videos: [
          { id: 4, title: 'A* Search Algorithm', thumbnail: '🔍', videoId: '-L-WgKMFuhE', channel: 'Computerphile' },
        ]
      },
      {
        id: 3, title: 'Knowledge Representation', description: 'Propositional & predicate logic', duration: '25 min',
        videos: [
          { id: 1, title: 'AI Full Course', thumbnail: '🤖', videoId: 'JMUxmLyrhSk', channel: 'Edureka' },
        ]
      },
      {
        id: 4, title: 'Natural Language Processing', description: 'Tokenization, NER, sentiment analysis', duration: '30 min',
        videos: [
          { id: 3, title: 'NLP with Python', thumbnail: '💬', videoId: 'xvqsFTUsOmc', channel: 'freeCodeCamp' },
          { id: 5, title: 'ChatGPT & LLMs Explained', thumbnail: '🧠', videoId: '5sLYAQS9sWQ', channel: '3Blue1Brown' },
        ]
      },
      {
        id: 5, title: 'AI Ethics & Applications', description: 'Bias, fairness, real-world AI systems', duration: '25 min',
        videos: [
          { id: 2, title: 'AI in 100 Seconds', thumbnail: '⚡', videoId: 'PeMlggyqz0Y', channel: 'Fireship' },
        ]
      },
    ],
  },
  ml: {
    topics: [
      {
        id: 1, title: 'Supervised Learning', description: 'Linear regression, classification, SVM', duration: '30 min',
        videos: [
          { id: 1, title: 'Machine Learning Full Course', thumbnail: '🤖', videoId: 'NWONeJKn6kc', channel: 'freeCodeCamp' },
          { id: 3, title: 'ML with Python', thumbnail: '🐍', videoId: '7eh4d6sabA0', channel: 'Programming with Mosh' },
        ]
      },
      {
        id: 2, title: 'Unsupervised Learning', description: 'K-means, PCA, clustering techniques', duration: '25 min',
        videos: [
          { id: 6, title: 'Random Forest Explained', thumbnail: '🌲', videoId: 'J4Wdy0Wc_xQ', channel: 'StatQuest' },
        ]
      },
      {
        id: 3, title: 'Neural Networks', description: 'Perceptron, backpropagation, activation functions', duration: '35 min',
        videos: [
          { id: 2, title: 'Neural Networks Explained', thumbnail: '🧠', videoId: 'aircAruvnKk', channel: '3Blue1Brown' },
        ]
      },
      {
        id: 4, title: 'Deep Learning', description: 'CNNs, RNNs, transformers basics', duration: '35 min',
        videos: [
          { id: 4, title: 'Deep Learning Crash Course', thumbnail: '🔬', videoId: 'VyWAvY2CF9c', channel: 'freeCodeCamp' },
          { id: 5, title: 'TensorFlow in 10 Minutes', thumbnail: '📐', videoId: 'tpCFfeUEGs8', channel: 'Fireship' },
        ]
      },
      {
        id: 5, title: 'Model Evaluation', description: 'Cross-validation, precision, recall, F1', duration: '20 min',
        videos: [
          { id: 1, title: 'Machine Learning Full Course', thumbnail: '🤖', videoId: 'NWONeJKn6kc', channel: 'freeCodeCamp' },
        ]
      },
    ],
  },
  cloud: {
    topics: [
      {
        id: 1, title: 'Cloud Fundamentals', description: 'IaaS, PaaS, SaaS, deployment models', duration: '20 min',
        videos: [
          { id: 1, title: 'Cloud Computing Full Course', thumbnail: '☁️', videoId: 'M988_fsOSWo', channel: 'Edureka' },
          { id: 2, title: 'AWS in 10 Minutes', thumbnail: '🟠', videoId: 'r4YIdn2eTm4', channel: 'Fireship' },
        ]
      },
      {
        id: 2, title: 'AWS Core Services', description: 'EC2, S3, Lambda, RDS', duration: '30 min',
        videos: [
          { id: 2, title: 'AWS in 10 Minutes', thumbnail: '🟠', videoId: 'r4YIdn2eTm4', channel: 'Fireship' },
          { id: 5, title: 'Azure Fundamentals', thumbnail: '🔵', videoId: 'NKEFWyqJ5XA', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 3, title: 'Containerization', description: 'Docker, Kubernetes basics', duration: '30 min',
        videos: [
          { id: 3, title: 'Docker Crash Course', thumbnail: '🐳', videoId: 'pg19Z8LL06w', channel: 'TechWorld with Nana' },
          { id: 4, title: 'Kubernetes Explained', thumbnail: '⎈', videoId: 'X48VuDVv0do', channel: 'TechWorld with Nana' },
        ]
      },
      {
        id: 4, title: 'Serverless Architecture', description: 'Functions, event-driven, API Gateway', duration: '25 min',
        videos: [
          { id: 6, title: 'Serverless in 100 Seconds', thumbnail: '⚡', videoId: 'W_VV2Fx32_Y', channel: 'Fireship' },
        ]
      },
      {
        id: 5, title: 'Cloud Security', description: 'IAM, encryption, compliance', duration: '25 min',
        videos: [
          { id: 1, title: 'Cloud Computing Full Course', thumbnail: '☁️', videoId: 'M988_fsOSWo', channel: 'Edureka' },
        ]
      },
    ],
  },
  cyber: {
    topics: [
      {
        id: 1, title: 'Security Fundamentals', description: 'CIA triad, threats, vulnerabilities', duration: '20 min',
        videos: [
          { id: 1, title: 'Cybersecurity Full Course', thumbnail: '🔒', videoId: 'U_P23SqJaDc', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 2, title: 'Cryptography', description: 'Symmetric, asymmetric, hashing, PKI', duration: '30 min',
        videos: [
          { id: 3, title: 'Cryptography Explained', thumbnail: '🔐', videoId: 'jhXCTbFnK8o', channel: 'Fireship' },
        ]
      },
      {
        id: 3, title: 'Network Security', description: 'Firewalls, IDS/IPS, VPN', duration: '25 min',
        videos: [
          { id: 6, title: 'How VPNs Work', thumbnail: '🛡️', videoId: 'WVDQEoe6ZWY', channel: 'Fireship' },
        ]
      },
      {
        id: 4, title: 'Ethical Hacking', description: 'Penetration testing, OWASP Top 10', duration: '30 min',
        videos: [
          { id: 2, title: 'Ethical Hacking Course', thumbnail: '🎭', videoId: '3Kq1MIfTWCE', channel: 'freeCodeCamp' },
          { id: 4, title: 'OWASP Top 10', thumbnail: '🕷️', videoId: 'rWHvp7rUka8', channel: 'OWASP' },
        ]
      },
      {
        id: 5, title: 'Incident Response', description: 'Forensics, threat hunting, SIEM', duration: '25 min',
        videos: [
          { id: 5, title: 'Linux for Hackers', thumbnail: '🐧', videoId: 'VbEx7B_PTOE', channel: 'NetworkChuck' },
        ]
      },
    ],
  },
  mobile_dev: {
    topics: [
      {
        id: 1, title: 'Mobile App Fundamentals', description: 'Native vs cross-platform, architecture', duration: '20 min',
        videos: [
          { id: 6, title: 'React Native in 100 Seconds', thumbnail: '⚡', videoId: 'gvkqT_Uoahw', channel: 'Fireship' },
        ]
      },
      {
        id: 2, title: 'React Native', description: 'Components, navigation, state management', duration: '35 min',
        videos: [
          { id: 1, title: 'React Native Full Course', thumbnail: '📱', videoId: 'obH0Po_RdWk', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 3, title: 'Flutter & Dart', description: 'Widgets, layouts, material design', duration: '35 min',
        videos: [
          { id: 2, title: 'Flutter Crash Course', thumbnail: '🦋', videoId: 'x0uinJvhNxI', channel: 'Fireship' },
        ]
      },
      {
        id: 4, title: 'Mobile UI/UX Design', description: 'Design principles, responsive layouts', duration: '25 min',
        videos: [
          { id: 3, title: 'Android Development', thumbnail: '🤖', videoId: 'fis26HvvDII', channel: 'freeCodeCamp' },
          { id: 4, title: 'iOS Development with Swift', thumbnail: '🍎', videoId: 'comQ1-x2a1Q', channel: 'CodeWithChris' },
        ]
      },
      {
        id: 5, title: 'Publishing Apps', description: 'Play Store, App Store, CI/CD for mobile', duration: '20 min',
        videos: [
          { id: 5, title: 'Kotlin for Android', thumbnail: '🟣', videoId: 'F9UC9DY-vIU', channel: 'freeCodeCamp' },
        ]
      },
    ],
  },
  big_data: {
    topics: [
      {
        id: 1, title: 'Big Data Concepts', description: "5 V's, distributed computing basics", duration: '20 min',
        videos: [
          { id: 1, title: 'Big Data Full Course', thumbnail: '📊', videoId: 'KCEPoPJ8sYc', channel: 'Edureka' },
        ]
      },
      {
        id: 2, title: 'Hadoop Ecosystem', description: 'HDFS, MapReduce, YARN', duration: '30 min',
        videos: [
          { id: 2, title: 'Hadoop Tutorial', thumbnail: '🐘', videoId: 'aReuLtY0YMI', channel: 'Edureka' },
        ]
      },
      {
        id: 3, title: 'Apache Spark', description: 'RDDs, DataFrames, Spark SQL', duration: '30 min',
        videos: [
          { id: 3, title: 'Apache Spark Course', thumbnail: '⚡', videoId: '_C8kWso4ne4', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 4, title: 'Data Pipelines', description: 'Kafka, Airflow, ETL processes', duration: '25 min',
        videos: [
          { id: 4, title: 'Apache Kafka Explained', thumbnail: '📡', videoId: 'uvb00oaa3k8', channel: 'IBM Technology' },
          { id: 6, title: 'ETL Explained', thumbnail: '🔄', videoId: 'OW5OgsLpDCQ', channel: 'IBM Technology' },
        ]
      },
      {
        id: 5, title: 'Data Warehousing', description: 'Star schema, OLAP, data lakes', duration: '25 min',
        videos: [
          { id: 5, title: 'Data Engineering Roadmap', thumbnail: '🗺️', videoId: 'qWru-b6m3uo', channel: 'Fireship' },
        ]
      },
    ],
  },
  data_science: {
    topics: [
      {
        id: 1, title: 'Data Science Workflow', description: 'Data collection, cleaning, EDA', duration: '20 min',
        videos: [
          { id: 1, title: 'Data Science Full Course', thumbnail: '📊', videoId: 'ua-CiDNNj30', channel: 'freeCodeCamp' },
          { id: 5, title: 'Jupyter Notebook Tutorial', thumbnail: '📓', videoId: 'HW29067qVWk', channel: 'Corey Schafer' },
        ]
      },
      {
        id: 2, title: 'Python for Data Science', description: 'NumPy, Pandas, Matplotlib', duration: '30 min',
        videos: [
          { id: 2, title: 'Python Pandas Tutorial', thumbnail: '🐼', videoId: 'vmEHCJofslg', channel: 'Programming with Mosh' },
        ]
      },
      {
        id: 3, title: 'Statistical Analysis', description: 'Hypothesis testing, distributions', duration: '25 min',
        videos: [
          { id: 3, title: 'Statistics Fundamentals', thumbnail: '📈', videoId: 'xxpc-HPKN28', channel: 'StatQuest' },
        ]
      },
      {
        id: 4, title: 'Data Visualization', description: 'Seaborn, Plotly, dashboard design', duration: '25 min',
        videos: [
          { id: 4, title: 'Data Visualization with Python', thumbnail: '📉', videoId: 'GGL6U0bDzGk', channel: 'freeCodeCamp' },
        ]
      },
      {
        id: 5, title: 'Predictive Modeling', description: 'Regression, classification, pipelines', duration: '30 min',
        videos: [
          { id: 6, title: 'Kaggle Competition Walk-through', thumbnail: '🏆', videoId: 'GrLlNnQIjwE', channel: 'Ken Jee' },
        ]
      },
    ],
  }
};

// Count total videos across all topics for a subject
const getTotalVideos = (topics) => {
  const videoIds = new Set();
  topics.forEach(topic => {
    (topic.videos || []).forEach(v => videoIds.add(v.videoId));
  });
  return videoIds.size;
};

const PROGRESS_KEY = 'lessonProgress';

export default function LearnScreen() {
  const { user } = useAuth();
  const router = require('expo-router').useRouter();
  const [selectedSubject, setSelectedSubject] = useState('c_programming');
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);
  // Tracks completed topics per subject: { [subjectId]: [topicId, ...] }
  const [completedTopics, setCompletedTopics] = useState({});

  // Get current subject content
  const currentContent = SUBJECT_CONTENT[selectedSubject] || SUBJECT_CONTENT.c_programming;
  const currentSubjectData = SUBJECTS.find(s => s.id === selectedSubject) || SUBJECTS[0];

  // Load progress + last activity on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedActivity, storedProgress] = await Promise.all([
          AsyncStorage.getItem('lastLearningActivity'),
          AsyncStorage.getItem(PROGRESS_KEY),
        ]);
        if (storedActivity) setLastActivity(JSON.parse(storedActivity));
        if (storedProgress) setCompletedTopics(JSON.parse(storedProgress));
      } catch (e) {
        console.log('Error loading learn data:', e);
      }
    };
    loadData();
  }, []);

  // Save progress to AsyncStorage whenever it changes
  const saveProgress = useCallback(async (newProgress) => {
    try {
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
    } catch (e) {
      console.log('Error saving progress:', e);
    }
  }, []);

  // Mark a topic as completed
  const markTopicComplete = useCallback((subjectId, topicId) => {
    setCompletedTopics(prev => {
      const subjectCompleted = prev[subjectId] || [];
      if (subjectCompleted.includes(topicId)) return prev;
      const updated = { ...prev, [subjectId]: [...subjectCompleted, topicId] };
      saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  // Get topic status: 'completed' | 'available' (no locking)
  const getTopicStatus = useCallback((subjectId, topicId) => {
    const completed = completedTopics[subjectId] || [];
    if (completed.includes(topicId)) return 'completed';
    return 'available';
  }, [completedTopics]);

  // Subject progress: completed count / total
  const subjectProgress = useMemo(() => {
    const completed = (completedTopics[selectedSubject] || []).length;
    const total = currentContent.topics.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [completedTopics, selectedSubject, currentContent]);

  // Find first incomplete topic across all subjects (current subject first)
  const findNextLesson = useCallback(() => {
    // Check current subject first
    const checkSubject = (subjectId) => {
      const content = SUBJECT_CONTENT[subjectId];
      if (!content) return null;
      const completed = completedTopics[subjectId] || [];
      for (let i = 0; i < content.topics.length; i++) {
        const topic = content.topics[i];
        if (!completed.includes(topic.id)) {
          const subjectData = SUBJECTS.find(s => s.id === subjectId);
          return { subjectId, topicId: topic.id, topicTitle: topic.title, subjectName: subjectData?.name || subjectId };
        }
      }
      return null; // all completed
    };

    // Try current subject first
    const current = checkSubject(selectedSubject);
    if (current) return current;

    // Try all other subjects with content
    for (const subjectId of Object.keys(SUBJECT_CONTENT)) {
      if (subjectId === selectedSubject) continue;
      const found = checkSubject(subjectId);
      if (found) return found;
    }
    return null; // everything completed
  }, [completedTopics, selectedSubject]);

  // Save activity to Firestore and AsyncStorage
  const trackActivity = useCallback(async (activityData) => {
    const activity = {
      ...activityData,
      userId: user?.uid || 'anonymous',
      timestamp: new Date().toISOString(),
    };
    try {
      await AsyncStorage.setItem('lastLearningActivity', JSON.stringify(activity));
      setLastActivity(activity);
    } catch (e) {
      console.log('Error saving activity locally:', e);
    }
    if (user) {
      try {
        await addDoc(collection(db, 'learningActivity'), activity);
      } catch (e) {
        console.log('Error saving activity to Firebase:', e);
      }
    }
  }, [user]);

  // Open YouTube video with tracking + mark topic complete
  const openVideo = (videoId, videoTitle, topicTitle, topicId) => {
    trackActivity({
      type: 'video_watch',
      subjectId: selectedSubject,
      subjectName: currentSubjectData.name,
      topicTitle,
      topicId,
      videoId,
      videoTitle,
    });
    // Mark the topic as completed when user watches a video
    markTopicComplete(selectedSubject, topicId);
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    Linking.openURL(url).catch(err => console.error('Error opening video:', err));
  };

  // Get subject icon from SUBJECTS config
  const getSubjectIcon = (subjectId) => {
    const subject = SUBJECTS.find(s => s.id === subjectId);
    return subject?.icon || 'school';
  };

  // Toggle topic expansion with tracking
  const toggleTopic = (topicId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const isExpanding = expandedTopic !== topicId;
    setExpandedTopic(isExpanding ? topicId : null);
    if (isExpanding) {
      const topic = currentContent.topics.find(t => t.id === topicId);
      if (topic) {
        trackActivity({
          type: 'topic_view',
          subjectId: selectedSubject,
          subjectName: currentSubjectData.name,
          topicId,
          topicTitle: topic.title,
        });
      }
    }
  };

  // Continue Learning: find first incomplete topic and navigate to it
  const handleContinueLearning = useCallback(() => {
    const next = findNextLesson();
    if (next) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedSubject(next.subjectId);
      setExpandedTopic(next.topicId);
    } else {
      // All lessons complete → go to tests
      router.push('/(tabs)/tests');
    }
  }, [findNextLesson, router]);

  // Get status indicator props
  const getStatusIndicator = useCallback((status) => {
    switch (status) {
      case 'completed':
        return { icon: 'checkmark-circle', color: '#10B981', label: 'Completed' };
      case 'available':
      default:
        return { icon: 'play-circle', color: Colors.primary, label: 'Available' };
    }
  }, []);

  const totalVideos = getTotalVideos(currentContent.topics);

  // Determine what Continue Learning card shows
  const continueInfo = useMemo(() => {
    const next = findNextLesson();
    if (next) {
      return {
        label: 'Continue Learning',
        title: next.topicTitle,
        subject: next.subjectName,
        subjectId: next.subjectId,
        color: SUBJECTS.find(s => s.id === next.subjectId)?.color || Colors.primary,
      };
    }
    return {
      label: 'All Lessons Complete!',
      title: 'Take a Quiz to Test Your Knowledge',
      subject: 'Quizzes',
      subjectId: null,
      color: Colors.secondary,
    };
  }, [findNextLesson]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <FadeInDown delay={0} style={styles.header}>
          <Text style={styles.title}>Learn</Text>
          <Text style={styles.subtitle}>Your CS learning journey starts here</Text>
        </FadeInDown>

        {/* Continue Learning Card — always visible, always functional */}
        <FadeInDown delay={50}>
          <TouchableOpacity
            style={styles.continueCard}
            onPress={handleContinueLearning}
            activeOpacity={0.8}
          >
            <View style={styles.continueLeft}>
              <View style={[styles.continueIcon, { backgroundColor: continueInfo.color + '20' }]}>
                <Ionicons name="play-circle" size={24} color={continueInfo.color} />
              </View>
              <View style={styles.continueInfo}>
                <Text style={styles.continueLabel}>{continueInfo.label}</Text>
                <Text style={styles.continueTitle} numberOfLines={1}>{continueInfo.title}</Text>
                <Text style={styles.continueSubject}>{continueInfo.subject}</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color={continueInfo.color} />
          </TouchableOpacity>
        </FadeInDown>

        {/* Subject Selection - Horizontal Scroll */}
        <FadeInDown delay={100}>
          <Text style={styles.sectionTitle}>💻 Choose Subject</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subjectScroll}
            contentContainerStyle={styles.subjectScrollContent}
          >
            {SUBJECTS.map((subject, index) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectChip,
                  selectedSubject === subject.id && {
                    backgroundColor: subject.color,
                    borderColor: subject.color
                  }
                ]}
                onPress={() => {
                  setSelectedSubject(subject.id);
                  setExpandedTopic(null);
                }}
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

        {/* Current Subject Header with Progress */}
        <FadeInDown delay={150}>
          <View style={[styles.subjectHeader, { backgroundColor: currentSubjectData.color + '15' }]}>
            <View style={[styles.subjectHeaderIcon, { backgroundColor: currentSubjectData.color }]}>
              <Ionicons name={getSubjectIcon(selectedSubject)} size={28} color="#fff" />
            </View>
            <View style={styles.subjectHeaderInfo}>
              <Text style={styles.subjectHeaderTitle}>{currentSubjectData.name}</Text>
              <Text style={styles.subjectHeaderStats}>
                {subjectProgress.completed}/{subjectProgress.total} Topics Completed • {totalVideos} Videos
              </Text>
              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${subjectProgress.percentage}%`, backgroundColor: currentSubjectData.color }]} />
              </View>
            </View>
          </View>
        </FadeInDown>

        {/* Topics Section with Status Indicators */}
        <FadeInDown delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Topics</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI Curated</Text>
            </View>
          </View>

          <Text style={styles.topicsHint}>
            <Ionicons name="hand-left-outline" size={13} color={Colors.textMuted} /> Tap any topic to see related videos
          </Text>

          {currentContent.topics.map((topic, index) => {
            const status = getTopicStatus(selectedSubject, topic.id);
            const statusIndicator = getStatusIndicator(status);
            const isCompleted = status === 'completed';

            return (
              <FadeInUp key={topic.id} delay={250 + index * 50}>
                <TouchableOpacity
                  style={[
                    styles.topicCard,
                    expandedTopic === topic.id && styles.topicCardExpanded,
                    expandedTopic === topic.id && { borderColor: currentSubjectData.color + '40' },
                    isCompleted && styles.topicCardCompleted,
                  ]}
                  onPress={() => toggleTopic(topic.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicCardHeader}>
                    {/* Status indicator */}
                    <View style={[styles.topicNumber, { backgroundColor: statusIndicator.color + '20' }]}>
                      <Ionicons name={statusIndicator.icon} size={18} color={statusIndicator.color} />
                    </View>
                    <View style={styles.topicContent}>
                      <Text style={styles.topicTitle}>{topic.title}</Text>
                      <Text style={styles.topicDescription}>{topic.description}</Text>
                    </View>
                    <View style={styles.topicRight}>
                      <View style={styles.topicMeta}>
                        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.topicDuration}>{topic.duration}</Text>
                      </View>
                      <View style={styles.topicVideoCount}>
                        <Ionicons name="play-circle" size={14} color={currentSubjectData.color} />
                        <Text style={[styles.topicVideoCountText, { color: currentSubjectData.color }]}>
                          {topic.videos?.length || 0}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={expandedTopic === topic.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={expandedTopic === topic.id ? currentSubjectData.color : Colors.textMuted}
                    />
                  </View>

                  {/* Expanded Video List — only for current topic */}
                  {expandedTopic === topic.id && topic.videos && topic.videos.length > 0 && (
                    <View style={styles.topicVideos}>
                      <View style={[styles.topicVideosDivider, { backgroundColor: currentSubjectData.color + '20' }]} />
                      <Text style={styles.topicVideosTitle}>
                        🎬 Related Videos ({topic.videos.length})
                      </Text>
                      {topic.videos.map((video) => (
                        <TouchableOpacity
                          key={video.videoId}
                          style={styles.topicVideoItem}
                          onPress={() => openVideo(video.videoId, video.title, topic.title, topic.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.topicVideoThumb, { backgroundColor: currentSubjectData.color + '15' }]}>
                            <Text style={styles.topicVideoEmoji}>{video.thumbnail}</Text>
                            <View style={styles.miniPlayButton}>
                              <Ionicons name="play" size={12} color="#fff" />
                            </View>
                          </View>
                          <View style={styles.topicVideoInfo}>
                            <Text style={styles.topicVideoTitle} numberOfLines={1}>{video.title}</Text>
                            <View style={styles.topicVideoMeta}>
                              <Ionicons name="logo-youtube" size={12} color="#FF0000" />
                              <Text style={styles.topicVideoChannel}>{video.channel}</Text>
                            </View>
                          </View>
                          <Ionicons name="open-outline" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              </FadeInUp>
            );
          })}
        </FadeInDown>

        {/* Quick Tips */}
        <FadeInDown delay={500}>
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={24} color={Colors.accent} />
              <Text style={styles.tipsTitle}>Pro Tip</Text>
            </View>
            <Text style={styles.tipsText}>
              Watch a video in the current topic to complete it and unlock the next one.
              Complete all topics, then take a quiz to test your knowledge! 🚀
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
    marginBottom: Spacing.sm,
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
  topicsHint: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
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
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 0,
  },
  topicCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadows.sm,
  },
  topicCardExpanded: {
    ...Shadows.md,
  },

  topicCardCompleted: {
    opacity: 0.75,
    borderColor: '#10B981' + '30',
  },
  topicCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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

  topicRight: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
    gap: 4,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicDuration: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  topicVideoCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  topicVideoCountText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  // Expanded videos section
  topicVideos: {
    marginTop: Spacing.md,
  },
  topicVideosDivider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  topicVideosTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  topicVideoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  topicVideoThumb: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    position: 'relative',
  },
  topicVideoEmoji: {
    fontSize: 22,
  },
  miniPlayButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicVideoInfo: {
    flex: 1,
  },
  topicVideoTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  topicVideoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicVideoChannel: {
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
  // Continue card styles
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    ...Shadows.sm,
  },
  continueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  continueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  continueInfo: {
    flex: 1,
  },
  continueLabel: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  continueTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  continueSubject: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: 1,
  },
});
