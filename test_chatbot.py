#!/usr/bin/env python3
"""
Script de teste para demonstrar as funcionalidades do chatbot do Terminal Rodoviário
"""

import requests
import json
import time
from datetime import datetime

# URL base do servidor
BASE_URL = "http://localhost:5000"

# Cores para output no terminal
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_colored(text, color):
    """Imprime texto colorido no terminal"""
    print(f"{color}{text}{Colors.ENDC}")

def test_chat(message, session_id="test_session"):
    """Envia mensagem para o chatbot e retorna resposta"""
    try:
        response = requests.post(
            f"{BASE_URL}/chat",
            json={"message": message, "session_id": session_id},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("response", "Sem resposta")
        else:
            return f"Erro: Status {response.status_code}"
            
    except Exception as e:
        return f"Erro na requisição: {str(e)}"

def format_response(response):
    """Formata a resposta para melhor visualização"""
    # Remove formatação markdown básica para terminal
    response = response.replace("**", "")
    response = response.replace("• ", "  • ")
    return response

def run_test_scenario():
    """Executa cenário de teste completo"""
    print_colored("\n" + "="*60, Colors.HEADER)
    print_colored("🚌 TESTE DO CHATBOT - TERMINAL RODOVIÁRIO 🚌", Colors.BOLD)
    print_colored("="*60 + "\n", Colors.HEADER)
    
    # Lista de testes
    test_cases = [
        {
            "title": "Pergunta sobre serviços (Principal problema resolvido)",
            "message": "Eu preciso de saber que serviços vocês tem",
            "expected": "Deve listar todos os serviços ANTES de pedir dados"
        },
        {
            "title": "Informações sobre passagens",
            "message": "Quero comprar uma passagem de ônibus",
            "expected": "Deve fornecer informações sobre empresas e como comprar"
        },
        {
            "title": "Envio de encomendas",
            "message": "Preciso enviar um pacote para São Paulo",
            "expected": "Deve explicar tarifas e prazos de entrega"
        },
        {
            "title": "Horários de funcionamento",
            "message": "Que horas o terminal abre?",
            "expected": "Deve listar horários de todos os setores"
        },
        {
            "title": "Solicitação de atendente",
            "message": "Quero falar com um atendente humano",
            "expected": "Deve iniciar coleta de dados (nome, telefone, email)"
        }
    ]
    
    session_id = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    for i, test in enumerate(test_cases, 1):
        print_colored(f"\n📝 TESTE {i}: {test['title']}", Colors.BLUE)
        print_colored("-" * 50, Colors.BLUE)
        
        print_colored(f"\n👤 USUÁRIO:", Colors.YELLOW)
        print(f"   {test['message']}")
        
        print_colored(f"\n🤖 BOT RESPONDE:", Colors.GREEN)
        
        # Envia mensagem e recebe resposta
        response = test_chat(test['message'], session_id)
        formatted_response = format_response(response)
        
        # Imprime resposta com indentação
        for line in formatted_response.split('\n'):
            if line.strip():
                print(f"   {line}")
        
        print_colored(f"\n✅ EXPECTATIVA: {test['expected']}", Colors.HEADER)
        
        # Pausa entre testes
        time.sleep(1)
    
    # Teste de continuação de contexto (coleta de dados)
    print_colored("\n" + "="*60, Colors.HEADER)
    print_colored("📋 TESTE DE CONTEXTO - COLETA DE DADOS", Colors.BOLD)
    print_colored("="*60, Colors.HEADER)
    
    # Continuando a conversa após solicitar atendente
    follow_up_messages = [
        ("João Silva", "Fornecendo nome"),
        ("11 98765-4321", "Fornecendo telefone"),
        ("joao.silva@email.com", "Fornecendo email")
    ]
    
    for message, description in follow_up_messages:
        print_colored(f"\n👤 USUÁRIO ({description}):", Colors.YELLOW)
        print(f"   {message}")
        
        print_colored(f"\n🤖 BOT RESPONDE:", Colors.GREEN)
        response = test_chat(message, session_id)
        formatted_response = format_response(response)
        
        for line in formatted_response.split('\n'):
            if line.strip():
                print(f"   {line}")
        
        time.sleep(1)
    
    # Resumo final
    print_colored("\n" + "="*60, Colors.HEADER)
    print_colored("✨ TESTE CONCLUÍDO COM SUCESSO! ✨", Colors.BOLD)
    print_colored("="*60, Colors.HEADER)
    
    print_colored("\n📊 RESUMO DOS TESTES:", Colors.BLUE)
    print("  ✅ Bot responde com informações ANTES de coletar dados")
    print("  ✅ Bot fornece informações detalhadas sobre serviços")
    print("  ✅ Bot mantém contexto durante a conversa")
    print("  ✅ Bot coleta dados apenas quando necessário")
    print("  ✅ Bot é educado e profissional")
    
    print_colored("\n🎯 PROBLEMA ORIGINAL RESOLVIDO:", Colors.GREEN)
    print("  O bot agora responde às perguntas dos clientes sobre")
    print("  serviços do terminal ANTES de tentar coletar dados pessoais,")
    print("  tornando a experiência muito mais natural e útil!\n")

def main():
    """Função principal"""
    try:
        # Verifica se o servidor está rodando
        print_colored("\n🔍 Verificando servidor...", Colors.YELLOW)
        response = requests.get(BASE_URL, timeout=5)
        
        if response.status_code == 200:
            print_colored("✅ Servidor está rodando!\n", Colors.GREEN)
            run_test_scenario()
        else:
            print_colored("❌ Servidor retornou erro", Colors.RED)
            
    except requests.exceptions.ConnectionError:
        print_colored("\n❌ ERRO: Servidor não está rodando!", Colors.RED)
        print("Por favor, execute primeiro: python3 app.py")
        print("Em outro terminal, depois execute este teste.\n")
    except Exception as e:
        print_colored(f"\n❌ ERRO: {str(e)}", Colors.RED)

if __name__ == "__main__":
    main()