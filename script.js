// Application State
const AppState = {
    currentUser: null,
    isAdmin: false,
    theme: 'light',
    users: JSON.parse(localStorage.getItem('eip_users') || '[]'),
    admin: { username: 'admin', password: 'admin2024' },
    files: JSON.parse(localStorage.getItem('eip_files') || '[]'),
    tips: JSON.parse(localStorage.getItem('eip_tips') || '[]'),
    broadcasts: JSON.parse(localStorage.getItem('eip_broadcasts') || '[]'),
    supportMessages: JSON.parse(localStorage.getItem('eip_support') || '[]'),
    bannedUsers: JSON.parse(localStorage.getItem('eip_banned') || '[]')
};

// DOM Elements
const elements = {
    navbar: document.getElementById('navbar'),
    navToggle: document.getElementById('nav-toggle'),
    navMenu: document.getElementById('nav-menu'),
    themeToggle: document.getElementById('theme-toggle'),
    loginModal: document.getElementById('login-modal'),
    signupModal: document.getElementById('signup-modal'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form')
};

// Utility Functions
const Utils = {
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    
    formatDate: (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },
    
    sanitizeInput: (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },
    
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    saveToStorage: (key, data) => {
        localStorage.setItem(`eip_${key}`, JSON.stringify(data));
    },
    
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// Theme Management
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('eip_theme') || 'light';
        this.setTheme(savedTheme);
        elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    },
    
    setTheme(theme) {
        AppState.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('eip_theme', theme);
        
        const icon = elements.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    },
    
    toggleTheme() {
        const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
};

// Authentication System
const Auth = {
    init() {
        this.bindEvents();
        this.checkAuth();
    },
    
    bindEvents() {
        elements.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        elements.signupForm?.addEventListener('submit', (e) => this.handleSignup(e));
    },
    
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Check admin credentials
        if (email === 'admin@eip.com' && password === AppState.admin.password) {
            AppState.currentUser = { email: 'admin@eip.com', name: 'Administrator', isAdmin: true };
            AppState.isAdmin = true;
            Utils.showNotification('Admin login successful!');
            this.redirectToDashboard();
            closeModal('login-modal');
            return;
        }
        
        // Check user credentials
        const user = AppState.users.find(u => u.email === email && u.password === password);
        if (user) {
            if (AppState.bannedUsers.includes(user.email)) {
                Utils.showNotification('Your account has been banned. Contact support.', 'error');
                return;
            }
            
            AppState.currentUser = user;
            AppState.isAdmin = false;
            Utils.showNotification(`Welcome back, ${user.name}!`);
            this.redirectToDashboard();
            closeModal('login-modal');
        } else {
            Utils.showNotification('Invalid credentials!', 'error');
        }
    },
    
    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        if (!Utils.validateEmail(email)) {
            Utils.showNotification('Please enter a valid email!', 'error');
            return;
        }
        
        if (password.length < 6) {
            Utils.showNotification('Password must be at least 6 characters!', 'error');
            return;
        }
        
        if (AppState.users.find(u => u.email === email)) {
            Utils.showNotification('Email already exists!', 'error');
            return;
        }
        
        const user = {
            id: Utils.generateId(),
            name: Utils.sanitizeInput(name),
            email: email,
            password: password,
            joinDate: new Date().toISOString(),
            isAdmin: false
        };
        
        AppState.users.push(user);
        Utils.saveToStorage('users', AppState.users);
        
        AppState.currentUser = user;
        Utils.showNotification(`Account created successfully! Welcome, ${user.name}!`);
        this.redirectToDashboard();
        closeModal('signup-modal');
    },
    
    logout() {
        AppState.currentUser = null;
        AppState.isAdmin = false;
        Utils.showNotification('Logged out successfully!');
        window.location.href = 'index.html';
    },
    
    checkAuth() {
        const savedUser = localStorage.getItem('eip_current_user');
        if (savedUser) {
            AppState.currentUser = JSON.parse(savedUser);
            AppState.isAdmin = AppState.currentUser?.isAdmin || false;
        }
    },
    
    redirectToDashboard() {
        localStorage.setItem('eip_current_user', JSON.stringify(AppState.currentUser));
        if (AppState.isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
};

// Navigation
const Navigation = {
    init() {
        this.bindEvents();
        this.updateNavigation();
    },
    
    bindEvents() {
        elements.navToggle?.addEventListener('click', () => this.toggleMobile());
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!elements.navbar?.contains(e.target)) {
                elements.navMenu?.classList.remove('active');
            }
        });
        
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    },
    
    toggleMobile() {
        elements.navMenu?.classList.toggle('active');
    },
    
    updateNavigation() {
        if (AppState.currentUser) {
            // Update navigation for logged-in users
            const authButtons = document.querySelector('.nav-auth');
            if (authButtons) {
                authButtons.innerHTML = `
                    <span>Welcome, ${AppState.currentUser.name}</span>
                    <button class="btn-secondary" onclick="Auth.logout()">Logout</button>
                `;
            }
        }
    }
};

// Animations and Effects
const Animations = {
    init() {
        this.animateCounters();
        this.setupScrollAnimations();
        this.setupParallax();
    },
    
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        
        const animateCounter = (counter) => {
            const target = parseInt(counter.getAttribute('data-count'));
            const increment = target / 100;
            let current = 0;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target + (counter.getAttribute('data-count') === '99' ? '%' : '+');
                }
            };
            
            updateCounter();
        };
        
        // Intersection Observer for triggering animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });
        
        counters.forEach(counter => observer.observe(counter));
    },
    
    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.fade-in, [data-aos]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        animatedElements.forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
    },
    
    setupParallax() {
        const shapes = document.querySelectorAll('.shape');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            shapes.forEach((shape, index) => {
                const speed = 0.5 + (index * 0.1);
                shape.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }
};

// File Manager
const FileManager = {
    uploadFile(file, type = 'file') {
        const fileData = {
            id: Utils.generateId(),
            name: file.name,
            size: file.size,
            type: type,
            uploadDate: new Date().toISOString(),
            uploader: AppState.currentUser?.email || 'admin'
        };
        
        AppState.files.push(fileData);
        Utils.saveToStorage('files', AppState.files);
        return fileData;
    },
    
    deleteFile(fileId) {
        AppState.files = AppState.files.filter(f => f.id !== fileId);
        Utils.saveToStorage('files', AppState.files);
    },
    
    getFiles(type = null) {
        if (type) {
            return AppState.files.filter(f => f.type === type);
        }
        return AppState.files;
    }
};

// Tips Manager
const TipsManager = {
    addTip(title, content, category = 'general') {
        const tip = {
            id: Utils.generateId(),
            title: Utils.sanitizeInput(title),
            content: Utils.sanitizeInput(content),
            category: category,
            author: AppState.currentUser?.email || 'admin',
            createdDate: new Date().toISOString()
        };
        
        AppState.tips.push(tip);
        Utils.saveToStorage('tips', AppState.tips);
        return tip;
    },
    
    deleteTip(tipId) {
        AppState.tips = AppState.tips.filter(t => t.id !== tipId);
        Utils.saveToStorage('tips', AppState.tips);
    },
    
    getTips(limit = null) {
        const sorted = AppState.tips.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        return limit ? sorted.slice(0, limit) : sorted;
    }
};

// Broadcast Manager
const BroadcastManager = {
    sendBroadcast(title, message, priority = 'normal') {
        const broadcast = {
            id: Utils.generateId(),
            title: Utils.sanitizeInput(title),
            message: Utils.sanitizeInput(message),
            priority: priority,
            sender: AppState.currentUser?.email || 'admin',
            sentDate: new Date().toISOString(),
            read: []
        };
        
        AppState.broadcasts.push(broadcast);
        Utils.saveToStorage('broadcasts', AppState.broadcasts);
        return broadcast;
    },
    
    markAsRead(broadcastId, userId) {
        const broadcast = AppState.broadcasts.find(b => b.id === broadcastId);
        if (broadcast && !broadcast.read.includes(userId)) {
            broadcast.read.push(userId);
            Utils.saveToStorage('broadcasts', AppState.broadcasts);
        }
    },
    
    getUnreadBroadcasts(userId) {
        return AppState.broadcasts.filter(b => !b.read.includes(userId));
    }
};

// Support System
const SupportSystem = {
    sendMessage(subject, message, priority = 'normal') {
        const supportMessage = {
            id: Utils.generateId(),
            subject: Utils.sanitizeInput(subject),
            message: Utils.sanitizeInput(message),
            priority: priority,
            sender: AppState.currentUser?.email || 'anonymous',
            senderName: AppState.currentUser?.name || 'Anonymous',
            sentDate: new Date().toISOString(),
            status: 'open',
            replies: []
        };
        
        AppState.supportMessages.push(supportMessage);
        Utils.saveToStorage('support', AppState.supportMessages);
        return supportMessage;
    },
    
    replyToMessage(messageId, reply) {
        const message = AppState.supportMessages.find(m => m.id === messageId);
        if (message) {
            message.replies.push({
                id: Utils.generateId(),
                content: Utils.sanitizeInput(reply),
                sender: AppState.currentUser?.email || 'admin',
                senderName: AppState.currentUser?.name || 'Admin',
                sentDate: new Date().toISOString()
            });
            Utils.saveToStorage('support', AppState.supportMessages);
        }
    },
    
    updateMessageStatus(messageId, status) {
        const message = AppState.supportMessages.find(m => m.id === messageId);
        if (message) {
            message.status = status;
            Utils.saveToStorage('support', AppState.supportMessages);
        }
    }
};

// User Management
const UserManager = {
    banUser(userEmail) {
        if (!AppState.bannedUsers.includes(userEmail)) {
            AppState.bannedUsers.push(userEmail);
            Utils.saveToStorage('banned', AppState.bannedUsers);
        }
    },
    
    unbanUser(userEmail) {
        AppState.bannedUsers = AppState.bannedUsers.filter(email => email !== userEmail);
        Utils.saveToStorage('banned', AppState.bannedUsers);
    },
    
    isUserBanned(userEmail) {
        return AppState.bannedUsers.includes(userEmail);
    },
    
    getUserStats() {
        return {
            totalUsers: AppState.users.length,
            bannedUsers: AppState.bannedUsers.length,
            activeUsers: AppState.users.length - AppState.bannedUsers.length
        };
    }
};

// Modal Functions
function showLoginModal() {
    elements.loginModal.style.display = 'block';
}

function showSignupModal() {
    elements.signupModal.style.display = 'block';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function switchModal(fromModalId, toModalId) {
    closeModal(fromModalId);
    const toModal = document.getElementById(toModalId);
    if (toModal) {
        toModal.style.display = 'block';
    }
}

// Helper Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showContactModal() {
    // Create contact modal dynamically
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'contact-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('contact-modal')">&times;</span>
            <h2>Contact Support</h2>
            <form id="contact-form">
                <div class="form-group">
                    <label for="contact-subject">Subject</label>
                    <input type="text" id="contact-subject" required>
                </div>
                <div class="form-group">
                    <label for="contact-message">Message</label>
                    <textarea id="contact-message" rows="5" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); resize: vertical;" required></textarea>
                </div>
                <div class="form-group">
                    <label for="contact-priority">Priority</label>
                    <select id="contact-priority" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        <option value="low">Low</option>
                        <option value="normal" selected>Normal</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Send Message</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Handle form submission
    document.getElementById('contact-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = document.getElementById('contact-subject').value;
        const message = document.getElementById('contact-message').value;
        const priority = document.getElementById('contact-priority').value;
        
        SupportSystem.sendMessage(subject, message, priority);
        Utils.showNotification('Message sent successfully!');
        closeModal('contact-modal');
        setTimeout(() => modal.remove(), 300);
    });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    Auth.init();
    Navigation.init();
    Animations.init();
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Initialize sample data if empty
    if (AppState.tips.length === 0) {
        TipsManager.addTip(
            'Productivity Hack: Time Blocking',
            'Time blocking involves scheduling specific blocks of time for different activities. This helps you stay focused and ensures important tasks get done.',
            'productivity'
        );
        
        TipsManager.addTip(
            'Keyboard Shortcut: Quick Screenshot',
            'On Windows, use Win + Shift + S to quickly capture screenshots. On Mac, use Cmd + Shift + 4 for area selection.',
            'technology'
        );
        
        TipsManager.addTip(
            'Health Tip: 20-20-20 Rule',
            'Every 20 minutes, look at something 20 feet away for at least 20 seconds. This helps reduce eye strain from screen time.',
            'health'
        );
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification {
            animation: slideIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
});

// Export for use in other files
window.AppState = AppState;
window.Utils = Utils;
window.Auth = Auth;
window.FileManager = FileManager;
window.TipsManager = TipsManager;
window.BroadcastManager = BroadcastManager;
window.SupportSystem = SupportSystem;
window.UserManager = UserManager;