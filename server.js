const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { startBot, stopBot, sendCommand } = require('./bot/index.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Render cung cấp port qua process.env.PORT
const PORT = process.env.PORT || 3000;

// Cấu hình mặc định theo yêu cầu
let botConfig = {
    host: 'korules.mcsh.io',
    port: '25565',
    username: 'bot123',
    password: '11111111',
    isRegister: false,
    autoReconnect: true
};

// Giao diện HTML
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AFK Bot Panel (Render Optimized)</title>
        <style>
            body { font-family: Arial, sans-serif; background: #121212; color: #fff; padding: 20px; max-width: 800px; margin: auto; }
            .card { background: #1e1e1e; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333; }
            h2 { color: #4caf50; margin-top: 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            label { display: block; margin-top: 10px; font-size: 14px; color: #aaa; }
            input, select { width: 100%; padding: 8px; margin-top: 5px; background: #2c2c2c; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; }
            button { background: #4caf50; color: white; border: none; padding: 10px 15px; margin-top: 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
            button.danger { background: #f44336; }
            #logs { background: #000; color: #0f0; padding: 10px; height: 300px; overflow-y: auto; border-radius: 4px; font-family: monospace; font-size: 13px; line-height: 1.4; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Cấu Hình Bot</h2>
            <div class="grid">
                <div>
                    <label>Server IP</label>
                    <input type="text" id="host" value="${botConfig.host}">
                </div>
                <div>
                    <label>Port</label>
                    <input type="text" id="port" value="${botConfig.port}">
                </div>
                <div>
                    <label>Tên Bot</label>
                    <input type="text" id="username" value="${botConfig.username}">
                </div>
                <div>
                    <label>Mật khẩu (AuthMe)</label>
                    <input type="text" id="password" value="${botConfig.password}">
                </div>
                <div>
                    <label>Hành động AuthMe</label>
                    <select id="isRegister">
                        <option value="false" ${!botConfig.isRegister ? 'selected' : ''}>Login (/login mk)</option>
                        <option value="true" ${botConfig.isRegister ? 'selected' : ''}>Register (/register mk mk)</option>
                    </select>
                </div>
                <div>
                    <label>Auto Reconnect</label>
                    <select id="autoReconnect">
                        <option value="true" ${botConfig.autoReconnect ? 'selected' : ''}>Bật</option>
                        <option value="false" ${!botConfig.autoReconnect ? 'selected' : ''}>Tắt</option>
                    </select>
                </div>
            </div>
            <button onclick="applyConfig()">Khởi động / Cập nhật</button>
            <button class="danger" onclick="stopBot()">Dừng Bot</button>
            <button onclick="sendCommand('/respawn')">Ép Respawn</button>
        </div>

        <div class="card">
            <h2>Live Logs</h2>
            <div id="logs"></div>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            const logsDiv = document.getElementById('logs');

            socket.on('log', (msg) => {
                logsDiv.innerHTML += msg + '<br>';
                logsDiv.scrollTop = logsDiv.scrollHeight;
            });

            function applyConfig() {
                const config = {
                    host: document.getElementById('host').value,
                    port: document.getElementById('port').value,
                    username: document.getElementById('username').value,
                    password: document.getElementById('password').value,
                    isRegister: document.getElementById('isRegister').value === 'true',
                    autoReconnect: document.getElementById('autoReconnect').value === 'true'
                };
                socket.emit('start', config);
            }

            function stopBot() {
                socket.emit('stop');
            }

            function sendCommand(cmd) {
                socket.emit('command', cmd);
            }
        </script>
    </body>
    </html>
    `);
});

// Xử lý WebSocket
io.on('connection', (socket) => {
    const emitLog = (msg) => {
        console.log(msg); // Log ra console của Render
        io.emit('log', msg); // Bắn log về giao diện Web
    };

    socket.on('start', (config) => {
        botConfig = { ...botConfig, ...config };
        startBot(botConfig, emitLog);
    });

    socket.on('stop', () => {
        botConfig.autoReconnect = false; // Tắt tự động kết nối lại khi dừng chủ động
        stopBot(emitLog);
    });

    socket.on('command', (cmd) => {
        sendCommand(cmd, emitLog);
    });
});

server.listen(PORT, () => {
    console.log(`Web Server đang chạy tại port ${PORT}`);
});
