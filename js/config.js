/**
 * ============================================================
 * ═══ CONFIGURATION – CONTROL PANEL ═══
 * ============================================================
 * 
 * 🔧 EDIT THIS FILE to customise the wedding wishes page.
 * All settings are in one place for easy management.
 * ============================================================
 */

const CONFIG = (function () {
    'use strict';

    // ============================================================
    // 👰🤵 BRIDE & GROOM NAMES
    // ============================================================
    const BRIDE_NAME = 'Zwageri';
    const GROOM_NAME = 'Lily';

    // ============================================================
    // ⏱️ ANTI‑SPAM SETTINGS
    // ============================================================
    const MIN_SUBMIT_TIME = 10000; // milliseconds (10 seconds)
    const HONEYPOT_ENABLED = true; // true = enabled, false = disabled

    // ============================================================
    // 🕒 COOLDOWN & LIMITS
    // ============================================================
    const COOLDOWN_TIME = 30000; // 30 seconds between messages per user
    const MAX_MESSAGES_PER_IP = 3; // maximum number of successfully sent messages per IP (unsent excluded)
    const UNSEND_TIMER = 20; // seconds before unsend option expires

    // ============================================================
    // ⏳ UI DURATIONS (milliseconds)
    // ============================================================
    const FORM_STATUS_DURATION = 5000; // how long form status messages stay visible
    const NOTIFICATION_DURATION = 3000; // duration for notification toasts (except unsend)

    // ============================================================
    // 📡 BACKEND URL
    // ============================================================
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwceol5RTl762THc0xaxIOUJ9D2LFglIQf1DmqxJEFZ2exoE-AE7PxpbcgmikCOEpNiyw/exec';

    // ============================================================
    // 🎛️ MISC FEATURE TOGGLES
    // ============================================================
    const PAGE_SIZE = 5;          // messages per page in the wishes list
    const ANTI_SNOOPING = false;  // true = block right-click / devtools shortcuts

    // ============================================================
    // 💾 LOCAL STORAGE KEYS
    // ============================================================
    const STORAGE_KEY = 'zw_messages';        // main message list (merged)
    const PENDING_KEY = 'zw_pending';         // pending messages awaiting confirmation
    const IP_TRACKING_KEY = 'zw_ip_tracking'; // IP message counts
    const COOLDOWN_KEY = 'zw_cooldown';       // cooldown timestamp

    // ============================================================
    // 📊 DATA COLLECTION TOGGLES
    // ============================================================
    const COLLECTION = {
        device: true,   // Device Type/Model & Browser (fast, client-side)
        battery: true,  // Battery Level & Status (fast, client-side)
        screen: true,   // Screen Resolution & Aspect Ratio (fast, client-side)
        graphics: true, // Graphics Card (may be blocked, client-side)
        timezone: true, // System Time Zone (fast, client-side)
        ip: true,       // IP Address (via ipify.org – fast)
        isp: false,     // ISP (via ip-api.com – SLOW, ~1-2s). Disable to speed up submission.
    };

    // ============================================================
    // 👋 GREETING (via ?name= URL param)
    // ============================================================
    const GREETING_PARAM = 'name';

    // ============================================================
    // 🎨 TEXT & LABELS
    // ============================================================
    const LABELS = {
        heroTitle: 'Bagikan Ucapan &amp; Doa Terbaikmu',
        formSubtitle: 'Ucapan dan doa terbaik untuk ' + BRIDE_NAME + ' dan ' + GROOM_NAME,
        defaultGreeting: 'Halo!',
        submitButton: 'Kirim',
        sending: 'Mengirim...',
        errorBot: '🤖 Bot detected.',
        errorTooFast: '⏳ Take your time, Buddy.',
        errorNoInteraction: '🤖 Please interact with the page before submitting.',
        unsendToast: 'Pesan terkirim',
        unsendButton: 'Batalkan',
        unsendNotification: '↩ Pesan batal dikirimkan.',
        emptyState: 'Belum ada ucapan. Jadilah yang pertama!',
        rsvpPlaceholder: '— Rencana Kehadiran —',
        rsvpHadir: 'Insyaa Allah Hadir',
        rsvpBelum: 'Belum dapat Hadir',
        namePlaceholder: 'John Doe',
        messagePlaceholder: 'Barakallahu lakuma wa baraka \'alaikuma wa jama\'a bainakuma fii khair~',
        wishesTitle: 'Wishes',
        pendingStatus: '⏳ Mengirim...',
    };

    // ============================================================
    // 📦 EXPORT
    // ============================================================
    return {
        BRIDE_NAME: BRIDE_NAME,
        GROOM_NAME: GROOM_NAME,
        MIN_SUBMIT_TIME: MIN_SUBMIT_TIME,
        HONEYPOT_ENABLED: HONEYPOT_ENABLED,
        COOLDOWN_TIME: COOLDOWN_TIME,
        MAX_MESSAGES_PER_IP: MAX_MESSAGES_PER_IP,
        UNSEND_TIMER: UNSEND_TIMER,
        FORM_STATUS_DURATION: FORM_STATUS_DURATION,
        NOTIFICATION_DURATION: NOTIFICATION_DURATION,
        WEB_APP_URL: WEB_APP_URL,
        PAGE_SIZE: PAGE_SIZE,
        ANTI_SNOOPING: ANTI_SNOOPING,
        GREETING_PARAM: GREETING_PARAM,
        STORAGE_KEY: STORAGE_KEY,
        PENDING_KEY: PENDING_KEY,
        IP_TRACKING_KEY: IP_TRACKING_KEY,
        COOLDOWN_KEY: COOLDOWN_KEY,
        COLLECTION: COLLECTION,
        LABELS: LABELS,
    };

})();

// Export for browser
if (typeof module === 'undefined') {
    window.CONFIG = CONFIG;
} else {
    module.exports = CONFIG;
}