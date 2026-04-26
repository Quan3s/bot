const mineflayer = require('mineflayer');

let bot = null;
let timers = [];
let autoReconnect = true;

const chatMsgs = [
    "Chán quá ai đây không :((", "Đứng đây ngắm mây bay cả ngày rồi nè",
    "Server vắng quá, ai vào chơi với mình đi", "Bot AFK xin chào mọi người",
    "Mình vẫn ở đây này, đừng lo server die nhé", "Đang AFK nhưng vẫn để mắt tới server"
];

function startBot(config, emitLog, onFinalExit) {
    autoReconnect = true;
    clearTimers();

    if (bot) { bot.quit(); bot = null; }

    emitLog(`[Hệ thống] Đang kết nối tới ${config.host}...`);

    bot = mineflayer.createBot({
        host: config.host,
        port: parseInt(config.port),
        username: config.username,
        version: '1.20.1',
        viewDistance: 2, // Tối ưu RAM cho Render
        checkTimeoutInterval: 60000
    });

    bot.on('spawn', () => {
        emitLog(`[Bot] Đã vào server. Bắt đầu Anti-AFK.`);
        
        // AuthMe
        setTimeout(() => {
            const cmd = config.isRegister ? `/register ${config.password} ${config.password}` : `/login ${config.password}`;
            bot.chat(cmd);
        }, 3000);

        // Vòng lặp Anti-AFK (Di chuyển vật lý)
        const afkTimer = setInterval(() => {
            if (!bot || !bot.entity) return;
            
            const actions = ['forward', 'back', 'left', 'right'];
            const move = actions[Math.floor(Math.random() * actions.length)];
            
            bot.setControlState(move, true);
            if (Math.random() > 0.5) bot.setControlState('jump', true);

            setTimeout(() => {
                if (bot) bot.clearControlStates();
            }, 1000);

            // Quay mặt ngẫu nhiên
            bot.look(Math.random() * 6, Math.random() * 2 - 1);
        }, 15000); 

        // Vòng lặp Chat
        const chatTimer = setInterval(() => {
            if (bot) bot.chat(chatMsgs[Math.floor(Math.random() * chatMsgs.length)]);
        }, 120000);

        timers.push(afkTimer, chatTimer);
    });

    bot.on('kicked', (reason) => emitLog(`[Bị Kick] Lý do: ${reason}`));
    
    bot.on('error', (err) => emitLog(`[Lỗi] ${err.message}`));

    bot.on('end', (reason) => {
        emitLog(`[Hệ thống] Mất kết nối: ${reason}`);
        clearTimers();
        
        if (autoReconnect) {
            emitLog(`[Hệ thống] Tự động kết nối lại sau 20 giây...`);
            setTimeout(() => startBot(config, emitLog, onFinalExit), 20000);
        } else {
            onFinalExit();
        }
    });
}

function clearTimers() {
    timers.forEach(t => clearInterval(t));
    timers = [];
}

function stopBot(emitLog) {
    autoReconnect = false;
    clearTimers();
    if (bot) {
        bot.quit();
        bot = null;
    }
    emitLog("[Hệ thống] Đã dừng bot thủ công.");
}

module.exports = { startBot, stopBot };
