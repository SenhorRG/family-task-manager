# 🔄 Replay de Eventos - Guia Completo

## 📖 O que é Replay de Eventos?

**Replay de Eventos** (Event Replay) é o processo de **reprocessar eventos históricos** armazenados no Event Store para atualizar as projeções (Read Models) no banco de dados de leitura. É uma funcionalidade essencial em sistemas que usam **Event Sourcing** e **CQRS**.

No contexto deste projeto, o replay permite:
- Reconstruir completamente o Read Database após falhas
- Sincronizar projeções após correções de bugs
- Reprocessar eventos de um aggregate específico
- Atualizar projeções incrementalmente (após uma data específica)

## 🎯 O que faz?

O replay de eventos funciona da seguinte forma:

1. **Busca eventos do Event Store**: Recupera eventos históricos armazenados no MongoDB Events
2. **Reprocessa através do EventBus**: Publica cada evento novamente no EventBus do NestJS
3. **Ativa Projections**: Todas as projeções registradas escutam os eventos e atualizam o Read Database
4. **Mantém Read Models sincronizados**: Garante que as visões de leitura estejam consistentes com os eventos

### Fluxo de Replay

```
Event Store (MongoDB Events)
    ↓
[Busca eventos históricos]
    ↓
EventBus (NestJS)
    ↓
[Publica eventos novamente]
    ↓
Projections (Event Handlers)
    ↓
[Atualiza Read Models]
    ↓
Read Database (MongoDB Read)
```

## 💡 Por que fazer?

### 1. **Recuperação após falhas**
- Se uma projection falhar durante o processamento normal, os dados no Read Database podem ficar inconsistentes
- O replay permite reconstruir completamente as projeções a partir dos eventos

### 2. **Correção de bugs**
- Se um bug foi corrigido em uma projection, é necessário reprocessar eventos antigos
- O replay incremental permite atualizar apenas eventos após uma data específica

### 3. **Criação de novas projeções**
- Quando uma nova projection é criada, ela precisa processar todos os eventos históricos
- O replay completo permite popular a nova projection com dados históricos

### 4. **Migração de dados**
- Durante migrações ou mudanças na estrutura do Read Database
- O replay permite reconstruir os dados no novo formato

### 5. **Sincronização manual**
- Permite controle manual sobre quando atualizar as projeções
- Útil para operações de manutenção ou troubleshooting

## 🔧 Como/onde fazer/criar?

### Localização no código

O replay está implementado no módulo **Admin**:

```
src/admin/
├── application/
│   └── commands/
│       ├── replay-all-events/
│       │   ├── replay-all-events.command.ts
│       │   └── replay-all-events.handler.ts
│       ├── replay-aggregate-events/
│       │   ├── replay-aggregate-events.command.ts
│       │   └── replay-aggregate-events.handler.ts
│       └── replay-events-after/
│           ├── replay-events-after.command.ts
│           └── replay-events-after.handler.ts
└── presentation/
    └── http/
        └── admin.controller.ts
```

### Endpoints disponíveis

#### 1. Replay Completo (Todos os Eventos)

**Endpoint**: `POST /admin/replay/all`

**Descrição**: Reprocessa todos os eventos do Event Store

**Uso**: Útil para reconstruir completamente o Read Database após falhas ou migrações

**Exemplo de requisição**:
```bash
curl -X POST http://localhost:3000/admin/replay/all
```

**Resposta**:
```json
{
  "success": true,
  "message": "Replay completed: 150/150 events processed, 0 failed",
  "progress": {
    "totalEvents": 150,
    "processedEvents": 150,
    "failedEvents": 0,
    "errors": []
  }
}
```

#### 2. Replay de Aggregate Específico

**Endpoint**: `POST /admin/replay/aggregate/:aggregateId`

**Descrição**: Reprocessa apenas os eventos de um aggregate específico

**Parâmetros**:
- `aggregateId` (path parameter): ID do aggregate

**Uso**: Reconstruir projeções de um aggregate específico

**Exemplo de requisição**:
```bash
curl -X POST http://localhost:3000/admin/replay/aggregate/507f1f77bcf86cd799439011
```

**Resposta**:
```json
{
  "success": true,
  "message": "Replay completed for aggregate 507f1f77bcf86cd799439011: 5/5 events processed",
  "progress": {
    "totalEvents": 5,
    "processedEvents": 5,
    "failedEvents": 0,
    "errors": []
  }
}
```

#### 3. Replay Incremental (Após Data)

**Endpoint**: `POST /admin/replay/incremental`

**Descrição**: Reprocessa eventos após uma data específica

**Body**:
```json
{
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Uso**: Replay incremental para eventos novos ou após uma correção de bug

**Exemplo de requisição**:
```bash
curl -X POST http://localhost:3000/admin/replay/incremental \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "2025-01-01T00:00:00.000Z"}'
```

**Resposta**:
```json
{
  "success": true,
  "message": "Incremental replay completed: 10/10 events processed",
  "progress": {
    "totalEvents": 10,
    "processedEvents": 10,
    "failedEvents": 0,
    "errors": []
  }
}
```

### Como funciona internamente

#### 1. Handler de Replay Completo

```typescript
// src/admin/application/commands/replay-all-events/replay-all-events.handler.ts
async execute(): Promise<any> {
  // 1. Busca todos os eventos do Event Store
  const allEvents = await this.eventStore.getAllEvents();
  
  // 2. Para cada evento, publica no EventBus
  for (const event of allEvents) {
    await this.eventBus.publish(event);
  }
  
  // 3. Retorna estatísticas do processamento
  return { success, message, progress };
}
```

#### 2. Handler de Replay de Aggregate

```typescript
// src/admin/application/commands/replay-aggregate-events/replay-aggregate-events.handler.ts
async execute(command: ReplayAggregateEventsCommand): Promise<any> {
  // 1. Busca eventos do aggregate específico
  const events = await this.eventStore.getEvents(command.aggregateId);
  
  // 2. Reprocessa cada evento
  for (const event of events) {
    await this.eventBus.publish(event);
  }
}
```

#### 3. Handler de Replay Incremental

```typescript
// src/admin/application/commands/replay-events-after/replay-events-after.handler.ts
async execute(command: ReplayEventsAfterCommand): Promise<any> {
  // 1. Busca todos os eventos
  const allEvents = await this.eventStore.getAllEvents();
  
  // 2. Filtra eventos após a data especificada
  const filteredEvents = allEvents.filter(
    (event) => event.occurredOn > command.timestamp
  );
  
  // 3. Reprocessa eventos filtrados
  for (const event of filteredEvents) {
    await this.eventBus.publish(event);
  }
}
```

### Onde os eventos são processados?

Quando um evento é publicado no EventBus durante o replay, ele é processado por **Projections** (Event Handlers) localizados em cada bounded context:

```
src/users/infrastructure/projections/
src/families/infrastructure/projections/
src/tasks/infrastructure/projections/
```

Essas projections atualizam o Read Database conforme os eventos são processados.

### Tratamento de erros

O replay continua mesmo se alguns eventos falharem:

- Eventos com erro são registrados no array `errors`
- O contador `failedEvents` indica quantos eventos falharam
- O processo não é interrompido, permitindo que outros eventos sejam processados

### Exemplo de uso prático

#### Cenário: Corrigir bug em projection após deploy

1. **Bug identificado**: A projection de tarefas não estava atualizando o status corretamente
2. **Bug corrigido**: Código da projection foi atualizado
3. **Replay necessário**: Reprocessar eventos de tarefas para corrigir dados inconsistentes

```bash
# Replay incremental após a correção
curl -X POST http://localhost:3000/admin/replay/incremental \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "2025-01-15T10:00:00.000Z"}'
```

Isso reprocessará todos os eventos de tarefas criados após o timestamp especificado, aplicando a lógica corrigida.

### Notas importantes

1. **Idempotência**: As projections devem ser idempotentes, ou seja, processar o mesmo evento múltiplas vezes deve produzir o mesmo resultado

2. **Performance**: Replay completo de muitos eventos pode ser demorado. Use replay incremental quando possível

3. **Logs**: Todos os replays são registrados nos logs da aplicação para auditoria

4. **EventBus**: O replay usa o mesmo EventBus do processamento normal, garantindo que todas as projections sejam ativadas

5. **Read Database**: O replay atualiza apenas o Read Database, não modifica o Event Store ou Write Database

## 📚 Recursos relacionados

- [Rehydratação de Eventos](./REHYDRATACAO_EVENTOS.md) - Para reconstruir aggregates no Write Database
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) - Conceito fundamental
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html) - Padrão de separação de leitura/escrita

