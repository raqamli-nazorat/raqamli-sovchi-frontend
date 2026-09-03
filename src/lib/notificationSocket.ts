// Real-time bildirishnomalar uchun WebSocket klienti (singleton, auto-reconnect).
// Auth header WS'da yo'q — bir martalik ticket (~60s) URL'ga qo'shiladi.
// Manba/g'oya: hgt-attendance-frontend/src/services/NotificationSocket.js

type MessageCallback = (data: unknown) => void;
type UrlProvider = () => Promise<string>;

export type WsStatus = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

class NotificationSocket {
  private socket: WebSocket | null = null;
  private url = "";
  private messageCallback: MessageCallback | null = null;
  private statusCallback: ((s: WsStatus) => void) | null = null;
  private manuallyClosed = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 6;
  // eskirgan ulanish callbacklarini e'tiborsiz qoldirish uchun
  private connectionId = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stableTimer: ReturnType<typeof setTimeout> | null = null;
  // reconnectda yangi ticketli URL olish uchun
  private urlProvider: UrlProvider | null = null;

  connect(
    url: string,
    onMessage?: MessageCallback,
    urlProvider?: UrlProvider,
    onStatus?: (s: WsStatus) => void
  ) {
    if (!url) return;
    this.url = url;
    if (onMessage) this.messageCallback = onMessage;
    if (urlProvider) this.urlProvider = urlProvider;
    if (onStatus) this.statusCallback = onStatus;
    this.manuallyClosed = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.socket) {
      const rs = this.socket.readyState;
      if (rs === WebSocket.OPEN || rs === WebSocket.CONNECTING) return;
    }
    this.initialize();
  }

  private emitStatus() {
    this.statusCallback?.(this.status);
  }

  private initialize() {
    const activeId = ++this.connectionId;
    try {
      this.socket = new WebSocket(this.url);
    } catch {
      this.reconnect();
      return;
    }
    this.emitStatus();

    this.socket.onopen = () => {
      if (activeId !== this.connectionId) return;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.emitStatus();
      // reconnectAttempts'ni darhol tiklamaymiz — flapping (ulanib-darrov uziladigan)
      // ulanishda cheksiz reconnect halqasi bo'lmasligi uchun. Faqat 3s barqaror tursa.
      if (this.stableTimer) clearTimeout(this.stableTimer);
      this.stableTimer = setTimeout(() => {
        if (activeId === this.connectionId) this.reconnectAttempts = 0;
      }, 3000);
    };

    this.socket.onmessage = (event) => {
      if (activeId !== this.connectionId) return;
      let data: unknown = event.data;
      try {
        data = JSON.parse(event.data);
      } catch {
        /* JSON emas — o'z holicha qoldiramiz */
      }
      this.messageCallback?.(data);
    };

    this.socket.onerror = () => {
      if (activeId !== this.connectionId) return;
      // onclose ham chaqiriladi — reconnect o'sha yerda
    };

    this.socket.onclose = () => {
      if (activeId !== this.connectionId) return;
      this.socket = null;
      if (this.stableTimer) clearTimeout(this.stableTimer);
      this.emitStatus();
      if (!this.manuallyClosed) this.reconnect();
    };
  }

  // Exponential backoff: 1s, 2s, 4s, 8s ... (max 15s)
  private reconnect() {
    if (this.manuallyClosed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // urinishlar tugadi — endi faqat qo'lda (tab focus / reconnect()) tiklanadi
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), 15000);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(async () => {
      if (this.manuallyClosed) return;
      if (this.urlProvider) {
        try {
          const fresh = await this.urlProvider();
          if (this.manuallyClosed) return;
          if (fresh) this.url = fresh;
        } catch {
          /* ticket yangilanmadi — eski URL bilan urinamiz */
        }
      }
      if (this.manuallyClosed) return;
      this.initialize();
    }, delay);
  }

  // Tashqaridan majburan qayta ulanish (masalan tab qayta faollashganda).
  retryNow() {
    if (this.status === "OPEN" || this.status === "CONNECTING") return;
    this.manuallyClosed = false;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.url) this.initialize();
  }

  send(message: unknown): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof message === "string" ? message : JSON.stringify(message));
      return true;
    }
    return false;
  }

  disconnect() {
    this.manuallyClosed = true;
    this.reconnectAttempts = 0;
    this.connectionId++;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.stableTimer) clearTimeout(this.stableTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.emitStatus();
  }

  get status(): WsStatus {
    if (!this.socket) return "CLOSED";
    return (["CONNECTING", "OPEN", "CLOSING", "CLOSED"] as const)[this.socket.readyState];
  }
}

// SINGLETON — butun ilova bo'ylab bitta ulanish
export const notificationSocket = new NotificationSocket();
export default notificationSocket;
