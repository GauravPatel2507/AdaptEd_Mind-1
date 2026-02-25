# AdaptEd Mind — Design Document 🎓

> **Version**: 2.0.0  
> **Last Updated**: February 2026  
> **Platform**: Cross-platform Mobile (iOS, Android, Web)  
> **Stack**: FERN (Firebase · Expo · React Native · Node.js)

---

## 1. Project Overview

**AdaptEd Mind** is an AI-driven personalized learning platform designed for CS & MCA students. It leverages artificial intelligence to adapt lesson difficulty, generate mock tests, identify learning gaps, and match study partners — creating a tailored educational journey for every learner.

### 1.1 Vision & Goals

| Goal | Description |
|------|-------------|
| **Personalized Learning** | Adapt content difficulty in real-time based on student performance |
| **AI-Powered Assessment** | Generate contextual mock tests using LLM (Groq / LLaMA 3.3) |
| **Gap Identification** | Detect weak areas and recommend targeted study paths |
| **Social Learning** | Connect students with compatible study partners |
| **Actionable Insights** | Provide detailed analytics to both students and teachers |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT (Expo / React Native)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Auth     │ │  Tabs    │ │ Subject  │ │  Chat /    │  │
│  │  Screens  │ │  Screens │ │  Detail  │ │  AI Test   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       │             │            │              │         │
│  ┌────▼─────────────▼────────────▼──────────────▼──────┐ │
│  │              Service Layer (Business Logic)         │ │
│  │  aiService · authService · progressService · match  │ │
│  └────────────────────────┬────────────────────────────┘ │
│                           │                              │
│  ┌────────────────────────▼────────────────────────────┐ │
│  │              Context Layer (State Management)       │ │
│  │                    AuthContext                      │ │
│  └────────────────────────┬────────────────────────────┘ │
└───────────────────────────┼──────────────────────────────┘
                            │
              ┌─────────────▼──────────────┐
              │      Firebase Platform     │
              │  Auth · Firestore · Storage│
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼──────────────┐
              │   Node.js Backend (Express)│
              │   REST API · Port 3001     │
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼──────────────┐
              │     External AI Service    │
              │   Groq API (LLaMA 3.3 70B) │
              └────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React Native (Expo SDK 54) | Cross-platform mobile UI |
| **Routing** | Expo Router v6 | File-based navigation |
| **State** | React Context + AsyncStorage | Auth state & local persistence |
| **Backend** | Node.js + Express | REST API server |
| **Database** | Firebase Firestore | NoSQL document database |
| **Auth** | Firebase Authentication | Email/password authentication |
| **AI Engine** | Groq API (LLaMA 3.3 70B Versatile) | Test generation & AI chat |
| **Charts** | react-native-chart-kit + SVG | Data visualization |
| **Animations** | Lottie + RN Animated API | Micro-interactions & transitions |
| **Gradients** | expo-linear-gradient | Visual styling |

---

## 3. Module Design (10 Core Modules)

### Module 1 — Student Progress & Learning-Gap Finder

**Purpose**: Track per-subject progress and identify weak topics.

- **Service**: `progressService.js` → `identifyLearningGaps()`
- **Data Source**: `quizResults` collection in Firestore
- **Logic**: Aggregates topic-level scores across last 50 quizzes; flags topics with average < 70% as gaps
- **UI Screen**: `progress.js` (Tab Screen)

```
Input:  userId
Output: [{ topic, averageScore, attempts }]  — sorted by weakest first
```

---

### Module 2 — Authentication & Authorization

**Purpose**: Secure login with role-based access (Student / Teacher / Admin).

- **Service**: `authService.js` + `AuthContext.js`
- **Firebase Auth**: Email/password sign-up, sign-in, password reset, email verification
- **Roles**: Stored in Firestore `users` collection → `role` field
- **UI Screens**: `login.js`, `register.js`, `forgot-password.js`

**Auth Flow**:
```
Register → Firebase Auth → Create Firestore Profile → Set Context → Redirect to Tabs
Login → Firebase Auth → Fetch Firestore Profile → Set Context → Redirect to Tabs
Logout → Firebase SignOut → Clear AsyncStorage → Redirect to Auth
```

**Password Validation Rules**:
- Minimum 8 characters
- At least 1 uppercase letter, 1 lowercase letter, 1 number
- Strength rating: `weak` / `medium` / `strong`

---

### Module 3 — Automatic Lesson Difficulty Adjuster

**Purpose**: AI-powered adaptive difficulty that adjusts based on performance.

- **Service**: `aiService.js` → `calculateAdaptiveDifficulty()`, `getRecommendedDifficulty()`
- **Difficulty Levels**: 5 levels (Beginner → Easy → Medium → Hard → Expert)

| Score Range | Recommended Difficulty |
|-------------|----------------------|
| 90–100% | Expert (5) |
| 75–89% | Hard (4) |
| 55–74% | Medium (3) |
| 35–54% | Easy (2) |
| 0–34% | Beginner (1) |

- **Trend Analysis**: Compares first-half vs. second-half quiz scores to detect `improving`, `declining`, or `stable` trends

---

### Module 4 — Performance Analytics & Insights

**Purpose**: Provide detailed learning analytics with trend visualization.

- **Service**: `progressService.js` → `getPerformanceAnalytics()`
- **Periods**: Weekly / Monthly / Yearly
- **Metrics**: Average score, total quizzes, daily averages, performance trend
- **UI Screen**: `dashboard.js` (Tab Screen) with chart visualizations

---

### Module 5 — AI-Generated Mock Tests

**Purpose**: Generate personalized tests using AI (Groq LLaMA 3.3).

- **Service**: `aiService.js` → `generateAITest()`, `generateMockTest()`
- **AI Provider**: Groq API (`llama-3.3-70b-versatile`)
- **Fallback**: Predefined question bank when AI is unavailable
- **Config**:
  - Questions per quiz: 5–50 (configurable)
  - Time per question: 60 seconds default
  - Passing percentage: 60%
- **UI Screens**: `tests.js` (Tab), `take-test.js` (Fullscreen test-taking experience)

**Generation Flow**:
```
User selects subject & config
  → Fetch user performance history
  → Compute adaptive difficulty
  → Call Groq API with subject + difficulty prompt
  → Parse & validate AI response
  → Shuffle question options
  → Present test to user
  → On submit → Store results in Firestore → Update progress
```

---

### Module 6 — Step-by-Step Study Path

**Purpose**: Guided learning journey through structured topics.

- **UI Screen**: `learn.js` (Tab Screen)
- **Structure**: Subject → Topics → Lessons (ordered by difficulty)
- **Adaptation**: Lesson difficulty adjusts based on Module 3's recommendations

---

### Module 7 — Student & Teacher Dashboard

**Purpose**: Comprehensive overview of learning metrics.

- **UI Screen**: `dashboard.js` (Tab Screen)
- **Student View**: Personal stats, progress charts, recent activity, learning gaps
- **Teacher View**: Class-wide analytics, student performance ranking

---

### Module 8 — Automated Report Generator

**Purpose**: Generate periodic performance reports.

- **Data Source**: Aggregated from `quizResults` and `progress` collections
- **Periods**: Weekly / Monthly

---

### Module 9 — Study Buddy Matchmaker

**Purpose**: Connect students with compatible study partners.

- **Service**: `matchmakerService.js`
- **UI Screen**: `buddies.js` (Tab Screen)

**Matching Algorithm**:
```
Match Score = (Common subjects × 20)
            + (Target subject matches × 30)
            + (Similar performance level → up to 15)
            + (Both have active streaks → 10)
```

**Workflow**:
```
Search for partners → View match scores & common subjects
  → Send partner request → Receiver accepts/rejects
  → On accept → Create studyBuddies relationship
  → View buddy list
```

---

### Module 10 — Secure Data & Privacy

**Purpose**: Protect student data with Firebase security rules.

- **Auth**: Firebase Authentication with credential re-verification for sensitive actions
- **Storage**: Firestore security rules (role-based read/write)
- **Local**: AsyncStorage for session persistence (cleared on logout)

---

## 4. Data Model (Firestore Collections)

### 4.1 Collections Overview

```
Firestore
├── users/                    # User profiles & preferences
│   └── {userId}
├── progress/                 # Per-subject progress tracking
│   └── {userId}_{subjectId}
├── quizResults/              # Individual test results
│   └── {autoId}
├── partnerRequests/          # Study buddy requests
│   └── {autoId}
└── studyBuddies/            # Confirmed buddy pairs
    └── {autoId}
```

### 4.2 Document Schemas

#### `users/{userId}`
```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "role": "student | teacher | admin",
  "createdAt": "ISO 8601",
  "subjects": ["string"],
  "preferences": {
    "theme": "light | dark",
    "notifications": true
  },
  "stats": {
    "totalQuizzes": 0,
    "averageScore": 0,
    "studyTime": 0,
    "streak": 0
  }
}
```

#### `progress/{userId}_{subjectId}`
```json
{
  "userId": "string",
  "subjectId": "string",
  "lessonsCompleted": 0,
  "quizzesTaken": 0,
  "averageScore": 0,
  "createdAt": "ISO 8601",
  "lastUpdated": "ISO 8601"
}
```

#### `quizResults/{autoId}`
```json
{
  "userId": "string",
  "subject": "string",
  "score": 85,
  "topicScores": { "arrays": 90, "linked_lists": 70 },
  "difficulty": 3,
  "createdAt": "ISO 8601"
}
```

#### `partnerRequests/{autoId}`
```json
{
  "fromUserId": "string",
  "toUserId": "string",
  "message": "string",
  "status": "pending | accepted | rejected",
  "createdAt": "ISO 8601",
  "respondedAt": "ISO 8601"
}
```

#### `studyBuddies/{autoId}`
```json
{
  "users": ["userId1", "userId2"],
  "createdAt": "ISO 8601",
  "lastInteraction": "ISO 8601"
}
```

---

## 5. UI/UX Design

### 5.1 Navigation Structure

```
App
├── (auth)/                          # Auth Stack (unauthenticated)
│   ├── login                        # Login screen
│   ├── register                     # Registration screen
│   └── forgot-password              # Password reset
│
├── (tabs)/                          # Main Tab Navigator (authenticated)
│   ├── dashboard    📊              # Home / Dashboard
│   ├── learn        📚              # Study Path & Lessons
│   ├── tests        📝              # Mock Test Hub
│   ├── progress     📈              # Progress & Analytics
│   ├── buddies      👥              # Study Buddy Matchmaker
│   └── profile      👤              # User Profile & Settings
│
├── subject/[id]                     # Dynamic Subject Detail
├── take-test                        # Full-screen Test Experience
└── chat                             # AI Chat Assistant
```

### 5.2 Design System

#### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#6366F1` (Indigo) | Buttons, headers, focus states |
| **Primary Light** | `#A5B4FC` | Highlights, backgrounds |
| **Primary Dark** | `#4338CA` | Active / pressed states |
| **Secondary** | `#10B981` (Emerald) | Success, growth indicators |
| **Accent** | `#F59E0B` (Amber) | Warnings, attention |
| **Background** | `#F8FAFC` | Main background (light mode) |
| **Background Dark** | `#1E293B` | Main background (dark mode) |
| **Surface** | `#FFFFFF` | Cards, modals |
| **Error** | `#EF4444` | Error states |
| **Info** | `#3B82F6` | Informational elements |

#### Subject Color Coding (18 subjects)

Each CS/MCA subject has a unique color for instant visual identification:

| Subject | Color |
|---------|-------|
| Programming in C | `#6366F1` |
| Data Structures | `#10B981` |
| OOP (Java/Python/C++) | `#F59E0B` |
| Database Management | `#8B5CF6` |
| Operating Systems | `#14B8A6` |
| Computer Networks | `#3B82F6` |
| Software Engineering | `#EF4444` |
| Web Technologies | `#F97316` |
| Computer Organization | `#22C55E` |
| Discrete Mathematics | `#EC4899` |
| Design & Analysis of Algorithms | `#0EA5E9` |
| Artificial Intelligence | `#A855F7` |
| Machine Learning | `#D946EF` |
| Cloud Computing | `#06B6D4` |
| Cyber Security | `#DC2626` |
| Mobile App Development | `#16A34A` |
| Big Data | `#CA8A04` |
| Data Science | `#7C3AED` |

#### Spacing Scale

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `xxl` | 48px |

#### Typography Scale

| Token | Size | Usage |
|-------|------|-------|
| `xs` | 12px | Captions, labels |
| `sm` | 14px | Secondary text |
| `md` | 16px | Body text |
| `lg` | 18px | Subheadings |
| `xl` | 20px | Section titles |
| `xxl` | 24px | Screen titles |
| `xxxl` | 32px | Hero text |
| `display` | 40px | Display headings |

#### Font Weights
- Regular (400), Medium (500), Semibold (600), Bold (700)

#### Border Radius
- `sm`: 8px · `md`: 12px · `lg`: 16px · `xl`: 24px · `full`: 9999px

#### Elevation / Shadows

| Level | Shadow Opacity | Elevation |
|-------|---------------|-----------|
| `sm` | 0.05 | 1 |
| `md` | 0.10 | 3 |
| `lg` | 0.15 | 5 |

#### Gradient Presets

| Name | Colors | Usage |
|------|--------|-------|
| `primary` | `#6366F1 → #8B5CF6` | Primary CTAs |
| `secondary` | `#10B981 → #14B8A6` | Success states |
| `accent` | `#F59E0B → #F97316` | Highlights |
| `progress` | `#6366F1 → #10B981` | Progress bars |
| `warmth` | `#F59E0B → #EF4444` | Urgency |
| `cool` | `#3B82F6 → #6366F1` | Info sections |

### 5.3 Component Library

| Component | File | Description |
|-----------|------|-------------|
| `AnimatedComponents` | `components/AnimatedComponents.js` | Animated cards, buttons, and transitions |
| `Animations` | `components/Animations.js` | Shared animation utilities and presets |
| `ErrorBoundary` | `components/ErrorBoundary.js` | Error catching and fallback UI |

### 5.4 Animation Durations

| Speed | Duration |
|-------|----------|
| Fast | 200ms |
| Normal | 300ms |
| Slow | 500ms |

---

## 6. Backend API Design

### 6.1 Server Configuration

- **Framework**: Express.js
- **Port**: 3001 (configurable via `PORT` env)
- **Middleware**: CORS, JSON body parser
- **Firebase Admin**: Server-side Firebase operations (token verification)

### 6.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status & version |
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/verify` | Verify Firebase ID token |
| `GET` | `/api/students/:userId/progress` | Get student progress |
| `GET` | `/api/analytics/:userId?period=week` | Get performance analytics |
| `POST` | `/api/tests/generate` | Generate AI-powered test |
| `GET` | `/api/matches/:userId` | Find study partners |

### 6.3 Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## 7. AI Integration Design

### 7.1 AI Provider

| Property | Value |
|----------|-------|
| **Provider** | Groq |
| **Model** | `llama-3.3-70b-versatile` |
| **API Endpoint** | `https://api.groq.com/openai/v1/chat/completions` |
| **Protocol** | OpenAI-compatible Chat Completions |

### 7.2 AI-Powered Features

1. **Mock Test Generation**: AI generates subject-specific MCQ questions at adaptive difficulty levels
2. **AI Chat Assistant**: Interactive study assistant for concept explanations (via `chat.js`)
3. **Difficulty Adaptation**: AI-informed difficulty recommendations based on performance trends

### 7.3 Fallback Strategy

When the AI API is unavailable, the system falls back to a **predefined question bank** (`sampleQuestions` in `aiService.js`) covering Data Structures, Algorithms, Computer Networks, and more.

---

## 8. Project Structure

```
AdaptEd_Mind-1/
│
├── app/                              # Expo Router screens
│   ├── _layout.js                    # Root layout with AuthProvider
│   ├── index.js                      # Entry / splash screen
│   ├── chat.js                       # AI chat assistant
│   ├── take-test.js                  # Full-screen test experience
│   ├── (auth)/                       # Authentication flow
│   │   ├── _layout.js                # Auth stack layout
│   │   ├── login.js                  # Login screen
│   │   ├── register.js               # Registration screen
│   │   └── forgot-password.js        # Password reset
│   ├── (tabs)/                       # Main tab navigator
│   │   ├── _layout.js                # Tab bar configuration
│   │   ├── dashboard.js              # Home dashboard
│   │   ├── learn.js                  # Study path & lessons
│   │   ├── tests.js                  # Mock test hub
│   │   ├── progress.js               # Progress & analytics
│   │   ├── buddies.js                # Study buddy matchmaker
│   │   └── profile.js                # User profile & settings
│   └── subject/                      # Dynamic routes
│       ├── _layout.js                # Subject stack layout
│       └── [id].js                   # Subject detail (dynamic)
│
├── components/                       # Reusable UI components
│   ├── AnimatedComponents.js         # Animated cards & buttons
│   ├── Animations.js                 # Animation utilities
│   └── ErrorBoundary.js              # Error boundary component
│
├── config/
│   └── firebase.js                   # Firebase initialization
│
├── constants/
│   ├── Colors.js                     # Design tokens (colors, spacing, typography)
│   └── Config.js                     # App config (AI, subjects, quiz settings)
│
├── contexts/
│   └── AuthContext.js                # Authentication context provider
│
├── services/                         # Business logic layer
│   ├── aiService.js                  # AI test generation & difficulty engine
│   ├── authService.js                # Auth utilities (reset, verify, validate)
│   ├── matchmakerService.js          # Study buddy matching algorithm
│   └── progressService.js            # Progress tracking & analytics
│
├── backend/                          # Node.js server
│   ├── server.js                     # Express API server
│   └── package.json                  # Backend dependencies
│
├── assets/                           # Static assets
│   ├── icon.png                      # App icon
│   ├── adaptive-icon.png             # Android adaptive icon
│   ├── splash-icon.png               # Splash screen icon
│   └── favicon.png                   # Web favicon
│
├── app.json                          # Expo configuration
├── package.json                      # Frontend dependencies
├── babel.config.js                   # Babel configuration
├── eas.json                          # EAS Build configuration
└── index.js                          # App entry point
```

---

## 9. Performance Thresholds

| Rating | Score Threshold |
|--------|----------------|
| Excellent | ≥ 90% |
| Good | ≥ 75% |
| Average | ≥ 60% |
| Needs Improvement | ≥ 40% |
| Critical | < 40% |

---

## 10. Supported Subjects (18)

### Core CS/MCA Subjects (11)
1. Programming in C
2. Data Structures
3. OOP (Java/Python/C++)
4. Database Management (DBMS)
5. Operating Systems
6. Computer Networks
7. Software Engineering
8. Web Technologies
9. Computer Organization
10. Discrete Mathematics
11. Design & Analysis of Algorithms

### Elective / Advanced Subjects (7)
12. Artificial Intelligence
13. Machine Learning
14. Cloud Computing
15. Cyber Security
16. Mobile App Development
17. Big Data
18. Data Science

---

## 11. Security Design

| Aspect | Implementation |
|--------|---------------|
| **Authentication** | Firebase Auth (email/password) |
| **Session Management** | Firebase token + AsyncStorage |
| **Password Policy** | Min 8 chars, upper+lower+number |
| **Sensitive Actions** | Re-authentication required (e.g., password change) |
| **Data Access** | Role-based Firestore security rules |
| **API Security** | Firebase ID token verification on backend |
| **Logout Cleanup** | AsyncStorage cleared on sign-out |

---

## 12. Build & Deployment

| Environment | Tool | Command |
|-------------|------|---------|
| **Development** | Expo CLI | `npx expo start` |
| **Android** | Expo | `npx expo run:android` |
| **iOS** | Expo | `npx expo run:ios` |
| **Web** | Expo | `npx expo start --web` |
| **Backend Dev** | Node.js | `cd backend && npm start` |
| **Production Build** | EAS Build | `eas build` |

### App Identifiers

| Platform | Bundle ID |
|----------|-----------|
| iOS | `com.adaptedmind.app` |
| Android | `com.adaptedmind.app` |

---

## 13. Future Enhancements

- [ ] Push notifications for study reminders
- [ ] Video-based lessons integration
- [ ] Teacher dashboard with class management
- [ ] Gamification (badges, leaderboards, XP system)
- [ ] Offline mode with data sync
- [ ] Multi-language support
- [ ] Advanced AI features (essay evaluation, code assessment)
- [ ] Real-time collaborative study sessions via WebSockets

---

*Built with ❤️ for personalized education*
