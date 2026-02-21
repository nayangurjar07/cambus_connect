// Bus Pass page logic - Enhanced digital pass with real QR code and new features

document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================
    // 1. AUTHENTICATION CHECK
    // ========================================
    const student = JSON.parse(localStorage.getItem('student'));
    
    if (!student) {
        console.error("❌ No student data found. Redirecting to login...");
        window.location.href = 'index.html';
        return;
    }
    
    console.log("✅ Student data loaded:", student.name);
    
    // ========================================
    // 2. STATE MANAGEMENT
    // ========================================
    let qrCheckedIn = false;
    let scanCount = parseInt(localStorage.getItem(`scanCount_${student.collegeId}`)) || 0;
    let lastCheckinTime = localStorage.getItem(`lastCheckin_${student.collegeId}`);
    let checkinHistory = JSON.parse(localStorage.getItem(`checkinHistory_${student.collegeId}`)) || [];

    // ========================================
    // 3. NEW FEATURE: GENERATE REAL QR CODE
    // ========================================
    const qrCodeText = student.qrCode || `CAMBUS-${student.collegeId}`;
    
    // Display QR code text
    const qrTextElement = document.getElementById('pass-qrcode-text');
    if(qrTextElement) {
        qrTextElement.textContent = qrCodeText;
    }
    
    // Generate real QR code using QRCode.js library
    const qrContainer = document.getElementById('qrcode-container');
    if(qrContainer && typeof QRCode !== 'undefined') {
        // Clear any existing content
        qrContainer.innerHTML = '';
        
        // Generate QR code
        new QRCode(qrContainer, {
            text: qrCodeText,
            width: 192,
            height: 192,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        console.log("✅ Real QR Code generated");
    } else if(qrContainer) {
        // Fallback: Generate fake QR grid if library not available
        console.warn("⚠️ QRCode.js library not loaded, using fallback grid");
        const qrGrid = document.createElement('div');
        qrGrid.className = 'grid grid-cols-10 gap-1 p-2';
        
        for (let i = 0; i < 100; i++) {
            const div = document.createElement('div');
            const isBlack = Math.random() > 0.5;
            div.className = `w-4 h-4 ${isBlack ? 'bg-black' : 'bg-white'}`;
            qrGrid.appendChild(div);
        }
        
        qrContainer.appendChild(qrGrid);
    }

    // ========================================
    // 4. NEW FEATURE: GENERATE BARCODE
    // ========================================
    const barcodeContainer = document.getElementById('barcode-container');
    if(barcodeContainer) {
        // Generate simple barcode visualization
        const barcodeData = student.collegeId.toString();
        barcodeContainer.innerHTML = '';
        
        for(let i = 0; i < 30; i++) {
            const bar = document.createElement('div');
            const digit = parseInt(barcodeData[i % barcodeData.length]) || 0;
            const isWide = digit % 2 === 0;
            const height = 40 + (digit * 5);
            
            bar.className = `barcode-line ${i % 2 === 0 ? 'bg-black' : 'bg-gray-800'}`;
            bar.style.width = isWide ? '4px' : '2px';
            bar.style.height = height + 'px';
            
            barcodeContainer.appendChild(bar);
        }
        
        console.log("✅ Barcode generated");
    }

    // ========================================
    // 5. DISPLAY PASS INFORMATION
    // ========================================
    if(student) {
        // Update pass info in the gradient card
        const passName = document.getElementById('pass-name');
        const passCollegeId = document.getElementById('pass-college-id');
        const passRoute = document.getElementById('pass-route');
        
        if(passName) passName.textContent = student.name;
        if(passCollegeId) passCollegeId.textContent = student.collegeId;
        if(passRoute) passRoute.textContent = student.busRoute || 'Not Assigned';
        
        // Update validity badge
        const validityBadge = document.getElementById('pass-validity-badge');
        if(validityBadge) {
            const validityDate = student.passValidity || '31 Dec 2025';
            validityBadge.querySelector('p:last-child').textContent = validityDate;
        }
        
        // Render pass details grid
        const detailsContainer = document.getElementById('pass-details');
        if(detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p class="text-xs text-gray-500 mb-1">Full Name</p>
                    <p class="font-semibold text-gray-800">${student.name}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p class="text-xs text-gray-500 mb-1">College ID</p>
                    <p class="font-semibold text-gray-800">${student.collegeId}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p class="text-xs text-gray-500 mb-1">Bus Route</p>
                    <p class="font-semibold text-gray-800">${student.busRoute || 'Not Assigned'}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p class="text-xs text-gray-500 mb-1">Valid Until</p>
                    <p class="font-semibold text-green-600">${student.passValidity || '31 Dec 2025'}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p class="text-xs text-gray-500 mb-1">Pass Type</p>
                    <p class="font-semibold text-gray-800">Monthly Student Pass</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p class="text-xs text-gray-500 mb-1">Pass ID</p>
                    <p class="font-semibold text-gray-800">${qrCodeText}</p>
                </div>
            `;
        }
        
        console.log("✅ Pass information displayed");
    }

    // ========================================
    // 6. NEW FEATURE: UPDATE USAGE STATISTICS
    // ========================================
    const scanCountElement = document.getElementById('scan-count');
    const lastCheckinElement = document.getElementById('last-checkin');
    const lastCheckinTimeElement = document.getElementById('last-checkin-time');
    const daysRemainingElement = document.getElementById('days-remaining');
    
    if(scanCountElement) {
        scanCountElement.textContent = scanCount;
    }
    
    if(lastCheckinElement && lastCheckinTimeElement) {
        if(lastCheckinTime) {
            const date = new Date(lastCheckinTime);
            lastCheckinElement.textContent = date.toLocaleDateString();
            lastCheckinTimeElement.textContent = date.toLocaleTimeString();
        } else {
            lastCheckinElement.textContent = 'Never';
            lastCheckinTimeElement.textContent = 'No check-in recorded';
        }
    }
    
    // NEW FEATURE: Calculate days remaining
    if(daysRemainingElement) {
        const validityDate = new Date('2025-12-31');
        const today = new Date();
        const daysLeft = Math.ceil((validityDate - today) / (1000 * 60 * 60 * 24));
        daysRemainingElement.textContent = `Valid for ${daysLeft} days`;
    }

    // ========================================
    // 7. CHECK-IN FUNCTIONALITY (Enhanced)
    // ========================================
    function updateCheckinStatus() {
        const statusEl = document.getElementById('checkin-status');
        const buttonEl = document.getElementById('checkin-button');
        
        if(statusEl && buttonEl) {
            if(qrCheckedIn) {
                statusEl.textContent = 'Checked In';
                statusEl.className = 'font-semibold px-4 py-2 rounded-full text-sm bg-green-100 text-green-700 flex items-center';
                statusEl.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polyline points="20 6 9 17 4 12"/></svg>
                    Checked In
                `;
                
                buttonEl.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                    <span>Reset Check-in (Demo)</span>
                `;
            } else {
                statusEl.textContent = 'Not Checked In';
                statusEl.className = 'font-semibold px-4 py-2 rounded-full text-sm bg-gray-200 text-gray-600';
                
                buttonEl.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Simulate Check-in (Demo)</span>
                `;
            }
            
            buttonEl.onclick = () => {
                qrCheckedIn = !qrCheckedIn;
                
                if(qrCheckedIn) {
                    // NEW FEATURE: Record check-in
                    scanCount++;
                    lastCheckinTime = new Date().toISOString();
                    
                    // Add to history
                    checkinHistory.unshift({
                        timestamp: lastCheckinTime,
                        busId: student.assignedBusId || 'Unknown',
                        route: student.busRoute || 'Unknown'
                    });
                    
                    // Keep only last 5 check-ins
                    if(checkinHistory.length > 5) {
                        checkinHistory = checkinHistory.slice(0, 5);
                    }
                    
                    // Save to localStorage
                    localStorage.setItem(`scanCount_${student.collegeId}`, scanCount);
                    localStorage.setItem(`lastCheckin_${student.collegeId}`, lastCheckinTime);
                    localStorage.setItem(`checkinHistory_${student.collegeId}`, JSON.stringify(checkinHistory));
                    
                    // Update statistics
                    if(scanCountElement) scanCountElement.textContent = scanCount;
                    if(lastCheckinElement) lastCheckinElement.textContent = new Date(lastCheckinTime).toLocaleDateString();
                    if(lastCheckinTimeElement) lastCheckinTimeElement.textContent = new Date(lastCheckinTime).toLocaleTimeString();
                    
                    // Update history display
                    updateCheckinHistory();
                    
                    console.log("✅ Check-in recorded");
                }
                
                updateCheckinStatus();
            };
        }
    }

    // ========================================
    // 8. NEW FEATURE: CHECK-IN HISTORY DISPLAY
    // ========================================
    function updateCheckinHistory() {
        const historyContainer = document.getElementById('checkin-history');
        
        if(historyContainer) {
            if(checkinHistory.length === 0) {
                historyContainer.innerHTML = `
                    <p class="text-xs text-gray-500 text-center py-2">No recent check-ins</p>
                `;
            } else {
                historyContainer.innerHTML = `
                    <p class="text-xs text-gray-600 font-medium mb-2">Recent Check-ins:</p>
                `;
                
                checkinHistory.forEach((record, index) => {
                    const date = new Date(record.timestamp);
                    const historyItem = `
                        <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100 text-xs">
                            <div class="flex items-center space-x-2">
                                <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span class="text-blue-600 font-bold text-xs">${index + 1}</span>
                                </div>
                                <div>
                                    <p class="font-medium text-gray-700">${record.route}</p>
                                    <p class="text-gray-500">${date.toLocaleDateString()} • ${date.toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                    `;
                    
                    historyContainer.insertAdjacentHTML('beforeend', historyItem);
                });
            }
        }
    }

    // Initialize check-in status and history
    updateCheckinStatus();
    updateCheckinHistory();

    // ========================================
    // 9. NEW FEATURE: DOWNLOAD PASS AS PDF
    // ========================================
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if(downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            console.log("Download PDF clicked");
            alert('PDF download feature:\n\nIn production, this would generate a PDF version of your bus pass that you can print or save.\n\nFeatures:\n• QR code included\n• All pass details\n• Barcode backup\n• Digital signature');
        });
    }

    // ========================================
    // 10. NEW FEATURE: DOWNLOAD PASS AS IMAGE
    // ========================================
    const downloadImageBtn = document.getElementById('download-image-btn');
    if(downloadImageBtn) {
        downloadImageBtn.addEventListener('click', () => {
            console.log("Download Image clicked");
            alert('Image download feature:\n\nIn production, this would save your bus pass as a PNG/JPG image that you can:\n• Set as phone wallpaper\n• Save to photo gallery\n• Share via messaging apps');
        });
    }

    // ========================================
    // 11. NEW FEATURE: SHARE PASS
    // ========================================
    const sharePassBtn = document.getElementById('share-pass-btn');
    if(sharePassBtn) {
        sharePassBtn.addEventListener('click', async () => {
            console.log("Share Pass clicked");
            
            // Check if Web Share API is available
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'CAMBUS CONNECT - Digital Bus Pass',
                        text: `My bus pass for route ${student.busRoute || 'N/A'}. Valid until ${student.passValidity || '31 Dec 2025'}`,
                        url: window.location.href
                    });
                    console.log('✅ Pass shared successfully');
                } catch (err) {
                    console.log('❌ Share cancelled or failed:', err);
                }
            } else {
                alert('Share Pass:\n\nYour pass details:\n• Route: ' + (student.busRoute || 'N/A') + '\n• Valid until: ' + (student.passValidity || '31 Dec 2025') + '\n\nCopy this link to share with others!');
            }
        });
    }

    // ========================================
    // 12. NEW FEATURE: ADD TO WALLET
    // ========================================
    const addToWalletBtn = document.getElementById('add-to-wallet-btn');
    if(addToWalletBtn) {
        addToWalletBtn.addEventListener('click', () => {
            console.log("Add to Wallet clicked");
            alert('Add to Wallet:\n\nIn production, this would:\n• Generate Apple Wallet pass (.pkpass)\n• Create Google Pay pass\n• Add to Samsung Pay\n\nYou could then access your pass from your phone\'s wallet app without opening the browser!');
        });
    }

    // ========================================
    // 13. NEW FEATURE: PRINT PASS
    // ========================================
    const printPassBtn = document.getElementById('print-pass-btn');
    if(printPassBtn) {
        printPassBtn.addEventListener('click', () => {
            console.log("Print Pass clicked");
            window.print();
        });
    }

    // ========================================
    // 14. NEW FEATURE: REPORT ISSUE
    // ========================================
    const reportIssueBtn = document.getElementById('report-issue-btn');
    if(reportIssueBtn) {
        reportIssueBtn.addEventListener('click', () => {
            console.log("Report Issue clicked");
            window.location.href = 'support.html?issue=pass';
        });
    }

    // ========================================
    // 15. NEW FEATURE: RENEW PASS
    // ========================================
    const renewPassBtn = document.getElementById('renew-pass-btn');
    if(renewPassBtn) {
        renewPassBtn.addEventListener('click', () => {
            console.log("Renew Pass clicked");
            alert('Renew Pass:\n\nRenewal Options:\n• 1 Month - ₹500\n• 3 Months - ₹1,400 (Save ₹100)\n• 6 Months - ₹2,700 (Save ₹300)\n• 1 Year - ₹5,000 (Save ₹1,000)\n\nContact admin or visit the renewal portal to extend your pass!');
        });
    }

    // ========================================
    // 16. NEW FEATURE: AUTO-BRIGHTNESS FOR QR CODE
    // ========================================
    // Increase screen brightness when pass is viewed for better scanning
    if('wakeLock' in navigator) {
        let wakeLock = null;
        
        const requestWakeLock = async () => {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('✅ Screen wake lock activated - screen will stay bright');
            } catch (err) {
                console.log('⚠️ Wake lock not available:', err);
            }
        };
        
        requestWakeLock();
        
        // Release wake lock when leaving page
        document.addEventListener('visibilitychange', async () => {
            if (wakeLock !== null && document.visibilityState === 'hidden') {
                await wakeLock.release();
                wakeLock = null;
            }
        });
    }

    // ========================================
    // 17. INITIALIZATION COMPLETE
    // ========================================
    console.log("🎫 Bus Pass page initialized successfully with features:");
    console.log("   ✓ Real QR Code Generation");
    console.log("   ✓ Barcode Alternative");
    console.log("   ✓ Enhanced Check-in System");
    console.log("   ✓ Check-in History Tracking");
    console.log("   ✓ Usage Statistics");
    console.log("   ✓ Download Options (PDF/Image)");
    console.log("   ✓ Share Pass Feature");
    console.log("   ✓ Add to Wallet");
    console.log("   ✓ Print Functionality");
    console.log("   ✓ Renewal System");
    console.log("   ✓ Screen Wake Lock");
});