# 💍 Wedding Wishes & RSVP Guestbook

A serverless guestbook for weddings – built with **HTML, CSS, JavaScript, and Google Apps Script**

> **Live Demo:** [>>click here<<](https://ulxn.github.io/form)

---

## Features

### Core Guestbook Features

**Send Wishes** | Guests can submit their name, RSVP status, and a personal message.
**RSVP Tracking** | Choose between "Insyaa Allah Hadir" or "Belum dapat Hadir".
**Real‑time Updates** | Messages appear instantly after submission (optimistic UI).
**Responsive Design** | Works perfectly on desktop, tablet, and mobile.
**Dark/Light Theme** | Toggle between themes – preference saved in browser.
**Pagination** | Shows 5 messages per page with smooth navigation.

### 🛡️ Anti‑Spam & Security

|           Feature           |                      Description                       |
|-----------------------------|--------------------------------------------------------|
| 🍯 **Honeypot**             | Hidden field that traps bots (fills it automatically). |
| ⏱️ **Time Check**           | Prevents instant submissions (10 seconds minimum).     |
| 🧑 **Human Flag**           | Requires user interaction before submitting.           |
| ⏳ **Server‑Side Cooldown** | 30‑second wait between messages per IP.                |
| 🔢 **IP Rate Limit**        | Max 3 sent messages per IP (unsent excluded).          |
| 🔐 **CSRF Protection**      | Prevents cross‑site form submissions.                  |


### Performance

**First Load** | ~1‑3s (cold start)
**Subsequent Loads** | < 0.5s (cached)
**No Polling** | Quota efficient – only fetches on page load.

---

## Tech Stack

**Frontend** | HTML5, CSS3, Vanilla JavaScript
**Backend** | Google Apps Script
**Database** | Google Sheets
**Hosting** | GitHub Pages (or any static host)
**Fonts** | Google Fonts (Inter, Cormorant Garamond)
**Icons** | Font Awesome 6
**Cache** | Apps Script `CacheService`

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                         USER BROWSER                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                     index.html                          │  │
│  │  ┌─────────────┐  ┌─────────────────────────────────┐   │  │
│  │  │  FORM       │  │  MESSAGES LIST                  │   │  │
│  │  │  (Wish)     │  │  (Pagination, scrollable)       │   │  │
│  │  └─────────────┘  └─────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                     script.js                           │  │
│  │  • Fetch messages (GET)                                 │  │
│  │  • Submit messages (POST)                               │  │
│  │  • Unsend (POST)                                        │  │
│  │  • Anti‑spam checks                                     │  │
│  │  • Draft saving                                         │  │
│  │  • Pending/retry logic                                  │  │
│  │  • Device/browser detection                             │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP (GET / POST)
┌───────────────────────────────────────────────────────────────┐
│                    GOOGLE APPS SCRIPT                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                       code.gs                           │  │
│  │  • doGet()  → Fetch all "sent" messages                 │  │
│  │  • doPost() → Add new message / Unsend                  │  │
│  │  • CacheService (cooldown, IP limit, CSRF tokens)       │  │
│  │  • Input validation (length, RSVP values)               │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                       GOOGLE SHEETS                           │
└───────────────────────────────────────────────────────────────┘
```

## 📂 File Structure

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js    ← 🔧 CONTROL PANEL
│   └── script.js
└── code.gs          ← Google Apps Script
```

## 📜 License

MIT License – free to use, modify, and distribute.

---

## 📬 Feedback & Contributions

If you find a bug or have a suggestion, feel free to open an issue or submit a pull request.