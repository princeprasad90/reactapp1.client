# BFF-Driven JWT Authentication Flow

This document describes the authentication flow and related components after migrating to a BFF (Backend‑for‑Frontend) model using JWT access tokens and refresh tokens.

## Overview

- The React app no longer posts credentials directly. It redirects to a centralized login (your other web application / IdP) via the BFF.
- The BFF authenticates the user, then redirects back to the React app with tokens.
- The React app stores tokens, derives the display name from the JWT, and automatically attaches the access token to API calls.
- When the access token expires, the app attempts a refresh using the refresh token.

## Key Files

- Context + token storage: `src/store/auth.tsx`
- Auth callback route: `src/features/auth/AuthCallback.tsx`
- Login redirect UI: `src/features/auth/Login.tsx`
- API helper with auto‑refresh: `src/services/api.ts`
- Layout (header, profile, logout): `src/layouts/MainLayout.tsx`
- Routes config: `src/routes/AppRoutes.tsx`
- Examples of using the API helper:
  - `src/components/ServerGrid.tsx`
  - `src/pages/PromoCodes.tsx`
  - `src/components/PaginatedSelect.tsx`

## Environment Variables

Expose these in your Vite environment (`.env` / `.env.local`). Defaults shown in parentheses:

- `VITE_AUTH_LOGIN_URL` (`/api/auth/login-redirect`): BFF endpoint that initiates login and redirects to your IdP/app.
- `VITE_AUTH_REFRESH_URL` (`/api/auth/refresh`): BFF endpoint that exchanges a refresh token for a new access token.
- `VITE_AUTH_LOGOUT_URL` (`/api/auth/logout`): BFF endpoint to end the session (also clears cookies if used).

## High-Level Flow

1. User visits `/login` in the React app.
2. React redirects to `VITE_AUTH_LOGIN_URL?returnUrl=<origin>/auth/callback`.
3. BFF authenticates the user (possibly via an external app/IdP) and then redirects back to the React app with tokens:
   - Preferred: `GET /auth/callback?access_token=...&refresh_token=...`
   - Alternative: `GET /auth/callback#access_token=...&refresh_token=...`
4. React parses the tokens, stores them, and derives the display name from the JWT payload.
5. All subsequent API calls include `Authorization: Bearer <accessToken>`.
6. If an API call returns 401, the app requests new tokens from `VITE_AUTH_REFRESH_URL` and retries once.

## Components and Responsibilities

### Auth Context: `src/store/auth.tsx`

- State:
  - `tokens: { accessToken, refreshToken?, expiresAt? } | null`
  - `user: { name } | null` (derived from JWT payload when possible)
  - `loggedIn: boolean` (true when `accessToken` exists)
- API:
  - `loginWithTokens(tokens)` stores tokens in state and `localStorage`.
  - `logout()` clears all local auth state and storage.
  - `setUser(user)` allows optional manual override of display name.
- Persistence: tokens are saved to `localStorage` under `auth.tokens.v1`.

### Auth Callback: `src/features/auth/AuthCallback.tsx`

- Parses `access_token` and `refresh_token` from the URL (query string or hash fragment).
- Calls `loginWithTokens(...)` and navigates to `/examples`.
- Cleans the URL (removes tokens) via `history.replaceState`.

### Login Page: `src/features/auth/Login.tsx`

- Displays a simple "Continue to Sign In" button.
- Redirects to `VITE_AUTH_LOGIN_URL` and appends a `returnUrl=<origin>/auth/callback` parameter.
- Optionally auto‑redirects (commented line); uncomment to skip the button.

### API Helper: `src/services/api.ts`

- `apiFetch(input, init)`
  - Attaches `Authorization: Bearer <accessToken>` from a shared in‑memory cache.
  - On 401, calls `VITE_AUTH_REFRESH_URL` with `{ refreshToken }` and `credentials: 'include'`, updates tokens, and retries once.
  - Exports `authEndpoints` and `useWireTokens()`.
- `useWireTokens()` keeps the in‑memory token cache aligned with `auth` context.

### Layout: `src/layouts/MainLayout.tsx`

- Header shows brand, navigation, and a profile section with avatar initial, user name, and Logout button.
- Logout posts to `VITE_AUTH_LOGOUT_URL` with `credentials: 'include'`, then clears local auth and navigates to `/login`.

### Routes: `src/routes/AppRoutes.tsx`

- Defines `/login`, `/auth/callback`, and gated routes for the app content.
- Redirects unauthenticated users to `/login`.

## Sequence Details

### 1) Begin Login

- User visits `/login`.
- React builds a URL to `VITE_AUTH_LOGIN_URL` and adds `returnUrl=<origin>/auth/callback`.
- Browser navigates to the BFF.

### 2) BFF + External App/IdP

- BFF handles discovery and redirects to your central app/IdP where the user selects access and signs in.
- After authentication, BFF obtains tokens.
- BFF redirects back to the React app with tokens:

```
GET https://yourapp.example.com/auth/callback?access_token=...&refresh_token=...
```

### 3) React Callback

- `AuthCallback` reads tokens from query or hash.
- Calls `loginWithTokens({ accessToken, refreshToken })`.
- Derives a display name from the JWT payload claims (`name`, `preferred_username`, or `sub`).
- Navigates to `/examples`.

### 4) Authed API Calls

- Use `apiFetch(url, init)` instead of `fetch`.
- `apiFetch` adds `Authorization` header automatically.
- On 401, attempts refresh at `VITE_AUTH_REFRESH_URL` and retries once.

## BFF Contract

- Login redirect endpoint (`VITE_AUTH_LOGIN_URL`):
  - Accepts `returnUrl` (full absolute URL back to React).
  - After authentication, redirects to `returnUrl` with tokens included.
- Refresh endpoint (`VITE_AUTH_REFRESH_URL`):
  - `POST` JSON `{ refreshToken: string }`. If your refresh token is an httpOnly cookie, the body value can be ignored; requests include `credentials: 'include'`.
  - Response JSON: `{ accessToken: string, refreshToken?: string }` (refresh token optional if unchanged).
- Logout endpoint (`VITE_AUTH_LOGOUT_URL`):
  - `POST` clears server session/cookies; client will clear local state on success/finally.

## Migrating API Calls

- Replace `fetch` with `apiFetch` for all endpoints that require authentication.
- Examples updated:
  - `src/components/ServerGrid.tsx`
  - `src/pages/PromoCodes.tsx`
  - `src/components/PaginatedSelect.tsx`

## Error Handling & Edge Cases

- Missing tokens on callback: navigate to `/login`.
- Malformed JWT payload: user name falls back to "User"; access token still used.
- Refresh failure or 401 loop: the original 401 response is returned, allowing callers to handle a forced logout/redirect.
- Storage unavailable (private mode): operations are wrapped in try/catch; the app still works for the session but won’t persist across reloads.

## Security Considerations

- Prefer storing refresh tokens in httpOnly, secure cookies set by the BFF. The client already sends `credentials: 'include'` on refresh/logout.
- Access tokens are stored in memory and persisted to `localStorage` via `auth.tsx`. Consider shortening access token lifetime (e.g., 5–15 minutes) and rely on refresh.
- Always serve over HTTPS and set strict CORS/CSRF protections on the BFF.

## Customizing User Display Name

If your JWT uses different claims, adjust `src/store/auth.tsx` where the name is derived from the token payload.

```ts
const payload = JSON.parse(atob(tokens.accessToken.split('.')[1] || '')) as any;
const name = payload?.name || payload?.preferred_username || payload?.email || payload?.sub || 'User';
```

## Testing the Flow Locally

- Configure `.env.local` with your BFF endpoints.
- Open the app and click "Continue to Sign In".
- After your BFF redirects back with tokens, verify:
  - Header shows your name.
  - Authed pages load data without 401.
  - Expire/rotate the access token on the server to test refresh behavior.

## FAQ

- Q: Can the BFF return tokens in the hash fragment instead of query?
  - A: Yes. The callback parses both.
- Q: Do I need to change every `fetch`?
  - A: Only calls that require authorization. For consistency, using `apiFetch` everywhere is fine.
- Q: Can I auto‑redirect from `/login`?
  - A: Yes—uncomment the `beginLogin()` call in `Login.tsx`.

---

For implementation references, see the file paths listed above. Update the env variables to point at your BFF endpoints before deploying.


## Profile-Based Menus (Added)

- Initial entry can include `?profileId=<id>` on the SPA (`/` route).
- The login flow forwards `profileId` to the BFF when calling `VITE_AUTH_LOGIN_URL`.
- The BFF encodes `profile_id` in the access token claims and persists it in an httpOnly cookie.
- The React layout fetches menus from `GET /api/menus?profileId=<id>` (falls back to token claims) and renders the navigation dynamically.

### Endpoints

- `GET /api/menus?profileId=<id>`: returns `{ items: [{ id, label, path }] }` filtered by profile.

#### Auth Endpoints (Current Implementation)

- `GET /api/auth/login-redirect`
  - Query: `returnUrl` (required), `profileId` (optional)
  - Behavior: issues tokens, sets httpOnly cookies, redirects to `returnUrl` with `access_token` and `refresh_token` as query params.
- `POST /api/auth/refresh`
  - Body: `{ refreshToken?: string }` (optional if cookie present)
  - Behavior: returns `{ accessToken, refreshToken?: null }` and keeps cookies.
- `POST /api/auth/logout`
  - Behavior: clears auth cookies; client clears local state.

#### Example Responses

`GET /api/menus?profileId=admin` →

```json
{
  "items": [
    { "id": "examples", "label": "Examples", "path": "/examples" },
    { "id": "promocodes", "label": "Promo Codes", "path": "/promocodes" },
    { "id": "change-password", "label": "Change Password", "path": "/change-password" }
  ]
}
```
