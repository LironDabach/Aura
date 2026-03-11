# 👾 Aura

Aura is a full-stack social platform where users can register/login, publish posts, comment, like, and use AI-assisted post search.

## 👨🏻‍🏫 Team
- **מרצה:** אליאב מנשה
- **סטודנטים:** שירן לוי (324127315), לירון דבח (322439027)

## 🧱 Tech Stack
- **Client:** React + TypeScript + Vite
- **Server:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT access token + refresh token flow
- **Docs:** Swagger (`/api-docs`)

## 🧠 Features
- Email/password authentication
- Google OAuth login (`/api/auth/google`)
- CRUD for posts, comments, and likes
- AI-powered post search (`/api/post/search/ai`)
- Swagger/OpenAPI endpoints:
  - `GET /api-docs`
  - `GET /api-docs.json`

## 🗂️ Repository Structure
- `client/` React app
- `server/` Express API
- `server/src/routes` API endpoints
- `server/src/controllers` request handlers
- `server/src/models` Mongoose models
- `server/src/services` business/AI services
- `server/src/tests` Jest and Supertest coverage

## ✅ Prerequisites
- Node.js (LTS)
- npm
- MongoDB (local or remote)

## 🌱 Environment Variables

The project now uses a single repository-root `.env` file.
Set `NODE_ENV=development` or `NODE_ENV=production`, and the app will select the matching `DEV_...` or `PROD_...` values automatically.

`NODE_ENV` is the only environment switch.
The npm commands are runtime helpers only:
- `npm run dev` runs the server in watch mode with `nodemon` and `ts-node`
- `npm run start` builds TypeScript first and then runs the compiled server

Both commands read the same root `.env`.
They do not choose development vs production values by themselves.

Recommended variables:

```env
# Environment selector
NODE_ENV=development

# Shared values
JWT_SECRET=replace_me
JWT_EXPIRES_IN=5000
REFRESH_TOKEN_EXPIRES_IN=13000
GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# AI Search
LLM_BASE_URL=http://your-llm-host
LLM_USER=your_llm_user
LLM_PASS=your_llm_password
LLM_TIMEOUT_MS=15000
LLM_MODEL=llama3.1:8b

# Development values
DEV_PORT=3000
DEV_DOMAIN_BASE=localhost
DEV_DATABASE_URL=mongodb://localhost:27017/aura
DEV_MONGO_CONNECT_TIMEOUT_MS=3000
DEV_VITE_API_BASE_URL=http://localhost:3000

# Production values
PROD_PORT=4000
PROD_DOMAIN_BASE=your-production-domain
PROD_DATABASE_URL=mongodb://your-production-db
PROD_MONGO_CONNECT_TIMEOUT_MS=3000
PROD_VITE_API_BASE_URL=https://your-production-domain
```

## 📦 Install

From repository root:

```bash
npm install
```

## ⚡ Run (Development)

Run client and server in separate terminals:

```bash
# Terminal 1
cd server
npm run dev
```

```bash
# Terminal 2
cd client
npm run dev
```

Default URLs:
- Client: `http://localhost:5173`
- Server: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs`

## 🚀 Run (Production-style server build)

```bash
cd server
npm run start
```

This compiles TypeScript and starts the API with the single root `.env`. The active runtime settings still come from `NODE_ENV`.

## 🧪 Tests

From repository root:

```bash
npm run test
```

Server-specific examples:

```bash
cd server
npm run test
npm run testAuth
npm run testPost
npm run testComment
npm run testLike
npm run testUser
npm run testMulter
npm run testPostsSearch
npm run testSearchService
npm run testllmService
```

## 🔌 API Base Paths
- `/api/auth`
- `/api/user`
- `/api/post`
- `/api/comment`
- `/api/like`
- `/api/upload`
