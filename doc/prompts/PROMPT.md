# Prompt enviado para IA criar a interface em REACT

Foi utilizado AI STUDIO da Google

foi anexado dois arquivos no momento que foi enviado o prompt:

---

## Anexados

1. [arc42-arquitetura-sistemica.md](../arc42-arquitetura-sistemica.md)
2. [swagger.yaml](../api/swagger.yaml)

---

## Prompt

```markdown
CloudInn — Implementação completa do Frontend React

Você é um engenheiro de software frontend sênior, especializado em React, arquitetura de software, integração com APIs REST, design systems e implementação de interfaces de alta fidelidade.
Sua tarefa é analisar os artefatos fornecidos e implementar integralmente o frontend da aplicação CloudInn, entregando uma aplicação funcional, organizada, responsiva, executável localmente e preparada para manutenção e evolução.
Não produza apenas protótipos, exemplos ou trechos isolados.
Implemente a aplicação completa.

1. Identidade da aplicação

Nome: CloudInn

Paleta oficial

Utilize a seguinte paleta como identidade visual do sistema:

#28262C — tom escuro principal
#998FC7 — roxo intermediário
#D4C2FC — roxo claro
#F9F5FF — fundo claro
#14248A — azul institucional

Centralize essas cores na configuração do Tailwind CSS ou em uma camada equivalente de design tokens.
Evite espalhar valores hexadecimais diretamente pelos componentes.

Exemplo conceitual de nomenclatura:

cloud-dark cloud-purple cloud-lavender cloud-background cloud-blue
A paleta CloudInn deve ser incorporada à interface sem destruir a fidelidade estrutural do mock.

Quando o mock possuir cores funcionais importantes — como sucesso, alerta, erro, desabilitado ou estados semânticos — elas podem ser preservadas.

2. Artefatos obrigatórios

Você receberá três fontes principais.

Mock da interface
https://mock.apidog.com/m1/1365796-1370036-1426621/reservation

Contrato da API
Arquivo: swagger.yaml

Arquitetura
Arquivo: arc42-arquitetura-sistemica.md

Antes de implementar qualquer código, os três artefatos devem ser analisados.

3. Hierarquia das fontes de verdade

Cada artefato possui uma responsabilidade diferente.
Não utilize um artefato para inventar informações pertencentes ao domínio de outro.

3.1 Swagger — fonte de verdade funcional

O arquivo: swagger.yaml

é a fonte absoluta de verdade para tudo relacionado à API e aos dados.

Isso inclui:

endpoints;
métodos HTTP;
query parameters;
path parameters;
headers;
request bodies;
response bodies;
schemas;
estruturas de objetos;
tipos de dados;
enums;
relacionamentos;
campos obrigatórios;
campos opcionais;
códigos HTTP;
contratos de entrada;
contratos de saída;
operações disponíveis.

Regra obrigatória

Nunca invente contratos de API.
Não crie:

endpoints inexistentes;
propriedades inexistentes;
parâmetros inexistentes;
enums adicionais;
filtros não documentados;
operações CRUD inexistentes;
campos auxiliares enviados ao backend;
respostas presumidas.

Se uma funcionalidade aparecer visualmente no mock, mas não existir operação correspondente no Swagger:

preserve a representação visual quando possível;
não invente endpoint;
não simule silenciosamente uma integração;
mantenha o elemento como somente visual, desabilitado ou local quando isso fizer sentido;
documente a inconsistência ao final.

4. Mock — fonte de verdade visual

O mock:
https://mock.apidog.com/m1/1365796-1370036-1426621/reservation
é a principal referência para aparência, organização e experiência do usuário.

Antes de implementar, inspecione cuidadosamente:

todas as telas acessíveis;
layout geral;
sidebar;
header;
navegação;
menus;
breadcrumbs;
cards;
tabelas;
formulários;
inputs;
selects;
botões;
ícones;
badges;
modais;
drawers;
tooltips;
filtros;
pesquisas;
estados de seleção;
paginação;
espaçamentos;
alinhamentos;
hierarquia tipográfica;
bordas;
arredondamentos;
sombras;
dimensões aproximadas;
comportamento dos elementos;
responsividade;
estados vazios;
loading;
erros;
feedbacks.

A implementação deve buscar alta fidelidade visual, e não apenas copiar a organização conceitual da página.
Não simplifique deliberadamente elementos que possam ser reproduzidos.

5. arc42 — fonte de verdade arquitetural

O arquivo:
arc42-arquitetura-sistemica.md
deve orientar:

organização dos módulos;

responsabilidades;

separação de camadas;

comunicação entre componentes;

integrações;

boundaries;

regras arquiteturais;

restrições técnicas;

decisões estruturais;

dependências entre partes do sistema.

A estrutura do frontend deve refletir essas decisões sempre que aplicáveis.

6. Regra de resolução de conflitos

Caso os artefatos apresentem informações aparentemente conflitantes, utilize obrigatoriamente esta ordem de decisão.

Dados e operações

Swagger
prevalece.

Interface e experiência

Mock
prevalece.

Organização interna e arquitetura

arc42
prevalece.
Portanto:
Swagger → determina O QUE o sistema pode fazer. Mock → determina COMO isso deve aparecer para o usuário. arc42 → determina COMO o código deve ser organizado.
Se o conflito não puder ser resolvido sem inventar informações, implemente a alternativa de menor escopo possível e registre a divergência na documentação final.
Não altere silenciosamente nenhum dos artefatos.

7. Stack obrigatória

A aplicação deve utilizar:

React
JavaScript
JSX
Vite
Tailwind CSS
React Router, caso existam múltiplas rotas/telas
API REST conforme Swagger
Material Design apenas como referência de princípios de UX

Utilize dependências adicionais somente quando houver benefício claro.
Priorize:

simplicidade;
legibilidade;
baixo acoplamento;
facilidade de manutenção;
componentes reutilizáveis.

8. REGRA CRÍTICA — JavaScript, não TypeScript

Este projeto deve ser implementado exclusivamente utilizando JavaScript.
São permitidos:
.js .jsx

São proibidos:
.ts .tsx

Não utilize:
TypeScript;
interfaces TypeScript;
type;
generics TypeScript;
enum TypeScript;
as SomeType;
React.FC;
tsconfig.json;
sintaxe específica de TypeScript.

Não converta o projeto para TypeScript em nenhuma circunstância.
Quando documentação de tipos for útil, utilize JSDoc.
Exemplo:

/\*\* _ @typedef {Object} Reservation _ @property {number} id _ @property {string} guestName _/

Quando adequado, utilize:
JSDoc;
validação de dados;
PropTypes somente quando trouxer benefício concreto.
Não utilize TypeScript apenas para obter tipagem estática.

9. Material Design

Material Design deve ser utilizado como referência de princípios, especialmente para:

feedback visual;
hierarquia;
estados de interação;
acessibilidade;
consistência;
affordance;
foco;
hover;
disabled;
loading;
error;
confirmação.

Não utilize Material UI automaticamente.
Não substitua o design do mock por componentes padrão do Material Design.
Quando houver divergência:
Mock > Material Design

10. Tailwind CSS

Utilize Tailwind CSS como principal mecanismo de estilização.
Centralize no tema:

paleta CloudInn;
fontes;
breakpoints relevantes;
sombras recorrentes;
border-radius;
dimensões recorrentes;
tokens de interface.
Evite:
CSS duplicado;
estilos inline desnecessários;
valores arbitrários repetidos;
classes gigantes duplicadas entre componentes.
Extraia componentes quando padrões visuais se repetirem.

11. Arquitetura frontend

Não construa toda a aplicação dentro de poucos arquivos.
Organize o projeto de forma modular.

Uma estrutura possível é:

src/
├── api/
├── assets/
├── components/
│ ├── common/
│ ├── feedback/
│ ├── forms/
│ └── layout/
├── config/
├── constants/
├── features/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── utils/
├── App.jsx
└── main.jsx

Essa estrutura é apenas uma referência.
Adapte-a ao arc42 fornecido.
Não force essa organização caso o documento arquitetural determine outra divisão mais adequada.

12. Organização por domínio

Quando o tamanho do sistema justificar, priorize organização baseada em funcionalidades/domínios.
Exemplo conceitual:

features/
├── reservations/
│ ├── components/
│ ├── hooks/
│ ├── services/
│ └── utils/
├── guests/
├── rooms/
└── authentication/

Crie somente módulos sustentados pelos artefatos fornecidos.
Não invente domínios apenas porque seriam comuns em um sistema hoteleiro.

13. Camada de API

Nenhum componente puramente visual deve realizar chamadas HTTP diretamente.
Crie uma camada dedicada para comunicação com backend.
Exemplo conceitual:
UI ↓ Hooks / Controllers ↓ Services ↓ HTTP Client ↓ API
Centralize configurações como:
API_BASE_URL
utilizando variável de ambiente.
Exemplo:
VITE_API_BASE_URL
Inclua:
.env.example
sem credenciais reais.

14. Implementação baseada no Swagger

Antes de implementar services, faça um inventário completo dos endpoints existentes.
Para cada operação determine:

método;
rota;
parâmetros;
payload;
response;
status codes;
schemas relacionados;
possível tela consumidora.

A implementação deve respeitar exatamente esses contratos.
Quando necessário, faça adaptação entre:

DTO da API ↓ modelo utilizado pela apresentação
sem alterar o contrato recebido ou enviado.

15. Tratamento HTTP

A camada HTTP deve tratar adequadamente:

2xx;
400;
401;
403;
404;
409;
422, caso exista;
500+;
falhas de conexão;
timeout quando aplicável.

Não assuma que todos esses status existem no Swagger.
Implemente tratamento específico conforme os contratos encontrados e um tratamento genérico seguro para falhas inesperadas.
As mensagens apresentadas ao usuário devem ser compreensíveis.
Evite exibir:
TypeError AxiosError stack trace JSON bruto
diretamente na interface.

16. Estado da aplicação

Escolha a solução de gerenciamento de estado de acordo com a necessidade real encontrada.
Priorize inicialmente:

estado local;
Context API;
hooks personalizados.

Introduza bibliotecas adicionais somente caso a complexidade justifique.
Não adicione Redux, Zustand ou outras bibliotecas automaticamente.
Caso a aplicação possua muitas operações assíncronas, caching, invalidação e sincronização com servidor, avalie uma solução específica para server state.
A escolha deve ser justificada pela complexidade observada.

17. Componentização

Cada componente deve possuir responsabilidade clara.
Evite:

componentes gigantes;
arquivos com centenas de linhas contendo várias responsabilidades;
lógica HTTP misturada com JSX;
transformação complexa de dados dentro da renderização;
duplicação;
prop drilling excessivo;
constantes mágicas;
regras de negócio espalhadas.

Extraia componentes reutilizáveis para padrões recorrentes.
Exemplos:
Button Input Select Modal Dialog Table EmptyState ErrorState LoadingState Badge Pagination SearchField PageHeader Sidebar
Crie apenas aquilo que realmente for utilizado.

18. Ícones

Utilize uma biblioteca de ícones consistente e leve caso seja necessário.
Não utilize emojis para substituir ícones da interface.
Os ícones devem reproduzir, tanto quanto possível:

significado;
peso visual;
escala;
posicionamento
observados no mock.

19. Interações

Implemente todas as interações justificadas pelo mock e pelo Swagger.
Isso pode incluir:

navegação;
criação;
edição;
exclusão;
visualização;
filtros;
pesquisa;
ordenação;
paginação;
seleção;
dropdowns;
modais;
dialogs;
confirmação;
formulários;
validações;
feedback de sucesso;
feedback de erro;
atualização após operações.

Não implemente uma operação apenas porque um CRUD normalmente teria essa funcionalidade.
Ela precisa estar respaldada pelos artefatos.

20. Formulários

Formulários devem respeitar os schemas do Swagger.
Observe:

propriedades obrigatórias;
propriedades opcionais;
enums;
formatos;
limites;
tipos;
validações.

Não envie propriedades exclusivamente visuais para a API.
Diferencie claramente:
estado do formulário
de:
payload da API
quando necessário.

21. Estados assíncronos

Toda região dependente de API deve possuir tratamento apropriado para:

Loading
Exiba indicador coerente com o contexto.

Empty
Informe claramente quando não existem registros.

Error
Exiba uma mensagem útil e, quando apropriado, permita nova tentativa.

Success
Atualize a interface adequadamente.

Evite telas quebradas, áreas simplesmente em branco ou loaders infinitos.

22. Responsividade

A aplicação deve funcionar corretamente em:

desktop;
notebook;
tablet;
smartphone.

Não implemente responsividade apenas diminuindo proporcionalmente os componentes.
Adapte a interface quando necessário.
Exemplos:

sidebar → drawer/menu mobile;
tabela extensa → scroll horizontal ou apresentação adaptada;
filtros → área recolhível;
grids → reorganização vertical;
modais → largura adaptativa;
ações → menus compactos quando apropriado.

Preserve a hierarquia visual e funcional.

23. Acessibilidade

Adote boas práticas básicas de acessibilidade.
Inclua quando aplicável:

elementos HTML semânticos;
label associado a input;
estados de foco visíveis;
navegação por teclado;
aria-label;
aria-expanded;
aria-modal;
textos alternativos;
contraste suficiente;
botões reais para ações;
links reais para navegação.

Não transforme todo elemento clicável em div.

24. Design responsivo da CloudInn

A identidade CloudInn deve utilizar a paleta fornecida de maneira consistente.
Uma orientação inicial é:

#F9F5FF → superfícies e fundo principal
#28262C → texto principal / navegação escura
#998FC7 → elementos secundários
#D4C2FC → backgrounds suaves / estados selecionados
#14248A → ações primárias e elementos institucionais

Entretanto, adapte essa distribuição ao mock.
Não substitua arbitrariamente estados semânticos de erro, sucesso e alerta pelas cores institucionais.

25. Dados mockados

Não substitua endpoints existentes por objetos estáticos.
Se o backend estiver indisponível durante o desenvolvimento e for absolutamente necessário tornar a interface navegável, isole dados temporários.
Exemplo:

src/mocks/

Essa camada deve:

estar claramente identificada;
não contaminar os services reais;
ser facilmente removível;
não alterar contratos;
não ser habilitada como comportamento de produção por padrão.

26. Não inventar funcionalidades

É proibido adicionar funcionalidades simplesmente porque parecem úteis para um software de hotelaria.
Não invente, por exemplo:

pagamentos;
check-in;
check-out;
hóspedes;
quartos;
reservas;
relatórios;
dashboard;
permissões;
autenticação;
notificações;

a menos que estejam respaldados pelo:

Swagger;
mock;
arc42.

O nome CloudInn não é autorização para presumir regras do domínio.

27. Processo obrigatório antes da implementação

Antes de escrever componentes, execute mentalmente e documentalmente as seguintes etapas.

Etapa 1 — Análise do Swagger

Identifique:
endpoints;
operações;
schemas;
enums;
relacionamentos;
parâmetros;
payloads;
respostas;
códigos HTTP.

Etapa 2 — Análise do arc42

Identifique:

componentes arquiteturais;
boundaries;
responsabilidades;
restrições;
dependências;
integrações;
decisões importantes.

Etapa 3 — Análise do mock

Identifique:

páginas;
rotas;
layouts;
componentes;
formulários;
tabelas;
ações;
modais;
filtros;
estados;
responsividade.

Etapa 4 — Matriz Mock × Swagger

Monte internamente uma matriz equivalente a:

Elemento visual ↓ Ação esperada ↓ Endpoint relacionado ↓ Request ↓ Response ↓ Componente responsável

Exemplo conceitual:

ReservationTable → listar registros → GET /... → query ... → response ... → ReservationPage

Não copie esse exemplo caso esses elementos não existam realmente nos artefatos.

Etapa 5 — Análise de gaps

Classifique diferenças em três categorias:

Compatível
Mock e Swagger suportam a funcionalidade.

Visual sem API
Existe no mock, mas não existe contrato correspondente.

API sem representação visual
Existe no Swagger, mas nenhuma interface claramente correspondente foi encontrada.
Não invente soluções para esconder esses gaps.

Etapa 6 — Definição arquitetural

Somente depois dessas análises determine:

estrutura de diretórios;
páginas;
layouts;
componentes;
services;
hooks;
rotas;
estado;
utilitários.

Etapa 7 — Implementação

Só então escreva o código.

28. Estratégia de implementação

Implemente preferencialmente nesta ordem:

1. Bootstrap do projeto
2. Tailwind e identidade CloudInn
3. Estrutura arquitetural
4. Cliente HTTP
5. Services
6. Layout principal
7. Rotas
8. Componentes compartilhados
9. Páginas
10. Integração com API
11. Formulários e interações
12. Loading / Empty / Error
13. Responsividade
14. Acessibilidade
15. Revisão visual
16. Revisão arquitetural
17. Validação final
    Não considere a aplicação concluída depois de apenas criar o layout.
18. Qualidade do código JavaScript

Mesmo sem TypeScript, mantenha contratos claros.

Utilize quando pertinente:

JSDoc;
funções pequenas;
nomes descritivos;
constantes;
módulos;
validações;
adapters;
optional chaining;
nullish coalescing;
destructuring.

Evite:

variáveis globais;
mutações desnecessárias;
funções gigantes;
lógica duplicada;
comentários descrevendo código óbvio;
abstrações prematuras;
código morto.

30. Configuração do projeto

O projeto final deve possuir no mínimo os arquivos necessários para:
npm install npm run dev npm run build
Inclua scripts adequados no:
package.json
O build de produção precisa finalizar sem erros.

31. Variáveis de ambiente

Não hardcode URLs de backend dentro dos componentes.
Utilize:
VITE_API_BASE_URL
ou variável equivalente apropriada.
Forneça:
.env.example
Exemplo conceitual:
VITE_API_BASE_URL=http://localhost:8080
Não inclua credenciais reais.

32. Tratamento de configuração

Centralize informações recorrentes como:

rotas;
API base URL;
labels;
design tokens;
configurações;
limites conhecidos;
formatos.

Não espalhe valores mágicos pela aplicação.

33. Fidelidade visual — revisão obrigatória

Depois de implementar cada tela relevante, compare novamente com o mock.
Revise:

proporções;
largura de elementos;
altura;
alinhamento;
padding;
gap;
fonte;
tamanho da fonte;
font weight;
border radius;
sombras;
ícones;
contraste;
densidade;

posicionamento.

Faça ajustes antes de considerar a tela concluída.

34. Comportamentos proibidos

Não:

produza TypeScript;
altere o Swagger;
invente endpoints;
invente campos;
invente regras do domínio;
invente respostas da API;
simplifique o mock sem necessidade;
coloque todas as chamadas HTTP dentro dos componentes;
implemente tudo em App.jsx;
substitua integração real por mock quando houver API;
utilize placeholders como solução final;
deixe botões que deveriam funcionar sem implementação quando houver contrato correspondente;
entregue somente pseudocódigo;
entregue somente uma demonstração parcial;
pare após explicar como faria.

35. Validação final obrigatória

Antes de concluir, faça uma auditoria completa.
Confirme:

Execução
aplicação instala corretamente;
npm run dev funciona;
npm run build funciona.

JavaScript
nenhuma extensão .ts;
nenhuma extensão .tsx;
nenhum tsconfig;
nenhuma sintaxe TypeScript.

API
endpoints correspondem ao Swagger;
métodos HTTP estão corretos;
payloads correspondem aos schemas;
parâmetros estão corretos;
responses são interpretadas corretamente.

Interface
mock reproduzido com alta fidelidade;
paleta CloudInn incorporada;
loading tratado;
empty tratado;
error tratado;
interações implementadas.

Arquitetura
componentes possuem responsabilidades claras;
API desacoplada da camada visual;
organização respeita o arc42;
não há duplicação evidente;
não existem componentes monolíticos desnecessários.
Responsividade

Teste conceitualmente pelo menos:
375px 768px 1024px 1440px

36. Critérios de aceitação

A implementação somente pode ser considerada concluída se:

[ ] utiliza React;
[ ] utiliza JavaScript e JSX;
[ ] não utiliza TypeScript;
[ ] utiliza Vite;
[ ] utiliza Tailwind CSS;
[ ] utiliza a paleta CloudInn;
[ ] executa localmente;
[ ] gera build de produção;
[ ] reproduz o mock com alta fidelidade;
[ ] respeita integralmente os contratos disponíveis no Swagger;
[ ] possui integração real com endpoints existentes;
[ ] possui camada de API desacoplada;
[ ] segue as diretrizes relevantes do arc42;
[ ] implementa as principais interações;
[ ] trata loading;
[ ] trata empty state;
[ ] trata error state;
[ ] é responsiva;
[ ] possui organização modular;
[ ] não inventa funcionalidades;
[ ] não inventa contratos;
[ ] não contém código morto relevante;
[ ] não contém dependências desnecessárias.

37. Entrega obrigatória

Ao finalizar, entregue o projeto completo.
Além dos arquivos da aplicação, apresente um resumo contendo:

1. Estrutura

Árvore resumida dos diretórios principais.

2. Arquitetura

Explique brevemente:
organização adotada;
divisão de responsabilidades;
fluxo de dados;
camada de API;

gerenciamento de estado.

3. Componentes principais

Liste os principais:

layouts;
páginas;
componentes;
hooks;
services.

4. Mapeamento Mock × Swagger

Apresente uma tabela:
Tela/ComponenteFuncionalidadeEndpointMétodo
Utilize apenas endpoints realmente presentes no Swagger.

5. Inconsistências encontradas

Apresente:
Artefatos envolvidosInconsistênciaDecisão adotada
Não esconda divergências.

6. Execução

Forneça instruções exatas:
npm install npm run dev
e, para build:
npm run build

7. Variáveis de ambiente

Documente todas as variáveis necessárias.

38. Princípio fundamental

Durante todo o desenvolvimento mantenha esta regra:

Swagger define contratos e dados. Mock define interface e experiência. arc42 define organização arquitetural. CloudInn define a identidade visual.

Nenhuma dessas fontes deve ser substituída por suposições próprias.
Na presença de ambiguidades:

preserve o contrato do Swagger;
preserve o comportamento visual observável no mock;
preserve as restrições arquiteturais do arc42;
escolha a solução de menor complexidade;
privilegie manutenibilidade;
não invente requisitos.

39. Instrução final de execução

Não responda apenas com uma análise ou plano de implementação.
Após analisar os artefatos:

faça o mapeamento necessário;
defina a arquitetura;
implemente os arquivos;
conecte a API;
implemente as telas;
implemente os estados e interações;
revise a responsividade;
revise a fidelidade visual;
valide os contratos;
valide o build;

entregue o projeto completo.

Se alguma informação estiver ausente, implemente tudo o que for possível sem inventar contratos ou requisitos, isole a limitação e registre-a claramente na entrega final.
O resultado esperado é uma aplicação CloudInn funcional e executável, e não apenas uma demonstração visual.
```
