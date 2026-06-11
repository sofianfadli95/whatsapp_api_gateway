import { WASocket } from '@whiskeysockets/baileys';

export function registerInboundHandler(sock: WASocket): void {
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return; // 'notify' = new, 'append' = history sync

    for (const msg of messages) {
      if (msg.key.fromMe) continue; // Skip our own messages

      console.log('📨 Message received:', {
        from: msg.key.remoteJid,
        id: msg.key.id,
        timestamp: new Date(Number(msg.messageTimestamp) * 1000).toISOString(),
        message: JSON.stringify(msg.message, null, 2),
      });
    }
  });
}
