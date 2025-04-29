# Servidor MCP para SmileAPI

Este é um servidor MCP (Model Context Protocol) para integração com a SmileAPI, permitindo o envio de mensagens de texto, imagens, vídeos, áudios e documentos através de ferramentas disponibilizadas para modelos de linguagem.

## Requisitos

- Node.js 14+ instalado
- Conta na SmileAPI com credenciais de acesso

## Instalação

1. Clone este repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais da SmileAPI:

```
SMILE_API_USERNAME=seuusername
SMILE_API_PHONE_NUMBER_ID=seuphoneID
SMILE_API_TOKEN=seutoken
```

## Uso

### Como servidor MCP

Para iniciar o servidor MCP:

```bash
npm start
```

### Chamada direta de ferramentas

Você também pode executar as ferramentas diretamente via linha de comando:

```bash
# Enviar texto
node index.js envia_texto '{"to":"5543996611437","text":"Olá, esta é uma mensagem de teste!"}'

# Enviar imagem
node index.js envia_imagem '{"to":"5543996611437","link":"https://exemplo.com/imagem.jpg","caption":"Imagem de teste"}'

# Enviar vídeo
node index.js envia_video '{"to":"5543996611437","link":"https://exemplo.com/video.mp4","caption":"Vídeo de teste"}'

# Enviar áudio
node index.js envia_audio '{"to":"5543996611437","link":"https://exemplo.com/audio.mp3"}'

# Enviar documento
node index.js envia_documento '{"to":"5543996611437","link":"https://exemplo.com/documento.pdf","caption":"Documento de teste","fileName":"documento.pdf"}'
```

## Ferramentas disponíveis

### envia_texto

Envia mensagem de texto.

Parâmetros:

- `to`: Número do destinatário (ex: 5543996611437)
- `delayMessage`: Atraso para enviar a mensagem em segundos (opcional, padrão: 0)
- `delayTyping`: Atraso para simular digitação em segundos (opcional, padrão: 0)
- `text`: Texto da mensagem

### envia_imagem

Envia uma imagem.

Parâmetros:

- `to`: Número do destinatário
- `delayMessage`: Atraso para enviar em segundos (opcional, padrão: 0)
- `link`: URL da imagem
- `caption`: Legenda da imagem (opcional)
- `viewOnce`: Define se a imagem será visualizada apenas uma vez (opcional, padrão: false)

### envia_video

Envia um vídeo.

Parâmetros:

- `to`: Número do destinatário
- `delayMessage`: Atraso para enviar em segundos (opcional, padrão: 0)
- `link`: URL do vídeo
- `caption`: Legenda do vídeo (opcional)
- `viewOnce`: Define se o vídeo será visualizado apenas uma vez (opcional, padrão: false)

### envia_audio

Envia um áudio.

Parâmetros:

- `to`: Número do destinatário
- `delayMessage`: Atraso para enviar em segundos (opcional, padrão: 0)
- `link`: URL do áudio

### envia_documento

Envia um documento.

Parâmetros:

- `to`: Número do destinatário
- `delayMessage`: Atraso para enviar em segundos (opcional, padrão: 0)
- `link`: URL do documento
- `caption`: Legenda do documento (opcional)
- `fileName`: Nome do arquivo do documento (opcional)

## Integração com modelos de linguagem

Este servidor foi projetado para ser utilizado com modelos de linguagem que suportam o protocolo MCP, permitindo que eles enviem mensagens através da SmileAPI.
