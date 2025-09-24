Eu criei esse projeto para praticar os conceitos de Clean Architecture, DDD e CQRS. O objetivo é ver de forma um pouco mais clara e aplicável de como unir os conceitos em uma solução real com NestJS.

Alguns dos benefícios que observei enquanto estudava esses conceitos são:

- Testabilidade: Como cada camada tem responsabilidades bem definidas, fica muito mais fácil escrever testes.
- Continuidade e manutenção: Permite que outros desenvolvedores trabalhem no mesmo contexto, mas em arquivos diferentes, sem impedir ou interferir diretamente no que outro desenvolvedor está fazendo.
- Flexibilidade: Se quiser trocar o banco de dados ou adicionar uma nova interface, por exemplo: tirar a interface gráfica (GUI) e rodar no terminal (CLI), só preciso mudar a camada de infraestrutura.
- Clareza: Quando preciso mudar ou corrigir algo sei exatamente onde procurar. O código fica mais fácil de entender.

## Como foi feito o desenvolvimento e estudos para o projeto?

Para desenvolvimento e estudos eu usei como base de comparação outros projetos de vídeo aulas no YouTube e de alguns artigos online. No caso esses projetos não uniam os três conceitos juntos em um único projeto NestJS (normalmente era mais fácil encontrar projetos com "Clean Architecture + DDD" ou "DDD + CQRS", mas nunca os três juntos e no NestJS), ambos tinham estruturas diferentes e os professores explicavam de formas diferentes (e ambos tinham propostas/nicho diferentes). Acabei ficando com dúvidas em de fato como unir os conceitos em uma aplicação mais real, portanto utilizei o auxílio de algumas IAs (como a ManusAI, o ChatGPT e o Cursor) para gerar alguns PDFs explicativos sobre os projetos (seus arquivos e códigos nos arquivos), assim pude tirar algumas dúvidas sobre o funcionamento e importância de cada coisa.

Após tirar as dúvidas, eu refiz na mão algumas vezes cada um dos projetos com base nas explicações dos PDFs, e então utilizei o Cursor para converter um dos projetos de "DDD + CQRS" para a estrutura do "Clean Architecture", e pedi para ManusAI gerar um PDF também explicando como foi feito essa conversão.

Então tentei fazer na mão um projeto separado a partir do zero usando como referência as explicações desse último projeto que foi o convertido. Ao tentar fazer ainda notei que estava com algumas dificuldades, e então usando o Cursor eu pedi para ele criar esse projeto atual (o "family-task-manager"). Então com base nos outros PDFs e nos meus outros estudos e pesquisas que fiz anteriormente eu fui corrigindo e alterando o que foi necessário para que o projeto atende-se plenamente os princípios de cada um dos conceitos, assim tenho um projeto mais completo e aplicável para poder usar como referência. Para memorizar os passos e me acostumar com essa nova estrutura, eu tenho refeito esse mesmo projeto algumas vezes e agora estou entendendo bem melhor cada coisa e como de fato aplicar elas.

## O que é esse projeto?

Esse projeto é um Gerenciador de Tarefas para Famílias, onde os usuários criam uma conta (com um login simples de email e senha, usando o jwt para o token de acesso), e então podem criar uma família e adicionar membros nela definindo responsabilidades e nível de hierarquia familiar para cada um deles. Após isso, é possível criar tarefas e atribuí-las a membros específicos da família. Membros de cargos inferiores não podem definir tarefas para membros de cargos superiores, a menos que sejam responsáveis pela família. Os usuários criadores da família são definidos automaticamente como "responsável principal pela família" e podem definir mais dois membros como "responsáveis auxiliares", isso é útil caso o usuário criador da família seja o filho e não os pais da família por exemplo. Um usuário só pode criar uma única família, mas pode ser adicionado a outra, por exemplo: um membro pode ter cargo de "Filho" em uma família e em outra pode ter cargo de "Pai".

## Conceito de Clean Architecture

Clean Architecture é um padrão arquitetural que organiza o código em camadas, onde as dependências sempre apontam para dentro, nunca para fora. Isso garante que o domínio da aplicação (as regras de negócio) seja independente de frameworks, banco de dados, interfaces de usuário ou qualquer agente externo. Isso torna o código mais testável, flexível e independente de tecnologias específicas. Por exemplo, se eu quiser trocar o banco de dados ou o framework, posso fazer isso sem afetar as regras de negócio.

Ela é separada em quatro camadas:

1. Entities (Domínio/Domain) - Enterprise Business Rules = A camada mais interna, contendo as regras de negócio mais gerais e de alto nível. São as entidades de domínio que encapsulam dados e comportamento.
2. Use Cases (App)- Application Business Rules = Esta camada contém a lógica de negócio específica da aplicação. Ela orquestra o fluxo de dados. Os casos de uso são independentes de como os dados são persistidos ou como a interface do usuário é apresentada.
3. Controllers, Gateways e Presenters (Infra) - Interface Adapters = Camada de Comunicação (entre a aplicação e o mundo exterior). Esta camada converte os dados para o formato mais conveniente para os casos de uso e entidades para o formato mais conveniente para as camadas externas (como o banco de dados).
4. Framework, Drivers, Database e UI = Dependências substituíveis. A camada mais externa, contendo os detalhes de implementação, como o framework (NestJS), o banco de dados (MongoDB) e as ferramentas de UI. Esta camada é a que mais muda e é a que menos importa para as regras de negócio.

Um dos pilares da Clean Architecture é o Dependency Inversion Principle (DIP): Módulos de alto nível não devem depender de módulos de baixo nível e ambos devem depender de abstrações. Além disso, abstrações não devem depender de detalhes, pois são os detalhes que devem depender de abstrações.

## Conceito de Domain-Driven Design (DDD)

O DDD coloca o domínio (as regras de negócio) no centro de tudo. A ideia é modelar o software de forma que reflita exatamente como o negócio funciona no mundo real, isso facilita por exemplo a comunicação entre desenvolvedores e especialistas do negócio.

Ele separa/define o Domínio em algumas partes importantes:

- Entidades: São os objetos principais do meu negócio que têm uma identidade única
- Value Objects: São objetos que representam conceitos importantes mas não têm identidade própria e que podem ter várias partes ou regras próprias.
- Agregados: São grupos de entidades que trabalham juntas e que eu trato como uma unidade (como User com seus dados pessoais)
- Domain Services: São regras de negócio que não pertencem a uma entidade específica
- Repositórios: São interfaces que definem como eu vou buscar e salvar meus dados
- Events: São notificações quando algo importante acontece no meu domínio

Em DDD temos o "Bounded Contexts" que é basicamente separar diferentes partes do meu sistema em contextos bem definidos. Por exemplo, no meu projeto eu tenho três contextos principais: Users, Families e Tasks. Cada contexto tem suas próprias regras e não precisa saber dos detalhes internos dos outros contextos.

## Conceito de Command Query Responsibility Segregation (CQRS)

CQRS é um padrão que separa as operações de leitura (queries) das operações de escrita (commands). Em vez de ter um modelo único para tudo, você tem modelos otimizados para cada tipo de operação. Isso permite otimizar cada operação de forma independente, ou seja, posso ter um banco otimizado para leitura e outro para escrita, ou diferentes estruturas de dados para cada caso.

Ele é dividido em dois tipos de operações:

1. Commands (operações que modificam o estado) e Command Handler (processam os commands e aplicam as regras de negócio)
2. Queries (operações que apenas leem dados) e Query Handlers (buscam e retornam dados, sem modificar nada)

Em CQRS temos o "Event Sourcing" que permite que eu armazene todas as mudanças que acontecem no meu sistema como uma sequência de eventos. Em vez de salvar apenas o estado atual, eu salvo todos os eventos que levaram até aquele estado. Isso é útil porque posso reconstruir qualquer estado anterior e também posso criar diferentes "visões" dos meus dados para diferentes necessidades.

Para a leitura e escrita terem consistência entre os dados, existe a "estratégia de sincronização", a partir do momento que os dados são alterados, é preciso realizar em algum momento a sincronização da base de dados de leitura com a da escrita. As estratégia mais comuns:

- Automática = Cada mudança de estado dispara um processo síncrono no banco de dados de leitura
- Eventual = A atualização é feita de forma assíncrona
- Controlada = Disparo periódico normalmente agendado
- Sob Demanda = Para cada consulta, a consistência das bases é verificada forçando uma sincronização

## Estrutura do projeto

Seguindo os princípios dos conceitos de Clean Architecture, Domain-Driven Design (DDD) e Command Query Responsibility Segregation (CQRS), organizei o projeto da seguinte forma:

```
src/
├── shared/             # Código compartilhado entre contextos
│ ├── domain/           # Base classes e interfaces comuns
│ ├── infrastructure/   # Implementações compartilhadas (DB, Auth, etc.)
│ └── presentation/     # Filtros e interceptors globais
├── users/              # Bounded Context: Usuários
│ ├── domain/           # Entidades, agregados, value objects, regras de negócio
│ ├── application/      # Commands e Queries
│ │ ├── commands/       # Operações de escrita
│ │ └── queries/        # Operações de leitura
│ ├── infrastructure/   # Persistência, event handling, repositórios, event stores, projeções, etc.
│ └── presentation/     # Controllers HTTP, API endpoints
├── families/           # Bounded Context: Famílias (a estrutura é a mesmo que a dos Usuários mas para a Família)
│ ├── domain/
│ ├── application/
│ ├── infrastructure/
│ └── presentation/
└── tasks/              # Bounded Context: Tarefas (a estrutura é a mesmo que a do Usuários mas para a Tarefa)
  ├── domain/
  ├── application/
  ├── infrastructure/
  └── presentation/
```

Eu implementei como exemplo o uso de três bancos de dados (um otimizado para escrita, outro para leitura e um para os eventos), ambos usam o MongoDB local, e para autenticação implementei o JWT. Na raiz dos arquivos do projeto deixei um arquivo JSON para importar a estrutura completa dos endpoints para o Postman já com alguns dados para teste.

## Como apliquei na prática os princípios cada um dos conceitos no projeto:

### Clean Architecture

- Domain: Aqui ficam minhas entidades principais (User, Family, Task) com todas as regras de negócio. Por exemplo, a regra de que um membro de cargo inferior não pode criar tarefas para membros de cargo superior está aqui.

- Application: Aqui ficam meus Commands e Queries. Os Commands fazem as operações que mudam o estado (criar usuário, criar família, criar tarefa) e as Queries apenas buscam informações (listar usuários, buscar tarefas de uma família).

- Infrastructure: Aqui fica toda a parte técnica (conexão com banco de dados, implementação dos repositórios, etc.)

- Presentation: Aqui ficam meus controllers que recebem as requisições HTTP e chamam os casos de uso apropriados.

### DDD

Separei meu sistema em três Bounded Contexts bem definidos:

1. Users: Tudo relacionado a usuários (criação, login, perfil)
2. Families: Tudo relacionado a famílias (criação, adição de membros, hierarquia)
3. Tasks: Tudo relacionado a tarefas (criação, atribuição, status)

Cada contexto tem suas próprias regras e não interfere diretamente nos outros. Por exemplo, quando um usuário é criado, eu disparo um evento que a família pode escutar, mas a família não precisa saber como o usuário foi criado.

Como implementei cada conceito do DDD:

- Value Objects: Implementei objetos como UserId, FamilyRoleVO, FamilyMemberVO que representam conceitos importantes mas não têm identidade própria. O FamilyRoleVO por exemplo, tem um método getHierarchyLevel() que define a hierarquia familiar (avós = 1, pais = 2, filhos = 3, etc.).

- Agregados e Entidades: No caso, no meu projeto estou usando diretamente as entidades como Aggregates, pois elas agrupam os VOs e encapsulam regras de negócio complexas implementando o Event Sourcing. Family tem métodos como addMember(), removeMember() e canCreateTaskFor() que aplicam as regras de hierarquia familiar, e contém os FamilyMemberVO que representam os membros da família.

- Domain Services: Criei services como FamilyFactory e TaskFactory para encapsular a lógica de criação complexa que não pertence diretamente a uma entidade específica. Por exemplo, o FamilyFactory tem a responsabilidade de criar uma família completa com todos os seus Value Objects (FamilyId, FamilyNameVO, FamilyMemberVO) e definir o membro principal como "responsável principal" automaticamente. Já o TaskFactory cria tarefas com todas as atribuições e validações necessárias, convertendo strings simples em Value Objects complexos. Isso mantém as entidades focadas apenas em suas regras de negócio, enquanto a lógica de montagem fica centralizada nos factories.

- Repositórios: Defini interfaces abstratas no domínio (como FamilyRepository, TaskRepository, UserRepository) que especificam exatamente quais operações de persistência cada entidade precisa (save, findById, findByEmail, etc.). Depois implementei essas interfaces na camada de infraestrutura usando MongoDB (MongoFamilyRepository, MongoTaskRepository, MongoUserRepository). Isso me permite trocar o banco de dados ou a tecnologia de persistência sem afetar o domínio - posso criar uma versão usando MySQL ou qualquer outra tecnologia, desde que implemente as mesmas interfaces. O domínio nunca sabe se estou usando MongoDB, SQL ou arquivos JSON, ele só conhece as abstrações.

- Events: Implementei eventos como FamilyCreatedEvent, MemberAddedEvent, TaskCreatedEvent que são disparados quando algo importante acontece no domínio e altera seu estado.

### CQRS

Em Clean Architecture existe a camada de Use Cases, portanto separei as operações de leitura e escrita usando o conceito de CQRS já que ele lida com as intenções do usuário com a solução:

- Commands: CreateUserCommand, CreateFamilyCommand, CreateTaskCommand, etc. - todos modificam o estado
- Queries: GetUserQuery, GetFamilyMembersQuery, GetTasksByFamilyQuery, etc. - todos apenas leem dados

Cada Command tem seu Handler que aplica as regras de negócio e salva no banco. Cada Query tem seu Handler que busca os dados e retorna formatados para a apresentação.

Para a sincronização entre os bancos de dados, e por se tratar de um projeto de estudos, eu adotei a estratégia "Automática" para sincronizar, onde a cada mudança de estado o sistema dispara um processo que gera a sincronização.

### Event Sourcing (parcialmente implementado)

Implementei um sistema básico de eventos onde, quando algo importante acontece (usuário criado, família criada, tarefa atribuída), eu disparo um evento. Outros contextos podem escutar esses eventos e reagir conforme necessário. No caso, essa implementação tem um Event Store básico que salva os eventos no banco, porém ainda não criei uma lógica de reconstrução completa e nem um versionamento para retornar a aplicação a um estado anterior.
