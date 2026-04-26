const mineflayer = require('mineflayer');

let bot = null;
let chatTimeout = null;
let actionInterval = null;
let reconnectTimeout = null;
let moveTimeout = null; // Quản lý thời gian giữ phím

const chatMessages = [
    "Chán quá ai đây không :((", "Đứng đây ngắm mây bay cả ngày rồi nè",
    "Server vắng quá, ai vào chơi với mình đi", "Bot AFK xin chào mọi người",
    "Có ai online không nhỉ?", "Ngồi một mình thấy buồn quá",
    "Mình vẫn ở đây này, đừng lo server die nhé", "Đếm block chơi cho đỡ buồn :))",
    "Server hôm nay vắng tanh", "Ai đọc được thì vào chơi đi",
    "Đang AFK nhưng vẫn để mắt tới server", "Hóng ai đó vào build cùng",
    "Chỉ cần 1 người thôi, vào đi :(", "Mình là bot giữ server ấm nè",
    "Có mình tôi với tôi thôi..."
];

function startBot(config, emitLog) {
    clearAllTimers();
    if (bot) { bot.quit(); bot = null; }

    emitLog(`[System] Đang kết nối tới ${config.host}...`);

    bot = mineflayer.createBot({
        host: config.host,
        port: parseInt(config.port),
        username: config.username,
        version: '1.20.1',
        viewDistance: 2, 
        checkTimeoutInterval: 90000 
    });

    // Tối ưu vật lý: Chỉ xử lý vật lý cho chính bot, bỏ qua các entity khác
    bot.on('mount', () => { bot.physics.enabled = true; });

    bot.on('spawn', () => {
        emitLog(`[Bot] Đã vào server và bắt đầu di chuyển giả lập.`);
        
        setTimeout(() => {
            const cmd = config.isRegister ? `/register ${config.password} ${config.password}` : `/login ${config.password}`;
            bot.chat(cmd);
            emitLog(`[AuthMe] Thực hiện lệnh: ${cmd}`);
        }, 3000);

        startChatCycle(emitLog);
        startActionCycle(); // Bao gồm nhảy, quay mặt và DI CHUYỂN
    });

    bot.on('end', (reason) => {
        emitLog(`[System] Disconnect: ${reason}`);
        clearAllTimers();
        if (config.autoReconnect) {
            reconnectTimeout = setTimeout(() => startBot(config, emitLog), 15000);
        }
    });

    bot.on('error', (err) => emitLog(`[Lỗi] ${err.message}`));
}

function startActionCycle() {
    if (actionInterval) clearInterval(actionInterval);
    
    actionInterval = setInterval(() => {
        if (!bot || !bot.entity) return;

        // 1. Giả lập quay mặt (nhẹ)
        const yaw = Math.random() * Math.PI * 2;
        const pitch = (Math.random() - 0.5) * Math.PI;
        bot.look(yaw, pitch, false);

        // 2. Giả lập phím di chuyển (W, A, S, D)
        const movements = ['forward', 'back', 'left', 'right'];
        const randomMove = movements[Math.floor(Math.random() * movements.length)];
        
        // Nhấn phím
        bot.setControlState(randomMove, true);
        if (Math.random() > 0.7) bot.setControlState('jump', true); // Thỉnh thoảng nhảy khi đi

        // Giữ phím trong 1-2 giây rồi thả ra để không đi quá xa
        if (moveTimeout) clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            if (bot) {
                bot.clearControlStates(); // Thả tất cả phím
            }
        }, 1000 + Math.random() * 1000);

    }, 10000 + Math.random() * 5000); // 10-15 giây thực hiện một chuỗi hành động
}

function startChatCycle(emitLog) {
    if (chatTimeout) clearTimeout(chatTimeout);
    const loop = () => {
        const msg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
        if (bot && bot.entity) {
            bot.chat(msg);
            emitLog(`[Chat] ${msg}`);
        }
        chatTimeout = setTimeout(loop, 60000 + Math.random() * 120000);
    };
    chatTimeout = setTimeout(loop, 60000);
}

function clearAllTimers() {
    if (chatTimeout) clearTimeout(chatTimeout);
    if (actionInterval) clearInterval(actionInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (moveTimeout) clearTimeout(moveTimeout);
}

function stopBot(emitLog) {
    clearAllTimers();
    if (bot) { bot.quit(); bot = null; emitLog(`[System] Đã dừng bot.`); }
}

module.exports = { startBot, stopBot };
