# 👾 Aura

Aura is a social-media style web app where users can register, log in, create posts, comment, and like content.

## 👨🏻‍🏫 Team

- **מרצה:** אליאב מנשה
- **סטודנטים:** שירן לוי (324127315), לירון דבח (322439027)

## 🎯 Project Focus

- Build a full-stack social platform (client + server + database)
- Implement secure authentication with JWT + refresh tokens
- Enforce ownership rules (only creators can edit/delete their own content)
- Provide clean REST API documentation with Swagger

## 🧱 Architecture

- **Client:** React + TypeScript + Vite
- **Server:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** Access token + refresh token rotation

## 📁 Folder Architecture

```text
Aura/
├── README.md
├── .gitignore
├── client/
│   ├── package.json
│   ├── README.md
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── types/
│       ├── App.tsx
│       ├── App.css
│       ├── index.css
│       └── main.tsx
└── server/
    ├── package.json
    ├── tsconfig.json
    ├── .env.dev
    ├── src/
    │   ├── seed.ts
    │   ├── server.ts
    │   ├── index.ts
    │   ├── swagger.ts
    │   ├── controllers/
    │   │   ├── authController.ts
    │   │   ├── postsController.ts
    │   │   ├── commentsController.ts
    │   │   └── likesController.ts
    │   ├── routes/
    │   │   ├── authRoute.ts
    │   │   ├── postsRoute.ts
    │   │   ├── commentsRoute.ts
    │   │   └── likesRoute.ts
    │   ├── models/
    │   │   ├── usersModel.ts
    │   │   ├── postsModel.ts
    │   │   ├── commentsModel.ts
    │   │   └── likesModel.ts
    │   ├── middleware/
    │   │   └── authMiddleware.ts
    │   └── tests/
    │       ├── auth.test.ts
    │       ├── posts.test.ts
    │       ├── comments.test.ts
    │       ├── likes.test.ts
    │       └── swagger.test.ts
    └── dist/ (generated)
```

## 🗂️ Folder Roles

- `client/src/components` -> reusable UI parts
- `client/src/pages` -> page-level views
- `client/src/services` -> API calls and client logic
- `server/src/routes` -> HTTP endpoint definitions
- `server/src/controllers` -> request/business logic
- `server/src/models` -> MongoDB schemas
- `server/src/middleware` -> auth middleware
- `server/src/tests` -> API and behavior tests

## 🧠 Core Modules

- `Auth` -> register, login, logout, refresh token
- `Posts` -> create/read/update/delete posts
- `Comments` -> post-related comments
- `Likes` -> like/unlike by post
- `Swagger` -> API documentation UI

## 🌱 Environment Variables (`server/.env.dev`)

```env
PORT=3000
DATABASE_URL=mongodb://<username>:<password>@<host>:<port>/aura?authSource=admin
# DATABASE_URL=mongodb://localhost:27017/aura
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=5000
REFRESH_TOKEN_EXPIRES_IN=13000
SEED_DROP_ALL_SCHEMAS=<true_or_false>
```

## ⚡ Quick Run (Minimal)

```bash
cd client && npm install && npm run dev
cd ../server && npm install && npm run dev
```
