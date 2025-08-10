/**
 * Definições das ferramentas Filazero como Functions para Groq
 */

import { GroqFunction } from '../types/agent.types.js';

export const filazeroTools: GroqFunction[] = [
  {
    type: 'function',
    function: {
      name: 'get_terminal',
      description: 'Busca informações de um terminal Filazero usando a chave de acesso. Retorna dados do terminal, localização, provider e serviços disponíveis.',
      parameters: {
        type: 'object',
        properties: {
          accessKey: {
            type: 'string',
            description: 'Chave de acesso do terminal (ex: ABC123, 1d1373dcf045408aa3b13914f2ac1076)'
          }
        },
        required: ['accessKey']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_ticket',
      description: 'Cria um novo ticket na fila. Precisa de informações do cliente, terminal e serviço.',
      parameters: {
        type: 'object',
        properties: {
          terminalSchedule: {
            type: 'object',
            description: 'Informações da sessão do terminal',
            properties: {
              sessionId: { type: 'number', description: 'ID da sessão' },
              publicAccessKey: { type: 'string', description: 'Chave pública do terminal' }
            }
          },
          pid: {
            type: 'number',
            description: 'ID do provider (11=Filazero, 906=Artesano, 730=Boticário, etc.)'
          },
          locationId: {
            type: 'number',
            description: 'ID da localização/agência'
          },
          serviceId: {
            type: 'number', 
            description: 'ID do serviço desejado'
          },
          customer: {
            type: 'object',
            description: 'Dados do cliente',
            properties: {
              name: { type: 'string', description: 'Nome completo do cliente' },
              phone: { type: 'string', description: 'Telefone do cliente' },
              email: { type: 'string', description: 'Email do cliente' }
            },
            required: ['name', 'phone', 'email']
          },
          browserUuid: {
            type: 'string',
            description: 'UUID único para identificar a sessão'
          },
          priority: {
            type: 'number',
            description: 'Prioridade do ticket (0-10)',
            default: 0
          }
        },
        required: ['terminalSchedule', 'pid', 'locationId', 'serviceId', 'customer', 'browserUuid']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_ticket',
      description: 'Consulta informações detalhadas de um ticket específico pelo ID.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'ID numérico do ticket'
          }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_queue_position',
      description: 'Consulta a posição atual de um ticket na fila de atendimento.',
      parameters: {
        type: 'object',
        properties: {
          providerId: {
            type: 'number',
            description: 'ID do provider/empresa'
          },
          ticketId: {
            type: 'number', 
            description: 'ID do ticket'
          }
        },
        required: ['providerId', 'ticketId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_ticket_prevision',
      description: 'Consulta a previsão de horário de atendimento de um ticket.',
      parameters: {
        type: 'object',
        properties: {
          ticketId: {
            type: 'number',
            description: 'ID do ticket'
          }
        },
        required: ['ticketId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_ticket',
      description: 'Cancela um ticket existente na fila.',
      parameters: {
        type: 'object',
        properties: {
          ticketId: {
            type: 'number',
            description: 'ID do ticket a ser cancelado'
          },
          providerId: {
            type: 'number',
            description: 'ID do provider'
          },
          cancellation: {
            type: 'string',
            description: 'Motivo do cancelamento',
            default: 'Cancelado pelo assistente'
          }
        },
        required: ['ticketId', 'providerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'checkin_ticket',
      description: 'Realiza check-in de um ticket usando o código smart.',
      parameters: {
        type: 'object',
        properties: {
          smartCode: {
            type: 'string',
            description: 'Código smart do ticket (ex: SC-ABC123, GB7SH)'
          },
          providerId: {
            type: 'number',
            description: 'ID do provider'
          }
        },
        required: ['smartCode', 'providerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'confirm_presence',
      description: 'Confirma a presença do cliente para atendimento.',
      parameters: {
        type: 'object',
        properties: {
          ticketId: {
            type: 'number',
            description: 'ID do ticket'
          },
          providerId: {
            type: 'number',
            description: 'ID do provider'
          }
        },
        required: ['ticketId', 'providerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_feedback',
      description: 'Atualiza o feedback/avaliação de um atendimento.',
      parameters: {
        type: 'object',
        properties: {
          feedbackId: {
            type: 'number',
            description: 'ID do feedback'
          },
          guid: {
            type: 'string',
            description: 'GUID único do feedback'
          },
          rate: {
            type: 'number',
            description: 'Nota de 1 a 5',
            minimum: 1,
            maximum: 5
          },
          comment: {
            type: 'string',
            description: 'Comentário opcional sobre o atendimento'
          }
        },
        required: ['feedbackId', 'guid', 'rate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_service',
      description: 'Busca informações detalhadas de um serviço específico.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'ID do serviço'
          }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_company_template',
      description: 'Busca o template visual e configurações de uma empresa.',
      parameters: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'Slug da empresa (ex: artesano, boticario, nike, noel, filazero)'
          }
        },
        required: ['slug']
      }
    }
  }
];

/**
 * Mapeia nomes de ferramentas para suas definições
 */
export const toolsMap = new Map(
  filazeroTools.map(tool => [tool.function.name, tool])
);

/**
 * Obtém definição de uma ferramenta por nome
 */
export function getTool(name: string): GroqFunction | undefined {
  return toolsMap.get(name);
}

/**
 * Lista todos os nomes de ferramentas disponíveis
 */
export function getToolNames(): string[] {
  return Array.from(toolsMap.keys());
}

/**
 * Valida se uma ferramenta existe
 */
export function isValidTool(name: string): boolean {
  return toolsMap.has(name);
}

/**
 * Gera UUID simples para browserUuid
 */
export function generateBrowserUuid(): string {
  return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helpers para criar parâmetros comuns
 */
export const helpers = {
  /**
   * Cria terminalSchedule básico
   */
  createTerminalSchedule(sessionId: number, publicAccessKey: string) {
    return {
      sessionId,
      publicAccessKey
    };
  },

  /**
   * Cria objeto customer
   */
  createCustomer(name: string, phone: string, email: string) {
    return { name, phone, email };
  },

  /**
   * IDs de providers comuns
   */
  providers: {
    filazero: 11,
    artesano: 906,
    boticario: 730,
    nike: 769,
    noel: 777
  }
};