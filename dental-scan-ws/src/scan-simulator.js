const { io } = require('socket.io-client');
const socket = io('http://localhost:4000');

const scanId = 'test-scan-001';
socket.emit('join_scan', scanId);

setInterval(() => {
  const chunk = {
    scanId,
    chunkId: Math.floor(Math.random() * 1000),
    vertices: Array.from({ length: 9 }, () => Math.random()),
    faces: [0, 1, 2],
  };
  console.log('Sending chunk:', chunk);
  socket.emit('scan_chunk', chunk);
}, 1000);
