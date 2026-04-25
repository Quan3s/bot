const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { startBot, stopBot, sendCommand } = require('./bot/index.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Cấu hình mặc định (Sẽ bị ghi đè khi nhấn nút trên Web)
let botConfig = {
    host: 'korules.mcsh.io',
    port: '25565',
    username: 'bot123',
    password: '11111111',
    isRegister: false,
    autoReconnect: true
};

// Giao diện HTML tích hợp sẵn
const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minecraft Bot Control Panel</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f0f; color: #e0e0e0; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: auto; }
        .card { background: #1a1a1a; padding: 20px; border-radius: 10px; border: 1px solid #333; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        h2 { color: #4CAF50; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        label { display: block; font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 5px; }
        input, select { width: 100%; padding: 10px; background: #252525; border: 1px solid #444; color: #fff; border-radius: 5px; box-sizing: border-box; }
        input:focus { border-color: #4CAF50; outline: none; }
        .btn-group { margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
        button { flex: 1; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: 0.3s; min-width: 120px; }
        .btn-start { background: #4CAF50; color: white; }
        .btn-start:hover { background: #45a049; }
        .btn-stop { background: #f44336; color: white; }
        .btn-stop:hover { background: #da190b; }
        #logs { background: #000; color: #00ff00; padding: 15px; height: 350px; overflow-y: auto; border-radius: 5px; font-family: 'Consolas', monospace; font-size: 13px; border: 1px solid #333; }
        .log-time { color: #888; margin-right: 8px; }
        .log-error { color: #ff5555; }
        .log-sys { color: #5555ff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h2>Cấu Hình Bot 1.20.1</h2>
            <div class="grid">
                <div>
                    <label>Server IP</label>
                    <input type="text" id="host" value="korules.mcsh.io">
                </div>
                <div>
                    <label>Port</label>
                    <input type="number" id="port" value="25565">
                </div>
                <div>
                    <label>Tên Bot</label>
                    <input type="text" id="username" value="bot123">
                </div>
                <div>
                    <label>Mật khẩu</label>
                    <input type="text" id="password" value="11111111">
                </div>
                <div>
                    <label>Chế độ AuthMe</label>
                    <select id="isRegister">
                        <option value="false">Đã có tài khoản (Login)</option>
                        <option value="true">Chưa có tài khoản (Register)</option>
                    </select>
                </div>
                <div>
                    <label>Tự kết nối lại</label>
                    <select id="autoReconnect">
                        <option value="true">Bật</option>
                        <option value="false">Tắt</option>
                    </select>
                </div>
            </div>
            <div class="btn-group">
                <button class="btn-start" onclick="applyAndStart()">KHỞI ĐỘNG / CẬP NHẬT</button>
                <button class="btn-stop" onclick="stopBot()">DỪNG BOT</button>
                <button style="background:#555; color:white;" onclick="clearLogs()">XÓA LOG</button>
            </div>
        </div>

        <div class="card">
            <h2>Nhật Ký Hoạt Động (Live Logs)</h2>
            <div id="logs"></div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const logsDiv = document.getElementById('logs');

        socket.on('log', (msg) => {
            const span = document.createElement('div');
            const now = new Date().toLocaleTimeString();
            
            let className = '';
            if(msg.includes('[Lỗi]') || msg.includes('[Bị Kick]')) className = 'log-error';
            if(msg.includes('[System]')) className = 'log-sys';

            span.innerHTML = \`<span class="log-time">[\${now}]</span><span class="\${className}">\${msg}</span>\`;
            logsDiv.appendChild(span);
            logsDiv.scrollTop = logsDiv.scrollHeight;
        });

        function applyAndStart() {
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

        function clearLogs() {
            logsDiv.innerHTML = '';
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.send(htmlContent);
});

io.on('connection', (socket) => {
    const emitLog = (msg) => io.emit('log', msg);

    socket.on('start', (newConfig) => {
        botConfig = { ...botConfig, ...newConfig };
        emitLog(`[System] Đang áp dụng cấu hình mới cho ${botConfig.username}...`);
        startBot(botConfig, emitLog);
    });

    socket.on('stop', () => {
        botConfig.autoReconnect = false;
        stopBot(emitLog);
    });
});

server.listen(PORT, () => {
    console.log(`Web Control Panel: http://localhost:${PORT}`);
});
