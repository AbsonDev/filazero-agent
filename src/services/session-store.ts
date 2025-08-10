/**
 * Sistema de persistência de sessões e memória
 * Salva conversas, contexto e preferências dos usuários
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ChatSession, AgentContext, FilazeroTicket, SessionConfiguration, MonitoredServices, SystemInfo, SessionSetupStatus } from '../types/agent.types.js';
import { FILAZERO_CONFIG } from '../agent/config.js';

// Estrutura estendida para sessão com memória
export interface EnhancedChatSession extends ChatSession {
  // Dados do usuário
  userData?: {
    name?: string;
    phone?: string;
    email?: string;
    preferredService?: string;
  };
  
  // Histórico de tickets criados
  ticketsCreated: Array<{
    id: number;
    smartCode: string;
    service: string;
    createdAt: Date;
  }>;
  
  // Terminal usado frequentemente
  defaultTerminal?: {
    accessKey: string;
    providerId: number;
    locationId: number;
  };
  
  // Resumo da conversa anterior (para contexto)
  previousSummary?: string;
  
  // Contador de interações
  interactionCount: number;
  
  // Última atividade
  lastActivity: Date;
  
  // Configuração da sessão (serviços a monitorar, info do sistema, etc.)
  configuration?: SessionConfiguration;
}

export class SessionStore {
  private sessionsDir: string;
  private sessions: Map<string, EnhancedChatSession> = new Map();
  private saveInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Diretório para salvar sessões
    this.sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    this.initializeStore();
  }

  /**
   * Inicializa o store e carrega sessões salvas
   */
  private async initializeStore() {
    try {
      // Criar diretório se não existir
      await fs.mkdir(this.sessionsDir, { recursive: true });
      
      // Carregar sessões existentes
      await this.loadSessions();
      
      // Configurar auto-save a cada 30 segundos
      this.saveInterval = setInterval(() => {
        this.saveSessions().catch(console.error);
      }, 30000);
      
      console.log(`📁 SessionStore inicializado com ${this.sessions.size} sessões`);
    } catch (error) {
      console.error('❌ Erro ao inicializar SessionStore:', error);
    }
  }

  /**
   * Carrega sessões do disco
   */
  private async loadSessions() {
    try {
      const files = await fs.readdir(this.sessionsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.sessionsDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const session = JSON.parse(data, this.dateReviver);
          
          // Limpar sessões muito antigas (> 7 dias)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          if (new Date(session.lastActivity) > sevenDaysAgo) {
            this.sessions.set(session.id, session);
          } else {
            // Deletar arquivo de sessão antiga
            await fs.unlink(filePath).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao carregar sessões:', error);
    }
  }

  /**
   * Salva todas as sessões ativas no disco
   */
  private async saveSessions() {
    for (const [id, session] of this.sessions.entries()) {
      await this.saveSession(id, session);
    }
  }

  /**
   * Salva uma sessão específica
   */
  private async saveSession(id: string, session: EnhancedChatSession) {
    try {
      const filePath = path.join(this.sessionsDir, `${id}.json`);
      const data = JSON.stringify(session, null, 2);
      await fs.writeFile(filePath, data, 'utf8');
    } catch (error) {
      console.error(`❌ Erro ao salvar sessão ${id}:`, error);
    }
  }

  /**
   * Obtém ou cria uma sessão melhorada
   */
  getOrCreateSession(sessionId: string): EnhancedChatSession {
    if (!this.sessions.has(sessionId)) {
      const newSession: EnhancedChatSession = {
        id: sessionId,
        messages: [],
        ticketsCreated: [],
        interactionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        configuration: {
          services: {
            tickets: false,
            terminals: false,
            queues: false,
            providers: false,
            sessions: false,
            customers: false,
            reports: false
          },
          systemInfo: {
            sessionStartTime: new Date()
          },
          setupStatus: {
            isSetupComplete: false,
            servicesConfigured: false,
            systemInfoCollected: false,
            currentStep: 'initial'
          }
        }
      };
      
      this.sessions.set(sessionId, newSession);
      console.log(`🆕 Nova sessão criada: ${sessionId}`);
    }
    
    const session = this.sessions.get(sessionId)!;
    session.lastActivity = new Date();
    return session;
  }

  /**
   * Atualiza dados do usuário na sessão
   */
  updateUserData(sessionId: string, userData: Partial<EnhancedChatSession['userData']>) {
    const session = this.getOrCreateSession(sessionId);
    
    if (!session.userData) {
      session.userData = {};
    }
    
    // Mesclar dados, mantendo os existentes
    Object.assign(session.userData, userData);
    session.updatedAt = new Date();
    
    console.log(`👤 Dados do usuário atualizados para sessão ${sessionId}:`, userData);
  }

  /**
   * Adiciona ticket criado ao histórico
   */
  addCreatedTicket(sessionId: string, ticket: {
    id: number;
    smartCode: string;
    service: string;
  }) {
    const session = this.getOrCreateSession(sessionId);
    
    session.ticketsCreated.push({
      ...ticket,
      createdAt: new Date()
    });
    
    session.updatedAt = new Date();
    console.log(`🎫 Ticket ${ticket.id} adicionado ao histórico da sessão ${sessionId}`);
  }

  /**
   * Define terminal padrão para a sessão
   */
  setDefaultTerminal(sessionId: string, terminal: {
    accessKey: string;
    providerId: number;
    locationId: number;
  }) {
    const session = this.getOrCreateSession(sessionId);
    session.defaultTerminal = terminal;
    session.updatedAt = new Date();
    
    console.log(`🖥️ Terminal padrão definido para sessão ${sessionId}`);
  }

  /**
   * Atualiza resumo da conversa
   */
  updateSummary(sessionId: string, summary: string) {
    const session = this.getOrCreateSession(sessionId);
    session.previousSummary = summary;
    session.updatedAt = new Date();
  }

  /**
   * Incrementa contador de interações
   */
  incrementInteractionCount(sessionId: string) {
    const session = this.getOrCreateSession(sessionId);
    session.interactionCount++;
    session.updatedAt = new Date();
  }

  /**
   * Obtém contexto enriquecido da sessão
   */
  getEnrichedContext(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';

    const parts = [];

    // Dados do usuário
    if (session.userData) {
      const { name, phone, email } = session.userData;
      if (name) parts.push(`Nome do usuário: ${name}`);
      if (phone) parts.push(`Telefone: ${phone}`);
      if (email) parts.push(`Email: ${email}`);
      // Sempre usar serviço padrão
      parts.push(`Serviço: ${FILAZERO_CONFIG.DEFAULT_SERVICE}`);
    }

    // Terminal padrão (sempre configurado)
    parts.push(`Terminal padrão configurado (${FILAZERO_CONFIG.TERMINAL.provider} - ${FILAZERO_CONFIG.TERMINAL.location})`);

    // Tickets criados (usar smartCode quando disponível)
    if (session.ticketsCreated.length > 0) {
      const recent = session.ticketsCreated.slice(-3);
      const rendered = recent.map(t => t.smartCode ? `${FILAZERO_CONFIG.DEFAULT_SERVICE} (${t.smartCode})` : FILAZERO_CONFIG.DEFAULT_SERVICE);
      parts.push(`Atendimentos recentes: ${rendered.join(', ')}`);
    }

    // Resumo anterior
    if (session.previousSummary) {
      parts.push(`Contexto anterior: ${session.previousSummary}`);
    }

    // Contador de interações
    if (session.interactionCount > 1) {
      parts.push(`Esta é a ${session.interactionCount}ª interação do usuário`);
    }

    return parts.length > 0 ? `\n\nCONTEXTO DA SESSÃO:\n${parts.join('\n')}` : '';
  }

  /**
   * Limpa sessões antigas (cleanup)
   */
  async cleanupOldSessions(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.lastActivity < oneDayAgo) {
        // Salvar antes de remover (para histórico)
        await this.saveSession(id, session);
        
        // Remover da memória
        this.sessions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} sessões antigas removidas da memória`);
    }

    return cleaned;
  }

  /**
   * Obtém estatísticas das sessões
   */
  getStats() {
    const activeSessions = Array.from(this.sessions.values());
    const withUserData = activeSessions.filter(s => s.userData?.name).length;
    const totalTickets = activeSessions.reduce((sum, s) => sum + s.ticketsCreated.length, 0);
    const totalInteractions = activeSessions.reduce((sum, s) => sum + s.interactionCount, 0);

    return {
      totalSessions: this.sessions.size,
      sessionsWithUserData: withUserData,
      totalTicketsCreated: totalTickets,
      totalInteractions,
      averageInteractionsPerSession: totalInteractions / (this.sessions.size || 1)
    };
  }

  /**
   * Helper para reviver Dates do JSON
   */
  private dateReviver(key: string, value: any): any {
    if (typeof value === 'string') {
      const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      if (datePattern.test(value)) {
        return new Date(value);
      }
    }
    return value;
  }

  /**
   * Finaliza e salva tudo
   */
  async shutdown() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    
    await this.saveSessions();
    console.log('💾 SessionStore: Todas as sessões salvas');
  }

  /**
   * Atualiza os serviços monitorados na configuração da sessão
   */
  updateMonitoredServices(sessionId: string, services: Partial<MonitoredServices>) {
    const session = this.getOrCreateSession(sessionId);
    if (!session.configuration) {
      session.configuration = {
        services: {
          tickets: false,
          terminals: false,
          queues: false,
          providers: false,
          sessions: false,
          customers: false,
          reports: false
        },
        systemInfo: { sessionStartTime: new Date() },
        setupStatus: {
          isSetupComplete: false,
          servicesConfigured: false,
          systemInfoCollected: false,
          currentStep: 'initial'
        }
      };
    }
    
    session.configuration.services = { ...session.configuration.services, ...services };
    session.configuration.setupStatus.servicesConfigured = true;
    session.updatedAt = new Date();
  }

  /**
   * Atualiza informações do sistema na configuração da sessão
   */
  updateSystemInfo(sessionId: string, systemInfo: Partial<SystemInfo>) {
    const session = this.getOrCreateSession(sessionId);
    if (!session.configuration) return;
    
    session.configuration.systemInfo = { ...session.configuration.systemInfo, ...systemInfo };
    session.configuration.setupStatus.systemInfoCollected = true;
    session.updatedAt = new Date();
  }

  /**
   * Atualiza o status do setup da sessão
   */
  updateSetupStatus(sessionId: string, setupStatus: Partial<SessionSetupStatus>) {
    const session = this.getOrCreateSession(sessionId);
    if (!session.configuration) return;
    
    session.configuration.setupStatus = { ...session.configuration.setupStatus, ...setupStatus };
    session.updatedAt = new Date();
  }

  /**
   * Verifica se a sessão está configurada
   */
  isSessionConfigured(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.configuration?.setupStatus.isSetupComplete ?? false;
  }

  /**
   * Obtém a configuração da sessão
   */
  getSessionConfiguration(sessionId: string): SessionConfiguration | undefined {
    const session = this.sessions.get(sessionId);
    return session?.configuration;
  }
}

// Singleton
export const sessionStore = new SessionStore();
