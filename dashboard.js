// User Dashboard JavaScript

// Dashboard State
const DashboardState = {
    currentSection: 'dashboard',
    userStats: {
        tipsRead: 0,
        filesAccessed: 0,
        daysActive: 0
    },
    filters: {
        tips: { search: '', category: '' },
        files: { search: '', type: '' }
    }
};

// User Dashboard Manager
const UserDashboard = {
    init() {
        this.checkUserAuth();
        this.bindEvents();
        this.setupNavigation();
        this.loadUserData();
        this.loadDashboard();
        this.setupFilters();
        this.setupForms();
        ThemeManager.init();
    },

    checkUserAuth() {
        if (!AppState.currentUser || AppState.currentUser.isAdmin) {
            Utils.showNotification('Please login to access dashboard.', 'error');
            window.location.href = 'index.html';
            return;
        }
    },

    bindEvents() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.switchSection(section);
            });
        });

        // Mobile navigation toggle
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        navToggle?.addEventListener('click', () => {
            navMenu?.classList.toggle('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!document.getElementById('navbar')?.contains(e.target)) {
                navMenu?.classList.remove('active');
            }
        });
    },

    setupNavigation() {
        // Update active navigation link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    },

    loadUserData() {
        // Update user name in navigation and welcome message
        const userName = AppState.currentUser?.name || 'User';
        document.getElementById('user-name').textContent = userName;
        document.getElementById('welcome-name').textContent = userName;

        // Calculate and display user stats
        this.calculateUserStats();
        this.updateUserStats();
    },

    calculateUserStats() {
        const user = AppState.currentUser;
        if (!user) return;

        // Calculate days since joining
        const joinDate = new Date(user.joinDate);
        const today = new Date();
        const daysDiff = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));

        // Get user activity from localStorage
        const userActivity = JSON.parse(localStorage.getItem(`eip_user_activity_${user.id}`) || '{}');

        DashboardState.userStats = {
            tipsRead: userActivity.tipsRead || Math.floor(Math.random() * 20) + 5,
            filesAccessed: userActivity.filesAccessed || Math.floor(Math.random() * 10) + 2,
            daysActive: Math.max(daysDiff, 1)
        };

        // Save updated activity
        localStorage.setItem(`eip_user_activity_${user.id}`, JSON.stringify(DashboardState.userStats));
    },

    updateUserStats() {
        document.getElementById('user-tips-read').textContent = DashboardState.userStats.tipsRead;
        document.getElementById('user-files-accessed').textContent = DashboardState.userStats.filesAccessed;
        document.getElementById('user-days-active').textContent = DashboardState.userStats.daysActive;
    },

    switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            DashboardState.currentSection = sectionName;

            // Load section data
            switch (sectionName) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'tips':
                    this.loadTips();
                    break;
                case 'files':
                    this.loadFiles();
                    break;
                case 'broadcasts':
                    this.loadBroadcasts();
                    break;
                case 'support':
                    this.loadSupportHistory();
                    break;
            }
        }
    },

    loadDashboard() {
        this.loadRecentTips();
        this.loadRecentBroadcasts();
    },

    loadRecentTips() {
        const recentTips = TipsManager.getTips(3);
        const container = document.getElementById('recent-tips');

        if (recentTips.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No tips available yet.</p></div>';
            return;
        }

        container.innerHTML = recentTips.map(tip => `
            <div class="activity-item">
                <h4>${tip.title}</h4>
                <p>${tip.content.substring(0, 100)}... • ${Utils.formatDate(tip.createdDate)}</p>
            </div>
        `).join('');
    },

    loadRecentBroadcasts() {
        const recentBroadcasts = AppState.broadcasts
            .sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate))
            .slice(0, 3);
        const container = document.getElementById('recent-broadcasts');

        if (recentBroadcasts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No updates available.</p></div>';
            return;
        }

        container.innerHTML = recentBroadcasts.map(broadcast => `
            <div class="activity-item">
                <h4>${broadcast.title}</h4>
                <p>${broadcast.message.substring(0, 100)}... • ${Utils.formatDate(broadcast.sentDate)}</p>
            </div>
        `).join('');
    },

    loadTips() {
        const tips = this.filterTips(TipsManager.getTips());
        const container = document.getElementById('tips-grid');

        if (tips.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lightbulb"></i>
                    <h3>No Tips Found</h3>
                    <p>No tips match your current filters. Try adjusting your search criteria.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tips.map(tip => `
            <div class="tip-card" onclick="UserDashboard.markTipAsRead('${tip.id}')">
                <span class="tip-category">${tip.category}</span>
                <h3>${tip.title}</h3>
                <p>${tip.content}</p>
                <div class="tip-meta">
                    Added ${Utils.formatDate(tip.createdDate)}
                </div>
            </div>
        `).join('');
    },

    filterTips(tips) {
        const { search, category } = DashboardState.filters.tips;
        return tips.filter(tip => {
            const matchesSearch = !search || 
                tip.title.toLowerCase().includes(search.toLowerCase()) ||
                tip.content.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = !category || tip.category === category;
            return matchesSearch && matchesCategory;
        });
    },

    markTipAsRead(tipId) {
        const user = AppState.currentUser;
        if (!user) return;

        const userActivity = JSON.parse(localStorage.getItem(`eip_user_activity_${user.id}`) || '{}');
        const readTips = userActivity.readTips || [];

        if (!readTips.includes(tipId)) {
            readTips.push(tipId);
            userActivity.readTips = readTips;
            userActivity.tipsRead = readTips.length;

            localStorage.setItem(`eip_user_activity_${user.id}`, JSON.stringify(userActivity));
            DashboardState.userStats.tipsRead = readTips.length;
            this.updateUserStats();

            Utils.showNotification('Tip marked as read!');
        }
    },

    loadFiles() {
        const files = this.filterFiles(FileManager.getFiles());
        const container = document.getElementById('files-grid');

        if (files.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No Files Available</h3>
                    <p>No files match your current filters or no files have been uploaded yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = files.map(file => `
            <div class="file-card">
                <div class="file-icon">
                    <i class="fas fa-${this.getFileIcon(file.type)}"></i>
                </div>
                <span class="file-type-badge">${file.type.toUpperCase()}</span>
                <h3>${file.name}</h3>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
                <button class="file-download-btn" onclick="UserDashboard.downloadFile('${file.id}')">
                    <i class="fas fa-download"></i>
                    Download
                </button>
            </div>
        `).join('');
    },

    filterFiles(files) {
        const { search, type } = DashboardState.filters.files;
        return files.filter(file => {
            const matchesSearch = !search || file.name.toLowerCase().includes(search.toLowerCase());
            const matchesType = !type || file.type === type;
            return matchesSearch && matchesType;
        });
    },

    getFileIcon(type) {
        const icons = {
            apk: 'mobile-alt',
            document: 'file-alt',
            image: 'image',
            other: 'file'
        };
        return icons[type] || 'file';
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    downloadFile(fileId) {
        const file = AppState.files.find(f => f.id === fileId);
        if (!file) {
            Utils.showNotification('File not found!', 'error');
            return;
        }

        // Simulate file download
        Utils.showNotification(`Downloading ${file.name}...`);

        // Update user activity
        const user = AppState.currentUser;
        if (user) {
            const userActivity = JSON.parse(localStorage.getItem(`eip_user_activity_${user.id}`) || '{}');
            const accessedFiles = userActivity.accessedFiles || [];

            if (!accessedFiles.includes(fileId)) {
                accessedFiles.push(fileId);
                userActivity.accessedFiles = accessedFiles;
                userActivity.filesAccessed = accessedFiles.length;

                localStorage.setItem(`eip_user_activity_${user.id}`, JSON.stringify(userActivity));
                DashboardState.userStats.filesAccessed = accessedFiles.length;
                this.updateUserStats();
            }
        }

        // In a real application, this would trigger an actual download
        setTimeout(() => {
            Utils.showNotification(`${file.name} downloaded successfully!`);
        }, 1000);
    },

    loadBroadcasts() {
        const broadcasts = AppState.broadcasts
            .sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));
        const container = document.getElementById('broadcasts-list');

        if (broadcasts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <h3>No Updates Available</h3>
                    <p>There are no announcements or updates at this time. Check back later!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = broadcasts.map(broadcast => {
            // Mark as read when viewed
            this.markBroadcastAsRead(broadcast.id);

            return `
                <div class="broadcast-card">
                    <span class="broadcast-priority ${broadcast.priority}">${broadcast.priority}</span>
                    <h3>${broadcast.title}</h3>
                    <p>${broadcast.message}</p>
                    <div class="broadcast-meta">
                        Posted ${Utils.formatDate(broadcast.sentDate)}
                    </div>
                </div>
            `;
        }).join('');
    },

    markBroadcastAsRead(broadcastId) {
        const userId = AppState.currentUser?.id;
        if (userId) {
            BroadcastManager.markAsRead(broadcastId, userId);
        }
    },

    setupFilters() {
        // Tips filters
        document.getElementById('tips-search')?.addEventListener('input', (e) => {
            DashboardState.filters.tips.search = e.target.value;
            this.loadTips();
        });

        document.getElementById('tips-category')?.addEventListener('change', (e) => {
            DashboardState.filters.tips.category = e.target.value;
            this.loadTips();
        });

        // Files filters
        document.getElementById('files-search')?.addEventListener('input', (e) => {
            DashboardState.filters.files.search = e.target.value;
            this.loadFiles();
        });

        document.getElementById('files-type')?.addEventListener('change', (e) => {
            DashboardState.filters.files.type = e.target.value;
            this.loadFiles();
        });
    },

    setupForms() {
        // Support form
        const supportForm = document.getElementById('support-form');
        supportForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitSupportMessage();
        });

        // Quick support form
        const quickSupportForm = document.getElementById('quick-support-form');
        quickSupportForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitQuickSupport();
        });
    },

    submitSupportMessage() {
        const subject = document.getElementById('support-subject').value;
        const message = document.getElementById('support-message').value;
        const priority = document.getElementById('support-priority').value;

        if (!subject || !message) {
            Utils.showNotification('Please fill in all required fields.', 'error');
            return;
        }

        SupportSystem.sendMessage(subject, message, priority);
        Utils.showNotification('Support message sent successfully!');

        // Reset form
        document.getElementById('support-form').reset();

        // Reload support history
        this.loadSupportHistory();
    },

    submitQuickSupport() {
        const question = document.getElementById('quick-question').value;

        if (!question.trim()) {
            Utils.showNotification('Please enter your question.', 'error');
            return;
        }

        SupportSystem.sendMessage('Quick Question', question, 'normal');
        Utils.showNotification('Question sent successfully!');

        // Reset form and close modal
        document.getElementById('quick-question').value = '';
        closeModal('quick-support-modal');
    },

    loadSupportHistory() {
        const userMessages = AppState.supportMessages.filter(
            message => message.sender === AppState.currentUser?.email
        ).sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));

        const container = document.getElementById('support-messages-history');

        if (userMessages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-envelope"></i>
                    <h3>No Support Messages</h3>
                    <p>You haven't sent any support messages yet. Use the form above to get help!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = userMessages.map(message => `
            <div class="support-message-card">
                <span class="support-message-status ${message.status}">${message.status}</span>
                <h4>${message.subject}</h4>
                <div class="support-message-preview">${message.message}</div>
                <div class="support-message-date">
                    Sent ${Utils.formatDate(message.sentDate)}
                    ${message.replies.length > 0 ? `• ${message.replies.length} replies` : ''}
                </div>
            </div>
        `).join('');
    },

    showQuickSupport() {
        document.getElementById('quick-support-modal').style.display = 'block';
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    UserDashboard.init();
});

// Export UserDashboard for global access
window.UserDashboard = UserDashboard;