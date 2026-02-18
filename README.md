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


## 🌱 Environment Variables (`server/.env.development`)
```env
PORT=3000
DATABASE_URL=mongodb://<username>:<password>@<host>:<port>/aura?authSource=admin
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=5000
REFRESH_TOKEN_EXPIRES_IN=13000
```


## ⚡ Quick Run (Minimal)
```bash
cd client && npm install && npm run dev
cd ../server && npm install && npm run dev
```
