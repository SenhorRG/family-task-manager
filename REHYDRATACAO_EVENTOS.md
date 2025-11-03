# 💧 Rehydratação de Eventos - Guia Completo

## 📖 O que é Rehydratação de Eventos?

**Rehydratação de Eventos** (Event Rehydration) é o processo de **reconstruir o estado de um Aggregate** no Write Database a partir dos eventos armazenados no Event Store. É uma funcionalidade essencial em sistemas que usam **Event Sourcing**.

No contexto deste projeto, a rehydratação permite:
- Recriar aggregates que foram perdidos ou deletados do Write Database
- Sincronizar o Write Database com o Event Store
- Recuperar dados após falhas ou corrupção de dados
- Garantir consistência entre Write Database e Event Store

## 🎯 O que faz?

A rehydratação de eventos funciona da seguinte forma:

1. **Busca eventos do Event Store**: Recupera todos os eventos relacionados a um aggregate específico
2. **Reconstrói o Aggregate**: Aplica os eventos em ordem sequencial para reconstruir o estado atual
3. **Salva no Write Database**: Persiste o aggregate reconstruído no banco de dados de escrita
4. **Mantém integridade**: Garante que o Write Database esteja sincronizado com o Event Store

### Fluxo de Rehydratação

```
Event Store (MongoDB Events)
    ↓
[Busca eventos do aggregate]
    ↓
Aggregate Rehydrator Adapter
    ↓
[Reconstrói aggregate aplicando eventos]
    ↓
Aggregate Factory
    ↓
[Recria entidade com estado correto]
    ↓
Write Database (MongoDB Write)
    ↓
[Salva aggregate sem eventos]
```

### Diferença entre Replay e Rehydratação

| Aspecto | Replay | Rehydratação |
|---------|--------|--------------|
| **Objetivo** | Atualizar Read Models | Reconstruir Aggregates no Write DB |
| **Destino** | Read Database | Write Database |
| **Processo** | Reprocessa eventos via EventBus | Reconstrói estado diretamente |
| **Ativa Projections** | Sim | Não |
| **Quando usar** | Corrigir projeções, sincronizar Read DB | Recuperar aggregates perdidos |

## 💡 Por que fazer?

### 1. **Recuperação após perda de dados**
- Se o Write Database for corrompido ou perdido, os aggregates podem ser reconstruídos a partir dos eventos
- Eventos são a fonte da verdade (source of truth)

### 2. **Sincronização manual**
- Permite sincronizar o Write Database com o Event Store manualmente
- Útil quando há inconsistências entre os dois

### 3. **Migração de dados**
- Durante migrações ou mudanças na estrutura do Write Database
- Permite reconstruir todos os aggregates no novo formato

### 4. **Testes e desenvolvimento**
- Permite popular o Write Database com dados de teste reconstruídos a partir de eventos
- Facilita testes de integração

### 5. **Backup e restauração**
- Se o Write Database precisar ser restaurado, os aggregates podem ser reconstruídos
- Eventos servem como backup completo do estado

## 🔧 Como/onde fazer/criar?

### Localização no código

A rehydratação está implementada em duas camadas:

1. **Módulo Admin** (orquestração):
```
src/admin/
├── application/
│   └── commands/
│       ├── rehydrate-all-aggregates/
│       │   ├── rehydrate-all-aggregates.command.ts
│       │   └── rehydrate-all-aggregates.handler.ts
│       └── rehydrate-aggregate/
│           ├── rehydrate-aggregate.command.ts
│           └── rehydrate-aggregate.handler.ts
└── presentation/
    └── http/
        └── admin.controller.ts
```

2. **Adapters de Rehydratação** (implementação específica por aggregate):
```
src/users/application/services/user-rehydrator.adapter.ts
src/families/application/services/family-rehydrator.adapter.ts
src/tasks/application/services/task-rehydrator.adapter.ts
```

3. **Orquestrador** (infraestrutura compartilhada):
```
src/shared/infrastructure/event-store/aggregate-rehydration.orchestrator.ts
```

### Endpoints disponíveis

#### 1. Rehydratação Completa (Todos os Aggregates)

**Endpoint**: `POST /admin/rehydrate/all`

**Query Parameters** (opcional):
- `aggregateType`: Filtrar por tipo (USER, FAMILY, TASK)

**Descrição**: Rehydrata todos os aggregates ou de um tipo específico

**Uso**: Reconstruir todos os aggregates após perda de dados ou migração

**Exemplo de requisição (todos os tipos)**:
```bash
curl -X POST http://localhost:3000/admin/rehydrate/all
```

**Exemplo de requisição (apenas usuários)**:
```bash
curl -X POST http://localhost:3000/admin/rehydrate/all?aggregateType=USER
```

**Exemplo de requisição (apenas famílias)**:
```bash
curl -X POST http://localhost:3000/admin/rehydrate/all?aggregateType=FAMILY
```

**Exemplo de requisição (apenas tarefas)**:
```bash
curl -X POST http://localhost:3000/admin/rehydrate/all?aggregateType=TASK
```

**Resposta**:
```json
{
  "success": true,
  "message": "Rehydration completed",
  "results": {
    "USER": {
      "total": 10,
      "rehydrated": 8,
      "skipped": 2,
      "errors": []
    },
    "FAMILY": {
      "total": 5,
      "rehydrated": 5,
      "skipped": 0,
      "errors": []
    },
    "TASK": {
      "total": 20,
      "rehydrated": 18,
      "skipped": 2,
      "errors": [
        {
          "aggregateId": "507f1f77bcf86cd799439011",
          "error": "No events found for aggregate"
        }
      ]
    }
  }
}
```

#### 2. Rehydratação de Aggregate Específico

**Endpoint**: `POST /admin/rehydrate/:aggregateId`

**Query Parameters** (obrigatório):
- `aggregateType`: Tipo do aggregate (USER, FAMILY, TASK)

**Path Parameters**:
- `aggregateId`: ID do aggregate

**Descrição**: Rehydrata um aggregate específico

**Uso**: Recuperar um aggregate específico que foi perdido

**Exemplo de requisição (usuário)**:
```bash
curl -X POST "http://localhost:3000/admin/rehydrate/507f1f77bcf86cd799439011?aggregateType=USER"
```

**Exemplo de requisição (família)**:
```bash
curl -X POST "http://localhost:3000/admin/rehydrate/507f1f77bcf86cd799439012?aggregateType=FAMILY"
```

**Exemplo de requisição (tarefa)**:
```bash
curl -X POST "http://localhost:3000/admin/rehydrate/507f1f77bcf86cd799439013?aggregateType=TASK"
```

**Resposta**:
```json
{
  "success": true,
  "message": "Aggregate 507f1f77bcf86cd799439011 rehydrated successfully"
}
```

**Resposta (já existe)**:
```json
{
  "success": true,
  "message": "Aggregate 507f1f77bcf86cd799439011 already exists"
}
```

### Como funciona internamente

#### 1. Handler de Rehydratação Completa

```typescript
// src/admin/application/commands/rehydrate-all-aggregates/rehydrate-all-aggregates.handler.ts
async execute(command: RehydrateAllAggregatesCommand): Promise<any> {
  // 1. Busca todos os eventos do Event Store
  const allEvents = await this.eventStore.getAllEvents();
  
  // 2. Agrupa eventos por aggregateId
  const eventsByAggregate = this.groupEventsByAggregate(allEvents);
  
  // 3. Para cada tipo de aggregate (USER, FAMILY, TASK)
  for (const aggregateType of ['USER', 'FAMILY', 'TASK']) {
    // 4. Seleciona o rehydrator apropriado
    const rehydrator = this.getRehydrator(aggregateType);
    
    // 5. Rehydrata todos os aggregates do tipo
    await this.rehydrateAllForType(aggregateType, rehydrator);
  }
}
```

#### 2. Handler de Rehydratação de Aggregate Específico

```typescript
// src/admin/application/commands/rehydrate-aggregate/rehydrate-aggregate.handler.ts
async execute(command: RehydrateAggregateCommand): Promise<any> {
  // 1. Seleciona o rehydrator baseado no tipo
  const rehydrator = this.getRehydrator(command.aggregateType);
  
  // 2. Verifica se o aggregate já existe
  const exists = await rehydrator.checkExists(command.aggregateId);
  if (exists) {
    return { success: true, message: 'Aggregate already exists' };
  }
  
  // 3. Busca eventos do aggregate
  const events = await this.eventStore.getEvents(command.aggregateId);
  
  // 4. Rehydrata o aggregate
  const aggregate = await rehydrator.rehydrateAggregate(
    command.aggregateId,
    events
  );
  
  // 5. Salva no Write Database (sem eventos)
  await rehydrator.saveWithoutEvents(aggregate);
}
```

#### 3. Adapter de Rehydratação (exemplo: User)

```typescript
// src/users/application/services/user-rehydrator.adapter.ts
async rehydrateAggregate(
  aggregateId: string,
  events: BaseEvent[]
): Promise<User> {
  // 1. Verifica se usuário já existe no Write DB
  const existing = await this.writeModel.findById(aggregateId).exec();
  
  // 2. Se existir, usa a senha existente
  // Se não existir, gera senha temporária
  let hashedPassword: string;
  if (existing) {
    hashedPassword = existing.password;
  } else {
    // Gera senha temporária (usuário deve resetar)
    const tempPassword = `TEMP_RESET_${aggregateId.substring(0, 8)}_${Date.now()}`;
    hashedPassword = await this.passwordHasher.hash(tempPassword);
  }
  
  // 3. Reconstrói o usuário aplicando eventos
  return this.userFactory.reconstructUserFromEvents(
    aggregateId,
    events,
    hashedPassword
  );
}

async saveWithoutEvents(user: User): Promise<void> {
  // Salva o aggregate no Write Database sem disparar eventos
  // (evita duplicação de eventos no Event Store)
  const userData = {
    _id: user.userId.value,
    fullName: user.fullName.value,
    email: user.email.value,
    password: user.password,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  
  await this.writeModel.create(userData);
}
```

### Adapters por tipo de aggregate

Cada bounded context possui seu próprio adapter:

#### UserRehydratorAdapter
- **Localização**: `src/users/application/services/user-rehydrator.adapter.ts`
- **Responsabilidades**:
  - Gerencia senhas (preserva existente ou gera temporária)
  - Reconstrói usuário a partir de eventos
  - Salva no Write Database sem disparar eventos

#### FamilyRehydratorAdapter
- **Localização**: `src/families/application/services/family-rehydrator.adapter.ts`
- **Responsabilidades**:
  - Reconstrói família a partir de eventos
  - Preserva membros e hierarquia
  - Salva no Write Database sem disparar eventos

#### TaskRehydratorAdapter
- **Localização**: `src/tasks/application/services/task-rehydrator.adapter.ts`
- **Responsabilidades**:
  - Reconstrói tarefa a partir de eventos
  - Preserva status, atribuições e histórico
  - Salva no Write Database sem disparar eventos

### Porta de domínio (interface)

Todos os adapters implementam a interface `AggregateRehydrator`:

```typescript
// src/shared/domain/ports/aggregate-rehydrator.port.ts
export interface AggregateRehydrator<T> {
  rehydrateAggregate(aggregateId: string, events: BaseEvent[]): Promise<T>;
  saveWithoutEvents(aggregate: T): Promise<void>;
  checkExists(aggregateId: string): Promise<boolean>;
  getAggregateType(): string;
}
```

### Como criar um novo adapter

Para adicionar suporte a um novo tipo de aggregate:

1. **Criar o adapter**:
```typescript
// src/novo-contexto/application/services/novo-rehydrator.adapter.ts
@Injectable()
export class NovoRehydratorAdapter implements AggregateRehydrator<NovoAggregate> {
  constructor(
    private readonly novoFactory: NovoFactory,
    @InjectModel(NovoSchema.name, 'writeConnection')
    private readonly writeModel: Model<NovoSchema>,
  ) {}

  getAggregateType(): string {
    return 'NOVO';
  }

  async checkExists(aggregateId: string): Promise<boolean> {
    const exists = await this.writeModel.findById(aggregateId).exec();
    return !!exists;
  }

  async rehydrateAggregate(
    aggregateId: string,
    events: BaseEvent[]
  ): Promise<NovoAggregate> {
    return Promise.resolve(
      this.novoFactory.reconstructNovoFromEvents(aggregateId, events)
    );
  }

  async saveWithoutEvents(aggregate: NovoAggregate): Promise<void> {
    // Implementação de salvamento
  }
}
```

2. **Registrar no módulo Admin**:
```typescript
// src/admin/admin.module.ts
providers: [
  // ... outros providers
  NovoRehydratorAdapter,
]
```

3. **Adicionar no handler**:
```typescript
// src/admin/application/commands/rehydrate-all-aggregates/rehydrate-all-aggregates.handler.ts
case 'NOVO':
  rehydrator = this.novoRehydrator;
  break;
```

### Tratamento de erros

#### Aggregate já existe
- Se o aggregate já existe no Write Database, ele é pulado (skip)
- Não é considerado erro, apenas informação

#### Nenhum evento encontrado
- Se não houver eventos para o aggregate, é retornado um erro
- O aggregate não pode ser rehydratado sem eventos

#### Tipo de aggregate inválido
- Se o tipo especificado não for USER, FAMILY ou TASK, é retornado erro
- Lista de tipos válidos é retornada na mensagem de erro

#### Erros durante rehydratação
- Erros individuais não interrompem o processo completo
- Cada erro é registrado no array `errors` da resposta
- Permite identificar quais aggregates falharam

### Casos especiais

#### Senhas de usuário
- **Usuário existente**: Senha existente é preservada
- **Usuário novo**: Senha temporária é gerada
  - Formato: `TEMP_RESET_{8primeirosCharsDoId}_{timestamp}`
  - **Atenção**: Usuário deve resetar a senha após rehydratação

#### Duplicação de eventos
- `saveWithoutEvents` salva o aggregate **sem disparar eventos**
- Isso evita duplicação de eventos no Event Store
- O aggregate é reconstruído a partir dos eventos existentes, não cria novos

### Exemplo de uso prático

#### Cenário: Write Database foi corrompido

1. **Problema identificado**: Write Database está inconsistente ou foi perdido
2. **Solução**: Rehydratar todos os aggregates a partir dos eventos

```bash
# Rehydratar todos os aggregates
curl -X POST http://localhost:3000/admin/rehydrate/all

# Verificar resultado
# Response mostrará quantos foram rehydratados, pulados e erros
```

#### Cenário: Um usuário específico foi deletado acidentalmente

1. **Problema**: Usuário foi deletado do Write Database, mas eventos ainda existem
2. **Solução**: Rehydratar apenas esse usuário

```bash
# Rehydratar usuário específico
curl -X POST "http://localhost:3000/admin/rehydrate/507f1f77bcf86cd799439011?aggregateType=USER"

# Nota: Usuário precisará resetar a senha se não existir no Write DB
```

### Notas importantes

1. **Idempotência**: Rehydratar o mesmo aggregate múltiplas vezes é seguro (agregates existentes são pulados)

2. **Ordem dos eventos**: Eventos devem estar ordenados por versão para reconstrução correta

3. **Primeiro evento**: O primeiro evento deve ser o evento de criação (ex: `UserCreatedEvent`)

4. **Senhas**: Usuários rehydratados sem senha existente precisarão resetar a senha

5. **Performance**: Rehydratação completa pode ser demorada para muitos aggregates

6. **Logs**: Todas as rehydratações são registradas nos logs para auditoria

## 📚 Recursos relacionados

- [Replay de Eventos](./REPLAY_EVENTOS.md) - Para atualizar Read Models
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) - Conceito fundamental
- [Aggregate Pattern](https://martinfowler.com/bliki/DDD_Aggregate.html) - Padrão de agregação em DDD

