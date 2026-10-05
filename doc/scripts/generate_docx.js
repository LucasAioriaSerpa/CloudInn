const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType
} = require('docx');

// Cores corporativas
const COLOR_PRIMARY = '1E3A8A'; // Azul corporativo escuro
const COLOR_SECONDARY = '2563EB'; // Azul intermediário
const COLOR_TEXT = '1F2937'; // Cinza escuro para texto padrão
const COLOR_MUTED = '4B5563'; // Cinza médio
const COLOR_BG_HEADER = 'F1F5F9'; // Fundo do cabeçalho da tabela
const COLOR_BORDER = 'CBD5E1'; // Borda suave para tabelas
const COLOR_PLACEHOLDER_BG = 'F8FAFC'; // Fundo suave do placeholder de imagem

function p(text = '', options = {}) {
  const {
    bold = false,
    italic = false,
    size = 22, // 11pt
    color = COLOR_TEXT,
    align = AlignmentType.LEFT,
    spaceBefore = 100,
    spaceAfter = 100,
    bullet = false
  } = options;

  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, bold, italic, size, color, font: 'Calibri' })];

  const pConfig = {
    children: runs,
    alignment: align,
    spacing: { before: spaceBefore, after: spaceAfter }
  };

  if (bullet) {
    pConfig.bullet = { level: 0 };
  }

  return new Paragraph(pConfig);
}

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    keepWithNext: true,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32, // 16pt
        color: COLOR_PRIMARY,
        font: 'Calibri'
      })
    ]
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    keepWithNext: true,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
        color: COLOR_SECONDARY,
        font: 'Calibri'
      })
    ]
  });
}

function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    keepWithNext: true,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24, // 12pt
        color: COLOR_MUTED,
        font: 'Calibri'
      })
    ]
  });
}

function createTable(headers, rows, colWidths = []) {
  const tableRows = [];

  // Cabeçalho
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((header, idx) => {
        return new TableCell({
          width: colWidths[idx] ? { size: colWidths[idx], type: WidthType.DXA } : undefined,
          shading: { type: ShadingType.CLEAR, fill: COLOR_BG_HEADER },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                  size: 20, // 10pt
                  color: COLOR_PRIMARY,
                  font: 'Calibri'
                })
              ]
            })
          ]
        });
      })
    })
  );

  // Linhas de dados
  rows.forEach((row, rIdx) => {
    tableRows.push(
      new TableRow({
        children: row.map((cellText, idx) => {
          return new TableCell({
            width: colWidths[idx] ? { size: colWidths[idx], type: WidthType.DXA } : undefined,
            shading: rIdx % 2 === 1 ? { type: ShadingType.CLEAR, fill: 'FAFAFA' } : undefined,
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: cellText,
                    size: 20, // 10pt
                    color: COLOR_TEXT,
                    font: 'Calibri'
                  })
                ]
              })
            ]
          });
        })
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
    }
  });
}

function createDiagramPlaceholder(diagramTitle, subtitle = '') {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.DASHED, size: 8, color: COLOR_SECONDARY },
      bottom: { style: BorderStyle.DASHED, size: 8, color: COLOR_SECONDARY },
      left: { style: BorderStyle.DASHED, size: 8, color: COLOR_SECONDARY },
      right: { style: BorderStyle.DASHED, size: 8, color: COLOR_SECONDARY }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: COLOR_PLACEHOLDER_BG },
            margins: { top: 320, bottom: 320, left: 240, right: 240 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: `[ ESPAÇO RESERVADO PARA IMAGEM DO DIAGRAMA ]`,
                    bold: true,
                    size: 22,
                    color: COLOR_SECONDARY,
                    font: 'Calibri'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: diagramTitle,
                    bold: true,
                    size: 24,
                    color: COLOR_PRIMARY,
                    font: 'Calibri'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: subtitle || 'Clique ou cole a imagem do diagrama renderizado nesta área do documento.',
                    italic: true,
                    size: 18,
                    color: COLOR_MUTED,
                    font: 'Calibri'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function buildArc42Doc() {
  const sections = [];

  // Cabeçalho Principal
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'CloudInn — Arquitetura de Sistema (arc42)',
          bold: true,
          size: 44, // 22pt
          color: COLOR_PRIMARY,
          font: 'Calibri'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'Versão da Arquitetura: ', bold: true, size: 22, color: COLOR_MUTED }),
        new TextRun({ text: '2.0.0  |  ', size: 22, color: COLOR_MUTED }),
        new TextRun({ text: 'Data: ', bold: true, size: 22, color: COLOR_MUTED }),
        new TextRun({ text: 'Outubro de 2026  |  ', size: 22, color: COLOR_MUTED }),
        new TextRun({ text: 'Template: ', bold: true, size: 22, color: COLOR_MUTED }),
        new TextRun({ text: 'arc42 v8.2-PT  |  ', size: 22, color: COLOR_MUTED }),
        new TextRun({ text: 'Grupo: ', bold: true, size: 22, color: COLOR_MUTED }),
        new TextRun({ text: '10', size: 22, color: COLOR_MUTED })
      ]
    }),
    h2('Equipe de Alunos')
  );

  sections.push(
    createTable(
      ['Integrantes', 'Papel na Arquitetura'],
      [
        ['Alyson Ferreira de Souza', 'Integrações Serverless, Pipeline de Dados e Persistência'],
        ['Flavia Cristina Fagundes', 'Requisitos, Modelagem de Domínio e Contratos OpenAPI'],
        ['Lucas Aioria Serpa', 'Micro-frontend React, Motion Design e UX Operacional'],
        ['Matheus Pereira Siqueira', 'Infraestrutura em Nuvem, Resiliência e Segurança']
      ],
      [3600, 5400]
    )
  );

  sections.push(
    h2('Descrição do Sistema'),
    p(
      'O CloudInn é um sistema corporativo de gestão hoteleira (Property Management System - PMS) concebido para automatizar o ciclo operacional de hospedagem de ponta a ponta. A plataforma é responsável por receber, validar e processar notificações de reservas transmitidas por canais parceiros e agências de turismo online (OTAs — Online Travel Agencies), além de fornecer à equipe de recepção e governança uma interface reativa de alta produtividade.'
    ),
    p(
      'O sistema controla o ciclo de vida completo dos hóspedes, a alocação e precificação de quartos, e a esteira de estados operacionais dos aposentos (disponível, reservado, ocupado, sujo e em limpeza), garantindo sincronização em tempo real entre a recepção e a equipe de governança predial.'
    )
  );

  // 1. Introdução e Objetivos
  sections.push(
    h1('1. Introdução e Objetivos'),
    p(
      'Esta seção estabelece as forças motrizes, os requisitos essenciais de negócio, as metas de qualidade prioritárias e os atores envolvidos na operação do CloudInn.'
    ),
    h2('1.1 Visão Geral dos Requisitos (Requisitos Funcionais)'),
    p('Abaixo estão listados os requisitos funcionais essenciais mapeados para o funcionamento do CloudInn:'),
    createTable(
      ['ID', 'Requisito Funcional', 'Descrição Detalhada e Comportamento Esperado'],
      [
        [
          'RF01',
          'Recebimento de Notificações de Reservas',
          'O sistema deve expor endpoints RESTful seguros para receber e autenticar notificações de reservas emitidas por canais e parceiros externos em formato JSON padronizado.'
        ],
        [
          'RF02',
          'Cadastro e Atualização de Hóspedes',
          'O sistema deve registrar ou atualizar os dados cadastrais dos hóspedes (nome, documento/CPF, e-mail, telefone) de forma idempotente com base em chave única de identificação civil.'
        ],
        [
          'RF03',
          'Registro e Controle de Reservas',
          'O sistema deve criar e gerenciar o ciclo de vida das reservas com status auditáveis (pending, confirmed, active, completed, cancelled).'
        ],
        [
          'RF04',
          'Registro de Datas de Check-in e Check-out',
          'O sistema deve armazenar as datas e horários estipulados de entrada e saída, impedindo reservas com inconsistência temporal (ex.: check-out anterior ou coincidente ao check-in).'
        ],
        [
          'RF05',
          'Alocação de Quarto à Reserva',
          'O sistema deve vincular um quarto físico específico à reserva, validando sua compatibilidade com a tipologia solicitada (STD, LUX, STE) e sua disponibilidade no período.'
        ],
        [
          'RF06',
          'Atualização de Status dos Quartos',
          'O sistema deve permitir a alteração e propagação imediata do status de cada quarto, refletindo instantaneamente as transições operacionais no painel da recepção.'
        ],
        [
          'RF07',
          'Registro de Check-in do Hóspede',
          'O sistema deve registrar formalmente a entrada do hóspede no hotel, associando-o ao quarto alocado e alterando o estado do aposento para ocupado (occupied).'
        ],
        [
          'RF08',
          'Registro de Check-out do Hóspede',
          'O sistema deve registrar a saída do hóspede, finalizar a reserva como concluída (completed) e acionar automaticamente a rotina de higienização.'
        ],
        [
          'RF09',
          'Transição Automática para Quarto Sujo',
          'Imediatamente após a finalização do check-out, o sistema deve marcar o quarto como sujo (dirty), bloqueando novas alocações imediatas.'
        ],
        [
          'RF10',
          'Registro de Início de Limpeza',
          'A equipe de governança deve poder sinalizar quando o quarto estiver em processo de higienização, transitando o status para em limpeza (cleaning).'
        ],
        [
          'RF11',
          'Disponibilização do Quarto Pós-Higienização',
          'Após a conclusão e vistoria da limpeza, o quarto deve ser retornado ao status de disponível (available), ficando apto a receber novos hóspedes.'
        ]
      ],
      [1000, 2600, 5400]
    ),
    h2('1.2 Objetivos de Qualidade'),
    p(
      'Os três principais objetivos de qualidade para a arquitetura, priorizados de acordo com a norma internacional ISO/IEC 25010:'
    ),
    createTable(
      ['Prioridade', 'Característica de Qualidade', 'Objetivo Arquitetural', 'Cenário Concreto'],
      [
        [
          '1',
          'Confiabilidade & Integridade',
          'Garantir que 100% dos payloads válidos de reservas externas sejam persistidos sem perdas ou duplicidades.',
          'Em picos de tráfego de parceiros externos, a função de ingestão processa payloads com estratégia de upsert atômico, garantindo idempotência e integridade referencial.'
        ],
        [
          '2',
          'Desempenho & Eficiência',
          'Proporcionar tempos de resposta sub-segundo em todas as rotinas interativas da recepção.',
          'O carregamento da grade de ocupação e a alteração de status de quartos no frontend reativo devem responder em tempo inferior a 400ms em condições normais de rede.'
        ],
        [
          '3',
          'Segurança & Conformidade',
          'Proteger dados pessoais e de contato dos hóspedes contra acessos não autorizados.',
          'Todas as requisições à API exigem tráfego sob TLS/HTTPS e validação de api_key corporativa no cabeçalho HTTP; credenciais de banco de dados são mascaradas em logs.'
        ],
        [
          '4',
          'Usabilidade & Produtividade',
          'Reduzir o tempo operacional do atendente na recepção durante o check-in e check-out.',
          'A interface web adota transições fluidas com motion design, busca preditiva e atalhos de ação direta, viabilizando o check-in em menos de 3 cliques.'
        ]
      ],
      [1000, 2400, 2800, 2800]
    ),
    h2('1.3 Partes Interessadas (Stakeholders)'),
    createTable(
      ['Função / Ator', 'Descrição e Papel', 'Expectativas Principais em Relação ao Sistema'],
      [
        [
          'Recepcionistas do Hotel',
          'Usuários operacionais do balcão de atendimento',
          'Interface visual rápida, sem bloqueios de tela, com clareza imediata sobre quais quartos estão prontos para receber hóspedes.'
        ],
        [
          'Equipe de Governança',
          'Camareiras e supervisores prediais',
          'Visão atualizada dos quartos sujos e capacidade de atualizar o status de limpeza em tempo real via dispositivos móveis/tablets.'
        ],
        [
          'Hóspedes',
          'Clientes finais do estabelecimento hoteleiro',
          'Agilidade e pontualidade no check-in, garantia de quarto devidamente higienizado e segurança em relação a seus dados cadastrais.'
        ],
        [
          'Sistemas Parceiros / OTAs',
          'Plataformas terceirizadas (Booking, Airbnb, etc.)',
          'API pública com especificação OpenAPI (Swagger) estável, alta taxa de disponibilidade (99,9%) e retorno estruturado de confirmação HTTP 201.'
        ],
        [
          'Gestores Hoteleiros',
          'Administradores e gerentes gerais',
          'Relatórios de ocupação confiáveis, baixa taxa de cancelamento por inconsistência de dados e ausência de overbooking.'
        ],
        [
          'Equipe de Engenharia',
          'Desenvolvedores e operadores de infraestrutura',
          'Arquitetura modular serverless de baixa manutenção, código desacoplado, esteira com testes automatizados e logs auditáveis.'
        ]
      ],
      [2200, 2600, 4200]
    )
  );

  // 2. Restrições Arquiteturais
  sections.push(
    h1('2. Restrições Arquiteturais'),
    p('Qualquer requisito que restrinja os arquitetos de software em sua liberdade de decisões de design e implementação:'),
    createTable(
      ['Categoria', 'Restrição', 'Justificativa e Impacto Arquitetural'],
      [
        [
          'Tecnológica (Backend)',
          'Serverless com Azure Functions & Node.js',
          'A camada de processamento de regras de negócio e ingestão é desacoplada em microsserviços serverless na nuvem Azure, garantindo escala automática e cobrança por execução.'
        ],
        [
          'Tecnológica (Persistência)',
          'MongoDB (NoSQL Document Store)',
          'Armazenamento de dados baseado em documentos flexíveis no MongoDB (Azure Cosmos DB ou MongoDB Atlas), suportando dados dinâmicos de parceiros e indexação ágil.'
        ],
        [
          'Tecnológica (Frontend)',
          'Single Page Application em React & Vite',
          'Interface desenvolvida em React moderno, estilizada com utilitários Tailwind CSS e enriquecida com microinterações via Motion.'
        ],
        [
          'Contrato e Padronização',
          'Conformidade Estrita com OpenAPI 3.0.4',
          'Todos os endpoints e payloads devem respeitar a especificação formal presente no arquivo /doc/api/swagger.yaml.'
        ],
        [
          'Comunicação e Rede',
          'Protocolo HTTPS Obrigatório',
          'Toda a comunicação entre clientes web, canais externos e funções serverless deve ocorrer exclusivamente através de conexões encriptadas TLS 1.3 / HTTPS.'
        ],
        [
          'Operacional & Deploy',
          'Arquitetura Cloud-Ready',
          'O sistema deve operar sem dependência de estado local (stateless), viabilizando deploys contínuos e migrações ágeis entre ambientes de homologação e produção.'
        ]
      ],
      [2400, 2800, 3800]
    )
  );

  // 3. Contexto e Escopo
  sections.push(
    h1('3. Contexto e Escopo'),
    h2('3.1 Contexto de Negócio'),
    p(
      'O CloudInn opera como a espinha dorsal de governança e controle de hospedagem do hotel, interagindo com hóspedes presenciais, operadores de balcão e governança, e sistemas integradores de reservas (OTAs):'
    ),
    createDiagramPlaceholder(
      'Diagrama de Contexto (Nível 1) - CloudInn C4 Context',
      'Relacionamento entre Hóspede, Recepcionista, Equipe de Governança, Sistemas Parceiros (OTAs) e o Sistema Interno CloudInn.'
    ),
    h2('3.2 Contexto Técnico e Interfaces'),
    createTable(
      ['Interface Externa', 'Protocolo / Transporte', 'Formato de Dados', 'Autenticação / Segurança', 'Papel na Arquitetura'],
      [
        [
          'Ingestão de Reservas',
          'HTTPS / POST',
          'JSON',
          'API Key (api_key no header)',
          'Recebe payloads de parceiros externos disparando a função fc_gp_cloudInn_insert.'
        ],
        [
          'Consumo do Frontend',
          'HTTPS / REST',
          'JSON',
          'Sessão de Staff / Bearer Token',
          'Comunicação entre a SPA React e os microsserviços serverless de quartos, hóspedes e reservas.'
        ],
        [
          'Acesso à Base NoSQL',
          'MongoDB Wire Protocol',
          'BSON',
          'TLS + URI autenticada com credenciais',
          'Conexão gerenciada com connection pool reutilizável entre invocações serverless.'
        ]
      ],
      [1800, 1600, 1200, 2200, 2200]
    )
  );

  // 4. Estratégia de Solução
  sections.push(
    h1('4. Estratégia de Solução'),
    p(
      'A arquitetura do CloudInn adota uma estratégia orientada a serviços serverless e reatividade visual, combinando resiliência para entradas em lote com alta responsividade no balcão de recepção:'
    ),
    p('1. Desacoplamento por Serverless: As operações de inserção de reservas externas utilizam gatilhos HTTP no Azure Functions. Picos de vendas externos são absorvidos dinamicamente pela infraestrutura em nuvem sem onerar a máquina do frontend.', { bullet: true }),
    p('2. Idempotência através de Upsert: O cadastro de hóspedes e quartos utiliza operações de atualização com inserção condicional (upsert: true). Notificações repetidas do mesmo parceiro atualizam cadastros existentes em vez de gerar registros corrompidos ou hóspedes duplicados.', { bullet: true }),
    p('3. Máquina de Estados de Governança Estrita: O status dos quartos respeita um grafo rígido de transições permitidas: Disponível -> Reservado -> Ocupado -> Sujo -> Em Limpeza -> Disponível.', { bullet: true }),
    p('4. Motion Design Produtivo: Microinterações no frontend fornecem feedback imediato através de componentes animados estruturados com a biblioteca Motion, evitando travamentos visuais ou estados indeterminados para os colaboradores.', { bullet: true })
  );

  // 5. Visão de Blocos de Construção
  sections.push(
    h1('5. Visão de Blocos de Construção'),
    p('A visão de blocos de construção decompõe o sistema hierarquicamente em containers e componentes de software.'),
    h2('5.1 Nível 1: Visão Geral de Containers (C4 Container)'),
    createDiagramPlaceholder(
      'Diagrama de Containers (Nível 2) - CloudInn C4 Container',
      'Fronteiras entre Micro-frontend Web App (React), Aplicação Serverless (Azure Functions) e Base de Dados NoSQL (MongoDB).'
    ),
    h2('5.2 Nível 2: Visão de Componentes da API (C4 Component)'),
    createDiagramPlaceholder(
      'Diagrama de Componentes (Nível 3) - Azure Functions API',
      'Funções serverless especializadas: fc_gp_cloudInn_insert, Rooms Handler, Reservations Handler, Guests Handler e Connection Pool.'
    ),
    h2('5.3 Modelo de Dados NoSQL e Entidades de Domínio'),
    createDiagramPlaceholder(
      'Diagrama de Entidade-Relacionamento NoSQL (ER Diagram)',
      'Relacionamento entre as coleções guests (hóspedes), rooms (quartos) e reservas (reservations).'
    ),
    p('Descrição estruturada das coleções no MongoDB:'),
    p('• Coleção guests: Armazena dados cadastrais do hóspede com índice único em "document" (CPF/Passaporte), e-mail, telefone e nome.', { bullet: true }),
    p('• Coleção rooms: Controla o número predial, tipologia (STD, LUX, STE), status operacional atual (available, reserved, occupied, dirty, cleaning) e valor base da diária.', { bullet: true }),
    p('• Coleção reservas: Mantém a vinculação entre guestId e roomId, datas estipuladas de check-in e check-out, status da reserva e valor total.', { bullet: true })
  );

  // 6. Visão de Tempo de Execução
  sections.push(
    h1('6. Visão de Tempo de Execução (Runtime View)'),
    p('Cenários operacionais dinâmicos ilustrando as mensagens trocadas entre os módulos e sistemas:'),
    h2('6.1 Cenário 1: Notificação e Ingestão de Reserva Externa (RF01, RF02, RF03, RF05)'),
    createDiagramPlaceholder(
      'Diagrama de Sequência: Ingestão de Reserva Externa',
      'Fluxo entre Sistema Parceiro (OTA), Azure Function fc_gp_cloudInn_insert e MongoDB com operação de Upsert atômico.'
    ),
    p('Passo a passo operacional:'),
    p('1. A OTA externa dispara uma requisição POST HTTPS para o endpoint de ingestão contendo o payload completo da reserva.', { bullet: true }),
    p('2. A função valida o cabeçalho de autenticação api_key e higieniza a estrutura JSON.', { bullet: true }),
    p('3. Ocorre o upsert na coleção "guests" usando o documento civil do hóspede como chave única.', { bullet: true }),
    p('4. Ocorre o upsert/atualização do quarto para status "reserved" na coleção "rooms".', { bullet: true }),
    p('5. O documento formal da reserva é gravado na coleção "reservas" com status "confirmed" e retorno HTTP 201.', { bullet: true }),

    h2('6.2 Cenário 2: Check-in Presencial no Balcão da Recepção (RF06, RF07)'),
    createDiagramPlaceholder(
      'Diagrama de Sequência: Check-in Presencial no Balcão',
      'Fluxo entre Recepcionista, SPA React, Azure Functions e MongoDB com transição para quarto Ocupado.'
    ),
    p('Passo a passo operacional:'),
    p('1. O hóspede apresenta-se na recepção e o recepcionista localiza a reserva pelo nome ou documento.', { bullet: true }),
    p('2. Ao clicar em "Realizar Check-in", a SPA emite PUT /api/reservas/{id}/checkin.', { bullet: true }),
    p('3. O status da reserva é promovido para "active" e o quarto associado é alterado para "occupied".', { bullet: true }),
    p('4. A interface exibe feedback animado e atualiza a grade visual de quartos instantaneamente.', { bullet: true }),

    h2('6.3 Cenário 3: Check-out e Acionamento de Governança (RF08, RF09, RF10, RF11)'),
    createDiagramPlaceholder(
      'Diagrama de Sequência: Check-out e Ciclo de Governança',
      'Fluxo de saída do hóspede, transição para quarto Sujo, início de higienização e liberação para Disponível.'
    ),
    p('Passo a passo operacional:'),
    p('1. Ao finalizar a estadia, o recepcionista aciona o Check-out na SPA, registrando a data de saída.', { bullet: true }),
    p('2. O quarto transita automaticamente para status "dirty" (Sujo), bloqueando novas alocações.', { bullet: true }),
    p('3. A governança visualiza o quarto em alerta no painel móvel e sinaliza "Iniciar Limpeza" (status: cleaning).', { bullet: true }),
    p('4. Ao término da higienização, a governança clica em "Liberar Quarto", retornando-o a "available" (Disponível).', { bullet: true })
  );

  // 7. Visão de Implantação
  sections.push(
    h1('7. Visão de Implantação (Deployment View)'),
    p(
      'A visão de implantação descreve a infraestrutura em nuvem na Microsoft Azure e nos serviços gerenciados de banco de dados onde os artefatos de software são executados:'
    ),
    createDiagramPlaceholder(
      'Diagrama de Implantação e Infraestrutura em Nuvem (Deployment View)',
      'Mapeamento entre Clientes (Desktop/Mobile/OTAs), Azure Static Web Apps, Azure Function App e Cluster MongoDB.'
    ),
    h2('7.1 Mapeamento de Artefatos em Nós de Infraestrutura'),
    createTable(
      ['Artefato de Software', 'Nó de Execução / Hospedagem', 'Descrição do Ambiente e Dimensionamento'],
      [
        [
          'Frontend Web App',
          'Azure Static Web Apps',
          'Distribuição geográfica em borda (Edge CDN), compressão Gzip/Brotli, cache automático e roteamento SPA.'
        ],
        [
          'Funções da API',
          'Azure Function App (Plano de Consumo)',
          'Dimensionamento automático de 0 a centenas de instâncias concorrentes sob demanda; faturamento estrito por tempo de CPU e execuções.'
        ],
        [
          'Banco de Dados',
          'MongoDB Azure Cosmos DB / Atlas',
          'Instância distribuída com suporte a Replica Set, backup contínuo pontual e armazenamento SSD com IOPS provisionado.'
        ]
      ],
      [2400, 2800, 3800]
    )
  );

  // 8. Conceitos Transversais
  sections.push(
    h1('8. Conceitos Transversais'),
    h2('8.1 Segurança e Proteção de Dados'),
    p('• Autenticação de Parceiros: Validação mandatória da chave api_key no cabeçalho HTTP em todas as rotas de ingestão de reservas, retornando HTTP 401 em caso de credencial ausente ou inválida.', { bullet: true }),
    p('• Mascaramento de Credenciais em Logs: Sanitização em tempo de execução via regex na string de conexão do MongoDB (maskMongoUri), prevenindo vazamento de senhas no console ou Application Insights.', { bullet: true }),
    p('• Isolamento de Perfis de Usuário: Controle visual e lógico no frontend dividindo permissões entre recepção, governança e administração.', { bullet: true }),
    h2('8.2 Idempotência e Transacionalidade NoSQL'),
    p('• Notificações repetidas de reservas de parceiros utilizam upsert baseado em identificadores estáveis (CPF/Passaporte para hóspedes e número predial para quartos), eliminando registros corrompidos e duplicados.', { bullet: true }),
    h2('8.3 Tratamento Uniforme de Erros e Resiliência'),
    p('• Mapeamento padronizado de códigos de resposta HTTP semânticos (400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict, 500 Internal Error) acompanhados de mensagens JSON claras para o cliente.', { bullet: true }),
    h2('8.4 Interface com Motion Design Operacional'),
    p('• Transições de telas estruturadas com AnimatePresence e física de mola da biblioteca Motion, proporcionando fluidez visual e resposta táctil instantânea durante a rotina dos atendentes.', { bullet: true })
  );

  // 9. Decisões Arquiteturais (ADRs)
  sections.push(
    h1('9. Decisões Arquiteturais (ADRs)'),
    h2('ADR-01: Migração da Proposta Monolítica (PHP/SQL) para Serverless Distribuído (Azure/NoSQL)'),
    p('• Status: Aprovada e Implementada.', { bold: true }),
    p('• Contexto: A proposta inicial acadêmica contemplava monólito em PHP/Laravel com banco SQL. No entanto, o volume oscilante de notificações de reservas por plataformas externas e a necessidade de governança em tempo real exigiam alta elasticidade e redução de custo ocioso.'),
    p('• Decisão: Adotar Azure Functions (Node.js) desacopladas acopladas ao MongoDB.'),
    p('• Consequências: Escala dinâmica instantânea, persistência flexível para esquemas de terceiros, custo reduzido em períodos de baixa reserva e arquitetura nativa em nuvem.'),

    h2('ADR-02: Adoção do Padrão Upsert para Ingestão de Reservas Externas'),
    p('• Status: Aprovada e Implementada.', { bold: true }),
    p('• Contexto: Parceiros externos frequentemente reenviam o mesmo payload em falhas transitórias de conexão.'),
    p('• Decisão: Implementar operações de updateOne(..., { $set }, { upsert: true }) para coleções de hóspedes e quartos.'),
    p('• Consequências: Eliminação de registros duplicados e garantia de idempotência sem a complexidade de transações distribuídas pesadas.'),

    h2('ADR-03: Padronização Contratual com OpenAPI 3.0.4 (Swagger)'),
    p('• Status: Aprovada e Implementada.', { bold: true }),
    p('• Contexto: Múltiplos parceiros e a equipe de frontend precisavam de um contrato inequívoco para integração.'),
    p('• Decisão: Formalizar todos os esquemas e rotas no documento /doc/api/swagger.yaml.'),
    p('• Consequências: Documentação viva, clareza sobre tipos de parâmetros e validação facilitada durante testes automatizados.'),

    h2('ADR-04: Micro-frontend React Reativo com Motion Design'),
    p('• Status: Aprovada e Implementada.', { bold: true }),
    p('• Contexto: A operação de balcão exige agilidade sem recarregamentos de página (full-page refresh).'),
    p('• Decisão: Implementar a SPA em React 19 com Vite, Tailwind CSS e biblioteca Motion para transições de estado.'),
    p('• Consequências: Experiência fluida para o staff, eliminação de latência perceptível e facilidade de manutenção de componentes reutilizáveis.')
  );

  // 10. Requisitos de Qualidade
  sections.push(
    h1('10. Requisitos de Qualidade'),
    h2('10.1 Árvore de Qualidade (ISO/IEC 25010)'),
    p('• Confiabilidade: Tolerância a falhas na ingestão com upsert idempotente e recuperabilidade de conexões NoSQL.', { bullet: true }),
    p('• Desempenho & Eficiência: Tempo de resposta do painel de quartos inferior a 400ms e ingestão de reservas inferior a 600ms.', { bullet: true }),
    p('• Segurança: Autenticação mandatória via API Key e tráfego integralmente encriptado sob HTTPS/TLS 1.3.', { bullet: true }),
    p('• Usabilidade: Transições instantâneas com física de mola e prevenção de erros operacionais no fluxo de check-in e check-out.', { bullet: true }),
    h2('10.2 Cenários de Qualidade'),
    createTable(
      ['ID', 'Atributo', 'Estímulo', 'Fonte do Estímulo', 'Artefato Afetado', 'Resposta do Sistema', 'Métrica Mensurável'],
      [
        [
          'CQ01',
          'Confiabilidade',
          '50 notificações idênticas de reserva enviadas em sequência.',
          'OTA parceira com erro de retentativa.',
          'fc_gp_cloudInn_insert e base MongoDB.',
          'Sistema atualiza o registro existente sem criar duplicidades de hóspedes ou quartos.',
          '100% de registros únicos na base NoSQL; 0 duplicidades.'
        ],
        [
          'CQ02',
          'Desempenho',
          'Recepcionista acessa o painel de status dos quartos em horário de pico.',
          'Rede local do hotel.',
          'SPA React e endpoint de quartos.',
          'Lista de quartos é renderizada com cores e estados correspondentes sem bloqueios de tela.',
          'Tempo total de carregamento < 400ms.'
        ],
        [
          'CQ03',
          'Segurança',
          'Requisição externa sem cabeçalho api_key tenta cadastrar reserva.',
          'Ator malicioso externo ou configuração incorreta.',
          'Camada de validação de cabeçalho da Function.',
          'Requisição é sumariamente rejeitada sem executar consultas na base de dados.',
          'Retorno HTTP 401 em menos de 50ms.'
        ],
        [
          'CQ04',
          'Usabilidade',
          'Recepcionista realiza check-out de um hóspede no balcão.',
          'Colaborador da recepção.',
          'Módulo de Reservas e Quartos do PMS.',
          'Reserva concluída e quarto imediatamente sinalizado em vermelho/laranja como "Sujo".',
          'Transição visual em tela em menos de 200ms via Motion.'
        ]
      ],
      [700, 1400, 1600, 1400, 1400, 1500, 1000]
    )
  );

  // 11. Riscos e Dívidas Técnicas
  sections.push(
    h1('11. Riscos e Dívidas Técnicas'),
    h2('11.1 Matriz de Riscos de Arquitetura'),
    createTable(
      ['Risco Identificado', 'Probabilidade', 'Impacto', 'Estratégia de Mitigação Arquitetural'],
      [
        [
          'Latência por Cold Start no Serverless',
          'Média',
          'Baixo',
          'Uso de instâncias com pré-aquecimento (pre-warmed) ou otimização do tamanho do pacote de dependências Node.js.'
        ],
        [
          'Indisponibilidade Temporária de Conexão com MongoDB',
          'Baixa',
          'Alto',
          'Implementação de política de reconexão exponencial (exponential backoff) no serviço singleton de banco de dados.'
        ],
        [
          'Concorrência de Alocação de Quartos (Overbooking)',
          'Média',
          'Alto',
          'Validação de restrição de unicidade em nível de banco de dados (roomId + intervalo de datas), impedindo sobreposição de reservas ativas.'
        ],
        [
          'Queda de Conexão no Balcão de Atendimento',
          'Média',
          'Médio',
          'Suporte futuro a cache local (IndexedDB) na SPA para permitir consulta offline aos quartos do dia.'
        ]
      ],
      [2600, 1200, 1200, 4000]
    ),
    h2('11.2 Dívidas Técnicas Identificadas'),
    p('1. Testes de Carga Automatizados: Formalização de scripts k6 para simular picos de 500 requisições simultâneas de canais parceiros.', { bullet: true }),
    p('2. Auditoria Centralizada de Logs: Implementação de traceId distribuído para rastrear requisições desde a OTA até a gravação final no MongoDB.', { bullet: true }),
    p('3. Internacionalização da Interface (i18n): Suporte nativo a múltiplos idiomas para atender redes internacionais de hotelaria.', { bullet: true })
  );

  // 12. Glossário
  sections.push(
    h1('12. Glossário'),
    p('Definições formais para os principais termos e acrônimos utilizados no ecossistema do CloudInn:'),
    createTable(
      ['Termo', 'Definição no Contexto do CloudInn'],
      [
        [
          'PMS',
          'Property Management System: Sistema central de gestão hoteleira para administração de reservas, quartos e faturamento.'
        ],
        [
          'OTA',
          'Online Travel Agency: Agências de viagem online terceiras (como Booking.com, Airbnb, Expedia) que alimentam o CloudInn via API.'
        ],
        [
          'Check-in',
          'Procedimento formal de recepção e alocação do hóspede em seu quarto designado no início da estadia.'
        ],
        [
          'Check-out',
          'Procedimento formal de encerramento da estadia, desocupação do quarto e faturamento dos serviços.'
        ],
        [
          'Tipologia de Quarto',
          'Classificação física e tarifária dos aposentos: STD (Standard), LUX (Luxo) e STE (Suíte).'
        ],
        [
          'Quarto Sujo (Dirty)',
          'Estado operacional do aposento imediatamente após o check-out, indicando necessidade mandatória de higienização.'
        ],
        [
          'Governança',
          'Setor operacional do hotel responsável pela limpeza, arrumação, inspeção e liberação dos quartos.'
        ],
        [
          'Upsert',
          'Operação híbrida de banco de dados que atualiza um documento caso ele exista ou insere um novo caso não seja localizado.'
        ],
        [
          'Azure Functions',
          'Serviço de computação em nuvem serverless orientado a eventos da Microsoft Azure.'
        ],
        [
          'Idempotência',
          'Propriedade de uma operação de produzir o mesmo resultado final independente da quantidade de vezes em que é executada com os mesmos parâmetros.'
        ],
        [
          'OpenAPI / Swagger',
          'Padrão aberto de especificação de interfaces de programação de aplicações (APIs) RESTful.'
        ],
        [
          'Motion',
          'Biblioteca de animação moderna para React baseada em física vetorial e física de mola para transições fluidas de interface.'
        ]
      ],
      [2400, 6600]
    )
  );

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 polegada (72pt * 20 twips)
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: sections
      }
    ]
  });
}

async function main() {
  const doc = buildArc42Doc();
  const buffer = await Packer.toBuffer(doc);
  const docDir = path.join(process.cwd(), 'doc');
  if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
  }
  const outputPath = path.join(docDir, 'arc42-arquitetura-sistemica-cloudInn.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Documento Word gerado com sucesso em: ${outputPath}`);
  console.log(`Tamanho do arquivo: ${buffer.length} bytes`);
}

main().catch((err) => {
  console.error('Erro ao gerar documento docx:', err);
  process.exit(1);
});
