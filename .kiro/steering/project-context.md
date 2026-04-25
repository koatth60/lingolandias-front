---
inclusion: always
---

# Lingolandias Academy — Full Project Context

## Overview
Lingolandias Academy is a production language learning platform connecting students with teachers for live one-on-one classes. The platform consists of a React frontend (this workspace) and a NestJS backend (`~/Desktop/lingo-server-nest`).

---

## Frontend (this workspace — `front-r`)

### Tech Stack
- React 18.3.1 + Vite 5.3.1
- Tailwind CSS 3.4.4
- Redux Toolkit 2.2.7 (state management)
- Socket.IO Client 4.7.5 (real-time)
- Jitsi React SDK 1.4.0 (video conferencing)
- Axios (HTTP client)
- React Big Calendar (scheduling)
- Recharts (analytics charts)
- React Toastify (notifications)
- i18next (i18n — English, Spanish, Polish)
- dayjs (dates)

### Project Structure
- `src/App.jsx` — Routes via React Router, lazy-loaded pages, `RequireAuth` wrapper for JWT auth + role checks
- `src/sections/` — Page-level layouts (home, messages, profile, dashboard sidebar, etc.)
- `src/components/` — Feature UI grouped by domain: admin, schedule, messages, trello, classroom, login, settings, etc.
- `src/hooks/` — Custom hooks: useGlobalSocket, useSocketManager, useChatWindow, useRecording, useAuthExpiry, useNotificationSound, etc.
- `src/redux/` — Redux slices: userSlice, chatSlice, messageSlice, sidebarSlice, filePreviewSlice, schedulesSlice
- `src/data/` — Utilities and API helpers: dateUtils, scheduleUtils, filterClasses, roomData, trelloApi, trelloAuth, joinClassHandler
- `src/context/` — React contexts: ThemeContext (dark mode), UploadContext (background recording uploads)
- `src/socket.js` — Singleton Socket.IO client with JWT auth, lazy connection
- `src/i18n/` — Translation files (en.json, es.json, pl.json)

### Routes
- `/login` — Authentication
- `/home` — Dashboard (role-based: Admin vs User/Teacher)
- `/schedule` — Calendar with class scheduling
- `/classroom` — Jitsi video conferencing
- `/messages` — Real-time chat
- `/trello` — Trello board integration
- `/admin-trello` — Admin Trello management (admin only)
- `/analytics` — Admin analytics dashboard (admin only)
- `/admin` — Admin panel: user management, assignments (admin only)
- `/profile`, `/settings`, `/support`, `/help-center`
- `/forgotpassword`, `/reset-password`

### User Roles
- **admin** — Full platform access (user management, analytics, admin panels)
- **teacher** — Schedule management, student chat, support, Trello, recordings
- **user (student)** — View assigned classes, chat with teacher, profile

### State Persistence
- Redux state debounce-saved to localStorage every 500ms
- Transient fields (status, error) stripped on reload
- `flushStateNow()` called before page reload

### Real-Time (Frontend)
- Singleton socket in `src/socket.js`, connects on login
- `useGlobalSocket` — registerUser, newChat, chatMessagesRead events
- `useSocketManager` — join/leave rooms, typing indicators, message CRUD
- Dashboard listens for userStatus, newUnreadGlobalMessage, newUnreadSupportMessage

---

## Backend (`~/Desktop/lingo-server-nest`)

### Tech Stack
- NestJS 10 + TypeScript
- PostgreSQL via TypeORM (auto-sync enabled)
- Socket.IO (WebSocket gateway)
- AWS S3 (file storage: avatars, chat files, recordings)
- JWT authentication (12h expiry)
- bcrypt (password hashing)
- @nestjs-modules/mailer + EJS templates (emails)
- web-push + VAPID (push notifications)
- Helmet (security headers)
- @nestjs/throttler (rate limiting: 120 req/min per IP)
- @nestjs/schedule (cron jobs)
- Runs on port 2000, behind nginx in production

### Backend Modules
- **Auth** — Register, login (JWT), logout, forgot/reset password, change password. Login marks user online + socket broadcast.
- **Users** — CRUD, student-teacher assignment with schedules, schedule modification (add/edit/remove events), paginated student listing, admin stats, analytics, teacher listing.
- **Chat** — Two systems: Normal chats (1-on-1 teacher↔student, `Chat` entity) and Global chats (language group rooms + support, `GlobalChat` entity). Unread counters per-user per-room (`UnreadGlobalMessage`). Archived chats with cleanup service.
- **Class Sessions** — Tracks live Jitsi sessions (start, heartbeat, end). Sessions < 3 min auto-deleted. Dedup: reconnect within 30 min reopens same session. Analytics: weekly/monthly hours per teacher.
- **Upload Files** — S3 service: avatar upload, chat file upload, recording multipart upload (10MB parts), list/delete recordings grouped by teacher.
- **Settings** — Per-user settings (darkMode, language, notifications, classReminders). One-to-one with User entity.
- **Push** — Web push via VAPID. Cron every minute: checks classes starting in 10 min, sends reminders to student + teacher if classReminders enabled.
- **Mail** — EJS templates: welcome, password reset, password changed, support request.
- **Trello** — Local board system (boards, lists, cards per user). Admin view of all boards.
- **Gateway** (`videocalls.gateaway.ts`) — WebSocket hub: user presence (7s grace period), room join/leave, typing, normal/global/support chat persistence + broadcast, message edit/delete/clear, unread counter increments (strategy pattern), WebRTC signaling, rate limiting (20 msg/10s), message sanitization (4000 char max), JWT verification on sockets.

### Key Entities
- `User` — id, name, lastName, email, password, role (user/teacher/admin), language, online status, avatar, bio, location fields. Self-referencing teacher↔students relationship. Has schedules and settings.
- `Schedule` — initialDateTime, startTime, endTime, dayOfWeek, linked to student + teacher (cascade delete).
- `Chat` — username, email, room, message, timestamp, userUrl, replyTo, isFile, readBy.
- `GlobalChat` — username, email, room, message, timestamp, userUrl, fileUrl, userRole.
- `UnreadGlobalMessage` — per-user counters for each room type (generalEnglish, teachersSpanish, supportRoom, randomRoom, etc.).
- `Settings` — darkMode, language, notificationSound, classReminders. One-to-one with User.
- `ClassSession` — teacherId, studentId, roomId, startTime, endTime, durationMinutes, status, lastHeartbeat.
- `TrelloBoard`, `TrelloList`, `TrelloCard` — Kanban board system.
- `PushSubscription` — userId, endpoint, p256dh, auth.
- `ArchivedChat` — Archived old messages.

### Environment Variables (Backend)
- `DATABASE`, `HOST`, `PORT`, `BD_USERNAME`, `PASSWORD` — PostgreSQL connection
- `JWT_SECRET` — JWT signing
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME` — S3
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — Push notifications
- `FRONTEND_URL` — For password reset links
- Mail config via `config/mail.config.ts`

### Environment Variables (Frontend)
- `VITE_BACKEND_URL` — Backend API base URL
- `VITE_JITSI_DOMAIN` — Jitsi server domain
- `VITE_TRELLO_API_KEY` — Trello API key
- `VITE_API_URL` — Alternative API URL

---

## Key Architectural Patterns
- JWT auth with role-based route protection (frontend `RequireAuth` + backend `AuthGuard`)
- Socket.IO for all real-time: chat, presence, typing, schedule updates, student assignment notifications
- Redux async thunks for API calls, state persisted to localStorage
- Lazy-loaded routes for code splitting
- Strategy pattern for unread counter increments by room type
- Multipart S3 uploads for large recordings
- Cron-based push notification reminders
- Dark mode via Tailwind `dark:` class on `<html>`

---

## Production Deployment (VPS)

### Server Info
- VPS: Hostinger, IP `195.110.58.68`, user `root`
- SSH access via askpass: set `SSH_ASKPASS`, `SSH_ASKPASS_REQUIRE=force`, `DISPLAY=dummy`
- Node v18.20.4, npm 10.7.0

### Deployment Paths
- Frontend (static): `/var/www/lingo-academy-client`
- Backend (NestJS): `/var/www/server-nest` — PM2 process name: `platform`

### Domains & Nginx
- `lingolandias.com` / `www.lingolandias.com` → static files from `/var/www/lingo-academy-client`
- `backend.lingolandias.com` → proxy to `localhost:2000` (NestJS)
- `jitsi.lingolandias.com` → proxy to `localhost:6000` (Jitsi)
- `testing.srv570363.hstgr.cloud` → also proxies to `localhost:2000` (legacy test domain)

### Environment Differences
- **Frontend local dev**: `VITE_BACKEND_URL=http://localhost:2000`
- **Frontend production**: `VITE_BACKEND_URL=https://backend.lingolandias.com`
- The `.env` file in the workspace toggles between these via comments. Production builds MUST use the production URL.
- Backend `.env.development` on VPS at `/var/www/server-nest/.env.development` — do NOT overwrite.

### Deploy Process — Frontend
1. Ensure `.env` has `VITE_BACKEND_URL=https://backend.lingolandias.com` (production)
2. Run `npm run build` locally (produces `dist/`)
3. Upload `dist/*` to VPS `/var/www/lingo-academy-client/` (replace contents)
4. Restore `.env` to dev URL if it was changed

### Deploy Process — Backend
1. Build locally: `npm run build` in the backend project (produces `dist/`)
2. Upload `dist/*` to VPS `/var/www/server-nest/dist/` (replace contents)
3. If `package.json` changed, also upload it and run `npm install --production` on VPS
4. Restart: `pm2 restart platform` on VPS

### SSH Command Pattern (for Kiro)
```
$env:SSH_ASKPASS = "$env:USERPROFILE\.ssh\askpass.cmd"
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy"
ssh -o StrictHostKeyChecking=no root@195.110.58.68 "<command>"
```
For file uploads use `scp` with the same env vars.
