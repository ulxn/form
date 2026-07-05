# 💍 Wedding Wishes & RSVP Guestbook

A serverless guestbook for weddings – built with **HTML, CSS, JavaScript, and Google Apps Script**

> **✨ Live Demo:** [>>click here<<](https://ulxn.github.io/form)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [How It Works](#-how-it-works)
- [Setup & Deployment](#-setup--deployment)
- [Configuration](#-configuration)
- [Security](#-security)
- [File Structure](#-file-structure)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

### 👰🤵 Core Guestbook Features

💌 **Send Wishes** | Guests can submit their name, RSVP status, and a personal message.
📋 **RSVP Tracking** | Choose between "Insyaa Allah Hadir" or "Belum dapat Hadir".
🔄 **Real‑time Updates** | Messages appear instantly after submission (optimistic UI).
📱 **Responsive Design** | Works perfectly on desktop, tablet, and mobile.
🌗 **Dark/Light Theme** | Toggle between themes – preference saved in browser.
📄 **Pagination** | Shows 5 messages per page with smooth navigation.

### 🛡️ Anti‑Spam & Security

|           Feature           |                      Description                       |
|-----------------------------|--------------------------------------------------------|
| 🍯 **Honeypot**             | Hidden field that traps bots (fills it automatically). |
| ⏱️ **Time Check**           | Prevents instant submissions (10 seconds minimum).     |
| 🧑 **Human Flag**           | Requires user interaction before submitting.           |
| ⏳ **Server‑Side Cooldown** | 30‑second wait between messages per IP.                |
| 🔢 **IP Rate Limit**        | Max 3 sent messages per IP (unsent excluded).          |
| 🔐 **CSRF Protection**      | Prevents cross‑site form submissions.                  |


### ⚡ Performance

**First Load** | ~1‑3s (cold start)
**Subsequent Loads** | < 0.5s (cached)
**No Polling** | Quota efficient – only fetches on page load.

---

## 🧱 Tech Stack

**Frontend** | HTML5, CSS3, Vanilla JavaScript
**Backend** | Google Apps Script
**Database** | Google Sheets
**Hosting** | GitHub Pages (or any static host)
**Fonts** | Google Fonts (Inter, Cormorant Garamond)
**Icons** | Font Awesome 6
**Cache** | Apps Script `CacheService`

---

## 🏗️ Architecture Overview

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

---

## ⚙️ How It Works

### 1. Page Load
- **`fetchMessages()`** – sends a `GET` request to Apps Script.
- **`doGet()`** – reads the sheet and returns all messages with `Status = 'sent'`.
- **Render** – messages are displayed, newest first.

### 2. Submitting a Message
- **Form validation** – name, RSVP, and message are required.
- **Anti‑spam** – honeypot, time check, and human flag are validated.
- **Optimistic update** – the message appears immediately in the UI.
- **Server request** – `POST` is sent with form data + CSRF token.
- **On success** – the message is stored in the sheet, and the "Unsend" timer starts.
- **On failure** – the message shows a "Retry" button.

### 3. Unsend
- User clicks **"Batalkan"** within 20 seconds.
- **`POST` with `action='unsend'`** is sent to Apps Script.
- The server updates the `Status` column to `"unsent"`.
- The message is removed from the UI.

### 4. Retry
- If a submission fails, the message shows **"Retry"**.
- Clicking it re‑sends the same message to the server.
- If successful, the message is marked as `"sent"`.

### 5. Data Collection
- All fields are controlled by `COLLECTION` toggles in `config.js`.
- If a toggle is `false`, the field is set to `"Disabled"`.
- **Battery, screen, graphics, device, browser, IP** – are collected client‑side.
- **ISP** – fetched server‑side via `ip-api.com` (if enabled).

---

## 🎛️ Configuration

All settings are centralised in **`js/config.js`** – the control panel.

## 🔒 Security

### ✅ Implemented

**XSS Prevention** | `escapeHtml()` escapes all user‑generated content.
**CSRF Protection** | One‑time tokens verified server‑side.
**Server‑Side Rate Limiting** | Cooldown and IP limits enforced via `CacheService`.
**Input Validation** | Length checks, allowed RSVP values.
**Anti‑Spam** | Honeypot, time check, human flag.

### 🔧 Server‑Side Limits

```javascript
const COOLDOWN_SECONDS
const MAX_MESSAGES_PER_IP
const MAX_NAME_LENGTH
const MAX_MESSAGE_LENGTH
const ALLOWED_RSVP
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

---

## 🐛 Troubleshooting

### ❌ Messages not loading

**Empty state shown but there are messages** | Check that `WEB_APP_URL` in `config.js` is correct.
**"Sheet not found" error** | Ensure your sheet is named `Sheet1` (or update `SHEET_NAME` in `code.gs`).
**CORS error** | Apps Script must be deployed with "Anyone" access.

### ❌ Form not submitting

**"Cooldown" message** | Wait 30 seconds between submissions.
**"Max messages per IP"** | The IP has already sent 3 messages.
**"Invalid CSRF token"** | Refresh the page to get a new token.

### ❌ Duplicate "Mengirim" messages

- This means a pending message wasn't cleaned up properly.
- **Fix:** Refresh the page – the `fetchMessages()` merge logic will remove any pending messages that match server messages by content.

### ❌ Slow first load

- Apps Script has a **cold start** – the first request after a period of inactivity takes ~3‑5s.
- **Fix:** The `CacheService` caches responses for 60 seconds, so subsequent loads are instant.

---

## 📜 License

MIT License – free to use, modify, and distribute.

---

## 📬 Feedback & Contributions

If you find a bug or have a suggestion, feel free to open an issue or submit a pull request.

**Happy wedding!** 💍🎉