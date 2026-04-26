const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { startBot, stopBot } = require('./bot/index.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Trạng thái hệ thống
let botStatus = "Đang dừng";
let isBotRunning = false;

const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minecraft Bot AFK Pro</title>
    <style>
        body { font-family: sans-serif; background: #121212; color: #eee; padding: 20px; }
        .card { background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333; max-width: 600px; margin: auto; }
        .status-box { padding: 10px; border-radius: 5px; margin-bottom: 15px; font-weight: bold; text-align: center; }
        .online { background: #1b5e20; color: #4caf50; }
        .offline { background: #b71c1c; color: #f44336; }
        .input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        input, select { padding: 10px; background: #2c2c2c; border: 1px solid #444; color: #fff; border-radius: 4px; }
        button { width: 100%; padding: 15px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.3s; }
        .btn-start { background: #4caf50; color: white; }
        .btn-stop { background: #f44336; color: white; }
        #logs { background: #000; color: #00ff00; padding: 10px; height: 250px; overflow-y: auto; border-radius: 4px; font-family: monospace; font-size: 12px; margin-top: 15px; border: 1px solid #333; }
    </style>
</head>
<body>
    <div class="card">
        <div id="statusIndicator" class="status-box offline">TRẠNG THÁI: ĐANG DỪNG</div>
        
        <div class="input-group">
            <input type="text" id="host" placeholder="IP Server" value="korules.mcsh.io">
            <input type="number" id="port" placeholder="Port" value="25565">
            <input type="text" id="username" placeholder="Tên Bot" value="bot123">
            <input type="text" id="password" placeholder="Mật khẩu" value="11111111">
        </div>

        <select id="isRegister" style="width:100%; margin-bottom:15px;">
            <option value="false">Login (/login mk)</option>
            <option value="true">Register (/register mk mk)</option>
        </select>

        <button id="toggleBtn" class="btn-start" onclick="handleToggle()">KHỞI ĐỘNG BOT</button>

        <div id="logs"></div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let running = false;

        function handleToggle() {
            if (!running) {
                const config = {
                    host: document.getElementById('host').value,
                    port: document.getElementById('port').value,
                    username: document.getElementById('username').value,
                    password: document.getElementById('password').value,
                    isRegister: document.getElementById('isRegister').value === 'true'
                };
                socket.emit('start-bot', config);
            } else {
                socket.emit('stop-bot');
            }
        }

        socket.on('status-update', (data) => {
            running = data.running;
            const btn = document.getElementById('toggleBtn');
            const indicator = document.getElementById('statusIndicator');
            
            if (running) {
                btn.innerText = "DỪNG HOẠT ĐỘNG";
                btn.className = "btn-stop";
                indicator.innerText = "TRẠNG THÁI: ĐANG HOẠT ĐỘNG";
                indicator.className = "status-box online";
            } else {
                btn.innerText = "KHỞI ĐỘNG BOT";
                btn.className = "btn-start";
                indicator.innerText = "TRẠNG THÁI: ĐANG DỪNG";
                indicator.className = "status-box offline";
            }
        });

        socket.on('log', (msg) => {
            const logs = document.getElementById('logs');
            logs.innerHTML += \`<div>\${msg}</div>\`;
            logs.scrollTop = logs.scrollHeight;
        });
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

io.on('connection', (socket) => {
    // Gửi trạng thái hiện tại cho người mới vào web
    socket.emit('status-update', { running: isBotRunning });

    const emitLog = (msg) => io.emit('log', `[${new Date().toLocaleTimeString()}] ${msg}`);

    socket.on('start-bot', (config) => {
        isBotRunning = true;
        io.emit('status-update', { running: true });
        startBot(config, emitLog, () => {
            // Callback khi bot tự động ngắt kết nối hoàn toàn
            isBotRunning = false;
            io.emit('status-update', { running: false });
        });
    });

    socket.on('stop-bot', () => {
        isBotRunning = false;
        io.emit('status-update', { running: false });
        stopBot(emitLog);
    });
});

server.listen(PORT, () => console.log('Server is running...'));
