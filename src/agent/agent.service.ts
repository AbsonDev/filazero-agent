/**
 * Serviço principal do Agente Filazero
 * Orquestra a comunicação entre Groq e MCP
 */

import { v4 as uuidv4 } from 'uuid';
import { GroqClient } from './groq-client.js';
import { MCPClient } from './mcp-client.js';
import { filazeroTools, generateBrowserUuid } from './function-tools.js';
import { FILAZERO_CONFIG, getDefaultTicketConfig, getDefaultTerminalConfig } from './config.js';
import { 
  ChatMessage, 
  ChatSession, 
  ChatRequest, 
  ChatResponse, 
  GroqMessage,
  AgentContext 
} from '../types/agent.types.js';
import { sessionStore } from '../services/session-store.js';

export class AgentService {
  private groqClient: GroqClient;
  private mcpClient: MCPClient;
  private sessions: Map<string, ChatSession> = new Map();
  private contexts: Map<string, AgentContext> = new Map();

  constructor() {
    this.groqClient = new GroqClient();
    this.mcpClient = new MCPClient();
  }

  /**
   * Processa uma mensagem do usuário e retorna resposta do agente
   */
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const sessionId = request.sessionId || uuidv4();
      
      // Obter ou criar sessão com memória persistente
      const enhancedSession = sessionStore.getOrCreateSession(sessionId);
      const session = this.getOrCreateSession(sessionId);
      const context = this.getOrCreateContext(sessionId);
      
      // Incrementar contador de interações
      sessionStore.incrementInteractionCount(sessionId);
      
      // Extrair informações do usuário da mensagem
      this.extractUserDataFromMessage(sessionId, request.message);

      // Adicionar mensagem do usuário
      const userMessage: ChatMessage = {
        role: 'user',
        content: request.message,
        timestamp: new Date()
      };
      session.messages.push(userMessage);

      // Converter mensagens para formato Groq com contexto enriquecido
      const groqMessages = this.convertToGroqMessages(session);
      
      // Adicionar contexto da sessão se houver
      const enrichedContext = sessionStore.getEnrichedContext(sessionId);
      if (enrichedContext && groqMessages.length > 0) {
        // Adicionar contexto ao prompt do sistema
        groqMessages[0].content += enrichedContext;
      }

      // Primeira chamada ao Groq (pode incluir tool calls)
      console.log('🤖 Processando mensagem com Groq...');
      const groqResponse = await this.groqClient.generateResponse(
        groqMessages,
        filazeroTools
      );

      const toolsUsed: string[] = [];
      let finalContent = groqResponse.content || '';

      // Processar tool calls se houver
      if (groqResponse.toolCalls && groqResponse.toolCalls.length > 0) {
        console.log(`🛠️ Executando ${groqResponse.toolCalls.length} ferramentas...`);

        // Adicionar mensagem do assistente com tool calls
        const assistantMessage: GroqMessage = {
          role: 'assistant',
          content: null,
          tool_calls: groqResponse.toolCalls.map(call => ({
            id: call.id,
            type: 'function',
            function: {
              name: call.name,
              arguments: JSON.stringify(call.arguments)
            }
          }))
        };
        groqMessages.push(assistantMessage);

        // Executar cada ferramenta
        for (const toolCall of groqResponse.toolCalls) {
          try {
            console.log(`🔧 Executando: ${toolCall.name}`);
            
            // Preparar argumentos com valores padrão se necessário
            const args = this.prepareToolArguments(toolCall.name, toolCall.arguments);
            
            // Chamar ferramenta MCP
            const toolResult = await this.mcpClient.callTool(toolCall.name, args);
            
            toolsUsed.push(toolCall.name);

            // Atualizar contexto baseado no resultado
            this.updateContext(context, toolCall.name, toolResult);
            
            // Salvar informações relevantes na memória persistente
            this.updatePersistentMemory(sessionId, toolCall.name, toolResult);

            // Adicionar resultado da ferramenta às mensagens
            const toolMessage = this.groqClient.createToolMessage(
              toolCall.id,
              JSON.stringify(toolResult, null, 2)
            );
            groqMessages.push(toolMessage);

          } catch (error: any) {
            console.error(`❌ Erro na ferramenta ${toolCall.name}:`, error.message);
            
            // Adicionar erro às mensagens
            const errorMessage = this.groqClient.createToolMessage(
              toolCall.id,
              `Erro ao executar ${toolCall.name}: ${error.message}`
            );
            groqMessages.push(errorMessage);
          }
        }

        // Segunda chamada ao Groq para gerar resposta final
        console.log('🤖 Gerando resposta final com resultados das ferramentas...');
        const finalGroqResponse = await this.groqClient.generateResponse(groqMessages);
        finalContent = finalGroqResponse.content || 'Desculpe, não consegui processar sua solicitação.';
      }

      // Sanitização final para evitar revelar termos técnicos
      finalContent = this.sanitizeForPatient(finalContent);

      // Criar mensagem do assistente
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: finalContent,
        timestamp: new Date()
      };
      session.messages.push(assistantMessage);

      // Atualizar sessão
      session.updatedAt = new Date();

      return {
        response: finalContent,
        sessionId,
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('❌ Erro no AgentService:', error.message);
      
      return {
        response: `Desculpe, ocorreu um erro ao processar sua mensagem: ${error.message}`,
        sessionId: request.sessionId || uuidv4(),
        timestamp: new Date()
      };
    }
  }

  /**
   * Prepara argumentos da ferramenta com valores padrão
   */
  private prepareToolArguments(toolName: string, args: Record<string, any>): Record<string, any> {
    const prepared = { ...args };

    switch (toolName) {
      case 'get_terminal':
        // Usar accessKey padrão se não fornecido
        if (!prepared.accessKey) {
          prepared.accessKey = FILAZERO_CONFIG.DEFAULT_ACCESS_KEY;
        }
        break;
        
      case 'create_ticket':
        // Garantir browserUuid
        if (!prepared.browserUuid) {
          prepared.browserUuid = generateBrowserUuid();
        }
        
        // Obter configuração padrão e mesclar
        const defaultConfig = getDefaultTicketConfig();
        Object.assign(prepared, defaultConfig);
        
        // ⚠️ VALIDAÇÃO CRÍTICA: Corrigir IDs incorretos se a IA inventou valores
        this.validateAndFixTicketIds(prepared);
        break;
    }

    return prepared;
  }

  /**
   * Valida e corrige IDs incorretos no create_ticket
   */
  private validateAndFixTicketIds(args: Record<string, any>): void {
    // Detectar IDs incorretos comuns que a IA inventa
    const incorrectProviders = [906, 730, 777, 769]; // IDs de outras empresas
    const incorrectLocations = [0]; // IDs inválidos
    const incorrectServices = [2, 123]; // IDs que não existem no terminal Filazero
    
    // Se detectar IDs incorretos, aplicar os valores corretos do terminal Filazero
    if (incorrectProviders.includes(args.pid)) {
      console.log(`🔧 Corrigindo Provider ID ${args.pid} → ${FILAZERO_CONFIG.PROVIDER_ID} (Filazero)`);
      args.pid = FILAZERO_CONFIG.PROVIDER_ID;
    }
    
    if (incorrectLocations.includes(args.locationId)) {
      console.log(`🔧 Corrigindo Location ID ${args.locationId} → ${FILAZERO_CONFIG.LOCATION_ID} (AGENCIA-001)`);
      args.locationId = FILAZERO_CONFIG.LOCATION_ID;
    }
    
    if (incorrectServices.includes(args.serviceId)) {
      console.log(`🔧 Corrigindo Service ID ${args.serviceId} → ${FILAZERO_CONFIG.SERVICE_ID} (FISIOTERAPIA)`);
      args.serviceId = FILAZERO_CONFIG.SERVICE_ID;
    }

    // Corrigir terminalSchedule se contém valores de exemplo
    if (args.terminalSchedule) {
      if (args.terminalSchedule.sessionId === 123) {
        console.log(`🔧 Corrigindo Session ID 123 → ${FILAZERO_CONFIG.DEFAULT_SESSION_ID} (real)`);
        args.terminalSchedule.sessionId = FILAZERO_CONFIG.DEFAULT_SESSION_ID;
      }
      
      // Usar accessKey padrão sempre
      if (args.terminalSchedule.publicAccessKey !== FILAZERO_CONFIG.DEFAULT_ACCESS_KEY) {
        console.log(`🔧 Corrigindo Access Key para padrão: ${FILAZERO_CONFIG.DEFAULT_ACCESS_KEY}`);
        args.terminalSchedule.publicAccessKey = FILAZERO_CONFIG.DEFAULT_ACCESS_KEY;
      }
    }
  }

  /**
   * Atualiza contexto baseado no resultado da ferramenta
   */
  private updateContext(context: AgentContext, toolName: string, result: any) {
    switch (toolName) {
      case 'get_terminal':
        if (result) {
          context.currentTerminal = result;
        }
        break;
      
      case 'create_ticket':
      case 'get_ticket':
        if (result) {
          context.currentTicket = result;
        }
        break;
    }
  }

  /**
   * Converte mensagens da sessão para formato Groq
   */
  private convertToGroqMessages(session: ChatSession): GroqMessage[] {
    const messages: GroqMessage[] = [];
    
    // Adicionar mensagem de sistema
    messages.push(this.groqClient.createSystemMessage());

    // Converter mensagens da sessão
    for (const msg of session.messages) {
      messages.push({
        role: msg.role as any,
        content: msg.content
      });
    }

    return messages;
  }

  /**
   * Obtém ou cria sessão
   */
  private getOrCreateSession(sessionId: string): ChatSession {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return this.sessions.get(sessionId)!;
  }

  /**
   * Obtém ou cria contexto
   */
  private getOrCreateContext(sessionId: string): AgentContext {
    if (!this.contexts.has(sessionId)) {
      this.contexts.set(sessionId, {});
    }
    return this.contexts.get(sessionId)!;
  }

  /**
   * Obtém informações da sessão
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Lista todas as sessões ativas
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Remove sessão antiga (cleanup)
   */
  cleanupSession(sessionId: string): boolean {
    const removed = this.sessions.delete(sessionId);
    this.contexts.delete(sessionId);
    return removed;
  }

  /**
   * Limpa sessões antigas (mais de 1 hora)
   */
  cleanupOldSessions(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.updatedAt < oneHourAgo) {
        this.cleanupSession(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Limpeza: ${cleaned} sessões antigas removidas`);
    }

    // Também limpar sessões persistentes antigas
    sessionStore.cleanupOldSessions();

    return cleaned;
  }

  /**
   * Extrai dados do usuário da mensagem de forma mais eficiente
   */
  private extractUserDataFromMessage(sessionId: string, message: string) {
    const userData: any = {};
    
    // Extrair nome (padrões mais abrangentes)
    const namePatterns = [
      /(?:meu nome é|me chamo|sou o?a?)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
      /(?:nome|para)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
      /(?:quero|gostaria|preciso)\s+(?:de|fazer)\s+(?:um|uma)\s+(?:agendamento|consulta|atendimento)\s+(?:para|com)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        userData.name = match[1].trim();
        break;
      }
    }
    
    // Extrair telefone (padrões mais flexíveis)
    const phonePatterns = [
      /(?:telefone|tel|fone|celular|cel|whatsapp)[\s:]*([0-9\s\-\(\)]+)/i,
      /([0-9]{2}[0-9\s\-\(\)]{8,})/i, // DDD + número
      /(?:meu|o)\s+(?:telefone|celular)\s+(?:é|é\s+o)\s+([0-9\s\-\(\)]+)/i
    ];
    
    for (const pattern of phonePatterns) {
      const phoneMatch = message.match(pattern);
      if (phoneMatch && phoneMatch[1]) {
        userData.phone = phoneMatch[1].replace(/\D/g, '');
        if (userData.phone.length >= 10) break; // DDD + número
      }
    }
    
    // Extrair email (padrões mais flexíveis)
    const emailPatterns = [
      /(?:email|e-mail|e-mail)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /(?:meu|o)\s+(?:email|e-mail)\s+(?:é|é\s+o)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i // Email solto na mensagem
    ];
    
    for (const pattern of emailPatterns) {
      const emailMatch = message.match(pattern);
      if (emailMatch && emailMatch[1]) {
        userData.email = emailMatch[1].toLowerCase();
        break;
      }
    }
    
    // NÃO extrair serviço - usar sempre FISIOTERAPIA como padrão
    // userData.preferredService = 'FISIOTERAPIA';
    
    // Atualizar se encontrou alguma informação
    if (Object.keys(userData).length > 0) {
      sessionStore.updateUserData(sessionId, userData);
      console.log(`📝 Dados extraídos da mensagem:`, userData);
    }
  }

  /**
   * Atualiza memória persistente com resultados das ferramentas
   */
  private updatePersistentMemory(sessionId: string, toolName: string, result: any) {
    switch (toolName) {
      case 'get_terminal':
        if (result && result.provider && result.location) {
          // Salvar terminal usado como padrão (sempre usar accessKey padrão)
          const accessKey = FILAZERO_CONFIG.DEFAULT_ACCESS_KEY;
          sessionStore.setDefaultTerminal(sessionId, {
            accessKey,
            providerId: result.provider.id,
            locationId: result.location.id
          });
        }
        break;
        
      case 'create_ticket':
        if (result && result.responseData) {
          const tickets = result.responseData.tickets || [];
          if (tickets.length > 0) {
            // Salvar ticket criado no histórico
            sessionStore.addCreatedTicket(sessionId, {
              id: tickets[0],
              smartCode: result.responseData.smartCode || '',
              service: FILAZERO_CONFIG.DEFAULT_SERVICE
            });
          }
        }
        break;
    }
  }

  /**
   * Testa conectividade com serviços
   */
  async healthCheck(): Promise<{
    groq: boolean;
    mcp: boolean;
    sessions: number;
  }> {
    const groqHealthy = GroqClient.validateConfig();
    const mcpHealthy = await this.mcpClient.testConnection();
    
    return {
      groq: groqHealthy,
      mcp: mcpHealthy,
      sessions: this.sessions.size
    };
  }

  /**
   * Obtém estatísticas do agente
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      groqModel: this.groqClient.getModelInfo(),
      mcpServer: this.mcpClient.getClientInfo(),
      uptime: process.uptime()
    };
  }

  /**
   * Sanitiza respostas para o paciente removendo trechos técnicos
   */
  private sanitizeForPatient(text: string): string {
    if (!text) return text;

    // Remover blocos de código e JSON
    let sanitized = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\{\s*\"?[a-zA-Z_][\s\S]*?\}\s*$/gm, '')
      .replace(/\[[\s\S]*?\]/g, '');

    // Ocultar termos técnicos específicos
    const forbiddenTerms = [
      'pid', 'locationId', 'serviceId', 'sessionId', 'publicAccessKey', 'browserUuid',
      'providerId', 'ticketId', 'tool', 'get_terminal', 'create_ticket', 'function', 'arguments', 'JSON'
    ];

    for (const term of forbiddenTerms) {
      const re = new RegExp(`\\b${term}\\b`, 'gi');
      sanitized = sanitized.replace(re, '');
    }

    // Compactar espaços múltiplos gerados pelas remoções
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').trim();

    // Garantir tom humano curto
    if (sanitized.length === 0) {
      sanitized = 'Certo! Vamos continuar. Como posso ajudar no seu agendamento?';
    }

    return sanitized;
  }
}