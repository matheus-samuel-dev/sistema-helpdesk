
# 🛠️ Sistema HelpDesk

> Sistema Full Stack de Gerenciamento de Chamados desenvolvido com
> **Java, Spring Boot, React, PostgreSQL e Docker**.

# HelpDesk SaaS

Sistema full stack de gerenciamento de chamados inspirado em ferramentas comerciais de suporte, com foco em regras de negócio reais, RBAC, SLA, anexos, auditoria operacional e experiência de uso profissional.

## Visão Geral

O projeto simula uma operação de atendimento corporativo com três perfis de acesso:

- `ADMIN`: gerencia usuários, acompanha todos os chamados, atribui técnicos, altera prioridades e acessa indicadores globais.
- `TECNICO`: atende apenas chamados atribuídos a ele, altera status permitidos e interage com comentários/anexos.
- `CLIENTE`: cria chamados, acompanha seus próprios atendimentos e comenta publicamente, sem acesso a dados de outros clientes.

## Stack

- Backend: Java 21, Spring Boot 3, Spring Web, Spring Security, JWT, Spring Data JPA, Bean Validation, Flyway e PostgreSQL.
- Frontend: React 19, TypeScript, Vite, Material UI, React Router, Axios, React Hook Form, Zod, Vitest e Testing Library.
- Infraestrutura: Docker, Docker Compose, Nginx e GitHub Actions.

![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)
![Spring
Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=springboot)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)
![JWT](https://img.shields.io/badge/Auth-JWT-black?style=for-the-badge)

------------------------------------------------------------------------

## 📚 Sobre

O Sistema HelpDesk é uma aplicação Full Stack inspirada em plataformas
corporativas de atendimento técnico. O objetivo é permitir o
gerenciamento completo de chamados, usuários, categorias e comentários
em um ambiente seguro, moderno e responsivo.

## ✨ Funcionalidades

-   Login com JWT
-   CRUD de Chamados
-   CRUD de Usuários
-   CRUD de Categorias
-   Comentários por chamado
-   Dashboard
-   Pesquisa e filtros
-   Validação de dados
-   Swagger/OpenAPI
-   Docker Compose

## 🏗️ Arquitetura

``` text
React
  │
Axios
  │
Spring Boot
  │
Spring Security + JWT
  │
Services
  │
Repositories (JPA)
  │
PostgreSQL
```

## 🛠️ Tecnologias

### Backend

-   Java 21
-   Spring Boot
-   Spring Security
-   Spring Data JPA
-   Hibernate
-   JWT
-   Flyway
-   Bean Validation
-   Swagger

### Frontend

-   React
-   Vite
-   Material UI
-   Axios

### Banco

-   PostgreSQL

### Infra

-   Docker
-   Docker Compose
-   Nginx

## 📂 Estrutura

``` text
helpdesk/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md
```

## ▶️ Executando

``` bash
git clone https://github.com/matheus-samuel-dev/sistema-helpdesk.git
cd sistema-helpdesk
docker compose up --build
```

Ou execute frontend e backend separadamente.

## 🔐 Segurança

-   Spring Security
-   JWT
-   Rotas protegidas
-   Validação de entrada
-   Tratamento centralizado de exceções
- Autenticação JWT com opção "lembrar de mim".
- Recuperação de senha com token, expiração e validações.
- Dashboard operacional com indicadores, gráficos e rankings.
- Métricas do dashboard calculadas com consultas agregadas no banco sempre que possível, evitando carregar dados desnecessários.
- Dashboards por perfil, respeitando permissões e escopo de dados.
- CRUD de chamados com status profissional, prioridade, categoria, SLA e histórico.
- Timeline do chamado com eventos de criação, atribuição, status, prioridade, categoria, comentários e anexos.
- Comentários públicos e internos com restrição por perfil.
- Anexos com validação de tipo, tamanho, download e registro no histórico.
- Busca global por chamados, usuários, categorias e comentários.
- Central de atividades com eventos relevantes do sistema.
- Painel administrativo de usuários exclusivo para ADMIN.
- Paginação, filtros, ordenação e responsividade.

## Regras de Negócio

### Máquina de estados dos chamados

```text
Aberto -> Em andamento -> Resolvido
Aberto -> Cancelado
Em andamento -> Cancelado
Resolvido -> Em andamento
Cancelado -> sem transições
```

Regras aplicadas:

- Todo chamado nasce como `ABERTO`.
- Não é permitido voltar manualmente para `ABERTO`.
- Chamados `RESOLVIDO` podem ser reabertos para `EM_ANDAMENTO`.
- Chamados `CANCELADO` não podem ser reabertos.
- `CLIENTE` não altera status.
- `TECNICO` só atua em chamados atribuídos a ele.

### Prioridades e SLA

| Prioridade | SLA |
|---|---:|
| Baixa | 72 horas |
| Média | 48 horas |
| Alta | 24 horas |
| Urgente | 8 horas |
| Crítica | 4 horas |

A prioridade `CRÍTICA` é restrita a `ADMIN`. O sistema calcula vencimento, tempo restante, chamados próximos do SLA e chamados vencidos.

### Categorias

- Hardware
- Software
- Rede
- Impressora
- Acesso
- Banco de Dados
- Infraestrutura
- Outros

Os labels das categorias ficam centralizados no enum do backend para evitar duplicação e inconsistência.

## Segurança

- API stateless com JWT.
- RBAC aplicado por perfil e vínculo com o chamado.
- Proteção contra IDOR: clientes acessam apenas seus chamados; técnicos acessam apenas chamados atribuídos.
- Senhas armazenadas com BCrypt.
- Redefinição de senha com token de uso único e expiração.
- Erros padronizados em JSON.
- CORS configurável por ambiente.
- Frontend sem `dangerouslySetInnerHTML`, reduzindo superfície de XSS.

Observação para produção: o frontend usa `localStorage` quando o usuário marca "lembrar de mim" e `sessionStorage` para sessão temporária. Para produção real com domínio próprio, a evolução recomendada é migrar o JWT para cookie `httpOnly`, `Secure` e `SameSite`, reduzindo exposição em caso de XSS.

## Arquitetura

```text
helpDesk/
|- backend/
|  |- src/main/java/com/portfolio/helpdesk/
|  |  |- auth
|  |  |- ticket
|  |  |- dashboard
|  |  |- comment
|  |  |- attachment
|  |  |- activity
|  |  |- search
|  |  |- user
|  |  `- security
|  `- src/main/resources/db/migration
|- frontend/
|  |- src/components
|  |- src/pages
|  |- src/utils
|  `- src/test
`- .github/workflows
```

O backend organiza regras em services transacionais, controllers finos, DTOs e repositories com consultas agregadas para dashboard. O frontend usa componentes reutilizáveis, rotas lazy-loaded, interceptors Axios e validações com Zod.

## Banco de Dados e Flyway

As migrations criam o schema, usuários de demonstração e recursos evolutivos do produto:

- usuários, chamados, histórico e RBAC;
- categorias, comentários, anexos, atividades e tokens de redefinição;
- prioridade `CRITICA` com constraint atualizada por migration incremental.

Migrations já aplicadas não devem ser reescritas em ambientes persistentes. Novas mudanças devem entrar como novas versões Flyway.

## Execução Local

Pré-requisitos:

- Java 21
- Maven 3.9+
- Node 22+
- Docker Desktop ou Docker Engine

Subir PostgreSQL:

```bash
docker compose up postgres -d
```

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

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

## Docker

```bash
docker compose up --build
```

Para encerrar:

## 📡 Swagger

``` text
http://localhost:8080/swagger-ui.html
```

## 📸 Screenshots

Para remover volumes:


Adicione aqui: - Login - Dashboard - Chamados - Usuários - Categorias


## 🚀 Roadmap

## Usuários de Demonstração

Senha padrão: `Admin@123`

| Perfil | E-mail |
|---|---|
| ADMIN | `admin@helpdesk.com` |
| TECNICO | `tecnico@helpdesk.com` |
| CLIENTE | `cliente@helpdesk.com` |

## Variáveis de Ambiente


-   [x] Autenticação JWT
-   [x] CRUD de Chamados
-   [x] CRUD de Usuários
-   [x] CRUD de Categorias
-   [x] Docker
-   [x] Swagger
-   [ ] Upload de anexos
-   [ ] Notificações
-   [ ] Aplicativo Mobile


## 👨‍💻 Autor

- `SERVER_PORT`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`
- `CORS_ALLOWED_ORIGIN`


**Matheus Samuel**


-   GitHub: https://github.com/matheus-samuel-dev
-   LinkedIn: https://linkedin.com/in/matheus-samuel-dev
-   Portfólio: https://matheus-samuel-dev.github.io/Portfolio/

## 📄 Licença

Projeto desenvolvido para fins de estudo, demonstração técnica e
portfólio.

- `VITE_API_URL`

Exemplo:

```bash
CORS_ALLOWED_ORIGIN=http://localhost:5174,http://127.0.0.1:5174
VITE_API_URL=http://localhost:8081/api
```

## Testes

Backend:

```bash
cd backend
mvn test
```

Coberturas unitárias atuais:

- autorização e IDOR em chamados;
- máquina de estados;
- prioridade crítica e SLA;
- anexos;
- busca global;
- redefinição de senha;
- criação de usuários e hash de senha.

Frontend:

```bash
cd frontend
npm run test
npm run build
```

Coberturas atuais:

- login e recuperação de senha;
- storage de autenticação;
- interceptor Axios com Bearer token;
- regras de prioridade por perfil;
- opções válidas de transição de status.

## CI/CD

O workflow `.github/workflows/ci.yml` executa:

- `mvn test` no backend;
- `npm ci`, `npm run test` e `npm run build` no frontend.

Ele roda em pull requests e pushes para `main` ou `master`.

## Endpoints Principais

| Método | Endpoint | Acesso |
|---|---|---|
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/password-reset/request` | Público |
| POST | `/api/auth/password-reset/confirm` | Público |
| GET | `/api/auth/me` | Autenticado |
| GET | `/api/dashboard` | Autenticado |
| GET | `/api/search` | Autenticado |
| GET/POST | `/api/tickets` | Conforme perfil |
| GET/PATCH | `/api/tickets/{id}` | Conforme vínculo |
| GET | `/api/tickets/{id}/history` | Conforme vínculo |
| GET/POST | `/api/tickets/{id}/comments` | Conforme vínculo |
| GET/POST | `/api/tickets/{id}/attachments` | Conforme vínculo |
| GET | `/api/activities` | Conforme perfil |
| GET/POST/PUT | `/api/users` | ADMIN |

## Deploy

Para produção, recomenda-se:

- configurar `JWT_SECRET` forte por ambiente;
- usar PostgreSQL gerenciado ou volume persistente;
- publicar o frontend estático via Nginx/CDN;
- restringir `CORS_ALLOWED_ORIGIN` ao domínio oficial;
- habilitar HTTPS;
- considerar migração do JWT para cookie `httpOnly`;
- manter GitHub Actions como gate obrigatório antes do deploy.
