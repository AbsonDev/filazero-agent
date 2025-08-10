# Terminal Rodoviário - Chatbot Assistente Virtual

Um chatbot inteligente e responsivo para atendimento ao cliente em terminais rodoviários, desenvolvido com Flask e JavaScript puro.

## 🚀 Características Principais

### ✅ Respostas Inteligentes sobre Serviços
- **Informações completas** sobre todos os serviços do terminal ANTES de coletar dados
- **Detecção de intenção** baseada em palavras-chave
- **Respostas contextualizadas** para cada tipo de solicitação

### 📊 Serviços Disponíveis
- 🚌 **Transporte Rodoviário** - Passagens e horários
- 📦 **Encomendas** - Envio e recebimento de pacotes
- 🎒 **Guarda-Volumes** - Armazenamento seguro
- 🍽️ **Praça de Alimentação** - Opções gastronômicas
- 🏢 **Serviços Gerais** - ATMs, farmácia, Wi-Fi, etc.

### 💡 Funcionalidades da Interface
- **Tema claro/escuro** com persistência
- **Botões de ação rápida** para perguntas frequentes
- **Seletor de emojis** integrado
- **Contador de caracteres** em tempo real
- **Indicador de digitação** animado
- **Design responsivo** para mobile e desktop
- **Notificações visuais** para feedback

### 🔧 Melhorias Implementadas
1. **Prioriza informações** - Responde primeiro sobre serviços antes de coletar dados
2. **Coleta inteligente** - Só pede dados quando realmente necessário
3. **Interface moderna** - UI/UX aprimorada com animações suaves
4. **Contexto mantido** - Mantém histórico da conversa por sessão
5. **Formatação rica** - Suporte a markdown básico nas mensagens

## 📋 Pré-requisitos

- Python 3.7+
- pip (gerenciador de pacotes Python)

## 🛠️ Instalação

1. Clone o repositório ou baixe os arquivos:
```bash
git clone <seu-repositorio>
cd terminal-chatbot
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

## ▶️ Como Executar

1. Execute a aplicação Flask:
```bash
python app.py
```

2. Abra seu navegador e acesse:
```
http://localhost:5000
```

## 📱 Como Usar

### Perguntas que o Bot Responde Bem:
- "Quais serviços vocês tem?"
- "Informações sobre passagens"
- "Quero enviar uma encomenda"
- "Horários de funcionamento"
- "Tem lugar para comer?"
- "Preciso falar com um atendente"

### Funcionalidades da Interface:
- **🌙 Modo Escuro**: Clique no ícone da lua para alternar
- **🗑️ Limpar Chat**: Remove todo o histórico da conversa
- **😊 Emojis**: Adicione emojis às suas mensagens
- **⚡ Respostas Rápidas**: Use os botões para perguntas comuns

## 🏗️ Estrutura do Projeto

```
terminal-chatbot/
│
├── app.py                 # Aplicação Flask principal
├── requirements.txt       # Dependências Python
├── README.md             # Este arquivo
│
├── templates/
│   └── index.html        # Template HTML principal
│
└── static/
    ├── css/
    │   └── style.css     # Estilos e temas
    └── js/
        └── chat.js       # Lógica do frontend
```

## 🔍 Detalhes Técnicos

### Backend (Flask)
- **Detecção de Intenção**: Analisa palavras-chave para entender o que o usuário precisa
- **Gerenciamento de Sessão**: Mantém contexto individual para cada usuário
- **Base de Conhecimento**: Informações estruturadas sobre todos os serviços
- **Extração de Dados**: Detecta automaticamente emails e telefones nas mensagens

### Frontend (JavaScript)
- **Classe ChatApp**: Gerencia toda a interação do usuário
- **LocalStorage**: Persiste preferências de tema
- **Fetch API**: Comunicação assíncrona com o backend
- **Formatação de Mensagens**: Converte markdown básico em HTML

## 🎨 Personalização

### Modificar Serviços
Edite o dicionário `SERVICOS_TERMINAL` em `app.py` para adicionar ou modificar serviços.

### Alterar Cores
Modifique as variáveis CSS em `:root` no arquivo `style.css`.

### Adicionar Novas Intenções
Adicione novos conjuntos de palavras-chave no método `detectar_intencao()` da classe ChatBot.

## 📈 Melhorias Futuras

- [ ] Integração com banco de dados
- [ ] Sistema de tickets/protocolos
- [ ] Análise de sentimento
- [ ] Suporte multilíngue
- [ ] Dashboard administrativo
- [ ] Integração com WhatsApp/Telegram
- [ ] Machine Learning para melhor detecção de intenção

## 🤝 Contribuindo

Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias!

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ para melhorar o atendimento em terminais rodoviários.

---

**Nota**: Este chatbot foi desenvolvido para demonstração. Em produção, considere adicionar autenticação, HTTPS, rate limiting e outras medidas de segurança.