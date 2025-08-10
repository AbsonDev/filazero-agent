from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import re

app = Flask(__name__)

# Armazenar conversas em memória (em produção, usar banco de dados)
conversations = {}

# Base de conhecimento sobre serviços do terminal
SERVICOS_TERMINAL = {
    "transporte": {
        "titulo": "🚌 Transporte Rodoviário",
        "descricao": "Oferecemos passagens para diversas cidades com múltiplas empresas parceiras",
        "detalhes": [
            "• Ônibus executivo, convencional e leito",
            "• Destinos nacionais e internacionais",
            "• Horários flexíveis ao longo do dia",
            "• Preços competitivos"
        ]
    },
    "encomendas": {
        "titulo": "📦 Envio de Encomendas",
        "descricao": "Serviço de envio e recebimento de pacotes",
        "detalhes": [
            "• Envio para todo o Brasil",
            "• Rastreamento em tempo real",
            "• Seguro opcional",
            "• Entrega expressa disponível"
        ]
    },
    "guarda_volumes": {
        "titulo": "🎒 Guarda-Volumes",
        "descricao": "Armazenamento seguro de bagagens",
        "detalhes": [
            "• Armários de diversos tamanhos",
            "• Sistema de segurança 24h",
            "• Preços por hora ou diária",
            "• Acesso facilitado"
        ]
    },
    "alimentacao": {
        "titulo": "🍽️ Praça de Alimentação",
        "descricao": "Diversas opções gastronômicas",
        "detalhes": [
            "• Restaurantes e lanchonetes",
            "• Cafeterias",
            "• Lojas de conveniência",
            "• Opções vegetarianas/veganas"
        ]
    },
    "servicos_gerais": {
        "titulo": "🏢 Serviços Gerais",
        "descricao": "Outros serviços disponíveis no terminal",
        "detalhes": [
            "• Caixas eletrônicos 24h",
            "• Farmácia",
            "• Banheiros e fraldário",
            "• Wi-Fi gratuito",
            "• Carregadores de celular",
            "• Informações turísticas"
        ]
    }
}

HORARIOS_FUNCIONAMENTO = {
    "terminal": "24 horas por dia, 7 dias por semana",
    "bilheteria": "Das 5h às 23h",
    "guarda_volumes": "Das 6h às 22h",
    "praca_alimentacao": "Das 6h às 23h",
    "informacoes": "Das 6h às 22h"
}

class ChatBot:
    def __init__(self):
        self.contexto = {}
        
    def detectar_intencao(self, mensagem):
        """Detecta a intenção do usuário baseado na mensagem"""
        msg_lower = mensagem.lower()
        
        # Palavras-chave para diferentes intenções
        servicos_keywords = ['serviço', 'servico', 'oferec', 'tem', 'disponível', 'disponivel', 
                           'fazem', 'faz', 'terminal', 'rodoviária', 'rodoviaria', 'o que']
        
        passagem_keywords = ['passagem', 'ônibus', 'onibus', 'viagem', 'viajar', 'destino', 
                           'horário', 'horario', 'linha', 'empresa', 'comprar']
        
        encomenda_keywords = ['encomenda', 'pacote', 'enviar', 'envio', 'entregar', 'entrega',
                            'receber', 'carga', 'mercadoria']
        
        guarda_volumes_keywords = ['guarda', 'volume', 'bagagem', 'mala', 'mochila', 'guardar',
                                  'deixar', 'armário', 'armario']
        
        alimentacao_keywords = ['comer', 'comida', 'lanche', 'restaurante', 'café', 'cafe',
                              'almoço', 'almoco', 'jantar', 'beber']
        
        horario_keywords = ['horário', 'horario', 'hora', 'quando', 'abre', 'fecha', 
                          'funcionamento', 'funciona']
        
        contato_keywords = ['contato', 'telefone', 'email', 'falar', 'atendente', 'ajuda',
                          'suporte', 'reclamar', 'reclamação']
        
        # Verificar intenções
        if any(kw in msg_lower for kw in servicos_keywords):
            return 'servicos_geral'
        elif any(kw in msg_lower for kw in passagem_keywords):
            return 'passagem'
        elif any(kw in msg_lower for kw in encomenda_keywords):
            return 'encomenda'
        elif any(kw in msg_lower for kw in guarda_volumes_keywords):
            return 'guarda_volumes'
        elif any(kw in msg_lower for kw in alimentacao_keywords):
            return 'alimentacao'
        elif any(kw in msg_lower for kw in horario_keywords):
            return 'horario'
        elif any(kw in msg_lower for kw in contato_keywords):
            return 'contato'
        else:
            return 'outro'
    
    def extrair_dados_pessoais(self, mensagem):
        """Extrai dados pessoais da mensagem se houver"""
        dados = {}
        
        # Detectar email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, mensagem)
        if email_match:
            dados['email'] = email_match.group()
        
        # Detectar telefone (formato brasileiro)
        telefone_pattern = r'(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-.\s]?\d{4}'
        telefone_match = re.search(telefone_pattern, mensagem)
        if telefone_match:
            dados['telefone'] = telefone_match.group()
        
        return dados
    
    def gerar_resposta_servicos(self):
        """Gera uma resposta completa sobre os serviços do terminal"""
        resposta = "🏢 **Bem-vindo ao Terminal Rodoviário!**\n\n"
        resposta += "Aqui estão nossos principais serviços:\n\n"
        
        for key, servico in SERVICOS_TERMINAL.items():
            resposta += f"{servico['titulo']}\n"
            resposta += f"{servico['descricao']}\n"
            for detalhe in servico['detalhes']:
                resposta += f"{detalhe}\n"
            resposta += "\n"
        
        resposta += "📍 **Horários de Funcionamento:**\n"
        for local, horario in HORARIOS_FUNCIONAMENTO.items():
            resposta += f"• {local.replace('_', ' ').title()}: {horario}\n"
        
        resposta += "\n💬 Posso ajudar com algo específico? Digite:\n"
        resposta += "• 'passagem' para informações sobre viagens\n"
        resposta += "• 'encomenda' para envio de pacotes\n"
        resposta += "• 'guarda volumes' para guardar bagagens\n"
        resposta += "• 'alimentação' para opções de comida\n"
        resposta += "• 'contato' para falar com um atendente"
        
        return resposta
    
    def gerar_resposta_passagem(self):
        """Gera resposta sobre passagens"""
        resposta = "🚌 **Informações sobre Passagens**\n\n"
        resposta += "Trabalhamos com as principais empresas:\n"
        resposta += "• Viação Cometa\n"
        resposta += "• Viação Itapemirim\n"
        resposta += "• Expresso do Sul\n"
        resposta += "• Águia Branca\n\n"
        resposta += "**Como comprar:**\n"
        resposta += "1. Direto no guichê (5h às 23h)\n"
        resposta += "2. Pelo nosso site (24h)\n"
        resposta += "3. Pelo telefone: (11) 3333-4444\n\n"
        resposta += "Para consultar horários e preços, preciso saber:\n"
        resposta += "• Cidade de destino\n"
        resposta += "• Data da viagem\n\n"
        resposta += "Qual destino você procura?"
        
        return resposta
    
    def gerar_resposta_encomenda(self):
        """Gera resposta sobre encomendas"""
        resposta = "📦 **Serviço de Encomendas**\n\n"
        resposta += "**Para enviar:**\n"
        resposta += "• Traga o pacote embalado\n"
        resposta += "• Documento com foto\n"
        resposta += "• Dados do destinatário\n\n"
        resposta += "**Tarifas:**\n"
        resposta += "• Até 5kg: R$ 25,00\n"
        resposta += "• 5-10kg: R$ 40,00\n"
        resposta += "• 10-20kg: R$ 60,00\n"
        resposta += "• Acima de 20kg: consultar\n\n"
        resposta += "**Prazo de entrega:**\n"
        resposta += "• Capital: 1-2 dias úteis\n"
        resposta += "• Interior: 2-4 dias úteis\n"
        resposta += "• Outros estados: 3-7 dias úteis\n\n"
        resposta += "Deseja enviar uma encomenda agora?"
        
        return resposta
    
    def gerar_resposta_contato(self, session_id):
        """Gera resposta solicitando contato"""
        if session_id not in self.contexto:
            self.contexto[session_id] = {}
        
        contexto = self.contexto[session_id]
        
        if 'nome' not in contexto:
            return ("Para conectar você com um atendente, preciso de algumas informações.\n\n"
                   "Por favor, me informe seu **nome completo**:")
        elif 'telefone' not in contexto:
            return (f"Obrigado, {contexto['nome']}!\n\n"
                   "Agora preciso do seu **telefone** para contato (com DDD):")
        elif 'email' not in contexto:
            return ("Por último, qual seu **e-mail**?\n"
                   "(Usaremos para enviar o protocolo de atendimento)")
        else:
            resposta = f"✅ **Dados registrados com sucesso!**\n\n"
            resposta += f"**Nome:** {contexto['nome']}\n"
            resposta += f"**Telefone:** {contexto['telefone']}\n"
            resposta += f"**E-mail:** {contexto['email']}\n\n"
            resposta += "🎫 **Protocolo:** #" + datetime.now().strftime("%Y%m%d%H%M%S") + "\n\n"
            resposta += "Um atendente entrará em contato em até 30 minutos.\n"
            resposta += "Horário de atendimento: Segunda a Sexta, 8h às 18h\n\n"
            resposta += "Enquanto isso, posso ajudar com mais alguma informação?"
            
            # Limpar contexto após coletar todos os dados
            self.contexto[session_id] = {}
            
            return resposta
    
    def processar_mensagem(self, mensagem, session_id):
        """Processa a mensagem e retorna uma resposta apropriada"""
        if session_id not in self.contexto:
            self.contexto[session_id] = {}
        
        contexto = self.contexto[session_id]
        
        # Extrair dados pessoais se houver
        dados_extraidos = self.extrair_dados_pessoais(mensagem)
        
        # Se estamos coletando dados para contato
        if 'coletando_contato' in contexto and contexto['coletando_contato']:
            if 'nome' not in contexto:
                # Assumir que a mensagem é o nome se não for email ou telefone
                if not dados_extraidos:
                    contexto['nome'] = mensagem.strip()
                    return self.gerar_resposta_contato(session_id)
            
            if dados_extraidos.get('telefone'):
                contexto['telefone'] = dados_extraidos['telefone']
            elif dados_extraidos.get('email'):
                contexto['email'] = dados_extraidos['email']
            
            return self.gerar_resposta_contato(session_id)
        
        # Detectar intenção
        intencao = self.detectar_intencao(mensagem)
        
        # Gerar resposta baseada na intenção
        if intencao == 'servicos_geral':
            return self.gerar_resposta_servicos()
        elif intencao == 'passagem':
            return self.gerar_resposta_passagem()
        elif intencao == 'encomenda':
            return self.gerar_resposta_encomenda()
        elif intencao == 'guarda_volumes':
            resposta = "🎒 **Guarda-Volumes**\n\n"
            resposta += "**Tamanhos e preços:**\n"
            resposta += "• Pequeno (mochila): R$ 10/dia\n"
            resposta += "• Médio (mala média): R$ 15/dia\n"
            resposta += "• Grande (mala grande): R$ 20/dia\n\n"
            resposta += "**Funcionamento:** 6h às 22h\n"
            resposta += "**Local:** Piso térreo, próximo aos guichês\n\n"
            resposta += "Deseja guardar algum volume?"
            return resposta
        elif intencao == 'alimentacao':
            resposta = "🍽️ **Praça de Alimentação**\n\n"
            resposta += "**Opções disponíveis:**\n"
            resposta += "• McDonald's\n"
            resposta += "• Subway\n"
            resposta += "• Restaurante Mineiro\n"
            resposta += "• Café Expresso\n"
            resposta += "• Padaria Pão de Açúcar\n\n"
            resposta += "**Horário:** 6h às 23h\n"
            resposta += "**Local:** 2º andar\n\n"
            resposta += "Também temos opções veganas e sem glúten!"
            return resposta
        elif intencao == 'horario':
            resposta = "🕐 **Horários de Funcionamento**\n\n"
            for local, horario in HORARIOS_FUNCIONAMENTO.items():
                resposta += f"**{local.replace('_', ' ').title()}:** {horario}\n"
            resposta += "\nPrecisa de informações sobre algum serviço específico?"
            return resposta
        elif intencao == 'contato':
            contexto['coletando_contato'] = True
            return self.gerar_resposta_contato(session_id)
        else:
            # Resposta padrão amigável
            resposta = "Olá! Sou o assistente virtual do Terminal Rodoviário. 😊\n\n"
            resposta += "Posso ajudar com:\n"
            resposta += "• Informações sobre nossos serviços\n"
            resposta += "• Compra de passagens\n"
            resposta += "• Envio de encomendas\n"
            resposta += "• Guarda-volumes\n"
            resposta += "• Praça de alimentação\n"
            resposta += "• Horários de funcionamento\n\n"
            resposta += "Como posso ajudar você hoje?"
            return resposta

# Instância global do chatbot
chatbot = ChatBot()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    mensagem = data.get('message', '')
    session_id = data.get('session_id', 'default')
    
    # Processar mensagem
    resposta = chatbot.processar_mensagem(mensagem, session_id)
    
    # Armazenar conversa
    if session_id not in conversations:
        conversations[session_id] = []
    
    conversations[session_id].append({
        'timestamp': datetime.now().isoformat(),
        'user': mensagem,
        'bot': resposta
    })
    
    return jsonify({
        'response': resposta,
        'session_id': session_id
    })

@app.route('/reset', methods=['POST'])
def reset():
    data = request.json
    session_id = data.get('session_id', 'default')
    
    if session_id in conversations:
        del conversations[session_id]
    if session_id in chatbot.contexto:
        del chatbot.contexto[session_id]
    
    return jsonify({'status': 'success', 'message': 'Conversa reiniciada'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)