/**
 * Rotas da API do Chat para o Agente Filazero
 */

import { Router, Request, Response } from 'express';
import { AgentService } from '../agent/agent.service.js';
import { ChatRequest } from '../types/agent.types.js';
import { sessionStore } from '../services/session-store.js';

const router = Router();
const agentService = new AgentService();

/**
 * POST /api/chat - Envia mensagem para o agente
 */
router.post('/chat', async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('📨 Nova mensagem recebida:', req.body);
    
    const { message, sessionId, context } = req.body as ChatRequest;
    
    // Validação básica
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Mensagem é obrigatória e deve ser uma string',
        code: 'INVALID_MESSAGE'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        error: 'Mensagem muito longa (máximo 2000 caracteres)',
        code: 'MESSAGE_TOO_LONG'
      });
    }

    // Processar mensagem com o agente
    const chatResponse = await agentService.processMessage({
      message: message.trim(),
      sessionId,
      context
    });

    console.log('✅ Resposta gerada:', {
      sessionId: chatResponse.sessionId,
      toolsUsed: chatResponse.toolsUsed,
      responseLength: chatResponse.response.length
    });

    res.json(chatResponse);

  } catch (error: any) {
    console.error('❌ Erro na rota /chat:', error.message);
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/session/:sessionId - Obtém informações da sessão
 */
router.get('/session/:sessionId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { sessionId } = req.params;
    
    const session = agentService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    res.json({
      session: {
        id: session.id,
        messageCount: session.messages.length,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });

  } catch (error: any) {
    console.error('❌ Erro na rota /session:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/session/:sessionId - Remove uma sessão
 */
router.delete('/session/:sessionId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { sessionId } = req.params;
    
    const removed = agentService.cleanupSession(sessionId);
    
    if (!removed) {
      return res.status(404).json({
        error: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    res.json({
      message: 'Sessão removida com sucesso',
      sessionId
    });

  } catch (error: any) {
    console.error('❌ Erro ao remover sessão:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health - Health check do agente
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await agentService.healthCheck();
    const stats = agentService.getStats();
    
    const status = health.groq && health.mcp ? 'healthy' : 'degraded';
    const httpStatus = status === 'healthy' ? 200 : 503;
    
    res.status(httpStatus).json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        groq: health.groq ? 'connected' : 'disconnected',
        mcp: health.mcp ? 'connected' : 'disconnected'
      },
      stats: {
        activeSessions: health.sessions,
        uptime: stats.uptime,
        model: stats.groqModel.model,
        mcpServer: stats.mcpServer.serverUrl
      }
    });

  } catch (error: any) {
    console.error('❌ Erro no health check:', error.message);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/sessions - Lista sessões ativas
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const activeSessions = agentService.getActiveSessions();
    
    res.json({
      count: activeSessions.length,
      sessions: activeSessions,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro ao listar sessões:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cleanup - Limpa sessões antigas
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const cleaned = agentService.cleanupOldSessions();
    
    res.json({
      message: 'Limpeza concluída',
      sessionsRemoved: cleaned,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro na limpeza:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats - Estatísticas do agente
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = agentService.getStats();
    const memoryStats = sessionStore.getStats();
    
    res.json({
      ...stats,
      memory: memoryStats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/:sessionId - Obtém memória persistente de uma sessão
 */
router.get('/memory/:sessionId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { sessionId } = req.params;
    
    const session = sessionStore.getOrCreateSession(sessionId);
    const enrichedContext = sessionStore.getEnrichedContext(sessionId);
    
    res.json({
      sessionId: session.id,
      userData: session.userData || {},
      ticketsCreated: session.ticketsCreated,
      defaultTerminal: session.defaultTerminal,
      interactionCount: session.interactionCount,
      previousSummary: session.previousSummary,
      enrichedContext,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt
    });

  } catch (error: any) {
    console.error('❌ Erro ao obter memória:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET / - Endpoint raiz com documentação
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Filazero Agent API',
    version: '1.0.0',
    description: 'API do Agente de IA para o sistema Filazero',
    endpoints: {
      'POST /api/chat': 'Enviar mensagem para o agente',
      'GET /api/health': 'Status de saúde do agente',
      'GET /api/stats': 'Estatísticas do agente (incluindo memória)',
      'GET /api/sessions': 'Listar sessões ativas',
      'GET /api/session/:id': 'Informações de uma sessão',
      'GET /api/memory/:id': 'Memória persistente de uma sessão',
      'DELETE /api/session/:id': 'Remover sessão',
      'POST /api/cleanup': 'Limpar sessões antigas'
    },
    usage: {
      chat: {
        method: 'POST',
        url: '/api/chat',
        body: {
          message: 'Sua mensagem aqui',
          sessionId: 'uuid-opcional'
        }
      }
    },
    integration: {
      groq: 'Llama 3.1 70B (Function Calling)',
      mcp: 'Filazero MCP Server',
      tools: 11
    }
  });
});

export default router;