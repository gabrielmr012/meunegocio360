<p align="center">
  <img src="./assets/logo_meunegocio360_v1.png" alt="MeuNegócio360" width="600">
</p>

Sistema comercial de gestão de clientes, serviços e suprimentos para pequenas e médias empresas, desenvolvido com uso assistido de IA em todas as etapas do ciclo de desenvolvimento (requisitos, código, testes, revisão e deploy).

Este README descreve **como o projeto é organizado e como trabalhar nele**. O que o sistema deve fazer (requisitos funcionais e não funcionais) está em [`docs/`](./docs).

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Stack tecnológica](#3-stack-tecnológica)
4. [Estrutura do projeto](#4-estrutura-do-projeto)
5. [Primeiros passos](#5-primeiros-passos)
6. [Contribuições](#6-contribuições)
7. [Implantação](#7-implantação)
8. [Documentação](#8-documentação)

## 1. Visão geral

O MeuNegocio360 é organizado em três módulos de negócio:

| Módulo | Objetivo | Funcionalidades previstas |
| --- | --- | --- |
| **Núcleo** | Base empresarial | Gestão de usuários, clientes, fornecedores, produtos, serviços, vendas, contas (a pagar e a receber), fluxo de caixa e dashboard. |
| **Serviços** | Operação de serviços | Gestão de técnicos, equipamentos, solicitações, ordens de serviço (OS), execução, evidências, aceite e faturamento da OS. |
| **Suprimentos** | Estoque e compras | Movimentações, estoque mínimo, inventário, compras, reposição, curva ABC, giro e alertas. |

Estado atual: apenas o **Núcleo** (`meunegocio360-core`) e o frontend (`meunegocio360-js`) existem. Serviços e Suprimentos serão implementados futuramente. A base parte dos projetos gerados (Spring Initializr e Vite); as funcionalidades entram requisito a requisito, conforme o índice em [`docs/requisitos-gerais.md`](./docs/requisitos-gerais.md#2-requisitos-funcionais).

## 2. Arquitetura

O sistema segue uma arquitetura de **microsserviços**, consumida por **um único frontend** (SPA):

| Serviço | Pasta | Responsabilidade | Estado |
| --- | --- | --- | --- |
| Núcleo | `meunegocio360-core` | Identidade e autenticação, usuários, clientes, fornecedores, produtos, serviços (catálogo), vendas, contas, fluxo de caixa e dashboard. | Em desenvolvimento |
| Serviços | `meunegocio360-servicos` | Técnicos, equipamentos, solicitações, OS, execução, evidências, aceite e faturamento da OS. | Futuro |
| Suprimentos | `meunegocio360-suprimentos` | Movimentações, estoque mínimo, inventário, compras, reposição, curva ABC, giro e alertas. | Futuro |

Cada serviço tem código, build, banco de dados e implantação próprios. As regras que governam essa separação (banco por serviço, contratos versionados, emissão de tokens pelo Núcleo etc.) estão nos [requisitos de arquitetura](./docs/requisitos-gerais.md#32-microsserviços).

### Decisões de arquitetura

| Decisão | Resumo |
| --- | --- |
| Microsserviços | Um serviço por módulo de negócio, no formato monorepo (uma pasta por serviço). Cada serviço é autocontido e pode ser separado em repositório próprio sem mudança de código. |
| API REST *stateless* | Versionada em `/api/v1`, documentada em OpenAPI. |
| Autenticação | JWT de acesso de curta duração e refresh token rotativo em cookie `HttpOnly`, emitidos pelo Núcleo. Detalhes em [RF-BE-001](./docs/requisitos-be.md#rf-be-001--autenticação-de-usuário-login). |
| Frontend em JavaScript | Sem TypeScript. Contratos de dados são documentados por OpenAPI e *schemas* Zod. |
| Estilos com Bootstrap | Toda a interface é construída sobre o Bootstrap 5, com a identidade visual aplicada no tema. Ver [requisitos do frontend](./docs/requisitos-fe.md#2-estilos-e-identidade-visual). |
| Mesma origem para a API | O navegador sempre chama a API por caminho relativo (`/api`): em desenvolvimento, o servidor do Vite repassa a chamada ao backend; em produção, o Netlify faz o repasse ao Render. Assim o cookie de refresh permanece *first-party* com `SameSite=Strict`. |
| Implantação | Frontend no Netlify e backend no Render (seção [Implantação](#7-implantação)). |

Decisões novas e relevantes DEVEM ser registradas como ADR em `docs/adr/` (ver [RNF-070](./docs/requisitos-gerais.md#39-documentação)).

## 3. Stack tecnológica

| Camada | Tecnologia |
| --- | --- |
| Backend (cada serviço) | Java 17+, Spring Boot 4.x (Spring MVC), Spring Security, Spring Data JPA, springdoc-openapi, Maven Wrapper |
| Banco de dados | PostgreSQL 17, um banco por serviço |
| Frontend | React 19, Vite, JavaScript, Bootstrap 5 |
| Ambiente local | Docker Compose (PostgreSQL) |
| Implantação | Netlify (frontend) e Render (backend, via Docker) |
| IDE | Visual Studio Code, com extensões de linguagem e de assistente de IA |

As versões de cada biblioteca são as do `pom.xml` e do `package.json`. Bibliotecas adicionais são introduzidas por cada requisito que as exige ([RNF-015](./docs/requisitos-gerais.md#33-dependências)).

## 4. Estrutura do projeto

```
meunegocio360/
├── docs/                         # requisitos (RF e RNF) e ADRs (docs/adr/)
├── meunegocio360-core/           # microsserviço Núcleo (Spring Boot)
├── meunegocio360-servicos/       # (futuro) microsserviço Serviços
├── meunegocio360-suprimentos/    # (futuro) microsserviço Suprimentos
├── meunegocio360-js/             # frontend único (React + Vite)
│   └── .env.example              # variáveis públicas do frontend (VITE_*)
├── compose.yaml                  # infraestrutura local (PostgreSQL do Núcleo)
├── .env.example                  # variáveis de ambiente do backend e do compose
├── .gitignore                    # ignora .env e arquivos locais
├── AGENTS.md                     # instruções de contexto para assistentes de IA
└── README.md                     # este arquivo
```

### Backend (cada serviço)

Pacote raiz do Núcleo: `br.com.meunegocio360.core`, organizado por funcionalidade (*package by feature*):

```
br.com.meunegocio360.core
├── <feature>/                  # ex.: auth, usuario, cliente, produto
│   ├── api/                    # controllers, DTOs de entrada/saída, mapeadores
│   ├── application/            # casos de uso (serviços de aplicação), transações
│   ├── domain/                 # entidades, regras de negócio, interfaces de repositório
│   └── infra/                  # implementações JPA, adaptadores externos
└── shared/                     # transversais: erros, segurança, configuração, auditoria
```

Migrations ficam em `src/main/resources/db/migration` e a configuração em `src/main/resources/application*.yaml`.

### Frontend

```
meunegocio360-js/src
├── app/                        # bootstrap: providers, roteador, layout raiz
├── features/
│   └── <feature>/              # ex.: auth, clientes, produtos
│       ├── api/                # chamadas HTTP da feature
│       ├── components/         # componentes exclusivos da feature
│       ├── hooks/              # hooks da feature (useLogin, useAuth ...)
│       ├── pages/              # telas roteáveis
│       ├── schemas.js          # schemas Zod
│       └── index.js            # API pública da feature
├── shared/
│   ├── ui/                     # componentes compartilhados (sobre react-bootstrap)
│   ├── lib/                    # cliente HTTP, utilitários
│   ├── hooks/                  # hooks transversais (ex.: useUrlFilters)
│   └── styles/                 # tema do Bootstrap (theme.scss) e estilos globais
└── test/                       # configuração e dados de teste (fase de testes)
```

As regras que justificam essa organização estão em [RNF-010, RNF-011](./docs/requisitos-gerais.md#31-arquitetura-e-qualidade-de-código), [RNF-BE-01 a 05](./docs/requisitos-be.md) e [RNF-FE-01 a 09](./docs/requisitos-fe.md).

## 5. Primeiros passos

### Pré-requisitos

JDK 17 ou superior, Node.js (versão LTS) com npm, Docker com Docker Compose, Git e Visual Studio Code.

### Passo a passo

```bash
# 1. Variáveis de ambiente (preencha as senhas e o JWT_SECRET; o .env nunca é versionado)
cp .env.example .env
cp meunegocio360-js/.env.example meunegocio360-js/.env.local

# 2. Banco de dados do Núcleo (PostgreSQL em contêiner)
docker compose up -d

# 3. Backend (na pasta do serviço; no Windows use mvnw.cmd)
cd meunegocio360-core
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# 4. Frontend (em outro terminal)
cd meunegocio360-js
npm install
npm run dev
```

A descrição de cada variável está comentada em [`.env.example`](./.env.example) e em [`meunegocio360-js/.env.example`](./meunegocio360-js/.env.example). Defina `DB_PASSWORD`, `JWT_SECRET`, `SEED_ADMIN_SENHA` e `SEED_USUARIO_SENHA` no `.env` local. Em um `.env` existente, atualize `CORE_DB_PORT` para `5432` e `DB_URL` para `jdbc:postgresql://localhost:5432/meunegocio360_core`; a migração de mecanismo não converte dados MySQL existentes. Na inicialização do backend, Flyway aplica as migrations PostgreSQL `V1` e `V2`; Hibernate valida o schema sem criá-lo automaticamente. Com tudo no ar: backend em `http://localhost:8080` (Swagger UI em `/swagger-ui.html`) e frontend em `http://localhost:5173`. Endpoints e telas existem à medida que os requisitos são implementados.

### Comandos úteis

| Onde | Comando | Para quê |
| --- | --- | --- |
| Raiz | `docker compose up -d` / `docker compose down` | Sobe / para o PostgreSQL (mantém os dados). |
| Raiz | `docker compose down -v` | Para e **apaga** os dados locais do banco. |
| `meunegocio360-core` | `./mvnw verify` | Compila e executa as verificações do backend. |
| `meunegocio360-core` | `./mvnw spotless:apply` | Formata o código (disponível a partir de [RF-BE-001](./docs/requisitos-be.md#rf-be-001--autenticação-de-usuário-login)). |
| `meunegocio360-js` | `npm run lint` | Verifica o código com ESLint. |
| `meunegocio360-js` | `npm run build` | Gera o build de produção em `dist/`. |
| `meunegocio360-js` | `npm run format` | Formata com Prettier (disponível a partir de [RF-FE-001](./docs/requisitos-fe.md#rf-fe-001--fluxo-de-login-do-usuário)). |

Scripts de teste serão acrescentados na fase de testes (ver [Contribuições](#6-contribuições)).

### Conceitos de DevOps (introdutórios)

O foco do projeto é o desenvolvimento de software. Os conceitos de DevOps usados aqui são apenas introdutórios e já vêm prontos:

| Conceito | Onde aparece |
| --- | --- |
| Contêineres | `compose.yaml` (banco local) e `Dockerfile` do backend (exigido pelo Render para Java). |
| Configuração por variáveis de ambiente (*12-factor*) | `.env.example` e painéis do Netlify e do Render. |
| Entrega contínua | Netlify e Render publicam automaticamente a cada *push* na branch configurada. |
| *Health check* e *rollback* | `/actuator/health` verificado pelo Render; retorno a um deploy anterior pelos painéis. |

Estão **fora de escopo**: pipelines de CI (por exemplo, GitHub Actions), orquestração (Kubernetes), infraestrutura como código e monitoramento avançado.

## 6. Contribuições

Todo trabalho acontece em uma **branch do seu fork** e segue o **fluxo de desenvolvimento assistido por IA**, uma branch por requisito.

### 6.1 Preparar o fork e a branch

```bash
# Fork pelo GitHub e clone do SEU fork
git clone https://github.com/<seu-usuario>/meunegocio360.git
cd meunegocio360
git remote add upstream https://github.com/alexandresjunior/meunegocio360.git

# Antes de começar cada requisito: atualizar a main do fork
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main

# Criar a branch do requisito
git switch -c feat/rf-be-001-login
```

### 6.2 Fluxo de desenvolvimento assistido por IA

| Etapa | O que fazer |
| --- | --- |
| **1. Requisitos** | Leia por inteiro o requisito em [`docs/`](./docs) (regras, contrato, critérios de aceite, pontos de atenção e dependências introduzidas). Se o requisito ainda não existe, escreva-o com o [template](./docs/requisitos-gerais.md#22-template-de-requisito) e peça à IA que aponte ambiguidades e lacunas **antes** de codar. Dúvidas viram perguntas, não suposições. |
| **2. Geração de código** | Peça à IA um plano em passos pequenos e verificáveis, revise-o e implemente em incrementos pequenos, com commits frequentes. Dê à IA o contexto necessário: o requisito, os RNFs aplicáveis e o [`AGENTS.md`](./AGENTS.md), que traz as regras de uso de IA no projeto. Faça só o que o requisito pede. |
| **3. Testes** | Valide cada critério de aceite do requisito. Veja a observação abaixo. |
| **4. Revisão** | Revise linha a linha o que a IA gerou (você responde pelo código), usando a lista de "pontos de atenção" do requisito. Antes de abrir o PR, execute localmente as verificações de qualidade (`./mvnw verify`; `npm run lint && npm run build`). Abra o PR do seu fork para a `main` do repositório principal e atenda aos comentários da revisão. |
| **5. Deploy** | Publique a branch do seu fork nas suas próprias contas do Netlify e do Render para validar o requisito em um ambiente real (ver [Implantação](#7-implantação)). O deploy do ambiente oficial é feito somente a partir da `main` do repositório principal, após o merge. |

> **Observação sobre a etapa de testes:** a fase de testes automatizados será realizada posteriormente, no módulo de Testes do curso. Até lá, cada critério de aceite do requisito é verificado manualmente (Swagger UI e navegador) e o resultado é registrado na descrição do PR. As seções "Testes previstos" dos requisitos descrevem o que será automatizado nessa fase.

### 6.3 Convenções

**Branches.** Uma branch curta por requisito, criada a partir da `main` atualizada: `<tipo>/<id-do-requisito>-<resumo>`, por exemplo `feat/rf-be-001-login`, `fix/rf-fe-001-redirecionamento`. A `main` é protegida: nada é enviado diretamente a ela.

**Commits.** [Conventional Commits](https://www.conventionalcommits.org/pt-br) (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`), citando o ID do requisito: `feat(auth): autentica usuário por e-mail e senha [RF-BE-001]`. Nunca versione `.env`, `target/` nem `node_modules/`.

**Pull requests.** Pequenos e focados em um único requisito. A descrição DEVE informar: o que foi feito e por quê; como foi verificado (critérios de aceite); e o **registro de uso de IA**, com o que foi aceito, ajustado ou rejeitado e por quê. O merge (*squash*) só ocorre **após a aprovação do líder técnico** no GitHub.

**Definição de Pronto.** Marque todos os itens no PR:

- [ ] Todos os critérios de aceite do requisito foram verificados.
- [ ] `./mvnw verify` e/ou `npm run lint && npm run build` passam localmente.
- [ ] Nenhum segredo, dado pessoal real ou código morto no *diff*.
- [ ] OpenAPI coerente com a implementação (quando há mudança de API).
- [ ] Acessibilidade verificada (quando há mudança de interface).
- [ ] Este README, a documentação e, se aplicável, um ADR foram atualizados.
- [ ] O código gerado por IA foi revisado linha a linha e o registro de uso de IA está no PR.
- [ ] O requisito foi validado no ambiente publicado a partir do fork.

## 7. Implantação

```
Navegador ──► Netlify (SPA estática + repasse de /api/*) ──► Render (backend em Docker) ──► PostgreSQL
```

Os requisitos de implantação estão em [RNF-100 a RNF-105](./docs/requisitos-gerais.md#311-implantação). Para o ambiente próprio do seu fork, crie os serviços abaixo apontando para o **seu fork** e a branch do requisito.

### 7.1 Backend no Render

O Render não executa Java nativamente: o backend é implantado como **Docker**. Crie o arquivo `meunegocio360-core/Dockerfile`:

```dockerfile
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER 1001
ENTRYPOINT ["java", "-jar", "app.jar"]
```

No painel do Render, crie um **Web Service** com *Language* `Docker`, *Root Directory* `meunegocio360-core` e *Health Check Path* `/actuator/health`. O Render informa a porta pela variável `PORT` (a aplicação deve usá-la, [RNF-101](./docs/requisitos-gerais.md#311-implantação)). Em *Environment*, configure as mesmas variáveis do [`.env.example`](./.env.example), com estes valores específicos de produção:

| Variável | Valor em produção |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `CORS_ALLOWED_ORIGINS` | URL do site no Netlify (ex.: `https://meunegocio360.netlify.app`) |
| `APP_AUTH_COOKIE_SECURE` | `true` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Dados do banco de produção (ver abaixo) |
| `JWT_SECRET` | Segredo novo e exclusivo de produção (`openssl rand -base64 48`) |

As variáveis do seed de desenvolvimento (`SEED_*`) NÃO são configuradas em produção.

**Banco de dados.** Crie um PostgreSQL gerenciado no Render ou use um provedor PostgreSQL externo. Configure `DB_URL` como JDBC URL (`jdbc:postgresql://<host>:<porta>/<banco>`), com `DB_USER` e `DB_PASSWORD` correspondentes. Para banco Render, use o host privado quando o backend estiver na mesma região e rede.

### 7.2 Frontend no Netlify

No Netlify, importe o repositório (seu fork) e configure *Base directory* `meunegocio360-js`. Crie o arquivo `meunegocio360-js/netlify.toml`, substituindo o endereço do backend:

```toml
[build]
  command = "npm run build"
  publish = "dist"

# Repasse da API para o backend: o navegador continua falando com a mesma origem
[[redirects]]
  from = "/api/*"
  to = "https://<seu-servico>.onrender.com/api/:splat"
  status = 200
  force = true

# Fallback das rotas da SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Em *Environment variables*, defina `VITE_API_BASE_URL=/api/v1`.

### 7.3 Verificações no primeiro deploy

1. `https://<seu-servico>.onrender.com/actuator/health` responde `UP`.
2. O login pelo site do Netlify funciona e, em *DevTools → Application → Cookies*, o cookie de refresh é gravado para o domínio do **Netlify**, com `HttpOnly`, `Secure` e `SameSite=Strict`. A documentação do Netlify não detalha o repasse de `Set-Cookie` em *rewrites*; se o cookie não for gravado, use um domínio próprio com subdomínios do mesmo site (por exemplo, `app.` e `api.`), mantendo `SameSite=Strict`.
3. Recarregar a página mantém a sessão (restauração por refresh token).

### 7.4 Limitações do plano gratuito e *rollback*

- Um *Web Service* gratuito do Render é suspenso após 15 minutos sem tráfego e leva cerca de 1 minuto para voltar. O repasse do Netlify tem limite de 26 segundos por requisição, então a **primeira requisição após a suspensão pode falhar**. O frontend trata isso com a tela de "Tentar novamente" na restauração de sessão ([RF-FE-001](./docs/requisitos-fe.md#rf-fe-001--fluxo-de-login-do-usuário)); a segunda tentativa encontra o serviço ativo. Para uso contínuo, utilize uma instância paga.
- Para desfazer um deploy com problema, reimplante um deploy anterior pelos painéis do Render e do Netlify.

## 8. Documentação

| Documento | Conteúdo |
| --- | --- |
| [`docs/requisitos-gerais.md`](./docs/requisitos-gerais.md) | Requisitos não funcionais válidos para todo o projeto, índice de requisitos funcionais e template de requisito. |
| [`docs/requisitos-be.md`](./docs/requisitos-be.md) | Requisitos não funcionais e funcionais do backend (inclui RF-BE-001, login). |
| [`docs/requisitos-fe.md`](./docs/requisitos-fe.md) | Requisitos não funcionais e funcionais do frontend (inclui RF-FE-001, login). |
| [`AGENTS.md`](./AGENTS.md) | Instruções para assistentes de IA que trabalham no repositório. |








Implementação
Implementado o RF-BE-002, seguindo as regras gerais de GERAIS.md:

Adicionados os perfis OPERADOR_COMERCIAL e OPERADOR_FINANCEIRO em Perfil.java.
Atualizado o seed de desenvolvimento em DevSeedConfig.java, incluindo SEED_FINANCEIRO_SENHA no .env.example.
Criadas as migrations PostgreSQL V3 e V4:
Migração de USUARIO para OPERADOR_COMERCIAL.
Tabela empresa.
Índice único parcial garantindo uma única empresa ativa.
Unicidade do CNPJ.
Implementados cadastro, consulta, edição e alteração de situação em EmpresaController.java.
Implementadas as regras de CNPJ, CNPJ duplicado, versão otimista, empresa ativa e timezone IANA em EmpresaService.java.
Adicionado o componente transversal EmpresaAtiva.java, que será reutilizado pelos RF-BE-003 a RF-BE-005.
Adicionados os códigos COMPANY_NOT_REGISTERED, COMPANY_CNPJ_DUPLICATE, COMPANY_ALREADY_ACTIVE, VERSION_CONFLICT, COMPANY_NOT_ACTIVE e ACCESS_DENIED ao tratamento de erros.
A compilação passou com JDK 17. O contexto Spring e as migrations foram validados contra PostgreSQL.

Testes sugeridos no Postman — RF-BE-002
ADMIN

Login como usuário ADMIN.
Enviar POST /api/v1/empresa com CNPJ válido.
Esperado: 201 Created, campo ativa: true e Location.
OPERADOR_COMERCIAL

Login como OPERADOR_COMERCIAL.
Enviar PATCH /api/v1/empresa/{id}/situacao.
Esperado: 403 Forbidden com code: ACCESS_DENIED.
Em seguida, enviar GET /api/v1/empresa.
Esperado: 200 OK.
OPERADOR_FINANCEIRO

Login como OPERADOR_FINANCEIRO.
Enviar POST /api/v1/empresa.
Esperado: 403 Forbidden com code: ACCESS_DENIED.
Alternativamente, consultar a empresa com GET /api/v1/empresa e esperar 200 OK.

Para permitir reativação após recarregar a página, `GET /api/v1/empresa/inativas?page=0&size=20`
lista empresas inativas em páginas ordenadas por razão social. O endpoint é exclusivo de `ADMIN`;
`size` aceita de 1 a 100. Contrato detalhado em
[`RF-BE-002`](./docs/requisitos/backend/RF-BE-002.md).

Implementação — RF-BE-003

Implementado o cadastro de clientes conforme [`RF-BE-003`](./docs/requisitos/backend/RF-BE-003.md) e as regras gerais:

- Criada a tabela `cliente` com vínculo à empresa, unicidade de documento por empresa e índices para busca e situação (RN-01, RN-03; RNF-096, RNF-BE-23 e RNF-BE-26).
- Criados endpoints paginados para cadastro, consulta, atualização, inativação/reativação e exclusão protegida (RN-05, RN-07 e RNF-054).
- Implementada normalização e validação de CPF/CNPJ com dígitos verificadores, mantendo documentos sem máscara no banco (RN-02, RNF-BE-27).
- Implementados isolamento pela empresa ativa, busca por nome sem acentos/caixa e por documento com máscara, ordenação permitida e paginação (RN-01, RN-08, RNF-BE-16).
- Implementados conflito de documento, controle otimista de versão e erros de negócio no formato `application/problem+json` (RN-03, RN-09, RNF-BE-15 e RNF-BE-28).
- Criada a interface `VerificadorVinculoCliente`; a exclusão bloqueia o cliente se qualquer implementação registrada encontrar histórico (RN-05 e RN-06). Vendas e OS ainda não estão integradas; essa verificação deve ser validada com uma implementação simulada quando os testes automatizados forem introduzidos.
- Restringidos todos os endpoints a `ADMIN` e `OPERADOR_COMERCIAL` (matriz de autorização e RNF-BE-47).

Testes sugeridos no Postman — RF-BE-003

Configure `baseUrl` como `http://localhost:8080`, autentique cada requisição com o `accessToken` retornado pelo login (`Authorization: Bearer {{accessToken}}`) e confirme que há empresa ativa. Substitua `{{clienteId}}` pelos IDs retornados. Os tokens de cada perfil devem ser obtidos com as credenciais de desenvolvimento locais.

**ADMIN — cadastrar e consultar:** faça `POST {{baseUrl}}/api/v1/clientes` com `Content-Type: application/json` e corpo:

```json
{
  "tipoPessoa": "FISICA",
  "nome": "Maria da Silva",
  "documento": "529.982.247-25",
  "email": "maria@exemplo.com.br",
  "telefone": "11987654321"
}
```

Esperado: `201 Created`, cabeçalho `Location` e documento retornado como `52998224725`. Em seguida, use `GET {{baseUrl}}/api/v1/clientes/{{clienteId}}`; esperado `200 OK`.

**OPERADOR_COMERCIAL — atualizar e inativar:** usando um cliente criado, envie `PUT {{baseUrl}}/api/v1/clientes/{{clienteId}}` com todos os campos, incluindo a `versao` retornada pelo GET, por exemplo:

```json
{
  "tipoPessoa": "FISICA",
  "nome": "Maria da Silva",
  "documento": "52998224725",
  "email": "maria@exemplo.com.br",
  "telefone": "11987654321",
  "versao": 0
}
```

Esperado: `200 OK` e incremento de `versao`. Depois envie `PATCH {{baseUrl}}/api/v1/clientes/{{clienteId}}/situacao` com `{"ativo": false, "versao": 1}`; esperado: `200 OK` e `ativo: false`. `GET {{baseUrl}}/api/v1/clientes` não deve listar esse cliente; `GET {{baseUrl}}/api/v1/clientes?situacao=TODOS` deve listá-lo.

**OPERADOR_FINANCEIRO — acesso negado:** envie `GET {{baseUrl}}/api/v1/clientes`. Esperado: `403 Forbidden`, `Content-Type: application/problem+json` e `code: ACCESS_DENIED`.

## Implementação — RF-FE-002

O frontend implementa o cadastro inicial, a consulta e edição da empresa, além do layout e das guardas descritas em [`RF-FE-002`](./docs/requisitos/frontend/RF-FE-002.md), respeitando as regras gerais em [`GERAIS.md`](./docs/requisitos/GERAIS.md) e a identidade visual/acessibilidade de [`RNF-FE.md`](./docs/requisitos/frontend/RNF-FE.md):

- As rotas `/empresa/cadastro`, `/empresa` e `/` usam carregamento sob demanda. `EmpresaProvider`, `RequireEmpresa` e `RequireRole` controlam os estados de sessão, empresa ativa e perfil, sem substituir a autorização do backend.
- `AppLayout` exibe a logo branca no menu; em telas grandes ela fica à esquerda dos itens, e em dispositivos móveis fica entre os controles de menu e pesquisa. A barra usa texto escuro sobre o laranja, conforme o contraste documentado em RNF-FE.
- O formulário usa React Hook Form e Zod, valida e mascara CNPJ/telefone e envia os documentos somente com dígitos. Edição, inativação com confirmação e tratamento de erros de negócio usam os contratos de RF-BE-002.
- Sem empresa ativa, o administrador pode consultar a lista paginada de inativas em `GET /api/v1/empresa/inativas` e reativar via `PATCH /api/v1/empresa/{id}/situacao`. A consulta é refeita ao abrir a rota após recarregar a página.

### Testes manuais no navegador — RF-FE-002

1. **ADMIN — cadastro inicial:** sem empresa ativa, abra `/` e confirme o redirecionamento para `/empresa/cadastro`. Envie os dados com CNPJ `11.222.333/0001-81`; verifique a máscara, o envio apenas dos dígitos, a mensagem de sucesso, o contexto da empresa e a marca no menu. Repita com `11.222.333/0001-80` e confirme que não há envio.
2. **ADMIN — reativação persistente e manutenção:** com uma empresa inativa e nenhuma ativa, abra `/empresa/cadastro`, recarregue a página e confirme que a lista paginada continua disponível. Reative um registro; verifique a navegação ao início e o nome da empresa no menu. Em `/empresa`, confira edição e a confirmação antes de inativar.
3. **OPERADOR_COMERCIAL e OPERADOR_FINANCEIRO — acesso e responsividade:** com empresa ativa, abra `/empresa` e confirme dados somente para leitura, sem ações administrativas, e o menu compatível com o perfil. Sem empresa ativa, confirme a mensagem “Aguardando o cadastro da empresa” e o bloqueio das telas de negócio; em viewport de 360 px, verifique menu, logo centralizada entre hambúrguer e pesquisa, navegação por teclado e ausência de rolagem horizontal.

## Implementação — RF-FE-003

A gestão de clientes segue [`RF-FE-003`](./docs/requisitos/frontend/RF-FE-003.md), o contrato de [`RF-BE-003`](./docs/requisitos/backend/RF-BE-003.md), as regras gerais em [`GERAIS.md`](./docs/requisitos/GERAIS.md) e os padrões de interface de [`RNF-FE.md`](./docs/requisitos/frontend/RNF-FE.md):

- As rotas `/clientes`, `/clientes/novo` e `/clientes/:id` exigem autenticação, empresa ativa e os perfis `ADMIN` ou `OPERADOR_COMERCIAL`. O menu é filtrado pelos mesmos perfis.
- A listagem consulta a API paginada, persiste busca, situação e página na URL e oferece estados vazios, carregamento, erro recuperável e confirmação para alterar situação ou excluir.
- O formulário cria e edita clientes com validação Zod de CPF/CNPJ, e-mail e telefone; máscaras são exibidas na interface, enquanto documento e telefone são enviados somente com dígitos. Os erros de duplicidade, conflito de versão e empresa inativa mantêm tratamento próprio.
- `ClienteSelect` é exposto pela API pública da feature, busca somente clientes ativos com debounce de 400 ms e suporta teclado e atributos ARIA de combobox. A rota de apoio `/dev/cliente-select` existe somente no modo de desenvolvimento.
- `ListToolbar`, `Paginacao`, `StatusBadge`, `DocumentoInput` e `useUrlFilters` foram adicionados como recursos compartilhados para outras listagens. Nenhuma dependência foi introduzida.

### Testes manuais no navegador — RF-FE-003

1. **ADMIN — busca, filtros e paginação:** abra `/clientes`, confirme o filtro padrão “Ativos”, busque um nome com acento ou parte de um CPF/CNPJ e verifique a URL e o resultado após recarregar. Alterne para “Inativos” e “Todos”, percorra as páginas e teste “Limpar filtros” após uma busca sem resultados.
2. **ADMIN — cadastro e edição:** crie um cliente pessoa física com CPF `529.982.247-25`, telefone e e-mail; confirme a máscara, o envio de documento/telefone somente com dígitos e o retorno à lista filtrada pelo nome do novo cliente. Teste CPF inválido (sem envio), alterne entre pessoa física/jurídica, edite o cadastro e valide os erros de documento duplicado e conflito de versão.
3. **OPERADOR_COMERCIAL e OPERADOR_FINANCEIRO — ações, seletor e autorização:** inative e reative um cliente com confirmação; teste a exclusão sem vínculos e simule `CUSTOMER_HAS_HISTORY` para validar a mensagem e o botão “Inativar cliente”. Em `/dev/cliente-select`, busque e selecione um cliente ativo por mouse e teclado. Confirme que o perfil financeiro não vê “Clientes” e recebe “Acesso negado” ao abrir `/clientes`.

O caso `CUSTOMER_HAS_HISTORY` pode ser exercitado com resposta simulada até que vendas e ordens de serviço forneçam vínculos reais.
