// client/script.js
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let currentUser = null;
    
    // DOM elements
    const loginModal = document.getElementById('login-modal');
    const userIdInput = document.getElementById('user-id');
    const usernameInput = document.getElementById('username');
    const joinBtn = document.getElementById('join-btn');
    const chatContainer = document.querySelector('.chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('file-input');
    const fileBtn = document.getElementById('file-btn');
    const userList = document.getElementById('user-list');
    const onlineCount = document.getElementById('online-count');
    
    // Join chat
    joinBtn.addEventListener('click', () => {
        const userId = userIdInput.value.trim();
        const username = usernameInput.value.trim();
        
        if (userId && username) {
            currentUser = { userId, username };
            socket.emit('join', userId, username);
            loginModal.style.display = 'none';
            chatContainer.style.display = 'flex';
        }
    });
    
    // Send message
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text) {
            socket.emit('send-message', { text });
            addMessageToChat(currentUser.userId, currentUser.username, text);
            messageInput.value = '';
        }
    }
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Send button click
    sendBtn.addEventListener('click', sendMessage);
    
    // File upload
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Show loading state
        fileBtn.textContent = '⏳';
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.url) {
                socket.emit('send-message', { 
                    text: messageInput.value.trim(),
                    fileUrl: data.url,
                    fileName: file.name,
                    fileType: file.type
                });
                
                addMessageToChat(
                    currentUser.userId, 
                    currentUser.username, 
                    messageInput.value.trim(),
                    {
                        url: data.url,
                        name: file.name,
                        type: file.type
                    }
                );
                
                messageInput.value = '';
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            fileBtn.textContent = '📎';
            fileInput.value = '';
        }
    });
    
    // Add message to chat UI
    function addMessageToChat(userId, username, text, file = null) {
        const isCurrentUser = userId === currentUser.userId;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'message-info';
        infoDiv.textContent = username;
        
        messageDiv.appendChild(infoDiv);
        
        if (file) {
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = file.url;
                img.className = 'media-preview';
                messageDiv.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = file.url;
                video.className = 'media-preview';
                video.controls = true;
                messageDiv.appendChild(video);
            } else {
                const fileLink = document.createElement('a');
                fileLink.href = file.url;
                fileLink.className = 'file-preview';
                fileLink.textContent = `📄 ${file.name}`;
                fileLink.target = '_blank';
                messageDiv.appendChild(fileLink);
            }
            
            if (text) {
                const textDiv = document.createElement('div');
                textDiv.textContent = text;
                textDiv.style.marginTop = '8px';
                messageDiv.appendChild(textDiv);
            }
        } else if (text) {
            const textDiv = document.createElement('div');
            textDiv.textContent = text;
            messageDiv.appendChild(textDiv);
        }
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timeDiv);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Socket.io events
    socket.on('new-message', (message) => {
        if (message.userId !== currentUser.userId) {
            addMessageToChat(
                message.userId,
                message.username,
                message.text,
                message.fileUrl ? {
                    url: message.fileUrl,
                    name: message.fileName,
                    type: message.fileType
                } : null
            );
        }
    });
    
    socket.on('user-joined', (user) => {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `${user.username} joined the chat`;
        chatMessages.appendChild(notification);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    
    socket.on('user-left', (userId) => {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `A user left the chat`;
        chatMessages.appendChild(notification);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    
    socket.on('user-list', (users) => {
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user.username;
            userList.appendChild(li);
        });
        onlineCount.textContent = `${users.length} users online`;
    });
});
// AVATAR SELECTION
let selectedAvatarId = 1;
document.querySelectorAll('.avatar-option').forEach(avatar => {
    avatar.addEventListener('click', () => {
        selectedAvatarId = avatar.dataset.id;
        document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
        avatar.classList.add('selected');
    });
});

// TOGGLE USER VISIBILITY
const toggleUsersBtn = document.getElementById('toggle-users');
let usersHidden = false;
toggleUsersBtn.addEventListener('click', () => {
    usersHidden = !usersHidden;
    document.getElementById('user-list-container').style.display = usersHidden ? 'none' : 'block';
    toggleUsersBtn.textContent = usersHidden ? '👥 Show Users' : '👥 Hide Users';
});

// FILE UPLOAD (DRAG & DROP)
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', handleFileUpload);

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Upload logic here (same as before)
    console.log("Uploading:", file.name);
}
