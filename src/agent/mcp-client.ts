/**
 * Cliente MCP para comunicação com o Servidor Filazero
 */

import { MCPRequest, MCPResponse, MCPTool } from '../types/agent.types.js';

export class MCPClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.MCP_SERVER_URL || 'https://mcp-filazero.vercel.app';
    this.timeout = 30000; // 30 segundos
  }

  /**
   * Chama uma ferramenta MCP
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    try {
      console.log(`🔧 Chamando ferramenta MCP: ${toolName}`, args);
      
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };

      const response = await this.makeRequest(request);
      
      if (response.error) {
        throw new Error(`MCP Error: ${response.error.message}`);
      }

      // Extrair conteúdo da resposta MCP
      const content = response.result?.content?.[0]?.text;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return content;
        }
      }

      return response.result;
    } catch (error: any) {
      console.error(`❌ Erro ao chamar ferramenta ${toolName}:`, error.message);
      throw new Error(`Falha ao executar ${toolName}: ${error.message}`);
    }
  }

  /**
   * Lista todas as ferramentas disponíveis no MCP
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      console.log('📋 Listando ferramentas MCP disponíveis...');
      
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list'
      };

      const response = await this.makeRequest(request);
      
      if (response.error) {
        throw new Error(`MCP Error: ${response.error.message}`);
      }

      return response.result?.tools || [];
    } catch (error: any) {
      console.error('❌ Erro ao listar ferramentas MCP:', error.message);
      throw new Error(`Falha ao listar ferramentas: ${error.message}`);
    }
  }

  /**
   * Faz uma requisição HTTP para o servidor MCP
   */
  private async makeRequest(request: MCPRequest): Promise<MCPResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FilazeroAgent/1.0'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MCPResponse = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout: MCP Server não respondeu em tempo hábil');
      }
      
      throw error;
    }
  }

  /**
   * Testa conectividade com o servidor MCP
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log(`🔍 Testando conexão com ${this.baseUrl}...`);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'FilazeroAgent/1.0' }
      });

      const isHealthy = response.ok;
      console.log(`${isHealthy ? '✅' : '❌'} MCP Server: ${isHealthy ? 'Conectado' : 'Falha na conexão'}`);
      
      return isHealthy;
    } catch (error: any) {
      console.error('❌ Falha ao conectar com MCP Server:', error.message);
      return false;
    }
  }

  /**
   * Métodos de conveniência para ferramentas específicas
   */

  // Terminal
  async getTerminal(accessKey: string) {
    return await this.callTool('get_terminal', { accessKey });
  }

  // Tickets
  async createTicket(params: {
    terminalSchedule: any;
    pid: number;
    locationId: number;
    serviceId: number;
    customer: { name: string; phone: string; email: string };
    browserUuid: string;
    priority?: number;
  }) {
    return await this.callTool('create_ticket', params);
  }

  async getTicket(id: number) {
    return await this.callTool('get_ticket', { id });
  }

  async getQueuePosition(providerId: number, ticketId: number) {
    return await this.callTool('get_queue_position', { providerId, ticketId });
  }

  async getTicketPrevision(ticketId: number) {
    return await this.callTool('get_ticket_prevision', { ticketId });
  }

  async cancelTicket(ticketId: number, providerId: number, cancellation?: string) {
    return await this.callTool('cancel_ticket', { ticketId, providerId, cancellation });
  }

  async checkinTicket(smartCode: string, providerId: number) {
    return await this.callTool('checkin_ticket', { smartCode, providerId });
  }

  async confirmPresence(ticketId: number, providerId: number) {
    return await this.callTool('confirm_presence', { ticketId, providerId });
  }

  // Outros
  async updateFeedback(feedbackId: number, guid: string, rate: number, comment?: string) {
    return await this.callTool('update_feedback', { feedbackId, guid, rate, comment });
  }

  async getService(id: number) {
    return await this.callTool('get_service', { id });
  }

  async getCompanyTemplate(slug: string) {
    return await this.callTool('get_company_template', { slug });
  }

  /**
   * Obtém informações sobre o cliente
   */
  getClientInfo() {
    return {
      serverUrl: this.baseUrl,
      timeout: this.timeout,
      userAgent: 'FilazeroAgent/1.0'
    };
  }
}