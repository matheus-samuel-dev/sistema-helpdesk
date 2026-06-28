# HelpDesk

Sistema full stack de gerenciamento de chamados com frontend React e backend Spring Boot. O projeto foi padronizado como `HelpDesk` em branding, configurações, documentação e metadados.

## Funcionalidades

- Autenticação JWT com perfis de acesso.
- Central de operações com indicadores do suporte.
- Gestão de chamados com histórico, timeline, categoria e comentários.
- Painel de gestão para acessos e perfis.
- Execução local e containerizada com Docker Compose.

## Tecnologias

- Backend: Java 21, Spring Boot 3, Spring Web, Data JPA, Security, JWT, Bean Validation, Flyway e PostgreSQL.
- Frontend: React 19, Vite, TypeScript, Material UI, React Router, Axios, React Hook Form e Zod.
- Infraestrutura: Docker, Docker Compose e Nginx.

## Estrutura do projeto

```text
helpdesk/
|- backend
`- frontend
```

## Execução local

Pré-requisitos:

- Java 21
- Maven 3.9+
- Node 22+
- Docker Desktop ou Docker Engine

Suba apenas o banco de dados:

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

Opcionalmente, copie o arquivo de exemplo:

```bash
copy .env.example .env
```

Endereços locais:

- Frontend: http://localhost:5174
- API: http://localhost:8081/api
- Swagger UI: http://localhost:8081/swagger-ui.html
- Health check: http://localhost:8081/actuator/health

## Execução com Docker

```bash
docker compose up --build
```

Endereços em Docker:

- Frontend: http://localhost:5174
- API: http://localhost:8081/api
- Swagger UI: http://localhost:8081/swagger-ui.html
- Health check: http://localhost:8081/actuator/health
- PostgreSQL: `localhost:5434`

Para encerrar:

```bash
docker compose down
```

Para remover também o volume de dados:

```bash
docker compose down -v
```

## Variáveis de ambiente

Backend:

- `SERVER_PORT` default: `8081`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`
- `CORS_ALLOWED_ORIGIN`

Frontend:

- `VITE_API_URL` default: `http://localhost:8081/api`

`CORS_ALLOWED_ORIGIN` aceita uma ou mais origens separadas por vírgula. Exemplo:

```bash
CORS_ALLOWED_ORIGIN=http://localhost:5174,http://127.0.0.1:5174
```

## Usuários padrão

O Flyway cria três usuários de demonstração com a senha `Admin@123`.

| Perfil | E-mail |
|---|---|
| ADMIN | `admin@helpdesk.com` |
| TECNICO | `tecnico@helpdesk.com` |
| CLIENTE | `cliente@helpdesk.com` |

## Endpoints principais

| Método | Endpoint | Acesso |
|---|---|---|
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/me` | Autenticado |
| GET | `/api/dashboard` | Autenticado |
| GET/POST | `/api/tickets` | Conforme perfil |
| GET/PATCH | `/api/tickets/{id}` | Conforme vínculo |
| GET | `/api/tickets/{id}/history` | Conforme vínculo |
| GET/POST | `/api/tickets/{id}/comments` | Conforme vínculo |
| GET/POST/PUT | `/api/users` | ADMIN |

## CORS e segurança

O backend usa `SecurityFilterChain` stateless com JWT e CORS global. A configuração atual:

- permite `http://localhost:5174`
- aceita `GET`, `POST`, `PUT`, `PATCH`, `DELETE` e `OPTIONS`
- libera `Authorization`, `Content-Type` e headers usuais de preflight
- responde corretamente a requisições `OPTIONS`
- ignora autenticação JWT em preflight
- funciona tanto em execução local quanto via Docker

## Build e testes

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
mvn test
```
