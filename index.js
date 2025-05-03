#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { z } = require("zod");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Esquemas de validação com Zod
const schemas = {
  toolInputs: {
    enviaTexto: z.object({
      to: z.string(),
      delayMessage: z.number().optional().default(0),
      delayTyping: z.number().optional().default(0),
      text: z.string(),
    }),
    enviaImagem: z.object({
      to: z.string(),
      delayMessage: z.number().optional().default(0),
      link: z.string(),
      caption: z.string().optional(),
      viewOnce: z.boolean().optional().default(false),
    }),
    enviaVideo: z.object({
      to: z.string(),
      delayMessage: z.number().optional().default(0),
      link: z.string(),
      caption: z.string().optional(),
      viewOnce: z.boolean().optional().default(false),
    }),
    enviaAudio: z.object({
      to: z.string(),
      delayMessage: z.number().optional().default(0),
      link: z.string(),
    }),
    enviaDocumento: z.object({
      to: z.string(),
      delayMessage: z.number().optional().default(0),
      link: z.string(),
      caption: z.string().optional(),
      fileName: z.string().optional(),
    }),
  },
};

// Definições das ferramentas (tools)
const TOOL_DEFINITIONS = [
  {
    name: "envia_texto",
    description: "Envia mensagem de texto via SmileAPI",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description:
            "Número do destinatário com DDI e DDD (ex: 5543996611437)",
        },
        delayMessage: {
          type: "number",
          description: "Atraso para enviar a mensagem em segundos",
          default: 0,
        },
        delayTyping: {
          type: "number",
          description: "Atraso para simular digitação em segundos",
          default: 0,
        },
        text: {
          type: "string",
          description: "Texto da mensagem a ser enviada",
        },
      },
      required: ["to", "text"],
    },
  },
  {
    name: "envia_imagem",
    description: "Envia uma imagem via SmileAPI",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description:
            "Número do destinatário com DDI e DDD (ex: 5543996611437)",
        },
        delayMessage: {
          type: "number",
          description: "Atraso para enviar a mensagem em segundos",
          default: 0,
        },
        link: {
          type: "string",
          description: "URL da imagem a ser enviada",
        },
        caption: {
          type: "string",
          description: "Legenda da imagem (opcional)",
        },
        viewOnce: {
          type: "boolean",
          description: "Define se a imagem será visualizada apenas uma vez",
          default: false,
        },
      },
      required: ["to", "link"],
    },
  },
  {
    name: "envia_video",
    description: "Envia um vídeo via SmileAPI",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description:
            "Número do destinatário com DDI e DDD (ex: 5543996611437)",
        },
        delayMessage: {
          type: "number",
          description: "Atraso para enviar a mensagem em segundos",
          default: 0,
        },
        link: {
          type: "string",
          description: "URL do vídeo a ser enviado",
        },
        caption: {
          type: "string",
          description: "Legenda do vídeo (opcional)",
        },
        viewOnce: {
          type: "boolean",
          description: "Define se o vídeo será visualizado apenas uma vez",
          default: false,
        },
      },
      required: ["to", "link"],
    },
  },
  {
    name: "envia_audio",
    description: "Envia um áudio via SmileAPI",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description:
            "Número do destinatário com DDI e DDD (ex: 5543996611437)",
        },
        delayMessage: {
          type: "number",
          description: "Atraso para enviar a mensagem em segundos",
          default: 0,
        },
        link: {
          type: "string",
          description: "URL do áudio a ser enviado",
        },
      },
      required: ["to", "link"],
    },
  },
  {
    name: "envia_documento",
    description: "Envia um documento via SmileAPI",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description:
            "Número do destinatário com DDI e DDD (ex: 5543996611437)",
        },
        delayMessage: {
          type: "number",
          description: "Atraso para enviar a mensagem em segundos",
          default: 0,
        },
        link: {
          type: "string",
          description: "URL do documento a ser enviado",
        },
        caption: {
          type: "string",
          description: "Legenda do documento (opcional)",
        },
        fileName: {
          type: "string",
          description: "Nome do arquivo do documento (opcional)",
        },
      },
      required: ["to", "link"],
    },
  },
];

// Função auxiliar para fazer requisições à SmileAPI
async function callSmileAPI(payload) {
  const username = process.env.SMILE_API_USERNAME;
  const phoneNumberId = process.env.SMILE_API_PHONE_NUMBER_ID;
  const token = process.env.SMILE_API_TOKEN;

  if (!username || !phoneNumberId || !token) {
    throw new Error(
      "Credenciais da SmileAPI não configuradas. Verifique as variáveis de ambiente."
    );
  }

  const url = `https://api.smileapi.com.br/${username}/v1/${phoneNumberId}/messages`;

  try {
    const response = await axios.post(url, payload, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Erro na chamada da SmileAPI:",
      error.response?.data || error.message
    );
    throw new Error(
      `Erro na SmileAPI: ${error.response?.data?.error || error.message}`
    );
  }
}

// Handlers das ferramentas
const toolHandlers = {
  envia_texto: async (args) => {
    const parsed = schemas.toolInputs.enviaTexto.parse(args);

    const payload = {
      to: parsed.to,
      delayMessage: parsed.delayMessage,
      delayTyping: parsed.delayTyping,
      type: "text",
      text: {
        body: parsed.text,
      },
    };

    const response = await callSmileAPI(payload);

    return {
      content: [
        {
          type: "text",
          text: `Mensagem de texto enviada com sucesso para ${
            parsed.to
          }.\nResposta: ${JSON.stringify(response, null, 2)}`,
        },
      ],
    };
  },

  envia_imagem: async (args) => {
    const parsed = schemas.toolInputs.enviaImagem.parse(args);

    const payload = {
      to: parsed.to,
      delayMessage: parsed.delayMessage,
      type: "image",
      viewOnce: parsed.viewOnce,
      image: {
        link: parsed.link,
        caption: parsed.caption,
      },
    };

    const response = await callSmileAPI(payload);

    return {
      content: [
        {
          type: "text",
          text: `Imagem enviada com sucesso para ${
            parsed.to
          }.\nResposta: ${JSON.stringify(response, null, 2)}`,
        },
      ],
    };
  },

  envia_video: async (args) => {
    const parsed = schemas.toolInputs.enviaVideo.parse(args);

    const payload = {
      to: parsed.to,
      delayMessage: parsed.delayMessage,
      type: "video",
      viewOnce: parsed.viewOnce,
      video: {
        link: parsed.link,
        caption: parsed.caption,
      },
    };

    const response = await callSmileAPI(payload);

    return {
      content: [
        {
          type: "text",
          text: `Vídeo enviado com sucesso para ${
            parsed.to
          }.\nResposta: ${JSON.stringify(response, null, 2)}`,
        },
      ],
    };
  },

  envia_audio: async (args) => {
    const parsed = schemas.toolInputs.enviaAudio.parse(args);

    const payload = {
      to: parsed.to,
      delayMessage: parsed.delayMessage,
      type: "audio",
      audio: {
        link: parsed.link,
      },
    };

    const response = await callSmileAPI(payload);

    return {
      content: [
        {
          type: "text",
          text: `Áudio enviado com sucesso para ${
            parsed.to
          }.\nResposta: ${JSON.stringify(response, null, 2)}`,
        },
      ],
    };
  },

  envia_documento: async (args) => {
    const parsed = schemas.toolInputs.enviaDocumento.parse(args);

    const payload = {
      to: parsed.to,
      delayMessage: parsed.delayMessage,
      type: "document",
      document: {
        link: parsed.link,
        caption: parsed.caption,
        fileName: parsed.fileName,
      },
    };

    const response = await callSmileAPI(payload);

    return {
      content: [
        {
          type: "text",
          text: `Documento enviado com sucesso para ${
            parsed.to
          }.\nResposta: ${JSON.stringify(response, null, 2)}`,
        },
      ],
    };
  },
};

// Instância do servidor MPC
const server = new Server(
  { name: "smile-api-tools-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Handler de inicialização
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  console.error("Cliente iniciando conexão:", request.params);
  return {
    serverInfo: {
      name: "smile-api-tools-server",
      version: "1.0.0",
    },
    capabilities: {
      tools: {},
    },
  };
});

// Handlers das requisições MPC
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("Ferramentas requisitadas pelo cliente");
  return { tools: TOOL_DEFINITIONS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`Executando ferramenta: ${name} com argumentos:`, args);

  try {
    const handler = toolHandlers[name];
    if (!handler) throw new Error(`Tool desconhecida: ${name}`);
    const result = await handler(args);
    console.error(`Resultado da execução de ${name}:`, result);
    return result;
  } catch (error) {
    console.error(`Erro executando a tool ${name}:`, error);
    throw error;
  }
});

// Execução principal
async function main() {
  try {
    const transport = new StdioServerTransport();
    console.error("Iniciando servidor SmileAPI MPC...");

    // Adiciona handler para erros no transporte
    transport.on("error", (error) => {
      console.error("Erro no transporte:", error);
    });

    await server.connect(transport);
    console.error("SmileAPI MPC Server conectado e pronto para uso");
  } catch (error) {
    console.error("Erro fatal ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Execução direta por argumentos CLI
const args = process.argv.slice(2);
if (args.length > 0) {
  const funcao = args[0];
  const input = args[1] ? JSON.parse(args[1]) : {};

  console.log("Variáveis de ambiente utilizadas:");
  console.log("SMILE_API_USERNAME:", process.env.SMILE_API_USERNAME);
  console.log(
    "SMILE_API_PHONE_NUMBER_ID:",
    process.env.SMILE_API_PHONE_NUMBER_ID
  );
  console.log(
    "SMILE_API_TOKEN:",
    `${process.env.SMILE_API_TOKEN?.substring(0, 10)}...` || "não definido"
  );

  if (toolHandlers[funcao]) {
    toolHandlers[funcao](input)
      .then((res) => {
        console.log(JSON.stringify(res, null, 2));
        process.exit(0);
      })
      .catch((err) => {
        console.error(`Erro ao executar ${funcao}:`, err);
        process.exit(1);
      });
  } else {
    console.error(`Função desconhecida: ${funcao}`);
    process.exit(1);
  }
} else {
  main().catch((error) => {
    console.error("Erro Fatal:", error);
    process.exit(1);
  });
}
