/**
 * Servidor Express para o Agente Filazero
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.routes.js';

// Configuração de ambiente
const PORT = parseInt(process.env.PORT || '3001');
const NODE_ENV = process.env.NODE_ENV || 'development';

// Criar aplicação Express
const app = express();

// Middleware
app.use(cors({
  origin: NODE_ENV === 'production' ? 
    [
      'https://fila-chat-bot.vercel.app',
      'https://filachatbot-git-main-absondevs-projects.vercel.app',
      'https://filachatbot-absondevs-projects.vercel.app',
      /^https:\/\/.*\.vercel\.app$/
    ] : 
    ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Middleware de health check para monitoramento
app.use((req, res, next) => {
  res.setHeader('X-Service', 'filazero-agent');
  res.setHeader('X-Version', '1.0.0');
  next();
});

// Rotas
app.use('/api', chatRoutes);

// Middleware de tratamento de erros
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro não tratado:', error);
  
  res.status(error.status || 500).json({
    error: NODE_ENV === 'production' ? 'Erro interno do servidor' : error.message,
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/',
      'POST /api/chat',
      'GET /api/health',
      'GET /api/stats',
      'GET /api/sessions'
    ]
  });
});

// Função para inicializar o servidor
async function startServer() {
  try {
    // Configuração validada no GroqClient - usa chave fixa se necessário
    console.log('🔑 Groq API Key: ' + (process.env.GROQ_API_KEY ? 'Configurada via .env' : 'Usando chave fixa'));

    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Filazero Agent Server iniciado!');
      console.log(`📡 Servidor rodando em: http://0.0.0.0:${PORT}`);
      console.log(`🌍 Ambiente: ${NODE_ENV}`);
      console.log(`🤖 IA: Groq (${process.env.AGENT_MODEL || 'llama-3.1-70b-versatile'})`);
      console.log(`🔗 MCP Server: ${process.env.MCP_SERVER_URL || 'https://mcp-filazero.vercel.app'}`);
      console.log('');
      console.log('💡 Endpoints principais:');
      console.log(`   POST http://localhost:${PORT}/api/chat - Enviar mensagem`);
      console.log(`   GET  http://localhost:${PORT}/api/health - Health check`);
      console.log(`   GET  http://localhost:${PORT}/api/ - Documentação`);
      console.log('');
      
      if (NODE_ENV === 'development') {
        console.log('🔧 Modo desenvolvimento ativo');
        console.log('   CORS liberado para localhost:3000, :3001, :5173');
      }
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\\n⚡ Recebido sinal ${signal}, encerrando servidor...`);
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Tratamento de erros não capturados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection em:', promise, 'Motivo:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error: any) {
    console.error('❌ Falha ao iniciar servidor:', error.message);
    process.exit(1);
  }
}

// Inicializar apenas se não estiver sendo importado
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;