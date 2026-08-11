---
date: Setembro de 2024
title: Modelo ![arc42](images/arc42-logo.png)
---

# 

**Sobre o arc42**

arc42, o template para documentação de software e arquitetura de
sistemas.

Versão do template 8.2-PT. (based upon AsciiDoc version), Setembro de
2024

Criado, mantido e © pelo Dr. Peter Hruschka, Dr. Gernot Starke e
colaboradores. Veja <https://arc42.org>.

:::: note
::: title
:::

Esta versão do modelo contém algumas ajudas e explicações. É usada para
familiarização com arc42 e compreensão dos conceitos. Para a
documentação do seu próprio sistema, é melhor usar a versão *plain*.
::::

# Introdução e Objetivos {#section-introduction-and-goals}

Descreve os requisitos relevantes e as forças motrizes que os arquitetos
de software e a equipe de desenvolvimento devem considerar. Isso inclui

-   objetivos de negócios subjacentes,

-   recursos essenciais,

-   requisitos funcionais essenciais,

-   objetivos de qualidade para a arquitetura e

-   partes interessadas relevantes e suas expectativas

## Visão Geral dos Requisitos {#_visão_geral_dos_requisitos}

::: formalpara-title
**Conteúdo**
:::

Descrição curta dos requisitos funcionais, forças motrizes, excerto (ou
resumo) dos requisitos. Link para (esperançosamente existentes)
documentos de requisitos (com número da versão e informações sobre onde
encontrá-lo).

::: formalpara-title
**Motivação**
:::

Do ponto de vista dos usuários finais, um sistema é criado ou modificado
para melhorar o suporte e/ou melhorar a qualidade de uma atividade
negocial.

::: formalpara-title
**Forma**
:::

Descrição textual curta, provavelmente em formato tabular de casos de
uso. Se existirem documentos de requisitos, esta visão geral deve se
referir a esses documentos.

Mantenha esses trechos o mais curtos possível. Equilibre a legibilidade
deste documento com a redundância potencial em relação aos documentos de
requisitos.

::: formalpara-title
**Mais informações**
:::

Consulte [Introduction and Goals](https://docs.arc42.org/section-1/) na
documentação do arc42.

## Objetivos de Qualidade {#_objetivos_de_qualidade}

::: formalpara-title
**Conteúdo**
:::

Os três principais (máx. cinco) objetivos de qualidade para a
arquitetura cujo cumprimento é de maior importância para as principais
partes interessadas. Nós realmente queremos dizer objetivos de qualidade
para a arquitetura. Não os confunda com objetivos de projeto. Eles não
são necessariamente idênticos.

Considere esta visão geral de tópicos potenciais (com base no padrão ISO
25010):

![Categorias de Requisitos de
Qualidade](images/01_2_iso-25010-topics-EN-2023.drawio.png)

::: formalpara-title
**Motivação**
:::

Você deve saber os objetivos de qualidade de suas partes interessadas
mais importantes, pois elas influenciarão decisões arquiteturais
fundamentais. Certifique-se de ser muito concreto sobre essas
qualidades, evite chavões. Se você, como arquiteto, não sabe como a
qualidade do seu trabalho será julgada...​

::: formalpara-title
**Forma**
:::

Uma tabela com objetivos de qualidade e cenários concretos, ordenados
por prioridades

## Partes Interessadas {#_partes_interessadas}

::: formalpara-title
**Conteúdo**
:::

Visão geral explícita das partes interessadas do sistema, ou seja, todas
as pessoas, funções ou organizações que

-   devem conhecer a arquitetura

-   precisam ser convencidas da arquitetura

-   precisam trabalhar com a arquitetura ou com código

-   precisam da documentação da arquitetura para seu trabalho

-   precisam tomar decisões sobre o sistema ou seu desenvolvimento

::: formalpara-title
**Motivação**
:::

Você deve conhecer todas as partes envolvidas no desenvolvimento do
sistema ou afetadas pelo sistema. Caso contrário, você pode ter
surpresas desagradáveis ​​mais tarde no processo de desenvolvimento. Essas
partes interessadas determinam a extensão e o nível de detalhes do seu
trabalho e seus resultados.

::: formalpara-title
**Forma**
:::

Tabela com nomes de funções, nomes de pessoas e suas expectativas com
relação à arquitetura e sua documentação.

+-------------+---------------------------+---------------------------+
| Função/Nome | Contato                   | Expectativas              |
+=============+===========================+===========================+
| *\<         | *\<Contato-1\>*           | *\<Expectativa-1\>*       |
| Função-1\>* |                           |                           |
+-------------+---------------------------+---------------------------+
| *\<         | *\<Contato-2\>*           | *\<Expectativa-2\>*       |
| Função-2\>* |                           |                           |
+-------------+---------------------------+---------------------------+

# Restrições Arquiteturais {#section-architecture-constraints}

::: formalpara-title
**Conteúdo**
:::

Qualquer requisito que restrinja arquitetos de software em sua liberdade
de decisões de design e implementação ou decisão sobre o processo de
desenvolvimento. Essas restrições às vezes vão além de sistemas
individuais e são válidas para organizações e empresas inteiras.

::: formalpara-title
**Motivação**
:::

Arquitetos devem saber exatamente onde são livres em suas decisões de
design e onde devem aderir às restrições. Restrições devem sempre ser
tratadas; elas podem ser negociáveis, no entanto.

::: formalpara-title
**Forma**
:::

Tabelas simples de restrições com explicações. Se necessário, você pode
subdividi-las em restrições técnicas, restrições organizacionais e
políticas e convenções (por exemplo, diretrizes de programação ou
controle de versão, convenções de documentação ou nomenclatura)

::: formalpara-title
**Mais informações**
:::

Consulte [Architecture Constraints](https://docs.arc42.org/section-2/)
na documentação do arc42.

# Contexto e Escopo {#section-context-and-scope}

::: formalpara-title
**Conteúdo**
:::

Contexto e escopo - como o nome sugere - delimita seu sistema (ou seja,
seu escopo) de todos os seus parceiros de comunicação (sistemas e
usuários vizinhos, ou seja, o contexto do seu sistema). Ele especifica,
portanto, as interfaces externas.

Se necessário, diferencie o contexto de negócios (entradas e saídas
específicas do domínio) do contexto técnico (canais, protocolos,
hardware).

::: formalpara-title
**Motivação**
:::

As interfaces de domínio e as interfaces técnicas para componentes
externos estão entre os aspectos mais críticos do seu sistema.
Certifique-se de entendê-las completamente.

::: formalpara-title
**Forma**
:::

Várias opções:

-   Diagramas de contexto

-   Listas de componentes externos e suas interfaces.

::: formalpara-title
**Mais informações**
:::

Consulte [Context and Scope](https://docs.arc42.org/section-3/) na
documentação do arc42.

## Contexto Negocial {#_contexto_negocial}

::: formalpara-title
**Conteúdo**
:::

Especificação de **todos** os componentes externos (usuários, sistemas
de TI, ...​) com explicações de entradas e saídas ou interfaces
específicas do domínio. Opcionalmente, você pode adicionar formatos
específicos do domínio ou protocolos de comunicação.

::: formalpara-title
**Motivação**
:::

Todas as partes interessadas devem entender quais dados são trocados com
o ambiente do sistema.

::: formalpara-title
**Forma**
:::

Todos os tipos de diagramas que mostram o sistema como uma caixa preta e
especificam as interfaces de domínio para os componentes externos.

Como alternativa (ou adicionalmente), você pode usar uma tabela. O
título da tabela é o nome do seu sistema, as três colunas contêm o nome
do componente externo, as entradas e as saídas.

**\<Diagrama ou Tabela\>**

**\<opcionalmente: Explicação das interfaces de domínio externo\>**

## Contexto Técnico {#_contexto_técnico}

::: formalpara-title
**Conteúdo**
:::

Interfaces técnicas (canais e mídias de transmissão) que vinculam seu
sistema ao seu ambiente. Além disso, um mapeamento de entrada/saída
específica de domínio para os canais, ou seja, uma explicação de qual
E/S usa qual canal.

::: formalpara-title
**Motivação**
:::

Muitas partes interessadas tomam decisões arquiteturais com base nas
interfaces técnicas entre o sistema e seu contexto. Especialmente os
designers de infraestrutura ou hardware decidem essas interfaces
técnicas.

::: formalpara-title
**Forma**
:::

Por exemplo, diagrama de implantação UML descrevendo canais para
sistemas vizinhos, junto com uma tabela de mapeamento mostrando os
relacionamentos entre canais e entrada/saída.

**\<Diagrama ou Tabela\>**

**\<opcionalmente: Explicação das interfaces técnicas\>**

**\<Mapeamento de entrada/saída para canais\>**

# Estratégia de Solução {#section-solution-strategy}

::: formalpara-title
**Conteúdo**
:::

Um breve resumo e explicação das decisões fundamentais e estratégias de
solução que moldam a arquitetura do sistema. Inclui

-   decisões de tecnologia

-   decisões sobre a decomposição de nível superior do sistema, por
    exemplo, uso de um padrão arquitetural ou *design pattern*

-   decisões sobre como atingir as principais metas de qualidade

-   decisões organizacionais relevantes, por exemplo, selecionar um
    processo de desenvolvimento ou delegar certas tarefas a terceiros.

::: formalpara-title
**Motivação**
:::

Essas decisões formam os pilares da sua arquitetura. Elas são a base
para muitas outras decisões detalhadas ou regras de implementação.

::: formalpara-title
**Forma**
:::

Mantenha as explicações dessas decisões-chave curtas.

Motive o que foi decidido e por que foi decidido dessa forma, com base
na declaração do problema, metas de qualidade e principais restrições.
Consulte os detalhes nas seções a seguir.

::: formalpara-title
**Mais informações**
:::

Consulte [Solution Strategy](https://docs.arc42.org/section-4/) na
documentação do arc42.

# Visão de Blocos de Construção {#section-building-block-view}

::: formalpara-title
**Conteúdo**
:::

A visão de blocos de construção mostra a decomposição estática do
sistema em blocos (módulos, componentes, subsistemas, classes,
interfaces, pacotes, bibliotecas, frameworks, camadas, partições,
níveis, funções, macros, operações, estruturas de dados, ...​) bem como
suas dependências (relacionamentos, associações, ...​)

Esta visão é obrigatória para toda documentação de arquitetura. Em
analogia a uma casa, esta é a *planta baixa*.

::: formalpara-title
**Motivação**
:::

Mantenha uma visão geral do seu código-fonte tornando sua estrutura
compreensível por meio de abstração.

Isso permite que você se comunique com suas partes interessadas em um
nível abstrato sem revelar detalhes de implementação.

::: formalpara-title
**Forma**
:::

A visão de blocos de construção é uma coleção hierárquica de caixas
pretas e caixas brancas (veja a figura abaixo) e suas descrições.

![Hierarquia de blocos de construção](images/05_building_blocks-EN.png)

**Nível 1** é a descrição da caixa branca do sistema geral, juntamente
com descrições de caixa preta de todos os blocos de construção contidos.

**Nível 2** amplia alguns blocos de construção do nível 1. Portanto, ele
contém a descrição da caixa branca dos blocos de construção selecionados
do nível 1, juntamente com descrições de caixa preta de seus blocos de
construção internos.

**Nível 3** amplia os blocos de construção selecionados do nível 2, e
assim por diante.

::: formalpara-title
**Mais informações**
:::

Consulte [Building Block View](https://docs.arc42.org/section-5/) na
documentação do arc42.

## Visão Sistêmica Geral de Caixa Branca {#_visão_sistêmica_geral_de_caixa_branca}

Aqui você descreve a decomposição geral do sistema usando o seguinte
modelo de caixa branca. Ele contém

-   um diagrama de visão geral

-   uma motivação para a decomposição

-   descrições de caixa preta dos blocos de construção contidos. Para
    isso, oferecemos alternativas:

    -   use *uma* tabela para uma visão geral curta e pragmática de
        todos os blocos de construção contidos e suas interfaces

    -   use uma lista de descrições de caixa preta dos blocos de
        construção de acordo com o modelo de caixa preta (veja abaixo).
        Dependendo da sua escolha de ferramenta, esta lista pode ser
        subcapítulos (em arquivos de texto), subpáginas (em uma Wiki) ou
        elementos aninhados (em uma ferramenta de modelagem).

-   (opcional:) interfaces importantes, que não são explicadas nos
    modelos de caixa preta de um bloco de construção, mas são muito
    importantes para entender a caixa branca. Já que há tantas maneiras
    de especificar interfaces, por que não fornecer um modelo específico
    para elas? No pior caso, você tem que especificar e descrever
    sintaxe, semântica, protocolos, tratamento de erros, restrições,
    versões, qualidades, compatibilidades necessárias e muito mais. Na
    melhor das hipóteses, você conseguirá usar exemplos ou descrições
    simples.

***\<Diagrama de Visão Geral\>***

Motivação

:   *\<explicação textual\>*

Blocos de Construção Contidos

:   *\<Descrição dos blocos de construção contidos (caixas pretas)\>*

Interfaces Importantes

:   *\<Descrição de interfaces importantes\>*

Insira suas explicações de caixas pretas do nível 1:

Se você usar a forma tabular, você descreverá apenas suas caixas pretas
com nome e responsabilidade de acordo com o seguinte esquema:

+----------------------+-----------------------------------------------+
| **Nome**             | **Responsabilidade**                          |
+======================+===============================================+
| *\<caixa preta 1\>*  | *\<Texto\>*                                   |
+----------------------+-----------------------------------------------+
| *\<caixa preta 2\>*  | *\<Texto\>*                                   |
+----------------------+-----------------------------------------------+

Se você usar uma lista de descrições de caixa preta, então você preenche
um modelo de caixa preta separado para cada bloco de construção
importante. Seu título é o nome da caixa preta.

### \<Nome Caixa Preta 1\> {#_nome_caixa_preta_1}

Aqui você descreve \<caixa preta 1\> de acordo com o seguinte modelo de
caixa preta:

-   Propósito/Responsabilidade

-   Interface(s), quando não são extraídas como parágrafos separados.
    Essas interfaces podem incluir qualidades e características de
    desempenho.

-   (Opcional) Características de qualidade/desempenho da caixa preta,
    por exemplo, disponibilidade, comportamento de tempo de execução,
    ...​.

-   (Opcional) Local do diretório/arquivo

-   (Opcional) Requisitos atendidos (se você precisar de rastreabilidade
    para requisitos).

-   (Opcional) Problemas/questões/riscos abertos

*\<Propósito/Responsabilidade\>*

*\<Interface(s)\>*

*\<(Opcional) Características de Qualidade/Desempenho\>*

*\<(Opcional) Local do Diretório/Arquivo\>*

*\<(Opcional) Requisitos Cumpridos\>*

*\<(opcional) Problemas/Riscos Abertos\>*

### \<Nome Caixa Preta 2\> {#_nome_caixa_preta_2}

*\<modelo de caixa preta\>*

### \<Nome Caixa Preta n\> {#_nome_caixa_preta_n}

*\<modelo de caixa preta\>*

### \<Nome Interface 1\> {#_nome_interface_1}

...​

### \<Nome Interface m\> {#_nome_interface_m}

## Nível 2 {#_nível_2}

Aqui você pode especificar a estrutura interna de (alguns) blocos de
construção do nível 1 como caixas brancas.

Você tem que decidir quais blocos de construção do seu sistema são
importantes o suficiente para justificar uma descrição tão detalhada.
Por favor, prefira relevância à completude. Especifique blocos de
construção importantes, surpreendentes, arriscados, complexos ou
voláteis. Deixe de fora partes normais, simples, chatas ou padronizadas
do seu sistema

### Caixa Branca *\<Bloco de Construção 1\>* {#_caixa_branca_bloco_de_construção_1}

...​descreve a estrutura interna do *bloco de construção 1*.

*\<modelo de caixa branca\>*

### Caixa Branca *\<Bloco de Construção 2\>* {#_caixa_branca_bloco_de_construção_2}

*\<modelo de caixa branca\>*

...​

### Caixa Branca *\<Bloco de Construção m\>* {#_caixa_branca_bloco_de_construção_m}

*\<modelo de caixa branca\>*

## Nível 3 {#_nível_3}

Aqui você pode especificar a estrutura interna de (alguns) blocos de
construção do nível 2 como caixas brancas.

Quando precisar de níveis mais detalhados de sua arquitetura, copie esta
parte do arc42 para níveis adicionais.

### Caixa Branca \<\_Bloco de Construção x.1\_\> {#_caixa_branca_bloco_de_construção_x_1}

Especifica a estrutura interna do *bloco de construção x.1*.

*\<modelo de caixa branca\>*

### Caixa Branca \<\_Bloco de Construção x.2\_\> {#_caixa_branca_bloco_de_construção_x_2}

*\<modelo de caixa branca\>*

### Caixa Branca \<\_Bloco de Construção y.1\_\> {#_caixa_branca_bloco_de_construção_y_1}

*\<modelo de caixa branca\>*

# Visão de Tempo de Execução {#section-runtime-view}

::: formalpara-title
**Conteúdo**
:::

A visão de tempo de execução descreve o comportamento concreto e as
interações dos blocos de construção do sistema na forma de cenários das
seguintes áreas:

-   casos de uso ou recursos importantes: como os blocos de construção
    os executam?

-   interações em interfaces externas críticas: como os blocos de
    construção cooperam com os usuários e sistemas vizinhos?

-   operação e administração: lançamento, inicialização, parada

-   cenários de erro e exceção

Observação: O principal critério para a escolha de cenários possíveis
(sequências, fluxos de trabalho) é sua **relevância arquitetural**.
**Não** é importante descrever um grande número de cenários. Você deve
documentar uma seleção representativa.

::: formalpara-title
**Motivação**
:::

Você deve entender como (instâncias de) blocos de construção do seu
sistema realizam seu trabalho e se comunicam em tempo de execução. Você
capturará principalmente cenários em sua documentação para comunicar sua
arquitetura às partes interessadas que estão menos dispostas ou capazes
de ler e entender os modelos estáticos (visão de bloco de construção,
visão de implantação).

::: formalpara-title
**Forma**
:::

Há muitas notações para descrever cenários, por exemplo,

-   lista numerada de etapas (em linguagem natural)

-   diagramas de atividade ou fluxogramas

-   diagramas de sequência

-   BPMN ou EPCs (cadeias de processos de eventos)

-   máquinas de estado

-   ...​

::: formalpara-title
**Mais informações**
:::

Consulte [Runtime View](https://docs.arc42.org/section-6/) na
documentação do arc42.

## \<Cenário de Tempo de Execução 1\> {#_cenário_de_tempo_de_execução_1}

-   *\<inserir diagrama de tempo de execução ou descrição textual do
    cenário\>*

-   *\<inserir descrição dos aspectos notáveis ​​das interações entre as
    instâncias do bloco de construção descritas neste diagrama.\>*

## \<Cenário de Tempo de Execução 2\> {#_cenário_de_tempo_de_execução_2}

## ...​

## \<Cenário de Tempo de Execução n\> {#_cenário_de_tempo_de_execução_n}

# Visão de Implantação {#section-deployment-view}

::: formalpara-title
**Conteúdo**
:::

A visão de implantação descreve:

1.  infraestrutura técnica usada para executar seu sistema, com
    elementos de infraestrutura como localizações geográficas,
    ambientes, computadores, processadores, canais e topologias de rede,
    bem como outros elementos de infraestrutura e

2.  mapeamento de blocos de construção (de software) para esses
    elementos de infraestrutura.

Frequentemente, os sistemas são executados em ambientes diferentes, por
exemplo, ambiente de desenvolvimento, ambiente de teste, ambiente de
produção. Nesses casos, você deve documentar todos os ambientes
relevantes.

Documente especialmente uma visão de implantação se seu software for
executado como um sistema distribuído com mais de um computador,
processador, servidor ou contêiner ou quando você projeta e constrói
seus próprios processadores e chips de hardware.

De uma perspectiva de software, é suficiente capturar apenas os
elementos de uma infraestrutura que são necessários para mostrar uma
implantação de seus blocos de construção. Arquitetos de hardware podem
ir além disso e descrever uma infraestrutura em qualquer nível de
detalhe que precisem capturar.

::: formalpara-title
**Motivação**
:::

O software não roda sem hardware. Essa infraestrutura subjacente pode e
influenciará um sistema e/ou alguns conceitos transversais. Portanto, é
necessário conhecer a infraestrutura.

::: formalpara-title
**Forma**
:::

Talvez um diagrama de implantação de nível mais alto já esteja contido
na seção 3.2. como contexto técnico com sua própria infraestrutura como
UMA caixa preta. Nesta seção, pode-se ampliar esta caixa preta usando
diagramas de implantação adicionais:

-   UML oferece diagramas de implantação para expressar essa visão.
    Use-o, provavelmente com diagramas aninhados, quando sua
    infraestrutura for mais complexa.

-   Quando suas partes interessadas (de hardware) preferirem outros
    tipos de diagramas em vez de um diagrama de implantação, deixe-os
    usar qualquer tipo que seja capaz de mostrar nós e canais da
    infraestrutura.

::: formalpara-title
**Mais informações**
:::

Consulte [Deployment View](https://docs.arc42.org/section-7/) na
documentação do arc42.

## Nível de Infraestrutura 1 {#_nível_de_infraestrutura_1}

Descreva (geralmente em uma combinação de diagramas, tabelas e texto):

-   distribuição de um sistema para vários locais, ambientes,
    computadores, processadores, .., bem como conexões físicas entre
    eles

-   justificativas ou motivações importantes para esta estrutura de
    implantação

-   recursos de qualidade e/ou desempenho desta infraestrutura

-   mapeamento de artefatos de software para elementos desta
    infraestrutura

Para vários ambientes ou implantações alternativas, copie e adapte esta
seção do arc42 para todos os ambientes relevantes.

***\<Diagrama de Visão Geral\>***

Motivação

:   *\<explicação em forma de texto\>*

Características de Qualidade e/ou Desempenho

:   *\<explicação em forma de texto\>*

Mapeamento de Blocos de Construção para Infraestrutura

:   *\<descrição do mapeamento\>*

## Nível de Infraestrutura 2 {#_nível_de_infraestrutura_2}

Aqui você pode incluir a estrutura interna de (alguns) elementos de
infraestrutura do nível 1.

Copie a estrutura do nível 1 para cada elemento selecionado.

### *\<Elemento de Infraestrutura 1\>* {#_elemento_de_infraestrutura_1}

*\<diagrama + explicação\>*

### *\<Elemento de Infraestrutura 2\>* {#_elemento_de_infraestrutura_2}

*\<diagrama + explicação\>*

...​

### *\<Elemento de Infraestrutura n\>* {#_elemento_de_infraestrutura_n}

*\<diagrama + explicação\>*

# Conceitos Transversais {#section-concepts}

::: formalpara-title
**Conteúdo**
:::

Esta seção descreve globalmente, as principais regulamentações e ideias
de soluções que são relevantes em várias partes (= transversais) do seu
sistema. Esses conceitos geralmente estão relacionados a vários blocos
de construção. Eles podem incluir muitos tópicos diferentes, como

-   modelos, especialmente modelos de domínio

-   padrões de arquitetura ou *design patterns*

-   regras para usar tecnologia específica

-   principais decisões, geralmente técnicas, de natureza abrangente (=
    transversais)

-   regras de implementação

::: formalpara-title
**Motivação**
:::

Os conceitos formam a base para a *integridade conceitual*
(consistência, homogeneidade) da arquitetura. Portanto, eles são uma
contribuição importante para atingir as qualidades internas do seu
sistema.

Alguns desses conceitos não podem ser atribuídos a blocos de construção
individuais, por exemplo segurança ou proteção.

::: formalpara-title
**Forma**
:::

A forma pode ser variada:

-   documentos conceituais com qualquer tipo de estrutura

-   trechos ou cenários de modelos transversais usando notações das
    visualizações de arquitetura

-   amostra de implementações, especialmente para conceitos técnicos

-   referência ao uso típico de *frameworks* padrão (por exemplo, usando
    Hibernate para mapeamento de objeto/relacional)

::: formalpara-title
**Estrutura**
:::

Uma estrutura potencial (mas não obrigatória) para esta seção poderia
ser:

-   Conceitos de domínio

-   Conceitos de Experiência do Usuário (UX)

-   Conceitos de proteção e segurança

-   Padrões de arquitetura e *design patterns*

-   Estruturas internas

-   Conceitos de desenvolvimento

-   Conceitos operacionais

Observação: pode ser difícil atribuir conceitos individuais a um tópico
específico nesta lista.

![Tópicos possíveis para conceitos
transversais](images/08-concepts-EN.drawio.png)

::: formalpara-title
**Mais informações**
:::

Veja [Concepts](https://docs.arc42.org/section-8/) na documentação do
arc42.

## *\<Conceito 1\>* {#_conceito_1}

*\<explicação\>*

## *\<Conceito 2\>* {#_conceito_2}

*\<explicação\>*

...​

## *\<Conceito n\>* {#_conceito_n}

*\<explicação\>*

# Decisões Arquiteturais {#section-design-decisions}

::: formalpara-title
**Conteúdo**
:::

Decisões arquiteturais importantes, caras, de grande escala ou
arriscadas, incluindo justificativas. Com \"decisões\", queremos dizer
selecionar uma alternativa com base em critérios fornecidos.

Use seu julgamento para decidir se uma decisão de arquitetura deve ser
documentada aqui nesta seção central ou se é melhor documentá-la
localmente (por exemplo, dentro do modelo de caixa branca de um bloco de
construção).

Evite redundância. Consulte a seção 4, onde você já capturou as decisões
mais importantes da sua arquitetura.

::: formalpara-title
**Motivação**
:::

As partes interessadas do seu sistema devem ser capazes de compreender e
refazer suas decisões.

::: formalpara-title
**Forma**
:::

Várias opções:

-   ADR (Architecture Decision Record) ([Documentando Decisões de
    Arquitetura](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions))
    para cada decisão importante

-   Lista ou tabela, ordenada por importância e consequências ou:

-   mais detalhada em forma de seções separadas por decisão

::: formalpara-title
**Mais informações**
:::

Veja [Architecture Decisions](https://docs.arc42.org/section-9/) na
documentação do arc42. Lá você encontrará links e exemplos sobre ADR.

# Requisitos de qualidade {#section-quality-scenarios}

::: formalpara-title
**Conteúdo**
:::

Esta seção contém todos os requisitos de qualidade como árvore de
qualidade com cenários. Os mais importantes já foram descritos na seção
1.2. (objetivos de qualidade)

Aqui você também pode capturar requisitos de qualidade com menor
prioridade, que não criarão altos riscos quando não forem totalmente
alcançados.

::: formalpara-title
**Motivação**
:::

Como os requisitos de qualidade terão muita influência nas decisões
arquiteturais, você deve saber para cada parte interessada o que é
realmente importante para eles, concreto e mensurável.

::: formalpara-title
**Mais informações**
:::

Veja [Quality Requirements](https://docs.arc42.org/section-10/) na
documentação do arc42.

## Árvore de qualidade {#_árvore_de_qualidade}

::: formalpara-title
**Conteúdo**
:::

A árvore de qualidade (conforme definido no ATAM -- Architecture
Tradeoff Analysis Method) com cenários de qualidade/avaliação como
folhas.

::: formalpara-title
**Motivação**
:::

A estrutura de árvore com prioridades fornece uma visão geral para um
número às vezes grande de requisitos de qualidade.

::: formalpara-title
**Forma**
:::

A árvore de qualidade é uma visão geral de alto nível das metas e
requisitos de qualidade:

-   refinamento em forma de árvore do termo \"qualidade\". Use
    \"qualidade\" ou \"utilidade\" como raiz

-   um mapa mental com categorias de qualidade como ramos principais

Em qualquer caso, a árvore deve incluir links para os cenários da seção
a seguir.

## Cenários de Qualidade {#_cenários_de_qualidade}

::: formalpara-title
**Conteúdo**
:::

Concretização de requisitos de qualidade (às vezes vagos ou implícitos)
usando cenários (de qualidade).

Esses cenários descrevem o que deve acontecer quando um estímulo chega
ao sistema.

Para arquitetos, dois tipos de cenários são importantes:

-   Cenários de uso (também chamados de cenários de aplicação ou
    cenários de caso de uso) descrevem a reação do tempo de execução do
    sistema a um determinado estímulo. Isso também inclui cenários que
    descrevem a eficiência ou o desempenho do sistema. Exemplo: O
    sistema reage à solicitação de um usuário em um segundo.

-   Cenários de mudança descrevem uma modificação do sistema ou de seu
    ambiente imediato. Exemplo: Funcionalidade adicional é implementada
    ou requisitos para um atributo de qualidade mudam.

::: formalpara-title
**Motivação**
:::

Os cenários tornam os requisitos de qualidade concretos e permitem medir
ou decidir mais facilmente se eles são atendidos.

Especialmente quando você quer avaliar sua arquitetura usando métodos
como ATAM você precisa descrever suas metas de qualidade (da seção 1.2)
mais precisamente até um nível de cenários que podem ser discutidos e
avaliados.

::: formalpara-title
**Form**
:::

Tabular ou texto livre.

# Riscos e Débitos Técnicos {#section-technical-risks}

::: formalpara-title
**Conteúdo**
:::

Uma lista de riscos técnicos identificados ou débitos técnicos,
ordenadas por prioridade

::: formalpara-title
**Motivação**
:::

"Gerenciamento de riscos é gerenciamento de projetos para adultos" (Tim
Lister, Atlantic Systems Guild.)

Este deve ser seu lema para detecção e avaliação sistemáticas de riscos
e débitos técnicos na arquitetura, que serão necessárias para as partes
interessadas da gerência (por exemplo, gerentes de projeto,
proprietários de produtos) como parte da análise geral de riscos e
planejamento de medição.

::: formalpara-title
**Forma**
:::

Lista de riscos e/ou débitos técnicos, provavelmente incluindo medidas
sugeridas para minimizar, mitigar ou evitar riscos ou reduzir débitos
técnicos.

::: formalpara-title
**Mais informações**
:::

Veja [Risks and Technical Debt](https://docs.arc42.org/section-11/) na
documentação do arc42.

# Glossário {#section-glossary}

::: formalpara-title
**Conteúdo**
:::

Os termos técnicos e de domínio mais importantes que suas partes
interessadas usam ao discutir o sistema.

Você também pode ver o glossário como fonte para traduções se trabalhar
em equipes multilíngues.

::: formalpara-title
**Motivação**
:::

Você deve definir claramente seus termos, para que todas as partes
interessadas

-   tenham um entendimento idêntico desses termos

-   não usem sinônimos e homônimos

::: formalpara-title
**Forma**
:::

Uma tabela com colunas \<Termo\> e \<Definição\>.

Possivelmente mais colunas, caso precise de traduções.

::: formalpara-title
**Mais informações**
:::

Veja [Glossary](https://docs.arc42.org/section-12/) na documentação do
arc42.

+----------------------+-----------------------------------------------+
| Termo                | Definição                                     |
+======================+===============================================+
| *\<Termo-1\>*        | *\<definição-1\>*                             |
+----------------------+-----------------------------------------------+
| *\<Termo-2\>*        | *\<definição-2\>*                             |
+----------------------+-----------------------------------------------+
