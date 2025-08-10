// Chat Application JavaScript
class ChatApp {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.initElements();
        this.initEventListeners();
        this.loadTheme();
        this.messageInput.focus();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    initElements() {
        // Main elements
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.charCount = document.getElementById('charCount');
        
        // Buttons
        this.themeToggle = document.getElementById('themeToggle');
        this.clearChat = document.getElementById('clearChat');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.attachBtn = document.getElementById('attachBtn');
        
        // Emoji picker
        this.emojiPicker = document.getElementById('emojiPicker');
        
        // Quick options
        this.quickOptions = document.querySelectorAll('.quick-option');
    }

    initEventListeners() {
        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Character counter
        this.messageInput.addEventListener('input', () => {
            this.charCount.textContent = this.messageInput.value.length;
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Clear chat
        this.clearChat.addEventListener('click', () => this.clearConversation());

        // Emoji picker
        this.emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());
        
        // Emoji selection
        document.querySelectorAll('.emoji').forEach(emoji => {
            emoji.addEventListener('click', (e) => {
                this.insertEmoji(e.target.textContent);
            });
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.emojiBtn.contains(e.target) && !this.emojiPicker.contains(e.target)) {
                this.emojiPicker.style.display = 'none';
            }
        });

        // Attach button (placeholder functionality)
        this.attachBtn.addEventListener('click', () => {
            this.showNotification('Funcionalidade de anexo em desenvolvimento', 'info');
        });

        // Quick options
        this.quickOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const message = e.currentTarget.getAttribute('data-message');
                this.messageInput.value = message;
                this.sendMessage();
            });
        });
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update theme icon
        const icon = this.themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        
        // Update theme icon
        const icon = this.themeToggle.querySelector('i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleEmojiPicker() {
        const isVisible = this.emojiPicker.style.display === 'block';
        this.emojiPicker.style.display = isVisible ? 'none' : 'block';
    }

    insertEmoji(emoji) {
        const cursorPos = this.messageInput.selectionStart;
        const textBefore = this.messageInput.value.substring(0, cursorPos);
        const textAfter = this.messageInput.value.substring(cursorPos);
        
        this.messageInput.value = textBefore + emoji + textAfter;
        this.messageInput.focus();
        this.messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        
        // Update character count
        this.charCount.textContent = this.messageInput.value.length;
        
        // Hide emoji picker
        this.emojiPicker.style.display = 'none';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message) {
            return;
        }

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.charCount.textContent = '0';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to backend
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId
                })
            });

            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage(data.response, 'bot');
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.', 'bot');
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'user' 
            ? '<i class="fas fa-user"></i>' 
            : '<i class="fas fa-robot"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Process markdown-like formatting
        const formattedContent = this.formatMessage(content);
        bubbleDiv.innerHTML = formattedContent;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();
        
        contentDiv.appendChild(bubbleDiv);
        contentDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        // Remove welcome message if it exists
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Convert markdown-like syntax to HTML
        let formatted = content;
        
        // Bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Bullet points
        formatted = formatted.replace(/• /g, '&bull; ');
        
        // Headers (simple)
        formatted = formatted.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
        formatted = formatted.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
        formatted = formatted.replace(/^# (.*?)$/gm, '<h2>$1</h2>');
        
        return formatted;
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    async clearConversation() {
        if (!confirm('Tem certeza que deseja limpar toda a conversa?')) {
            return;
        }

        try {
            // Reset conversation on backend
            await fetch('/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId
                })
            });

            // Clear chat messages
            this.chatMessages.innerHTML = '';
            
            // Add welcome message back
            this.addWelcomeMessage();
            
            // Generate new session ID
            this.sessionId = this.generateSessionId();
            
            this.showNotification('Conversa limpa com sucesso', 'success');
            
        } catch (error) {
            console.error('Error clearing conversation:', error);
            this.showNotification('Erro ao limpar conversa', 'error');
        }
    }

    addWelcomeMessage() {
        const welcomeHTML = `
            <div class="message bot-message welcome-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <h3>👋 Bem-vindo ao Terminal Rodoviário!</h3>
                        <p>Sou seu assistente virtual e estou aqui para ajudar com:</p>
                        <div class="quick-options">
                            <button class="quick-option" data-message="Quais serviços vocês tem?">
                                <i class="fas fa-concierge-bell"></i>
                                <span>Nossos Serviços</span>
                            </button>
                            <button class="quick-option" data-message="Informações sobre passagens">
                                <i class="fas fa-ticket-alt"></i>
                                <span>Passagens</span>
                            </button>
                            <button class="quick-option" data-message="Quero enviar uma encomenda">
                                <i class="fas fa-box"></i>
                                <span>Encomendas</span>
                            </button>
                            <button class="quick-option" data-message="Horários de funcionamento">
                                <i class="fas fa-clock"></i>
                                <span>Horários</span>
                            </button>
                            <button class="quick-option" data-message="Opções de alimentação">
                                <i class="fas fa-utensils"></i>
                                <span>Alimentação</span>
                            </button>
                            <button class="quick-option" data-message="Falar com atendente">
                                <i class="fas fa-headset"></i>
                                <span>Atendente</span>
                            </button>
                        </div>
                    </div>
                    <div class="message-time">${this.getCurrentTime()}</div>
                </div>
            </div>
        `;
        
        this.chatMessages.innerHTML = welcomeHTML;
        
        // Re-attach quick option listeners
        this.quickOptions = document.querySelectorAll('.quick-option');
        this.quickOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const message = e.currentTarget.getAttribute('data-message');
                this.messageInput.value = message;
                this.sendMessage();
            });
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize chat app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});

// Add slideOutRight animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);