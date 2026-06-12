import { WASocket, WAMessage, WAMessageKey } from '@whiskeysockets/baileys';

export type MessageType =
  | 'text' | 'image' | 'audio' | 'video'
  | 'document' | 'sticker' | 'location' | 'unknown';

export function classifyMessageType(msg: WAMessage): MessageType {
  const m = msg.message;
  if (!m) return 'unknown';
  if (m.conversation || m.extendedTextMessage) return 'text';
  if (m.imageMessage) return 'image';
  if (m.audioMessage) return 'audio';
  if (m.videoMessage) return 'video';
  if (m.documentMessage) return 'document';
  if (m.stickerMessage) return 'sticker';
  if (m.locationMessage) return 'location';
  return 'unknown';
}

export function extractTextBody(msg: WAMessage): string | null {
  const m = msg.message;
  if (!m) return null;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  return null;
}

export function registerInboundHandler(sock: WASocket): void {
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return; // 'notify' = new, 'append' = history sync

    for (const msg of messages) {
      if (msg.key.fromMe) continue; // Skip our own messages

      const messageType = classifyMessageType(msg);
      const textBody = extractTextBody(msg);
      console.log(`📨 [${messageType}] from ${msg.key.remoteJid}: ${textBody}`);
    }
  });
}
