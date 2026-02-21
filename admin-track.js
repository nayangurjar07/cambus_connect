// Global variables
let map;
let markers = {};
let infoWindows = {};
let busesData = [];
let currentFilter = 'all';
let selectedBusId = null;
let trackerGoogleConnection = {
    connected: false,
    email: ''
};

function getSourceLabel(sourceType) {
    switch (sourceType) {
        case 'driver_phone': return 'Driver Phone';
        case 'conductor_phone': return 'Conductor Phone';
        case 'tracking_device': return 'Tracking Device';
        default: return 'Manual';
    }
}

function updateGoogleStatusField() {
    const statusEl = document.getElementById('modal-google-status');
    if (!statusEl) return;
    statusEl.value = trackerGoogleConnection.connected
        ? trackerGoogleConnection.email
        : 'Not connected';
}

// Initialize map
window.initMap = function() {
    console.log("Google Maps API loaded for Admin");
    
    // Default center (College location - change this to your college coordinates)
    const collegeLocation = { lat: 22.7196, lng: 75.8577 }; // Indore, India
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: collegeLocation,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeId: 'roadmap',
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    });
    
    // Add college marker
    new google.maps.Marker({
        position: collegeLocation,
        map: map,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#2563eb" stroke="white" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3" fill="white"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40)
        },
        title: "College Campus"
    });
    
    console.log("Admin map initialized");
    startBusTracking();
};

// Start tracking all buses
function startBusTracking() {
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
        
        // Update header stats (desktop and mobile)
        document.getElementById('header-active-count').textContent = activeBuses;
        document.getElementById('header-total-count').textContent = busesData.length;
        
        // Update mobile stats
        const mobileActiveCount = document.getElementById('header-active-count-mobile');
        const mobileTotalCount = document.getElementById('header-total-count-mobile');
        if (mobileActiveCount) mobileActiveCount.textContent = activeBuses;
        if (mobileTotalCount) mobileTotalCount.textContent = busesData.length;
        
        // Render filtered list
        renderBusList();
        
    }, error => {
        console.error("Error fetching buses:", error);
    });
}

// Update or create bus marker
function updateBusMarker(bus) {
    if (!bus.location || !bus.location.lat || !bus.location.lng) {
        // If no location, remove marker if exists
        if (markers[bus.id]) {
            markers[bus.id].setMap(null);
            delete markers[bus.id];
            if (infoWindows[bus.id]) {
                infoWindows[bus.id].close();
                delete infoWindows[bus.id];
            }
        }
        return;
    }
    
    const position = {
        lat: bus.location.lat,
        lng: bus.location.lng
    };
    
    if (markers[bus.id]) {
        // Update existing marker
        markers[bus.id].setPosition(position);
        
        // Update icon color based on status
        const icon = createBusIcon(bus.status);
        markers[bus.id].setIcon(icon);
        
        // Update info window
        const content = createInfoWindowContent(bus);
        infoWindows[bus.id].setContent(content);
        
    } else {
        // Create new marker
        const icon = createBusIcon(bus.status);
        
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: icon,
            title: `Bus ${bus.number}`,
            animation: google.maps.Animation.DROP
        });
        
        // Create info window
        const content = createInfoWindowContent(bus);
        const infoWindow = new google.maps.InfoWindow({
            content: content,
            maxWidth: 250
        });
        
        // Click listener
        marker.addListener('click', () => {
            Object.values(infoWindows).forEach(iw => iw.close());
            infoWindow.open(map, marker);
        });
        
        markers[bus.id] = marker;
        infoWindows[bus.id] = infoWindow;
    }
}

// Create custom bus icon
function createBusIcon(status) {
    const color = getStatusColor(status);
    
    return {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.5,
        anchor: new google.maps.Point(12, 22)
    };
}

// Create info window HTML
function createInfoWindowContent(bus) {
    const statusClass = getStatusClass(bus.status);
    const lastUpdate = bus.lastUpdate || 'Just now';
    const sourceType = bus.locationSource || bus.tracking?.sourceType;
    const sourceLabel = getSourceLabel(sourceType);
    const trackerId = bus.tracking?.trackerId || '-';
    const googleEmail = bus.tracking?.googleAccount?.connected ? bus.tracking.googleAccount.email : '-';
    
    return `
        <div class="bus-info-window">
            <h3>Bus ${bus.number}</h3>
            <p><strong>Route:</strong> ${bus.route}</p>
            <p><strong>Driver:</strong> ${bus.driver || 'N/A'}</p>
            <p><strong>Conductor:</strong> ${bus.conductor || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${bus.status}</span></p>
            <p><strong>Source:</strong> ${sourceLabel}</p>
            <p><strong>Tracker ID:</strong> ${trackerId}</p>
            <p><strong>Google:</strong> ${googleEmail}</p>
            <p><strong>Last Update:</strong> ${lastUpdate}</p>
            <button onclick="openUpdateModal('${bus.id}')">Update Location</button>
        </div>
    `;
}

// Render bus list in sidebar
function renderBusList() {
    const listContainer = document.getElementById('bus-list');
    listContainer.innerHTML = '';
    
    // Filter buses
    let filtered = busesData;
    
    if (currentFilter === 'on-time') {
        filtered = busesData.filter(b => b.status === 'On Time');
    } else if (currentFilter === 'delayed') {
        filtered = busesData.filter(b => b.status === 'Delayed');
    } else if (currentFilter === 'issues') {
        filtered = busesData.filter(b => b.status === 'Breakdown' || b.status === 'Delayed');
    }
    
    if (filtered.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No buses found</p>';
        return;
    }
    
    filtered.forEach(bus => {
        const statusColor = getStatusColor(bus.status);
        const hasLocation = bus.location && bus.location.lat && bus.location.lng;
        const sourceLabel = getSourceLabel(bus.locationSource || bus.tracking?.sourceType);
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-blue-300 hover:shadow-md transition cursor-pointer';
        
        card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm" style="background-color: ${statusColor}">
                        ${bus.number}
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800">Bus ${bus.number}</h4>
                        <p class="text-xs text-gray-500">${bus.route}</p>
                        <p class="text-xs text-gray-500">${sourceLabel}</p>
                    </div>
                </div>
                <span class="text-xs font-bold px-2 py-1 rounded-full" style="background-color: ${statusColor}20; color: ${statusColor}">
                    ${bus.status}
                </span>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <span>${bus.driver || 'No driver'}</span>
                ${hasLocation ? 
                    `<button onclick="event.stopPropagation(); focusBus('${bus.id}')" class="text-blue-600 hover:text-blue-700 font-semibold">Locate</button>` : 
                    '<span class="text-red-500">No GPS</span>'
                }
            </div>
        `;
        
        card.onclick = () => {
            if (hasLocation) {
                focusBus(bus.id);
            }
        };
        
        listContainer.appendChild(card);
    });
}

// Focus on specific bus
window.focusBus = function(busId) {
    const marker = markers[busId];
    const infoWindow = infoWindows[busId];
    
    if (marker && infoWindow) {
        Object.values(infoWindows).forEach(iw => iw.close());
        map.setCenter(marker.getPosition());
        map.setZoom(16);
        infoWindow.open(map, marker);
    } else {
        alert('This bus has no GPS location data.');
    }
};

// Get color based on status
function getStatusColor(status) {
    switch(status) {
        case 'On Time': return '#10b981';
        case 'Delayed': return '#f59e0b';
        case 'Breakdown': return '#ef4444';
        default: return '#6b7280';
    }
}

// Get CSS class for status
function getStatusClass(status) {
    switch(status) {
        case 'On Time': return 'status-ontime';
        case 'Delayed': return 'status-delayed';
        case 'Breakdown': return 'status-breakdown';
        default: return '';
    }
}

// Open update location modal
window.openUpdateModal = function(busId) {
    selectedBusId = busId;
    const bus = busesData.find(b => b.id === busId);
    
    if (!bus) return;
    
    document.getElementById('modal-bus-number').value = `Bus ${bus.number}`;
    
    // Pre-fill with current location if exists
    if (bus.location && bus.location.lat && bus.location.lng) {
        document.getElementById('modal-lat').value = bus.location.lat;
        document.getElementById('modal-lng').value = bus.location.lng;
    } else {
        document.getElementById('modal-lat').value = '';
        document.getElementById('modal-lng').value = '';
    }

    const sourceTypeEl = document.getElementById('modal-source-type');
    const trackerIdEl = document.getElementById('modal-tracker-id');
    if (sourceTypeEl) {
        sourceTypeEl.value = bus.locationSource || bus.tracking?.sourceType || 'driver_phone';
    }
    if (trackerIdEl) {
        trackerIdEl.value = bus.tracking?.trackerId || '';
    }

    trackerGoogleConnection = {
        connected: !!bus.tracking?.googleAccount?.connected,
        email: bus.tracking?.googleAccount?.email || ''
    };
    updateGoogleStatusField();
    
    const modal = document.getElementById('update-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

// Close modal
window.closeUpdateModal = function() {
    const modal = document.getElementById('update-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    selectedBusId = null;
    trackerGoogleConnection = {
        connected: false,
        email: ''
    };
    updateGoogleStatusField();
};

// Get current location (admin's location for demo)
window.getCurrentLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('modal-lat').value = position.coords.latitude;
                document.getElementById('modal-lng').value = position.coords.longitude;
            },
            (error) => {
                alert('Could not get your location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
};

// Update bus location in Firebase
window.updateBusLocation = function() {
    if (!selectedBusId) return;
    
    const lat = parseFloat(document.getElementById('modal-lat').value);
    const lng = parseFloat(document.getElementById('modal-lng').value);
    const sourceType = document.getElementById('modal-source-type')?.value || 'driver_phone';
    const trackerId = (document.getElementById('modal-tracker-id')?.value || '').trim();
    
    if (isNaN(lat) || isNaN(lng)) {
        alert('Please enter valid coordinates');
        return;
    }
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    db.collection('buses').doc(selectedBusId).update({
        location: {
            lat: lat,
            lng: lng
        },
        lastUpdate: timeString,
        locationSource: sourceType,
        tracking: {
            sourceType: sourceType,
            trackerId: trackerId,
            googleAccount: {
                connected: trackerGoogleConnection.connected,
                email: trackerGoogleConnection.email
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: localStorage.getItem('userEmail') || 'admin'
        }
    }).then(() => {
        alert('Bus location updated successfully!');
        closeUpdateModal();
    }).catch(error => {
        alert('Error updating location: ' + error.message);
    });
};

window.connectTrackingGoogle = async function() {
    const auth = firebase.auth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
        alert('Please login as admin first.');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        if (currentUser.providerData.some(p => p.providerId === 'google.com')) {
            const linked = currentUser.providerData.find(p => p.providerId === 'google.com');
            trackerGoogleConnection = {
                connected: true,
                email: linked?.email || currentUser.email || ''
            };
            updateGoogleStatusField();
            alert('Google account already connected.');
            return;
        }

        const result = await currentUser.linkWithPopup(provider);
        trackerGoogleConnection = {
            connected: true,
            email: result.user?.email || ''
        };
        updateGoogleStatusField();
        alert('Google account connected successfully.');
    } catch (error) {
        console.error('Google connect error:', error);
        alert('Could not connect Google account: ' + (error.message || 'Unknown error'));
    }
};

// Sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const connectGoogleBtn = document.getElementById('connect-google-btn');
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
    });

    if (connectGoogleBtn) {
        connectGoogleBtn.addEventListener('click', () => {
            connectTrackingGoogle();
        });
    }
    
    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white');
                b.classList.add('bg-gray-100', 'text-gray-700');
            });
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('bg-gray-100', 'text-gray-700');
            
            // Update filter
            currentFilter = btn.dataset.filter;
            renderBusList();
        });
    });
});
