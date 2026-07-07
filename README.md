# HelpDesk SaaS

Sistema full stack de gerenciamento de chamados inspirado em operações reais de suporte corporativo. O projeto usa Spring Boot Java 21, React TypeScript, PostgreSQL, Flyway, RBAC, JWT, SLA, anexos, recuperação de senha, busca global, dashboard operacional e seed demo para portfólio.

## Stack

- Backend: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Bean Validation, Flyway e PostgreSQL.
- Frontend: React 19, TypeScript, Vite, Material UI, React Router, Axios, React Hook Form, Zod, Vitest e Testing Library.
- Infraestrutura: Docker, Docker Compose, Nginx e GitHub Actions.

## Perfis

- `ADMIN`: acessa tudo, gerencia usuários, atribui técnicos, altera prioridades e acompanha indicadores globais.
- `TECNICO`: atende apenas chamados atribuídos, comenta, anexa arquivos e altera status permitidos.
- `CLIENTE`: cria chamados, acompanha seus próprios chamados e comenta publicamente.

## Login e API

Endpoint de login:

```text
POST /api/auth/login
```

No frontend, o endpoint final é formado por:

```text
VITE_API_URL + /auth/login
```

Exemplo local:

```text
http://localhost:8081/api/auth/login
```

O cliente Axios usa timeout configurável por `VITE_API_TIMEOUT_MS`. Em desenvolvimento, o fallback da API é `http://localhost:8081/api`. Em produção, se `VITE_API_URL` não for informado, o fallback passa a ser `${window.location.origin}/api`, evitando chamadas erradas para `localhost` na máquina do usuário.

Mensagens amigáveis de login:

- `E-mail ou senha inválidos.`
- `Não foi possível conectar ao servidor.`
- `Servidor indisponível no momento.`

Erros técnicos são enviados apenas ao console para debug.

## Regras de Chamado

### Status

```text
Aberto -> Em andamento -> Resolvido
Aberto -> Cancelado
Em andamento -> Cancelado
Resolvido -> Em andamento
Cancelado -> sem transições
```

Regras:

- Todo chamado nasce como `ABERTO`.
- Não é permitido voltar manualmente para `ABERTO`.
- Chamados resolvidos podem ser reabertos para `EM_ANDAMENTO`.
- Chamados cancelados não podem ser reabertos.
- Cliente não altera status.
- Técnico só altera chamados atribuídos a ele.

### SLA por Prioridade

| Prioridade | SLA |
|---|---:|
| Baixa | 72 horas |
| Média | 48 horas |
| Alta | 24 horas |
| Urgente | 8 horas |
| Crítica | 4 horas |

A prioridade `CRITICA` é permitida apenas para `ADMIN`.

### Categorias

- Hardware
- Software
- Rede
- Impressora
- Acesso
- Banco de Dados
- Infraestrutura
- Outros

## Dashboard

O dashboard usa consultas agregadas no banco para contagens por status, prioridade, categoria, técnico, cliente e evolução diária sempre que possível. Métricas que dependem de cálculo de SLA/tempo ainda usam regras de domínio no service.

Indicadores principais:

- chamados criados hoje;
- resolvidos hoje;
- vencidos pelo SLA;
- próximos do SLA;
- dentro do SLA;
- tempo médio de resolução;
- produtividade por técnico;
- chamados por categoria;
- últimos comentários;
- últimas alterações.

## Seed Demo

Os dados demo ficam separados em:

```text
backend/src/main/resources/db/demo
```

Por padrão, produção usa apenas:

```text
classpath:db/migration
```

Para ambiente demo/desenvolvimento com dados preenchidos, use:

```text
FLYWAY_LOCATIONS=classpath:db/migration,classpath:db/demo
```

O `docker-compose.yml` já ativa essa configuração para o ambiente local de demonstração.

A seed demo cria:

- 1 administrador;
- 3 técnicos;
- 5 solicitantes;
- 24 chamados realistas;
- todos os status;
- prioridades variadas;
- categorias variadas;
- chamados com e sem técnico;
- comentários;
- histórico/timeline;
- eventos para a Central de Atividades;
- dados para dashboard, produtividade, gráficos, busca global e últimos comentários.

Os registros demo usam prefixo `[Demo]` e a seed limpa/recria apenas esses registros para evitar duplicação.

## Credenciais Demo

Senha padrão:

```text
Admin@123
```

| Perfil | E-mail |
|---|---|
| ADMIN | `admin@helpdesk.com` |
| TECNICO | `tecnico@helpdesk.com` |
| TECNICO | `ana.suporte@helpdesk.com` |
| TECNICO | `bruno.infra@helpdesk.com` |
| CLIENTE | `cliente@helpdesk.com` |
| CLIENTE | `carlos.operacoes@helpdesk.com` |
| CLIENTE | `fernanda.financeiro@helpdesk.com` |
| CLIENTE | `rafael.logistica@helpdesk.com` |
| CLIENTE | `patricia.rh@helpdesk.com` |

## Execução Local

Pré-requisitos:

- Java 21
- Maven 3.9+
- Node 22+
- Docker Desktop ou Docker Engine

Subir com Docker:

```bash
docker compose up --build
```

Subir apenas PostgreSQL:

```bash
docker compose up postgres -d
```

Backend local:

```bash
cd backend
mvn spring-boot:run
```

Frontend local:

```bash
cd frontend
npm install
npm run dev
```

Endereços:

- Frontend: `http://localhost:5174`
- API: `http://localhost:8081/api`
- Swagger UI: `http://localhost:8081/swagger-ui.html`
- Health check: `http://localhost:8081/actuator/health`

## Variáveis de Ambiente

Backend:

- `SERVER_PORT`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`
- `CORS_ALLOWED_ORIGIN`
- `FLYWAY_LOCATIONS`

Frontend:

- `VITE_API_URL`
- `VITE_API_TIMEOUT_MS`

Exemplo:

```bash
CORS_ALLOWED_ORIGIN=http://localhost:5174,http://127.0.0.1:5174
VITE_API_URL=http://localhost:8081/api
VITE_API_TIMEOUT_MS=10000
```

## Testes

Backend:

```bash
cd backend
mvn test
```

Frontend:

```bash
cd frontend
npm run test
npm run build
```

Coberturas atuais:

- login e mensagens amigáveis;
- storage de autenticação;
- interceptor Axios e Bearer token;
- autorização e IDOR;
- máquina de estados;
- SLA e prioridade crítica;
- anexos;
- busca global;
- redefinição de senha.

## CI/CD

O workflow `.github/workflows/ci.yml` executa:

- `mvn test` no backend;
- `npm ci`, `npm run test` e `npm run build` no frontend.

## Segurança

- API stateless com JWT.
- RBAC por perfil.
- Proteção contra IDOR.
- Senhas com BCrypt.
- CORS configurável.
- Erros padronizados em JSON.
- Recuperação de senha com token e expiração.

Observação: para produção real, recomenda-se migrar JWT de `localStorage/sessionStorage` para cookie `httpOnly`, `Secure` e `SameSite`.

