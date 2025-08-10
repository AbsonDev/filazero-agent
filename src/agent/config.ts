/**
 * Configurações padrão do Agente Filazero
 * Centraliza todas as constantes e valores padrão
 */

export const FILAZERO_CONFIG = {
  // Access Key padrão do sistema
  DEFAULT_ACCESS_KEY: 'd6779a60360d455b9af96c1b68e066c5',
  
  // IDs padrão do sistema
  PROVIDER_ID: 11, // Filazero
  LOCATION_ID: 11, // AGENCIA-001
  SERVICE_ID: 21, // FISIOTERAPIA
  
  // Sessão padrão do terminal
  DEFAULT_SESSION_ID: 2056332,
  
    // Prioridade padrão dos tickets
  DEFAULT_PRIORITY: 0,

  // UUID padrão do navegador
  DEFAULT_BROWSER_UUID: '00000000-0000-0000-0000-000000000000',

  // Serviço padrão
  DEFAULT_SERVICE: 'FISIOTERAPIA',
  
  // Configurações do terminal
  TERMINAL: {
    name: 'Filazero - AGENCIA-001',
    provider: 'Filazero',
    location: 'AGENCIA-001',
    service: 'FISIOTERAPIA'
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
 * Obtém configuração padrão para tickets
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
 * Obtém configuração padrão para terminal
 */
export function getDefaultTerminalConfig() {
  return {
    accessKey: FILAZERO_CONFIG.DEFAULT_ACCESS_KEY
  };
}