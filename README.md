# Lingolandias Academy — Frontend

A production language learning platform connecting students with teachers for **live one-on-one classes**. Currently live at [lingolandias.com](https://lingolandias.com) with 500+ active users.

---

## Overview

Lingolandias Academy is a full-featured language learning platform with three user roles: **Admin**, **Teacher**, and **Student**. Students browse and book live classes directly from an interactive calendar, communicate with teachers via real-time chat, and attend one-on-one sessions. Teachers manage their availability and interact with students. Admins oversee the entire platform.

---

## Features

### Student
- Browse teacher profiles and availability
- Book one-on-one live classes via interactive calendar
- Real-time chat with teachers
- View upcoming and past sessions

### Teacher
- Set and manage availability on the calendar
- Receive class bookings from students
- Live chat with students
- Manage assigned sessions

### Admin
- Full platform oversight
- Manage users (students and teachers)
- Monitor classes and activity

### Platform
- JWT authentication with role-based access (admin / teacher / student)
- Real-time messaging powered by Socket.IO
- Fully responsive — works on mobile and desktop
- Multi-language UI support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Real-time | Socket.IO client |
| Language | JavaScript |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Backend API running — see [lingolandias-back](https://github.com/koatth60/lingolandias-back)

### Installation

```bash
git clone https://github.com/koatth60/lingolandias-front.git
cd lingolandias-front
npm install
cp .env.example .env
npm run dev
```

### Environment Variables

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Route-level pages (student, teacher, admin)
├── hooks/            # Custom React hooks
├── services/         # API calls and socket connection
└── assets/           # Static assets
```

---

## Live App

[lingolandias.com](https://lingolandias.com)

---

## Related

- [lingolandias-back](https://github.com/koatth60/lingolandias-back) — NestJS API + WebSocket server

---

## License

MIT
