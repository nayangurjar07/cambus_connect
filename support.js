// Support page logic - Enhanced ticket system with new features

document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================
    // 1. AUTHENTICATION CHECK
    // ========================================
    const studentData = JSON.parse(localStorage.getItem('student'));
    
    if (!studentData) {
        console.error("❌ No student data found. Redirecting...");
        window.location.href = 'index.html';
        return;
    }
    
    console.log("✅ Student data loaded:", studentData.name);

    // ========================================
    // 2. DOM ELEMENTS
    // ========================================
    const supportForm = document.getElementById('support-form');
    const submitBtn = document.getElementById('submit-btn');
    const queriesList = document.getElementById('queries-list');
    const queryCount = document.getElementById('query-count');
    const filterStatus = document.getElementById('filter-status');
    
    // NEW FEATURE: Statistics Elements
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statResolved = document.getElementById('stat-resolved');
    const statResponse = document.getElementById('stat-response');

    // ========================================
    // 3. STATE MANAGEMENT
    // ========================================
    let allQueries = [];
    let currentFilter = 'all';

    // ========================================
    // 4. NEW FEATURE: COMMON FAQs
    // ========================================
    const commonIssues = [
        {
            question: "Bus is running late",
            answer: "Check the live tracking page for real-time updates. You'll receive notifications about delays.",
            icon: "🕐",
            category: "Bus Delay"
        },
        {
            question: "Bus didn't arrive",
            answer: "Contact your bus coordinator immediately. Check if there's a route change notification in the alerts section.",
            icon: "🚫",
            category: "Bus Not Arrived"
        },
        {
            question: "QR code not scanning",
            answer: "Ensure your screen brightness is at maximum. Try refreshing your bus pass page or download the pass as an image.",
            icon: "📱",
            category: "Pass Issue"
        },
        {
            question: "Want to change route",
            answer: "Submit a formal request through this support form with category 'Route Issue'. Include your preferred route and reason.",
            icon: "🗺️",
            category: "Route Issue"
        }
    ];

    // Render FAQs
    const faqSection = document.getElementById('faq-section');
    if(faqSection) {
        faqSection.innerHTML = '';
        commonIssues.forEach((faq, index) => {
            const faqCard = `
                <div class="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-indigo-300 transition-all cursor-pointer" onclick="selectFAQ('${faq.category}', '${faq.question}')">
                    <div class="flex items-start space-x-3">
                        <span class="text-2xl">${faq.icon}</span>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 mb-1">${faq.question}</h4>
                            <p class="text-xs text-gray-600">${faq.answer}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600 flex-shrink-0">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </div>
                </div>
            `;
            faqSection.insertAdjacentHTML('beforeend', faqCard);
        });
        
        console.log("✅ FAQs rendered");
    }

    // NEW FEATURE: Select FAQ to auto-fill form
    window.selectFAQ = function(category, question) {
        const categorySelect = document.querySelector('[name="category"]');
        const subjectInput = document.querySelector('[name="subject"]');
        
        if(categorySelect) categorySelect.value = category;
        if(subjectInput) subjectInput.value = question;
        
        // Scroll to form
        supportForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Flash the subject field
        if(subjectInput) {
            subjectInput.classList.add('ring-2', 'ring-indigo-500');
            setTimeout(() => {
                subjectInput.classList.remove('ring-2', 'ring-indigo-500');
            }, 1000);
        }
        
        console.log("FAQ selected:", question);
    };

    // ========================================
    // 5. LOAD STUDENT'S QUERIES
    // ========================================
    loadMyQueries();

    function loadMyQueries() {
        const studentEmail = studentData.email || studentData.collegeId;
        
        db.collection('support-queries')
            .where('studentEmail', '==', studentEmail)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                allQueries = [];
                snapshot.forEach(doc => {
                    allQueries.push({ id: doc.id, ...doc.data() });
                });
                
                console.log(`✅ Loaded ${allQueries.length} queries`);
                
                // Update statistics
                updateStatistics();
                
                // Render with current filter
                applyFilter(currentFilter);
                
            }, error => {
                console.error("❌ Error loading queries:", error);
                queriesList.innerHTML = `
                    <div class="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <p class="text-red-700 font-semibold mb-1">Error loading queries</p>
                        <p class="text-red-600 text-sm">Please refresh the page</p>
                    </div>
                `;
            });
    }

    // ========================================
    // 6. NEW FEATURE: UPDATE STATISTICS
    // ========================================
    function updateStatistics() {
        const total = allQueries.length;
        const pending = allQueries.filter(q => q.status === 'Pending').length;
        const resolved = allQueries.filter(q => q.status === 'Resolved').length;
        const inProgress = allQueries.filter(q => q.status === 'In Progress').length;
        
        if(statTotal) statTotal.textContent = total;
        if(statPending) statPending.textContent = pending;
        if(statResolved) statResolved.textContent = resolved;
        
        // NEW FEATURE: Calculate average response time
        const respondedQueries = allQueries.filter(q => q.respondedAt && q.createdAt);
        if(respondedQueries.length > 0 && statResponse) {
            const avgHours = respondedQueries.reduce((sum, q) => {
                const created = q.createdAt.toDate();
                const responded = q.respondedAt.toDate();
                const hours = (responded - created) / (1000 * 60 * 60);
                return sum + hours;
            }, 0) / respondedQueries.length;
            
            if(avgHours < 1) {
                statResponse.textContent = `${Math.round(avgHours * 60)}m`;
            } else if(avgHours < 24) {
                statResponse.textContent = `${Math.round(avgHours)}h`;
            } else {
                statResponse.textContent = `${Math.round(avgHours / 24)}d`;
            }
        } else if(statResponse) {
            statResponse.textContent = 'N/A';
        }
        
        console.log(`📊 Stats: Total=${total}, Pending=${pending}, Resolved=${resolved}`);
    }

    // ========================================
    // 7. NEW FEATURE: FILTER QUERIES
    // ========================================
    if(filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            applyFilter(currentFilter);
            console.log("Filter changed to:", currentFilter);
        });
    }

    function applyFilter(status) {
        let filteredQueries = allQueries;
        
        if(status !== 'all') {
            filteredQueries = allQueries.filter(q => q.status === status);
        }
        
        renderQueries(filteredQueries);
        
        // Update count
        if(queryCount) {
            queryCount.textContent = `${filteredQueries.length} ${filteredQueries.length === 1 ? 'query' : 'queries'}`;
        }
    }

    // ========================================
    // 8. RENDER QUERIES
    // ========================================
    function renderQueries(queries) {
        queriesList.innerHTML = '';
        
        if (queries.length === 0) {
            queriesList.innerHTML = `
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 text-gray-300">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <h3 class="text-2xl font-bold text-gray-700 mb-2">
                        ${currentFilter === 'all' ? 'No queries yet' : `No ${currentFilter} queries`}
                    </h3>
                    <p class="text-gray-500 mb-4">
                        ${currentFilter === 'all' ? 'Submit your first query using the form above' : 'Try selecting a different filter'}
                    </p>
                    ${currentFilter !== 'all' ? `
                        <button onclick="document.getElementById('filter-status').value='all'; document.getElementById('filter-status').dispatchEvent(new Event('change'))" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                            View All Queries
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        queries.forEach(query => {
            const card = createQueryCard(query);
            queriesList.appendChild(card);
        });
        
        console.log(`✅ Rendered ${queries.length} queries`);
    }

    // ========================================
    // 9. CREATE QUERY CARD (Enhanced Design)
    // ========================================
    function createQueryCard(query) {
        const card = document.createElement('div');
        
        // NEW FEATURE: Urgent queries get pulse animation
        const isUrgent = query.priority === 'High' && query.status === 'Pending';
        card.className = `glass-effect rounded-2xl p-6 border-2 hover:shadow-xl transition-all ${
            isUrgent ? 'border-red-300 pulse-urgent' : 'border-gray-200 hover:border-indigo-300'
        }`;

        // Status styling
        const statusConfig = {
            'Pending': {
                class: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: '🕐',
                ringColor: 'ring-yellow-400'
            },
            'In Progress': {
                class: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: '🔄',
                ringColor: 'ring-blue-400'
            },
            'Resolved': {
                class: 'bg-green-100 text-green-700 border-green-200',
                icon: '✅',
                ringColor: 'ring-green-400'
            },
            'Closed': {
                class: 'bg-gray-200 text-gray-700 border-gray-300',
                icon: '🔒',
                ringColor: 'ring-gray-400'
            }
        };

        const status = statusConfig[query.status] || statusConfig['Pending'];

        // Priority styling
        const priorityConfig = {
            'Low': { class: 'bg-green-100 text-green-700 border-green-200', emoji: '🟢' },
            'Medium': { class: 'bg-orange-100 text-orange-700 border-orange-200', emoji: '🟡' },
            'High': { class: 'bg-red-100 text-red-700 border-red-200', emoji: '🔴' }
        };

        const priority = priorityConfig[query.priority] || priorityConfig['Low'];

        // Format date
        const date = query.createdAt ? new Date(query.createdAt.toDate()).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Just now';

        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center flex-wrap gap-2 mb-3">
                        <span class="px-4 py-1.5 rounded-full text-xs font-bold border-2 ${status.class} flex items-center space-x-1">
                            <span>${status.icon}</span>
                            <span>${query.status}</span>
                        </span>
                        <span class="px-4 py-1.5 rounded-full text-xs font-bold border-2 ${priority.class} flex items-center space-x-1">
                            <span>${priority.emoji}</span>
                            <span>${query.priority}</span>
                        </span>
                        <span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            ${query.category}
                        </span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-xl mb-2">${query.subject}</h4>
                </div>
                ${isUrgent ? `
                    <div class="ml-3 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                        URGENT
                    </div>
                ` : ''}
            </div>
            
            <div class="bg-white rounded-xl p-5 mb-4 border-2 border-gray-100">
                <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">${query.description}</p>
            </div>
            
            ${query.response ? `
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mb-4">
                    <div class="flex items-center space-x-2 mb-3">
                        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <span class="text-sm font-bold text-green-700">Admin Response</span>
                        ${query.respondedBy ? `<span class="text-xs text-green-600">by ${query.respondedBy}</span>` : ''}
                    </div>
                    <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">${query.response}</p>
                    ${query.respondedAt ? `
                        <div class="flex items-center space-x-2 mt-3 pt-3 border-t border-green-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <p class="text-xs text-green-600 font-medium">
                                Responded on: ${new Date(query.respondedAt.toDate()).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <p class="text-sm text-blue-700 font-medium">Waiting for admin response...</p>
                    </div>
                </div>
            `}
            
            <div class="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                <div class="flex items-center space-x-2 text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Submitted: ${date}</span>
                </div>
                <div class="flex items-center space-x-2">
                    ${query.status !== 'Closed' ? `
                        <button onclick="editQuery('${query.id}')" class="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold text-sm transition flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            <span>Edit</span>
                        </button>
                    ` : ''}
                    <button onclick="deleteQuery('${query.id}')" class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold text-sm transition flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // ========================================
    // 10. FORM SUBMISSION
    // ========================================
    supportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Submitting...</span>
        `;

        // Get form data
        const formData = new FormData(e.target);
        
        // Create query object
        const query = {
            // Student Information
            studentName: studentData.name,
            studentEmail: studentData.email || studentData.collegeId,
            studentEnrollment: studentData.collegeId || studentData.enrollment,
            studentPhone: studentData.phone || 'Not provided',
            studentAddress: studentData.address || 'Not provided',
            assignedBus: studentData.assignedBusId || 'Not assigned',
            
            // Query Details
            category: formData.get('category'),
            priority: formData.get('priority'),
            subject: formData.get('subject'),
            description: formData.get('description'),
            
            // Metadata
            status: 'Pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            response: null,
            respondedBy: null,
            respondedAt: null
        };

        try {
            // Add to Firestore
            await db.collection('support-queries').add(query);
            
            console.log("✅ Query submitted successfully");
            
            // Success message
            alert('✅ Query submitted successfully! Admin will review it soon.\n\nYou can track the status in "My Queries" section below.');
            
            // Reset form
            e.target.reset();
            
            // Scroll to queries section
            queriesList.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            console.error("❌ Error submitting query:", error);
            alert('❌ Error submitting query. Please try again.\n\n' + error.message);
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" x2="11" y1="2" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                <span>Submit Query</span>
            `;
        }
    });

    // ========================================
    // 11. NEW FEATURE: EDIT QUERY
    // ========================================
    window.editQuery = function(queryId) {
        const query = allQueries.find(q => q.id === queryId);
        if(!query) return;
        
        const newSubject = prompt('Edit Subject:', query.subject);
        const newDescription = prompt('Edit Description:', query.description);
        
        if(newSubject && newDescription) {
            db.collection('support-queries').doc(queryId).update({
                subject: newSubject,
                description: newDescription,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log("✅ Query updated");
                alert('Query updated successfully!');
            })
            .catch(error => {
                console.error("❌ Error updating query:", error);
                alert('Error updating query. Please try again.');
            });
        }
    };

    // ========================================
    // 12. DELETE QUERY
    // ========================================
    window.deleteQuery = async function(queryId) {
        if (!confirm('Are you sure you want to delete this query?\n\nThis action cannot be undone.')) {
            return;
        }

        try {
            await db.collection('support-queries').doc(queryId).delete();
            console.log("✅ Query deleted");
            alert('Query deleted successfully!');
        } catch (error) {
            console.error("❌ Error deleting query:", error);
            alert('Error deleting query. Please try again.');
        }
    };

    // ========================================
    // 13. INITIALIZATION COMPLETE
    // ========================================
    console.log("🎫 Support page initialized successfully with features:");
    console.log("   ✓ Common FAQs Section");
    console.log("   ✓ Query Statistics Dashboard");
    console.log("   ✓ Filter Queries by Status");
    console.log("   ✓ Enhanced Query Cards");
    console.log("   ✓ Urgent Query Pulse Animation");
    console.log("   ✓ Edit Query Functionality");
    console.log("   ✓ Average Response Time Calculation");
    console.log("   ✓ File Attachment UI (Coming Soon)");
});