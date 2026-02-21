document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Display admin name from localStorage
    const adminNameDisplay = document.getElementById('admin-name-display');
    if (adminNameDisplay) {
        const adminName = localStorage.getItem('adminName');
        if (adminName) adminNameDisplay.textContent = adminName;
    }

    // DOM Elements - Views
    const viewBuses = document.getElementById('view-buses');
    const viewStudents = document.getElementById('view-students');
    const viewNotifications = document.getElementById('view-notifications');
    const viewLostFound = document.getElementById('view-lost-found');
    const viewSupport = document.getElementById('view-support');

    // DOM Elements - Tabs
    const tabBuses = document.getElementById('tab-buses');
    const tabStudents = document.getElementById('tab-students');
    const tabNotifications = document.getElementById('tab-notifications');
    const tabLostFound = document.getElementById('tab-lost-found');
    const tabTracking = document.getElementById('tab-tracking');
    const tabSupport = document.getElementById('tab-support');

    // DOM Elements - Content Areas
    const busesGrid = document.getElementById('admin-buses-grid');
    const studentTableBody = document.getElementById('student-table-body');
    const studentCount = document.getElementById('student-count');
    const searchStudent = document.getElementById('search-student');
    const busSelect = document.getElementById('input-assign-bus');
    const pendingBadge = document.getElementById('pending-badge');

    let buses = [];
    let students = [];
    let allQueries = [];
    let currentFilter = 'all';
    let selectedQueryId = null;

    // === TAB SWITCHING ===

    function switchTab(tab) {
        // Hide all views
        const allViews = [viewBuses, viewStudents, viewNotifications, viewLostFound, viewSupport];
        allViews.forEach(view => {
            if (view) view.classList.add('hidden');
        });

        // Reset all tab styles
        const allTabs = [tabBuses, tabStudents, tabNotifications, tabLostFound, tabSupport];
        allTabs.forEach(t => {
            if (t) {
                t.className = 'tab-button w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-semibold group';
            }
        });

        // Activate selected tab and view
        const activeClass = 'tab-button w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 group';

        switch (tab) {
            case 'buses':
                if (viewBuses) viewBuses.classList.remove('hidden');
                if (tabBuses) tabBuses.className = activeClass;
                break;
            case 'students':
                if (viewStudents) viewStudents.classList.remove('hidden');
                if (tabStudents) tabStudents.className = activeClass;
                break;
            case 'notifications':
                if (viewNotifications) viewNotifications.classList.remove('hidden');
                if (tabNotifications) tabNotifications.className = activeClass;
                loadNotifications();
                break;
            case 'lost-found':
                if (viewLostFound) viewLostFound.classList.remove('hidden');
                if (tabLostFound) tabLostFound.className = activeClass;
                loadLostFound();
                break;
            case 'support':
                if (viewSupport) viewSupport.classList.remove('hidden');
                if (tabSupport) tabSupport.className = activeClass;
                loadSupportQueries();
                break;
        }
    }

    // Bind tab events
    if (tabBuses) tabBuses.addEventListener('click', () => switchTab('buses'));
    if (tabStudents) tabStudents.addEventListener('click', () => switchTab('students'));
    if (tabNotifications) tabNotifications.addEventListener('click', () => switchTab('notifications'));
    if (tabLostFound) tabLostFound.addEventListener('click', () => switchTab('lost-found'));
    if (tabTracking) tabTracking.addEventListener('click', () => window.location.href = 'admin-track.html');
    if (tabSupport) tabSupport.addEventListener('click', () => switchTab('support'));

    // === BUS FLEET MANAGEMENT ===

    db.collection('buses').onSnapshot(snapshot => {
        buses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBuses();
        updateBusOptions();
    }, err => {
        console.error("Error fetching buses:", err);
        if (busesGrid) {
            busesGrid.innerHTML = `<div class="col-span-full text-center p-8 bg-red-50 rounded-2xl border-2 border-red-200">
                <p class="text-red-700 font-bold">Error loading buses</p>
            </div>`;
        }
    });

    function renderBuses() {
        if (!busesGrid) return;
        busesGrid.innerHTML = '';

        if (buses.length === 0) {
            busesGrid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">No buses found</div>`;
            return;
        }

        buses.forEach(bus => {
            const card = document.createElement('div');
            card.className = 'card-hover bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200/60';
            const sourceType = bus.locationSource || bus.tracking?.sourceType;
            const sourceLabel = sourceType === 'driver_phone'
                ? 'Driver Phone'
                : sourceType === 'conductor_phone'
                    ? 'Conductor Phone'
                    : sourceType === 'tracking_device'
                        ? 'Tracking Device'
                        : 'Manual';

            const statusColors = {
                'On Time': 'bg-emerald-500 text-white',
                'Delayed': 'bg-amber-500 text-white',
                'Breakdown': 'bg-rose-500 text-white'
            };

            const currentStatus = statusColors[bus.status] || 'bg-slate-300 text-slate-700';

            card.innerHTML = `
                <div class="flex items-start justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
                            ${bus.number}
                        </div>
                        <div>
                            <h3 class="font-black text-slate-800 text-lg">Bus ${bus.number}</h3>
                            <p class="text-sm text-slate-500 font-semibold">${bus.driver || 'No Driver'}${bus.conductor ? ` | ${bus.conductor}` : ''}</p>
                        </div>
                    </div>
                    <span class="status-badge px-3 py-1 ${currentStatus} rounded-full text-xs font-bold shadow-md">
                        ${bus.status}
                    </span>
                </div>
                
                <div class="mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200/60">
                    <p class="text-xs font-bold text-slate-500 mb-1">ROUTE</p>
                    <p class="text-sm font-bold text-slate-800">${bus.route}</p>
                    <p class="text-xs text-slate-500 mt-2">Source: ${sourceLabel}</p>
                </div>
                
                <div class="grid grid-cols-3 gap-2">
                    <button class="btn-status px-3 py-2 rounded-lg text-xs font-bold transition-all ${bus.status === 'On Time' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-emerald-100'}" 
                        data-id="${bus.id}" data-status="On Time">
                        On Time
                    </button>
                    <button class="btn-status px-3 py-2 rounded-lg text-xs font-bold transition-all ${bus.status === 'Delayed' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-amber-100'}" 
                        data-id="${bus.id}" data-status="Delayed">
                        Delayed
                    </button>
                    <button class="btn-status px-3 py-2 rounded-lg text-xs font-bold transition-all ${bus.status === 'Breakdown' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-rose-100'}" 
                        data-id="${bus.id}" data-status="Breakdown">
                        Issue
                    </button>
                </div>
                <button onclick="window.location.href='admin-track.html'" class="mt-3 w-full px-3 py-2 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all">
                    Open Live Location Source Settings
                </button>
            `;

            busesGrid.appendChild(card);
        });

        // Add status update listeners
        document.querySelectorAll('.btn-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (button) updateBusStatus(button.dataset.id, button.dataset.status);
            });
        });
    }

    function updateBusStatus(busId, status) {
        db.collection('buses').doc(busId).update({
            status: status,
            lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }).then(() => {
            console.log('Bus status updated');
        }).catch(err => {
            alert("Update failed: " + err.message);
        });
    }

    function updateBusOptions() {
        if (!busSelect) return;
        busSelect.innerHTML = '<option value="">Select a route...</option>';
        buses.forEach(bus => {
            const option = document.createElement('option');
            option.value = bus.id;
            option.textContent = `Bus ${bus.number} - ${bus.route}`;
            busSelect.appendChild(option);
        });
    }

    // === ADD BUS MODAL ===
    const addBusBtn = document.getElementById('add-bus-btn');
    const modalAddBus = document.getElementById('modal-add-bus');
    const closeBusModalBtn = document.getElementById('close-bus-modal-btn');
    const cancelBusModalBtn = document.getElementById('cancel-bus-modal-btn');
    const formAddBus = document.getElementById('form-add-bus');

    if (addBusBtn && modalAddBus) {
        addBusBtn.addEventListener('click', () => {
            modalAddBus.classList.remove('hidden');
            modalAddBus.classList.add('flex');
        });
    }

    if (closeBusModalBtn) closeBusModalBtn.addEventListener('click', () => {
        if (modalAddBus) {
            modalAddBus.classList.add('hidden');
            modalAddBus.classList.remove('flex');
        }
    });

    if (cancelBusModalBtn) cancelBusModalBtn.addEventListener('click', () => {
        if (modalAddBus) {
            modalAddBus.classList.add('hidden');
            modalAddBus.classList.remove('flex');
        }
    });

    if (formAddBus) {
        formAddBus.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            try {
                await db.collection('buses').add({
                    number: formData.get('number'),
                    route: formData.get('route'),
                    driver: formData.get('driver'),
                    phone: formData.get('phone') || '',
                    conductor: formData.get('conductor') || '',
                    conductorPhone: formData.get('conductorPhone') || '',
                    status: 'On Time',
                    tracking: {
                        sourceType: 'driver_phone',
                        trackerId: formData.get('trackerId') || '',
                        googleAccount: {
                            connected: false,
                            email: ''
                        }
                    },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('✅ Bus added successfully!');
                e.target.reset();
                if (modalAddBus) {
                    modalAddBus.classList.add('hidden');
                    modalAddBus.classList.remove('flex');
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        });
    }

    // === STUDENT MANAGEMENT ===

    db.collection('users').where('role', '==', 'student').onSnapshot(snapshot => {
        students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderStudentsTable();
    });

    function renderStudentsTable() {
        if (!studentTableBody) return;

        studentTableBody.innerHTML = '';

        // Update count
        if (studentCount) {
            studentCount.textContent = students.length;
        }

        if (students.length === 0) {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                        No students registered yet
                    </td>
                </tr>
            `;
            return;
        }

        // Filter students based on search
        let filteredStudents = students;
        if (searchStudent && searchStudent.value) {
            const searchTerm = searchStudent.value.toLowerCase();
            filteredStudents = students.filter(s =>
                s.name?.toLowerCase().includes(searchTerm) ||
                s.enrollment?.toLowerCase().includes(searchTerm)
            );
        }

        filteredStudents.forEach(student => {
            const bus = buses.find(b => b.id === student.assignedBusId);
            const busInfo = bus ? `Bus ${bus.number} - ${bus.route}` : 'Not Assigned';

            // Check pass validity
            const passDate = student.passValidity ? new Date(student.passValidity) : null;
            const isExpired = passDate && passDate < new Date();
            const passStatus = isExpired ?
                '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Expired</span>' :
                '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Valid</span>';

            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50 transition-colors';
            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            ${student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                            <p class="font-bold text-slate-800">${student.name || 'Unknown'}</p>
                            <p class="text-xs text-slate-500">${student.department || 'N/A'} - ${student.year || 'N/A'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-700">${student.email || 'N/A'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                        ${student.enrollment || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4 text-slate-700 text-sm">${busInfo}</td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1">
                        <span class="text-sm text-slate-700">${student.passValidity || 'Not Set'}</span>
                        ${passStatus}
                    </div>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="viewStudentDetails('${student.id}')" 
                            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                            View Details
                        </button>
                        <button onclick="editStudent('${student.id}')" 
                            class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors">
                            Edit
                        </button>
                    </div>
                </td>
            `;
            studentTableBody.appendChild(row);
        });
    }

    // Search functionality
    if (searchStudent) {
        searchStudent.addEventListener('input', renderStudentsTable);
    }

    // === VIEW STUDENT DETAILS MODAL ===
    window.viewStudentDetails = function (studentId) {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const modal = document.getElementById('modal-student-detail');
        const content = document.getElementById('student-detail-content');

        if (!modal || !content) return;

        const bus = buses.find(b => b.id === student.assignedBusId);
        const busInfo = bus ? `Bus ${bus.number} - ${bus.route}` : 'Not Assigned';

        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                    <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg">
                        ${student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                        <h3 class="text-2xl font-black text-slate-800">${student.name || 'Unknown'}</h3>
                        <p class="text-slate-600">${student.enrollment || 'No Enrollment ID'}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-white rounded-xl border-2 border-slate-200">
                        <p class="text-xs font-bold text-slate-500 mb-1">Email</p>
                        <p class="text-sm font-semibold text-slate-800">${student.email || 'N/A'}</p>
                    </div>
                    <div class="p-4 bg-white rounded-xl border-2 border-slate-200">
                        <p class="text-xs font-bold text-slate-500 mb-1">Phone</p>
                        <p class="text-sm font-semibold text-slate-800">${student.phone || 'N/A'}</p>
                    </div>
                    <div class="p-4 bg-white rounded-xl border-2 border-slate-200">
                        <p class="text-xs font-bold text-slate-500 mb-1">Parent Phone</p>
                        <p class="text-sm font-semibold text-slate-800">${student.parentPhone || 'N/A'}</p>
                    </div>
                    <div class="p-4 bg-white rounded-xl border-2 border-slate-200">
                        <p class="text-xs font-bold text-slate-500 mb-1">Department</p>
                        <p class="text-sm font-semibold text-slate-800">${student.department || 'N/A'}</p>
                    </div>
                    <div class="p-4 bg-white rounded-xl border-2 border-slate-200">
                        <p class="text-xs font-bold text-slate-500 mb-1">Year</p>
                        <p class="text-sm font-semibold text-slate-800">${student.year || 'N/A'}</p>
                    </div>
                    <div class="p-4 bg-white rounded-xl border-2 border-slate-200">
                        <p class="text-xs font-bold text-slate-500 mb-1">Pass Validity</p>
                        <p class="text-sm font-semibold text-slate-800">${student.passValidity || 'Not Set'}</p>
                    </div>
                </div>
                
                <div class="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <p class="text-xs font-bold text-blue-700 mb-1">Address</p>
                    <p class="text-sm text-slate-800">${student.address || 'Not provided'}</p>
                </div>
                
                <div class="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <p class="text-xs font-bold text-green-700 mb-1">Assigned Bus Route</p>
                    <p class="text-sm font-semibold text-slate-800">${busInfo}</p>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="editStudent('${student.id}')" 
                        class="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all">
                        ✏️ Edit Student
                    </button>
                    <button onclick="deleteStudent('${student.id}')" 
                        class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all">
                        Delete Student
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    const closeStudentDetailBtn = document.getElementById('close-student-detail-btn');
    if (closeStudentDetailBtn) {
        closeStudentDetailBtn.addEventListener('click', () => {
            const modal = document.getElementById('modal-student-detail');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }

    window.deleteStudent = async function (studentId) {
        if (confirm('Are you sure you want to delete this student? This will also delete their account.')) {
            try {
                // Get student data first
                const studentDoc = await db.collection('users').doc(studentId).get();
                const studentData = studentDoc.data();

                // Delete from Firestore
                await db.collection('users').doc(studentId).delete();

                // Try to delete from Authentication (may require admin SDK in production)
                // For now, just delete from Firestore

                alert('✅ Student deleted successfully!');

                // Close modal
                const modal = document.getElementById('modal-student-detail');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            } catch (error) {
                alert('❌ Error deleting student: ' + error.message);
            }
        }
    };

    // === EDIT STUDENT ===
    let editingStudentId = null;

    window.editStudent = function (studentId) {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        editingStudentId = studentId;

        // Close detail modal if open
        const detailModal = document.getElementById('modal-student-detail');
        if (detailModal) {
            detailModal.classList.add('hidden');
            detailModal.classList.remove('flex');
        }

        // Pre-fill form
        const modal = document.getElementById('modal-edit-student');
        if (!modal) return;

        modal.querySelector('[name="name"]').value = student.name || '';
        modal.querySelector('[name="enrollment"]').value = student.enrollment || '';
        modal.querySelector('[name="address"]').value = student.address || '';
        modal.querySelector('[name="phone"]').value = student.phone || '';
        modal.querySelector('[name="parentPhone"]').value = student.parentPhone || '';
        modal.querySelector('[name="department"]').value = student.department || '';
        modal.querySelector('[name="passValidity"]').value = student.passValidity || '';

        const yearSelect = modal.querySelector('[name="year"]');
        if (yearSelect) yearSelect.value = student.year || '1st Year';

        // Populate bus options in edit modal
        const editBusSelect = modal.querySelector('[name="assignedBusId"]');
        if (editBusSelect) {
            editBusSelect.innerHTML = '<option value="">Select a route...</option>';
            buses.forEach(bus => {
                const option = document.createElement('option');
                option.value = bus.id;
                option.textContent = `Bus ${bus.number} - ${bus.route}`;
                if (bus.id === student.assignedBusId) option.selected = true;
                editBusSelect.appendChild(option);
            });
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    // Close edit modal
    const closeEditStudentModalBtn = document.getElementById('close-edit-student-modal-btn');
    const cancelEditStudentBtn = document.getElementById('cancel-edit-student-btn');

    function closeEditStudentModal() {
        const modal = document.getElementById('modal-edit-student');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        editingStudentId = null;
    }

    if (closeEditStudentModalBtn) closeEditStudentModalBtn.addEventListener('click', closeEditStudentModal);
    if (cancelEditStudentBtn) cancelEditStudentBtn.addEventListener('click', closeEditStudentModal);

    const formEditStudent = document.getElementById('form-edit-student');
    if (formEditStudent) {
        formEditStudent.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!editingStudentId) return;

            const formData = new FormData(e.target);
            try {
                await db.collection('users').doc(editingStudentId).update({
                    name: formData.get('name'),
                    enrollment: formData.get('enrollment'),
                    address: formData.get('address') || '',
                    phone: formData.get('phone') || '',
                    parentPhone: formData.get('parentPhone') || '',
                    department: formData.get('department') || '',
                    year: formData.get('year') || '1st Year',
                    assignedBusId: formData.get('assignedBusId'),
                    passValidity: formData.get('passValidity'),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('✅ Student updated successfully!');
                closeEditStudentModal();
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        });
    }

    // === ADD STUDENT MODAL ===
    const addStudentBtn = document.getElementById('add-student-btn');
    const modalAddStudent = document.getElementById('modal-add-student');
    const closeStudentModalBtn = document.getElementById('close-student-modal-btn');
    const cancelStudentModalBtn = document.getElementById('cancel-student-modal-btn');
    const formAddStudent = document.getElementById('form-add-student');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password-input');

    if (addStudentBtn && modalAddStudent) {
        addStudentBtn.addEventListener('click', () => {
            modalAddStudent.classList.remove('hidden');
            modalAddStudent.classList.add('flex');
        });
    }

    if (closeStudentModalBtn) closeStudentModalBtn.addEventListener('click', () => {
        if (modalAddStudent) {
            modalAddStudent.classList.add('hidden');
            modalAddStudent.classList.remove('flex');
        }
    });

    if (cancelStudentModalBtn) cancelStudentModalBtn.addEventListener('click', () => {
        if (modalAddStudent) {
            modalAddStudent.classList.add('hidden');
            modalAddStudent.classList.remove('flex');
        }
    });

    // Password toggle
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePassword.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                togglePassword.textContent = '👁️';
            }
        });
    }

    if (formAddStudent) {
        formAddStudent.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const email = formData.get('email');
            const password = formData.get('password');

            try {
                // Create user in Firebase Authentication
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const userId = userCredential.user.uid;

                // Add student data to Firestore using email as the document ID
                // This matches how login.js looks up the user: db.collection('users').doc(email)
                await db.collection('users').doc(email).set({
                    name: formData.get('name'),
                    email: email,
                    enrollment: formData.get('enrollment'),
                    address: formData.get('address') || '',
                    phone: formData.get('phone') || '',
                    parentPhone: formData.get('parentPhone') || '',
                    department: formData.get('department') || '',
                    year: formData.get('year') || '1st Year',
                    assignedBusId: formData.get('assignedBusId'),
                    passValidity: formData.get('passValidity'),
                    role: 'student',
                    uid: userId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('✅ Student registered successfully!');
                e.target.reset();
                if (modalAddStudent) {
                    modalAddStudent.classList.add('hidden');
                    modalAddStudent.classList.remove('flex');
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        });
    }

    // === NOTIFICATIONS MANAGEMENT ===
    function loadNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) return;

        notificationsList.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>';

        db.collection('notifications').orderBy('createdAt', 'desc').limit(20).get()
            .then(snapshot => {
                notificationsList.innerHTML = '';

                if (snapshot.empty) {
                    notificationsList.innerHTML = '<div class="text-center py-12 text-slate-500">No notifications sent yet</div>';
                    return;
                }

                snapshot.forEach(doc => {
                    const notif = doc.data();
                    const card = document.createElement('div');
                    card.className = 'card-hover bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200/60';

                    const typeColors = {
                        'info': 'bg-blue-100 text-blue-700',
                        'alert': 'bg-red-100 text-red-700',
                        'delay': 'bg-amber-100 text-amber-700',
                        'crowd': 'bg-purple-100 text-purple-700'
                    };

                    const typeColor = typeColors[notif.type] || 'bg-slate-100 text-slate-700';
                    const date = notif.createdAt ? new Date(notif.createdAt.toDate()).toLocaleString() : 'Just now';

                    card.innerHTML = `
                        <div class="flex items-start justify-between mb-4">
                            <span class="px-3 py-1 ${typeColor} rounded-lg text-xs font-bold uppercase">${notif.type}</span>
                            <span class="text-xs text-slate-500">${date}</span>
                        </div>
                        <p class="text-slate-800 font-semibold mb-4">${notif.message}</p>
                        <button onclick="deleteNotification('${doc.id}')" 
                            class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition-all">
                            Delete
                        </button>
                    `;

                    notificationsList.appendChild(card);
                });
            })
            .catch(err => {
                console.error("Error loading notifications:", err);
                notificationsList.innerHTML = '<div class="text-center py-8 text-red-500">Error loading notifications</div>';
            });
    }

    window.deleteNotification = async function (notifId) {
        if (confirm('Delete this notification?')) {
            try {
                await db.collection('notifications').doc(notifId).delete();
                loadNotifications();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    };

    // === ADD NOTIFICATION MODAL ===
    const addNotificationBtn = document.getElementById('add-notification-btn');
    const modalAddNotification = document.getElementById('modal-add-notification');
    const closeNotificationModalBtn = document.getElementById('close-notification-modal-btn');
    const cancelNotificationModalBtn = document.getElementById('cancel-notification-modal-btn');
    const formAddNotification = document.getElementById('form-add-notification');

    if (addNotificationBtn && modalAddNotification) {
        addNotificationBtn.addEventListener('click', () => {
            modalAddNotification.classList.remove('hidden');
            modalAddNotification.classList.add('flex');
        });
    }

    if (closeNotificationModalBtn) closeNotificationModalBtn.addEventListener('click', () => {
        if (modalAddNotification) {
            modalAddNotification.classList.add('hidden');
            modalAddNotification.classList.remove('flex');
        }
    });

    if (cancelNotificationModalBtn) cancelNotificationModalBtn.addEventListener('click', () => {
        if (modalAddNotification) {
            modalAddNotification.classList.add('hidden');
            modalAddNotification.classList.remove('flex');
        }
    });

    if (formAddNotification) {
        formAddNotification.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            try {
                await db.collection('notifications').add({
                    type: formData.get('type'),
                    message: formData.get('message'),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('✅ Notification sent!');
                e.target.reset();
                if (modalAddNotification) {
                    modalAddNotification.classList.add('hidden');
                    modalAddNotification.classList.remove('flex');
                }
                loadNotifications();
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        });
    }

    // === LOST & FOUND MANAGEMENT ===
    function loadLostFound() {
        const lostFoundList = document.getElementById('lost-found-list');
        if (!lostFoundList) return;

        lostFoundList.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>';

        db.collection('lost-items').orderBy('createdAt', 'desc').limit(50).get()
            .then(snapshot => {
                lostFoundList.innerHTML = '';

                if (snapshot.empty) {
                    lostFoundList.innerHTML = '<div class="text-center py-12 text-slate-500">No lost & found reports yet</div>';
                    return;
                }

                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 30);

                snapshot.forEach(doc => {
                    const item = doc.data();
                    const createdDate = item.createdAt && typeof item.createdAt.toDate === 'function'
                        ? item.createdAt.toDate()
                        : (item.createdAt ? new Date(item.createdAt) : null);
                    if (item.isDeleted === true) return;
                    if (!createdDate || Number.isNaN(createdDate.getTime()) || createdDate < cutoff) return;
                    const card = document.createElement('div');
                    card.className = 'card-hover bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200/60';

                    const statusValue = (item.status || 'Lost').toString();
                    const normalizedStatus = statusValue.toLowerCase();
                    const statusColor = normalizedStatus === 'found' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
                    const date = createdDate ? createdDate.toLocaleString() : 'Just now';

                    card.innerHTML = `
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h4 class="font-black text-slate-800 text-lg mb-1">${item.item || item.itemName || 'Unknown Item'}</h4>
                                <span class="px-3 py-1 ${statusColor} rounded-lg text-xs font-bold uppercase">${statusValue}</span>
                            </div>
                            <span class="text-xs text-slate-500">${date}</span>
                        </div>
                        <p class="text-slate-600 mb-4">${item.description || 'No description'}</p>
                        <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
                            <div class="p-3 bg-blue-50 rounded-xl">
                                <p class="text-xs font-bold text-blue-700 mb-1">Reported By</p>
                                <p class="text-slate-800">${item.userName || item.reportedBy || 'Unknown'}</p>
                            </div>
                            <div class="p-3 bg-purple-50 rounded-xl">
                                <p class="text-xs font-bold text-purple-700 mb-1">Route</p>
                                <p class="text-slate-800">${item.route || item.location || 'Not specified'}</p>
                            </div>
                        </div>
                        <button onclick="deleteLostFound('${doc.id}')" 
                            class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition-all">
                            Delete
                        </button>
                    `;

                    lostFoundList.appendChild(card);
                });
            })
            .catch(err => {
                console.error("Error loading lost & found:", err);
                lostFoundList.innerHTML = '<div class="text-center py-8 text-red-500">Error loading items</div>';
            });
    }

    window.deleteLostFound = async function (itemId) {
        if (confirm('Delete this item?')) {
            try {
                await db.collection('lost-items').doc(itemId).delete();
                loadLostFound();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    };

    // === SUPPORT QUERIES MANAGEMENT ===

    function loadSupportQueries() {
        db.collection('support-queries').orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                allQueries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderSupportQueries();
                updatePendingBadge();
            }, err => {
                console.error("Error loading queries:", err);
            });
    }

    function updatePendingBadge() {
        const pendingCount = allQueries.filter(q => q.status === 'Pending').length;
        if (pendingBadge) {
            if (pendingCount > 0) {
                pendingBadge.textContent = pendingCount;
                pendingBadge.classList.remove('hidden');
            } else {
                pendingBadge.classList.add('hidden');
            }
        }

        // Update total count
        const totalQueries = document.getElementById('total-queries');
        if (totalQueries) {
            totalQueries.textContent = `${allQueries.length} Queries`;
        }
    }

    function renderSupportQueries() {
        const container = document.getElementById('support-queries-list');
        if (!container) return;

        container.innerHTML = '';

        // Filter queries
        let filtered = currentFilter === 'all'
            ? allQueries
            : allQueries.filter(q => q.status === currentFilter);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <p class="text-slate-500 font-semibold">No queries found</p>
                </div>
            `;
            return;
        }

        filtered.forEach(query => {
            const card = createQueryCard(query);
            container.appendChild(card);
        });
    }

    function createQueryCard(query) {
        const card = document.createElement('div');
        card.className = 'card-hover bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border-2 border-slate-200 shadow-lg';

        const statusColors = {
            'Pending': 'bg-amber-100 text-amber-700',
            'In Progress': 'bg-blue-100 text-blue-700',
            'Resolved': 'bg-emerald-100 text-emerald-700',
            'Closed': 'bg-slate-200 text-slate-700'
        };

        const priorityColors = {
            'Low': 'bg-green-100 text-green-700',
            'Medium': 'bg-orange-100 text-orange-700',
            'High': 'bg-rose-100 text-rose-700'
        };

        const date = query.createdAt ? new Date(query.createdAt.toDate()).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Just now';

        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex gap-2">
                    <span class="status-badge px-3 py-1 ${statusColors[query.status]} rounded-lg text-xs font-bold">${query.status}</span>
                    <span class="status-badge px-3 py-1 ${priorityColors[query.priority]} rounded-lg text-xs font-bold">${query.priority}</span>
                </div>
                <span class="text-xs text-slate-500 font-semibold">${date}</span>
            </div>
            
            <h4 class="font-black text-slate-800 text-lg mb-2">${query.subject}</h4>
            <p class="text-sm text-slate-600 mb-4 line-clamp-2">${query.description}</p>
            
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p class="text-xs font-bold text-blue-700 mb-1">Student</p>
                    <p class="text-sm font-semibold text-slate-800">${query.studentName}</p>
                    <p class="text-xs text-slate-600">${query.studentPhone}</p>
                </div>
                <div class="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <p class="text-xs font-bold text-purple-700 mb-1">Category</p>
                    <p class="text-sm font-semibold text-slate-800">${query.category}</p>
                    <p class="text-xs text-slate-600">ID: ${query.studentEnrollment}</p>
                </div>
            </div>
            
            ${query.response ? `
                <div class="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl mb-4">
                    <p class="text-xs font-bold text-emerald-700 mb-2">✅ Your Response</p>
                    <p class="text-sm text-slate-700">${query.response}</p>
                </div>
            ` : ''}
            
            <div class="flex gap-2">
                <button onclick="openRespondModal('${query.id}')" 
                    class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                    ${query.response ? 'Update' : 'Respond'}
                </button>
                <button onclick="deleteQuery('${query.id}')" 
                    class="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all">
                    Delete
                </button>
            </div>
        `;

        return card;
    }

    // Filter tabs for support
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            filterTabs.forEach(t => {
                t.classList.remove('border-blue-600', 'text-blue-600');
                t.classList.add('border-transparent', 'text-slate-600');
            });
            tab.classList.add('border-blue-600', 'text-blue-600');
            tab.classList.remove('border-transparent', 'text-slate-600');

            // Update filter
            currentFilter = tab.dataset.status;
            renderSupportQueries();
        });
    });

    // Response modal
    window.openRespondModal = function (queryId) {
        selectedQueryId = queryId;
        const query = allQueries.find(q => q.id === queryId);
        if (!query) return;

        document.getElementById('modal-query-details').innerHTML = `
            <div class="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                <h4 class="font-black text-slate-800 text-xl mb-3">${query.subject}</h4>
                <p class="text-slate-700 mb-4">${query.description}</p>
                <div class="grid grid-cols-3 gap-3 text-sm">
                    <div><span class="font-bold">Student:</span> ${query.studentName}</div>
                    <div><span class="font-bold">Priority:</span> ${query.priority}</div>
                    <div><span class="font-bold">Category:</span> ${query.category}</div>
                </div>
            </div>
        `;

        document.getElementById('response-status').value = query.status;
        document.getElementById('response-message').value = query.response || '';

        document.getElementById('modal-respond-query').classList.remove('hidden');
        document.getElementById('modal-respond-query').classList.add('flex');
    };

    function closeRespondModal() {
        document.getElementById('modal-respond-query').classList.add('hidden');
        selectedQueryId = null;
    }

    const closeRespondModalBtn = document.getElementById('close-respond-modal-btn');
    const cancelRespondBtn = document.getElementById('cancel-respond-btn');

    if (closeRespondModalBtn) closeRespondModalBtn.addEventListener('click', closeRespondModal);
    if (cancelRespondBtn) cancelRespondBtn.addEventListener('click', closeRespondModal);

    const formRespondQuery = document.getElementById('form-respond-query');
    if (formRespondQuery) {
        formRespondQuery.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedQueryId) return;

            try {
                await db.collection('support-queries').doc(selectedQueryId).update({
                    status: document.getElementById('response-status').value,
                    response: document.getElementById('response-message').value,
                    respondedBy: 'Admin',
                    respondedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('✅ Response sent!');
                closeRespondModal();
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        });
    }

    window.deleteQuery = async function (queryId) {
        if (confirm('Delete this query?')) {
            try {
                await db.collection('support-queries').doc(queryId).delete();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    };

    const refreshQueriesBtn = document.getElementById('refresh-queries-btn');
    if (refreshQueriesBtn) {
        refreshQueriesBtn.addEventListener('click', loadSupportQueries);
    }

    // === LOGOUT ===
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Logout?')) {
                auth.signOut().then(() => {
                    localStorage.clear();
                    window.location.href = 'index.html';
                });
            }
        });
    }
});
