# 🏆 brainArena — Production Full-Stack Assessment & Learning Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B-green.svg)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![Express.js](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)

**A certified, modern, interactive developer assessment platform featuring Real-Time Live Quizzes, Short Gyaan Micro-Learning Reels, Anti-Cheat Camera/Mic Proctoring, Dynamic Certificates, and Multi-Tier Reward Leaderboards.**

[Explore Features](#-core-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start-guide) • [API Reference](#-api-endpoints) • [Deployment](#-production-deployment) • [Contributing](#-contributing)

</div>

---

## 📖 Table of Contents
1. [Platform Overview](#-platform-overview)
2. [Core Features](#-core-features)
3. [Architecture & Tech Stack](#-tech-stack)
4. [Project Directory Structure](#-directory-structure)
5. [Quick Start Guide](#-quick-start-guide)
6. [Environment Variables](#-environment-variables)
7. [REST API Endpoints](#-api-endpoints)
8. [Excel Question Ingestion & Templates](#-excel-question-ingestion--templates)
9. [Anti-Cheating & Proctoring](#-anti-cheating--proctoring)
10. [Production Deployment](#-production-deployment)
11. [Contributing & Security](#-contributing--security)
12. [License](#-license)

---

## 🌟 Platform Overview

**brainArena** is built for engineering teams, educational institutions, and developers. It combines rigorous full-stack technical evaluations with engaging, bite-sized micro-learning concepts.

Whether running high-stakes timed coding challenges with webcam proctoring, generating tamper-proof completion certificates, or practicing core computer science concepts through vertical Reels, brainArena provides a polished experience across all screen sizes.

---

## ⚡ Core Features

### 1. 🎯 Live Quizzes & Coding Challenges
- **Dynamic Exam Timing**: Uniform per-question timers (e.g. 15s/Q), custom per-question timers, or full exam countdowns.
- **Code Pattern & Bug-Fixing Challenges**: Syntax-highlighted code inspection where candidates identify bugs, predict outputs, or optimize algorithm complexities.
- **Problem Solving IDE**: Real-world coding problems with test cases, hidden validation cases, hints, and language selection.
- **Anti-Cheat Proctoring Engine**: Live webcam stream, microphone monitoring, fullscreen enforcement, tab-switch detection, and multi-face/head-pose detection.

### 2. ⚡ Short Gyaan (Micro-Learning Reels)
- **Vertical Feed & Quick Quiz Shorts**: 30-second rapid-fire questions with instant answer verification, code explanations, and engineering takeaways.
- **Topic Filter Column**: Filter shorts by Java Core, OOPs Concepts, Polymorphism, Abstraction, Inheritance, Encapsulation, JavaScript ES6+, React, DSA, Python, System Design, and CSS.
- **Voice Synthesis & Multi-Language Support**: High-fidelity text-to-speech reading questions and verified solutions aloud in multiple accents and languages.
- **Bookmark & Bookmarked Offline Storage**: Save Gyaan items for quick interview prep revision.

### 3. 📜 Dynamic Verified Certificates
- **Tamper-Proof Verification**: Unique Certificate IDs, verification URLs, and QR codes.
- **Locked Verified Identity**: Recipient names tied directly to authenticated user accounts to ensure credential integrity.
- **Royal Gold Certificate Theme**: High-resolution print styling and image/PDF export.

### 4. 📊 Multi-Tier Rewards & Leaderboards
- **Rank Groups & Cash Tiers**: 1st, 2nd, 3rd place podium badges, rank group tiers (e.g. 4-10th, 11-50th), and participation XP points.
- **Dynamic Leaderboard Telemetry**: Accuracy percentages, speed multipliers, and real-time score ranking.

### 5. 🛡️ Comprehensive Admin Portal
- **Quizzes & Works Manager**: Create, schedule, edit, archive quizzes, and manage competition showcases.
- **Excel Spreadsheet Bulk Ingestion**: 1-click download of `.xlsx` templates and bulk question uploads for both Quizzes and Short Gyaan.
- **User Role Management**: Promote/demote administrators and audit user profiles.
- **Communications Hub**: Triage user inquiries with priority filtering and read status toggles.

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework**: React 19 (Hooks, Context, Optimistic UI)
- **Build Tool**: Vite 8 with Rolldown compiler
- **Styling**: Tailwind CSS v4 & Vanilla CSS Custom Tokens
- **Spreadsheet Processing**: `xlsx` (SheetJS) for client-side `.xlsx`/`.csv` generation & parsing
- **Icons & Visuals**: Unicode & SVG-based iconography

### Backend (Server)
- **Runtime**: Node.js (`v18+` / `v20+`)
- **Server Framework**: Express 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) with bcryptjs password hashing
- **File & Media Storage**: Cloudinary SDK
- **Security & Middleware**: CORS, Dotenvx, Custom Auth Guards

---

## 📁 Directory Structure

```text
Quiz/
├── .github/                      # GitHub Actions CI & issue/PR templates
│   ├── workflows/ci.yml          # Automated CI pipeline
│   ├── ISSUE_TEMPLATE/           # Bug report & feature request templates
│   └── pull_request_template.md  # PR review checklist
├── backend/                      # Express.js REST API Server
│   ├── config/                   # Database & Cloudinary configurations
│   ├── controllers/              # Route controllers (Auth, Quiz, Shorts, Admin)
│   ├── middleware/               # Auth verification, admin guard & validation
│   ├── models/                   # Mongoose Data Schemas (User, Quiz, ShortGyaan)
│   ├── routes/                   # REST Route Definitions
│   ├── server.js                 # Backend Server Entry Point
│   ├── .env.example              # Server Environment Template
│   └── package.json              # Backend Dependencies
├── Client/                       # React 19 Frontend Application
│   ├── src/
│   │   ├── admin/                # Admin Control Portal Dashboard
│   │   ├── components/           # Navbar, Footer, CertificateModal, LiveQuizzes
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── pages/                # QuizPage, ShortGyaanPage, QuizExecutionPage, etc.
│   │   ├── services/             # API client & REST services
│   │   ├── utils/                # Date math, countdowns & excelTemplateUtils
│   │   ├── App.jsx               # Root Application Component
│   │   └── main.jsx              # DOM Entry Point
│   ├── .env.example              # Client Environment Template
│   ├── vite.config.js            # Vite Build Configuration
│   └── package.json              # Client Dependencies
├── .editorconfig                 # Cross-IDE code style enforcement
├── .gitignore                    # Production Git Ignore rules
├── CONTRIBUTING.md               # Contribution workflow & commit conventions
├── CODE_OF_CONDUCT.md            # Contributor Covenant v2.1
├── LICENSE                       # MIT License
├── package.json                  # Root Monorepo Orchestration Scripts
├── README.md                     # Project Documentation
└── SECURITY.md                   # Vulnerability reporting guidelines
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** `v18.x` or `v20.x+`
- **npm** `v9.x+` (or `pnpm` / `yarn`)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Quiz.git
cd Quiz
```

### 2. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Setup Environment Files
```bash
# Copy backend environment template
cp backend/.env.example backend/.env

# Copy frontend environment template
cp Client/.env.example Client/.env
```

### 4. Start Development Servers
```bash
# Run both servers concurrently from root:
npm run dev

# Or run separately in two terminals:
# Terminal 1: Backend (Port 5000)
cd backend && npm run dev

# Terminal 2: Frontend (Port 5173)
cd Client && npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PORT` | Backend HTTP Port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `MONGO_URI` | MongoDB Connection String | `mongodb://127.0.0.1:27017/quiz_db` |
| `JWT_SECRET` | 256-bit Secret Key for signing JWTs | *(Required)* |
| `CORS_ORIGIN` | Whitelisted frontend origins (comma-separated) | `http://localhost:5173,http://localhost:5174` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Account Cloud Name | *(Optional)* |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | *(Optional)* |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret Key | *(Optional)* |

### Client (`Client/.env`)
| Variable | Description | Default |
| -------- | ----------- | ------- |
| `VITE_API_URL` | Base endpoint for backend REST API | `http://localhost:5000/api` |

---

## 📡 REST API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new student/candidate account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Get current authenticated user profile
- `PUT /api/auth/profile` — Update avatar, school, phone & profile details

### 📝 Quizzes & Assessments (`/api/quizzes`)
- `GET /api/quizzes` — Fetch all public quizzes with live status & countdowns
- `GET /api/quizzes/:id` — Get detailed quiz metadata and question payload
- `POST /api/quizzes/:id/submit` — Submit answers, calculate score, issue certificate
- `GET /api/quizzes/:id/leaderboard` — Get ranked leaderboard standings
- `GET /api/quizzes/:id/review` — Post-exam solution review with explanations
- `GET /api/quizzes/user/certificates` — Fetch user earned certificates
- `GET /api/quizzes/certificate/:id` — Public certificate verification lookup

### ⚡ Short Gyaan Reels (`/api/shorts`)
- `GET /api/shorts` — List questions (filters: `category`, `search`, `savedOnly`)
- `POST /api/shorts/:id/like` — Toggle like reaction
- `POST /api/shorts/:id/save` — Toggle saved bookmark
- `POST /api/shorts/admin/upload-excel` — Bulk ingest questions from Excel/CSV *(Admin)*
- `POST /api/shorts/admin/create` — Create single short question *(Admin)*
- `DELETE /api/shorts/admin/:id` — Remove short question *(Admin)*

### 🛡️ Admin Control Suite (`/api/admin`)
- `GET /api/admin/stats` — Live system overview & telemetry metrics
- `GET /api/admin/users` — Directory of registered users & filter by role
- `PUT /api/admin/users/:id/role` — Promote/demote admin permissions
- `DELETE /api/admin/users/:id` — Delete user account
- `GET /api/admin/quizzes` — Fetch all assessments
- `POST /api/admin/quizzes` — Create assessment challenge with reward tiers
- `PUT /api/admin/quizzes/:id` — Edit quiz configuration
- `DELETE /api/admin/quizzes/:id` — Delete quiz
- `GET /api/admin/messages` — Contact inquiries with priority & read filters

---

## 📊 Excel Question Ingestion & Templates

Both **Quiz Assessments** and **Short Gyaan Reels** support 1-click Excel `.xlsx` template downloads and spreadsheet uploads:

| Feature | Short Gyaan Modal | Quizzes Hub & Builder |
| ------- | ----------------- | --------------------- |
| **Download Template** | `Short_Gyaan_Questions_Template.xlsx` | `Quiz_Questions_Template.xlsx` |
| **Supported Formats** | `.xlsx`, `.xls`, `.csv` | `.xlsx`, `.xls`, `.csv` |
| **Required Columns** | `Question`, `Option A-D`, `Correct Answer`, `Explanation`, `Category`, `Timer` | `Question`, `Question Type`, `Code Snippet`, `Option A-D`, `Correct Answer`, `Explanation` |

---

## 👁️ Anti-Cheating & Proctoring

brainArena includes an integrated browser-based anti-cheating suite:
- **Webcam Proctoring**: Candidate webcam stream with face presence verification.
- **Audio Sensitivity**: Background noise & multi-voice anomaly alerts.
- **Fullscreen & Focus Monitoring**: Detects window blur, tab switching, and developer tools inspection.
- **Integrity Score Log**: Calculates a proctoring trust score included in the exam submission review.

---

## 🚢 Production Deployment

### 1. Build Client Bundle
```bash
cd Client
npm run build
```
The optimized production bundle is generated in `Client/dist/`.

### 2. Run Backend with Process Manager (PM2)
```bash
cd backend
npm install -g pm2
pm2 start server.js --name "brainarena-api"
pm2 save
```

### 3. Static Hosting
- **Vercel / Netlify / Cloudflare Pages**: Deploy the `Client/dist` directory with Single-Page Application (SPA) rewrite rules to `/index.html`.
- **Docker**: Package backend and frontend into multi-stage container builds.

---

## 🤝 Contributing & Security

We welcome community contributions! Please review our:
- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<div align="center">
Built with ❤️ for modern developers and educators worldwide.
</div>
