/**
 * ============================================================
 * WEDDING WISHES – Frontend (client‑side data collection)
 * ============================================================
 * 
 * NEW:
 *   - Fetch messages from server on page load (no dummy data)
 *   - Optimistic submit with retry on failure
 *   - Draft saving to localStorage
 *   - Pending messages are stored and retried on page reload
 *   - No polling – quota efficient
 *   - Improved error handling: if fetch fails, shows empty state
 *   - FIXED: duplicate "Mengirim" after refresh – pending message is
 *     properly removed and ID updated on successful send.
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
    // 0. CLIENT‑SIDE DETECTION FUNCTIONS (unchanged)
    // ============================================================

    function getBrowserInfo() {
        if (!COLLECTION.device) return 'Disabled';
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

    function getTimeZone() {
        if (!COLLECTION.timezone) return 'Disabled';
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
        } catch (_) {
            return 'Unknown';
        }
    }

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
    // 1. THEME TOGGLE (unchanged)
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
    // 2. ANTI‑SPAM & DOM SETUP
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
        loadDraft();
        loadCachedMessagesInstantly(); // show something immediately, no blank wait
        fetchMessages(); // then refresh from server in the background
    });

    // ============================================================
    // 3. APPLY CONFIG TO DOM (unchanged)
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
    // 4. DRAFT SAVING / LOADING
    // ============================================================

    function saveDraft() {
        const name = document.getElementById('form-name').value;
        const rsvp = document.getElementById('rsvp').value;
        const message = document.getElementById('form-message').value;
        const draft = { name, rsvp, message };
        try {
            localStorage.setItem(CFG.DRAFT_KEY, JSON.stringify(draft));
        } catch (_) {}
    }

    function loadDraft() {
        try {
            const raw = localStorage.getItem(CFG.DRAFT_KEY);
            if (!raw) return;
            const draft = JSON.parse(raw);
            document.getElementById('form-name').value = draft.name || '';
            document.getElementById('rsvp').value = draft.rsvp || '';
            document.getElementById('form-message').value = draft.message || '';
            const counter = document.getElementById('msg-counter');
            if (counter) counter.textContent = (draft.message || '').length + ' / 300';
        } catch (_) {}
    }

    function clearDraft() {
        try {
            localStorage.removeItem(CFG.DRAFT_KEY);
        } catch (_) {}
    }

    // Auto‑save draft on input
    document.addEventListener('DOMContentLoaded', function() {
        const inputs = ['form-name', 'rsvp', 'form-message'];
        inputs.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', saveDraft);
                el.addEventListener('change', saveDraft);
            }
        });
    });

    // ============================================================
    // 5. PENDING MESSAGES (retry)
    // ============================================================

    function getPendingMessages() {
        try {
            const raw = localStorage.getItem(CFG.PENDING_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (_) { return []; }
    }

    function setPendingMessages(pending) {
        try {
            localStorage.setItem(CFG.PENDING_KEY, JSON.stringify(pending));
        } catch (_) {}
    }

    function addPendingMessage(msg) {
        const pending = getPendingMessages();
        pending.push(msg);
        setPendingMessages(pending);
    }

    function removePendingMessage(id) {
        let pending = getPendingMessages();
        pending = pending.filter(function(m) { return m._id !== id; });
        setPendingMessages(pending);
    }

    // ============================================================
    // 6. FETCH MESSAGES FROM SERVER – with robust error handling
    // ============================================================

    function loadCachedMessagesInstantly() {
        try {
            const raw = localStorage.getItem(CFG.STORAGE_KEY);
            if (raw) {
                allMessages = JSON.parse(raw);
                currentPage = 1;
                renderMessages(currentPage);
                return;
            }
        } catch (_) {}
        // No cache yet (first ever visit) – show a lightweight loading state
        // instead of leaving the list blank while the server responds.
        const listEl = document.getElementById('message-list');
        if (listEl) {
            listEl.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i>Memuat ucapan...</div>';
        }
    }

    function fetchMessages() {
        const url = CFG.WEB_APP_URL;
        console.log('🔍 fetchMessages() called. URL:', url);

        if (!url || url === 'YOUR_ACTUAL_APPS_SCRIPT_WEB_APP_URL') {
            console.warn('⚠️ WEB_APP_URL not configured. Please set it in config.js');
            allMessages = [];
            currentPage = 1;
            renderMessages(currentPage);
            return;
        }

        console.log('📡 Fetching messages from:', url);
        fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })
        .then(function(response) {
            console.log('📥 Response status:', response.status);
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ' - ' + response.statusText);
            }
            return response.json();
        })
        .then(function(serverData) {
            console.log('📦 Server data received:', serverData);
            if (!Array.isArray(serverData)) {
                if (serverData && serverData.error) {
                    throw new Error('Server error: ' + serverData.error);
                } else {
                    throw new Error('Invalid response from server (not an array)');
                }
            }

            const pending = getPendingMessages();
            const serverIds = serverData.map(function(m) { return m.id; });
            const pendingToShow = pending.filter(function(m) {
                return !serverIds.includes(m._id);
            });
            const pendingUI = pendingToShow.map(function(m) {
                return {
                    _id: m._id,
                    name: m.name,
                    rsvp: m.rsvp,
                    message: m.message,
                    time: m.time || new Date().toISOString(),
                    status: 'pending'
                };
            });
            const combined = serverData.map(function(m) {
                return {
                    _id: m.id,
                    name: m.name,
                    rsvp: m.rsvp,
                    message: m.message,
                    time: m.time || new Date().toISOString(),
                    status: 'sent'
                };
            });
            const all = combined.concat(pendingUI);
            all.sort(function(a, b) {
                return new Date(b.time) - new Date(a.time);
            });
            try {
                localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(all));
            } catch (_) {}
            allMessages = all;
            currentPage = 1;
            // Force a re‑render (even if the DOM hasn't updated)
            renderMessages(currentPage);
            console.log('✅ Messages rendered successfully. Count:', allMessages.length);
        })
        .catch(function(error) {
            console.error('❌ Fetch error:', error);
            try {
                const raw = localStorage.getItem(CFG.STORAGE_KEY);
                if (raw) {
                    allMessages = JSON.parse(raw);
                    currentPage = 1;
                    renderMessages(currentPage);
                    console.log('📂 Loaded from localStorage. Count:', allMessages.length);
                    return;
                }
            } catch (_) {}
            allMessages = [];
            currentPage = 1;
            renderMessages(currentPage);
            console.log('📭 No data – showing empty state.');
        });
    }

    // ============================================================
    // 7. RENDER MESSAGES (updated for status and retry)
    // ============================================================

    let allMessages = [];
    let currentPage = 1;
    const PAGE_SIZE = CFG.PAGE_SIZE;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getRelativeTime(iso) {
        if (!iso) return 'Baru saja';
        const diff = Date.now() - new Date(iso).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return minutes + ' menit lalu';
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + ' jam lalu';
        const days = Math.floor(hours / 24);
        return days + ' hari lalu';
    }

    function renderMessages(page) {
        const listEl = document.getElementById('message-list');
        const countEl = document.getElementById('messages-count');

        // ─── Fallback PAGE_SIZE (ensure it’s a number) ──────────────
        const pageSize = (typeof PAGE_SIZE === 'number' && PAGE_SIZE > 0) ? PAGE_SIZE : 5;
        console.log('📄 Using pageSize:', pageSize);

        if (!listEl) {
            console.error('❌ message-list element not found!');
            return;
        }

        const total = allMessages.length;
        countEl.textContent = total + (total === 1 ? ' pesan' : ' pesan');

        if (total === 0) {
            listEl.innerHTML = '<div class="empty-state"><i class="fas fa-envelope-open-text"></i>' + CFG.LABELS.emptyState + '</div>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(total / pageSize);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;
        const start = (page - 1) * pageSize;
        const pageItems = allMessages.slice(start, start + pageSize);

        console.log('📝 Rendering', pageItems.length, 'messages on page', page);

        listEl.innerHTML = pageItems.map(function(m, i) {
            const rsvpClass = m.rsvp === 'Hadir' ? 'hadir' : 'belum';
            const isPending = (m.status === 'pending');
            const isFailed = (m.status === 'failed');
            let statusHTML = '';
            if (isPending) {
                statusHTML = '<span class="message-status pending">' + CFG.LABELS.pendingStatus + '</span>';
            } else if (isFailed) {
                statusHTML = '<span class="message-status failed">' + CFG.LABELS.failedStatus + '</span>';
            }
            let retryButton = '';
            if (isFailed) {
                retryButton = '<button class="retry-btn" data-id="' + m._id + '">' + CFG.LABELS.retryButton + '</button>';
            }
            return (
                '<div class="message-item" style="animation-delay:' + (i * 0.05) + 's">' +
                '<div class="message-item-top">' +
                '<div class="message-name">' +
                '<div class="avatar ' + rsvpClass + '"><i class="fas fa-user"></i></div>' +
                '<span>' + escapeHtml(m.name) + '</span>' +
                '</div>' +
                '<div class="message-actions">' +
                statusHTML +
                retryButton +
                '</div>' +
                '</div>' +
                '<p class="message-text">' + escapeHtml(m.message) + '</p>' +
                '<div class="message-time"><i class="far fa-clock"></i>' + getRelativeTime(m.time) + '</div>' +
                '</div>'
            );
        }).join('');

        console.log('✅ HTML updated. InnerHTML length:', listEl.innerHTML.length);

        // ─── Attach retry listeners ──────────────────────────────────
        listEl.querySelectorAll('.retry-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                retryMessage(id);
            });
        });

        renderPagination(page, totalPages);
    }
 
    function renderPagination(page, totalPages) {
        const pagEl = document.getElementById('pagination');
        if (totalPages <= 1) { pagEl.innerHTML = ''; return; }

        // ─── Ensure PAGE_SIZE is a number ──────────────────────────
        const pageSize = (typeof PAGE_SIZE === 'number' && PAGE_SIZE > 0) ? PAGE_SIZE : 5;

        let html = '';
        html += '<button class="page-btn" data-page="' + (page - 1) + '" ' + (page === 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
        for (let p = 1; p <= totalPages; p++) {
            html += '<button class="page-btn' + (p === page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="page-btn" data-page="' + (page + 1) + '" ' + (page === totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
        pagEl.innerHTML = html;

        // ─── Attach click listeners ──────────────────────────────────
        pagEl.querySelectorAll('.page-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                // Prevent any default action
                e.preventDefault();
                const p = parseInt(btn.getAttribute('data-page'), 10);
                const total = Math.ceil(allMessages.length / pageSize);
                if (!isNaN(p) && p >= 1 && p <= total) {
                    currentPage = p;
                    renderMessages(currentPage);
                    // Scroll to the messages title
                    const titleEl = document.getElementById('messages-title');
                    if (titleEl) {
                        titleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    // ============================================================
    // 8. RETRY FUNCTION
    // ============================================================

    function retryMessage(id) {
        const index = allMessages.findIndex(function(m) { return m._id === id; });
        if (index === -1) return;
        const msg = allMessages[index];
        msg.status = 'pending';
        renderMessages(currentPage);
        sendMessageToServer(msg, true);
    }

    // ============================================================
    // 9. SEND MESSAGE TO SERVER (with retry support) – FIXED
    // ============================================================

    function sendMessageToServer(msg, isRetry) {
        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('name', msg.name);
        formData.append('rsvp', msg.rsvp);
        formData.append('message', msg.message);
        formData.append('ip', msg.ip || '');
        formData.append('deviceTypeModel', msg.deviceTypeModel || '');
        formData.append('browser', msg.browser || '');
        formData.append('timeZone', msg.timeZone || '');
        formData.append('graphics', msg.graphics || '');
        formData.append('batteryLevel', msg.batteryLevel || '');
        formData.append('batteryStatus', msg.batteryStatus || '');
        formData.append('screenResolution', msg.screenResolution || '');
        formData.append('screenAspectRatio', msg.screenAspectRatio || '');
        formData.append('collectISP', COLLECTION.isp ? 'true' : 'false');
        // Anti‑spam dummy fields (not needed for retry, but server expects them)
        formData.append('honeypot', '');
        formData.append('formLoadTime', String(Date.now() - 5000));
        formData.append('humanFlag', 'true');

        const urlEncoded = new URLSearchParams(formData).toString();

        return fetch(CFG.WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: urlEncoded,
        })
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                const index = allMessages.findIndex(function(m) { return m._id === msg._id; });
                if (index !== -1) {
                    allMessages[index].status = 'sent';
                    if (data.id) {
                        // Update the ID to the server‑generated one
                        allMessages[index]._id = data.id;
                    }
                    // Remove from pending storage (using the original _id)
                    removePendingMessage(msg._id);
                    // Save the updated list to localStorage with the new ID
                    try {
                        localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(allMessages));
                    } catch (_) {}
                }
                renderMessages(currentPage);
                return { success: true };
            } else {
                throw new Error(data.error || 'Server error');
            }
        })
        .catch(function(error) {
            const index = allMessages.findIndex(function(m) { return m._id === msg._id; });
            if (index !== -1) {
                allMessages[index].status = 'failed';
                addPendingMessage(allMessages[index]);
            }
            renderMessages(currentPage);
            throw error;
        });
    }

    // ============================================================
    // 10. TEXTAREA COUNTER (unchanged)
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
    // 11. TOAST SYSTEM (unchanged)
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
        hideToast(notificationToast);
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
            removePendingMessage(pendingMessageId);
            try {
                localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(allMessages));
            } catch (_) {}
            renderMessages(currentPage);
        }

        hideToast(unsendToast);
        if (unsendTimerId) { clearInterval(unsendTimerId); unsendTimerId = null; }
        pendingMessageId = null;

        showNotification(CFG.LABELS.unsendNotification, CFG.NOTIFICATION_DURATION);
    });

    // ============================================================
    // 12. FORM SUBMISSION (with draft, pending, retry)
    // ============================================================

    const form = document.getElementById('contactForm');
    const statusDiv = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');

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

            statusDiv.className = '';
            statusDiv.textContent = '';
            statusDiv.style.display = 'none';
            if (notificationTimeout) clearTimeout(notificationTimeout);

            // ─── 1. Check required fields ────────────────────────────
            const name = form.querySelector('[name="name"]').value.trim();
            const rsvp = form.querySelector('[name="rsvp"]').value;
            const message = form.querySelector('[name="message"]').value.trim();
            if (!name || !rsvp || !message) {
                showFormStatus('❌ Semua field harus diisi.', 'error');
                return;
            }

            // ─── 2. Anti‑spam ─────────────────────────────────────────
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

            // ─── 3. Cooldown check ────────────────────────────────────
            const cooldownRemaining = getCooldownRemaining();
            if (cooldownRemaining > 0) {
                const seconds = Math.ceil(cooldownRemaining / 1000);
                showFormStatus('⏳ Tunggu ' + seconds + ' detik lagi untuk mengirim pesan.', 'error');
                return;
            }

            // ─── 4. IP Limit ──────────────────────────────────────────
            const ipPromise = COLLECTION.ip ? getPublicIP() : Promise.resolve('Disabled');

            ipPromise.then(function(ip) {
                const currentCount = getIPCount(ip);
                if (currentCount >= CFG.MAX_MESSAGES_PER_IP) {
                    showFormStatus(CFG.LABELS.errorLimitReached, 'error');
                    return Promise.reject('Limit reached');
                }

                const id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                const deviceTypeModel = getDeviceTypeModel();
                const browser = getBrowserInfo();
                const timeZone = getTimeZone();
                const screenInfo = getScreenInfo();
                const graphicsInfo = getGraphicsInfo();

                return getBatteryInfo().then(function(battery) {
                    const newMsg = {
                        _id: id,
                        name: name,
                        rsvp: rsvp,
                        message: message,
                        time: new Date().toISOString(),
                        status: 'pending',
                        ip: ip,
                        deviceTypeModel: deviceTypeModel,
                        browser: browser,
                        timeZone: timeZone,
                        graphics: graphicsInfo,
                        batteryLevel: battery.level,
                        batteryStatus: battery.status,
                        screenResolution: screenInfo.resolution,
                        screenAspectRatio: screenInfo.aspectRatio,
                    };
                    return newMsg;
                });
            })
            .then(function(newMsg) {
                // ─── Add to UI optimistically ──────────────────────────
                allMessages.unshift(newMsg);
                try {
                    localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(allMessages));
                } catch (_) {}
                addPendingMessage(newMsg);
                clearDraft();
                form.reset();
                document.getElementById('msg-counter').textContent = '0 / 300';
                document.getElementById('formLoadTime').value = Date.now();
                document.getElementById('humanFlag').value = '';
                renderMessages(1);
                document.getElementById('messages-title').scrollIntoView({ behavior: 'smooth', block: 'start' });

                // ─── Send to server ─────────────────────────────────────
                submitBtn.disabled = true;
                submitText.textContent = CFG.LABELS.sending;
                submitSpinner.style.display = 'inline';

                return sendMessageToServer(newMsg, false)
                    .then(function() {
                        submitBtn.disabled = false;
                        submitText.textContent = CFG.LABELS.submitButton;
                        submitSpinner.style.display = 'none';
                        incrementIPCount(newMsg.ip);
                        setCooldown();
                        startUnsendTimer(newMsg._id);
                    })
                    .catch(function(error) {
                        submitBtn.disabled = false;
                        submitText.textContent = CFG.LABELS.submitButton;
                        submitSpinner.style.display = 'none';
                        showFormStatus('❌ Gagal mengirim. Klik "Retry" di pesan.', 'error');
                    });
            })
            .catch(function(error) {
                if (error !== 'Limit reached') {
                    showFormStatus('❌ Gagal mendapatkan IP.', 'error');
                }
            });
        });
    }

    // ============================================================
    // 13. IP TRACKING & COOLDOWN (unchanged)
    // ============================================================

    function getIPCount(ip) {
        if (!ip || ip === 'Disabled') return 0;
        try {
            const data = JSON.parse(localStorage.getItem(CFG.IP_TRACKING_KEY) || '{}');
            return data[ip] || 0;
        } catch (_) { return 0; }
    }

    function incrementIPCount(ip) {
        if (!ip || ip === 'Disabled') return;
        try {
            const data = JSON.parse(localStorage.getItem(CFG.IP_TRACKING_KEY) || '{}');
            data[ip] = (data[ip] || 0) + 1;
            localStorage.setItem(CFG.IP_TRACKING_KEY, JSON.stringify(data));
        } catch (_) {}
    }

    function getCooldownRemaining() {
        try {
            const lastSubmit = parseInt(localStorage.getItem(CFG.COOLDOWN_KEY) || '0', 10);
            const elapsed = Date.now() - lastSubmit;
            const remaining = CFG.COOLDOWN_TIME - elapsed;
            return remaining > 0 ? remaining : 0;
        } catch (_) { return 0; }
    }

    function setCooldown() {
        try {
            localStorage.setItem(CFG.COOLDOWN_KEY, String(Date.now()));
        } catch (_) {}
    }

    // ============================================================
    // 14. Cleanup (unchanged)
    // ============================================================

    window.addEventListener('beforeunload', function() {
        if (unsendTimerId) { clearInterval(unsendTimerId); }
    });

    console.log('💍 Wedding wishes form ready (with fetch, draft, retry)');
    console.log('📊 Collection toggles:', COLLECTION);

})();