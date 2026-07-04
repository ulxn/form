/**
 * ============================================================
 * WEDDING WISHES – Frontend (client‑side data collection)
 * ============================================================
 * 
 * Data collection is controlled by toggles in config.js.
 * If a feature is disabled, its value is set to 'Disabled'.
 * 
 * NEW:
 *   - Cooldown (30s) between messages per user
 *   - Max 3 messages per IP (unsent excluded)
 *   - Unsend notification appears in same position as unsend toast
 *   - All fields required (already enforced by HTML)
 *   - Configurable durations and limits
 * ============================================================
 */

(function() {
    'use strict';

    const CFG = window.CONFIG;
    if (!CFG) {
        console.error('❌ CONFIG not loaded. Check config.js');
        return;
    }

    const COLLECTION = CFG.COLLECTION;

    // ============================================================
    // 0. CLIENT‑SIDE DETECTION FUNCTIONS (only if enabled)
    // ============================================================

    function getBrowserInfo() {
        if (!COLLECTION.device) return 'Disabled';
        // Use Client Hints for accurate browser name + full version
        if (navigator.userAgentData && navigator.userAgentData.brands) {
            const brands = navigator.userAgentData.brands;
            const knownBrands = ['Brave', 'Microsoft Edge', 'Opera', 'Google Chrome'];
            for (const brand of knownBrands) {
                const found = brands.find(b => b.brand === brand);
                if (found) {
                    let fullVersion = found.version;
                    if (navigator.userAgentData.fullVersionList) {
                        const full = navigator.userAgentData.fullVersionList.find(b => b.brand === brand);
                        if (full) fullVersion = full.version;
                    }
                    return brand + ' ' + fullVersion;
                }
            }
            if (brands.length > 0) {
                return brands[0].brand + ' ' + brands[0].version;
            }
        }
        // Fallback to userAgent parsing
        const ua = navigator.userAgent;
        if (ua.includes('Edg/')) return 'Edge ' + (ua.match(/Edg\/([\d.]+)/) || [])[1];
        if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera ' + (ua.match(/(?:OPR|Opera)\/([\d.]+)/) || [])[1];
        if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome ' + (ua.match(/Chrome\/([\d.]+)/) || [])[1];
        if (ua.includes('Firefox/')) return 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/) || [])[1];
        if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari ' + (ua.match(/Version\/([\d.]+)/) || [])[1];
        return 'Unknown';
    }

    function getDeviceTypeModel() {
        if (!COLLECTION.device) return 'Disabled';
        let model = '';
        let type = 'Desktop or laptop';

        if (navigator.userAgentData && navigator.userAgentData.model) {
            model = navigator.userAgentData.model;
        } else {
            const ua = navigator.userAgent;
            const androidMatch = ua.match(/; (SM-[A-Z0-9]+|Pixel\s?\d+|[A-Za-z]+\s?\d+)/);
            if (androidMatch) model = androidMatch[1];
            const iphoneMatch = ua.match(/iPhone(\d+,\d+)/);
            if (iphoneMatch) model = 'iPhone' + iphoneMatch[1];
        }

        const ua = navigator.userAgent;
        if (/Tablet|iPad|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) type = 'Tablet';
        else if (/Mobi|Android|iPhone|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile/i.test(ua)) type = 'Mobile Phone';

        return type + (model ? ' (' + model + ')' : '');
    }

    // ============================================================
    // 1. BATTERY (only if enabled)
    // ============================================================

    function getBatteryInfo() {
        if (!COLLECTION.battery) {
            return Promise.resolve({ level: 'Disabled', status: 'Disabled' });
        }
        if (!navigator.getBattery) {
            return Promise.resolve({ level: 'Unknown', status: 'Unknown' });
        }
        return navigator.getBattery()
            .then(function(battery) {
                return {
                    level: Math.round(battery.level * 100) + '%',
                    status: battery.charging ? 'Charging' : 'Discharging'
                };
            })
            .catch(function() {
                return { level: 'Unknown', status: 'Unknown' };
            });
    }

    // ============================================================
    // 2. SCREEN (only if enabled)
    // ============================================================

    function getScreenInfo() {
        if (!COLLECTION.screen) {
            return { resolution: 'Disabled', aspectRatio: 'Disabled' };
        }
        const width = screen.width;
        const height = screen.height;
        
        function gcd(a, b) {
            a = Math.floor(a);
            b = Math.floor(b);
            return b === 0 ? a : gcd(b, a % b);
        }
        
        const divisor = gcd(width, height);
        const aspectRatio = (width / divisor) + ':' + (height / divisor);
        
        return {
            resolution: width + 'x' + height,
            aspectRatio: aspectRatio
        };
    }

    // ============================================================
    // 3. GRAPHICS CARD (only if enabled)
    // ============================================================

    function getGraphicsInfo() {
        if (!COLLECTION.graphics) return 'Disabled';
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'Unknown (WebGL not supported)';
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (!debugInfo) {
                return 'Unknown (Extension not available – browser may block it)';
            }
            
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            return vendor + ' / ' + renderer;
        } catch (_) {
            return 'Unknown (Error accessing graphics info)';
        }
    }

    // ============================================================
    // 4. SYSTEM TIME ZONE (only if enabled)
    // ============================================================

    function getTimeZone() {
        if (!COLLECTION.timezone) return 'Disabled';
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
        } catch (_) {
            return 'Unknown';
        }
    }

    // ============================================================
    // 5. PUBLIC IP ADDRESS (only if enabled)
    // ============================================================

    function getPublicIP() {
        if (!COLLECTION.ip) return Promise.resolve('Disabled');
        return fetch('https://api.ipify.org?format=json')
            .then(function(res) {
                if (!res.ok) throw new Error('IP fetch failed');
                return res.json();
            })
            .then(function(data) {
                return data.ip;
            })
            .catch(function() {
                return 'Unknown';
            });
    }

    // ============================================================
    // 6. THEME TOGGLE (unchanged)
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
    // 7. ANTI‑SPAM (unchanged)
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
    // 8. APPLY CONFIG TO DOM (unchanged)
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
    // 9. MESSAGE STORE (unchanged)
    // ============================================================

    const STORAGE_KEY = CFG.STORAGE_KEY;
    const PAGE_SIZE = CFG.PAGE_SIZE;
    const IP_TRACKING_KEY = CFG.IP_TRACKING_KEY;
    const COOLDOWN_KEY = CFG.COOLDOWN_KEY;

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
    // 10. RENDER MESSAGES (unchanged)
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
    // 11. TEXTAREA COUNTER (unchanged)
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
    // 12. TOAST SYSTEM (with unified positioning)
    // ============================================================

    const unsendToast = document.getElementById('unsendToast');
    const notificationToast = document.getElementById('notificationToast');
    const notificationText = document.getElementById('notificationText');
    const toastTimer = document.getElementById('toastTimer');
    const unsendBtn = document.getElementById('unsendBtn');

    let unsendTimerId = null;
    let unsendCountdown = CFG.UNSEND_TIMER;
    let pendingMessageId = null;
    let notificationTimeout = null;

    function showToast(toastEl) { toastEl.classList.add('show'); }
    function hideToast(toastEl) { toastEl.classList.remove('show'); }

    function showNotification(message, duration) {
        duration = duration || CFG.NOTIFICATION_DURATION;
        notificationText.textContent = message;
        showToast(notificationToast);
        if (notificationTimeout) clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(function() { hideToast(notificationToast); }, duration);
    }

    function startUnsendTimer(messageId) {
        if (unsendTimerId) { clearInterval(unsendTimerId); unsendTimerId = null; }
        hideToast(notificationToast); // hide any previous notification
        unsendCountdown = CFG.UNSEND_TIMER;
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
            if (!data.success) {
                console.warn('Unsend failed:', data.error);
            }
        })
        .catch(function(err) {
            console.warn('Unsend network error:', err);
        });

        const index = allMessages.findIndex(function(m) { return m._id === pendingMessageId; });
        if (index !== -1) {
            allMessages.splice(index, 1);
            saveMessages(allMessages);
            renderMessages(currentPage);
        }

        hideToast(unsendToast);
        if (unsendTimerId) { clearInterval(unsendTimerId); unsendTimerId = null; }
        pendingMessageId = null;

        // Show the unsend notification in the same position (the notification toast)
        showNotification(CFG.LABELS.unsendNotification, CFG.NOTIFICATION_DURATION);
    });

    // ============================================================
    // 13. IP TRACKING & COOLDOWN HELPERS
    // ============================================================

    function getIPCount(ip) {
        if (!ip || ip === 'Disabled') return 0;
        try {
            const data = JSON.parse(localStorage.getItem(IP_TRACKING_KEY) || '{}');
            return data[ip] || 0;
        } catch (_) { return 0; }
    }

    function incrementIPCount(ip) {
        if (!ip || ip === 'Disabled') return;
        try {
            const data = JSON.parse(localStorage.getItem(IP_TRACKING_KEY) || '{}');
            data[ip] = (data[ip] || 0) + 1;
            localStorage.setItem(IP_TRACKING_KEY, JSON.stringify(data));
        } catch (_) {}
    }

    function getCooldownRemaining() {
        try {
            const lastSubmit = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
            const elapsed = Date.now() - lastSubmit;
            const remaining = CFG.COOLDOWN_TIME - elapsed;
            return remaining > 0 ? remaining : 0;
        } catch (_) { return 0; }
    }

    function setCooldown() {
        try {
            localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
        } catch (_) {}
    }

    // ============================================================
    // 14. FORM SUBMISSION – with cooldown, IP limit, and required fields
    // ============================================================

    const form = document.getElementById('contactForm');
    const statusDiv = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');

    // Show a temporary status message in the formStatus div
    function showFormStatus(message, type, duration) {
        duration = duration || CFG.FORM_STATUS_DURATION;
        statusDiv.className = type || '';
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        if (notificationTimeout) clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(function() {
            statusDiv.className = '';
            statusDiv.textContent = '';
            statusDiv.style.display = 'none';
        }, duration);
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // ─── Clear previous status ────────────────────────────────
            statusDiv.className = '';
            statusDiv.textContent = '';
            statusDiv.style.display = 'none';
            if (notificationTimeout) clearTimeout(notificationTimeout);

            // ─── 1. Check all required fields (HTML5 already enforced, but double‑check) ──
            const name = form.querySelector('[name="name"]').value.trim();
            const rsvp = form.querySelector('[name="rsvp"]').value;
            const message = form.querySelector('[name="message"]').value.trim();
            if (!name || !rsvp || !message) {
                showFormStatus('❌ Semua field harus diisi.', 'error');
                return;
            }

            // ─── 2. Anti‑spam ────────────────────────────────────────────
            if (CFG.HONEYPOT_ENABLED) {
                const honeypot = document.getElementById('honeypot');
                if (honeypot && honeypot.value.trim() !== '') {
                    showFormStatus(CFG.LABELS.errorBot, 'error');
                    return;
                }
            }

            const loadTimeField = document.getElementById('formLoadTime');
            const loadTime = parseInt(loadTimeField.value, 10);
            const minTime = CFG.MIN_SUBMIT_TIME;
            if (!loadTime || (Date.now() - loadTime) < minTime) {
                showFormStatus(CFG.LABELS.errorTooFast, 'error');
                return;
            }

            const humanFlag = document.getElementById('humanFlag');
            if (!humanFlag || humanFlag.value !== 'true') {
                showFormStatus(CFG.LABELS.errorNoInteraction, 'error');
                return;
            }

            // ─── 3. Cooldown check ──────────────────────────────────────
            const cooldownRemaining = getCooldownRemaining();
            if (cooldownRemaining > 0) {
                const seconds = Math.ceil(cooldownRemaining / 1000);
                showFormStatus('⏳ Tunggu ' + seconds + ' detik lagi untuk mengirim pesan.', 'error');
                return;
            }

            // ─── 4. IP Limit (must get IP first) ──────────────────────
            // We'll fetch IP and then check limit, but we need to know IP before sending.
            // So we'll get IP first (if collection enabled) or use 'Disabled'.
            const ipPromise = COLLECTION.ip ? getPublicIP() : Promise.resolve('Disabled');

            ipPromise.then(function(ip) {
                const currentCount = getIPCount(ip);
                if (currentCount >= CFG.MAX_MESSAGES_PER_IP) {
                    showFormStatus(CFG.LABELS.errorLimitReached, 'error');
                    return Promise.reject('Limit reached');
                }

                // ─── All checks passed: proceed with submission ────────
                submitBtn.disabled = true;
                submitText.textContent = CFG.LABELS.sending;
                submitSpinner.style.display = 'inline';

                // ─── Gather client‑side data ────────────────────────────
                const deviceTypeModel = getDeviceTypeModel();
                const browser = getBrowserInfo();
                const timeZone = getTimeZone();
                const screenInfo = getScreenInfo();
                const graphicsInfo = getGraphicsInfo();

                // ─── Build promises for battery (if enabled) ──────────
                const batteryPromise = COLLECTION.battery ? getBatteryInfo() : Promise.resolve({ level: 'Disabled', status: 'Disabled' });

                return Promise.all([batteryPromise])
                    .then(function(batteryResults) {
                        const battery = batteryResults[0];

                        const formData = new FormData(form);
                        formData.delete('honeypot');
                        formData.append('action', 'add');
                        formData.append('ip', ip);
                        formData.append('deviceTypeModel', deviceTypeModel);
                        formData.append('browser', browser);
                        formData.append('timeZone', timeZone);
                        formData.append('graphics', graphicsInfo);
                        formData.append('batteryLevel', battery.level);
                        formData.append('batteryStatus', battery.status);
                        formData.append('screenResolution', screenInfo.resolution);
                        formData.append('screenAspectRatio', screenInfo.aspectRatio);
                        formData.append('collectISP', COLLECTION.isp ? 'true' : 'false');

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
                            // ─── Increment IP count ────────────────────────
                            incrementIPCount(ip);
                            // ─── Set cooldown ────────────────────────────────
                            setCooldown();

                            // ─── Show success (no success message from config) ──
                            // The toast will show "Pesan terkirim" automatically.
                            // We'll just let the toast handle it.

                            const name = form.querySelector('[name="name"]').value;
                            const rsvp = form.querySelector('[name="rsvp"]').value;
                            const message = form.querySelector('[name="message"]').value;
                            const newMsg = {
                                _id: data.id || (Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
                                name: name,
                                rsvp: rsvp,
                                message: message,
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

                            // Clear any status after a while
                            setTimeout(function() {
                                statusDiv.className = '';
                                statusDiv.textContent = '';
                                statusDiv.style.display = 'none';
                            }, CFG.FORM_STATUS_DURATION);
                        } else {
                            showFormStatus('❌ Error: ' + (data.error || CFG.LABELS.errorGeneric), 'error');
                        }
                    })
                    .catch(function(error) {
                        submitBtn.disabled = false;
                        submitText.textContent = CFG.LABELS.submitButton;
                        submitSpinner.style.display = 'none';
                        if (error !== 'Limit reached') {
                            showFormStatus('❌ ' + CFG.LABELS.errorConnection, 'error');
                            console.error('Fetch error:', error);
                        }
                    });
            }).catch(function(error) {
                // If IP fetch fails or limit reached, we already handled it
                if (error !== 'Limit reached') {
                    showFormStatus('❌ Gagal mendapatkan IP.', 'error');
                }
            });
        });
    }

    // ============================================================
    // 15. Cleanup (unchanged)
    // ============================================================

    window.addEventListener('beforeunload', function() {
        if (unsendTimerId) { clearInterval(unsendTimerId); }
    });

    console.log('💍 Wedding wishes form ready (with cooldown & IP limit)');
    console.log('📊 Collection toggles:', COLLECTION);
})();