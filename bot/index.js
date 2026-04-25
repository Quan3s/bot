const mineflayer = require('mineflayer');

let bot = null;
let chatTimeout = null;
let actionInterval = null;
let reconnectTimeout = null;

const chatMessages = [
    "Chán quá ai đây không :((",
    "Đứng đây ngắm mây bay cả ngày rồi nè",
    "Server vắng quá, ai vào chơi với mình đi",
    "Bot AFK xin chào mọi người",
    "Có ai online không nhỉ?",
    "Ngồi một mình thấy buồn quá",
    "Mình vẫn ở đây này, đừng lo server die nhé",
    "Đếm block chơi cho đỡ buồn :))",
    "Server hôm nay vắng tanh",
    "Ai đọc được thì vào chơi đi",
    "Đang AFK nhưng vẫn để mắt tới server",
    "Hóng ai đó vào build cùng",
    "Chỉ cần 1 người thôi, vào đi :(",
    "Mình là bot giữ server ấm nè",
    "Có mình tôi với tôi thôi..."
];

function startBot(config, emitLog) {
    // Xóa sạch các tiến trình cũ trước khi khởi động
    clearAllTimers();
    if (bot) {
        bot.quit();
        bot = null;
    }

    emitLog(`[System] Đang kết nối tới ${config.host}:${config.port}...`);

    bot = mineflayer.createBot({
        host: config.host,
        port: parseInt(config.port),
        username: config.username,
        version: '1.20.1',
        viewDistance: 2, // Quan trọng để chạy được trên 512MB RAM
    });

    bot.on('login', () => {
        emitLog(`[Bot] Đã đăng nhập vào máy chủ.`);
    });

    bot.on('spawn', () => {
        emitLog(`[Bot] Đã xuất hiện tại thế giới.`);
        
        // Thực hiện lệnh AuthMe
        setTimeout(() => {
            if (config.isRegister) {
                bot.chat(`/register ${config.password} ${config.password}`);
                emitLog(`[AuthMe] Đã gửi: /register [MK] [MK]`);
            } else {
                bot.chat(`/login ${config.password}`);
                emitLog(`[AuthMe] Đã gửi: /login [MK]`);
            }
        }, 3000);

        startChatCycle(emitLog);
        startActionCycle();
    });

    bot.on('kicked', (reason) => {
        const msg = typeof reason === 'string' ? reason : JSON.stringify(reason);
        emitLog(`[Bị Kick] Lý do: ${msg}`);
    });

    bot.on('error', (err) => {
        emitLog(`[Lỗi] ${err.message}`);
    });

    bot.on('end', (reason) => {
        emitLog(`[System] Mất kết nối. Lý do: ${reason}`);
        clearAllTimers();

        if (config.autoReconnect) {
            emitLog(`[System] Sẽ kết nối lại sau 15 giây...`);
            reconnectTimeout = setTimeout(() => {
                startBot(config, emitLog);
            }, 15000);
        }
    });

    bot.on('death', () => {
        emitLog(`[Bot] Đã chết. Đang hồi sinh...`);
        bot.chat('/respawn');
    });
}

function startChatCycle(emitLog) {
    if (chatTimeout) clearTimeout(chatTimeout);
    
    const loop = () => {
        const msg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
        if (bot && bot.entity) {
            bot.chat(msg);
            emitLog(`[Chat] ${msg}`);
        }
        // Random từ 60s đến 180s
        const next = Math.floor(Math.random() * (180000 - 60000) + 60000);
        chatTimeout = setTimeout(loop, next);
    };
    chatTimeout = setTimeout(loop, 60000);
}

function startActionCycle() {
    if (actionInterval) clearInterval(actionInterval);
    actionInterval = setInterval(() => {
        if (!bot || !bot.entity) return;
        
        // Nhảy ngẫu nhiên
        if (Math.random() > 0.6) {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 200);
        }

        // Quay mặt ngẫu nhiên
        const yaw = Math.random() * Math.PI * 2;
        const pitch = (Math.random() - 0.5) * Math.PI;
        bot.look(yaw, pitch, false);
    }, 12000);
}

function clearAllTimers() {
    if (chatTimeout) clearTimeout(chatTimeout);
    if (actionInterval) clearInterval(actionInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
}

function stopBot(emitLog) {
    clearAllTimers();
    if (bot) {
        bot.quit();
        bot = null;
        emitLog(`[System] Đã dừng bot và tắt tự động kết nối.`);
    }
}

module.exports = { startBot, stopBot };
