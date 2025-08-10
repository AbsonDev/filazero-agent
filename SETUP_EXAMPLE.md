# Exemplo de Funcionamento do Setup Inicial

## Como funciona agora

Quando um usuário inicia uma nova conversa com o agente Filazero, o sistema agora segue um fluxo estruturado de configuração inicial antes de processar outras solicitações.

## Fluxo do Setup

### 1. Primeira Mensagem do Usuário
```
Usuário: "Olá, preciso criar um ticket"
```

### 2. Resposta do Agente (Setup Inicial)
```
Agente: "Olá! Bem-vindo ao Filazero! 👋

Antes de te ajudar com o ticket, preciso configurar seu ambiente de monitoramento.

Primeiro, vou coletar algumas informações básicas do sistema...
[coleta informações automaticamente]

Agora, me diga quais serviços do Filazero você gostaria de monitorar:

📋 **Tickets** - Senhas de atendimento e filas
🏢 **Terminais** - Pontos de atendimento físicos  
⏳ **Filas** - Estado das filas em tempo real
🏛️ **Provedores** - Empresas e órgãos parceiros
🕐 **Sessões** - Horários de funcionamento
👥 **Clientes** - Informações de usuários
📊 **Relatórios** - Estatísticas e dados

Quais desses serviços você precisa monitorar?"
```

### 3. Resposta do Usuário
```
Usuário: "Quero monitorar tickets, terminais e filas"
```

### 4. Configuração Concluída
```
Agente: "Perfeito! ✅

Configuração concluída:
- Sistema: Linux (usuário: admin)
- Serviços ativos: Tickets, Terminais, Filas  
- Diretório: /workspace

Agora posso te ajudar com seu ticket! Como você gostaria de prosseguir?"
```

## Informações Coletadas

### Sistema
- Plataforma (Linux, Windows, macOS)
- Nome do usuário
- Diretório atual
- Fuso horário
- Informações de memória

### Serviços Configurados
- Lista de serviços que o usuário quer monitorar
- Cada serviço pode ser ativado/desativado
- Configuração salva na sessão

## APIs de Monitoramento

### Verificar Status do Setup
```bash
GET /api/setup/{sessionId}
```

Resposta:
```json
{
  "sessionId": "uuid-da-sessao",
  "isConfigured": true,
  "configuration": {
    "services": {
      "tickets": true,
      "terminals": true,
      "queues": true,
      "providers": false,
      "sessions": false,
      "customers": false,
      "reports": false
    },
    "systemInfo": {
      "platform": "linux",
      "username": "admin",
      "currentDirectory": "/workspace",
      "timezone": "America/Sao_Paulo"
    },
    "setupStatus": {
      "isSetupComplete": true,
      "servicesConfigured": true,
      "systemInfoCollected": true,
      "currentStep": "complete"
    }
  },
  "nextStep": "complete"
}
```

### Resetar Configuração
```bash
POST /api/setup/{sessionId}/reset
```

## Vantagens

1. **Contexto Personalizado**: O agente sabe exatamente quais serviços o usuário precisa
2. **Informações do Sistema**: Respostas mais precisas baseadas no ambiente
3. **Configuração Persistente**: Setup salvo durante toda a sessão
4. **Fluxo Controlado**: Evita confusão e garante configuração adequada
5. **Facilidade de Debug**: APIs para verificar e resetar configuração

## Comportamento Anterior vs Novo

### Antes:
- Usuário perguntava algo qualquer
- Agente respondia diretamente sem contexto
- Nenhuma configuração prévia

### Agora:
- Setup obrigatório na primeira interação
- Coleta informações do sistema
- Pergunta quais serviços monitorar
- Só responde outras perguntas após configuração completa
- Contexto rico e personalizado