# 🎓 Kolkata High School — Backend

Node.js + Express + MongoDB Atlas API, deployed on Vercel.

---

## 📁 Project Structure

```
backend/
├── api/
│   └── index.js          ← Express app (Vercel entry point)
├── lib/
│   └── db.js             ← MongoDB Atlas connection (cached)
├── models/
│   ├── Contact.js        ← Contact form messages
│   ├── Notice.js         ← School notices/announcements
│   └── Admission.js      ← Admission inquiries
├── routes/
│   ├── contact.js        ← POST/GET /api/contact
│   ├── notices.js        ← CRUD /api/notices
│   └── admission.js      ← POST/GET /api/admission
├── .env.example          ← Copy to .env and fill values
├── .gitignore
├── package.json
└── vercel.json
```

---

## ⚡ Quick Start (Local Development)

### Step 1 — Install dependencies
```bash
cd backend
npm install
```

### Step 2 — Set up environment variables
```bash
cp .env.example .env
# Open .env and fill in your values (see below)
```

### Step 3 — Run the dev server
```bash
npm run dev
# Server starts at http://localhost:5000
```

---

## 🔑 Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PORT` | Local port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail App Password (16 chars) |
| `EMAIL_RECIPIENT` | Where to send admin notifications |
| `CLIENT_URL` | Your frontend URL (for CORS) |

### Getting your MongoDB Atlas URI:
1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Click **Connect** → **Drivers** → Copy the URI
4. Replace `<username>` and `<password>` with your DB user credentials
5. Add your IP (or `0.0.0.0/0` for Vercel) to **Network Access**

### Getting Gmail App Password:
1. Enable 2-Step Verification on your Google Account
2. Go to **Google Account → Security → App Passwords**
3. Generate a password for "Mail"
4. Use that 16-character password as `EMAIL_PASS`

---

## 🚀 Deploy to Vercel

### Step 1 — Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2 — Login
```bash
vercel login
```

### Step 3 — Deploy from the backend folder
```bash
cd backend
vercel
# Follow prompts: link to project, set root directory as ./
```

### Step 4 — Add Environment Variables on Vercel
Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add all variables from your `.env` file:
- `MONGODB_URI`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_RECIPIENT`
- `CLIENT_URL` ← set this to your frontend URL or `*`

### Step 5 — Redeploy
```bash
vercel --prod
```

Your API will be live at: `https://your-project-name.vercel.app`

---

## 🔗 Update Frontend

In your `script.js`, update this line:
```javascript
const API_BASE = 'https://your-project-name.vercel.app/api';
```

Also update CORS: add your frontend URL to the `allowedOrigins` array in `api/index.js`, OR set `CLIENT_URL` env var.

---

## 📡 API Endpoints

### Health
```
GET /api/health
```

### Notices
```
GET    /api/notices           → Fetch all published notices (paginated)
GET    /api/notices?tag=Exam  → Filter by tag
GET    /api/notices/:id       → Single notice
POST   /api/notices           → Create notice (admin)
PUT    /api/notices/:id       → Update notice (admin)
DELETE /api/notices/:id       → Delete notice (admin)
```

### Contact
```
POST   /api/contact           → Submit contact message (saves to DB + sends email)
GET    /api/contact           → List all messages (admin)
PATCH  /api/contact/:id/status → Update status (unread/read/replied)
```

### Admission
```
POST   /api/admission         → Submit admission inquiry (saves to DB + sends emails)
GET    /api/admission         → List all inquiries (admin)
PATCH  /api/admission/:id/status → Update status (pending/approved/rejected)
```

---

## 🛡️ Security Features

- **Helmet** — Sets secure HTTP headers
- **Rate Limiting** — 100 req/15min globally; 10 submissions/hr for forms
- **express-validator** — Input validation & sanitization on all POST routes
- **CORS** — Only allows requests from configured origins
- **MongoDB connection caching** — Optimized for Vercel serverless cold starts

---

## 🗃️ Seed Sample Notices (optional)

Run this once to populate your notices collection:
```javascript
// In MongoDB Atlas Data Explorer or Compass, insert into `notices` collection:
[
  { title: "Admission Open 2025-26", body: "Applications are now open for all classes.", tag: "Announcement", isUrgent: true, isPublished: true },
  { title: "Annual Sports Day", body: "Sports Day will be held on 5th April 2025.", tag: "Event", isUrgent: false, isPublished: true },
  { title: "Final Exam Schedule", body: "Annual exam timetable has been released.", tag: "Exam", isUrgent: false, isPublished: true }
]
```
