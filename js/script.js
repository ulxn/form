/**
 * ============================================================
 * WEDDING WISHES – Main JavaScript
 * Uses CONFIG from config.js
 * 
 * ✅ SIMPLIFIED: No model mapping – sends raw data as-is
 * ✅ Browser detection: Brave, Edge, Chrome, Firefox, Safari, etc.
 * ✅ Device: raw from user-agent (e.g., "SM-G998B")
 * ✅ Device Name: personalized "{Name}'s {Device}"
 * ============================================================
 */

(function() {
    'use strict';

    const CFG = window.CONFIG;
    if (!CFG) {
        console.error('❌ CONFIG not loaded. Check config.js');
        return;
    }

    // ============================================================
    // 0. DEVICE & BROWSER DETECTION (simplified)
    // ============================================================

    function getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = '';

        // ─── Brave ──────────────────────────────────────────────────
        if (ua.indexOf('Brave/') > -1 || (navigator.brave && navigator.brave.isBrave)) {
            browser = 'Brave';
            const match = ua.match(/Brave\/([\d.]+)/);
            if (match) version = match[1];
        }
        // ─── Edge ──────────────────────────────────────────────────
        else if (ua.indexOf('Edg/') > -1) {
            browser = 'Edge';
            const match = ua.match(/Edg\/([\d.]+)/);
            if (match) version = match[1];
        }
        // ─── Opera ─────────────────────────────────────────────────
        else if (ua.indexOf('OPR/') > -1 || ua.indexOf('Opera/') > -1) {
            browser = 'Opera';
            const match = ua.match(/(?:OPR|Opera)\/([\d.]+)/);
            if (match) version = match[1];
        }
        // ─── Chrome ─────────────────────────────────────────────────
        else if (ua.indexOf('Chrome/') > -1 && ua.indexOf('Edg/') === -1) {
            browser = 'Chrome';
            const match = ua.match(/Chrome\/([\d.]+)/);
            if (match) version = match[1];
        }
        // ─── Firefox ─────────────────────────────────────────────────
        else if (ua.indexOf('Firefox/') > -1) {
            browser = 'Firefox';
            const match = ua.match(/Firefox\/([\d.]+)/);
            if (match) version = match[1];
        }
        // ─── Safari ─────────────────────────────────────────────────
        else if (ua.indexOf('Safari/') > -1 && ua.indexOf('Chrome/') === -1) {
            browser = 'Safari';
            const match = ua.match(/Version\/([\d.]+)/);
            if (match) version = match[1];
        }
        // ─── Internet Explorer ──────────────────────────────────────
        else if (ua.indexOf('MSIE ') > -1 || ua.indexOf('Trident/') > -1) {
            browser = 'Internet Explorer';
            const match = ua.match(/(?:MSIE |rv:)([\d.]+)/);
            if (match) version = match[1];
        }

        return browser + (version ? ' ' + version : '');
    }

    function getDeviceDetails() {
        const ua = navigator.userAgent;

        // ─── Detect device type ────────────────────────────────────
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile/i.test(ua);
        const isTablet = /Tablet|iPad|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua);

        let deviceType = 'Desktop';
        if (isTablet) deviceType = 'Tablet';
        else if (isMobile) deviceType = 'Mobile';

        // ─── Extract device model from UA (raw, no mapping) ──────
        let deviceModel = 'Unknown';

        // iPhone
        if (ua.indexOf('iPhone') > -1) {
            const match = ua.match(/iPhone([\d,]+)/);
            deviceModel = match ? 'iPhone ' + match[1].replace(/,/g, '.') : 'iPhone';
        }
        // iPad
        else if (ua.indexOf('iPad') > -1) {
            const match = ua.match(/iPad([\d,]+)/);
            deviceModel = match ? 'iPad ' + match[1].replace(/,/g, '.') : 'iPad';
        }
        // Android – try to get model from UA
        else if (ua.indexOf('Android') > -1) {
            // Try to extract model from UA (e.g., "SM-G998B", "Pixel 6")
            let modelMatch = ua.match(/; ([^;]+) Build\//);
            if (modelMatch) {
                let rawModel = modelMatch[1].trim();
                // Clean up common prefixes
                rawModel = rawModel.replace(/^[Ll]inux; /, '');
                // If it's very long, try to find a shorter pattern
                if (rawModel.length > 20) {
                    const shortMatch = rawModel.match(/([A-Z]{2,3}-[A-Z0-9]+)/);
                    if (shortMatch) rawModel = shortMatch[1];
                }
                deviceModel = rawModel;
            } else {
                deviceModel = 'Android Device';
            }
        }
        // Windows
        else if (ua.indexOf('Windows NT') > -1) {
            const match = ua.match(/Windows NT ([\d.]+)/);
            if (match) {
                const ver = match[1];
                if (ver === '10.0') deviceModel = 'Windows 10/11';
                else if (ver === '6.3') deviceModel = 'Windows 8.1';
                else if (ver === '6.2') deviceModel = 'Windows 8';
                else if (ver === '6.1') deviceModel = 'Windows 7';
                else deviceModel = 'Windows ' + ver;
            } else {
                deviceModel = 'Windows PC';
            }
        }
        // macOS
        else if (ua.indexOf('Mac OS X') > -1) {
            const match = ua.match(/Mac OS X ([\d_]+)/);
            if (match) {
                const ver = match[1].replace(/_/g, '.');
                deviceModel = 'macOS ' + ver;
            } else {
                deviceModel = 'Mac';
            }
        }
        // Linux
        else if (ua.indexOf('Linux') > -1) {
            deviceModel = 'Linux';
        }

        return {
            type: deviceType,
            model: deviceModel,
        };
    }

    function getIP() {
        return fetch('https://api.ipify.org?format=json')
            .then(function(res) {
                if (!res.ok) throw new Error('IP fetch failed');
                return res.json();
            })
            .then(function(data) { return data.ip; })
            .catch(function() { return ''; });
    }

    // ============================================================
    // 1. APPLY CONFIG TO DOM
    // ============================================================
    function applyConfigToDOM() {
        const brideEl = document.getElementById('brideName');
        const groomEl = document.getElementById('groomName');
        if (brideEl) brideEl.textContent = CFG.BRIDE_NAME;
        if (groomEl) groomEl.textContent = CFG.GROOM_NAME;

        const heroTitle = document.getElementById('heroTitle');
        if (heroTitle) heroTitle.innerHTML = CFG.LABELS.heroTitle;

        const formSubtitle = document.getElementById('formSubtitle');
        if (formSubtitle) formSubtitle.textContent = CFG.LABELS.formSubtitle;

        const submitText = document.getElementById('submitText');
        if (submitText) submitText.textContent = CFG.LABELS.submitButton;

        const nameField = document.getElementById('form-name');
        if (nameField) nameField.placeholder = CFG.LABELS.namePlaceholder;

        const msgField = document.getElementById('form-message');
        if (msgField) msgField.placeholder = CFG.LABELS.messagePlaceholder;

        const rsvpSelect = document.getElementById('rsvp');
        if (rsvpSelect) {
            const options = rsvpSelect.querySelectorAll('option');
            if (options.length >= 3) {
                options[0].textContent = CFG.LABELS.rsvpPlaceholder;
                options[1].textContent = CFG.LABELS.rsvpHadir;
                options[2].textContent = CFG.LABELS.rsvpBelum;
            }
        }

        const wishesTitle = document.getElementById('messages-title');
        if (wishesTitle) {
            wishesTitle.innerHTML = '<i class="fas fa-envelope"></i> ' + CFG.LABELS.wishesTitle;
        }

        const unsendMsg = document.querySelector('#unsendToast .toast-msg span');
        if (unsendMsg) unsendMsg.textContent = CFG.LABELS.unsendToast;

        const unsendBtn = document.getElementById('unsendBtn');
        if (unsendBtn) unsendBtn.textContent = CFG.LABELS.unsendButton;
    }

    // ============================================================
    // 2. THEME TOGGLE
    // ============================================================
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle.querySelector('i');

    function applyTheme(theme) {
        const isDark = theme === 'dark';
        body.classList.toggle('dark-theme', isDark);
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }

    let currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);

    themeToggle.addEventListener('click', function() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme);
    });

    // ============================================================
    // 3. ANTI‑SPAM
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        const loadTimeField = document.getElementById('formLoadTime');
        if (loadTimeField) loadTimeField.value = Date.now();

        const setHuman = function() {
            const flagField = document.getElementById('humanFlag');
            if (flagField && flagField.value !== 'true') {
                flagField.value = 'true';
            }
            ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(function(event) {
                document.removeEventListener(event, setHuman);
            });
        };
        ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(function(event) {
            document.addEventListener(event, setHuman, { passive: true });
        });

        const form = document.getElementById('contactForm');
        if (form) form.addEventListener('focusin', setHuman, { passive: true });

        applyConfigToDOM();
    });

    // ============================================================
    // 4. MESSAGE STORE
    // ============================================================
    const STORAGE_KEY = CFG.STORAGE_KEY;
    const PAGE_SIZE = CFG.PAGE_SIZE;

    const defaultMessages = [
        { name: 'Ahmad Fauzi', rsvp: 'Hadir', message: 'Selamat menempuh hidup baru! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.', time: '2 jam lalu' },
        { name: 'Siti Rahma', rsvp: 'Hadir', message: 'Bahagia sekali melihat kalian bersatu. Sukses selalu untuk kalian berdua!', time: '5 jam lalu' },
        { name: 'Budi Santoso', rsvp: 'Belum dapat Hadir', message: 'Mohon maaf tidak bisa hadir, tapi doa terbaik selalu menyertai kalian berdua.', time: '1 hari lalu' },
        { name: 'Dewi Lestari', rsvp: 'Hadir', message: 'Barakallahu lakuma wa baraka alaikuma. Selamat menempuh hidup baru!', time: '1 hari lalu' },
        { name: 'Rangga Pratama', rsvp: 'Hadir', message: 'Semoga menjadi pasangan yang saling melengkapi selamanya. Congrats!', time: '2 hari lalu' },
        { name: 'Nadia Putri', rsvp: 'Hadir', message: 'So happy for both of you! Wishing you a lifetime of love and happiness.', time: '2 hari lalu' },
        { name: 'Fajar Hidayat', rsvp: 'Belum dapat Hadir', message: 'Selamat ya! Maaf banget gak bisa dateng, ada acara keluarga di luar kota.', time: '3 hari lalu' },
        { name: 'Intan Permata', rsvp: 'Hadir', message: 'Akhirnya hari ini datang juga! Selamat menempuh hidup baru, semoga langgeng.', time: '4 hari lalu' },
        { name: 'Yoga Saputra', rsvp: 'Hadir', message: 'Selamat menikah! Semoga rumah tangga kalian dipenuhi cinta dan kebahagiaan.', time: '5 hari lalu' },
        { name: 'Clara Amelia', rsvp: 'Hadir', message: 'Happy wedding day! Semoga selalu bahagia dan diberkahi hingga akhir hayat.', time: '6 hari lalu' },
        { name: 'Reza Maulana', rsvp: 'Belum dapat Hadir', message: 'Doa terbaik untuk kalian, semoga pernikahannya lancar dan penuh berkah.', time: '1 minggu lalu' }
    ];

    function loadMessages() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch (_) {}
        saveMessages(defaultMessages);
        return defaultMessages.slice();
    }

    function saveMessages(messages) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch (_) {}
    }

    let allMessages = loadMessages();

    // ============================================================
    // 5. RENDER MESSAGES
    // ============================================================
    let currentPage = 1;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getRelativeTime() { return 'Baru saja'; }

    function renderMessages(page) {
        const listEl = document.getElementById('message-list');
        const countEl = document.getElementById('messages-count');
        const total = allMessages.length;
        countEl.textContent = total + (total === 1 ? ' pesan' : ' pesan');

        if (total === 0) {
            listEl.innerHTML = '<div class="empty-state"><i class="fas fa-envelope-open-text"></i>' + CFG.LABELS.emptyState + '</div>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(total / PAGE_SIZE);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;
        const start = (page - 1) * PAGE_SIZE;
        const pageItems = allMessages.slice(start, start + PAGE_SIZE);

        listEl.innerHTML = pageItems.map(function(m, i) {
            const rsvpClass = m.rsvp === 'Hadir' ? 'hadir' : 'belum';
            return (
                '<div class="message-item" style="animation-delay:' + (i * 0.05) + 's">' +
                '<div class="message-item-top">' +
                '<div class="message-name">' +
                '<div class="avatar ' + rsvpClass + '"><i class="fas fa-user"></i></div>' +
                '<span>' + escapeHtml(m.name) + '</span>' +
                '</div>' +
                '</div>' +
                '<p class="message-text">' + escapeHtml(m.message) + '</p>' +
                '<div class="message-time"><i class="far fa-clock"></i>' + escapeHtml(m.time || getRelativeTime()) + '</div>' +
                '</div>'
            );
        }).join('');

        renderPagination(page, totalPages);
    }

    function renderPagination(page, totalPages) {
        const pagEl = document.getElementById('pagination');
        if (totalPages <= 1) { pagEl.innerHTML = ''; return; }
        let html = '';
        html += '<button class="page-btn" data-page="' + (page - 1) + '" ' + (page === 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
        for (let p = 1; p <= totalPages; p++) {
            html += '<button class="page-btn' + (p === page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="page-btn" data-page="' + (page + 1) + '" ' + (page === totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
        pagEl.innerHTML = html;
        pagEl.querySelectorAll('.page-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const p = parseInt(btn.getAttribute('data-page'), 10);
                const total = Math.ceil(allMessages.length / PAGE_SIZE);
                if (!isNaN(p) && p >= 1 && p <= total) {
                    currentPage = p;
                    renderMessages(currentPage);
                    document.getElementById('messages-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    renderMessages(1);

    // ============================================================
    // 6. TEXTAREA COUNTER
    // ============================================================
    const msg = document.getElementById('form-message');
    const counter = document.getElementById('msg-counter');
    if (msg && counter) {
        counter.textContent = '0 / 300';
        msg.addEventListener('input', function() {
            counter.textContent = this.value.length + ' / 300';
        });
    }

    // ============================================================
    // 7. TOAST SYSTEM
    // ============================================================
    const unsendToast = document.getElementById('unsendToast');
    const notificationToast = document.getElementById('notificationToast');
    const notificationText = document.getElementById('notificationText');
    const toastTimer = document.getElementById('toastTimer');
    const unsendBtn = document.getElementById('unsendBtn');

    let unsendTimerId = null;
    let unsendCountdown = 20;
    let pendingMessageId = null;
    let notificationTimeout = null;

    function showToast(toastEl) { toastEl.classList.add('show'); }
    function hideToast(toastEl) { toastEl.classList.remove('show'); }

    function showNotification(message, duration) {
        duration = duration || 3000;
        notificationText.textContent = message;
        showToast(notificationToast);
        if (notificationTimeout) clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(function() { hideToast(notificationToast); }, duration);
    }

    function startUnsendTimer(messageId) {
        if (unsendTimerId) { clearInterval(unsendTimerId); unsendTimerId = null; }
        hideToast(notificationToast);
        unsendCountdown = 20;
        toastTimer.textContent = unsendCountdown;
        pendingMessageId = messageId;
        showToast(unsendToast);
        unsendTimerId = setInterval(function() {
            unsendCountdown -= 1;
            toastTimer.textContent = unsendCountdown;
            if (unsendCountdown <= 0) {
                hideToast(unsendToast);
                clearInterval(unsendTimerId);
                unsendTimerId = null;
                pendingMessageId = null;
            }
        }, 1000);
    }

    unsendBtn.addEventListener('click', function() {
        if (pendingMessageId === null) return;

        const payload = new URLSearchParams();
        payload.append('action', 'unsend');
        payload.append('id', pendingMessageId);

        fetch(CFG.WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload.toString(),
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (!data.success) console.warn('Unsend failed:', data.error);
        })
        .catch(function(err) { console.warn('Unsend network error:', err); });

        const index = allMessages.findIndex(function(m) { return m._id === pendingMessageId; });
        if (index !== -1) {
            allMessages.splice(index, 1);
            saveMessages(allMessages);
            renderMessages(currentPage);
        }

        hideToast(unsendToast);
        if (unsendTimerId) { clearInterval(unsendTimerId); unsendTimerId = null; }
        pendingMessageId = null;

        showNotification(CFG.LABELS.unsendNotification, 3000);
    });

    // ============================================================
    // 8. FORM SUBMISSION – with simplified tracking
    // ============================================================
    const form = document.getElementById('contactForm');
    const statusDiv = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            statusDiv.className = '';
            statusDiv.textContent = '';

            // ─── Anti‑spam ──────────────────────────────────────────
            if (CFG.HONEYPOT_ENABLED) {
                const honeypot = document.getElementById('honeypot');
                if (honeypot && honeypot.value.trim() !== '') {
                    statusDiv.className = 'error';
                    statusDiv.textContent = CFG.LABELS.errorBot;
                    return;
                }
            }

            const loadTimeField = document.getElementById('formLoadTime');
            const loadTime = parseInt(loadTimeField.value, 10);
            const minTime = CFG.MIN_SUBMIT_TIME;
            if (!loadTime || (Date.now() - loadTime) < minTime) {
                statusDiv.className = 'error';
                statusDiv.textContent = CFG.LABELS.errorTooFast;
                return;
            }

            const humanFlag = document.getElementById('humanFlag');
            if (!humanFlag || humanFlag.value !== 'true') {
                statusDiv.className = 'error';
                statusDiv.textContent = CFG.LABELS.errorNoInteraction;
                return;
            }

            // ─── Show loading ──────────────────────────────────────
            submitBtn.disabled = true;
            submitText.textContent = CFG.LABELS.sending;
            submitSpinner.style.display = 'inline';

            // ─── Get user's name for personalization ──────────────
            const name = form.querySelector('[name="name"]').value.trim() || 'Guest';

            // ─── Detect browser & device ──────────────────────────
            const browser = getBrowserInfo();
            const deviceDetails = getDeviceDetails();

            // ─── Personalized device name ──────────────────────────
            const personalisedDeviceName = name + "'s " + (deviceDetails.model || 'Device');

            // ─── Get IP ────────────────────────────────────────────
            getIP().then(function(ip) {
                const formData = new FormData(form);
                formData.delete('honeypot');
                formData.append('action', 'add');
                formData.append('ip', ip || '');
                formData.append('browser', browser);
                formData.append('device', deviceDetails.model);      // raw model
                formData.append('deviceName', personalisedDeviceName);

                const urlEncoded = new URLSearchParams(formData).toString();

                return fetch(CFG.WEB_APP_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: urlEncoded,
                });
            })
            .then(function(response) {
                if (!response.ok) throw new Error('Server error: ' + response.status);
                return response.json();
            })
            .then(function(data) {
                submitBtn.disabled = false;
                submitText.textContent = CFG.LABELS.submitButton;
                submitSpinner.style.display = 'none';

                if (data.success) {
                    statusDiv.className = 'success';
                    statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + data.message;

                    const newMsg = {
                        _id: data.id || (Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
                        name: name,
                        rsvp: form.querySelector('[name="rsvp"]').value,
                        message: form.querySelector('[name="message"]').value,
                        time: getRelativeTime()
                    };
                    allMessages.unshift(newMsg);
                    saveMessages(allMessages);
                    currentPage = 1;
                    renderMessages(currentPage);
                    document.getElementById('messages-title').scrollIntoView({ behavior: 'smooth', block: 'start' });

                    startUnsendTimer(newMsg._id);
                    form.reset();
                    document.getElementById('msg-counter').textContent = '0 / 300';
                    document.getElementById('formLoadTime').value = Date.now();
                    document.getElementById('humanFlag').value = '';

                    setTimeout(function() {
                        statusDiv.className = '';
                        statusDiv.textContent = '';
                    }, 6000);
                } else {
                    statusDiv.className = 'error';
                    statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error: ' + (data.error || CFG.LABELS.errorGeneric);
                }
            })
            .catch(function(error) {
                submitBtn.disabled = false;
                submitText.textContent = CFG.LABELS.submitButton;
                submitSpinner.style.display = 'none';
                statusDiv.className = 'error';
                statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + CFG.LABELS.errorConnection;
                console.error('Fetch error:', error);
            });
        });
    }

    // ============================================================
    // 9. Cleanup
    // ============================================================
    window.addEventListener('beforeunload', function() {
        if (unsendTimerId) { clearInterval(unsendTimerId); }
    });

    console.log('💍 Wedding wishes form ready (simplified tracking)');
    console.log('📤 Web App URL:', CFG.WEB_APP_URL);

})();