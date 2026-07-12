# SPEC: Scaffold do products-service

**Projeto:** marketplace-ms / products-service  
**Versão da Spec:** 1.0  
**Data:** 2026-07-12  
**Status:** Aguardando implementação

---

## 1. Visão Geral

Esta spec descreve os requisitos para a criação do scaffold inicial do `products-service`, um microserviço responsável pelo gerenciamento do catálogo de produtos do marketplace. O serviço deve rodar na **porta 3001**, utilizar **NestJS** como framework, **TypeORM** como ORM e **PostgreSQL 15** como banco de dados.

O objetivo desta spec é exclusivamente o scaffold — estrutura de projeto, configuração de ambiente, banco de dados e entidade base. Nenhum endpoint, autenticação ou lógica de negócio deve ser implementado nesta etapa.

---

## 2. Contexto do Sistema

O `marketplace-ms` é composto pelos seguintes microserviços:

| Serviço              | Porta    | Banco de Dados                  |
|----------------------|----------|---------------------------------|
| api-gateway          | 3005     | —                               |
| users-service        | 3000     | PostgreSQL (porta 5433)         |
| **products-service** | **3001** | **PostgreSQL (porta 5434)**     |
| checkout-service     | 3003     | PostgreSQL (porta 5434)         |
| payments-service     | 3004     | PostgreSQL (porta 5435)         |
| messaging-service    | —        | RabbitMQ                        |

---

## 3. Requisitos Funcionais

### RF-01 — Projeto NestJS com dependências de produção

O projeto deve ter as seguintes dependências instaladas e funcionais:

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` — núcleo do NestJS
- `@nestjs/config` — gerenciamento de variáveis de ambiente
- `@nestjs/typeorm` + `typeorm` — integração com banco de dados via ORM
- `pg` — driver PostgreSQL para Node.js
- `class-validator` + `class-transformer` — validação e transformação de dados de entrada
- `reflect-metadata`, `rxjs` — dependências obrigatórias do NestJS

### RF-02 — Docker Compose com PostgreSQL 15

Deve existir um arquivo `docker-compose.yaml` na raiz do `products-service` que:

- Suba uma instância do **PostgreSQL versão 15**
- Exponha a porta **5434** do host mapeada para a porta **5432** do container
- Crie o banco de dados com o nome **`products_db`**
- Use credenciais padrão de desenvolvimento (username e password `postgres`)
- Persista os dados em um volume Docker nomeado
- Isole o serviço em uma rede Docker própria (`products-network`)

### RF-03 — Configuração de conexão com o banco via variáveis de ambiente

A conexão com o banco de dados deve ser configurada exclusivamente via variáveis de ambiente, sem valores hardcoded. As variáveis são:

| Variável      | Descrição                        | Valor padrão de dev |
|---------------|----------------------------------|---------------------|
| `DB_HOST`     | Host do servidor PostgreSQL      | `localhost`         |
| `DB_PORT`     | Porta do servidor PostgreSQL     | `5434`              |
| `DB_USERNAME` | Usuário do banco de dados        | `postgres`          |
| `DB_PASSWORD` | Senha do banco de dados          | `postgres`          |
| `DB_DATABASE` | Nome do banco de dados           | `products_db`       |

A configuração de banco deve:
- Habilitar `synchronize: true` apenas em ambiente de desenvolvimento (nunca em produção)
- Habilitar `logging` apenas em ambiente de desenvolvimento
- Carregar automaticamente todas as entidades do projeto via glob pattern

### RF-04 — Arquivo de variáveis de ambiente

Devem existir dois arquivos na raiz do `products-service`:

- **`.env`** — com os valores reais para desenvolvimento local (não commitado no Git)
- **`.env.example`** — com todas as chaves necessárias e valores em branco (commitado no Git, serve como documentação)

O `.env.example` deve conter exatamente as seguintes chaves, sem valores preenchidos:

```
# Servidor
PORT=
NODE_ENV=

# Banco de dados
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
```

### RF-05 — ConfigModule global habilitado

O `AppModule` deve importar e configurar o `ConfigModule` com `isGlobal: true`, tornando as variáveis de ambiente acessíveis em todos os módulos sem necessidade de reimportação.

### RF-06 — TypeOrmModule integrado ao AppModule

O `AppModule` deve importar o `TypeOrmModule` usando a função de configuração de banco de dados criada em `src/config/database.config.ts`.

### RF-07 — Módulo de produtos básico

Deve existir um `ProductsModule` em `src/products/` com os seguintes arquivos gerados via NestJS CLI:

- `products.module.ts` — declaração do módulo
- `products.controller.ts` — controller vazio (sem rotas implementadas)
- `products.service.ts` — service vazio (sem métodos implementados)

O `ProductsModule` deve ser importado no `AppModule`. Nenhum endpoint deve ser implementado nesta spec.

### RF-08 — Entidade Product registrada no TypeORM

A entidade `Product` deve ser criada em `src/products/entities/product.entity.ts` e registrada no `ProductsModule` via `TypeOrmModule.forFeature([Product])`. A entidade deve refletir a estrutura de dados descrita na Seção 4.

### RF-09 — ValidationPipe global habilitado

O `main.ts` deve configurar o `ValidationPipe` globalmente com as seguintes opções:

- `whitelist: true` — remove propriedades não declaradas nos DTOs
- `forbidNonWhitelisted: true` — lança erro se propriedades não permitidas forem enviadas
- `transform: true` — transforma automaticamente os tipos dos dados de entrada

### RF-10 — Porta configurável via variável de ambiente

O `main.ts` deve ler a porta de inicialização da variável de ambiente `PORT`, com fallback para `3001`.

### RF-11 — .gitignore padrão do NestJS

O arquivo `.gitignore` deve seguir o padrão gerado pelo NestJS CLI, garantindo que `node_modules`, `dist`, `.env` e outros arquivos de build/runtime não sejam versionados.

---

## 4. Estrutura de Dados

### Entidade: `Product`

Tabela no banco de dados: **`products`**

| Campo         | Tipo no banco    | Tipo TypeScript | Restrições                                                            |
|---------------|------------------|-----------------|-----------------------------------------------------------------------|
| `id`          | `uuid`           | `string`        | Chave primária, gerado automaticamente (uuid v4)                      |
| `name`        | `varchar(255)`   | `string`        | Obrigatório                                                           |
| `description` | `text`           | `string`        | Obrigatório                                                           |
| `price`       | `decimal(10,2)`  | `number`        | Obrigatório                                                           |
| `stock`       | `int`            | `number`        | Obrigatório, valor padrão: `0`                                        |
| `sellerId`    | `uuid`           | `string`        | Obrigatório, referência ao usuário vendedor (sem FK — banco separado) |
| `isActive`    | `boolean`        | `boolean`       | Obrigatório, valor padrão: `true`                                     |
| `createdAt`   | `timestamp`      | `Date`          | Gerado automaticamente na inserção                                    |
| `updatedAt`   | `timestamp`      | `Date`          | Atualizado automaticamente a cada mudança                             |

> **Nota sobre `sellerId`:** Este campo armazena o UUID do usuário vendedor que é gerenciado pelo `users-service`. Por se tratar de microserviços com bancos separados, **não deve haver foreign key** no banco de dados. A referência é lógica, não física.

---

## 5. Estrutura de Pastas Esperada

Ao final da implementação desta spec, a estrutura do `products-service` deve ser:

```
products-service/
├── docs/
│   └── specs/
│       └── scaffold.md             ← esta spec
├── src/
│   ├── config/
│   │   └── database.config.ts      ← configuração TypeORM via env vars
│   ├── products/
│   │   ├── entities/
│   │   │   └── product.entity.ts   ← entidade Product com todos os campos
│   │   ├── products.controller.ts  ← controller vazio
│   │   ├── products.module.ts      ← módulo com TypeOrmModule.forFeature
│   │   └── products.service.ts     ← service vazio
│   ├── app.controller.ts
│   ├── app.controller.spec.ts
│   ├── app.module.ts               ← importa ConfigModule, TypeOrmModule, ProductsModule
│   ├── app.service.ts
│   └── main.ts                     ← ValidationPipe global + porta via env
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .env                            ← não versionado
├── .env.example                    ← versionado
├── .gitignore
├── .prettierrc
├── docker-compose.yaml             ← PostgreSQL 15 na porta 5434
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── tsconfig.build.json
└── tsconfig.json
```

---

## 6. Variáveis de Ambiente

### `.env` (desenvolvimento local — não versionado)

```
# Servidor
PORT=3001
NODE_ENV=development

# Banco de dados
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=products_db
```

### `.env.example` (template versionado)

```
# Servidor
PORT=
NODE_ENV=

# Banco de dados
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
```

---

## 7. Critérios de Aceite

Os critérios abaixo devem ser verificados manualmente ou automaticamente antes de considerar esta spec concluída.

### CA-01 — Projeto sobe sem erros
- **Dado** que o PostgreSQL está rodando via `docker-compose up -d`
- **E** o arquivo `.env` está preenchido corretamente
- **Quando** `npm run start:dev` é executado
- **Então** o servidor deve iniciar sem erros e exibir `Application is running on: http://localhost:3001`

### CA-02 — Conexão com banco estabelecida
- **Dado** que o PostgreSQL está rodando
- **Quando** o serviço inicializa
- **Então** o TypeORM deve conectar ao banco `products_db` sem erros de conexão no log

### CA-03 — Tabela `products` criada automaticamente
- **Dado** que o banco `products_db` está vazio
- **E** `NODE_ENV=development` está definido
- **Quando** o serviço inicializa pela primeira vez
- **Então** a tabela `products` deve ser criada automaticamente com todas as colunas descritas na Seção 4

### CA-04 — Colunas e tipos corretos no banco
- **Quando** a tabela `products` é inspecionada no banco
- **Então** deve conter exatamente as colunas: `id` (uuid), `name` (varchar 255), `description` (text), `price` (decimal 10,2), `stock` (int, default 0), `sellerId` (uuid), `isActive` (boolean, default true), `createdAt` (timestamp), `updatedAt` (timestamp)

### CA-05 — ValidationPipe rejeita dados inválidos
- **Quando** uma requisição é enviada com campos extras não declarados
- **Então** o servidor deve retornar HTTP 400 com mensagem de erro

### CA-06 — Docker Compose funcional
- **Quando** `docker-compose up -d` é executado na raiz do `products-service`
- **Então** o container `products-db` deve iniciar e estar acessível na porta `5434`

### CA-07 — Variáveis de ambiente carregadas
- **Dado** que o `.env` está preenchido
- **Quando** o serviço inicializa
- **Então** a porta deve ser lida da variável `PORT` e o banco deve conectar com as credenciais do `.env`

### CA-08 — `.env` não versionado
- **Quando** `git status` é executado
- **Então** o arquivo `.env` não deve aparecer como arquivo rastreado ou não rastreado (deve estar no `.gitignore`)

### CA-09 — Build de produção sem erros
- **Quando** `npm run build` é executado
- **Então** a compilação TypeScript deve concluir sem erros em `dist/`

### CA-10 — Sem foreign key para sellerId
- **Quando** a tabela `products` é inspecionada no banco
- **Então** a coluna `sellerId` deve ser um campo UUID simples, **sem constraint de foreign key** para outra tabela

---

## 8. Fora do Escopo desta Spec

Os itens abaixo **não devem ser implementados** nesta spec e serão cobertos por specs futuras:

- Endpoints REST (CRUD de produtos)
- Autenticação e autorização (JWT, Guards)
- DTOs de criação/atualização de produtos
- Integração com outros microserviços (users-service, checkout-service)
- Mensageria via RabbitMQ
- Migrations (será usado `synchronize: true` em dev)
- Testes unitários e e2e
- Swagger/OpenAPI

---

## 9. Notas para Implementação

- Seguir o padrão de estrutura do `users-service` do `marketplace-ms`
- A configuração do banco em `database.config.ts` deve exportar um objeto `TypeOrmModuleOptions`
- O campo `sellerId` é uma referência lógica ao `users-service` — armazena apenas o UUID, sem relação no banco
- O campo `price` deve usar `decimal(10,2)` para evitar problemas de arredondamento com valores monetários
- Após a implementação desta spec, realizar um commit com descrição em inglês seguindo o convencional commit

## 10. Commits

Faça sempre um commit após cada implementação dessa spec com descrição em inglês seguindo o convencional commit.
