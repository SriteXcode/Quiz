# Contributing to QuizMaster

Thank you for your interest in contributing to **QuizMaster**! We welcome contributions from engineers, designers, and educators to help make technical assessments and interactive learning accessible, engaging, and robust.

---

## 📜 Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to `security@quizplatform.com`.

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x+`
- **npm**: `v9.x+` (or `pnpm` / `yarn`)
- **MongoDB**: `v6.x+` locally running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas cloud cluster.

### 2. Fork & Clone
```bash
git clone https://github.com/your-username/Quiz.git
cd Quiz
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install client dependencies
cd ../Client
npm install
```

### 4. Environment Setup
```bash
# Backend configuration
cd ../backend
cp .env.example .env

# Client configuration
cd ../Client
cp .env.example .env
```

### 5. Running the Application
```bash
# Start backend server (Port 5000)
cd backend
npm run dev

# In a separate terminal, start frontend dev server (Port 5173)
cd Client
npm run dev
```

---

## 🌿 Branching Strategy & Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/short-gyaan-enhancements
   # or
   git checkout -b fix/certificate-scaling-bug
   ```

2. **Branch Naming Conventions:**
   - `feature/<feature-name>`: New capabilities or UX improvements
   - `fix/<bug-description>`: Bug fixes and performance patches
   - `docs/<doc-subject>`: Documentation updates
   - `refactor/<module-name>`: Code refactoring without behavioral change
   - `test/<test-suite>`: Unit or integration test additions

3. **Commit Message Format (Conventional Commits):**
   ```
   feat(shorts): add topic tags filter column and seed questions
   fix(certificate): lock recipient name to verified user profile
   docs(readme): add production deployment guide and architecture diagrams
   chore(deps): update vite and tailwindcss dependencies
   ```

---

## 🧪 Testing & Verification

Before submitting a Pull Request, ensure that:
1. Client production build compiles with **0 errors**:
   ```bash
   cd Client
   npm run build
   ```
2. Linter checks pass cleanly:
   ```bash
   npm run lint
   ```
3. Backend server starts and connects to MongoDB without unhandled rejections:
   ```bash
   cd ../backend
   npm run dev
   ```

---

## 🚀 Submitting a Pull Request

1. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request on GitHub against the `main` branch.
3. Fill out the [Pull Request Template](.github/pull_request_template.md).
4. Tag maintainers for review.

Thank you for helping build the future of developer assessment! 🌟
