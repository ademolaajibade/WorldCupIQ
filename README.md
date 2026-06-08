# WorldCupIQ

A World Cup 2026 trivia and knowledge platform with web and mobile applications. Test and improve your FIFA World Cup knowledge through daily challenges, tournament battles, leaderboards, and premium question packs — with support for both Nigerian (NGN) and international (USD) payments.

---

## Features

- **Daily Challenges** — Fresh World Cup questions every day with streak tracking and streak shields
- **Quick Play** — Fast-paced quiz sessions with difficulty and category filters (premium)
- **Trivia Packs** — Deep-dive question sets on specific tournaments and topics
- **Tournament Challenges** — Special event-based trivia with badges
- **Global & Country Leaderboards** — Compete with players worldwide or by country (premium)
- **Friends Leaderboard** — Compete within your referral network
- **Achievements** — Unlockable badges based on gameplay milestones
- **Premium Subscriptions** — Paystack (₦3,500/mo) for Nigeria, Flutterwave ($4.99/mo) for international
- **Embed Widgets** — Embeddable trivia widget for third-party websites
- **Google OAuth** — Sign in with Google on both web and mobile
- **Push Notifications** — Mobile alerts via Expo
- **Admin Dashboard** — User management, question management, and platform analytics
- **Anti-Cheat** — Session locking and minimum time validation

---

## Tech Stack

### Backend
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **Cache:** Upstash Redis (REST API)
- **Auth:** JWT, Google OAuth, bcryptjs
- **Payments:** Paystack (NGN), Flutterwave (USD)
- **Email:** Resend
- **Push Notifications:** Expo Server SDK
- **File Uploads:** Cloudinary + Multer
- **Jobs:** node-cron (daily challenge generation, streak reset)
- **Validation:** Zod
- **Testing:** Jest, Supertest, MongoDB Memory Server

### Web
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **State:** Zustand
- **Data Fetching:** TanStack React Query + Axios
- **Forms:** React Hook Form + Zod

### Mobile
- **Framework:** Expo SDK 54 + Expo Router
- **Runtime:** React Native 0.81 + React 19
- **Language:** TypeScript
- **State:** Zustand
- **Data Fetching:** TanStack React Query + Axios
- **Storage:** Expo SecureStore + AsyncStorage
- **Auth:** Expo Auth Session (Google OAuth)

---

## Project Structure

```
WorldCupIQ/
├── worldcupiq-backend/        # Node.js REST API
│   └── src/
│       ├── config/            # DB, Redis, payment, cloud configs
│       ├── controllers/       # Route handlers (auth, trivia, payments, admin…)
│       ├── jobs/              # Cron jobs
│       ├── middlewares/       # Auth, rate limiting, anti-cheat, session lock
│       ├── models/            # Mongoose schemas
│       ├── routes/            # API route definitions
│       ├── services/          # Business logic (leaderboard, achievements, email…)
│       ├── utils/             # Constants, helpers, Zod validators
│       └── webhooks/          # Paystack & Flutterwave webhook handlers
│
├── worldcupiq-web/            # Next.js web app
│   └── src/
│       ├── app/               # App Router pages ((app), (auth), admin, payments)
│       ├── components/        # Reusable UI components
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # API client, utilities
│       ├── store/             # Zustand stores
│       └── types/             # TypeScript types
│
└── worldcupiq-mobile/         # Expo mobile app
    ├── app/                   # File-based routes ((app), (auth), (admin))
    ├── assets/                # Images, fonts, media
    └── src/
        ├── api/               # API client functions
        ├── components/        # Reusable components
        ├── store/             # Zustand stores
        ├── types/             # TypeScript types
        └── utils/             # Helper functions
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Upstash Redis account
- Cloudinary account
- Paystack and/or Flutterwave account
- Resend account (email)
- Expo CLI (for mobile)

### 1. Backend

```bash
cd worldcupiq-backend
npm install
cp .env.example .env   # fill in your environment variables
npm run dev
```

Runs on `http://localhost:5000`

### 2. Web

```bash
cd worldcupiq-web
npm install
cp .env.example .env.local   # fill in your environment variables
npm run dev
```

Runs on `http://localhost:3000`

### 3. Mobile

```bash
cd worldcupiq-mobile
npm install
npm start
```

Scan the QR code with the Expo Go app, or run `npm run ios` / `npm run android`.

---

## Environment Variables

### Backend (`worldcupiq-backend/.env`)

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_PREMIUM_PLAN_CODE=
PAYSTACK_WEBHOOK_SECRET=

FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_ENCRYPTION_KEY=
FLUTTERWAVE_PREMIUM_PLAN_ID=
FLUTTERWAVE_WEBHOOK_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
EXPO_ACCESS_TOKEN=

FRONTEND_URL=http://localhost:3000

ADMIN_EMAIL=
ADMIN_PASSWORD=
```

### Web (`worldcupiq-web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Mobile (`worldcupiq-mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://192.168.1.x:5000/api/v1
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Email registration |
| POST | `/api/v1/auth/login` | Email login |
| POST | `/api/v1/auth/google` | Google OAuth |
| GET | `/api/v1/trivia/daily` | Get daily challenge |
| POST | `/api/v1/trivia/answer` | Submit answer |
| POST | `/api/v1/trivia/finish` | Complete session |
| GET | `/api/v1/leaderboard/global` | Global rankings |
| GET | `/api/v1/packs` | List question packs |
| POST | `/api/v1/payments/initialize` | Start payment flow |
| POST | `/api/v1/widgets` | Create embed widget |
| GET | `/api/v1/admin/stats` | Platform stats (admin) |

---

## Scripts

### Backend
```bash
npm run dev        # Development with auto-reload
npm start          # Production
npm test           # Run all tests
npm run seed       # Seed database
```

### Web
```bash
npm run dev        # Development
npm run build      # Production build
npm run lint       # Lint code
```

### Mobile
```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
```

---

## License

MIT
