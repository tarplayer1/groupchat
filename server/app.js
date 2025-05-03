// server/app.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Store active users
const users = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static('uploads'));

// API endpoint for file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  
  // Generate public URL
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New user connected');
  
  // When a user joins
  socket.on('join', (userId, username) => {
    users.set(socket.id, { userId, username });
    socket.broadcast.emit('user-joined', { userId, username });
    io.emit('user-list', Array.from(users.values()));
  });
  
  // When a message is sent
  socket.on('send-message', (message) => {
    const user = users.get(socket.id);
    if (user) {
      io.emit('new-message', {
        userId: user.userId,
        username: user.username,
        text: message.text,
        fileUrl: message.fileUrl,
        timestamp: new Date()
      });
    }
  });
  
  // When a user disconnects
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      socket.broadcast.emit('user-left', user.userId);
      io.emit('user-list', Array.from(users.values()));
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Add this to your existing server code
io.on('connection', (socket) => {
  // When user joins with avatar
  socket.on('join', (userId, username, avatarId) => {
      users.set(socket.id, { userId, username, avatarId });
      io.emit('user-list', Array.from(users.values()));
  });

  // Toggle user visibility (frontend handles hiding)
  socket.on('toggle-visibility', (isHidden) => {
      socket.broadcast.emit('user-visibility', { userId: socket.id, isHidden });
  });
});
