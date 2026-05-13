class NotificationSocket {
    constructor() {
        this.socket = null;
        this.url = "";
        this.messageCallback = null;
        this.manuallyClosed = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5; // Urinishlar soni biroz ko'paytirildi
        this.connectionId = 0;
        this.reconnectTimer = null;
    }

    /**
     * WebSocketga ulanish
     * @param {string} url - Server manzili
     * @param {Function} onMessage - Xabar kelganda ishlaydigan funksiya
     */
    connect(url, onMessage = null) {
        if (!url) {
            console.error("❌ WebSocket URL ko'rsatilmadi!");
            return;
        }

        this.url = url;
        if (onMessage) this.messageCallback = onMessage;
        this.manuallyClosed = false;

        // Mavjud ulanish holatini tekshirish
        if (this.socket) {
            if (this.socket.readyState === WebSocket.OPEN) {
                console.warn("⚠️ WebSocket allaqachon ulangan.");
                return;
            }
            if (this.socket.readyState === WebSocket.CONNECTING) {
                console.warn("⚠️ WebSocket ulanish jarayonida...");
                return;
            }
        }

        this._initialize();
    }

    _initialize() {
        // Har bir ulanish uchun unikal ID (eskirgan ulanishlar xabarini olmaslik uchun)
        const activeConnectionId = ++this.connectionId;

        try {
            this.socket = new WebSocket(this.url);
        } catch (error) {
            console.error("❌ WebSocket yaratishda xato:", error);
            this._reconnect();
            return;
        }

        this.socket.onopen = () => {
            if (activeConnectionId !== this.connectionId) return;

         
            this.reconnectAttempts = 0;
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        };

        this.socket.onmessage = (event) => {
            if (activeConnectionId !== this.connectionId) return;

            // Ma'lumotlarni xavfsiz o'qish
            let data = event.data;
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                // Agar JSON bo'lmasa, o'z holicha qoladi
            }

            if (this.messageCallback) {
                this.messageCallback(data);
            }
        };

        this.socket.onerror = (error) => {
            if (activeConnectionId !== this.connectionId) return;
            console.error("❌ WebSocket xatosi yuz berdi");
        };

        this.socket.onclose = (event) => {
            if (activeConnectionId !== this.connectionId) return;

            this.socket = null;
            if (!this.manuallyClosed) {
                console.warn("🔌 WebSocket aloqasi uzildi. Qayta ulanishga urinilmoqda...");
                this._reconnect();
            } else {
                console.log("🔴 WebSocket qo'lda yopildi.");
            }
        };
    }

    /**
     * Qayta ulanish logikasi (Exponential Backoff bilan)
     */
    _reconnect() {
        if (this.manuallyClosed || this.reconnectAttempts >= this.maxReconnectAttempts) {
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error("❌ Max qayta ulanish urinishlari tugadi.");
            }
            return;
        }

        this.reconnectAttempts++;

        // Har bir urinishda kutish vaqtini oshirish (1s, 2s, 4s, 8s...)
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);

        console.log(`🔄 Qayta ulanish urinishi: ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms dan keyin)`);

        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this._initialize();
        }, delay);
    }

    /**
     * Xabar yuborish
     * @param {Object|string} message 
     */
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const payload = typeof message === "string" ? message : JSON.stringify(message);
            this.socket.send(payload);
            return true;
        } else {
            console.warn("⚠️ Xabar yuborilmadi. WebSocket yopiq holatda.");
            return false;
        }
    }

    /**
     * Ulanishni butunlay to'xtatish
     */
    disconnect() {
        this.manuallyClosed = true;
        this.reconnectAttempts = 0;
        this.connectionId++; // Eskirgan callbacklarni to'xtatish

        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    /**
     * Holatni tekshirish
     */
    get status() {
        if (!this.socket) return "CLOSED";
        const states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
        return states[this.socket.readyState];
    }
}

// Singleton ob'ekt sifatida eksport qilish
const notificationSocket = new NotificationSocket();
export default notificationSocket;