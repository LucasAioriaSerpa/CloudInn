# Objetivo

Analise completamente o BACKEND existente da aplicação e gere documentação arquitetural dentro da pasta:
doc/
A documentação deve representar fielmente a implementação atual do backend, considerando os princípios e padrões de:

Vertical Slice Architecture

Clean Architecture

SOLID

O foco desta tarefa é exclusivamente o BACKEND.
Não documente frontend, componentes visuais ou arquitetura de UI, exceto quando necessário apenas para demonstrar um ponto de entrada ou comunicação com o backend.

1. Antes de gerar os diagramas

Primeiro, analise a estrutura real do projeto e identifique:

módulos;
features;
slices;
controllers/endpoints;
commands;
queries;
handlers;
services;
use cases;
entities;
value objects;
DTOs;
interfaces;
repositories;
implementações de repositories;
acesso a banco de dados;
clients externos;
adapters;
gateways;
middlewares;
validações;
eventos;
mensageria;
dependências entre módulos;
injeção de dependência;
infraestrutura;
domínio;
application layer;
presentation/API layer.

Identifique também como o projeto efetivamente implementa:
Vertical Slice Architecture Clean Architecture SOLID
Não presuma que determinada classe, camada ou padrão exista.
A documentação deve ser derivada do código-fonte existente.
Caso alguma parte do projeto não siga perfeitamente esses padrões, represente a arquitetura real e registre isso na documentação.

2. Estrutura esperada

Crie dentro de:

doc/

no mínimo:

doc/
├── backend-class-diagram.md
├── backend-component-diagram.md
├── backend-architecture.md
└── diagrams/
├── backend-class-diagram.svg
└── backend-component-diagram.svg

Caso o projeto já possua uma convenção de documentação, adapte os nomes e diretórios sem quebrar a organização existente.

3. Diagrama de Classes do Backend

Criar:
doc/backend-class-diagram.md
utilizando Mermaid.
Utilize preferencialmente:
classDiagram
O diagrama deve mostrar as classes/interfaces mais relevantes para compreender a arquitetura do backend.
Representar quando aplicável:

Entities;
Value Objects;
Aggregates;
DTOs;
Commands;
Queries;
Handlers;
Use Cases;
Services;
Interfaces;
Repository interfaces;
Repository implementations;
Controllers/Endpoints;
Validators;
Mappers;
Adapters;
Gateways;
Infrastructure services.

Representar relações como:

implementação de interface;
dependência;
associação;
composição;
agregação;
herança;
criação/uso de objetos.

Exemplo conceitual:

```mermaid
classDiagram
class CreateOrderCommand { +customerId +items }
class CreateOrderHandler { +handle(command) }
class IOrderRepository { <<interface>> +save(order) +findById(id) }
class OrderRepository { +save(order) +findById(id) } class Order { +id +customerId +addItem() }
CreateOrderHandler --> CreateOrderCommand
CreateOrderHandler --> IOrderRepository
CreateOrderHandler --> Order
OrderRepository ..|> IOrderRepository
```

Este exemplo é apenas referência de sintaxe.
Não copie entidades fictícias para o projeto.
Utilize exclusivamente elementos encontrados no código.

4. Organização do diagrama por Vertical Slice

Caso existam múltiplas features, organize visualmente por slice.
Exemplo conceitual:

Orders
├── CreateOrder
│ ├── Command
│ ├── Handler
│ └── Validator
│ ├── GetOrder
│ ├── Query
│ └── Handler
│ └── Domain
└── Order

Se o backend possuir muitas classes, não crie um diagrama ilegível.
Nesse caso:

crie um diagrama principal;

mostre as relações arquiteturais mais importantes;

opcionalmente crie diagramas adicionais por feature/slice em:

doc/diagrams/slices/

5. Diagrama de Componentes do Backend

Criar:
doc/backend-component-diagram.md
utilizando Mermaid.
Utilize preferencialmente:
flowchart
ou outro tipo Mermaid que represente corretamente componentes e dependências.
O objetivo é demonstrar a arquitetura macro do backend.
Representar elementos como:
API / Presentation ↓ Vertical Slices / Features ↓ Application ↓ Domain ↑ Infrastructure
Entretanto, represente a estrutura real encontrada no projeto.
O diagrama deve permitir compreender:

onde as requisições entram;
qual slice/feature recebe a requisição;
qual handler/use case executa a operação;
quais interfaces são utilizadas;
onde as implementações concretas estão;
como ocorre persistência;
quais integrações externas existem;
como ocorre Dependency Injection;
quais dependências atravessam as camadas.

Quando possível, organize visualmente utilizando:
subgraph
Exemplo conceitual:
flowchart LR subgraph Presentation API[REST API] end subgraph Application CreateUser[Create User Slice] GetUser[Get User Slice] end subgraph Domain User[User Entity] end subgraph Infrastructure UserRepository[User Repository] Database[(Database)] end API --> CreateUser API --> GetUser CreateUser --> User CreateUser --> UserRepository UserRepository --> Database
Novamente: esse código é apenas referência.
Use os nomes e componentes reais encontrados no projeto.

6. Demonstrar Vertical Slice Architecture

O diagrama de componentes deve deixar explícito como as funcionalidades são organizadas por feature/slice, quando isso existir no projeto.
Evite representar o sistema apenas como:
Controller ↓ Service ↓ Repository
caso a aplicação esteja organizada em Vertical Slice.
Priorize demonstrar algo conceitualmente semelhante a:
Feature ├── Endpoint ├── Request ├── Command/Query ├── Handler ├── Validator └── Response
seguido das dependências necessárias de domínio e infraestrutura.

7. Demonstrar Clean Architecture

Identifique claramente as fronteiras arquiteturais.
Quando aplicável, represente:
Domain Application Infrastructure Presentation
ou os nomes equivalentes utilizados no projeto.
Verifique principalmente a regra:

Dependências devem apontar para dentro, em direção às abstrações e regras de negócio.

Identifique situações como:
Application → Interface Infrastructure → implementação da Interface
em vez de:
Application → implementação concreta de Infrastructure
Caso encontre violações desta regra, não altere o código nesta tarefa.
Apenas documente em:
doc/backend-architecture.md

8. Análise SOLID

No arquivo:
doc/backend-architecture.md
adicione uma seção:

## SOLID

e analise objetivamente como o backend aplica:

S — Single Responsibility Principle

Identifique classes com responsabilidades bem definidas e possíveis concentrações excessivas de responsabilidades.

O — Open/Closed Principle

Identifique uso de:

interfaces;
strategies;
abstrações;
extensibilidade sem alteração de regras centrais.

L — Liskov Substitution Principle

Verifique implementações de interfaces e abstrações substituíveis.

I — Interface Segregation Principle

Verifique se interfaces possuem responsabilidades específicas ou se existem interfaces excessivamente amplas.

D — Dependency Inversion Principle

Identifique onde módulos de alto nível dependem de abstrações e onde Infrastructure implementa essas abstrações.
Não faça uma análise genérica.
Cite exemplos reais encontrados no projeto.

9. backend-architecture.md

Criar também:
doc/backend-architecture.md
com a seguinte estrutura aproximada:

# Backend Architecture ## Visão Geral ## Estrutura de Diretórios ## Vertical Slice Architecture ## Clean Architecture ## Fluxo de uma Requisição ## Dependency Injection ## Persistência ## Integrações Externas ## SOLID ### Single Responsibility Principle ### Open/Closed Principle ### Liskov Substitution Principle ### Interface Segregation Principle ### Dependency Inversion Principle ## Pontos de Atenção ## Diagramas - [Diagrama de Classes](./backend-class-diagram.md) - [Diagrama de Componentes](./backend-component-diagram.md)

10. Fluxo de uma requisição

Dentro de:
backend-architecture.md
escolha pelo menos uma funcionalidade real do sistema e demonstre seu fluxo.
Por exemplo:
HTTP Request ↓ Endpoint ↓ Command / Query ↓ Handler ↓ Domain ↓ Repository Interface ↓ Infrastructure Repository ↓ Database
Use os nomes reais das classes envolvidas.
Se existirem diferenças entre operações de leitura e escrita, explique.

11. Imagens dos diagramas

Além dos arquivos Markdown com Mermaid, gerar também imagens dos diagramas.
Preferencialmente:
SVG
Gerar:
doc/diagrams/backend-class-diagram.svg doc/diagrams/backend-component-diagram.svg
Caso seja necessário, utilize Mermaid CLI, por exemplo:
mmdc
ou ferramenta equivalente disponível no ambiente.
Caso SVG não seja possível, utilizar:
PNG
como fallback.
Os arquivos Markdown devem continuar contendo o código Mermaid original, independentemente da geração da imagem.

12. Validação Mermaid

Antes de finalizar, valide os diagramas.
Garanta que:

a sintaxe Mermaid é válida;
os diagramas renderizam;
não existem IDs inválidos;
não existem caracteres que quebrem o parser;
relacionamentos Mermaid estão corretos;
subgraph está corretamente fechado;
nomes muito grandes não tornam o diagrama ilegível.

Se possível, execute o Mermaid CLI para confirmar a renderização.

13. Legibilidade

Evite diagramas gigantes e inutilizáveis.
Quando necessário, utilize:

agrupamento por feature;
agrupamento por camada;
abstração de classes secundárias;
diagramas separados por slice.

Priorize mostrar:
responsabilidades dependências fronteiras arquiteturais fluxo
em vez de simplesmente listar todas as classes existentes.

14. Regras importantes

Não:

invente classes;
invente interfaces;
invente métodos;
invente módulos;
invente relações;
documente funcionalidades inexistentes;
altere a arquitetura apenas para ela parecer Clean Architecture;
refatore código nesta tarefa;
altere comportamento do sistema;
altere APIs;
altere contratos;
documente frontend como parte do backend.

Sempre derive a documentação do código real.

15. Caso encontre problemas arquiteturais

Caso identifique:

violação de Dependency Inversion;
forte acoplamento;
dependência circular;
Application dependendo diretamente de Infrastructure;
handlers excessivamente grandes;
services genéricos com muitas responsabilidades;
repositories excessivamente acoplados;
duplicação entre slices;
violação de boundaries;
interfaces inadequadas;
mistura entre Domain e Infrastructure;

não altere automaticamente a aplicação.
Registre em:

## Pontos de Atenção

no arquivo:
doc/backend-architecture.md
Use o formato:

### [Nome do problema] **Local:** `caminho/do/arquivo` **Situação atual:** Descrição objetiva. **Impacto arquitetural:** Descrição. **Possível melhoria:** Descrição resumida.

16. Resultado esperado

Ao finalizar, deve ser possível abrir:
doc/backend-class-diagram.md
e visualizar o diagrama Mermaid de classes do backend.
Abrir:
doc/backend-component-diagram.md
e compreender a arquitetura de componentes.
Abrir:
doc/backend-architecture.md
e compreender:

como o backend está estruturado;
como Vertical Slice está sendo utilizado;
como Clean Architecture está sendo aplicada;
como SOLID aparece na implementação;
como uma requisição percorre o sistema;
quais componentes dependem de quais abstrações.

Também devem existir versões renderizadas dos diagramas em:
doc/diagrams/

17. Checklist final obrigatório

Antes de considerar a tarefa concluída, verifique:

[ ] Backend completo foi analisado.
[ ] Nenhuma classe fictícia foi adicionada.
[ ] Vertical Slices reais foram identificados.
[ ] Diagrama de classes foi criado.
[ ] Diagrama de componentes foi criado.
[ ] Mermaid é válido.
[ ] Diagramas renderizam corretamente.
[ ] Imagens SVG ou PNG foram geradas.
[ ] Clean Architecture foi documentada.
[ ] SOLID foi analisado com exemplos reais.
[ ] Dependency Injection foi documentada.
[ ] Persistência foi documentada.
[ ] Integrações externas foram documentadas.
[ ] Pelo menos um fluxo real foi documentado ponta a ponta.
[ ] Pontos arquiteturais problemáticos foram registrados sem modificar o código.
[ ] Nenhuma funcionalidade da aplicação foi alterada.

Ao final, apresente um resumo curto contendo:

arquivos criados;
slices/features identificados;
principais componentes arquiteturais;
eventuais problemas arquiteturais encontrados;
confirmação de que os Mermaid foram validados/renderizados.
