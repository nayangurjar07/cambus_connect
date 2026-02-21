// Profile page logic - Enhanced with statistics and activity tracking

document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================
    // 1. AUTHENTICATION CHECK
    // ========================================
    const student = JSON.parse(localStorage.getItem('student'));

    if (!student) {
        console.error("❌ No student data found. Redirecting...");
        window.location.href = 'index.html';
        return;
    }
    
    console.log("✅ Student data loaded:", student.name);

    // ========================================
    // 2. DISPLAY PROFILE HEADER
    // ========================================
    const profileName = document.getElementById('profile-name');
    const profileId = document.getElementById('profile-id');
    const avatarContainer = document.querySelector('.w-32.h-32.rounded-full');
    const storage = window.storage;
    const db = window.db;
    
    if(profileName) profileName.textContent = student.name;
    if(profileId) profileId.textContent = student.collegeId;

    function getUserDocId() {
        return student.email || localStorage.getItem('userEmail') || student.collegeId;
    }

    function setAvatar(url) {
        if (!avatarContainer || !url) return;
        avatarContainer.innerHTML = `
            <img src="${url}" alt="Profile photo" class="w-full h-full rounded-full object-cover" loading="eager" decoding="async" />
        `;
    }

    function optimizeImage(file, maxSize) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(
                        blob => blob ? resolve(blob) : reject(new Error('Image optimization failed')),
                        'image/jpeg',
                        0.82
                    );
                };
                img.onerror = () => reject(new Error('Image processing failed'));
                img.src = reader.result;
            };
            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        });
    }

    if (student.profilePhotoUrl) {
        setAvatar(student.profilePhotoUrl);
    }

    // ========================================
    // 3. NEW FEATURE: UPDATE PASS STATUS BADGE
    // ========================================
    const passStatusBadge = document.getElementById('pass-status-badge');
    if(passStatusBadge) {
        const validityDate = new Date(student.passValidity || '2025-12-31');
        const today = new Date();
        
        if(validityDate > today) {
            passStatusBadge.textContent = 'Pass Valid';
            passStatusBadge.className = 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold';
        } else {
            passStatusBadge.textContent = 'Pass Expired';
            passStatusBadge.className = 'px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold';
        }
    }

    // ========================================
    // 4. DISPLAY PERSONAL INFORMATION
    // ========================================
    const profileDetails = document.getElementById('profile-details');
    
    if(profileDetails) {
        profileDetails.innerHTML = `
            <div class="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <p class="text-sm font-medium text-gray-600">Email</p>
                </div>
                <p class="font-semibold text-gray-800">${student.email || 'N/A'}</p>
            </div>
            
            <div class="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <p class="text-sm font-medium text-gray-600">Phone</p>
                </div>
                <p class="font-semibold text-gray-800">${student.phone || 'N/A'}</p>
            </div>
            
            <div class="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <p class="text-sm font-medium text-gray-600">Department</p>
                </div>
                <p class="font-semibold text-gray-800">${student.department || 'N/A'}</p>
            </div>
            
            <div class="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <p class="text-sm font-medium text-gray-600">Academic Year</p>
                </div>
                <p class="font-semibold text-gray-800">${student.year || 'N/A'}</p>
            </div>
            
            <div class="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p class="text-sm font-medium text-gray-600">Address</p>
                </div>
                <p class="font-semibold text-gray-800">${student.address || 'N/A'}</p>
            </div>
            
            <div class="p-4 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-xl border border-cyan-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <p class="text-sm font-medium text-gray-600">Pass Valid Until</p>
                </div>
                <p class="font-semibold text-green-600">${student.passValidity || '31 Dec 2025'}</p>
            </div>
        `;
        
        console.log("✅ Personal information displayed");
    }

    // ========================================
    // 5. NEW FEATURE: BUS INFORMATION SECTION
    // ========================================
    const busInfo = document.getElementById('bus-info');
    
    if(busInfo) {
        busInfo.innerHTML = `
            <div class="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                    <p class="text-sm font-medium text-gray-600">Assigned Route</p>
                </div>
                <p class="font-semibold text-gray-800">${student.busRoute || 'Not Assigned'}</p>
            </div>
            
            <div class="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 7.6 16 5 12 5s-6.7 2.6-8.5 6.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17.5" r="2.5"/><circle cx="17" cy="17.5" r="2.5"/></svg>
                    <p class="text-sm font-medium text-gray-600">Bus ID</p>
                </div>
                <p class="font-semibold text-gray-800">${student.assignedBusId || 'Not Assigned'}</p>
            </div>
            
            <div class="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <p class="text-sm font-medium text-gray-600">Pickup Time</p>
                </div>
                <p class="font-semibold text-gray-800">7:30 AM (Approx)</p>
            </div>
            
            <div class="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                <div class="flex items-center space-x-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p class="text-sm font-medium text-gray-600">Pickup Stop</p>
                </div>
                <p class="font-semibold text-gray-800">${student.pickupStop || 'Main Gate'}</p>
            </div>
        `;
        
        console.log("✅ Bus information displayed");
    }

    // ========================================
    // 6. NEW FEATURE: ACTIVITY STATISTICS
    // ========================================
    const statTrips = document.getElementById('stat-trips');
    const statAttendance = document.getElementById('stat-attendance');
    const statDaysLeft = document.getElementById('stat-days-left');
    const statQueries = document.getElementById('stat-queries');

    // Calculate days left on pass
    if(statDaysLeft) {
        const validityDate = new Date(student.passValidity || '2025-12-31');
        const today = new Date();
        const daysLeft = Math.ceil((validityDate - today) / (1000 * 60 * 60 * 24));
        
        if(daysLeft > 0) {
            statDaysLeft.textContent = daysLeft;
        } else {
            statDaysLeft.textContent = 'Expired';
            statDaysLeft.className = 'text-2xl font-bold text-red-600';
        }
    }

    // Fetch trips from localStorage or Firebase
    if(statTrips) {
        const trips = parseInt(localStorage.getItem(`tripCount_${student.collegeId}`)) || 0;
        statTrips.textContent = trips;
    }

    // Calculate attendance (example: trips / expected trips * 100)
    if(statAttendance) {
        const trips = parseInt(localStorage.getItem(`tripCount_${student.collegeId}`)) || 0;
        const expectedTrips = 40; // Example: 2 trips/day * 20 working days
        const attendance = trips > 0 ? Math.min(Math.round((trips / expectedTrips) * 100), 100) : 0;
        statAttendance.textContent = `${attendance}%`;
    }

    // Fetch support queries count from Firebase
    if(statQueries && db) {
        const studentEmail = student.email || student.collegeId;
        db.collection('support-queries')
          .where('studentEmail', '==', studentEmail)
          .get()
          .then(snapshot => {
              statQueries.textContent = snapshot.size;
              console.log(`✅ Found ${snapshot.size} support queries`);
          })
          .catch(error => {
              console.error("❌ Error fetching queries:", error);
              statQueries.textContent = '0';
          });
    }

    // ========================================
    // 7. NEW FEATURE: RECENT ACTIVITY TIMELINE
    // ========================================
    const activityTimeline = document.getElementById('activity-timeline');
    
    if(activityTimeline) {
        // Sample activity data (replace with real Firebase data)
        const activities = [
            {
                icon: '🚌',
                title: 'Boarded Bus',
                description: 'Checked in to Route A - Bus #001',
                time: '2 hours ago',
                color: 'blue'
            },
            {
                icon: '🎫',
                title: 'Bus Pass Renewed',
                description: 'Pass extended until 31 Dec 2025',
                time: '3 days ago',
                color: 'green'
            },
            {
                icon: '📝',
                title: 'Support Query',
                description: 'Submitted query about bus delay',
                time: '5 days ago',
                color: 'orange'
            },
            {
                icon: '✅',
                title: 'Profile Updated',
                description: 'Changed contact information',
                time: '1 week ago',
                color: 'purple'
            }
        ];

        const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
            green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' }
        };

        activityTimeline.innerHTML = activities.map((activity, index) => {
            const colors = colorClasses[activity.color] || colorClasses.blue;
            const isLast = index === activities.length - 1;
            
            return `
                <div class="flex items-start space-x-4">
                    <div class="relative">
                        <div class="w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center text-xl border-2 ${colors.border}">
                            ${activity.icon}
                        </div>
                        ${!isLast ? `<div class="absolute left-1/2 top-10 w-0.5 h-full bg-gray-200 -translate-x-1/2"></div>` : ''}
                    </div>
                    <div class="flex-1 pb-6">
                        <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                            <h4 class="font-semibold text-gray-800 mb-1">${activity.title}</h4>
                            <p class="text-sm text-gray-600 mb-2">${activity.description}</p>
                            <p class="text-xs ${colors.text} font-medium">${activity.time}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log("✅ Activity timeline rendered");
    }

    // ========================================
    // 8. NEW FEATURE: EDIT PROFILE BUTTON
    // ========================================
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if(editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            alert('Profile image upload is temporarily disabled.');
        });
    }

    // ========================================
    // 9. NEW FEATURE: SETTINGS BUTTON
    // ========================================
    const settingsBtn = document.getElementById('settings-btn');
    if(settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            console.log("Settings clicked");
            alert('Settings:\n\n• Notification preferences\n• Privacy settings\n• Language selection\n• Theme customization\n• Data management\n\nComing Soon!');
        });
    }

    // ========================================
    // 10. LOGOUT FUNCTIONALITY
    // ========================================
    const profileLogout = document.getElementById('profile-logout');
    if(profileLogout) {
        profileLogout.addEventListener('click', () => {
            if(confirm('Are you sure you want to logout?')) {
                // Clear local storage
                localStorage.removeItem('student');
                
                // Redirect to login
                window.location.href = 'index.html';
                
                console.log("✅ User logged out");
            }
        });
    }

    // ========================================
    // 11. INITIALIZATION COMPLETE
    // ========================================
    console.log("👤 Profile page initialized successfully with features:");
    console.log("   ✓ Animated Profile Avatar");
    console.log("   ✓ Status Badges");
    console.log("   ✓ Activity Statistics");
    console.log("   ✓ Bus Information Card");
    console.log("   ✓ Recent Activity Timeline");
    console.log("   ✓ Quick Links Section");
    console.log("   ✓ Edit Profile Button");
    console.log("   ✓ Settings Button");
    console.log("   ✓ Enhanced Personal Info Display");
});

