/**
 * Configurações padrão do Agente Filazero
 * Centraliza todas as constantes e valores padrão
 */

export const FILAZERO_CONFIG = {
  // Access Key padrão do sistema
  DEFAULT_ACCESS_KEY: '1d1373dcf045408aa3b13914f2ac1076',
  
  // ⚠️ IDs são dinâmicos - obtidos via get_terminal
  // NÃO use IDs fixos - sempre consulte get_terminal primeiro!
  
  // Compatibilidade temporária - valores placeholder
  PROVIDER_ID: 0, // ⚠️ DINÂMICO - use get_terminal
  LOCATION_ID: 0, // ⚠️ DINÂMICO - use get_terminal  
  SERVICE_ID: 0, // ⚠️ DINÂMICO - use get_terminal
  DEFAULT_SESSION_ID: 0, // ⚠️ DINÂMICO - use get_terminal
  
  // Prioridade padrão dos tickets
  DEFAULT_PRIORITY: 0,

  // UUID padrão do navegador
  DEFAULT_BROWSER_UUID: '00000000-0000-0000-0000-000000000000',

  // Serviço padrão (nome genérico - ID será obtido dinamicamente)
  DEFAULT_SERVICE: 'CONSULTA',
  
  // Configurações do terminal (placeholder)
  TERMINAL: {
    name: 'Dinâmico via get_terminal',
    provider: 'Dinâmico via get_terminal',
    location: 'Dinâmico via get_terminal',
    service: 'Dinâmico via get_terminal'
  },
  
  // Mensagens padrão
  MESSAGES: {
    WELCOME: 'Olá! Sou o assistente virtual Filazero. Vou te ajudar a fazer seu agendamento de forma rápida.',
    ASK_NAME: 'Qual é o seu nome completo?',
    ASK_PHONE: 'Qual é o seu telefone com DDD?',
    ASK_EMAIL: 'Qual é o seu e-mail?',
    CONFIRMING: 'Perfeito! Vou criar seu agendamento agora...',
    SUCCESS: 'Agendamento realizado com sucesso!',
    ERROR: 'Desculpe, ocorreu um erro. Vou tentar novamente.'
  }
};

/**
 * Valida se um accessKey é válido
 */
export function isValidAccessKey(accessKey: string): boolean {
  return accessKey === FILAZERO_CONFIG.DEFAULT_ACCESS_KEY;
}

/**
 * Obtém configuração padrão para tickets (compatibilidade)
 */
export function getDefaultTicketConfig() {
  return {
    terminalSchedule: {
      sessionId: FILAZERO_CONFIG.DEFAULT_SESSION_ID,
      publicAccessKey: FILAZERO_CONFIG.DEFAULT_ACCESS_KEY
    },
    pid: FILAZERO_CONFIG.PROVIDER_ID,
    locationId: FILAZERO_CONFIG.LOCATION_ID,
    serviceId: FILAZERO_CONFIG.SERVICE_ID,
    priority: FILAZERO_CONFIG.DEFAULT_PRIORITY
  };
}

/**
 * Cria configuração de ticket usando dados do terminal
 * @param terminalData - Dados retornados por get_terminal
 * @param serviceIndex - Índice do serviço (padrão: 0 para primeiro serviço)
 */
export function createTicketConfigFromTerminal(terminalData: any, serviceIndex: number = 0) {
  const terminal = JSON.parse(terminalData);
  const service = terminal.services[serviceIndex];
  const session = service.sessions[0];

  return {
    terminalSchedule: {
      sessionId: session.id,
      publicAccessKey: FILAZERO_CONFIG.DEFAULT_ACCESS_KEY
    },
    pid: terminal.provider.id,
    locationId: terminal.location.id,
    serviceId: service.id,
    priority: FILAZERO_CONFIG.DEFAULT_PRIORITY
  };
}

/**
 * Obtém configuração padrão para terminal
 */
export function getDefaultTerminalConfig() {
  return {
    accessKey: FILAZERO_CONFIG.DEFAULT_ACCESS_KEY
  };
}