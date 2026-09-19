# BlogVerse

A full-stack personal blogging platform built with the MERN stack (MongoDB, Express, React, Node.js). Registered users can write, edit and delete their own posts, while all authenticated users can like and comment. Built to be interview-explainable end to end, not a copy-paste tutorial project.

## Features
- JWT authentication with bcrypt password hashing
- Backend-enforced ownership: only a post's author can edit/delete it; only a comment's author can delete it
- Rich text editing (React-Quill) with server-side HTML sanitization against stored XSS
- Cover image and avatar upload via Multer + Cloudinary, with local-disk fallback for development
- Search, category filtering and pagination, all done as MongoDB queries
- Toggleable like system, view counter, auto-generated excerpts and slugs
- Dashboard with per-user stats (total posts / views / likes) and a manage-posts table
- Centralized Express error handling and a consistent `{ success, message, data }` API response shape
- Responsive, Bootstrap 5 UI (mobile / tablet / desktop)

## Tech Stack
**Frontend:** React, Vite, React Router DOM, Axios, Bootstrap 5, React-Quill, DOMPurify, React Toastify
**Backend:** Node.js, Express.js, JWT, bcryptjs, Multer, sanitize-html
**Database:** MongoDB + Mongoose
**Storage:** Cloudinary (with local `/uploads` fallback)

## Folder Structure
```
blogverse/
├── server/   -- Express API (config, controllers, middleware, models, routes, utils)
└── client/   -- React app (components, pages, services, context)
```

## Database Models
- **User**: name, email (unique), password (hashed, never returned), avatar, timestamps
- **Post**: title, unique slug, HTML content, excerpt, coverImage, category, author (ref User), likes (ref User[]), views, timestamps
- **Comment**: post (ref Post), user (ref User), text, timestamps

## Authentication Flow
1. Register → bcrypt hashes password → user saved
2. Login → bcrypt compares password → JWT signed with `{ userId }` → token + safe user returned
3. Frontend stores the token in `localStorage`; a centralized Axios interceptor attaches `Authorization: Bearer <token>` to every request
4. Protected routes run `authenticateUser` middleware: verify JWT → load user → attach to `req.user` → `next()`
5. Ownership-sensitive routes (edit/delete post, delete comment) additionally compare `req.user._id` against the resource's owner field, never trusting any ID sent from the client

**Security note:** `localStorage` is convenient but vulnerable to token theft via XSS. A production app would move the token into an `HttpOnly`, `Secure` cookie (trading off the need for CSRF protection) so client-side JavaScript can never read it.

## API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me                (protected)
POST   /api/auth/logout            (protected)

GET    /api/posts                  ?search=&category=&page=&limit=
GET    /api/posts/dashboard/mine   (protected)
GET    /api/posts/:slug
POST   /api/posts                  (protected)
PUT    /api/posts/:id              (protected, owner only)
DELETE /api/posts/:id              (protected, owner only)
POST   /api/posts/:id/like         (protected, toggle)
GET    /api/posts/:id/comments
POST   /api/posts/:id/comments     (protected)

DELETE /api/comments/:id           (protected, owner only)

PUT    /api/users/profile          (protected)
POST   /api/upload                 (protected)
```

## Environment Variables

**server/.env**
```
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=http://localhost:5173
PORT=5000
```

**client/.env**
```
VITE_API_URL=http://localhost:5000/api
```

## Installation & Running

### 1. MongoDB
Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), whitelist your IP, and copy the connection string into `MONGO_URI`.

### 2. Cloudinary (optional in dev)
Create a free account at [cloudinary.com](https://cloudinary.com), copy your cloud name, API key and secret into the server `.env`. If left blank, image uploads fall back to local disk storage automatically — no code changes needed.

### 3. Backend
```bash
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev             # nodemon, http://localhost:5000
```

### 4. Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

## Build / Deployment
- **Frontend** → Vercel or Netlify (`npm run build`, deploy the `dist` folder, set `VITE_API_URL` to your deployed backend URL)
- **Backend** → Render or any beginner-friendly Node host (set all server env vars there)
- **Database** → MongoDB Atlas
- **Images** → Cloudinary

## Future Improvements
- HttpOnly cookie-based auth instead of localStorage
- Email verification flow to allow email changes
- Draft/publish states for posts
- Full-text search ranking via MongoDB Atlas Search
- Unit/integration tests (Jest + Supertest)
