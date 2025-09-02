// Глобальные переменные
let currentChatId = null;
let chats = [];
let pinnedMessages = [];
let isRecording = false;
let userProfile = {
    name: '',
    profession: '',
    about: ''
};
let currentModel = 'q3-omega';
let currentLanguage = 'ru';
let currentTheme = 'dark';
let currentBackground = 'default';
let state = {
    viewMode: 'chat'
};

// DOM элементы
const elements = {
    // Сайдбар
    sidebar: document.querySelector('.sidebar'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
    menuToggle: document.getElementById('menuToggle'),
    newChatBtn: document.getElementById('newChatBtn'),
    searchToggleBtn: document.getElementById('searchToggleBtn'),
    searchOverlay: document.getElementById('searchOverlay'),
    searchInput: document.getElementById('searchInput'),
    searchCloseBtn: document.getElementById('searchCloseBtn'),
    searchResults: document.getElementById('searchResults'),
    chatList: document.getElementById('chatList'),
    pinnedChatsSection: document.getElementById('pinnedChatsSection'),
    pinnedChatsList: document.getElementById('pinnedChatsList'),
    modelSelectorBtn: document.getElementById('modelSelectorBtn'),
    modelDropdown: document.getElementById('modelDropdown'),
    currentModelName: document.getElementById('currentModelName'),
    subscriptionBtn: document.getElementById('subscriptionBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    pinnedMessagesBtn: document.getElementById('pinnedMessagesBtn'),
    pinnedTextsModal: document.getElementById('pinnedTextsModal'),
    pinnedTextsList: document.getElementById('pinnedTextsList'),
    
    // Основной чат
    chatContainer: document.querySelector('.chat-container'),
    shareBtn: document.getElementById('shareBtn'),
    messagesContainer: document.getElementById('messagesContainer'),
    emptyState: document.getElementById('emptyState'),
    greetingText: document.getElementById('greetingText'),
    messagesList: document.getElementById('messagesList'),
    
    // Форма ввода
    messageForm: document.getElementById('messageForm'),
    messageInput: document.getElementById('messageInput'),
    attachBtn: document.getElementById('attachBtn'),
    fileInput: document.getElementById('fileInput'),
    voiceBtn: document.getElementById('voiceBtn'),
    deepSearchBtn: document.getElementById('deepSearchBtn'),
    deepThinkBtn: document.getElementById('deepThinkBtn'),
    sendBtn: document.getElementById('sendBtn'),
    
    // Настройки
    settingsModal: document.getElementById('settingsModal'),
    subscriptionModal: document.getElementById('subscriptionModal'),
    userName: document.getElementById('userName'),
    userProfession: document.getElementById('userProfession'),
    userAbout: document.getElementById('userAbout'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    
    // Фоны
    backgroundEffects: document.getElementById('backgroundEffects'),
    seasonalBg: document.getElementById('seasonalBg'),
    particlesCanvas: document.getElementById('particlesCanvas')
};

// Particles для фоновых эффектов
let particlesCtx;
let particles = [];
let animationId;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    loadFromLocalStorage();
    setupEventListeners();
    updateTheme();
    updateBackground();
    initParticles();
    updateGreeting();
    
    if (chats.length === 0) {
        createNewChat();
    } else if (currentChatId) {
        selectChat(currentChatId);
    }
    
    renderChatList();
    updatePinnedChatsSection();
}

// Local Storage
function loadFromLocalStorage() {
    const savedState = localStorage.getItem('vertoxState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        chats = parsedState.chats || [];
        currentChatId = parsedState.currentChatId;
        pinnedMessages = parsedState.pinnedMessages || [];
        userProfile = parsedState.userProfile || userProfile;
        currentModel = parsedState.currentModel || 'q3-omega';
        currentLanguage = parsedState.currentLanguage || 'ru';
        currentTheme = parsedState.currentTheme || 'dark';
        currentBackground = parsedState.currentBackground || 'default';
        
        if (userProfile) {
            elements.userName.value = userProfile.name || '';
            elements.userProfession.value = userProfile.profession || '';
            elements.userAbout.value = userProfile.about || '';
        }
        
        const modelNames = {
            'q1': 'Q1',
            'q2-mini': 'Q2 mini',
            'q3-omega': 'Q3 Omega'
        };
        elements.currentModelName.textContent = modelNames[currentModel] || 'Q3 Omega';
        
        document.querySelectorAll('.model-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.model === currentModel);
        });
        
        document.querySelector(`input[name="theme"][value="${currentTheme}"]`).checked = true;
        document.querySelector(`input[name="language"][value="${currentLanguage}"]`).checked = true;
        
        document.querySelectorAll('.bg-card').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.bg === currentBackground);
        });
    }
}

function saveToLocalStorage() {
    const state = {
        chats,
        currentChatId,
        pinnedMessages,
        userProfile,
        currentModel,
        currentLanguage,
        currentTheme,
        currentBackground
    };
    localStorage.setItem('vertoxState', JSON.stringify(state));
}

// Обработчики событий
function setupEventListeners() {
    elements.sidebarToggleBtn.addEventListener('click', toggleSidebar);
    elements.menuToggle.addEventListener('click', toggleSidebar);
    elements.newChatBtn.addEventListener('click', createNewChat);
    
    elements.searchToggleBtn.addEventListener('click', openSearchOverlay);
    elements.searchCloseBtn.addEventListener('click', closeSearchOverlay);
    elements.searchInput.addEventListener('input', performSearch);
    
    elements.modelSelectorBtn.addEventListener('click', toggleModelDropdown);
    
    elements.settingsBtn.addEventListener('click', () => openModal('settingsModal'));
    elements.subscriptionBtn.addEventListener('click', () => openModal('subscriptionModal'));
    elements.pinnedMessagesBtn.addEventListener('click', () => {
        openModal('pinnedTextsModal');
        renderPinnedTexts();
    });
    
    elements.shareBtn.addEventListener('click', shareChat);
    
    elements.messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });
    
    elements.messageInput.addEventListener('input', autoResizeTextarea);
    elements.messageInput.addEventListener('keydown', handleEnterKey);
    
    elements.attachBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);
    elements.voiceBtn.addEventListener('click', toggleVoiceRecording);
    elements.deepSearchBtn.addEventListener('click', () => sendMessage('deepSearch'));
    elements.deepThinkBtn.addEventListener('click', () => sendMessage('deepThink'));
    
    elements.saveProfileBtn.addEventListener('click', saveProfile);
    
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', switchSettingsTab);
    });
    
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', changeTheme);
    });
    
    document.querySelectorAll('input[name="language"]').forEach(radio => {
        radio.addEventListener('change', changeLanguage);
    });
    
    document.querySelectorAll('.bg-card').forEach(btn => {
        btn.addEventListener('click', changeBackground);
    });
    
    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            selectModel(e);
        });
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
    
    document.addEventListener('click', handleDynamicClicks);
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    window.addEventListener('resize', () => {
        if (particlesCtx) {
            const canvas = elements.particlesCanvas;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (currentBackground !== 'default') {
                createSeasonalParticles();
            }
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.model-selector')) {
            elements.modelDropdown.classList.remove('show');
        }
        
        if (!e.target.closest('.chat-menu-btn') && !e.target.closest('.chat-menu')) {
            document.querySelectorAll('.chat-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

// Обработка динамических кликов
function handleDynamicClicks(e) {
    if (e.target.closest('.chat-item')) {
        const chatItem = e.target.closest('.chat-item');
        const chatId = chatItem.dataset.chatId;
        
        if (e.target.closest('.chat-menu-btn')) {
            e.stopPropagation();
            toggleChatMenu(chatId, e.target.closest('.chat-menu-btn'));
        } else if (!e.target.closest('.chat-menu')) {
            selectChat(chatId);
        }
    }
    
    if (e.target.closest('.chat-menu-item')) {
        const action = e.target.closest('.chat-menu-item').dataset.action;
        const chatId = e.target.closest('.chat-menu').dataset.chatId;
        
        switch(action) {
            case 'pin':
                togglePinChat(chatId);
                break;
            case 'edit':
                editChatName(chatId);
                break;
            case 'delete':
                deleteChat(chatId);
                break;
        }
        
        e.target.closest('.chat-menu').classList.remove('show');
    }
    
    if (e.target.closest('.search-result-item')) {
        const chatId = e.target.closest('.search-result-item').dataset.chatId;
        selectChat(chatId);
        closeSearchOverlay();
    }
    
    if (e.target.closest('.pinned-text-item')) {
        const messageId = e.target.closest('.pinned-text-item').dataset.messageId;
        const chatId = e.target.closest('.pinned-text-item').dataset.chatId;
        navigateToPinnedMessage(chatId, messageId);
    }
    
    if (e.target.closest('.pin-message')) {
        const messageId = e.target.closest('.message').dataset.messageId;
        pinMessage(messageId);
    }
    
    if (e.target.closest('.copy-message')) {
        const messageText = e.target.closest('.message').querySelector('.message-text').textContent;
        copyToClipboard(messageText);
    }
}

// Функции чата
function createNewChat() {
    const chatId = Date.now().toString();
    const chatNumber = chats.length + 1;
    
    const newChat = {
        id: chatId,
        name: `Чат ${chatNumber}`,
        messages: [],
        pinned: false,
        createdAt: new Date().toISOString()
    };
    
    chats.unshift(newChat);
    currentChatId = chatId;
    state.viewMode = 'chat';
    
    saveToLocalStorage();
    renderChatList();
    selectChat(chatId);
    updatePinnedChatsSection();
}

function selectChat(chatId) {
    currentChatId = chatId;
    state.viewMode = 'chat';
    
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        renderMessages();
        renderChatList();
    }
    
    saveToLocalStorage();
}

function renderChatList() {
    const pinnedChats = chats.filter(chat => chat.pinned);
    const unpinnedChats = chats.filter(chat => !chat.pinned);
    const sortedUnpinnedChats = unpinnedChats.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    elements.chatList.innerHTML = sortedUnpinnedChats.map(chat => `
        <div class="chat-item ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${chat.id}">
            <span class="chat-title">${chat.name}</span>
            <span class="chat-preview">${getLastMessagePreview(chat)}</span>
            <button class="chat-menu-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                </svg>
            </button>
            <div class="chat-menu" data-chat-id="${chat.id}">
                <button class="chat-menu-item" data-action="pin">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v10m-7.07 4.93a10 10 0 0014.14 0M5 12h14"></path>
                    </svg>
                    Закрепить
                </button>
                <button class="chat-menu-item" data-action="edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Переименовать
                </button>
                <button class="chat-menu-item danger" data-action="delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
    
    updatePinnedChatsSection();
}

function updatePinnedChatsSection() {
    const pinnedChats = chats.filter(chat => chat.pinned);
    
    if (pinnedChats.length > 0) {
        elements.pinnedChatsSection.style.display = 'block';
        elements.pinnedChatsList.innerHTML = pinnedChats.map(chat => `
            <div class="chat-item pinned ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${chat.id}">
                <span class="chat-title">${chat.name}</span>
                <span class="chat-preview">${getLastMessagePreview(chat)}</span>
                <button class="chat-menu-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
                <div class="chat-menu" data-chat-id="${chat.id}">
                    <button class="chat-menu-item" data-action="pin">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v10m-7.07 4.93a10 10 0 0014.14 0M5 12h14"></path>
                        </svg>
                        Открепить
                    </button>
                    <button class="chat-menu-item" data-action="edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Переименовать
                    </button>
                    <button class="chat-menu-item danger" data-action="delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        elements.pinnedChatsSection.style.display = 'none';
    }
}

function getLastMessagePreview(chat) {
    if (chat.messages.length === 0) return 'Нет сообщений';
    const lastMessage = chat.messages[chat.messages.length - 1];
    const preview = lastMessage.text.substring(0, 50);
    return preview + (lastMessage.text.length > 50 ? '...' : '');
}

function deleteChat(chatId) {
    if (chats.length === 1) {
        showNotification('Нельзя удалить последний чат');
        return;
    }
    
    if (confirm('Вы уверены, что хотите удалить этот чат?')) {
        chats = chats.filter(chat => chat.id !== chatId);
        pinnedMessages = pinnedMessages.filter(p => p.chatId !== chatId);
        
        if (currentChatId === chatId) {
            currentChatId = chats[0].id;
            selectChat(currentChatId);
        }
        
        saveToLocalStorage();
        renderChatList();
        showNotification('Чат удален');
    }
}

function editChatName(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    
    const newName = prompt('Введите новое имя чата:', chat.name);
    
    if (newName && newName.trim()) {
        chat.name = newName.trim();
        saveToLocalStorage();
        renderChatList();
        showNotification('Чат переименован');
    }
}

function togglePinChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        chat.pinned = !chat.pinned;
        saveToLocalStorage();
        renderChatList();
    }
}

// Функции сообщений
function sendMessage(mode = 'normal') {
    const input = elements.messageInput;
    const message = input.value.trim();
    
    if (!message && mode === 'normal') return;
    
    const currentChat = chats.find(c => c.id === currentChatId);
    if (!currentChat) return;
    
    if (currentChat.messages.length === 0 && currentChat.name.startsWith('Чат ')) {
        currentChat.name = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        renderChatList();
    }
    
    const messageObj = {
        id: Date.now().toString(),
        text: mode === 'normal' ? message : `[${mode}] ${message}`,
        sender: 'user',
        timestamp: new Date().toISOString(),
        mode: mode
    };
    
    currentChat.messages.push(messageObj);
    
    input.value = '';
    autoResizeTextarea();
    
    renderMessages();
    saveToLocalStorage();
    
    simulateResponse(mode);
}

function renderMessages() {
    const currentChat = chats.find(c => c.id === currentChatId);
    
    if (!currentChat || currentChat.messages.length === 0) {
        elements.emptyState.style.display = 'flex';
        elements.messagesList.style.display = 'none';
        elements.messagesList.innerHTML = '';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.messagesList.style.display = 'block';
    elements.messagesList.classList.add('active');
    
    elements.messagesList.innerHTML = currentChat.messages.map(msg => {
        const isPinned = pinnedMessages.some(p => p.messageId === msg.id);
        const time = formatTime(msg.timestamp);
        const avatar = msg.sender === 'user' ? 'U' : 'V';
        const modeIcon = msg.mode === 'deepThink' ? '🕐' : msg.mode === 'deepSearch' ? '🔍' : '';
        
        return `
            <div class="message ${msg.sender}" data-message-id="${msg.id}">
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-bubble">
                        <div class="message-text">${modeIcon} ${msg.text}</div>
                        <div class="message-actions">
                            <button class="message-action copy-message" title="Копировать">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                                </svg>
                            </button>
                            <button class="message-action pin-message" title="${isPinned ? 'Открепить' : 'Закрепить'}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2v10m-7.07 4.93a10 10 0 0014.14 0M5 12h14"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
    
    scrollToBottom();
}

function simulateResponse(mode) {
    const currentChat = chats.find(c => c.id === currentChatId);
    if (!currentChat) return;
    
    const typingHTML = `
        <div class="message assistant typing-message">
            <div class="message-avatar">V</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    
    elements.messagesList.insertAdjacentHTML('beforeend', typingHTML);
    scrollToBottom();
    
    const delay = mode === 'deepThink' ? 3000 : mode === 'deepSearch' ? 2000 : 1000;
    
    setTimeout(() => {
        const typingMsg = document.querySelector('.typing-message');
        if (typingMsg) typingMsg.remove();
        
        let responseText = '';
        const userName = userProfile.name || 'пользователь';
        
        if (mode === 'deepThink') {
            responseText = `После глубокого анализа вашего запроса, ${userName}, я пришел к следующим выводам...`;
        } else if (mode === 'deepSearch') {
            responseText = `Я провел расширенный поиск по вашему запросу. Вот что удалось найти...`;
        } else {
            responseText = `Спасибо за ваш вопрос, ${userName}! Я здесь, чтобы помочь вам. Это демо-версия VertoX с моделью ${currentModel}.`;
        }
        
        const response = {
            id: Date.now().toString(),
            text: responseText,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            mode: 'normal'
        };
        
        currentChat.messages.push(response);
        renderMessages();
        saveToLocalStorage();
    }, delay);
}

// Закрепление сообщений
function pinMessage(messageId) {
    const currentChat = chats.find(c => c.id === currentChatId);
    if (!currentChat) return;
    
    const message = currentChat.messages.find(m => m.id === messageId);
    if (!message) return;
    
    const pinnedIndex = pinnedMessages.findIndex(p => p.messageId === messageId);
    
    if (pinnedIndex > -1) {
        pinnedMessages.splice(pinnedIndex, 1);
        showNotification('Сообщение откреплено');
    } else {
        pinnedMessages.push({
            id: Date.now().toString(),
            messageId: message.id,
            chatId: currentChatId,
            chatName: currentChat.name,
            text: message.text,
            sender: message.sender,
            pinnedAt: new Date().toISOString()
        });
        showNotification('Сообщение закреплено');
    }
    
    saveToLocalStorage();
    renderMessages();
}

// Отображение закрепленных текстов
function renderPinnedTexts() {
    if (pinnedMessages.length === 0) {
        elements.pinnedTextsList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Нет закрепленных сообщений</p>';
        return;
    }
    
    elements.pinnedTextsList.innerHTML = pinnedMessages.map(pinned => {
        const preview = pinned.text.substring(0, 100) + (pinned.text.length > 100 ? '...' : '');
        return `
            <div class="pinned-text-item" data-message-id="${pinned.messageId}" data-chat-id="${pinned.chatId}">
                <div class="pinned-text-header">
                    <span class="pinned-chat-name">${pinned.chatName}</span>
                    <span class="pinned-sender">${pinned.sender === 'user' ? 'Вы' : 'VertoX'}</span>
                </div>
                <div class="pinned-text-content">${preview}</div>
            </div>
        `;
    }).join('');
}

// Навигация к закрепленному сообщению
function navigateToPinnedMessage(chatId, messageId) {
    selectChat(chatId);
    closeModal('pinnedTextsModal');
    
    setTimeout(() => {
        const message = document.querySelector(`[data-message-id="${messageId}"]`);
        if (message) {
            message.scrollIntoView({ behavior: 'smooth', block: 'center' });
            message.style.animation = 'highlight 2s ease';
            setTimeout(() => {
                message.style.animation = '';
            }, 2000);
        }
    }, 300);
}

// Поиск с предпросмотром
function openSearchOverlay() {
    elements.searchOverlay.classList.add('show');
    elements.searchInput.focus();
    displayAllChatsWithPreview();
}

function closeSearchOverlay() {
    elements.searchOverlay.classList.remove('show');
    elements.searchInput.value = '';
    elements.searchResults.innerHTML = '';
}

function performSearch() {
    const query = elements.searchInput.value.toLowerCase();
    
    if (query.trim() === '') {
        displayAllChatsWithPreview();
        return;
    }
    
    const filteredChats = chats.filter(chat => {
        const titleMatch = chat.name.toLowerCase().includes(query);
        const messagesMatch = chat.messages.some(msg => 
            msg.text.toLowerCase().includes(query)
        );
        return titleMatch || messagesMatch;
    });
    
    displaySearchResultsWithPreview(filteredChats, query);
}

function displayAllChatsWithPreview() {
    displaySearchResultsWithPreview(chats);
}

function displaySearchResultsWithPreview(results, searchQuery = '') {
    if (results.length === 0) {
        elements.searchResults.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary); font-size: 18px;">Ничего не найдено</p>';
        return;
    }
    
    elements.searchResults.innerHTML = results.map(chat => {
        const lastMessages = chat.messages.slice(-3).reverse();
        const date = formatDate(chat.createdAt);
        
        const messagesPreview = lastMessages.map(msg => {
            let text = msg.text;
            if (searchQuery) {
                const regex = new RegExp(`(${searchQuery})`, 'gi');
                text = text.replace(regex, '<mark>$1</mark>');
            }
            return `
                <div class="search-message-preview">
                    <span class="search-message-sender">${msg.sender === 'user' ? 'Вы' : 'VertoX'}:</span>
                    <span class="search-message-text">${text.substring(0, 150)}${text.length > 150 ? '...' : ''}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="search-result-item" data-chat-id="${chat.id}">
                <div class="search-result-header">
                    <span class="search-result-title">${chat.name}</span>
                    <span class="search-result-date">${date}</span>
                </div>
                <div class="search-messages-preview">
                    ${messagesPreview || '<div class="search-message-preview">Нет сообщений в этом чате</div>'}
                </div>
            </div>
        `;
    }).join('');
}

// Фоны и анимации
function updateBackground() {
    elements.seasonalBg.classList.remove('active', 'none', 'spring', 'summer', 'autumn', 'winter', 'space');
    
    if (currentBackground === 'default') {
        elements.seasonalBg.classList.add('none');
        elements.backgroundEffects.style.display = 'none';
        stopParticles();
    } else {
        elements.backgroundEffects.style.display = 'block';
        elements.seasonalBg.classList.add(currentBackground, 'active');
        startParticles();
    }
}

// Particles Animation
function initParticles() {
    const canvas = elements.particlesCanvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesCtx = canvas.getContext('2d');
    
    if (currentBackground !== 'default') {
        elements.backgroundEffects.style.display = 'block';
        createSeasonalParticles();
        animateParticles();
    }
}

function createSeasonalParticles() {
    particles = [];
    const particleCount = currentBackground === 'space' ? 200 : 100;
    
    for (let i = 0; i < particleCount; i++) {
        if (currentBackground === 'space') {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.1,
                speedY: (Math.random() - 0.5) * 0.1,
                opacity: Math.random() * 0.8 + 0.2,
                twinkle: Math.random() * Math.PI * 2
            });
        } else {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight - window.innerHeight,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 1,
                speedY: Math.random() * 2 + 1,
                opacity: Math.random() * 0.6 + 0.4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }
}

function animateParticles() {
    if (!particlesCtx || currentBackground === 'default') return;
    
    particlesCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    particles.forEach(particle => {
        particlesCtx.save();
        
        if (currentBackground === 'winter') {
            particle.y += particle.speedY;
            particle.x += Math.sin(particle.y * 0.01) * 0.5 + particle.speedX;
            
            particlesCtx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            particlesCtx.beginPath();
            particlesCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            particlesCtx.fill();
            
        } else if (currentBackground === 'autumn') {
            particle.y += particle.speedY;
            particle.x += Math.sin(particle.y * 0.02) * 2 + particle.speedX;
            particle.rotation += particle.rotationSpeed;
            
            particlesCtx.translate(particle.x, particle.y);
            particlesCtx.rotate(particle.rotation);
            particlesCtx.fillStyle = `rgba(${255 - Math.random() * 50}, ${140 - Math.random() * 40}, 0, ${particle.opacity})`;
            particlesCtx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size * 1.5);
            
        } else if (currentBackground === 'spring') {
            particle.y += particle.speedY;
            particle.x += Math.sin(particle.y * 0.02) * 3 + particle.speedX;
            particle.rotation += particle.rotationSpeed;
            
            particlesCtx.translate(particle.x, particle.y);
            particlesCtx.rotate(particle.rotation);
            particlesCtx.fillStyle = `rgba(255, ${182 + Math.random() * 40}, ${193 + Math.random() * 30}, ${particle.opacity})`;
            particlesCtx.beginPath();
            particlesCtx.ellipse(0, 0, particle.size, particle.size * 2, 0, 0, Math.PI * 2);
            particlesCtx.fill();
            
        } else if (currentBackground === 'summer') {
            particle.y += particle.speedY * 0.5;
            particle.x += particle.speedX * 0.5;
            
            const gradient = particlesCtx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
            gradient.addColorStop(0, `rgba(255, 255, 0, ${particle.opacity})`);
            gradient.addColorStop(1, `rgba(255, 165, 0, 0)`);
            particlesCtx.fillStyle = gradient;
            particlesCtx.beginPath();
            particlesCtx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            particlesCtx.fill();
            
        } else if (currentBackground === 'space') {
            particle.twinkle += 0.05;
            const twinkleOpacity = (Math.sin(particle.twinkle) * 0.5 + 0.5) * particle.opacity;
            
            particlesCtx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
            particlesCtx.beginPath();
            particlesCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            particlesCtx.fill();
            
            if (particle.size > 1.5) {
                const glowGradient = particlesCtx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 3);
                glowGradient.addColorStop(0, `rgba(255, 255, 255, ${twinkleOpacity * 0.5})`);
                glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                particlesCtx.fillStyle = glowGradient;
                particlesCtx.beginPath();
                particlesCtx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
                particlesCtx.fill();
            }
            
            particle.x += particle.speedX;
            particle.y += particle.speedY;
        }
        
        particlesCtx.restore();
        
        if (particle.y > window.innerHeight + 10) {
            particle.y = -10;
            particle.x = Math.random() * window.innerWidth;
        }
        if (particle.x > window.innerWidth + 10) {
            particle.x = -10;
        }
        if (particle.x < -10) {
            particle.x = window.innerWidth + 10;
        }
    });
    
    animationId = requestAnimationFrame(animateParticles);
}

function startParticles() {
    createSeasonalParticles();
    animateParticles();
}

function stopParticles() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (particlesCtx) {
        particlesCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    particles = [];
}

// Голосовые сообщения
function toggleVoiceRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    isRecording = true;
    elements.voiceBtn.classList.add('recording');
    showNotification('Запись началась...');
    
    setTimeout(() => {
        if (isRecording) {
            stopRecording();
        }
    }, 60000);
}

function stopRecording() {
    isRecording = false;
    elements.voiceBtn.classList.remove('recording');
    
    const currentChat = chats.find(c => c.id === currentChatId);
    if (!currentChat) return;
    
    const messageObj = {
        id: Date.now().toString(),
        text: '🎤 Голосовое сообщение (0:03)',
        sender: 'user',
        timestamp: new Date().toISOString(),
        type: 'voice'
    };
    
    currentChat.messages.push(messageObj);
    renderMessages();
    saveToLocalStorage();
    
    showNotification('Голосовое сообщение отправлено');
    simulateResponse();
}

// Работа с файлами
function handleFileUpload(e) {
    const files = e.target.files;
    if (files.length === 0) return;
    
    const fileNames = Array.from(files).map(file => file.name).join(', ');
    const message = `Прикреплены файлы: ${fileNames}`;
    
    const currentChat = chats.find(c => c.id === currentChatId);
    if (!currentChat) return;
    
    const messageObj = {
        id: Date.now().toString(),
        text: message,
        sender: 'user',
        timestamp: new Date().toISOString(),
        files: Array.from(files).map(file => ({
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type
        }))
    };
    
    currentChat.messages.push(messageObj);
    renderMessages();
    saveToLocalStorage();
    
    e.target.value = '';
    simulateResponse();
}

// Настройки пользователя
function saveProfile() {
    userProfile = {
        name: elements.userName.value.trim(),
        profession: elements.userProfession.value.trim(),
        about: elements.userAbout.value.trim()
    };
    
    saveToLocalStorage();
    updateGreeting();
    
    const btn = elements.saveProfileBtn;
    const originalText = btn.textContent;
    btn.textContent = 'Сохранено!';
    btn.style.background = 'var(--green-500)';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

function updateGreeting() {
    if (userProfile.name) {
        elements.greetingText.textContent = `Привет, ${userProfile.name}! Чем могу помочь?`;
    } else {
        elements.greetingText.textContent = 'Чем могу помочь?';
    }
}

// Темы и внешний вид
function changeTheme(e) {
    const theme = e.target.value;
    currentTheme = theme;
    updateTheme();
    saveToLocalStorage();
}

function updateTheme() {
    document.body.className = `${currentTheme}-theme`;
}

function changeBackground(e) {
    const bg = e.currentTarget.dataset.bg;
    currentBackground = bg;
    
    document.querySelectorAll('.bg-card').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.bg === bg);
    });
    
    updateBackground();
    saveToLocalStorage();
}

function changeLanguage(e) {
    currentLanguage = e.target.value;
    saveToLocalStorage();
    showNotification(`Язык изменен на ${currentLanguage === 'ru' ? 'Русский' : 'English'}`);
}

// Вспомогательные функции
function toggleSidebar() {
    elements.sidebar.classList.toggle('collapsed');
    elements.chatContainer.classList.toggle('expanded');
}

function toggleChatMenu(chatId, button) {
    const menu = button.nextElementSibling;
    const isShown = menu.classList.contains('show');
    
    document.querySelectorAll('.chat-menu').forEach(m => {
        m.classList.remove('show');
    });
    
    if (!isShown) {
        menu.classList.add('show');
    }
}

function switchSettingsTab(e) {
    const tab = e.target;
    const tabName = tab.dataset.tab;
    
    document.querySelectorAll('.settings-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${tabName}Panel`);
    });
}

function switchTab(e) {
    const tab = e.target.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });
}

function shareChat() {
    const currentChat = chats.find(c => c.id === currentChatId);
    if (!currentChat || currentChat.messages.length === 0) {
        showNotification('Нечего делиться - чат пуст');
        return;
    }
    
    let shareText = `VertoX Chat: ${currentChat.name}\n\n`;
    currentChat.messages.forEach(msg => {
        const author = msg.sender === 'user' ? userProfile.name || 'Вы' : 'VertoX';
        shareText += `${author}: ${msg.text}\n\n`;
    });
    
    copyToClipboard(shareText);
    
    elements.shareBtn.style.background = 'var(--green-500)';
    setTimeout(() => {
        elements.shareBtn.style.background = '';
    }, 2000);
}

// Модель
function toggleModelDropdown() {
    elements.modelDropdown.classList.toggle('show');
}

function selectModel(e) {
    const option = e.target.closest('.model-option');
    if (!option) return;
    
    const model = option.dataset.model;
    currentModel = model;
    
    document.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.model === model);
    });
    
    const modelNames = {
        'q1': 'Q1',
        'q2-mini': 'Q2 mini',
        'q3-omega': 'Q3 Omega'
    };
    
    elements.currentModelName.textContent = modelNames[model];
    elements.modelDropdown.classList.remove('show');
    
    saveToLocalStorage();
    showNotification(`Модель изменена на ${modelNames[model]}`);
}

function handleEnterKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function handleKeyboardShortcuts(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        if (elements.searchOverlay.classList.contains('show')) {
            closeSearchOverlay();
        }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        createNewChat();
    }
}

function autoResizeTextarea() {
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('Скопировано в буфер обмена');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дней назад`;
    
    return date.toLocaleDateString('ru-RU');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--primary-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Модальные окна
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    document.body.style.overflow = '';
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// Анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight {
        0%, 100% { background-color: transparent; }
        50% { background-color: rgba(16, 163, 127, 0.2); }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);