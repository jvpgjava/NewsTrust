import { WebSocketServer } from 'ws'
import { query } from '../config/database.js'

class RealTimeService {
    constructor() {
        this.wss = null
        this.clients = new Set()
        this.monitoringSources = new Map()
        this.alerts = []
    }

    initialize(server) {
        this.wss = new WebSocketServer({ server })

        this.wss.on('connection', (ws) => {
            console.log('🔌 Cliente WebSocket conectado')
            this.clients.add(ws)

            // Enviar status atual
            ws.send(JSON.stringify({
                type: 'connected',
                monitoringStatus: Array.from(this.monitoringSources.values())
            }))

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data)
                    this.handleMessage(ws, message)
                } catch (error) {
                    console.error('Erro ao processar mensagem WebSocket:', error)
                }
            })

            ws.on('close', () => {
                console.log('🔌 Cliente WebSocket desconectado')
                this.clients.delete(ws)
            })
        })

        // Iniciar monitoramento simulado
        this.startSimulatedMonitoring()
    }

    handleMessage(ws, message) {
        switch (message.type) {
            case 'startMonitoring':
                this.startMonitoring(message.sourceId, message.feedUrl, message.interval)
                break
            case 'stopMonitoring':
                this.stopMonitoring(message.sourceId)
                break
            default:
                console.log('Mensagem desconhecida:', message.type)
        }
    }

    startMonitoring(sourceId, feedUrl, interval = 60000) {
        const monitoringInfo = {
            sourceId,
            feedUrl,
            interval,
            isActive: true,
            lastCheck: new Date(),
            checkCount: 0
        }

        this.monitoringSources.set(sourceId, monitoringInfo)

        // Simular verificação periódica
        const checkInterval = setInterval(() => {
            if (!this.monitoringSources.has(sourceId)) {
                clearInterval(checkInterval)
                return
            }

            // Verificação de conteúdo será implementada com dados reais
        }, interval)

        // Notificar todos os clientes
        this.broadcast({
            type: 'monitoringStarted',
            data: monitoringInfo
        })

        console.log(`🔍 Monitoramento iniciado para ${sourceId}`)
    }

    stopMonitoring(sourceId) {
        this.monitoringSources.delete(sourceId)

        this.broadcast({
            type: 'monitoringStopped',
            data: { sourceId }
        })

        console.log(`🛑 Monitoramento parado para ${sourceId}`)
    }

    // Função de simulação removida - será implementada com dados reais

    updateTrends() {
        // Tendências baseadas apenas em dados reais do banco quando implementado
        // Por enquanto, não enviar dados mockados
    }

    broadcast(message) {
        this.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(message))
            }
        })
    }

    startSimulatedMonitoring() {
        // Não iniciar monitoramento automático de fontes específicas
        // O monitoramento será ativado apenas quando fontes forem analisadas via API externa
        console.log('🔍 Serviço de monitoramento pronto (sem fontes pré-definidas)')
    }

    getStats() {
        return {
            connectedClients: this.clients.size,
            monitoringSources: this.monitoringSources.size,
            totalAlerts: this.alerts.length,
            activeAlerts: this.alerts.filter(alert =>
                new Date(alert.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length
        }
    }
}

export default new RealTimeService()
