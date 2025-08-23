class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = process.env.NODE_ENV === 'development' ? '3001' : window.location.port;

      this.ws = new WebSocket(`${protocol}//${host}:${port}`);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket conectado');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Mensagem WebSocket recebida:', data.type, data);
          this.notifyListeners(data.type, data.data);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        this.isConnected = false;
        this.notifyListeners('disconnected', {});
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        this.notifyListeners('error', error);
      };

    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Máximo de tentativas de reconexão atingido');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  addListener(event, callback) {
    console.log(`➕ Adicionando listener para evento: ${event}`);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    console.log(`📊 Total de listeners para ${event}: ${this.listeners.get(event).length}`);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    console.log(`🔔 Notificando listeners para evento: ${event}`, data);
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      console.log(`📞 Executando ${callbacks.length} callbacks para evento: ${event}`);
      callbacks.forEach((callback, index) => {
        try {
          callback(data);
          console.log(`✅ Callback ${index + 1} executado com sucesso`);
        } catch (error) {
          console.error(`❌ Erro no callback ${index + 1}:`, error);
        }
      });
    } else {
      console.log(`⚠️ Nenhum listener encontrado para evento: ${event}`);
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket não está conectado');
    }
  }
}

export default new WebSocketService();
