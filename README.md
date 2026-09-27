# ⚡ QuizRush

> A high-energy, real-time multiplayer quiz platform inspired by Kahoot, engineered for seamless hosting on **Vercel** with Google OAuth, QR code & 4-character PIN joining, Admin History & Analytics, and Email dispatch.

![QuizRush Banner](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80)

---

## 🗺️ System Architecture & Workflow Diagrams

### 1. Host vs. Player End-to-End User Journey

```mermaid
flowchart TD
    subgraph Host ["👑 Quiz Organizer / Host"]
        H1[Google / Gmail OAuth Login] --> H2[Quiz Library & Authoring Studio]
        H2 --> H3[Configure Questions: Single 1-of-4 or Multi-Choice]
        H3 --> H4[Click 'Host Live' & Generate 4-Char PIN]
        H4 --> H5[Big Screen Lobby: Displays QR Code & PIN]
        H5 --> H6[Start Live Match]
        H6 --> H7[Question & Countdown Screen]
        H7 --> H8[Live Bar Chart Results Breakdown]
        H8 --> H9[Scoreboard & Streak Leaderboard]
        H9 --> H10[Triumphant 1st, 2nd, 3rd Podium + Confetti]
        H10 --> H11[Session Auto-Saved to Admin History]
    end

    subgraph Players ["📱 Quiz Takers (Zero-Login)"]
        P1[Scan Live QR Code with Phone Camera OR Open /join] --> P2[4-Char PIN Auto-Filled]
        P2 --> P3[Pick Nickname & Animated Avatar]
        P3 --> P4[Enter Waiting Room]
        P4 --> P5[Live Tactical Game Pad: Red, Blue, Yellow, Green]
        P5 --> P6[Single Click or Multi-Select Checkboxes]
        P6 --> P7[Haptic / Visual Answer Confirmation]
        P7 --> P8[Instant Correct / Wrong Reveal + Speed Bonus]
        P8 --> P9[Personal Standings & Flame Streak Reveal]
        P9 --> P10[Podium Finish & Medals]
    end

    subgraph AdminEngine ["🛡️ Admin Dashboard & Email Dispatch"]
        A1[Session History Logger] --> A2[Aggregated Analytics & Accuracy %]
        A2 --> A3[Detailed Question & Player Drilldowns]
        A3 --> A4[Export CSV Report]
        A3 --> A5[Send HTML Scorecard Email to Participants / Host]
    end

    H5 -.->|Real-time Lobby Sync| P4
    H7 -.->|Syncs Active Question| P5
    P6 -.->|Submits Player Answer| H8
    H11 -.->|Logs Completed Game| A1
```

---

### 2. Live Interactive Game State Machine

```mermaid
stateDiagram-v2
    [*] --> lobby: Host Launches Game Session
    
    state lobby {
        [*] --> WaitingForPlayers
        WaitingForPlayers --> PlayerJoined: Player scans QR or enters PIN
        PlayerJoined --> WaitingForPlayers
    }

    lobby --> countdown: Host Clicks 'Start Game'
    countdown --> question: 3-Second Get Ready Fanfare

    state question {
        [*] --> TimerRunning
        TimerRunning --> AnswerSubmitted: Players tap answer pads
        AnswerSubmitted --> TimerRunning: Updates answer counter
    }

    question --> result: Timer Expires OR Host Skips
    note right of result: Reveals Bar Chart Breakdown & Highlights Correct Answers

    result --> leaderboard: Host Clicks 'Next'
    note right of leaderboard: Displays Top 5 Players with Points & Flame Streaks

    leaderboard --> countdown: Next Question Remains
    leaderboard --> podium: Final Question Completed

    state podium {
        [*] --> ConfettiCelebration
        ConfettiCelebration --> Top3Winners: 🥇 Gold, 🥈 Silver, 🥉 Bronze
    }

    podium --> ended: Auto-Logs to History & Admin
    ended --> [*]
```

---

### 3. Admin Analytics & Email Dispatch Flow

```mermaid
flowchart LR
    A[Completed Match] --> B[recordGameHistory]
    B --> C[(Firestore / LocalStorage)]
    C --> D[Admin Dashboard /admin]
    D --> E[Metrics: Games, Players, Avg Accuracy]
    D --> F[Player & Question Drilldown Modal]
    D --> G[Export CSV Data]
    D --> H[Email API /api/send-email]
    H --> I{Provider Configured?}
    I -- Yes --> J[Resend / SMTP Delivery]
    I -- No (Dev/Free) --> K[Simulated HTML Email Generator + Preview]
```

---

## 🌟 Key Features

### 👑 For Quiz Organizers & Hosts
- **Google / Gmail Authentication**: 1-click Google OAuth (with seamless fallback mode).
- **Flexible Question Authoring Studio**:
  - **Single Choice (1 of 4)**: Classic Kahoot format (Red Triangle ▲, Blue Diamond ◆, Yellow Circle ●, Green Square ■).
  - **Multiple Choice**: Support for questions requiring players to select multiple valid answers with checkboxes and a submit confirmation button.
  - Configurable countdown timers (10s, 20s, 30s, 60s, 90s).
  - Configurable scoring with speed bonuses.
  - Cover images and custom question prompts.
- **Big Screen Arena (`/host/lobby/[pin]`)**:
  - Dynamic **4-character Game PIN** (e.g. `K9R2`).
  - Scannable **Live QR Code** on screen for instant zero-friction player joins.
  - Real-time connected player list with animated avatar entries.
  - Post-question **Bar Chart Results** breakdown with highlighted correct answers.
  - Top 5 animated **Scoreboard & Streak Tracking** (🔥 *3 in a row!*).
  - Triumphant **1st, 2nd, and 3rd Place Podium** with fireworks confetti celebration (`canvas-confetti`)!

### 🛡️ Admin Dashboard, History & Email Center (`/admin`)
- **Complete Session History**: View all previously hosted games, timestamps, PINs, participant counts, winners, and accuracy metrics.
- **Per-Question Accuracy Drilldowns**: Inspect how players performed on each individual question with animated color progress bars.
- **CSV Data Export**: 1-click download of session scorecards, rankings, and player data as `.csv` files.
- **Email Service (`/api/send-email`)**:
  - **Quiz Invitations**: Send invitation emails containing game PIN, direct join link, and QR code instructions.
  - **Session Scorecards**: Dispatch formatted HTML leaderboard reports to players or organizers after a match.
  - **Zero-Failure Mode**: Works out of the box with simulated live HTML preview, and seamlessly hooks into `RESEND_API_KEY` for production email delivery.

### 📱 For Quiz Takers / Players
- **Zero Login Friction**: Players do **not** need an account or password.
- **Scan & Play**: Join directly by pointing your phone camera at the host's QR code or entering the 4-char PIN at `/join`.
- **Avatar & Nickname Picker**: Pick a custom robot or avatar.
- **Interactive Game Pad (`/play/[pin]`)**:
  - Giant tactile shape buttons (Red Triangle, Blue Diamond, Yellow Circle, Green Square).
  - Immediate visual & haptic submission confirmation.
  - Instant score breakdown and rank reveals.
- **Built-in Audio Synthesizer**: Web Audio API generated lobby music, urgent countdown ticks, and triumphant sound chimes with zero external audio assets!

---

## 📚 10 Ready-to-Play Sample Quizzes Included

| # | Quiz Title | Topic Highlights | Question Types |
| :---: | :--- | :--- | :---: |
| 1 | **🏛️ World Capitals Showdown** | Australia, Canada, South Africa's 3 official capitals, Turkey, South America. | Single & Multi-Choice |
| 2 | **🚩 Flags of the World** | Nepal's non-rectangular flag, flags with plants, star counts, tri-color banners. | Single & Multi-Choice |
| 3 | **💰 Global Currencies & Money** | Japanese Yen, Eurozone member countries, South African Rand, Swiss Franc. | Single & Multi-Choice |
| 4 | **🗣️ World Languages & Polyglots** | Most native speakers, Switzerland's 4 national languages, Romance languages. | Single & Multi-Choice |
| 5 | **🗽 Wonders of the World & Landmarks** | Machu Picchu, New 7 Wonders, Burj Khalifa, iconic French monuments, Petra. | Single & Multi-Choice |
| 6 | **🍜 Global Cuisine & Foodie Trek** | Origins of the croissant, traditional basil pesto ingredients, Korean Kimchi. | Single & Multi-Choice |
| 7 | **🚀 Space & Astronomy Odyssey** | Hottest planets, rocky terrestrial planets, Saturn's rings, Galilean moons. | Single & Multi-Choice |
| 8 | **🔬 Science & Greatest Inventions** | Einstein's Relativity, noble gases, Mohs hardness scale, Nobel laureates. | Single & Multi-Choice |
| 9 | **🦁 Wild Kingdom & Animal Marvels** | Fastest land mammals (Cheetah), marsupials, Blue Whales, flightless birds. | Single & Multi-Choice |
| 10 | **⚡ Ultimate Tech & Coding Challenge** | JavaScript history, frontend frameworks (React, Vue, Svelte), CSS, HTTPS port 443. | Single & Multi-Choice |

---

## 🚀 Live Vercel Deployment Guide

QuizRush is designed to deploy to **Vercel** with zero hassle.

### Step 1: Push to GitHub & Import to Vercel
1. Push this repository to your GitHub account (`https://github.com/karuthevar/QuizRush.git`).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
3. Import the `QuizRush` repository. Next.js will be detected automatically.

### Step 2: (Optional) Connect Firebase for Cross-Device Real-Time Play
QuizRush works out-of-the-box in local/multi-tab mode without configuration. For live multi-device internet gameplay with Google OAuth:
1. Create a free project at [Firebase Console](https://console.firebase.google.com/) (100% free Spark Plan, no credit card required).
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

   # Optional for production email dispatch (https://resend.com):
   RESEND_API_KEY=re_xxxxxxxxxxxxxx
   ```
5. Click **Deploy**!

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

> **💡 Multi-Tab Test Tip**: Open the host screen on one browser window (`/host/dashboard`), and open an Incognito tab to `/join` with the generated 4-char PIN. Watch them sync in real time!

---

## 📄 License
MIT License. Created for the QuizRush community!
