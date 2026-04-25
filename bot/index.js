const mineflayer = require('mineflayer')

let bot = null

function createBot(config, log) {
  if (bot) {
    try { bot.quit() } catch {}
  }

  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: '1.20.1'
  })

  bot.on('login', () => log('✅ Bot đã vào server'))

  bot.on('spawn', () => {
    log('🌍 Bot spawn')

    // Login AuthMe
    setTimeout(() => {
      bot.chat(`/login ${config.password}`)
      log('🔐 Đã gửi lệnh login')
    }, 3000)

    // AFK actions nhẹ
    setInterval(() => {
      if (!bot.entity) return

      // Nhảy
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)

      // Quay random
      bot.look(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI - Math.PI / 2,
        true
      )

    }, 5000)

    // Chat random
    const messages = [
      'tôi là bot AFK',
      'hello',
      'chào',
      'hi',
      'tôi là bot',
      'chào mọi người nha'
    ]

    setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)]
      bot.chat(msg)
    }, 15000)
  })

  bot.on('death', () => {
    log('💀 Bot chết -> respawn')
    setTimeout(() => bot.spawn(), 3000)
  })

  bot.on('kicked', (r) => log('❌ Kicked: ' + r))
  bot.on('error', (e) => log('⚠️ Error: ' + e.message))
  bot.on('end', () => log('🔌 Disconnected'))

  return bot
}

module.exports = { createBot }
