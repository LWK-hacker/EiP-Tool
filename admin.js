// Admin Panel JavaScript

// Admin State
const AdminState = {
    currentSection: 'dashboard',
    uploadedFiles: [],
    currentFilters: {
        files: { search: '', type: '' },
        tips: { search: '', category: '' },
        users: { search: '', status: '' },
        support: { search: '', status: '', priority: '' },
        broadcasts: { search: '' }
    }
};

// Admin Panel Manager
const AdminPanel = {
    init() {
        this.checkAdminAuth();
        this.bindEvents();
        this.setupSidebar();
        this.loadDashboard();
        this.setupFileUpload();
        this.setupForms();
        this.setupFilters();
        ThemeManager.init();
    },

    checkAdminAuth() {
        if (!AppState.currentUser || !AppState.currentUser.isAdmin) {
            Utils.showNotification('Access denied. Admin privileges required.', 'error');
            window.location.href = 'index.html';
            return;
        }
    },

    bindEvents() {
        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                this.switchSection(section);
            });
        });

        // Mobile sidebar toggle
        const sidebarToggle = document.createElement('button');
        sidebarToggle.className = 'sidebar-toggle';
        sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
        sidebarToggle.style.cssText = `
            display: none;
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 1001;
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 10px;
            border-radius: var(--radius-md);
            cursor: pointer;
        `;

        document.body.appendChild(sidebarToggle);

        sidebarToggle.addEventListener('click', () => {
            document.getElementById('admin-sidebar').classList.toggle('active');
        });

        // Show mobile toggle on small screens
        const mediaQuery = window.matchMedia('(max-width: 1024px)');
        const handleScreenChange = (e) => {
            sidebarToggle.style.display = e.matches ? 'block' : 'none';
        };
        mediaQuery.addListener(handleScreenChange);
        handleScreenChange(mediaQuery);
    },

    setupSidebar() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            AdminState.currentSection = sectionName;

            // Load section data
            switch (sectionName) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'files':
                    this.loadFiles();
                    break;
                case 'tips':
                    this.loadTips();
                    break;
                case 'broadcasts':
                    this.loadBroadcasts();
                    break;
                case 'users':
                    this.loadUsers();
                    break;
                case 'support':
                    this.loadSupport();
                    break;
            }
        }
    },

    loadDashboard() {
        // Update stats
        const stats = this.calculateStats();
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('total-files').textContent = stats.totalFiles;
        document.getElementById('total-tips').textContent = stats.totalTips;
        document.getElementById('support-messages').textContent = stats.supportMessages;

        // Load recent activity
        this.loadRecentActivity();
    },

    calculateStats() {
        return {
            totalUsers: AppState.users.length,
            totalFiles: AppState.files.length,
            totalTips: AppState.tips.length,
            supportMessages: AppState.supportMessages.length
        };
    },

    loadRecentActivity() {
        const activityList = document.getElementById('recent-activity');
        const activities = [];

        // Add recent tips
        AppState.tips.slice(-3).forEach(tip => {
            activities.push({
                icon: 'fas fa-lightbulb',
                title: 'New tip added',
                description: tip.title,
                time: tip.createdDate
            });
        });

        // Add recent users
        AppState.users.slice(-2).forEach(user => {
            activities.push({
                icon: 'fas fa-user-plus',
                title: 'New user registered',
                description: user.name,
                time: user.joinDate
            });
        });

        // Add recent support messages
        AppState.supportMessages.slice(-2).forEach(message => {
            activities.push({
                icon: 'fas fa-envelope',
                title: 'New support message',
                description: message.subject,
                time: message.sentDate
            });
        });

        // Sort by time and take last 5
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        activities.splice(5);

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-info">
                    <h4>${activity.title}</h4>
                    <p>${activity.description} • ${Utils.formatDate(activity.time)}</p>
                </div>
            </div>
        `).join('');
    },

    setupFileUpload() {
        const dropzone = document.getElementById('upload-dropzone');
        const fileInput = document.getElementById('file-input');

        // Drag and drop functionality
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.handleFileUpload(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileUpload(files);
        });

        // Click to browse
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });
    },

    handleFileUpload(files) {
        files.forEach(file => {
            // Determine file type
            let type = 'other';
            if (file.name.endsWith('.apk')) type = 'apk';
            else if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.includes('document') || file.name.match(/\.(pdf|doc|docx|txt)$/)) type = 'document';

            // Simulate file upload
            const fileData = FileManager.uploadFile(file, type);
            AdminState.uploadedFiles.push(fileData);

            Utils.showNotification(`File "${file.name}" uploaded successfully!`);
        });

        this.loadFiles();
        document.getElementById('file-input').value = '';
    },

    loadFiles() {
        const tbody = document.getElementById('files-table-body');
        const files = this.filterFiles(AppState.files);

        tbody.innerHTML = files.map(file => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-${this.getFileIcon(file.type)}"></i>
                        ${file.name}
                    </div>
                </td>
                <td><span class="badge badge-${file.type}">${file.type.toUpperCase()}</span></td>
                <td>${this.formatFileSize(file.size)}</td>
                <td>${Utils.formatDate(file.uploadDate)}</td>
                <td>${file.uploader}</td>
                <td>
                    <button class="btn-icon btn-danger btn-sm" onclick="AdminPanel.deleteFile('${file.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    filterFiles(files) {
        const { search, type } = AdminState.currentFilters.files;
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

    deleteFile(fileId) {
        if (confirm('Are you sure you want to delete this file?')) {
            FileManager.deleteFile(fileId);
            Utils.showNotification('File deleted successfully!');
            this.loadFiles();
        }
    },

    setupForms() {
        // Tips form
        const tipsForm = document.getElementById('tips-form');
        tipsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('tip-title').value;
            const content = document.getElementById('tip-content').value;
            const category = document.getElementById('tip-category').value;

            TipsManager.addTip(title, content, category);
            Utils.showNotification('Tip added successfully!');
            tipsForm.reset();
            this.loadTips();
        });

        // Broadcast form
        const broadcastForm = document.getElementById('broadcast-form');
        broadcastForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('broadcast-title').value;
            const message = document.getElementById('broadcast-message').value;
            const priority = document.getElementById('broadcast-priority').value;

            BroadcastManager.sendBroadcast(title, message, priority);
            Utils.showNotification('Broadcast sent successfully!');
            broadcastForm.reset();
            this.loadBroadcasts();
        });
    },

    loadTips() {
        const tipsGrid = document.getElementById('tips-grid');
        const tips = this.filterTips(TipsManager.getTips());

        tipsGrid.innerHTML = tips.map(tip => `
            <div class="tip-card">
                <div class="tip-header">
                    <span class="tip-category">${tip.category}</span>
                    <div class="tip-actions">
                        <button class="btn-icon btn-danger btn-sm" onclick="AdminPanel.deleteTip('${tip.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <h4>${tip.title}</h4>
                <p>${tip.content}</p>
                <div class="tip-meta">
                    Created ${Utils.formatDate(tip.createdDate)} by ${tip.author}
                </div>
            </div>
        `).join('');
    },

    filterTips(tips) {
        const { search, category } = AdminState.currentFilters.tips;
        return tips.filter(tip => {
            const matchesSearch = !search || 
                tip.title.toLowerCase().includes(search.toLowerCase()) ||
                tip.content.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = !category || tip.category === category;
            return matchesSearch && matchesCategory;
        });
    },

    deleteTip(tipId) {
        if (confirm('Are you sure you want to delete this tip?')) {
            TipsManager.deleteTip(tipId);
            Utils.showNotification('Tip deleted successfully!');
            this.loadTips();
        }
    },

    loadBroadcasts() {
        const broadcastsList = document.getElementById('broadcasts-list');
        const broadcasts = this.filterBroadcasts(AppState.broadcasts);

        broadcastsList.innerHTML = broadcasts.map(broadcast => `
            <div class="broadcast-item">
                <div class="broadcast-header">
                    <span class="broadcast-priority ${broadcast.priority}">${broadcast.priority}</span>
                </div>
                <h4>${broadcast.title}</h4>
                <p>${broadcast.message}</p>
                <div class="broadcast-meta">
                    <div>Sent ${Utils.formatDate(broadcast.sentDate)}</div>
                    <div class="broadcast-stats">
                        <span>Sent to: ${AppState.users.length} users</span>
                        <span>Read by: ${broadcast.read.length} users</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    filterBroadcasts(broadcasts) {
        const { search } = AdminState.currentFilters.broadcasts;
        return broadcasts.filter(broadcast => {
            return !search || 
                broadcast.title.toLowerCase().includes(search.toLowerCase()) ||
                broadcast.message.toLowerCase().includes(search.toLowerCase());
        }).sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));
    },

    loadUsers() {
        const tbody = document.getElementById('users-table-body');
        const users = this.filterUsers(AppState.users);

        // Update user stats
        const stats = UserManager.getUserStats();
        document.getElementById('active-users').textContent = stats.activeUsers;
        document.getElementById('banned-users').textContent = stats.bannedUsers;

        tbody.innerHTML = users.map(user => {
            const isBanned = UserManager.isUserBanned(user.email);
            return `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${Utils.formatDate(user.joinDate)}</td>
                    <td>
                        <span class="badge badge-${isBanned ? 'banned' : 'active'}">
                            ${isBanned ? 'Banned' : 'Active'}
                        </span>
                    </td>
                    <td>
                        ${isBanned ? `
                            <button class="btn-success btn-sm" onclick="AdminPanel.unbanUser('${user.email}')">
                                Unban
                            </button>
                        ` : `
                            <button class="btn-warning btn-sm" onclick="AdminPanel.banUser('${user.email}')">
                                Ban
                            </button>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    },

    filterUsers(users) {
        const { search, status } = AdminState.currentFilters.users;
        return users.filter(user => {
            const matchesSearch = !search || 
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase());
            
            let matchesStatus = true;
            if (status === 'active') matchesStatus = !UserManager.isUserBanned(user.email);
            if (status === 'banned') matchesStatus = UserManager.isUserBanned(user.email);
            
            return matchesSearch && matchesStatus;
        });
    },

    banUser(userEmail) {
        if (confirm(`Are you sure you want to ban user ${userEmail}?`)) {
            UserManager.banUser(userEmail);
            Utils.showNotification('User banned successfully!');
            this.loadUsers();
        }
    },

    unbanUser(userEmail) {
        UserManager.unbanUser(userEmail);
        Utils.showNotification('User unbanned successfully!');
        this.loadUsers();
    },

    loadSupport() {
        const messagesList = document.getElementById('support-messages-list');
        const messages = this.filterSupportMessages(AppState.supportMessages);

        // Update support stats
        const openTickets = messages.filter(m => m.status === 'open').length;
        const resolvedTickets = messages.filter(m => m.status === 'resolved').length;
        document.getElementById('open-tickets').textContent = openTickets;
        document.getElementById('resolved-tickets').textContent = resolvedTickets;

        messagesList.innerHTML = messages.map(message => `
            <div class="support-message-item" onclick="AdminPanel.viewSupportMessage('${message.id}')">
                <div class="support-message-header">
                    <span class="support-message-status ${message.status}">${message.status}</span>
                    <span class="priority-badge priority-${message.priority}">${message.priority}</span>
                </div>
                <h4>${message.subject}</h4>
                <div class="support-message-preview">${message.message}</div>
                <div class="support-message-meta">
                    <span>From: ${message.senderName}</span>
                    <span>${Utils.formatDate(message.sentDate)}</span>
                </div>
            </div>
        `).join('');
    },

    filterSupportMessages(messages) {
        const { search, status, priority } = AdminState.currentFilters.support;
        return messages.filter(message => {
            const matchesSearch = !search || 
                message.subject.toLowerCase().includes(search.toLowerCase()) ||
                message.message.toLowerCase().includes(search.toLowerCase()) ||
                message.senderName.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = !status || message.status === status;
            const matchesPriority = !priority || message.priority === priority;
            return matchesSearch && matchesStatus && matchesPriority;
        }).sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));
    },

    viewSupportMessage(messageId) {
        const message = AppState.supportMessages.find(m => m.id === messageId);
        if (!message) return;

        const modal = document.getElementById('support-message-modal');
        const content = document.getElementById('support-message-content');

        content.innerHTML = `
            <div class="support-message-details">
                <div class="message-header">
                    <h2>${message.subject}</h2>
                    <div class="message-meta">
                        <span class="support-message-status ${message.status}">${message.status}</span>
                        <span class="priority-badge priority-${message.priority}">${message.priority}</span>
                    </div>
                </div>
                
                <div class="message-info">
                    <p><strong>From:</strong> ${message.senderName} (${message.sender})</p>
                    <p><strong>Date:</strong> ${Utils.formatDate(message.sentDate)}</p>
                </div>

                <div class="message-conversation">
                    <div class="message-bubble">
                        <div class="message-bubble-header">
                            <span>${message.senderName}</span>
                            <span>${Utils.formatDate(message.sentDate)}</span>
                        </div>
                        <p>${message.message}</p>
                    </div>
                    
                    ${message.replies.map(reply => `
                        <div class="message-bubble ${reply.sender.includes('admin') ? 'admin' : ''}">
                            <div class="message-bubble-header">
                                <span>${reply.senderName}</span>
                                <span>${Utils.formatDate(reply.sentDate)}</span>
                            </div>
                            <p>${reply.content}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="message-actions">
                    <div class="status-actions">
                        <label>Update Status:</label>
                        <select id="message-status-select">
                            <option value="open" ${message.status === 'open' ? 'selected' : ''}>Open</option>
                            <option value="in-progress" ${message.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="resolved" ${message.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                        <button class="btn-primary btn-sm" onclick="AdminPanel.updateMessageStatus('${message.id}')">
                            Update
                        </button>
                    </div>
                </div>

                <div class="reply-form">
                    <h4>Reply to Message</h4>
                    <textarea id="reply-content" rows="4" placeholder="Type your reply..."></textarea>
                    <button class="btn-primary" onclick="AdminPanel.replyToMessage('${message.id}')">
                        Send Reply
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    },

    updateMessageStatus(messageId) {
        const newStatus = document.getElementById('message-status-select').value;
        SupportSystem.updateMessageStatus(messageId, newStatus);
        Utils.showNotification('Message status updated!');
        this.loadSupport();
        closeModal('support-message-modal');
    },

    replyToMessage(messageId) {
        const replyContent = document.getElementById('reply-content').value.trim();
        if (!replyContent) {
            Utils.showNotification('Please enter a reply message.', 'error');
            return;
        }

        SupportSystem.replyToMessage(messageId, replyContent);
        Utils.showNotification('Reply sent successfully!');
        document.getElementById('reply-content').value = '';
        this.viewSupportMessage(messageId); // Refresh the modal
    },

    setupFilters() {
        // Files filters
        document.getElementById('files-search').addEventListener('input', (e) => {
            AdminState.currentFilters.files.search = e.target.value;
            this.loadFiles();
        });

        document.getElementById('file-type-filter').addEventListener('change', (e) => {
            AdminState.currentFilters.files.type = e.target.value;
            this.loadFiles();
        });

        // Tips filters
        document.getElementById('tips-search').addEventListener('input', (e) => {
            AdminState.currentFilters.tips.search = e.target.value;
            this.loadTips();
        });

        document.getElementById('tips-category-filter').addEventListener('change', (e) => {
            AdminState.currentFilters.tips.category = e.target.value;
            this.loadTips();
        });

        // Users filters
        document.getElementById('users-search').addEventListener('input', (e) => {
            AdminState.currentFilters.users.search = e.target.value;
            this.loadUsers();
        });

        document.getElementById('users-status-filter').addEventListener('change', (e) => {
            AdminState.currentFilters.users.status = e.target.value;
            this.loadUsers();
        });

        // Support filters
        document.getElementById('support-search').addEventListener('input', (e) => {
            AdminState.currentFilters.support.search = e.target.value;
            this.loadSupport();
        });

        document.getElementById('support-status-filter').addEventListener('change', (e) => {
            AdminState.currentFilters.support.status = e.target.value;
            this.loadSupport();
        });

        document.getElementById('support-priority-filter').addEventListener('change', (e) => {
            AdminState.currentFilters.support.priority = e.target.value;
            this.loadSupport();
        });

        // Broadcasts filter
        document.getElementById('broadcasts-search').addEventListener('input', (e) => {
            AdminState.currentFilters.broadcasts.search = e.target.value;
            this.loadBroadcasts();
        });
    }
};

// Add badge styles
const badgeStyles = document.createElement('style');
badgeStyles.textContent = `
    .badge {
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .badge-apk { background: rgba(99, 102, 241, 0.2); color: var(--primary-color); }
    .badge-document { background: rgba(16, 185, 129, 0.2); color: var(--success-color); }
    .badge-image { background: rgba(245, 158, 11, 0.2); color: var(--warning-color); }
    .badge-other { background: rgba(156, 163, 175, 0.2); color: var(--text-muted); }
    .badge-active { background: rgba(16, 185, 129, 0.2); color: var(--success-color); }
    .badge-banned { background: rgba(239, 68, 68, 0.2); color: var(--error-color); }
    
    .priority-badge {
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .priority-low { background: rgba(156, 163, 175, 0.2); color: var(--text-muted); }
    .priority-normal { background: rgba(59, 130, 246, 0.2); color: var(--primary-color); }
    .priority-high { background: rgba(245, 158, 11, 0.2); color: var(--warning-color); }
`;
document.head.appendChild(badgeStyles);

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AdminPanel.init();
});

// Export AdminPanel for global access
window.AdminPanel = AdminPanel;