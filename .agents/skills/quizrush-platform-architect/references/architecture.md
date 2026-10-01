# QuizRush System Architecture & State Synchronization

This document details the software architecture, state lifecycle, and dual-layer synchronization engine of QuizRush.

---

## 1. System Overview

```
                      +---------------------------------------+
                      |       QuizRush Next.js 14 App         |
                      +---------------------------------------+
                                      |
            +-------------------------+-------------------------+
            |                                                   |
            v                                                   v
   +-----------------+                                 +-----------------+
   |   Host Arena    |                                 |   Player View   |
   | /host/lobby/PIN |                                 |    /play/PIN    |
   +-----------------+                                 +-----------------+
            |                                                   |
            +-------------------------+-------------------------+
                                      |
                   Real-Time Synchronization Core
                                      |
            +-------------------------+-------------------------+
            |                         |                         |
            v                         v                         v
   +-----------------+       +-----------------+       +-----------------+
   |    Layer 1      |       |    Layer 2      |       |    Layer 3      |
   | Firebase Cloud  |       | Next.js Server  |       | Browser Storage |
   |    Firestore    |       | API Bridge      |       | & BroadcastCh.  |
   | (onSnapshot WS) |       | (/api/game/PIN) |       | (Same-tab sync) |
   +-----------------+       +-----------------+       +-----------------+
```

---

## 2. Dual-Layer Synchronization Mechanics

### Layer 1: Firebase Firestore (Primary Cloud)
- **Collections**:
  - `games`: Stores live `GameSession` documents keyed by 4-character PIN (e.g., `BPH2`).
  - `quizzes`: Stores custom and official quiz schemas.
  - `history`: Records completed games, player rankings, accuracy stats, and timestamps.
- **Protocol**: Real-time websocket listener via Firestore `onSnapshot`. Latency: ~50-150ms.

### Layer 2: Next.js Server API Bridge (Fallback & Cross-Device)
- **Endpoint**: `/api/game/[pin]`
- **Mechanism**:
  - Host creates or updates game -> sends `POST /api/game/[pin]`.
  - Player joins or polls -> sends `GET /api/game/[pin]`.
  - `subscribeToGame()` runs an automatic 1.2s polling interval if Firebase is unconfigured or in demo mode.
- **Benefit**: Zero-configuration multiplayer works across laptops, phones, and incognito tabs even before cloud databases are provisioned.

### Layer 3: Local Storage & BroadcastChannel
- **Key**: `quizrush_session_<PIN>`
- **Channel**: `quizrush_game_<PIN>` via browser `BroadcastChannel` API.
- **Benefit**: Instantaneous zero-latency state rendering for the host browser.

---

## 3. Game State Lifecycle

| State | Trigger | Active Components |
|---|---|---|
| `lobby` | Host initializes quiz | QR Code Card, Player Joined Counter, Audio Engine (Lobby Music) |
| `countdown` | Host clicks "Start Game" | 3-2-1 Animated Overlay, Audio Stinger |
| `question` | Timer initiates | Question Display, 4 Multi-colored Choice Shapes, Dynamic Countdown |
| `reveal` | Time expires or all answered | Correct Answer Highlight, Bar Chart Distribution, Streak Audio |
| `leaderboard` | Host clicks "Next" | Animated Podium Rankings, Top 5 Players, Streak Badges |
| `podium` | Last question concludes | Gold/Silver/Bronze 3D Podium, Confetti Cannon, History Record Creation |
| `ended` | Host closes match | Final Summary, Scorecard Email Dispatch, CSV Export |
