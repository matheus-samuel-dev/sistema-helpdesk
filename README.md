# 🛠️ Sistema HelpDesk

> Sistema Full Stack de Gerenciamento de Chamados desenvolvido com
> **Java, Spring Boot, React, PostgreSQL e Docker**.

> **⚠️ Observação:** Este README é uma base profissional pronta para
> GitHub. Basta substituir os links das imagens/GIFs pelos do seu
> repositório.

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

## 📡 Swagger

``` text
http://localhost:8080/swagger-ui.html
```

## 📸 Screenshots

Adicione aqui: - Login - Dashboard - Chamados - Usuários - Categorias

## 🚀 Roadmap

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

**Matheus Samuel**

-   GitHub: https://github.com/matheus-samuel-dev
-   LinkedIn: https://linkedin.com/in/matheus-samuel-dev
-   Portfólio: https://matheus-samuel-dev.github.io/Portfolio/

## 📄 Licença

Projeto desenvolvido para fins de estudo, demonstração técnica e
portfólio.
