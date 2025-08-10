/**
 * Serviço principal do Agente Filazero
 * Orquestra a comunicação entre Groq e MCP
 */

import { v4 as uuidv4 } from 'uuid';
import { GroqClient } from './groq-client.js';
import { MCPClient } from './mcp-client.js';
import { filazeroTools, generateBrowserUuid } from './function-tools.js';
import { 
  ChatMessage, 
  ChatSession, 
  ChatRequest, 
  ChatResponse, 
  GroqMessage,
  AgentContext 
} from '../types/agent.types.js';

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
      
      // Obter ou criar sessão
      const session = this.getOrCreateSession(sessionId);
      const context = this.getOrCreateContext(sessionId);

      // Adicionar mensagem do usuário
      const userMessage: ChatMessage = {
        role: 'user',
        content: request.message,
        timestamp: new Date()
      };
      session.messages.push(userMessage);

      // Converter mensagens para formato Groq
      const groqMessages = this.convertToGroqMessages(session);

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
      case 'create_ticket':
        // Garantir browserUuid
        if (!prepared.browserUuid) {
          prepared.browserUuid = generateBrowserUuid();
        }
        
        // Garantir priority padrão
        if (prepared.priority === undefined) {
          prepared.priority = 0;
        }
        break;
    }

    return prepared;
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

    return cleaned;
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
}