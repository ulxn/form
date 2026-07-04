/**
 * ============================================================
 * WEDDING WISHES – Main JavaScript (Enhanced Tracking)
 * Now captures IP, location, battery, and screen info
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
    // 0. ENHANCED DEVICE & BROWSER DETECTION
    // ============================================================

    function getBrowserInfo() {
        // Use Client Hints for accurate browser name
        if (navigator.userAgentData && navigator.userAgentData.brands) {
            const brands = navigator.userAgentData.brands;
            const knownBrands = ['Brave', 'Microsoft Edge', 'Opera', 'Google Chrome'];
            for (const brand of knownBrands) {
                const found = brands.find(b => b.brand === brand);
                if (found) {
                    return found.brand + ' ' + found.version;
                }
            }
            if (brands.length > 0) {
                return brands[0].brand + ' ' + brands[0].version;
            }
        }
        // Fallback to userAgent parsing
        const ua = navigator.userAgent;
        if (ua.includes('Edg/')) return 'Edge ' + ua.match(/Edg\/([\d.]+)/)[1];
        if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera ' + (ua.match(/(?:OPR|Opera)\/([\d.]+)/) || [])[1];
        if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome ' + (ua.match(/Chrome\/([\d.]+)/) || [])[1];
        if (ua.includes('Firefox/')) return 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/) || [])[1];
        if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari ' + (ua.match(/Version\/([\d.]+)/) || [])[1];
        return 'Unknown';
    }

    function getTrueBrowserCore() {
        // Determine the underlying engine
        const ua = navigator.userAgent;
        if (ua.includes('Edg/') || ua.includes('Chrome/') || ua.includes('OPR/') || ua.includes('Brave/')) return 'Chromium';
        if (ua.includes('Firefox/')) return 'Gecko';
        if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'WebKit';
        return 'Unknown';
    }

    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let model = '';
        if (navigator.userAgentData && navigator.userAgentData.model) {
            model = navigator.userAgentData.model;
        } else {
            // Fallback: try to extract from userAgent
            const androidMatch = ua.match(/; (SM-[A-Z0-9]+|Pixel\s?\d+|[A-Za-z]+\s?\d+)/);
            if (androidMatch) model = androidMatch[1];
            const iphoneMatch = ua.match(/iPhone(\d+,\d+)/);
            if (iphoneMatch) model = 'iPhone' + iphoneMatch[1];
        }

        let os = 'Unknown';
        if (navigator.userAgentData && navigator.userAgentData.platform) {
            os = navigator.userAgentData.platform;
        } else if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac OS')) os = 'macOS';
        else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

        let deviceType = 'Desktop';
        if (/Tablet|iPad|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) deviceType = 'Tablet';
        else if (/Mobi|Android|iPhone|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile/i.test(ua)) deviceType = 'Mobile';

        return { deviceType, model, os };
    }

    function getOperatingSystem() {
        const info = getDeviceInfo();
        return info.os;
    }

    function getDeviceTypeModel() {
        const info = getDeviceInfo();
        return info.deviceType + (info.model ? ' (' + info.model + ')' : '');
    }

    // ============================================================
    // 1. IP & GEOLOCATION
    // ============================================================

    function getIPInfo() {
        // Fetch IP and use ip-api.com for geolocation (free, no API key needed)
        return fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => {
                const ip = data.ip;
                // Now get geolocation data
                return fetch('http://ip-api.com/json/' + ip + '?fields=status,message,country,regionName,city,lat,lon,isp,org,as,timezone')
                    .then(res => res.json())
                    .then(geo => {
                        return {
                            ip: ip,
                            country: geo.country || 'Unknown',
                            region: geo.regionName || 'Unknown',
                            city: geo.city || 'Unknown',
                            lat: geo.lat || 'Unknown',
                            lon: geo.lon || 'Unknown',
                            isp: geo.isp || geo.org || 'Unknown',
                            nameservers: geo.as || 'Unknown',
                            timezone: geo.timezone || 'Unknown'
                        };
                    });
            })
            .catch(() => {
                return {
                    ip: 'Unknown',
                    country: 'Unknown',
                    region: 'Unknown',
                    city: 'Unknown',
                    lat: 'Unknown',
                    lon: 'Unknown',
                    isp: 'Unknown',
                    nameservers: 'Unknown',
                    timezone: 'Unknown'
                };
            });
    }

    // ============================================================
    // 2. BATTERY STATUS
    // ============================================================

    function getBatteryInfo() {
        if (!navigator.getBattery) {
            return Promise.resolve({
                level: 'Unknown',
                charging: 'Unknown',
                status: 'Unknown'
            });
        }
        return navigator.getBattery().then(function(battery) {
            return {
                level: Math.round(battery.level * 100) + '%',
                charging: battery.charging ? 'Yes' : 'No',
                status: battery.charging ? 'Charging' : 'Discharging'
            };
        }).catch(function() {
            return { level: 'Unknown', charging: 'Unknown', status: 'Unknown' };
        });
    }

    // ============================================================
    // 3. SCREEN INFO
    // ============================================================

    function getScreenInfo() {
        const width = screen.width;
        const height = screen.height;
        const gcd = function(a, b) { return b === 0 ? a : gcd(b, a % b); };
        const ratio = gcd(width, height);
        const aspectRatio = (width / ratio) + ':' + (height / ratio);
        let orientation = 'Unknown';
        if (screen.orientation && screen.orientation.type) {
            orientation = screen.orientation.type;
        } else if (window.orientation !== undefined) {
            orientation = (window.orientation === 0 || window.orientation === 180) ? 'portrait' : 'landscape';
        }
        return {
            resolution: width + 'x' + height,
            aspectRatio: aspectRatio,
            orientation: orientation
        };
    }

    // ============================================================
    // 4. SYSTEM TIME ZONE
    // ============================================================

    function getTimeZone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
        } catch (_) {
            return 'Unknown';
        }
    }

    // ============================================================
    // 5. APPLY CONFIG TO DOM (unchanged)
    // ============================================================

    function applyConfigToDOM() {
        // ... (same as before - unchanged)
        // This function is unchanged from the previous version
    }

    // ============================================================
    // 6. THEME TOGGLE (unchanged)
    // ============================================================

    // ... (theme toggle code unchanged)

    // ============================================================
    // 7. ANTI‑SPAM (unchanged)
    // ============================================================

    // ... (anti-spam code unchanged)

    // ============================================================
    // 8. FORM SUBMISSION (enhanced with all new fields)
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

            // ─── Anti‑spam checks (unchanged) ──────────────────────
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

            // ─── Gather all data ──────────────────────────────────
            const browser = getBrowserInfo();
            const browserCore = getTrueBrowserCore();
            const deviceTypeModel = getDeviceTypeModel();
            const os = getOperatingSystem();
            const timeZone = getTimeZone();
            const screenInfo = getScreenInfo();

            // ─── Get IP & geolocation ─────────────────────────────
            getIPInfo().then(function(ipData) {
                // ─── Get battery info ─────────────────────────────
                return getBatteryInfo().then(function(batteryData) {
                    return {
                        ipData: ipData,
                        batteryData: batteryData
                    };
                });
            }).then(function(result) {
                const ipData = result.ipData;
                const batteryData = result.batteryData;

                // ─── Build payload ─────────────────────────────────
                const formData = new FormData(form);
                formData.delete('honeypot');
                formData.append('action', 'add');
                formData.append('browser', browser);
                formData.append('browserCore', browserCore);
                formData.append('deviceTypeModel', deviceTypeModel);
                formData.append('os', os);
                formData.append('timeZone', timeZone);

                // IP & Location
                formData.append('ip', ipData.ip);
                formData.append('country', ipData.country);
                formData.append('region', ipData.region);
                formData.append('city', ipData.city);
                formData.append('lat', ipData.lat);
                formData.append('lon', ipData.lon);
                formData.append('isp', ipData.isp);
                formData.append('nameservers', ipData.nameservers);
                formData.append('geoTimezone', ipData.timezone);

                // Battery
                formData.append('batteryLevel', batteryData.level);
                formData.append('batteryCharging', batteryData.charging);
                formData.append('batteryStatus', batteryData.status);

                // Screen
                formData.append('screenResolution', screenInfo.resolution);
                formData.append('screenAspectRatio', screenInfo.aspectRatio);
                formData.append('screenOrientation', screenInfo.orientation);

                // VPN (not detected client-side)
                formData.append('vpn', 'Not Detected');

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

                    // Add to local list (unchanged)
                    // ... (add message to UI code unchanged)

                    startUnsendTimer(data.id);
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
    // 9. Cleanup (unchanged)
    // ============================================================

    window.addEventListener('beforeunload', function() {
        if (unsendTimerId) { clearInterval(unsendTimerId); }
    });

    console.log('💍 Wedding wishes form ready (enhanced tracking)');
    console.log('📱 Device Info:', getDeviceTypeModel());
    console.log('🌐 Browser:', getBrowserInfo());
    console.log('🖥️ OS:', getOperatingSystem());

})();