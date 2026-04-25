const mineflayer = require('mineflayer');

let bot = null;
let chatInterval = null;
let actionInterval = null;

const chatMessages = [
    "tôi là bot AFK", 
    "hello", 
    "chào", 
    "hi", 
    "tôi là bot", 
    "chào mọi người nha"
];

function startBot(config, emitLog) {
    // Xóa bot cũ nếu có để giải phóng RAM
    if (bot) {
        bot.quit();
        cleanup();
        bot = null;
    }

    emitLog(`[System] Đang kết nối tới ${config.host}:${config.port} | Bot: ${config.username}`);

    bot = mineflayer.createBot({
        host: config.host,
        port: parseInt(config.port),
        username: config.username,
        version: '1.20.1',
        viewDistance: 2 // Tối ưu cực quan trọng cho Render (Render distance = 2)
    });

    bot.on('login', () => {
        emitLog(`[Bot] Đã vào máy chủ. Đang chờ AuthMe...`);
    });

    bot.on('spawn', () => {
        emitLog(`[Bot] Đã spawn thành công.`);

        // 1. Xử lý AuthMe
        setTimeout(() => {
            if (config.isRegister) {
                bot.chat(`/register ${config.password} ${config.password}`);
                emitLog(`[AuthMe] Đã gửi lệnh Đăng Ký.`);
            } else {
                bot.chat(`/login ${config.password}`);
                emitLog(`[AuthMe] Đã gửi lệnh Đăng Nhập.`);
            }
        }, 2000); // Đợi 2s cho server load plugin

        // 2. Vòng lặp Chat (2 - 4 phút / lần)
        if (chatInterval) clearInterval(chatInterval);
        chatInterval = setInterval(() => {
            const msg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
            bot.chat(msg);
            emitLog(`[Bot Chat] ${msg}`);
        }, 120000 + Math.random() * 120000);

        // 3. Vòng lặp Hành động: Nhảy & Quay mặt ngẫu nhiên (10 - 20 giây / lần)
        if (actionInterval) clearInterval(actionInterval);
        actionInterval = setInterval(() => {
            // Nhảy
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 300);

            // Quay mặt đi chỗ khác (yaw: hướng ngang, pitch: hướng dọc)
            const randomYaw = Math.random() * Math.PI * 2; 
            const randomPitch = (Math.random() * Math.PI) - (Math.PI / 2); 
            bot.look(randomYaw, randomPitch, true);
        }, 10000 + Math.random() * 10000);
    });

    bot.on('death', () => {
        emitLog(`[Bot] Đã ngã xuống! Đang auto respawn...`);
        bot.chat('/respawn'); // Gửi lệnh phụ trợ
    });

    bot.on('end', (reason) => {
        emitLog(`[System] Mất kết nối: ${reason}`);
        cleanup();
        
        if (config.autoReconnect) {
            emitLog(`[System] Auto Reconnect sau 10 giây...`);
            setTimeout(() => startBot(config, emitLog), 10000);
        }
    });

    bot.on('error', (err) => {
        emitLog(`[Error] ${err.message}`);
    });

    // Dọn dẹp tiến trình ẩn để tránh tràn RAM
    function cleanup() {
        if (chatInterval) clearInterval(chatInterval);
        if (actionInterval) clearInterval(actionInterval);
    }
}

function stopBot(emitLog) {
    if (bot) {
        bot.quit();
        bot = null;
        emitLog(`[System] Đã ngắt kết nối bot thủ công.`);
    } else {
        emitLog(`[System] Bot hiện không hoạt động.`);
    }
}

function sendCommand(cmd, emitLog) {
    if (bot) {
        bot.chat(cmd);
        emitLog(`[Terminal] Đã gửi: ${cmd}`);
    } else {
        emitLog(`[Lỗi] Bot chưa kết nối.`);
    }
}

module.exports = { startBot, stopBot, sendCommand };
