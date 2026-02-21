document.addEventListener('DOMContentLoaded', () => {
    // Get logged-in student data
    const studentData = JSON.parse(localStorage.getItem('student'));
    
    if (!studentData) {
        console.error("No student data found. Redirecting...");
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const loadingState = document.getElementById('loading-state');
    const resultsInfo = document.getElementById('results-info');
    const resultsCount = document.getElementById('results-count');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // State
    let allBuses = [];
    let filteredBuses = [];
    let currentFilter = 'all';

    // Fetch all buses from Firebase
    db.collection('buses').onSnapshot(snapshot => {
        allBuses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Initial render
        filteredBuses = [...allBuses];
        renderResults(filteredBuses);
        
        // Remove loading state
        if (loadingState) {
            loadingState.remove();
        }
    }, error => {
        console.error("Error fetching buses:", error);
        searchResults.innerHTML = `
            <div class="glass-card rounded-3xl p-12 text-center border-2 border-red-200">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-600">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" x2="12" y1="8" y2="12"/>
                        <line x1="12" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-red-700 mb-2">Failed to Load Buses</h3>
                <p class="text-red-600 mb-4">Unable to connect to the database</p>
                <button onclick="location.reload()" class="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                    Retry
                </button>
            </div>
        `;
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        performSearch(query);
    });

    // Filter functionality
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active button
            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.classList.add('bg-gray-100', 'hover:bg-gray-200', 'text-gray-700');
            });
            e.target.classList.add('active');
            e.target.classList.remove('bg-gray-100', 'hover:bg-gray-200', 'text-gray-700');

            // Update filter
            currentFilter = e.target.dataset.filter;
            performSearch(searchInput.value.toLowerCase().trim());
        });
    });

    // Perform search with current filter
    function performSearch(query) {
        let results = [...allBuses];

        // Apply status filter
        if (currentFilter === 'on-time') {
            results = results.filter(bus => bus.status === 'On Time');
        } else if (currentFilter === 'delayed') {
            results = results.filter(bus => bus.status === 'Delayed');
        }

        // Apply search query
        if (query) {
            results = results.filter(bus => {
                const busNumber = (bus.number || '').toString().toLowerCase();
                const busRoute = (bus.route || '').toLowerCase();
                const busDriver = (bus.driver || '').toLowerCase();
                
                return busNumber.includes(query) || 
                       busRoute.includes(query) || 
                       busDriver.includes(query);
            });
        }

        filteredBuses = results;
        renderResults(filteredBuses);
    }

    // Render search results
    function renderResults(buses) {
        searchResults.innerHTML = '';

        // Update results count
        if (buses.length > 0) {
            resultsInfo.classList.remove('hidden');
            resultsCount.textContent = `Found ${buses.length} bus${buses.length !== 1 ? 'es' : ''}`;
        } else {
            resultsInfo.classList.add('hidden');
        }

        // Show empty state
        if (buses.length === 0) {
            searchResults.innerHTML = `
                <div class="glass-card rounded-3xl p-16 text-center border-2 border-dashed border-gray-300">
                    <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.3-4.3"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">No Buses Found</h3>
                    <p class="text-gray-500 text-lg">Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        // Render each bus card
        buses.forEach(bus => {
            const card = createBusCard(bus);
            searchResults.appendChild(card);
        });
    }

    // Create a bus card element
    function createBusCard(bus) {
        const card = document.createElement('div');
        card.className = 'bus-card glass-card rounded-3xl p-6 sm:p-8 border border-gray-200';

        // Status badge styling
        let statusClass = 'bg-gray-100 text-gray-700';
        let statusIcon = '●';
        
        if (bus.status === 'On Time') {
            statusClass = 'bg-green-100 text-green-700';
            statusIcon = '✓';
        } else if (bus.status === 'Delayed') {
            statusClass = 'bg-orange-100 text-orange-700';
            statusIcon = '⚠';
        } else if (bus.status === 'Breakdown') {
            statusClass = 'bg-red-100 text-red-700';
            statusIcon = '✕';
        }

        // Last update time
        const lastUpdate = bus.lastUpdate || 'Not available';

        card.innerHTML = `
            <div class="flex items-start justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl w-16 h-16 flex items-center justify-center font-bold text-xl shadow-lg">
                        ${bus.number || 'N/A'}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 text-xl mb-1">Bus ${bus.number}</h3>
                        <p class="text-sm text-gray-600 font-medium">${bus.route || 'No route assigned'}</p>
                    </div>
                </div>
                <span class="status-badge px-4 py-2 rounded-xl ${statusClass} flex items-center gap-2">
                    <span>${statusIcon}</span>
                    <span>${bus.status || 'Unknown'}</span>
                </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
                    <p class="text-xs text-purple-700 font-bold mb-2 uppercase tracking-wide">Driver</p>
                    <p class="text-sm text-gray-900 font-semibold">${bus.driver || 'Not assigned'}</p>
                </div>
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                    <p class="text-xs text-blue-700 font-bold mb-2 uppercase tracking-wide">Last Update</p>
                    <p class="text-sm text-gray-900 font-semibold">${lastUpdate}</p>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-100">
                <a href="track.html" class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-2xl font-bold text-sm text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Track Live
                </a>
                <button class="px-6 py-4 border-2 border-purple-200 hover:border-purple-600 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3" onclick="showBusDetails('${bus.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                    </svg>
                    View Details
                </button>
            </div>
        `;

        return card;
    }

    // Show bus details modal
    window.showBusDetails = function(busId) {
        const bus = allBuses.find(b => b.id === busId);
        if (!bus) return;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        let statusClass = 'bg-gray-100 text-gray-700';
        if (bus.status === 'On Time') statusClass = 'bg-green-100 text-green-700';
        else if (bus.status === 'Delayed') statusClass = 'bg-orange-100 text-orange-700';
        else if (bus.status === 'Breakdown') statusClass = 'bg-red-100 text-red-700';

        modal.innerHTML = `
            <div class="glass-card rounded-3xl max-w-md w-full p-8 animate-fadeIn">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">Bus Details</h3>
                    <button onclick="this.closest('.fixed').remove()" class="p-2 hover:bg-gray-100 rounded-xl transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" x2="6" y1="6" y2="18"/>
                            <line x1="6" x2="18" y1="6" y2="18"/>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl">
                        <span class="text-sm font-bold text-gray-700">Bus Number</span>
                        <span class="text-lg font-bold text-gray-900">${bus.number}</span>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <span class="text-sm font-bold text-gray-700">Route</span>
                        <span class="text-sm font-semibold text-gray-900">${bus.route || 'N/A'}</span>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <span class="text-sm font-bold text-gray-700">Driver</span>
                        <span class="text-sm font-semibold text-gray-900">${bus.driver || 'N/A'}</span>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <span class="text-sm font-bold text-gray-700">Status</span>
                        <span class="status-badge px-4 py-2 rounded-xl ${statusClass}">${bus.status || 'Unknown'}</span>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <span class="text-sm font-bold text-gray-700">Last Update</span>
                        <span class="text-sm font-semibold text-gray-900">${bus.lastUpdate || 'N/A'}</span>
                    </div>
                </div>
                
                <button onclick="this.closest('.fixed').remove()" class="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    };

    // Focus search input on load
    searchInput.focus();
});