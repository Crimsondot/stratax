# Strata-X Auth Server

Authentication server for Strata-X MineGuard AI using Better Auth.

## Features

- Email/Password authentication
- Google OAuth sign-in
- Session management
- SQLite database with Drizzle ORM
- Email OTP sign-in through Resend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. Set up Google OAuth (optional):
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 credentials
   - Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

4. For email OTP, add a `RESEND_API_KEY` and use a verified sending domain.

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

The auth server runs on `http://localhost:3001` and provides:

- `POST /api/auth/sign-in/email` - Email/password sign-in
- `POST /api/auth/sign-up/email` - Email/password sign-up
- `POST /api/auth/sign-in/social` - Social provider sign-in (Google)
- `GET /api/auth/get-session` - Get current session
- `POST /api/auth/sign-out` - Sign out

## Frontend Integration

The React frontend connects to this server using the Better Auth client configured in `src/services/betterAuthClient.ts`.

The dashboard is protected: it restores the Better Auth cookie on launch and only
renders after a valid session is present. Set `VITE_AUTH_SERVER_URL` in the
frontend environment when the auth server is hosted anywhere other than
`http://localhost:3001`.
