class PollingService {
  constructor() {
    this.isPolling = false;
    this.pollingInterval = null;
    this.pollingDelay = 2000; // 2 segundos
    this.listeners = new Map();
    this.lastUpdate = null;
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.newstrust.me';
  }

  connect() {
    if (this.isPolling) {
      console.log('🔄 Polling já está ativo');
      return;
    }

    console.log('🔌 Iniciando polling...');
    this.isPolling = true;
    this.startPolling();
    this.notifyListeners('connected', {});
  }

  startPolling() {
    this.pollingInterval = setInterval(async () => {
      try {
        await this.checkForUpdates();
      } catch (error) {
        console.error('❌ Erro no polling:', error);
      }
    }, this.pollingDelay);
  }

  async checkForUpdates() {
    try {
      const response = await fetch(`${this.apiUrl}/api/notifications/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.hasUpdates) {
        console.log('📨 Atualizações encontradas:', data);
        this.notifyListeners('update', data);
      }

      // Notificar dados iniciais se necessário
      if (data.initialData) {
        this.notifyListeners('initial_data', data.initialData);
      }

    } catch (error) {
      console.error('❌ Erro ao verificar atualizações:', error);
      this.notifyListeners('error', error);
    }
  }

  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('🔌 Polling desconectado');
    this.notifyListeners('disconnected', {});
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
    // Para polling, não precisamos enviar mensagens
    // As atualizações são verificadas automaticamente
    console.log('📤 Mensagem enviada via polling:', message);
  }
}

export default new PollingService();
