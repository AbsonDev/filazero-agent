# 🤖 Filazero Agent

Agente de IA inteligente para o sistema Filazero com integração MCP (Model Context Protocol).

## ✨ Funcionalidades

- 🤖 **IA Conversacional**: Powered by Groq (Llama 3.1 70B)
- 🛠️ **11 Ferramentas Filazero**: Integração completa via MCP
- 💬 **Chat Natural**: Conversa em português sobre gestão de filas
- 🔧 **Function Calling**: Execução automática de ferramentas
- 📱 **API REST**: Fácil integração com frontends
- 🚀 **Gratuito**: Usa APIs gratuitas (Groq)

## 🚀 Início Rápido

### 1. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas configurações
nano .env
```

**Variáveis obrigatórias:**
```env
GROQ_API_KEY=your_groq_api_key_here  # Obtenha em https://console.groq.com
MCP_SERVER_URL=https://mcp-filazero.vercel.app
PORT=3001
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📡 API Endpoints

### Chat Principal
```bash
POST /api/chat
{
  "message": "Crie um ticket para João Silva",
  "sessionId": "uuid-opcional"
}
```

### Health Check
```bash
GET /api/health
```

### Estatísticas
```bash
GET /api/stats
```

## 🛠️ Ferramentas Disponíveis

O agente pode executar automaticamente:

1. **get_terminal** - Buscar terminal por chave
2. **create_ticket** - Criar ticket na fila
3. **get_ticket** - Consultar ticket
4. **get_queue_position** - Posição na fila
5. **get_ticket_prevision** - Previsão de atendimento
6. **cancel_ticket** - Cancelar ticket
7. **checkin_ticket** - Check-in com smart code
8. **confirm_presence** - Confirmar presença
9. **update_feedback** - Avaliar atendimento
10. **get_service** - Informações de serviços
11. **get_company_template** - Templates visuais

## 💬 Exemplos de Uso

### Criar Ticket
```
Usuário: "Quero agendar João Silva para acupuntura"
Agente: "Claro! Para criar o agendamento preciso de algumas informações:
- Telefone do João
- Email do João
- Chave do terminal onde será o atendimento

Você tem essas informações?"
```

### Consultar Fila
```
Usuário: "Qual a posição do ticket 4645805?"
Agente: *executa get_queue_position automaticamente*
"O ticket 4645805 está atualmente na posição 3 da fila. 
Previsão de atendimento: 15h30."
```

### Buscar Terminal
```
Usuário: "Me mostre o terminal ABC123"
Agente: *executa get_terminal automaticamente*
"Terminal encontrado:
- Nome: 01-TOTEM
- Local: Filazero AGENCIA-001
- Serviços: FISIOTERAPIA, DENTISTA, TOMOGRAFIA..."
```

## 🏗️ Arquitetura

```
Frontend → Agent API → Groq (IA) → MCP Client → Filazero MCP Server → Filazero API
```

### Componentes:
- **Groq Client**: Comunicação com Llama 3.1 70B
- **MCP Client**: Integração com servidor Filazero
- **Agent Service**: Orquestração e contexto
- **Express API**: Endpoints REST

## 🔧 Configuração Avançada

### Modelos Disponíveis (Groq):
- `llama-3.1-70b-versatile` (padrão, recomendado)
- `llama-3.1-8b-instant` (mais rápido)
- `mixtral-8x7b-32768` (alternativo)

### Variáveis Opcionais:
```env
AGENT_MODEL=llama-3.1-70b-versatile
AGENT_NAME=Assistente Filazero
LOG_LEVEL=info
```

## 🚀 Deploy

### Vercel/Netlify
```bash
# Build
npm run build

# Deploy pasta dist/
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 📊 Monitoramento

```bash
# Health check
curl http://localhost:3001/api/health

# Stats
curl http://localhost:3001/api/stats

# Sessões ativas
curl http://localhost:3001/api/sessions
```

## 🤝 Integração Frontend

### React/Next.js
```javascript
const chatWithAgent = async (message, sessionId) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });
  
  return await response.json();
};
```

### Vue.js
```javascript
export default {
  methods: {
    async sendMessage(message) {
      try {
        const { data } = await this.$http.post('/api/chat', {
          message,
          sessionId: this.sessionId
        });
        
        this.messages.push({
          role: 'assistant', 
          content: data.response
        });
      } catch (error) {
        console.error('Erro:', error);
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Erro "GROQ_API_KEY não configurada"
1. Acesse https://console.groq.com
2. Crie uma conta gratuita
3. Gere uma API key
4. Configure no `.env`

### Erro "MCP Server não responde"
1. Verifique se https://mcp-filazero.vercel.app está online
2. Teste: `curl https://mcp-filazero.vercel.app/health`
3. Configure `MCP_SERVER_URL` se necessário

### Performance lenta
1. Use modelo mais rápido: `AGENT_MODEL=llama-3.1-8b-instant`
2. Verifique rate limits do Groq
3. Monitore com `/api/stats`

## 📄 Licença

MIT - Filazero Team