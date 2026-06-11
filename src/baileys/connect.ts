import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_state');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrDataUrl = await qrcode.toDataURL(qr);
      console.log('Scan this QR code:');
      console.log(qrDataUrl);
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) connectToWhatsApp();
    }

    if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!');
    }
  });

  return sock;
}

connectToWhatsApp();
