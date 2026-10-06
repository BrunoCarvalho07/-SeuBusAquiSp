# 🚌 BusAqui - Ônibus em Tempo Real (São Paulo / SPTrans)

O **BusAqui** é uma aplicação web completa e responsiva para rastreamento de ônibus em tempo real na capital de São Paulo, integrando a **API oficial Olho Vivo v2.1 da SPTrans** com Leaflet e OpenStreetMap.

---

## 🌟 Funcionalidades

- **Mapa em Tela Cheia:** Interface fluida e responsiva (mobile-first com bottom sheet e painel lateral no desktop).
- **Acompanhamento em Tempo Real:** Atualização automática da posição dos ônibus a cada 15 segundos, com animação suave de transição linear entre coordenadas.
- **Informações do Veículo:** Prefixo, horário da última transmissão de satélite e acessibilidade para pessoas com deficiência (cadeirantes).
- **Paradas e Previsão de Chegada:** Exibição das paradas do itinerário da linha e consulta de estimativa de chegada dos próximos ônibus.
- **"Paradas perto de mim":** Geolocalização do navegador para encontrar pontos num raio de ~500 metros.
- **Favoritos Offline:** Salve linhas e paradas favoritas com armazenamento local (`localStorage`).
- **Tema Claro / Escuro:** Alternância automática com base nas preferências do sistema operacional ou botão manual.
- **Modo de Demonstração (Fallback):** Caso você não possua um token da SPTrans ou a API esteja indisponível, a aplicação entra automaticamente em modo demonstração com simulação realista e avisa claramente o usuário na interface.
- **Segurança:** O token da SPTrans é mantido estritamente no backend proxy (Node.js/Express) e nunca é exposto ao cliente. Cache em memória de 10-15s para otimização de requisições.

---

## 📁 Estrutura do Projeto

```text
BusAqui/
├── server/
│   ├── index.js          # Servidor Express com proxy, CORS e middlewares
│   ├── sptrans.js        # Integração e autenticação (cookies) com a SPTrans
│   ├── cache.js          # Gerenciador de cache com TTL em memória
│   ├── mock-data.js      # Dados simulados para o modo demonstração
│   └── test-flow.js      # Script de teste de fluxo completo da API
├── public/
│   ├── index.html        # Estrutura semântica e acessível da página
│   ├── css/
│   │   └── style.css     # Estilos modernos, responsivos e temas claro/escuro
│   └── js/
│       ├── api.js        # Cliente HTTP para os endpoints locais
│       ├── map.js        # Integração Leaflet com marcadores animados
│       ├── storage.js    # Persistência de favoritos e temas no localStorage
│       └── app.js        # Controlador principal e eventos da UI
├── .env.example          # Exemplo de configuração das variáveis de ambiente
├── .env                  # Suas configurações locais (não versionar com token)
├── package.json          # Dependências e scripts de inicialização
└── README.md             # Documentação do projeto
```

---

## 🔑 Como Obter o Token da SPTrans

1. Acesse o portal do desenvolvedor da SPTrans: [http://olhovivo.sptrans.com.br/](http://olhovivo.sptrans.com.br/)
2. Crie uma conta no sistema ou faça login.
3. No painel de controle, acesse **"Minhas Aplicações"** e crie uma nova aplicação (ex: *BusAqui*).
4. Copie o **Token de Acesso (API Key)** gerado.

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
- Node.js (versão 18 ou superior)
- npm instalado

### 2. Instalação das dependências
Abra o terminal na pasta do projeto e instale os pacotes:
```bash
npm install
```

### 3. Configuração do `.env`
Crie ou edite o arquivo `.env` na raiz do projeto (baseado em `.env.example`):
```env
PORT=3000
SPTRANS_TOKEN=seu_token_da_sptrans_aqui
```
> **Nota:** Se você deixar o `SPTRANS_TOKEN` em branco, o BusAqui iniciará no **Modo de Demonstração**, permitindo testar a interface e os fluxos imediatamente!

### 4. Executar o Teste Automatizado de Fluxo
Para verificar se todos os endpoints estão funcionando corretamente:
```bash
npm run test-flow
```

### 5. Iniciar a Aplicação
- Modo Produção:
  ```bash
  npm start
  ```
- Modo Desenvolvimento (com auto-reload do Node):
  ```bash
  npm run dev
  ```

Abra seu navegador em: **`http://localhost:3000`**

---

## 🌐 Como Fazer Deploy

### Opção 1: Render (Recomendado)
1. Crie uma conta no [Render](https://render.com/).
2. Conecte o seu repositório Git do projeto.
3. Configure o novo **Web Service**:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Na aba **Environment Variables**, adicione:
   - `SPTRANS_TOKEN` = seu token da SPTrans
   - `PORT` = `3000` (ou deixe o Render atribuir automaticamente)
5. Clique em **Deploy**.

### Opção 2: Railway
1. Acesse [Railway](https://railway.app/) e crie um novo projeto importando o repositório.
2. Em **Variables**, adicione `SPTRANS_TOKEN` com o valor do seu token.
3. O Railway detectará o Node.js automaticamente e executará o `npm start`.

---

## 🗺️ Endpoints da API Própria (Proxy)

| Rota | Descrição | SPTrans Mapeada |
|---|---|---|
| `GET /api/status` | Status do servidor e modo ativo (demo vs real) | Status do servidor |
| `GET /api/linhas?q=termo` | Busca de linhas por número ou letreiro | `/Linha/Buscar?termosBusca=` |
| `GET /api/posicao/:codigoLinha` | Posição em tempo real dos veículos | `/Posicao/Linha?codigoLinha=` |
| `GET /api/paradas?q=termo` | Busca de paradas de ônibus | `/Parada/Buscar?termosBusca=` |
| `GET /api/paradas/linha/:codigoLinha` | Paradas pertencentes ao itinerário da linha | `/Parada/BuscarParadasPorLinha?codigoLinha=` |
| `GET /api/previsao/parada/:codigoParada` | Estimativa de chegada dos ônibus na parada | `/Previsao/Parada?codigoParada=` |
| `GET /api/previsao/linha/:codigoLinha` | Previsão da linha em todas as suas paradas | `/Previsao/Linha?codigoLinha=` |

---

## ♿ Acessibilidade e Performance
- Ícones com indicativo claro de veículos com rampa/elevador para cadeirantes (`♿`).
- Contraste WCAG AA para modo escuro e claro.
- Cache de 12 segundos em memória para evitar bloqueios de taxa (rate limiting) na API da SPTrans.
