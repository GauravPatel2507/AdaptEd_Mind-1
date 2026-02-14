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
  c_programming: {
    topics: [
      { id: 1, title: 'Introduction to C', description: 'History, structure, compilation process', duration: '20 min' },
      { id: 2, title: 'Data Types & Operators', description: 'Variables, constants, type casting', duration: '25 min' },
      { id: 3, title: 'Control Structures', description: 'If-else, switch, loops', duration: '25 min' },
      { id: 4, title: 'Functions & Recursion', description: 'Function types, call by value/reference', duration: '30 min' },
      { id: 5, title: 'Pointers & Memory', description: 'Pointer arithmetic, dynamic allocation', duration: '35 min' },
    ],
    videos: [
      { id: 1, title: 'C Programming Full Course', thumbnail: '💻', videoId: 'KJgsSFOSQv0', channel: 'freeCodeCamp' },
      { id: 2, title: 'Pointers in C Explained', thumbnail: '👉', videoId: 'zuegQmMdy8M', channel: 'freeCodeCamp' },
      { id: 3, title: 'C in 100 Seconds', thumbnail: '⚡', videoId: 'U3aXWizDbQ4', channel: 'Fireship' },
      { id: 4, title: 'C Programming for Beginners', thumbnail: '📘', videoId: 'ss0B62SKaOk', channel: 'Programiz' },
      { id: 5, title: 'Dynamic Memory in C', thumbnail: '🧠', videoId: 'xDVC3wKjS64', channel: 'mycodeschool' },
      { id: 6, title: 'File Handling in C', thumbnail: '📂', videoId: 'WljVkCfG1jI', channel: 'Neso Academy' },
    ]
  },
  data_structures: {
    topics: [
      { id: 1, title: 'Arrays & Linked Lists', description: 'Linear data structures basics', duration: '25 min' },
      { id: 2, title: 'Stacks & Queues', description: 'LIFO, FIFO, implementations', duration: '25 min' },
      { id: 3, title: 'Trees & BST', description: 'Binary trees, traversals, BST operations', duration: '30 min' },
      { id: 4, title: 'Graphs', description: 'BFS, DFS, adjacency representations', duration: '35 min' },
      { id: 5, title: 'Hashing & Heaps', description: 'Hash tables, priority queues', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'Data Structures Full Course', thumbnail: '🌳', videoId: 'RBSGKlAvoiM', channel: 'freeCodeCamp' },
      { id: 2, title: 'Linked List in 6 Minutes', thumbnail: '🔗', videoId: 'HB7TcYklBHY', channel: 'CS Dojo' },
      { id: 3, title: 'Binary Trees Explained', thumbnail: '🌲', videoId: 'fAAZixBzIAI', channel: 'mycodeschool' },
      { id: 4, title: 'Graph Algorithms', thumbnail: '📊', videoId: 'tWVWeAqZ0WU', channel: 'freeCodeCamp' },
      { id: 5, title: 'Hash Tables Explained', thumbnail: '#️⃣', videoId: 'shs0KM3wKv8', channel: 'CS Dojo' },
      { id: 6, title: 'Stack vs Queue', thumbnail: '📚', videoId: 'wjI1WNcIntg', channel: 'mycodeschool' },
    ]
  },
  oop: {
    topics: [
      { id: 1, title: 'Classes & Objects', description: 'Encapsulation, constructors, this keyword', duration: '25 min' },
      { id: 2, title: 'Inheritance & Polymorphism', description: 'Method overriding, abstract classes', duration: '30 min' },
      { id: 3, title: 'Interfaces & Abstraction', description: 'Interfaces, abstract methods, design', duration: '25 min' },
      { id: 4, title: 'Design Patterns', description: 'Singleton, Factory, Observer patterns', duration: '35 min' },
      { id: 5, title: 'Exception Handling', description: 'Try-catch, custom exceptions, best practices', duration: '20 min' },
    ],
    videos: [
      { id: 1, title: 'OOP in Java Full Course', thumbnail: '☕', videoId: 'xk4_1vDrzzo', channel: 'Bro Code' },
      { id: 2, title: 'OOP in Python', thumbnail: '🐍', videoId: 'Ej_02ICOIgs', channel: 'freeCodeCamp' },
      { id: 3, title: 'C++ OOP Crash Course', thumbnail: '⚙️', videoId: 'wN0x9eZLix4', channel: 'freeCodeCamp' },
      { id: 4, title: 'SOLID Principles', thumbnail: '🧱', videoId: '_jDNAf3CzeY', channel: 'Fireship' },
      { id: 5, title: 'Design Patterns Explained', thumbnail: '🏗️', videoId: 'tv-_1er1mWI', channel: 'Fireship' },
      { id: 6, title: 'Polymorphism Explained', thumbnail: '🔄', videoId: 'jhDUxynEQRI', channel: 'Programming with Mosh' },
    ]
  },
  dbms: {
    topics: [
      { id: 1, title: 'ER Model & Relations', description: 'Entity-relationship diagrams, keys', duration: '25 min' },
      { id: 2, title: 'SQL Fundamentals', description: 'SELECT, JOIN, subqueries, aggregation', duration: '30 min' },
      { id: 3, title: 'Normalization', description: '1NF, 2NF, 3NF, BCNF', duration: '25 min' },
      { id: 4, title: 'Transactions & ACID', description: 'Concurrency control, serializability', duration: '30 min' },
      { id: 5, title: 'Indexing & NoSQL', description: 'B-trees, hashing, MongoDB basics', duration: '25 min' },
    ],
    videos: [
      { id: 1, title: 'SQL Full Course', thumbnail: '🗄️', videoId: 'HXV3zeQKqGY', channel: 'freeCodeCamp' },
      { id: 2, title: 'Database Design Course', thumbnail: '📐', videoId: 'ztHopE5Wnpc', channel: 'freeCodeCamp' },
      { id: 3, title: 'Normalization Explained', thumbnail: '📊', videoId: 'UrYLYV7WSHM', channel: 'Decomplexify' },
      { id: 4, title: 'MongoDB Crash Course', thumbnail: '🍃', videoId: 'ofme2o29ngU', channel: 'Web Dev Simplified' },
      { id: 5, title: 'SQL Joins Explained', thumbnail: '🔗', videoId: '9yeOJ0ZMUYw', channel: 'Joey Blue' },
      { id: 6, title: 'ACID Properties', thumbnail: '⚗️', videoId: 'yaQ5YMWkxq4', channel: 'Hussein Nasser' },
    ]
  },
  os: {
    topics: [
      { id: 1, title: 'Process Management', description: 'Processes, threads, scheduling algorithms', duration: '30 min' },
      { id: 2, title: 'Memory Management', description: 'Paging, segmentation, virtual memory', duration: '30 min' },
      { id: 3, title: 'File Systems', description: 'File allocation, directory structures', duration: '25 min' },
      { id: 4, title: 'Deadlocks', description: 'Detection, prevention, avoidance strategies', duration: '25 min' },
      { id: 5, title: 'Synchronization', description: 'Semaphores, monitors, critical sections', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'Operating Systems Full Course', thumbnail: '🖥️', videoId: 'yK1uBHPdp30', channel: 'Neso Academy' },
      { id: 2, title: 'Process vs Thread', thumbnail: '🔀', videoId: 'exbKr6fnoUw', channel: 'IBM Technology' },
      { id: 3, title: 'Virtual Memory Explained', thumbnail: '🧠', videoId: 'A9WLYbE0p-I', channel: 'Computerphile' },
      { id: 4, title: 'Deadlock Explained', thumbnail: '🔒', videoId: 'UVo9mGARkhQ', channel: 'Neso Academy' },
      { id: 5, title: 'CPU Scheduling', thumbnail: '⏱️', videoId: '2h3eWaPx8SA', channel: 'Neso Academy' },
      { id: 6, title: 'Linux OS Internals', thumbnail: '🐧', videoId: 'wBp0Rb-ZJak', channel: 'The Linux Channel' },
    ]
  },
  networks: {
    topics: [
      { id: 1, title: 'OSI & TCP/IP Model', description: 'Network layers and protocols', duration: '25 min' },
      { id: 2, title: 'IP Addressing & Subnetting', description: 'IPv4, IPv6, CIDR notation', duration: '30 min' },
      { id: 3, title: 'Routing & Switching', description: 'Routing algorithms, VLANs', duration: '30 min' },
      { id: 4, title: 'Transport Layer', description: 'TCP, UDP, flow control', duration: '25 min' },
      { id: 5, title: 'Application Layer Protocols', description: 'HTTP, DNS, SMTP, FTP', duration: '25 min' },
    ],
    videos: [
      { id: 1, title: 'Computer Networking Full Course', thumbnail: '🌐', videoId: 'qiQR5rTSshw', channel: 'freeCodeCamp' },
      { id: 2, title: 'Subnetting Made Easy', thumbnail: '🔢', videoId: 'ecCuyq-Wprc', channel: 'Practical Networking' },
      { id: 3, title: 'OSI Model Explained', thumbnail: '📶', videoId: 'vv4y_uOneC0', channel: 'TechTerms' },
      { id: 4, title: 'TCP vs UDP', thumbnail: '📡', videoId: 'uwoD5YsGACg', channel: 'Fireship' },
      { id: 5, title: 'DNS Explained', thumbnail: '🔍', videoId: '72snZctFFtA', channel: 'Fireship' },
      { id: 6, title: 'How HTTPS Works', thumbnail: '🔒', videoId: 'j9QmMEWmcfo', channel: 'ByteByteGo' },
    ]
  },
  software_eng: {
    topics: [
      { id: 1, title: 'SDLC Models', description: 'Waterfall, Agile, Spiral, V-model', duration: '25 min' },
      { id: 2, title: 'Requirements Engineering', description: 'SRS, use cases, user stories', duration: '20 min' },
      { id: 3, title: 'Software Design', description: 'UML diagrams, architectural patterns', duration: '30 min' },
      { id: 4, title: 'Testing & QA', description: 'Unit, integration, system testing', duration: '25 min' },
      { id: 5, title: 'DevOps & CI/CD', description: 'Git, Docker, Jenkins pipelines', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'Software Engineering Basics', thumbnail: '⚙️', videoId: 'O753uuutqH8', channel: 'freeCodeCamp' },
      { id: 2, title: 'Agile vs Waterfall', thumbnail: '🔄', videoId: 'GzzkpAOxHXs', channel: 'Atlassian' },
      { id: 3, title: 'UML Diagrams Course', thumbnail: '📐', videoId: 'WnMQ8HlmeXc', channel: 'freeCodeCamp' },
      { id: 4, title: 'Git & GitHub Crash Course', thumbnail: '🐙', videoId: 'RGOj5yH7evk', channel: 'Traversy Media' },
      { id: 5, title: 'Docker in 1 Hour', thumbnail: '🐳', videoId: 'pTFZFxd4hOI', channel: 'Programming with Mosh' },
      { id: 6, title: 'CI/CD Explained', thumbnail: '🚀', videoId: 'scEDHsr3APg', channel: 'Fireship' },
    ]
  },
  web_tech: {
    topics: [
      { id: 1, title: 'HTML & CSS Fundamentals', description: 'Page structure, Flexbox, Grid', duration: '25 min' },
      { id: 2, title: 'JavaScript Essentials', description: 'ES6+, DOM manipulation, async', duration: '30 min' },
      { id: 3, title: 'React & Frontend Frameworks', description: 'Components, hooks, state management', duration: '35 min' },
      { id: 4, title: 'Node.js & Backend', description: 'Express, REST APIs, middleware', duration: '30 min' },
      { id: 5, title: 'Full-Stack Projects', description: 'MERN stack, deployment, hosting', duration: '35 min' },
    ],
    videos: [
      { id: 1, title: 'HTML & CSS Full Course', thumbnail: '🌐', videoId: 'mU6anWqZJcc', channel: 'freeCodeCamp' },
      { id: 2, title: 'JavaScript in 1 Hour', thumbnail: '⚡', videoId: 'PkZNo7MFNFg', channel: 'freeCodeCamp' },
      { id: 3, title: 'React JS Full Course', thumbnail: '⚛️', videoId: 'bMknfKXIFA8', channel: 'freeCodeCamp' },
      { id: 4, title: 'Node.js Tutorial', thumbnail: '🟢', videoId: 'Oe421EPjeBE', channel: 'freeCodeCamp' },
      { id: 5, title: 'MERN Stack Project', thumbnail: '🏗️', videoId: '-0exw-9YJBo', channel: 'JavaScript Mastery' },
      { id: 6, title: 'Next.js in 100 Seconds', thumbnail: '▲', videoId: 'Sklc_fQBmcs', channel: 'Fireship' },
    ]
  },
  comp_org: {
    topics: [
      { id: 1, title: 'Number Systems & Boolean Algebra', description: 'Binary, octal, hex, logic gates', duration: '25 min' },
      { id: 2, title: 'Combinational Circuits', description: 'Adders, multiplexers, decoders', duration: '25 min' },
      { id: 3, title: 'Sequential Circuits', description: 'Flip-flops, registers, counters', duration: '25 min' },
      { id: 4, title: 'CPU Architecture', description: 'ALU, control unit, instruction cycle', duration: '30 min' },
      { id: 5, title: 'Memory Hierarchy & I/O', description: 'Cache, RAM, DMA, interrupts', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'Computer Architecture Full Course', thumbnail: '🔧', videoId: 'F3kAL_TdEzo', channel: 'Neso Academy' },
      { id: 2, title: 'How CPU Works', thumbnail: '⚙️', videoId: 'cNN_tTXABkM', channel: 'In One Lesson' },
      { id: 3, title: 'Logic Gates Explained', thumbnail: '🔌', videoId: 'fw-N9P38mi4', channel: 'Crash Course' },
      { id: 4, title: 'Cache Memory Explained', thumbnail: '💾', videoId: '6JpLD3PUAZk', channel: 'Computerphile' },
      { id: 5, title: 'Assembly Language Tutorial', thumbnail: '🔢', videoId: 'wLXIWKUWpSs', channel: 'Fireship' },
      { id: 6, title: 'Pipelining in CPU', thumbnail: '🏭', videoId: 'FhRXmjudRHE', channel: 'Neso Academy' },
    ]
  },
  discrete_math: {
    topics: [
      { id: 1, title: 'Propositional Logic', description: 'Truth tables, logical equivalences', duration: '20 min' },
      { id: 2, title: 'Set Theory & Relations', description: 'Sets, functions, relations, equivalence', duration: '25 min' },
      { id: 3, title: 'Graph Theory', description: 'Euler/Hamilton paths, planar graphs, coloring', duration: '30 min' },
      { id: 4, title: 'Combinatorics', description: 'Permutations, combinations, pigeonhole', duration: '25 min' },
      { id: 5, title: 'Recurrence Relations', description: 'Solving recurrences, generating functions', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'Discrete Math Full Course', thumbnail: '🔢', videoId: 'rdXw7Ps9vxc', channel: 'freeCodeCamp' },
      { id: 2, title: 'Graph Theory Intro', thumbnail: '📊', videoId: 'LFKZLXVO-Dg', channel: 'Reducible' },
      { id: 3, title: 'Logic & Proofs', thumbnail: '🧮', videoId: 'OM1ANmsKD24', channel: 'Kimberly Brehm' },
      { id: 4, title: 'Combinatorics Crash Course', thumbnail: '🎲', videoId: 'p8vIcmr_Pqo', channel: 'Crash Course' },
      { id: 5, title: 'Set Theory Basics', thumbnail: '📐', videoId: 'yCwnifwVjIg', channel: 'Eddie Woo' },
      { id: 6, title: 'Relations & Functions', thumbnail: '↔️', videoId: 'ouipbDkwHWA', channel: 'Neso Academy' },
    ]
  },
  algorithms: {
    topics: [
      { id: 1, title: 'Asymptotic Analysis', description: 'Big-O, Omega, Theta notation', duration: '20 min' },
      { id: 2, title: 'Divide & Conquer', description: 'Merge sort, quick sort, binary search', duration: '30 min' },
      { id: 3, title: 'Greedy Algorithms', description: 'Activity selection, Huffman coding', duration: '25 min' },
      { id: 4, title: 'Dynamic Programming', description: 'Memoization, tabulation, classic problems', duration: '35 min' },
      { id: 5, title: 'Backtracking & Branch and Bound', description: 'N-Queens, subset sum, TSP', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'Algorithms Full Course', thumbnail: '🎯', videoId: '8hly31xKli0', channel: 'freeCodeCamp' },
      { id: 2, title: 'Big-O Notation Explained', thumbnail: '📈', videoId: 'BgLTDT03QtU', channel: 'NeetCode' },
      { id: 3, title: 'Dynamic Programming', thumbnail: '🧩', videoId: 'oBt53YbR9Kk', channel: 'freeCodeCamp' },
      { id: 4, title: 'Sorting Algorithms Visualized', thumbnail: '📊', videoId: 'kPRA0W1kECg', channel: 'Timo Bingmann' },
      { id: 5, title: 'Greedy Algorithms', thumbnail: '💡', videoId: 'bC7o8P_Ste4', channel: 'Abdul Bari' },
      { id: 6, title: 'Backtracking Explained', thumbnail: '🔙', videoId: 'Zq4upTEaQyM', channel: 'NeetCode' },
    ]
  },
  ai: {
    topics: [
      { id: 1, title: 'Introduction to AI', description: 'History, Turing test, intelligent agents', duration: '20 min' },
      { id: 2, title: 'Search Algorithms', description: 'BFS, DFS, A*, heuristics', duration: '30 min' },
      { id: 3, title: 'Knowledge Representation', description: 'Propositional & predicate logic', duration: '25 min' },
      { id: 4, title: 'Natural Language Processing', description: 'Tokenization, NER, sentiment analysis', duration: '30 min' },
      { id: 5, title: 'AI Ethics & Applications', description: 'Bias, fairness, real-world AI systems', duration: '25 min' },
    ],
    videos: [
      { id: 1, title: 'AI Full Course', thumbnail: '🤖', videoId: 'JMUxmLyrhSk', channel: 'Edureka' },
      { id: 2, title: 'AI in 100 Seconds', thumbnail: '⚡', videoId: 'PeMlggyqz0Y', channel: 'Fireship' },
      { id: 3, title: 'NLP with Python', thumbnail: '💬', videoId: 'xvqsFTUsOmc', channel: 'freeCodeCamp' },
      { id: 4, title: 'A* Search Algorithm', thumbnail: '🔍', videoId: '-L-WgKMFuhE', channel: 'Computerphile' },
      { id: 5, title: 'ChatGPT & LLMs Explained', thumbnail: '🧠', videoId: '5sLYAQS9sWQ', channel: '3Blue1Brown' },
      { id: 6, title: 'AI vs ML vs DL', thumbnail: '📊', videoId: 'pXJfyj2MXZE', channel: 'Simplilearn' },
    ]
  },
  ml: {
    topics: [
      { id: 1, title: 'Supervised Learning', description: 'Linear regression, classification, SVM', duration: '30 min' },
      { id: 2, title: 'Unsupervised Learning', description: 'K-means, PCA, clustering techniques', duration: '25 min' },
      { id: 3, title: 'Neural Networks', description: 'Perceptron, backpropagation, activation functions', duration: '35 min' },
      { id: 4, title: 'Deep Learning', description: 'CNNs, RNNs, transformers basics', duration: '35 min' },
      { id: 5, title: 'Model Evaluation', description: 'Cross-validation, precision, recall, F1', duration: '20 min' },
    ],
    videos: [
      { id: 1, title: 'Machine Learning Full Course', thumbnail: '🤖', videoId: 'NWONeJKn6kc', channel: 'freeCodeCamp' },
      { id: 2, title: 'Neural Networks Explained', thumbnail: '🧠', videoId: 'aircAruvnKk', channel: '3Blue1Brown' },
      { id: 3, title: 'ML with Python', thumbnail: '🐍', videoId: '7eh4d6sabA0', channel: 'Programming with Mosh' },
      { id: 4, title: 'Deep Learning Crash Course', thumbnail: '🔬', videoId: 'VyWAvY2CF9c', channel: 'freeCodeCamp' },
      { id: 5, title: 'TensorFlow in 10 Minutes', thumbnail: '📐', videoId: 'tpCFfeUEGs8', channel: 'Fireship' },
      { id: 6, title: 'Random Forest Explained', thumbnail: '🌲', videoId: 'J4Wdy0Wc_xQ', channel: 'StatQuest' },
    ]
  },
  cloud: {
    topics: [
      { id: 1, title: 'Cloud Fundamentals', description: 'IaaS, PaaS, SaaS, deployment models', duration: '20 min' },
      { id: 2, title: 'AWS Core Services', description: 'EC2, S3, Lambda, RDS', duration: '30 min' },
      { id: 3, title: 'Containerization', description: 'Docker, Kubernetes basics', duration: '30 min' },
      { id: 4, title: 'Serverless Architecture', description: 'Functions, event-driven, API Gateway', duration: '25 min' },
      { id: 5, title: 'Cloud Security', description: 'IAM, encryption, compliance', duration: '25 min' },
    ],
    videos: [
      { id: 1, title: 'Cloud Computing Full Course', thumbnail: '☁️', videoId: 'M988_fsOSWo', channel: 'Edureka' },
      { id: 2, title: 'AWS in 10 Minutes', thumbnail: '🟠', videoId: 'r4YIdn2eTm4', channel: 'Fireship' },
      { id: 3, title: 'Docker Crash Course', thumbnail: '🐳', videoId: 'pg19Z8LL06w', channel: 'TechWorld with Nana' },
      { id: 4, title: 'Kubernetes Explained', thumbnail: '⎈', videoId: 'X48VuDVv0do', channel: 'TechWorld with Nana' },
      { id: 5, title: 'Azure Fundamentals', thumbnail: '🔵', videoId: 'NKEFWyqJ5XA', channel: 'freeCodeCamp' },
      { id: 6, title: 'Serverless in 100 Seconds', thumbnail: '⚡', videoId: 'W_VV2Fx32_Y', channel: 'Fireship' },
    ]
  },
  cyber: {
    topics: [
      { id: 1, title: 'Security Fundamentals', description: 'CIA triad, threats, vulnerabilities', duration: '20 min' },
      { id: 2, title: 'Cryptography', description: 'Symmetric, asymmetric, hashing, PKI', duration: '30 min' },
      { id: 3, title: 'Network Security', description: 'Firewalls, IDS/IPS, VPN', duration: '25 min' },
      { id: 4, title: 'Ethical Hacking', description: 'Penetration testing, OWASP Top 10', duration: '30 min' },
      { id: 5, title: 'Incident Response', description: 'Forensics, threat hunting, SIEM', duration: '25 min' },
    ],
    videos: [
      { id: 1, title: 'Cybersecurity Full Course', thumbnail: '🔒', videoId: 'U_P23SqJaDc', channel: 'freeCodeCamp' },
      { id: 2, title: 'Ethical Hacking Course', thumbnail: '🎭', videoId: '3Kq1MIfTWCE', channel: 'freeCodeCamp' },
      { id: 3, title: 'Cryptography Explained', thumbnail: '🔐', videoId: 'jhXCTbFnK8o', channel: 'Fireship' },
      { id: 4, title: 'OWASP Top 10', thumbnail: '🕷️', videoId: 'rWHvp7rUka8', channel: 'OWASP' },
      { id: 5, title: 'Linux for Hackers', thumbnail: '🐧', videoId: 'VbEx7B_PTOE', channel: 'NetworkChuck' },
      { id: 6, title: 'How VPNs Work', thumbnail: '🛡️', videoId: 'WVDQEoe6ZWY', channel: 'Fireship' },
    ]
  },
  mobile_dev: {
    topics: [
      { id: 1, title: 'Mobile App Fundamentals', description: 'Native vs cross-platform, architecture', duration: '20 min' },
      { id: 2, title: 'React Native', description: 'Components, navigation, state management', duration: '35 min' },
      { id: 3, title: 'Flutter & Dart', description: 'Widgets, layouts, material design', duration: '35 min' },
      { id: 4, title: 'Mobile UI/UX Design', description: 'Design principles, responsive layouts', duration: '25 min' },
      { id: 5, title: 'Publishing Apps', description: 'Play Store, App Store, CI/CD for mobile', duration: '20 min' },
    ],
    videos: [
      { id: 1, title: 'React Native Full Course', thumbnail: '📱', videoId: 'obH0Po_RdWk', channel: 'freeCodeCamp' },
      { id: 2, title: 'Flutter Crash Course', thumbnail: '🦋', videoId: 'x0uinJvhNxI', channel: 'Fireship' },
      { id: 3, title: 'Android Development', thumbnail: '🤖', videoId: 'fis26HvvDII', channel: 'freeCodeCamp' },
      { id: 4, title: 'iOS Development with Swift', thumbnail: '🍎', videoId: 'comQ1-x2a1Q', channel: 'CodeWithChris' },
      { id: 5, title: 'Kotlin for Android', thumbnail: '🟣', videoId: 'F9UC9DY-vIU', channel: 'freeCodeCamp' },
      { id: 6, title: 'React Native in 100 Seconds', thumbnail: '⚡', videoId: 'gvkqT_Uoahw', channel: 'Fireship' },
    ]
  },
  big_data: {
    topics: [
      { id: 1, title: 'Big Data Concepts', description: "5 V's, distributed computing basics", duration: '20 min' },
      { id: 2, title: 'Hadoop Ecosystem', description: 'HDFS, MapReduce, YARN', duration: '30 min' },
      { id: 3, title: 'Apache Spark', description: 'RDDs, DataFrames, Spark SQL', duration: '30 min' },
      { id: 4, title: 'Data Pipelines', description: 'Kafka, Airflow, ETL processes', duration: '25 min' },
      { id: 5, title: 'Data Warehousing', description: 'Star schema, OLAP, data lakes', duration: '25 min' },
    ],
    videos: [
      { id: 1, title: 'Big Data Full Course', thumbnail: '📊', videoId: 'KCEPoPJ8sYc', channel: 'Edureka' },
      { id: 2, title: 'Hadoop Tutorial', thumbnail: '🐘', videoId: 'aReuLtY0YMI', channel: 'Edureka' },
      { id: 3, title: 'Apache Spark Course', thumbnail: '⚡', videoId: '_C8kWso4ne4', channel: 'freeCodeCamp' },
      { id: 4, title: 'Apache Kafka Explained', thumbnail: '📡', videoId: 'uvb00oaa3k8', channel: 'IBM Technology' },
      { id: 5, title: 'Data Engineering Roadmap', thumbnail: '🗺️', videoId: 'qWru-b6m3uo', channel: 'Fireship' },
      { id: 6, title: 'ETL Explained', thumbnail: '🔄', videoId: 'OW5OgsLpDCQ', channel: 'IBM Technology' },
    ]
  },
  data_science: {
    topics: [
      { id: 1, title: 'Data Science Workflow', description: 'Data collection, cleaning, EDA', duration: '20 min' },
      { id: 2, title: 'Python for Data Science', description: 'NumPy, Pandas, Matplotlib', duration: '30 min' },
      { id: 3, title: 'Statistical Analysis', description: 'Hypothesis testing, distributions', duration: '25 min' },
      { id: 4, title: 'Data Visualization', description: 'Seaborn, Plotly, dashboard design', duration: '25 min' },
      { id: 5, title: 'Predictive Modeling', description: 'Regression, classification, pipelines', duration: '30 min' },
    ],
    videos: [
      { id: 1, title: 'Data Science Full Course', thumbnail: '📊', videoId: 'ua-CiDNNj30', channel: 'freeCodeCamp' },
      { id: 2, title: 'Python Pandas Tutorial', thumbnail: '🐼', videoId: 'vmEHCJofslg', channel: 'Programming with Mosh' },
      { id: 3, title: 'Statistics Fundamentals', thumbnail: '📈', videoId: 'xxpc-HPKN28', channel: 'StatQuest' },
      { id: 4, title: 'Data Visualization with Python', thumbnail: '📉', videoId: 'GGL6U0bDzGk', channel: 'freeCodeCamp' },
      { id: 5, title: 'Jupyter Notebook Tutorial', thumbnail: '📓', videoId: 'HW29067qVWk', channel: 'Corey Schafer' },
      { id: 6, title: 'Kaggle Competition Walk-through', thumbnail: '🏆', videoId: 'GrLlNnQIjwE', channel: 'Ken Jee' },
    ]
  }
};

export default function LearnScreen() {
  const [selectedSubject, setSelectedSubject] = useState('c_programming');

  // Get current subject content
  const currentContent = SUBJECT_CONTENT[selectedSubject] || SUBJECT_CONTENT.c_programming;
  const currentSubjectData = SUBJECTS.find(s => s.id === selectedSubject) || SUBJECTS[0];

  // Open YouTube video
  const openVideo = (videoId) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    Linking.openURL(url).catch(err => console.error('Error opening video:', err));
  };

  // Get subject icon from SUBJECTS config
  const getSubjectIcon = (subjectId) => {
    const subject = SUBJECTS.find(s => s.id === subjectId);
    return subject?.icon || 'school';
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
          <Text style={styles.subtitle}>Your CS learning journey starts here</Text>
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
              <Text style={styles.tipsTitle}>Pro Tip</Text>
            </View>
            <Text style={styles.tipsText}>
              Watch video lessons first, then practice coding alongside.
              Take mock tests to solidify your understanding! 🚀
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
