// Track page logic - Enhanced live bus tracking with selectable bus support

// ========================================
// 1. GLOBAL VARIABLES
// ========================================
let map;
let markers = {};
let infoWindows = {};
let studentData;
let busesData = [];
let currentMapType = 'roadmap';
let selectedTrackBusId = null;
let isTrackSelectorBound = false;

function getTrackedBusId() {
    return selectedTrackBusId || studentData?.assignedBusId || null;
}

function getSourceLabel(sourceType) {
    switch(sourceType) {
        case 'driver_phone': return 'Driver Phone';
        case 'conductor_phone': return 'Conductor Phone';
        case 'tracking_device': return 'Tracking Device';
        default: return 'Live Tracking';
    }
}

// ========================================
// 2. INITIALIZE MAP
// ========================================
window.initMap = function() {
    const defaultCenter = { lat: 22.7196, lng: 75.8577 };

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'simplified' }]
            }
        ]
    });

    startBusTracking();
    setupMapControls();
};

// ========================================
// 3. START BUS TRACKING
// ========================================
function startBusTracking() {
    studentData = JSON.parse(localStorage.getItem('student'));

    if (!studentData) {
        window.location.href = 'index.html';
        return;
    }

    const userKey = studentData.email || localStorage.getItem('userEmail') || 'student';
    const savedTrackBusId = localStorage.getItem(`trackBusOverride:${userKey}`);
    selectedTrackBusId = savedTrackBusId || studentData.assignedBusId || null;

    setupTrackBusSelector();

    db.collection('buses').onSnapshot(snapshot => {
        busesData = [];
        let activeBuses = 0;

        snapshot.forEach(doc => {
            const bus = { id: doc.id, ...doc.data() };
            busesData.push(bus);

            if (bus.status === 'On Time' || bus.status === 'Delayed') {
                activeBuses++;
            }

            updateBusMarker(bus);
        });

        const activeBusesEl = document.getElementById('active-buses-count');
        const lastUpdateEl = document.getElementById('last-update-time');

        if (activeBusesEl) activeBusesEl.textContent = activeBuses;
        if (lastUpdateEl) {
            lastUpdateEl.textContent = new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        renderTrackBusOptions();
        updateTrackedBusDisplay();
        calculateETA();
        renderBusList([...busesData]);
    }, () => {
        const busListEl = document.getElementById('bus-list');
        if (busListEl) {
            busListEl.innerHTML = `
                <div class="glass-effect rounded-xl p-8 text-center border-2 border-red-200">
                    <p class="text-red-700 font-semibold mb-1">Error loading buses</p>
                    <p class="text-red-600 text-sm">Please refresh the page</p>
                </div>
            `;
        }
    });
}

// ========================================
// 4. UPDATE/CREATE BUS MARKERS
// ========================================
function updateBusMarker(bus) {
    if (!bus.location || !bus.location.lat || !bus.location.lng) {
        return;
    }

    const position = {
        lat: bus.location.lat,
        lng: bus.location.lng
    };

    if (markers[bus.id]) {
        markers[bus.id].setPosition(position);
        const content = createInfoWindowContent(bus);
        infoWindows[bus.id].setContent(content);
    } else {
        const isTrackedBus = getTrackedBusId() === bus.id;

        const icon = {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: isTrackedBus ? '#4f46e5' : getStatusColor(bus.status),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: isTrackedBus ? 2 : 1.5,
            anchor: new google.maps.Point(12, 22)
        };

        const marker = new google.maps.Marker({
            position,
            map,
            icon,
            title: `Bus ${bus.number}`,
            animation: google.maps.Animation.DROP,
            zIndex: isTrackedBus ? 1000 : 1
        });

        const content = createInfoWindowContent(bus);
        const infoWindow = new google.maps.InfoWindow({
            content,
            maxWidth: 300
        });

        marker.addListener('click', () => {
            Object.values(infoWindows).forEach(iw => iw.close());
            infoWindow.open(map, marker);
        });

        markers[bus.id] = marker;
        infoWindows[bus.id] = infoWindow;

        if (isTrackedBus) {
            setTimeout(() => {
                infoWindow.open(map, marker);
                map.setCenter(position);
                map.setZoom(15);
            }, 500);
        }
    }
}

// ========================================
// 5. CREATE INFO WINDOW CONTENT
// ========================================
function createInfoWindowContent(bus) {
    const statusClass = getStatusClass(bus.status);
    const lastUpdate = bus.lastUpdate || 'Just now';
    const isTrackedBus = getTrackedBusId() === bus.id;
    const sourceLabel = getSourceLabel(bus.locationSource || bus.tracking?.sourceType);

    return `
        <div class="bus-info-window">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <h3 style="margin: 0;">Bus ${bus.number}</h3>
                ${isTrackedBus ? '<span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">TRACKING</span>' : ''}
            </div>
            <p><strong>Route:</strong> ${bus.route}</p>
            <p><strong>Driver:</strong> ${bus.driver || 'N/A'}</p>
            <p><strong>Conductor:</strong> ${bus.conductor || 'N/A'}</p>
            <p><strong>Contact:</strong> ${bus.phone || 'N/A'}</p>
            <p><strong>Source:</strong> ${sourceLabel}</p>
            <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${bus.status}</span></p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;"><strong>Updated:</strong> ${lastUpdate}</p>
        </div>
    `;
}

// ========================================
// 6. TRACKED BUS ALERT
// ========================================
function showMyBusAlert(bus) {
    const alertEl = document.getElementById('my-bus-alert');
    const alertTextEl = document.getElementById('my-bus-alert-text');

    if (!alertEl || !alertTextEl) return;

    let message = '';

    if (bus.status === 'On Time') {
        message = `Tracking Bus #${bus.number}. It is running on schedule.`;
    } else if (bus.status === 'Delayed') {
        message = `Tracking Bus #${bus.number}. It is delayed. Please check the live map.`;
    } else if (bus.status === 'Breakdown') {
        message = `Tracking Bus #${bus.number} is experiencing issues.`;
    } else {
        message = `Tracking Bus #${bus.number} status: ${bus.status}`;
    }

    alertTextEl.textContent = message;
    alertEl.classList.remove('hidden');
}

// ========================================
// 7. CALCULATE ETA
// ========================================
function calculateETA() {
    const trackedBusId = getTrackedBusId();
    const etaEl = document.getElementById('eta-display');

    if (!etaEl) return;
    if (!trackedBusId) {
        etaEl.textContent = 'N/A';
        return;
    }

    const trackedBus = busesData.find(b => b.id === trackedBusId);
    if (trackedBus && trackedBus.location) {
        const randomETA = Math.floor(Math.random() * 15) + 3;
        etaEl.textContent = `${randomETA}m`;
    } else {
        etaEl.textContent = 'N/A';
    }
}

// ========================================
// 8. RENDER BUS LIST
// ========================================
function renderBusList(buses) {
    const listContainer = document.getElementById('bus-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (buses.length === 0) {
        listContainer.innerHTML = `
            <div class="glass-effect rounded-xl p-12 text-center">
                <p class="text-gray-600 font-semibold mb-1">No buses available</p>
                <p class="text-gray-500 text-sm">Buses will appear here when they're active</p>
            </div>
        `;
        return;
    }

    const trackedBusId = getTrackedBusId();

    buses.sort((a, b) => {
        if (a.id === trackedBusId) return -1;
        if (b.id === trackedBusId) return 1;
        return a.number.localeCompare(b.number);
    });

    buses.forEach(bus => {
        const isTrackedBus = trackedBusId === bus.id;
        const statusColor = getStatusColor(bus.status);
        const hasLocation = bus.location && bus.location.lat && bus.location.lng;
        const sourceLabel = getSourceLabel(bus.locationSource || bus.tracking?.sourceType);

        const card = document.createElement('div');
        card.className = `glass-effect rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-l-4 ${
            isTrackedBus ? 'border-indigo-600' : 'border-gray-200'
        } card-hover`;

        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4 flex-1">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white shadow-lg" style="background: linear-gradient(135deg, ${statusColor}, ${adjustColor(statusColor, -20)})">
                        <span class="text-lg">${bus.number}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <h4 class="font-bold text-gray-800 text-lg">Bus ${bus.number}</h4>
                            ${isTrackedBus ? '<span class="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full font-bold">TRACKING</span>' : ''}
                        </div>
                        <p class="text-sm text-gray-600 mb-1">${bus.route}</p>
                        <p class="text-xs text-gray-500">Driver: ${bus.driver || 'N/A'}</p>
                        <p class="text-xs text-gray-500 mt-1">Source: ${sourceLabel}</p>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end space-y-2">
                    <span class="inline-block px-4 py-2 rounded-xl text-xs font-bold shadow-sm" style="background-color: ${statusColor}20; color: ${statusColor}">
                        ${bus.status}
                    </span>
                    ${hasLocation ? `
                        <button onclick="focusBus('${bus.id}')" class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 text-sm font-semibold flex items-center space-x-2 shadow-md transition-all">
                            <span>Locate</span>
                        </button>
                    ` : '<p class="text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">No GPS data</p>'}
                </div>
            </div>
        `;

        listContainer.appendChild(card);
    });
}

// ========================================
// 9. BUS FOCUS ACTIONS
// ========================================
window.focusBus = function(busId) {
    const marker = markers[busId];
    const infoWindow = infoWindows[busId];

    if (marker && infoWindow) {
        Object.values(infoWindows).forEach(iw => iw.close());
        map.setCenter(marker.getPosition());
        map.setZoom(16);
        infoWindow.open(map, marker);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.focusMyBus = function() {
    const trackedBusId = getTrackedBusId();
    if (trackedBusId) {
        focusBus(trackedBusId);
    }
};

// ========================================
// 10. MAP CONTROLS + TRACK SELECTOR
// ========================================
function setupMapControls() {
    const centerBtn = document.getElementById('center-map-btn');
    if (centerBtn) {
        centerBtn.addEventListener('click', () => {
            const trackedBusId = getTrackedBusId();
            if (trackedBusId && markers[trackedBusId]) {
                const marker = markers[trackedBusId];
                map.setCenter(marker.getPosition());
                map.setZoom(15);
                infoWindows[trackedBusId].open(map, marker);
            } else if (Object.keys(markers).length > 0) {
                const bounds = new google.maps.LatLngBounds();
                Object.values(markers).forEach(marker => bounds.extend(marker.getPosition()));
                map.fitBounds(bounds);
            }
        });
    }

    const viewModeBtn = document.getElementById('view-mode-btn');
    if (viewModeBtn) {
        viewModeBtn.addEventListener('click', () => {
            if (currentMapType === 'roadmap') {
                map.setMapTypeId('satellite');
                currentMapType = 'satellite';
                viewModeBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>Roadmap</span>
                `;
            } else {
                map.setMapTypeId('roadmap');
                currentMapType = 'roadmap';
                viewModeBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    <span>Satellite</span>
                `;
            }
        });
    }
}

function renderTrackBusOptions() {
    const selectEl = document.getElementById('track-bus-select');
    if (!selectEl) return;

    const current = getTrackedBusId();
    const sorted = [...busesData].sort((a, b) => a.number.localeCompare(b.number));

    selectEl.innerHTML = '';

    if (sorted.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No buses available';
        selectEl.appendChild(opt);
        return;
    }

    sorted.forEach(bus => {
        const option = document.createElement('option');
        option.value = bus.id;
        option.textContent = `Bus ${bus.number} - ${bus.route}`;
        selectEl.appendChild(option);
    });

    if (current && sorted.some(b => b.id === current)) {
        selectEl.value = current;
    } else {
        selectedTrackBusId = sorted[0].id;
        selectEl.value = sorted[0].id;
    }
}

function updateTrackedBusDisplay() {
    const trackedBusId = getTrackedBusId();
    if (!trackedBusId) return;

    const trackedBus = busesData.find(b => b.id === trackedBusId);
    if (!trackedBus) return;

    const myBusNum = document.getElementById('my-bus-number');
    const myBusStatus = document.getElementById('my-bus-status');

    if (myBusNum) myBusNum.textContent = `#${trackedBus.number}`;
    if (myBusStatus) {
        myBusStatus.textContent = trackedBus.status;
        myBusStatus.className = `text-xs font-medium mt-2 ${getStatusTextColor(trackedBus.status)}`;
    }

    showMyBusAlert(trackedBus);
}

function setupTrackBusSelector() {
    if (isTrackSelectorBound) return;

    const selectEl = document.getElementById('track-bus-select');
    const resetBtn = document.getElementById('track-assigned-btn');
    if (!selectEl || !resetBtn) return;

    selectEl.addEventListener('change', () => {
        selectedTrackBusId = selectEl.value || studentData.assignedBusId || null;
        const userKey = studentData.email || localStorage.getItem('userEmail') || 'student';
        localStorage.setItem(`trackBusOverride:${userKey}`, selectedTrackBusId || '');

        updateTrackedBusDisplay();
        calculateETA();
        focusMyBus();
        renderBusList([...busesData]);
    });

    resetBtn.addEventListener('click', () => {
        selectedTrackBusId = studentData.assignedBusId || null;
        const userKey = studentData.email || localStorage.getItem('userEmail') || 'student';
        localStorage.removeItem(`trackBusOverride:${userKey}`);

        renderTrackBusOptions();
        updateTrackedBusDisplay();
        calculateETA();
        focusMyBus();
        renderBusList([...busesData]);
    });

    isTrackSelectorBound = true;
}

// ========================================
// 11. UTILITY FUNCTIONS
// ========================================
function getStatusColor(status) {
    switch(status) {
        case 'On Time': return '#10b981';
        case 'Delayed': return '#f59e0b';
        case 'Breakdown': return '#ef4444';
        default: return '#6b7280';
    }
}

function getStatusTextColor(status) {
    switch(status) {
        case 'On Time': return 'text-green-600';
        case 'Delayed': return 'text-orange-600';
        case 'Breakdown': return 'text-red-600';
        default: return 'text-gray-600';
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'On Time': return 'status-ontime';
        case 'Delayed': return 'status-delayed';
        case 'Breakdown': return 'status-breakdown';
        default: return '';
    }
}

function adjustColor(color, amount) {
    const clamp = (num) => Math.min(Math.max(num, 0), 255);
    const num = parseInt(color.replace('#', ''), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
