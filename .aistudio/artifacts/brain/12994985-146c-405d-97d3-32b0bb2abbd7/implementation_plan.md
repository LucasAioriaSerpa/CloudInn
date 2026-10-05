# Plano de Conclusão da Arquitetura arc42 do CloudInn

Plano detalhado para consolidar e completar integralmente as 12 seções da especificação arquitetural no padrão arc42 (v8.2-PT) em `/doc/arc42-arquitetura-sistemica-cloudInn.md`, alinhando os diagramas C4 e as especificações técnicas à arquitetura real do sistema (React, Azure Functions serverless e MongoDB).

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas pelo usuário na etapa de esclarecimento:
> - **Stack Tecnológica Consolidada**: Arquitetura em produção baseada em Micro-frontend React (Vite / Tailwind / Motion), Azure Functions Serverless (Node.js) e MongoDB Azure (NoSQL).
> - **Arquivo Alvo**: Atualização e expansão direta do documento `/doc/arc42-arquitetura-sistemica-cloudInn.md`.
> - **Abrangência de Seções**: Cobertura completa de todas as seções do arc42, estendendo-se das seções 1 a 11 com a inclusão formal da Seção 12 (Glossário).

---

### 1. Overview & Core Concept

- **O que entrega**: Um documento arquitetural de padrão internacional (arc42) 100% completo, rastreável e fidedigno ao código-fonte, cobrindo os requisitos funcionais RF01 a RF11 (gestão de hóspedes, reservas, check-in, check-out e governança de quartos), contratos OpenAPI 3.0.4 (`swagger.yaml`) e operações serverless (`fc_gp_cloudInn_insert`).
- **Público-Alvo**: Arquitetos de software, engenheiros de backend e frontend, avaliadores acadêmicos, gestores do hotel e integradores de canais de reserva externos (OTAs).
- **Valor Agregado**: Eliminação de discrepâncias conceituais legadas (como PHP/SQL que constavam como rascunho anterior), fornecendo uma fonte única da verdade que documenta com precisão o design de componentes, modelo NoSQL, esteira serverless e atributos de qualidade.

---

### 2. Estrutura do Documento e Diagramação Técnica

O documento `/doc/arc42-arquitetura-sistemica-cloudInn.md` será reestruturado para manter o cabeçalho original da equipe (Grupo 10) e desenvolver detalhadamente cada uma das 12 seções arc42 com diagramas Mermaid nativos:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA ARC42 CLOUDINN                      │
├────────────────────────────────────────────────────────────────────────┤
│  1. Introdução e Objetivos (RF01-RF11, Metas ISO 25010, Stakeholders)  │
│  2. Restrições Arquiteturais (Serverless Node, MongoDB, HTTPS, API)    │
│  3. Contexto e Escopo (Diagrama C4 Context Nível 1 & Interfaces)       │
│  4. Estratégia de Solução (Padrões, Tecnologias e Separação de Camadas)│
│  5. Visão de Blocos de Construção (C4 Container N2, Componentes N3)   │
│  6. Visão de Tempo de Execução (Diagramas de Sequência dos Casos de Uso)│
│  7. Visão de Implantação (Diagrama de Nós de Nuvem Azure & MongoDB)    │
│  8. Conceitos Transversais (Segurança, Transações, Resiliência, Logs)  │
│  9. Decisões Arquiteturais - ADRs (Serverless, NoSQL, SPA React)       │
│ 10. Requisitos de Qualidade (Matriz de Cenários e Métricas Mensuráveis)│
│ 11. Riscos e Dívidas Técnicas (Matriz de Probabilidade x Impacto)      │
│ 12. Glossário (Termos de Hotelaria, Protocolos e Entidades do Domínio) │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Principais Decisões e Conteúdo por Seção

#### Seção 1: Introdução e Objetivos
- Requisitos funcionais essenciais consolidados (RF01 a RF11) contemplando o ciclo completo da hospedagem.
- Objetivos de qualidade de primeira ordem conforme a ISO 25010 (Confiabilidade na recepção de payloads, Desempenho sub-segundo nas operações e Segurança de dados sensíveis).
- Matriz de partes interessadas com expectativas detalhadas para Hóspedes, Staff da Recepção, Equipe de Governança, Administradores e Sistemas Parceiros.

#### Seção 2: Restrições Arquiteturais
- Restrições técnicas: Azure Functions (Node.js runtime serverless), MongoDB Cosmos/Atlas (driver nativo NoSQL), React SPA.
- Restrições organizacionais: Versionamento Git, padrão de branch, conformidade com OpenAPI 3.0.4.
- Restrições regulatórias: Proteção de dados e conformidade de identificação civil de hóspedes.

#### Seção 3: Contexto e Escopo
- Diagrama C4 Context (Nível 1) atualizado integrando Parceiros OTAs, Hóspedes, Staff do Hotel e o ecossistema CloudInn.
- Tabela de interfaces de entrada e saída (especificando protocolos HTTPS/REST, formatos JSON e mecanismos de autenticação via chave de API).

#### Seção 4: Estratégia de Solução
- Adoção de arquitetura desacoplada e event-driven/serverless para absorver picos de reservas de parceiros externos.
- Persistência desacoplada com modelo flexível NoSQL baseado em coleções (`guests`, `rooms`, `reservas`/`reservations`).
- Interface do usuário responsiva e reativa com estado centralizado e microinterações de alta produtividade.

#### Seção 5: Visão de Blocos de Construção
- C4 Container (Nível 2): Frontend Web App (Azure Static Web Apps), Funções Serverless (Azure Functions HTTP Triggers) e Banco de Dados Gerenciado (MongoDB).
- C4 Component (Nível 3): Funções de inserção de reservas (`fc_gp_cloudInn_insert`), controle de ocupação e quartos, gestão de hóspedes e serviço de persistência.
- Diagrama de classes/documentos das coleções do MongoDB e seus relacionamentos lógicos (referência por identificadores).

#### Seção 6: Visão de Tempo de Execução (Runtime View)
- Cenário 1: Notificação e inserção atômica de reserva via parceiro externo com upsert de hóspede e quarto.
- Cenário 2: Check-in presencial na recepção e transição de estado para Quarto Ocupado.
- Cenário 3: Check-out do hóspede e disparo do fluxo de governança (transição para Quarto Sujo).
- Cenário 4: Ciclo de governança (Quarto Sujo -> Em Limpeza -> Disponível/Limpo).

#### Seção 7: Visão de Implantação (Deployment View)
- Diagrama C4 Deployment detalhando a infraestrutura física/em nuvem (Azure Cloud, Resource Groups, Azure Static Web Apps, Azure Function App, MongoDB Cloud Atlas/Cosmos DB).
- Configurações de ambiente, mapeamento de connection strings seguras e variáveis (`MONGO_URI`, `PORT`, `API_KEY`).

#### Seção 8: Conceitos Transversais
- Modelo de domínio e esquema NoSQL (com exemplos de documentos JSON para cada coleção).
- Estratégia de consistência e idempotência (uso de upsert baseado em CPF/documento e número de quarto).
- Segurança: autenticação de endpoints com `api_key` no header, higienização de payloads e mascaramento de connection strings nos logs.
- Tratamento uniforme de exceções e mapeamento de status codes HTTP (200, 201, 400, 404, 500).

#### Seção 9: Decisões Arquiteturais (ADRs)
- **ADR-01**: Migração de Arquitetura Monolítica (PHP/Laravel/SQL) para Serverless Distribuído (Azure Functions + MongoDB).
- **ADR-02**: Adoção de React + Vite com Tailwind e Motion para o Micro-frontend operacional.
- **ADR-03**: Padronização de Contratos de API via especificação formal OpenAPI 3.0.4 (Swagger).
- **ADR-04**: Estratégia de Upsert idempotente no processamento de reservas de parceiros.

#### Seção 10: Requisitos de Qualidade (Quality Scenarios)
- Árvore de qualidade categorizada segundo a ISO/IEC 25010.
- Cenários concretos detalhados no formato: Fonte do Estímulo, Estímulo, Artefato Afetado, Resposta e Medida da Resposta.

#### Seção 11: Riscos e Dívidas Técnicas
- Mapeamento de riscos técnicos e de negócio (ex.: indisponibilidade do banco, concorrência de reservas para o mesmo quarto, dependência de conexão de internet no balcão).
- Identificação de dívidas técnicas e planos de mitigação recomendados para iterações futuras.

#### Seção 12: Glossário
- Tabela com termos técnicos, operacionais e de hotelaria (PMS, OTA, Check-in, Check-out, STD/LUX/STE, Upsert, Idempotência, Serverless Trigger, etc.).

---

### 4. Critérios de Validação e Verificação

1. **Rastreabilidade**: Garantir correspondência 1:1 entre os requisitos funcionais RF01 a RF11 e os componentes/endpoints implementados.
2. **Sintaxe Mermaid**: Todos os blocos de diagramas Mermaid (C4Context, C4Container, C4Component, sequenceDiagram, erDiagram) validados e compatíveis com renderizadores markdown modernos.
3. **Integridade de Documento**: Nenhum placeholder ou texto inacabado; cada seção desenvolvida em profundidade e com rigor técnico.
