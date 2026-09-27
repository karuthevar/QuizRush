# ⚡ QuizRush

> A high-energy, real-time multiplayer quiz platform inspired by Kahoot, engineered for seamless hosting on **Vercel**.

![QuizRush Banner](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Features

### 👑 For Quiz Organizers / Hosts
- **Google / Gmail Authentication**: Instant sign-in via Google OAuth.
- **Flexible Question Authoring Studio**:
  - **Single Choice (1 of 4)**: Classic fast-paced Kahoot format.
  - **Multiple Choice**: Support for questions requiring players to select multiple correct answers.
  - Configurable countdown timers (10s, 20s, 30s, 60s, 90s).
  - Configurable scoring with speed bonuses.
  - Cover images and custom question prompts.
- **Big Screen Arena**:
  - Dynamic **4-character Game PIN** (e.g. `K9R2`).
  - Scannable **Live QR Code** on screen for instant zero-friction player joins.
  - Real-time connected player list with animated avatar entries.
  - Post-question **Bar Chart Results** breakdown with highlighted correct answers.
  - Top 5 animated **Scoreboard & Streak Tracking** (🔥 *3 in a row!*).
  - Triumphant **1st, 2nd, and 3rd Place Podium** with fireworks confetti celebration (`canvas-confetti`)!

### 📱 For Quiz Takers / Players
- **Zero Login Friction**: Players do **not** need an account or password.
- **Scan & Play**: Join directly by pointing your phone camera at the host's QR code or entering the 4-char PIN at `/join`.
- **Avatar & Nickname Picker**: Pick a custom robot or avatar.
- **Interactive Game Pad**:
  - Giant tactile shape buttons (Red Triangle, Blue Diamond, Yellow Circle, Green Square).
  - Immediate visual & haptic submission confirmation.
  - Instant score breakdown and rank reveals.
- **Built-in Audio Synthesizer**: Web Audio API generated lobby music, urgent countdown ticks, and triumphant sound chimes with zero external audio assets!

---

## 🚀 Live Vercel Deployment Guide

QuizRush is designed to deploy to **Vercel** with zero hassle.

### Step 1: Push to GitHub & Import to Vercel
1. Push this repository to your GitHub account (`https://github.com/karuthevar/QuizRush.git`).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
3. Import the `QuizRush` repository. Next.js will be detected automatically.

### Step 2: (Optional) Connect Firebase for Cross-Device Real-Time Play
QuizRush works out-of-the-box in local/multi-tab mode without configuration. For live multi-device internet gameplay with Google OAuth:
1. Create a free project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and add the **Google** sign-in provider.
3. Enable **Cloud Firestore Database**.
4. In your Vercel Project Settings under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_APP_URL=https://your-quizrush.vercel.app
   ```
5. Redeploy!

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/karuthevar/QuizRush.git
cd QuizRush

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **💡 Multi-Tab Test Tip**: Open the host screen on one browser window, and open an Incognito tab to `/join` with the generated 4-char PIN. Watch them sync in real time!

---

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS with custom Kahoot vibrant color themes
- **Real-Time Synchronization**: Firebase Firestore & BroadcastChannel Dual Engine
- **Audio Synthesizer**: Web Audio API
- **QR Codes**: `qrcode.react`
- **Celebration Effects**: `canvas-confetti`
- **Icons**: `lucide-react`

---

## 📄 License
MIT License. Created for the QuizRush community!
