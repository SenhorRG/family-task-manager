# 🐳 Docker - Guia Completo

## 📖 O que é Docker?

Docker é uma plataforma de **containerização** que permite empacotar aplicações e todas as suas dependências em containers isolados. No contexto deste projeto, o Docker é usado para criar um ambiente de desenvolvimento consistente e reproduzível, garantindo que todos os serviços necessários (aplicação NestJS e bancos de dados MongoDB) estejam disponíveis e configurados corretamente.

## 🎯 O que faz no projeto?

No projeto **Family Task Manager**, o Docker é responsável por:

1. **Containerizar a aplicação NestJS**: A aplicação roda dentro de um container Node.js, isolada do sistema host
2. **Gerenciar múltiplos bancos MongoDB**: Cria três instâncias separadas do MongoDB:
   - **mongodb-write**: Banco de dados para operações de escrita (porta 27020)
   - **mongodb-read**: Banco de dados para leitura otimizada (porta 27018)
   - **mongodb-events**: Banco de dados para armazenar eventos do Event Store (porta 27019)
3. **Orquestração com Docker Compose**: Coordena todos os serviços (aplicação + bancos) para iniciarem juntos
4. **Persistência de dados**: Utiliza volumes Docker para manter os dados mesmo após reiniciar os containers
5. **Hot Reload em desenvolvimento**: Mantém o código sincronizado com o container para desenvolvimento rápido

## 💡 Por que fazer?

### 1. **Consistência entre ambientes**
- Todos os desenvolvedores trabalham com o mesmo ambiente
- Não há problemas de "funciona na minha máquina"
- Facilita onboarding de novos desenvolvedores

### 2. **Isolamento de serviços**
- Cada banco de dados roda em seu próprio container
- A aplicação não interfere com o sistema operacional host
- Fácil limpeza: basta parar e remover os containers

### 3. **Simplicidade de configuração**
- Não precisa instalar MongoDB manualmente no sistema
- As portas e configurações já estão definidas
- Variáveis de ambiente são gerenciadas automaticamente

### 4. **Desenvolvimento rápido**
- Um único comando (`docker-compose up`) inicia tudo
- Hot reload permite ver mudanças instantaneamente
- Volumes preservam dados entre reinicializações

### 5. **Preparação para produção**
- O mesmo Dockerfile pode ser usado em produção
- Facilita deployment em servidores ou clouds
- Garante que produção e desenvolvimento sejam idênticos

## 🔧 Como/onde fazer/criar?

### Estrutura de arquivos Docker

O projeto possui os seguintes arquivos relacionados ao Docker:

```
.
├── Dockerfile              # Dockerfile para produção
├── Dockerfile.dev          # Dockerfile para desenvolvimento
└── docker-compose.dev.yml  # Configuração do Docker Compose para desenvolvimento
```

### 1. Dockerfile.dev (Desenvolvimento)

Localização: `Dockerfile.dev`

Este arquivo define como a aplicação será construída em ambiente de desenvolvimento:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
EXPOSE 3000
CMD ["yarn", "start:dev"]
```

**O que faz:**
- Usa Node.js 18 em imagem Alpine (leve)
- Instala dependências do projeto
- Expõe a porta 3000
- Inicia o servidor em modo desenvolvimento (hot reload)

### 2. docker-compose.dev.yml (Orquestração)

Localização: `docker-compose.dev.yml`

Este arquivo define todos os serviços e como eles se relacionam:

```yaml
services:
  mongodb-write:    # Banco de escrita
  mongodb-read:     # Banco de leitura
  mongodb-events:   # Banco de eventos
  app:              # Aplicação NestJS
```

**Principais configurações:**
- **Portas mapeadas**: Cada MongoDB usa uma porta diferente no host
- **Volumes**: Dados são persistidos em volumes Docker
- **Dependências**: A aplicação só inicia após os bancos estarem prontos
- **Variáveis de ambiente**: Configurações de conexão são injetadas automaticamente

### 3. Comandos disponíveis

No `package.json`, há scripts pré-configurados:

```json
{
  "docker:up:dev": "docker-compose -f docker-compose.dev.yml up -d",
  "docker:down:dev": "docker-compose -f docker-compose.dev.yml down",
  "docker:logs:dev": "docker-compose -f docker-compose.dev.yml logs -f app",
  "docker:restart:dev": "docker-compose -f docker-compose.dev.yml restart app"
}
```

### 4. Como usar

#### Iniciar todos os serviços:
```bash
yarn docker:up:dev
# ou
docker-compose -f docker-compose.dev.yml up -d
```

#### Parar todos os serviços:
```bash
yarn docker:down:dev
# ou
docker-compose -f docker-compose.dev.yml down
```

#### Ver logs da aplicação:
```bash
yarn docker:logs:dev
# ou
docker-compose -f docker-compose.dev.yml logs -f app
```

#### Reiniciar apenas a aplicação:
```bash
yarn docker:restart:dev
# ou
docker-compose -f docker-compose.dev.yml restart app
```

#### Ver logs de todos os serviços:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

#### Acessar MongoDB diretamente:
```bash
# MongoDB Write
docker exec -it family-task-manager-mongodb-write-dev mongosh

# MongoDB Read
docker exec -it family-task-manager-mongodb-read-dev mongosh

# MongoDB Events
docker exec -it family-task-manager-mongodb-events-dev mongosh
```

### 5. Variáveis de ambiente

O Docker Compose injeta automaticamente as variáveis de ambiente no container da aplicação:

```yaml
environment:
  MONGODB_WRITE_URI: mongodb://mongodb-write:27017/family-task-manager-write-dev
  MONGODB_READ_URI: mongodb://mongodb-read:27017/family-task-manager-read-dev
  MONGODB_EVENTS_URI: mongodb://mongodb-events:27017/family-task-manager-events-dev
```

**Nota importante**: As URIs dentro do Docker usam os nomes dos serviços (`mongodb-write`) em vez de `localhost`, pois os containers se comunicam pela rede interna do Docker.

### 6. Volumes Docker

Os dados são persistidos em volumes nomeados:

```yaml
volumes:
  mongodb_write_dev_data:
  mongodb_read_dev_data:
  mongodb_events_dev_data:
```

**Para limpar completamente os dados:**
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### 7. Troubleshooting

#### Container não inicia:
```bash
# Ver logs detalhados
docker-compose -f docker-compose.dev.yml logs app

# Reconstruir a imagem
docker-compose -f docker-compose.dev.yml build --no-cache app
```

#### Porta já está em uso:
```bash
# Verificar o que está usando a porta
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# Parar containers conflitantes
docker-compose -f docker-compose.dev.yml down
```

#### Problemas de conexão com MongoDB:
- Verifique se os containers estão rodando: `docker ps`
- Verifique as variáveis de ambiente no container
- Verifique os logs do MongoDB: `docker-compose -f docker-compose.dev.yml logs mongodb-write`

## 📚 Recursos adicionais

- [Documentação oficial do Docker](https://docs.docker.com/)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [MongoDB Docker image](https://hub.docker.com/_/mongo)

