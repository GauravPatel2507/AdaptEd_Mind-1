# AdaptEd Mind 🎓

An AI-Driven Personalized Learning Platform built with FERN stack (Firebase, Expo, React Native, Node.js).

## Features

### 📚 Core Modules

1. **Student Progress & Learning-Gap Finder** - Track progress and identify weak areas
2. **Authentication & Authorization** - Secure login with role-based access
3. **Automatic Lesson Difficulty Adjuster** - AI-powered adaptive difficulty
4. **Performance Analytics & Insights** - Detailed learning analytics
5. **AI-Generated Mock Tests** - Personalized test generation
6. **Step-by-Step Study Path** - Guided learning journey
7. **Student & Teacher Dashboard** - Comprehensive overview
8. **Automated Report Generator** - Weekly/Monthly reports
9. **Study Buddy Matchmaker** - Connect with study partners
10. **Secure Data & Privacy** - Firebase security rules

## Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   cd AdaptEd_Mind-1
   ```

2. **Install dependencies**
   ```bash
   # Install app dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install
   ```

3. **Configure Firebase**
   
   Update `config/firebase.js` with your Firebase credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Start the app**
   ```bash
   # Start Expo development server
   npx expo start

   # Start backend server (in separate terminal)
   cd backend && npm start
   ```

5. **Run on device**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## Project Structure

```
AdaptEd_Mind-1/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.js         # Root layout
├── components/            # UI components
├── config/                # Firebase config
├── constants/             # Colors, themes, config
├── contexts/              # React contexts
├── services/              # Business logic services
├── backend/               # Node.js server
└── assets/                # Images, fonts
```

## Design System

### Colors
- **Primary**: `#6366F1` (Indigo) - Focus, calm
- **Secondary**: `#10B981` (Emerald) - Success, growth
- **Accent**: `#F59E0B` (Amber) - Highlights

### Typography
- Clean, modern sans-serif fonts
- Accessible contrast ratios
- Student-friendly sizing

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

Built with ❤️ for personalized education
