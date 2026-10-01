# Vercel & Firebase Production Setup Runbook

This runbook provides the definitive setup checklist to provision and connect Firebase Cloud Firestore with Vercel for QuizRush.

---

## 1. Firebase Project Provisioning Checklist

### A. Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/) > Select `quizrush-e98f8`.
2. Navigate to **Build** > **Authentication**.
3. Under the **Sign-in method** tab:
   - Enable **Google** provider.
   - Set support email to `karuthevar22@gmail.com`.
4. Under the **Settings** > **Authorized Domains** tab:
   - Add `quizrush-mu.vercel.app`.
   - Add `localhost`.

### B. Cloud Firestore Database
1. Navigate to **Build** > **Firestore Database**.
2. If the database is not created, click **Create database**.
   - **Database ID**: `(default)`
   - **Location**: `nam5 (us-central)` or closest region.
   - **Secure rules**: Select **Start in test mode** (allows read/write).
3. Under the **Rules** tab, ensure the following is published:
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

---

## 2. Vercel Environment Variables Configuration

In the [Vercel Dashboard](https://vercel.com/) > **QuizRush** > **Settings** > **Environment Variables**, configure:

| Variable Name | Production Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://quizrush-mu.vercel.app` | Canonical app URL for QR codes and emails |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyBTzMDlk-PMwdb1kaItQF9PZ9FGMF0e4EE` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `quizrush-e98f8.firebaseapp.com` | OAuth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `quizrush-e98f8` | Firestore database project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `quizrush-e98f8.firebasestorage.app` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `487949977363` | Push notification ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:487949977363:web:2dbb374b20b7a9d3a0bce6` | Web Client App ID |
| `NEXT_PUBLIC_ADMIN_EMAIL` | `karuthevar22@gmail.com` | Single or comma-separated admin emails |
| `ADMIN_SECRET_KEY` | `QuizRush@Admin2026!` | Master emergency admin passkey |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe secret key for live passes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe publishable key |
| `RESEND_API_KEY` | `re_...` | Resend email dispatch key |

---

## 3. Common Troubleshooting Scenarios

### Issue: "No active game found for PIN ABCD"
- **Cause**: Firebase keys were missing on Vercel, causing the host to store the PIN in local browser storage only.
- **Resolution**: QuizRush now automatically syncs to `/api/game/[pin]` as a server fallback, and connecting Firebase Firestore resolves it permanently via real-time websockets.

### Issue: "Access Denied: Email 'organizer@demo.com' is not authorized"
- **Cause**: Firebase was unconfigured on Vercel, causing the mock user generator to supply `organizer@demo.com`.
- **Resolution**: Both `karuthevar22@gmail.com` and `organizer@demo.com` are now whitelisted, and adding Firebase variables enables real Google OAuth popups.
