/**
 * ============================================================
 * ═══ CONFIGURATION – CONTROL PANEL ═══
 * ============================================================
 * 
 * 🔧 EDIT THIS FILE to customise the wedding wishes page.
 * All settings are in one place for easy management.
 * ============================================================
 */

const CONFIG = (function() {
    'use strict';

    // ============================================================
    // 👰🤵 BRIDE & GROOM NAMES
    // ============================================================
    const BRIDE_NAME = 'Zwageri';
    const GROOM_NAME = 'Lily';

    // ============================================================
    // ⏱️ ANTI‑SPAM SETTINGS
    // ============================================================
    const MIN_SUBMIT_TIME = 10000; // milliseconds (3 seconds)
    const HONEYPOT_ENABLED = true; // true = enabled, false = disabled

    // ============================================================
    // 📡 BACKEND URL
    // ============================================================
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwceol5RTl762THc0xaxIOUJ9D2LFglIQf1DmqxJEFZ2exoE-AE7PxpbcgmikCOEpNiyw/exec';

    // ============================================================
    // 💾 LOCAL STORAGE SETTINGS
    // ============================================================
    const STORAGE_KEY = 'zw_messages';
    const PAGE_SIZE = 5;

    // ============================================================
    // 🎨 TEXT & LABELS (easy to change language)
    // ============================================================
    const LABELS = {
        heroTitle: 'Bagikan Ucapan &amp; Doa Terbaikmu',
        formSubtitle: 'Ucapan dan doa terbaik untuk ' + BRIDE_NAME + ' dan ' + GROOM_NAME,
        brandSeparator: ' &amp; ',
        submitButton: 'Kirim',
        sending: 'Mengirim...',
        successMessage: 'Wish sent successfully! 🙏',
        errorGeneric: 'Terjadi kesalahan.',
        errorBot: '❌ Bot detected.',
        errorTooFast: '⏳ Too fast. Please take your time.',
        errorNoInteraction: '🤖 Please interact with the page before submitting.',
        errorConnection: 'Gagal terhubung. Periksa koneksi dan coba lagi.',
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
        rsvpLabel: 'RSVP',
        nameLabel: 'Nama',
        messageLabel: 'Pesan',
    };

    // ============================================================
    // 📦 EXPORT
    // ============================================================
    return {
        BRIDE_NAME: BRIDE_NAME,
        GROOM_NAME: GROOM_NAME,
        MIN_SUBMIT_TIME: MIN_SUBMIT_TIME,
        HONEYPOT_ENABLED: HONEYPOT_ENABLED,
        WEB_APP_URL: WEB_APP_URL,
        STORAGE_KEY: STORAGE_KEY,
        PAGE_SIZE: PAGE_SIZE,
        LABELS: LABELS,
    };

})();

// Export for browser
if (typeof module === 'undefined') {
    window.CONFIG = CONFIG;
} else {
    module.exports = CONFIG;
}