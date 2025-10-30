# Guia Completo dos Arquivos Docker - Family Task Manager

Este documento explica linha por linha cada arquivo Docker do projeto, como criá-los e por que cada configuração é necessária.

## 📋 Índice

1. [Dockerfile (Produção)](#dockerfile-produção)
2. [Dockerfile.dev (Desenvolvimento)](#dockerfiledev-desenvolvimento)
3. [docker-compose.yml (Produção)](#docker-composeyml-produção)
4. [docker-compose.dev.yml (Desenvolvimento)](#docker-composedevyml-desenvolvimento)
5. [Comandos Úteis](#comandos-úteis)

---

## Dockerfile (Produção)

**Arquivo:** `Dockerfile`  
**Propósito:** Criar uma imagem otimizada para produção da aplicação NestJS

```dockerfile
FROM node:18-alpine
```

**Explicação:** Define a imagem base como Node.js versão 18 com Alpine Linux. Alpine é uma distribuição Linux minimalista (apenas ~5MB), ideal para containers por ser mais segura e rápida.

```dockerfile
WORKDIR /app
```

**Explicação:** Define `/app` como diretório de trabalho dentro do container. Todos os comandos subsequentes serão executados neste diretório.

```dockerfile
COPY package*.json yarn.lock ./
```

**Explicação:** Copia os arquivos de dependências (`package.json`, `package-lock.json` se existir) e `yarn.lock` para o container. O `yarn.lock` garante que as mesmas versões das dependências sejam instaladas em qualquer ambiente.

```dockerfile
RUN yarn install --frozen-lockfile
```

**Explicação:** Instala as dependências usando Yarn. A flag `--frozen-lockfile` garante que não modifique o `yarn.lock` e falhe se houver inconsistências, garantindo builds reproduzíveis.

```dockerfile
COPY . .
```

**Explicação:** Copia todo o código fonte da aplicação para o container. Isso é feito após a instalação das dependências para aproveitar o cache do Docker.

```dockerfile
RUN yarn build
```

**Explicação:** Compila o código TypeScript para JavaScript usando o comando de build do NestJS. O resultado fica na pasta `dist/`.

```dockerfile
EXPOSE 3000
```

**Explicação:** Documenta que o container usa a porta 3000. Isso não expõe a porta automaticamente - isso é feito no docker-compose.

```dockerfile
ENV NODE_ENV=production
```

**Explicação:** Define a variável de ambiente `NODE_ENV` como `production`, o que ativa otimizações do Node.js e do NestJS.

```dockerfile
CMD ["node", "dist/main.js"]
```

**Explicação:** Define o comando que será executado quando o container iniciar. Executa o arquivo JavaScript compilado.

---

## Dockerfile.dev (Desenvolvimento)

**Arquivo:** `Dockerfile.dev`  
**Propósito:** Criar uma imagem para desenvolvimento com hot reload

```dockerfile
FROM node:18-alpine
```

**Explicação:** Mesma imagem base do Dockerfile de produção.

```dockerfile
WORKDIR /app
```

**Explicação:** Mesmo diretório de trabalho.

```dockerfile
COPY package*.json ./
```

**Explicação:** Copia apenas os arquivos de dependências (sem yarn.lock para permitir atualizações).

```dockerfile
RUN yarn install
```

**Explicação:** Instala todas as dependências, incluindo as de desenvolvimento (TypeScript, ESLint, etc.). Sem `--frozen-lockfile` para permitir flexibilidade.

```dockerfile
COPY . .
```

**Explicação:** Copia o código fonte.

```dockerfile
EXPOSE 3000
```

**Explicação:** Documenta a porta 3000.

```dockerfile
CMD ["yarn", "start:dev"]
```

**Explicação:** Executa o comando de desenvolvimento do NestJS, que inclui hot reload (reinicia automaticamente quando arquivos mudam).

---

## docker-compose.yml (Produção)

**Arquivo:** `docker-compose.yml`  
**Propósito:** Orquestrar múltiplos containers para o ambiente de produção

```yaml
version: '3.8'
```

**Explicação:** Define a versão do formato do Docker Compose. A versão 3.8 suporta as funcionalidades mais recentes.

### Serviço MongoDB Write

```yaml
services:
  # MongoDB para dados principais
  mongodb-write:
    image: mongo:7.0
```

**Explicação:** Define um serviço chamado `mongodb-write` usando a imagem oficial do MongoDB versão 7.0.

```yaml
container_name: family-task-manager-mongodb-write
```

**Explicação:** Define um nome específico para o container, facilitando identificação e gerenciamento.

```yaml
environment:
  MONGO_INITDB_DATABASE: family-task-manager-write
```

**Explicação:** Define variáveis de ambiente. `MONGO_INITDB_DATABASE` cria automaticamente o banco de dados especificado quando o container inicia pela primeira vez.

```yaml
ports:
  - '27017:27017'
```

**Explicação:** Mapeia a porta 27017 do container para a porta 27017 do host. Formato: `"host:container"`.

```yaml
volumes:
  - mongodb_write_data:/data/db
```

**Explicação:** Monta um volume nomeado `mongodb_write_data` no diretório `/data/db` do container. Isso persiste os dados do MongoDB mesmo se o container for removido.

### Serviço MongoDB Read

```yaml
# MongoDB para leitura (replicação)
mongodb-read:
  image: mongo:7.0
  container_name: family-task-manager-mongodb-read
  environment:
    MONGO_INITDB_DATABASE: family-task-manager-read
  ports:
    - '27018:27017'
  volumes:
    - mongodb_read_data:/data/db
```

**Explicação:** Segundo banco MongoDB para operações de leitura. Usa a porta 27018 para evitar conflito com o banco de escrita. Segue o padrão CQRS (Command Query Responsibility Segregation).

### Serviço MongoDB Events

```yaml
# MongoDB para eventos
mongodb-events:
  image: mongo:7.0
  container_name: family-task-manager-mongodb-events
  environment:
    MONGO_INITDB_DATABASE: family-task-manager-events
  ports:
    - '27019:27017'
  volumes:
    - mongodb_events_data:/data/db
```

**Explicação:** Terceiro banco MongoDB para armazenar eventos de domínio. Usa a porta 27019. Segue o padrão Event Sourcing.

### Serviço da Aplicação

```yaml
# Aplicação NestJS
app:
  build:
    context: .
    dockerfile: Dockerfile
```

**Explicação:** Define que este serviço será construído usando o Dockerfile do diretório atual (`.`).

```yaml
container_name: family-task-manager-app
```

**Explicação:** Nome do container da aplicação.

```yaml
environment:
  NODE_ENV: production
  PORT: 3000
  MONGODB_WRITE_URI: mongodb://mongodb-write:27017/family-task-manager-write
  MONGODB_READ_URI: mongodb://mongodb-read:27017/family-task-manager-read
  MONGODB_EVENTS_URI: mongodb://mongodb-events:27017/family-task-manager-events
  JWT_SECRET: 86b5dfc6dfe338a347247090bdf217f4
  JWT_EXPIRES_IN: 24h
```

**Explicação:** Define as variáveis de ambiente da aplicação:

- `NODE_ENV`: Ambiente de produção
- `PORT`: Porta interna da aplicação
- `MONGODB_*_URI`: URLs de conexão com os bancos (usando nomes dos serviços como hostnames)
- `JWT_SECRET`: Chave secreta para assinar tokens JWT
- `JWT_EXPIRES_IN`: Tempo de expiração dos tokens

```yaml
ports:
  - '3000:3000'
```

**Explicação:** Expõe a porta 3000 da aplicação para o host.

```yaml
depends_on:
  - mongodb-write
  - mongodb-read
  - mongodb-events
```

**Explicação:** Garante que os bancos MongoDB sejam iniciados antes da aplicação.

### Volumes

```yaml
volumes:
  mongodb_write_data:
    driver: local
  mongodb_read_data:
    driver: local
  mongodb_events_data:
    driver: local
```

**Explicação:** Define os volumes nomeados que persistem os dados dos bancos MongoDB. `driver: local` armazena os dados no sistema de arquivos local.

---

## docker-compose.dev.yml (Desenvolvimento)

**Arquivo:** `docker-compose.dev.yml`  
**Propósito:** Orquestrar containers para ambiente de desenvolvimento

### Diferenças do ambiente de produção:

```yaml
container_name: family-task-manager-mongodb-write-dev
```

**Explicação:** Nome do container com sufixo `-dev` para diferenciar do ambiente de produção.

```yaml
environment:
  MONGO_INITDB_DATABASE: family-task-manager-write-dev
```

**Explicação:** Nome do banco com sufixo `-dev` para separar dados de desenvolvimento e produção.

```yaml
# Aplicação NestJS para desenvolvimento
app:
  build:
    context: .
    dockerfile: Dockerfile.dev
```

**Explicação:** Usa o `Dockerfile.dev` em vez do `Dockerfile` de produção.

```yaml
environment:
  NODE_ENV: development
```

**Explicação:** Define como ambiente de desenvolvimento.

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

**Explicação:** **Configuração crucial para desenvolvimento:**

- `.:/app`: Monta o diretório atual no container, permitindo hot reload
- `/app/node_modules`: Volume anônimo para node_modules, evitando conflitos entre host e container

```yaml
volumes:
  mongodb_write_dev_data:
    driver: local
  mongodb_read_dev_data:
    driver: local
  mongodb_events_dev_data:
    driver: local
```

**Explicação:** Volumes separados para dados de desenvolvimento.

---

## Comandos Úteis

### Desenvolvimento

```bash
# Subir ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Ver logs da aplicação
docker-compose -f docker-compose.dev.yml logs -f app

# Parar ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml down
```

### Produção

```bash
# Subir ambiente de produção
docker-compose up -d

# Ver logs da aplicação
docker-compose logs -f app

# Parar ambiente de produção
docker-compose down
```

### Gerenciamento de Volumes

```bash
# Listar volumes
docker volume ls

# Remover volumes não utilizados
docker volume prune

# Remover volumes específicos
docker volume rm family-task-manager_mongodb_write_data
```

### Debugging

```bash
# Entrar no container da aplicação
docker exec -it family-task-manager-app-dev sh

# Entrar no container do MongoDB
docker exec -it family-task-manager-mongodb-write-dev mongosh

# Ver status dos containers
docker-compose ps
```

---

## 🎯 Resumo dos Conceitos

### Por que 3 bancos MongoDB?

- **Write**: Operações de escrita (CQRS)
- **Read**: Operações de leitura (CQRS)
- **Events**: Eventos de domínio (Event Sourcing)

### Por que Alpine Linux?

- Imagem minimalista (~5MB vs ~200MB do Ubuntu)
- Mais segura (menos superfície de ataque)
- Mais rápida para baixar e iniciar

### Por que volumes nomeados?

- Persistência de dados entre reinicializações
- Backup e restauração facilitados
- Isolamento entre ambientes

### Por que docker-compose?

- Orquestração de múltiplos containers
- Rede automática entre containers
- Gerenciamento simplificado de dependências
- Configuração declarativa

---

## ⚠️ Considerações Importantes

1. **Segurança**: As chaves JWT devem ser alteradas em produção
2. **Dados**: Os volumes persistem dados mesmo após `docker-compose down`
3. **Rede**: Containers se comunicam pelos nomes dos serviços
4. **Desenvolvimento**: O hot reload só funciona com volumes montados
5. **Produção**: Use secrets do Docker para informações sensíveis

Este guia deve ajudá-lo a entender cada linha dos arquivos Docker e como criar configurações similares para outros projetos!
