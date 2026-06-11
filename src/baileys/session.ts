import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';

export type ConnectionStateType = 'initializing' | 'connected' | 'disconnected';

export interface SessionManagerInterface {
  getConnectionState(): ConnectionStateType;
  getSocket(): WASocket | null;
  getQrDataUrl(): string | null;
  start(): Promise<void>;
  onSocketCreated(callback: (sock: WASocket) => void): void;
}

export class SessionManager implements SessionManagerInterface {
  private sock: WASocket | null = null;
  private connectionState: ConnectionStateType = 'initializing';
  private qrDataUrl: string | null = null;
  private authDir: string;
  private socketCallbacks: ((sock: WASocket) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30_000; // 30s max

  constructor(authDir: string = './auth_state') {
    this.authDir = authDir;
  }

  onSocketCreated(callback: (sock: WASocket) => void): void {
    this.socketCallbacks.push(callback);
    if (this.sock) callback(this.sock);
  }

  getConnectionState(): ConnectionStateType {
    return this.connectionState;
  }

  getSocket(): WASocket | null {
    return this.sock;
  }

  getQrDataUrl(): string | null {
    return this.qrDataUrl;
  }

  async start(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrDataUrl = await qrcode.toDataURL(qr);
        this.connectionState = 'initializing';
        this.reconnectAttempts = 0;
        console.log('\n=== Scan this QR code ===');
        console.log(qr);
        console.log('=========================\n');
        console.log('Or fetch via GET http://localhost:' + (process.env.PORT || 3001) + '/qr');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const isConflict = statusCode === 440; // conflict

        if (isLoggedOut) {
          console.error('Logged out — delete auth_state and re-pair');
          this.connectionState = 'disconnected';
          return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
          Math.pow(2, this.reconnectAttempts) * 1000,
          this.maxReconnectDelay
        );

        if (isConflict) {
          console.warn(`Conflict detected (attempt ${this.reconnectAttempts}) — waiting ${delay}ms before reconnect`);
        } else {
          console.log(`Connection lost (attempt ${this.reconnectAttempts}) — reconnecting in ${delay}ms...`);
        }

        this.connectionState = 'disconnected';
        await new Promise(r => setTimeout(r, delay));
        await this.start();
      }

      if (connection === 'open') {
        this.connectionState = 'connected';
        this.qrDataUrl = null;
        this.reconnectAttempts = 0;
        console.log('✅ WhatsApp connected');
        for (const cb of this.socketCallbacks) {
          cb(this.sock!);
        }
      }
    });
  }
}

// Singleton
let instance: SessionManager | null = null;

export function getSessionManager(authDir?: string): SessionManager {
  if (!instance) instance = new SessionManager(authDir);
  return instance;
}

export function resetSessionManager(): void {
  instance = null;
}
