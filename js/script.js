/**
 * ============================================================
 * WEDDING WISHES – Main JavaScript
 * Uses CONFIG from config.js (the control panel)
 * 
 * IMPROVED: Better device/browser detection using Client Hints
 * ============================================================
 */

(function() {
    'use strict';

    // ─── Get config from global ─────────────────────────────────
    const CFG = window.CONFIG;
    if (!CFG) {
        console.error('❌ CONFIG not loaded. Check config.js');
        return;
    }

    // ============================================================
    // 0. DEVICE & BROWSER DETECTION (improved)
    // ============================================================

    /**
     * Get browser name using Client Hints API (more accurate than userAgent)
     * Falls back to userAgent parsing if Client Hints not available
     */
    function getBrowserInfo() {
        // Try Client Hints first (gives real browser name, not spoofed)
        if (navigator.userAgentData && navigator.userAgentData.brands) {
            const brands = navigator.userAgentData.brands;
            // Look for Brave, Edge, Opera, or Chrome
            const knownBrands = ['Brave', 'Microsoft Edge', 'Opera', 'Google Chrome'];
            for (const brand of knownBrands) {
                const found = brands.find(b => b.brand === brand);
                if (found) {
                    return found.brand + ' ' + found.version;
                }
            }
            // Fallback: use the first brand
            if (brands.length > 0) {
                return brands[0].brand + ' ' + brands[0].version;
            }
        }

        // Fallback: parse userAgent
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = '';

        if (ua.includes('Edg/')) {
            browser = 'Edge';
            const match = ua.match(/Edg\/([\d.]+)/);
            if (match) version = match[1];
        } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
            browser = 'Opera';
            const match = ua.match(/(?:OPR|Opera)\/([\d.]+)/);
            if (match) version = match[1];
        } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
            browser = 'Chrome';
            const match = ua.match(/Chrome\/([\d.]+)/);
            if (match) version = match[1];
        } else if (ua.includes('Firefox/')) {
            browser = 'Firefox';
            const match = ua.match(/Firefox\/([\d.]+)/);
            if (match) version = match[1];
        } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
            browser = 'Safari';
            const match = ua.match(/Version\/([\d.]+)/);
            if (match) version = match[1];
        } else if (ua.includes('MSIE ') || ua.includes('Trident/')) {
            browser = 'Internet Explorer';
            const match = ua.match(/(?:MSIE |rv:)([\d.]+)/);
            if (match) version = match[1];
        }

        return browser + (version ? ' ' + version : '');
    }

    /**
     * Get device model using Client Hints API
     * Returns: model string (e.g., "SM-S911B", "iPhone17,1") or empty string
     */
    function getDeviceModel() {
        // Try Client Hints: navigator.userAgentData.model
        if (navigator.userAgentData && navigator.userAgentData.model) {
            return navigator.userAgentData.model;
        }

        // Fallback: try to extract from userAgent
        const ua = navigator.userAgent;
        // Android model: often "SM-XXXX" or "Pixel X"
        const androidMatch = ua.match(/; (SM-[A-Z0-9]+|Pixel\s?\d+|[A-Za-z]+\s?\d+)/);
        if (androidMatch) return androidMatch[1];
        // iPhone model: "iPhone14,2" etc.
        const iphoneMatch = ua.match(/iPhone(\d+,\d+)/);
        if (iphoneMatch) return 'iPhone' + iphoneMatch[1];

        return '';
    }

    /**
     * Get device type and friendly name
     */
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile/i.test(ua);
        const isTablet = /Tablet|iPad|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua);
        const isDesktop = !isMobile && !isTablet;

        let deviceType = 'Desktop';
        if (isTablet) deviceType = 'Tablet';
        else if (isMobile) deviceType = 'Mobile';

        // Get model
        let model = getDeviceModel();

        // Build friendly device name
        let deviceName = deviceType;

        // Try to get OS/platform
        let os = '';
        if (navigator.userAgentData && navigator.userAgentData.platform) {
            os = navigator.userAgentData.platform;
        } else if (ua.includes('Windows')) {
            os = 'Windows';
        } else if (ua.includes('Mac OS')) {
            os = 'macOS';
        } else if (ua.includes('Linux') && !ua.includes('Android')) {
            os = 'Linux';
        } else if (ua.includes('Android')) {
            os = 'Android';
        } else if (ua.includes('iPhone') || ua.includes('iPad')) {
            os = 'iOS';
        }

        // Build friendly name: "iPhone 16 Pro" or "Samsung Galaxy S23"
        if (model) {
            // Map common model codes to friendly names (optional)
            const modelMap = {
                // iPhone models
                'iPhone17,1': 'iPhone 16 Pro',
                'iPhone17,2': 'iPhone 16 Pro Max',
                'iPhone17,3': 'iPhone 16',
                'iPhone17,4': 'iPhone 16 Plus',
                'iPhone16,1': 'iPhone 15 Pro',
                'iPhone16,2': 'iPhone 15 Pro Max',
                'iPhone16,3': 'iPhone 15',
                'iPhone16,4': 'iPhone 15 Plus',
                'iPhone15,2': 'iPhone 14 Pro',
                'iPhone15,3': 'iPhone 14 Pro Max',
                'iPhone15,4': 'iPhone 14',
                'iPhone15,5': 'iPhone 14 Plus',
                'iPhone14,2': 'iPhone 13 Pro',
                'iPhone14,3': 'iPhone 13 Pro Max',
                'iPhone14,4': 'iPhone 13 mini',
                'iPhone14,5': 'iPhone 13',
                // Samsung (model codes)
                'SM-S911B': 'Galaxy S23',
                'SM-S918B': 'Galaxy S23 Ultra',
                'SM-S901B': 'Galaxy S22',
                'SM-S908B': 'Galaxy S22 Ultra',
                'SM-G998B': 'Galaxy S21 Ultra',
                'SM-G991B': 'Galaxy S21',
                'SM-A536B': 'Galaxy A53',
                'SM-A546B': 'Galaxy A54',
                // Pixel
                'Pixel 8': 'Pixel 8',
                'Pixel 8 Pro': 'Pixel 8 Pro',
                'Pixel 7': 'Pixel 7',
                'Pixel 7 Pro': 'Pixel 7 Pro',
                'Pixel 6': 'Pixel 6',
                'Pixel 6 Pro': 'Pixel 6 Pro',
            };
            if (modelMap[model]) {
                deviceName = modelMap[model];
            } else {
                // If model starts with "iPhone", use it directly
                if (model.startsWith('iPhone')) {
                    deviceName = model;
                } else {
                    deviceName = model;
                }
            }
        } else {
            // No model: use OS + device type
            deviceName = os ? os + ' ' + deviceType : deviceType;
        }

        return { device: deviceType, deviceName: deviceName, model: model };
    }

    /**
     * Get IP address
     */
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
    // 3. ANTI‑SPAM: Load time + human flag
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
    // 4. MESSAGE STORE (localStorage)
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

        // ─── Send unsend request to server ──────────────────────
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

        // ─── Remove from local storage and UI ────────────────────
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
    // 8. FORM SUBMISSION – with full tracking (improved)
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

            // ─── Anti‑spam checks ──────────────────────────────────
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

            // ─── Gather device/browser info (improved) ────────────
            const browser = getBrowserInfo();
            const deviceInfo = getDeviceInfo();

            // ─── Get IP ────────────────────────────────────────────
            getIP().then(function(ip) {
                // ─── Build payload ─────────────────────────────────
                const formData = new FormData(form);
                formData.delete('honeypot');
                formData.append('action', 'add');
                formData.append('ip', ip || '');
                formData.append('browser', browser);
                formData.append('device', deviceInfo.device);
                formData.append('deviceName', deviceInfo.deviceName);

                const urlEncoded = new URLSearchParams(formData).toString();

                // ─── Send ──────────────────────────────────────────
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

    console.log('💍 Wedding wishes form ready (with improved device tracking)');
    console.log('👰 Bride:', CFG.BRIDE_NAME);
    console.log('🤵 Groom:', CFG.GROOM_NAME);
    console.log('📤 Web App URL:', CFG.WEB_APP_URL);
    console.log('🔍 Browser detected:', getBrowserInfo());
    console.log('📱 Device info:', getDeviceInfo());

})();