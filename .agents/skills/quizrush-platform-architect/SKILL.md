---
name: quizrush-platform-architect
description: >-
  Architects, deploys, secures, monetizes, and operates the QuizRush live interactive multiplayer quiz platform. Enforces dual-sync real-time game state (Firebase Firestore + Next.js server API bridge), secret admin gatekeeper cloaking (/gate-x9k2 with 404 disguise and robots anti-indexing), Stripe monetization ($4.99 per pass after 1 free trial), automated scorecard emails, curated sample quizzes, and zero credential exposure on GitHub with Vercel deployment standards.
---

# QuizRush Platform Architect & Operations Skill

This skill provides comprehensive architecture guidelines, security rules, deployment procedures, monetization patterns, and operational runbooks for the **QuizRush** live interactive multiplayer quiz platform.

---

## ⚡ Quick Reference Matrix

| Domain | Specification | Key File / Endpoint |
|---|---|---|
| **Production Domain** | `https://quizrush-mu.vercel.app` | Vercel Serverless / Edge |
| **Secret Admin Gate** | Non-crawlable entry portal | [`/gate-x9k2`](file:///c:/antigravity-projects/QuizRush/src/app/gate-x9k2/page.tsx) |
| **Admin Console** | History, monetization & analytics | [`/admin`](file:///c:/antigravity-projects/QuizRush/src/app/admin/page.tsx) (404 Cloaked) |
| **Default Passkey** | Master admin emergency passkey | `QuizRush@Admin2026!` |
| **Default Admin Email** | Single/multi authorized admin | `karuthevar22@gmail.com` |
| **Passkey API** | Server-side verification | [`/api/admin/verify-passkey`](file:///c:/antigravity-projects/QuizRush/src/app/api/admin/verify-passkey/route.ts) |
| **Game Sync Bridge** | Cross-device server fallback | [`/api/game/[pin]`](file:///c:/antigravity-projects/QuizRush/src/app/api/game/[pin]/route.ts) |
| **Stripe Checkout** | $4.99 single pass purchase | [`/api/checkout`](file:///c:/antigravity-projects/QuizRush/src/app/api/checkout/route.ts) |
| **Email Dispatch** | Scorecards and game invitations | [`/api/send-email`](file:///c:/antigravity-projects/QuizRush/src/app/api/send-email/route.ts) |

---

## 🛡️ Core Architectural Pillars

### 1. Zero Credential Exposure Protocol
- **Rule**: Never commit secrets, API keys, or `.env*` files to Git.
- **Enforcement**: Ensure `.gitignore` contains `.env`, `.env*.local`, and `.env.local`.
- **Validation**: Run `git status` and `git diff` before any commit to ensure no API key or token is staged.

### 2. Dual-Layer Real-Time Multiplayer Sync
QuizRush must work seamlessly on both fully configured cloud infrastructure and zero-config demo environments:
- **Layer 1 (Production Cloud)**: Firebase Cloud Firestore (`games` and `quizzes` collections) with real-time `onSnapshot` listeners.
- **Layer 2 (Server Bridge Fallback)**: Central Next.js API route (`/api/game/[pin]`) with in-memory caching and 1.2s polling fallback in `subscribeToGame()`.
- **Layer 3 (Browser Cache)**: `localStorage` and `BroadcastChannel` for zero-latency local tab updates.

### 3. Secret Admin Gatekeeper & 404 Cloaking Defense
- **Private Gatekeeper URL**: Hosted at [`/gate-x9k2`](file:///c:/antigravity-projects/QuizRush/src/app/gate-x9k2/page.tsx). Never link this URL in public navigation, headers, or footers.
- **Anti-Crawl Directives**:
  - [robots.ts](file:///c:/antigravity-projects/QuizRush/src/app/robots.ts) disallows `/admin*`, `/gate-x9k2*`, `/api*`.
  - [admin/layout.tsx](file:///c:/antigravity-projects/QuizRush/src/app/admin/layout.tsx) and [gate-x9k2/layout.tsx](file:///c:/antigravity-projects/QuizRush/src/app/gate-x9k2/layout.tsx) inject `robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true }`.
- **404 Cloaking**: Direct requests to `/admin` without an active 24-hour admin session render an authentic `404 Page Not Found` component rather than an unauthorized prompt, concealing the existence of the console.
- **Graceful Logout**: Exiting admin triggers `router.replace('/')` with a transition screen so the user lands safely on the homepage without flashing the 404 cloaking screen.

### 4. Monetization & Billing Engine
- **Pricing**: $4.99 per quiz pass after 1 free trial.
- **Stripe**: Handled via server route `/api/checkout` creating Stripe Checkout sessions.
- **Demo Mode**: Includes simulated checkout fallback for testing without live Stripe keys.

---

## 📋 Operational Runbooks

### Runbook A: Deploying to Vercel with Cloud Firestore

#### 1. Configure Vercel Environment Variables
Set the following under **Vercel Dashboard > Project Settings > Environment Variables**:

```env
# Application Host
NEXT_PUBLIC_APP_URL=https://quizrush-mu.vercel.app

# Firebase Client Configuration (Spark Plan - Free)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBTzMDlk-PMwdb1kaItQF9PZ9FGMF0e4EE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=quizrush-e98f8.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=quizrush-e98f8
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=quizrush-e98f8.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=487949977363
NEXT_PUBLIC_FIREBASE_APP_ID=1:487949977363:web:2dbb374b20b7a9d3a0bce6

# Admin Security Overrides
NEXT_PUBLIC_ADMIN_EMAIL=karuthevar22@gmail.com
ADMIN_SECRET_KEY=QuizRush@Admin2026!

# Monetization (Stripe)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email Scorecards (Resend)
RESEND_API_KEY=re_...
```

#### 2. Configure Firebase Cloud Firestore
1. Navigate to [Firebase Console](https://console.firebase.google.com/project/quizrush-e98f8/firestore).
2. Create database in `nam5 (us-central)` or regional equivalent in **Test Mode**.
3. Under the **Rules** tab, ensure read/write access:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
4. In **Authentication > Settings > Authorized Domains**, add `quizrush-mu.vercel.app`.

---

### Runbook B: Verifying Build & Safe Git Push

Always run verification before pushing to ensure documentation integrity and zero secret leaks:

```powershell
$env:PATH = "C:\Users\karu\AppData\Local\Programs\nodejs;C:\Program Files\Git\cmd;$env:PATH"
npm run build
git status
# Confirm .env.local is NOT staged
git commit -m "feat: <description>"
git push origin main
```

---

## 📚 Deep-Dive References

- [System Architecture & State Flow](./references/architecture.md)
- [Security, Gatekeeper & Cloaking Architecture](./references/security-and-cloaking.md)
- [Monetization, Billing & Stripe Integration](./references/monetization-and-billing.md)
- [Vercel & Firebase Setup Guide](./references/vercel-and-firebase-runbook.md)
