# QuizRush Security & Cloaking Architecture

This document specifies the threat model, cloaking mechanics, crawler blacklisting, and authentication safeguards protecting the QuizRush administrative interface.

---

## 1. Threat Model & Design Goals

1. **Zero Public Discoverability**: Unauthorized users and web crawlers should never be able to discover the administrative URL through public navigation, sitemaps, or robots indexing.
2. **Concealment over Rejection**: If an unauthenticated user guesses the `/admin` URL, they must see an authentic **404 Not Found** page rather than an authorization challenge, concealing the fact that an admin panel exists.
3. **Multi-Factor Administrative Options**: The admin can enter via either Google OAuth (with an email whitelist) or a master passkey.
4. **Server-Side Credential Validation**: Passkeys must never be evaluated solely in client-side code where bundles can be unpacked and inspected.

---

## 2. The Secret Gatekeeper (`/gate-x9k2`)

- **URL**: `https://quizrush-mu.vercel.app/gate-x9k2`
- **Visibility**: Strictly non-crawlable, no public links in Navbar, Footer, or UI.
- **Features**:
  - **Google OAuth Login**: Validates the authenticated email against `NEXT_PUBLIC_ADMIN_EMAIL` (default: `karuthevar22@gmail.com`). Multiple emails supported via comma separation.
  - **Master Passkey**: Evaluated against `ADMIN_SECRET_KEY` / `NEXT_PUBLIC_ADMIN_PASSKEY` / `DEFAULT_ADMIN_PASSKEY`.
  - **UI Helpers**: Eye visibility toggle (`Eye`/`EyeOff`), 1-click **Auto-fill** button for quick emergency entry, and loading states.
  - **Obscured Footer**: Displays a generic security notice (`Encrypted Admin Portal • Authorized Personnel Only`) rather than exposing administrator email addresses.

---

## 3. 404 Cloaking Defense on `/admin`

- In [admin/page.tsx](file:///c:/antigravity-projects/QuizRush/src/app/admin/page.tsx), `verifyAdminSession()` checks for a valid session token in `sessionStorage`/`localStorage`.
- **Unauthorized Visit**: If false, the component renders the complete 404 UI identical to [not-found.tsx](file:///c:/antigravity-projects/QuizRush/src/app/not-found.tsx).
- **Authorized Visit**: If true, it renders the full Admin, History, Revenue & Analytics Hub.
- **Graceful Logout**: When clicking **Exit Admin**, `isExiting` state is engaged, the token is cleared, and `router.replace('/')` transports the user to the public homepage with an animated transition to avoid flashing the 404 page.

---

## 4. Search Engine & Crawler Exclusion

### `src/app/robots.ts`
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/gate-x9k2',
          '/gate-x9k2/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### Route Layout Metadata
Both `src/app/admin/layout.tsx` and `src/app/gate-x9k2/layout.tsx` inject:
```typescript
robots: {
  index: false,
  follow: false,
  nocache: true,
  noarchive: true,
  nosnippet: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    'max-video-preview': -1,
    'max-image-preview': 'none',
    'max-snippet': -1,
  },
}
```
