// Tipos para o Agente Filazero

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  toolsUsed?: string[];
  timestamp: Date;
}

// Tipos para MCP
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: 'tools/call' | 'tools/list' | 'initialize';
  params?: {
    name?: string;
    arguments?: Record<string, any>;
  };
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: {
    content?: Array<{
      type: 'text';
      text: string;
    }>;
    tools?: Array<MCPTool>;
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// Tipos para Groq Function Calling
export interface GroqFunction {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

// Tipos para dados Filazero
export interface FilazeroTerminal {
  id: number;
  name: string;
  provider: {
    id: number;
    name: string;
  };
  location: {
    id: number;
    name: string;
  };
  services: Array<{
    id: number;
    name: string;
    sessions: Array<{
      id: number;
      start: string;
      end: string;
      hasSlotsLeft: boolean;
    }>;
  }>;
}

export interface FilazeroTicket {
  id: number;
  smartCode: string;
  status: string;
  friendlyCode?: string;
  estimatedServiceStart?: string;
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
  service?: {
    id: number;
    name: string;
  };
  provider?: {
    id: number;
    name: string;
  };
}

export interface AgentContext {
  currentTerminal?: FilazeroTerminal;
  currentTicket?: FilazeroTicket;
  lastSearchResults?: any;
  preferences?: Record<string, any>;
}