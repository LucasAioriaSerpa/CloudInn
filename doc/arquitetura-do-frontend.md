# Documentação Técnica e Arquitetural do Frontend — CloudInn

## 1. Visão Geral e Propósito do Sistema

O **CloudInn** é um sistema de gestão hoteleira (_Property Management System_ - PMS) moderno, projetado para recepção, governança e atendimento a hóspedes. O frontend foi construído para fornecer uma interface intuitiva, responsiva e de alta performance que centraliza a operação hoteleira, integrando-se nativamente com a arquitetura serverless em nuvem baseada em **Azure Functions v4** e banco de dados **MongoDB**.

### 1.1 Objetivos Centrais

- **Agilidade Operacional:** Permitir que operadores de recepção realizem check-ins, check-outs e cadastros de reservas em poucos cliques com validações em tempo real.
- **Governança Eficiente:** Garantir transparência total do ciclo de vida dos quartos (disponível, reservado, ocupado, sujo, em limpeza).
- **Controle de Acesso Baseado em Perfis (RBAC):** Segregar acessos, módulos e ações de acordo com o perfil do colaborador autenticado (`manager`, `sub_manager`, `receptionist` e `housekeeper`).
- **Resiliência Arquitetural:** Suportar comunicação direta com Azure Functions com fallback gracioso e modo de demonstração local automático.
- **Conformidade com arc42 e OpenAPI/Swagger:** Implementar com precisão os requisitos funcionais **RF01 a RF11** descritos na arquitetura do sistema e a nova entidade de colaboradores (`staff`).

---

## 2. Stack Tecnológica e Ferramentas

| Tecnologia       | Versão | Papel na Arquitetura                                                                                             |
| :--------------- | :----- | :--------------------------------------------------------------------------------------------------------------- |
| **React**        | 18.x   | Biblioteca de construção de interfaces declarativas com componentização moderna baseada em Hooks                 |
| **Vite**         | 6.x    | Bundler e ferramenta de desenvolvimento rápido com compilação ultra-rápida via Rollup/esbuild                    |
| **Tailwind CSS** | 4.x    | Framework utilitário de estilização responsiva com design tokens customizados e alta performance de renderização |
| **Motion**       | 12.x   | Biblioteca de animações físicas, transições de páginas, gavetas laterais, modais e feedback de micro-interações  |
| **Lucide React** | 1.x    | Conjunto iconográfico consistente e semântico para identificação visual de status e ações                        |
| **Context API**  | Nativo | Camada de gerenciamento de estado global reativo sem a complexidade desnecessária de bibliotecas externas        |
| **Fetch API**    | Nativo | Cliente HTTP para integração com Azure Functions com headers de segurança (`api_key`)                            |

---

## 3. Identidade Visual e Design System

O frontend do CloudInn adota a paleta cromática corporativa definida nos documentos de arquitetura, garantindo acessibilidade, contraste legível (WCAG AA) e distinção visual refinada.

### 3.1 Paleta de Cores Oficiais

```
┌─────────────────────────────────────────────────────────────┐
│                       PALETA CLOUDINN                       │
├───────────────────┬──────────────┬──────────────────────────┤
│ Token / Nome      │ Hex          │ Aplicação Principal      │
├───────────────────┼──────────────┼──────────────────────────┤
│ Rich Black        │ #28262C      │ Sidebar, textos primários│
│ Blue (Pigment)    │ #14248A      │ Botões primários, badges │
│ Amethyst          │ #998FC7      │ Bordas, destaques médios │
│ Lavender (Web)    │ #D4C2FC      │ Badges claros, acentos   │
│ Snow Soft White   │ #F9F5FF      │ Fundo global do app      │
└───────────────────┴──────────────┴──────────────────────────┘
```

### 3.2 Códigos Semânticos de Status de Quartos e Reservas

- **Disponível (Available):** Verde Esmeralda (`bg-emerald-50 text-emerald-700 border-emerald-200`) — Quarto pronto para alocação.
- **Reservado (Reserved):** Azul / Roxo Suave (`bg-[#D4C2FC]/40 text-[#14248A] border-[#998FC7]/40`) — Quarto aguardando chegada do hóspede.
- **Ocupado (Occupied):** Âmbar (`bg-amber-50 text-amber-800 border-amber-200`) — Hóspede presente no hotel.
- **Sujo (Dirty):** Rosa / Carmim (`bg-rose-50 text-rose-700 border-rose-200`) — Quarto liberado após check-out, necessita higienização.
- **Em Limpeza (Cleaning):** Azul Claro (`bg-sky-50 text-sky-700 border-sky-200`) — Equipe de governança atuando no quarto.

---

## 4. Estrutura de Diretórios e Organização Arquitetural

A aplicação adota o padrão **Feature-Driven Architecture**, onde componentes, subcomponentes e lógicas específicas residem juntos por domínio de negócio:

```
frontend/
├── index.html                     # Entrypoint HTML com meta tags e fontes Google Fonts
├── vite.config.js                 # Configuração do Vite (porta 3000, build para ../dist)
├── package.json                   # Dependências e scripts do frontend
└── src/
    ├── main.jsx                   # Inicializador do React no DOM (#root)
    ├── App.jsx                    # Roteador reativo baseado em Hash e layout principal
    ├── index.css                  # Folha de estilo global com diretivas do Tailwind CSS
    │
    ├── config/                    # Configurações estáticas e constantes
    │   ├── api.js                 # URLs de integração com Azure Functions via import.meta.env
    │   └── constants.js           # Enums de status, rotas, tipos de quarto e contratos
    │
    ├── context/                   # Gerenciamento de Estado Global
    │   ├── HotelContext.jsx       # Provedor do estado unificado (reservas, quartos, hóspedes)
    │   └── AuthContext.jsx        # Contexto de autenticação, sessão de operador e RBAC
    │
    ├── services/                  # Camada de Integração HTTP e Domínio
    │   ├── apiClient.js           # Cliente HTTP unificado com roteamento para Azure Functions
    │   ├── reservationService.js  # Serviços de reserva (listagem, cadastro, checkin, checkout)
    │   ├── roomService.js         # Serviços de quartos e fluxo de governança
    │   ├── guestService.js        # Serviços de catálogo de hóspedes
    │   ├── staffService.js        # Serviços da coleção 'staff' (CRUD de colaboradores e RBAC)
    │   └── demoRestoreService.js  # Serviço de limpeza e restauração de dados demo
    │
    ├── mocks/                     # Persistência e Dados de Demonstração
    │   ├── seedData.js            # Base inicial de quartos, hóspedes, reservas e staff
    │   └── mockStorage.js         # Engine de persistência local com sincronização de estados
    │
    ├── components/                # Componentes Compartilhados Reutilizáveis
    │   ├── layout/                # Estrutura base da interface
    │   │   ├── AppLayout.jsx      # Shell responsivo com Sidebar fixa e Header sticky
    │   │   ├── Header.jsx         # Cabeçalho com perfil de usuário, papel ativo e atalhos
    │   │   └── Sidebar.jsx        # Navegação lateral filtrada dinamicamente por permissões RBAC
    │   └── common/                # Biblioteca de componentes atômicos
    │       ├── Badge.jsx          # Tag de status estilizada com suporte a variantes
    │       ├── Button.jsx         # Botão com variantes (primary, secondary, outline, danger)
    │       ├── Card.jsx           # Contêiner elevado com cabeçalho e rodapé
    │       ├── ConfirmModal.jsx   # Diálogo de confirmação de ações destrutivas
    │       ├── EmptyState.jsx     # Feedback visual quando coleções estão vazias
    │       ├── ErrorState.jsx     # Card de erro amigável com botão de tentar novamente
    │       ├── Input.jsx          # Campo de texto, busca e área de texto com label
    │       ├── LoadingState.jsx   # Indicador de carregamento assíncrono
    │       ├── Modal.jsx          # Janela modal acessível com backdrop
    │       ├── Select.jsx         # Dropdown estilizado
    │       └── Toast.jsx          # Notificações flutuantes com auto-dismiss
    │
    └── features/                  # Módulos de Negócio (Telas e Modais Específicos)
        ├── auth/                  # Módulo de Autenticação e Controle de Sessão
        │   └── LoginPage.jsx      # Tela de login corporativo com seletor de perfis RBAC
        │
        ├── dashboard/             # Módulo do Painel Principal
        │   ├── DashboardPage.jsx
        │   └── components/
        │       ├── MetricCard.jsx       # Card de indicador estatístico chave
        │       ├── QuickRoomStatus.jsx  # Mapa visual sintético do estado dos quartos
        │       └── TodayActivities.jsx  # Timeline de check-ins e check-outs previstos
        │
        ├── reservations/          # Módulo de Gestão de Reservas
        │   ├── ReservationsPage.jsx
        │   └── components/
        │       ├── ReservationTable.jsx        # Tabela completa com paginação e ações
        │       ├── ReservationFormModal.jsx    # Modal de criação de reserva
        │       ├── ReservationDetailModal.jsx  # Visualização de dados completos e hóspede
        │       ├── CheckInModal.jsx            # Confirmação operacional de check-in
        │       └── CheckOutModal.jsx           # Confirmação operacional de check-out
        │
        ├── rooms/                 # Módulo de Quartos e Governança
        │   ├── RoomsPage.jsx
        │   └── components/
        │       ├── RoomCard.jsx         # Card do quarto no modo grid
        │       ├── RoomTable.jsx        # Visão tabular para operação densa
        │       └── RoomStatusModal.jsx  # Modal de transição de status de governança
        │
        ├── housekeeping/          # Módulo Dedicado para Equipe de Governança
        │   └── HousekeepingPage.jsx     # Interface simplificada para camareiras e governantas
        │
        ├── guests/                # Módulo de Hóspedes
        │   ├── GuestsPage.jsx
        │   └── components/
        │       ├── GuestTable.jsx       # Tabela de hóspedes cadastrados
        │       ├── GuestFormModal.jsx   # Cadastro e edição de dados do hóspede
        │       └── GuestDetailModal.jsx # Histórico e detalhes do hóspede
        │
        ├── partner-simulator/     # Simulador de APIs Externas
        │   └── PartnerSimulatorModal.jsx # Simulação de webhook Booking/Expedia/Airbnb
        │
        └── api-docs/              # Documentação Interativa de Contratos
            └── ApiExplorerModal.jsx      # Matriz de conformidade OpenAPI / RF01-RF11 / Staff
```

---

## 5. Mapeamento dos Requisitos Funcionais (RF01 a RF11) no Frontend

| Requisito | Descrição Arquitetural                               | Onde está Implementado no Frontend                                                               |
| :-------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **RF01**  | Receber notificação de reserva de parceiros externos | `PartnerSimulatorModal.jsx`, `ReservationFormModal.jsx` e `reservationService.createReservation` |
| **RF02**  | Cadastro e gerenciamento de hóspedes                 | `GuestsPage.jsx`, `GuestFormModal.jsx`, `GuestTable.jsx` e `guestService`                        |
| **RF03**  | Validação de datas de check-in e check-out           | Validação client-side em `ReservationFormModal.jsx` (check-out > check-in)                       |
| **RF04**  | Seleção e alocação de quarto                         | Seletor inteligente em `ReservationFormModal.jsx` filtrando apenas quartos disponíveis           |
| **RF05**  | Confirmação da reserva                               | Sistema de Toasts reativos via `HotelContext.addToast` e modal de resumo                         |
| **RF06**  | Notificação à governança                             | Atualização imediata do status de quartos e badge de quartos pendentes de limpeza na Sidebar     |
| **RF07**  | Registro de check-in e status `occupied`             | `CheckInModal.jsx`, botão de ação rápida na tabela e no dashboard (`handleCheckIn`)              |
| **RF08**  | Registro de check-out e status `completed`           | `CheckOutModal.jsx`, botão de ação rápida na tabela e no dashboard (`handleCheckOut`)            |
| **RF09**  | Liberação de quarto com status `dirty`               | Sincronizado automaticamente ao confirmar check-out em `handleCheckOut`                          |
| **RF10**  | Atualização pelo serviço de limpeza                  | `RoomStatusModal.jsx` e botões de ação rápida em `RoomCard.jsx` (`cleaning` / `available`)       |
| **RF11**  | Liberação do quarto para nova reserva                | Transição para `available` no `RoomStatusModal.jsx` ou `RoomCard.jsx`                            |

### 5.1 Novo Recurso: Tabela/Coleção `staff` e Matriz RBAC (Controle de Acesso)

Para suportar governança corporativa, auditoria e segregação de funções, a arquitetura do CloudInn foi expandida com o recurso **`staff`** (Funcionários / Colaboradores), integrado ponta a ponta desde os contratos Swagger OpenAPI até a persistência no MongoDB e validação no frontend.

#### 5.1.1 Estrutura de Dados da Coleção `staff` (MongoDB)

```json
{
  "id": 1,
  "name": "Carlos Eduardo Mendes",
  "username": "carlos.gerente",
  "email": "carlos.mendes@cloudinn.com",
  "role": "manager",
  "roleLabel": "Gerente Geral",
  "department": "Administração Geral",
  "shift": "Diurno (Geral)",
  "status": "active",
  "phone": "+55 11 98888-1111",
  "document": "111.222.333-44",
  "createdAt": "2026-08-01T08:00:00.000Z",
  "updatedAt": "2026-08-25T10:30:00.000Z"
}
```

#### 5.1.2 Perfis de Usuário (Roles)

| Papel (`role`)    | Título Exibido       | Descrição Operacional                                                                             |
| :---------------- | :------------------- | :------------------------------------------------------------------------------------------------ |
| `manager`         | **Gerente Geral**    | Acesso irrestrito a todos os módulos, relatórios gerenciais, métricas financeiras e exclusões     |
| `sub_manager`     | **Sub-Gerente**      | Acesso operacional amplo, supervisão de reservas, quartos e equipe, com governança avançada       |
| `receptionist`    | **Recepcionista**    | Foco na operação de balcão (check-in, check-out, novas reservas, cadastro de hóspedes e consulta) |
| `housekeeper`     | **Governanta Chefe** | Foco exclusivo na higienização, quartos, transição de status (`dirty` -> `cleaning` -> `available`) |

#### 5.1.3 Matriz de Permissões RBAC no Frontend (`AuthContext.jsx`)

| Recurso / Funcionalidade           | Gerente (`manager`) | Sub-Gerente (`sub_manager`) | Recepcionista (`receptionist`) | Governanta (`housekeeper`) |
| :--------------------------------- | :-----------------: | :-------------------------: | :----------------------------: | :------------------------: |
| **Painel Geral (Dashboard)**       | Sim                 | Sim                         | Sim (visão compacta)           | Não (redireciona p/ quartos)|
| **Métricas Financeiras & Ocupação**| Sim                 | Sim                         | Oculto                         | Oculto                     |
| **Criar / Editar Reservas**        | Sim                 | Sim                         | Sim                            | Não                        |
| **Realizar Check-in / Check-out**  | Sim                 | Sim                         | Sim                            | Não                        |
| **Cancelar / Excluir Reservas**    | Sim                 | Sim                         | Não                            | Não                        |
| **Gestão de Hóspedes (CRUD)**      | Sim                 | Sim                         | Sim                            | Não                        |
| **Catálogo de Quartos**            | Sim                 | Sim                         | Sim                            | Sim                        |
| **Painel Exclusivo de Governança** | Sim                 | Sim                         | Apenas consulta                | Sim (visão principal)      |
| **Mudar Status de Limpeza Quarto** | Sim                 | Sim                         | Sim                            | Sim                        |
| **Simulador de Parceiros Webhook** | Sim                 | Sim                         | Oculto                         | Oculto                     |
| **Gestão de Equipe (`/staff`)**    | Sim                 | Leitura                     | Não                            | Não                        |

#### 5.1.4 Endpoints da Tag `staff` no Swagger (`/DOC/api/swagger.yaml`)

| Método   | Rota                   | Parâmetros / Body                         | Resposta | Descrição Arquitetural                                                      |
| :------- | :--------------------- | :---------------------------------------- | :------- | :-------------------------------------------------------------------------- |
| `GET`    | `/staff`               | `?role=...&status=...&department=...`     | `200`    | Lista os colaboradores com filtros opcionais por cargo, setor ou status     |
| `POST`   | `/staff`               | `StaffBody` (`name, username, role, ...`) | `201`    | Cadastra um novo membro da equipe com perfil de acesso e turno de trabalho  |
| `GET`    | `/staff/{staffId}`     | Path param: `staffId`                     | `200`    | Consulta o perfil completo e permissões de um colaborador específico        |
| `PUT`    | `/staff/{staffId}`     | Path param: `staffId`, Body: `StaffBody`  | `200`    | Atualiza dados cadastrais, departamento, turno, cargo ou status do operador |
| `DELETE` | `/staff/{staffId}`     | Path param: `staffId`                     | `200`    | Desativa ou remove o colaborador da base do sistema                         |

---

## 6. Especificação Detalhada dos Módulos da Interface

### 6.1 Layout Base (`AppLayout`, `Header`, `Sidebar`)

- **Sidebar Corporativa:** Contém logotipo oficial, indicador do hotel, navegação entre os quatro módulos principais e contadores em tempo real (ex.: número de quartos sujos, reservas pendentes). Oferece ainda botão para acionar o **Simulador de Parceiros** e botão para **Redefinir Dados Padrão**.
- **Header:** Apresenta o título e subtítulo dinâmicos da rota ativa, data operacional formatada por extenso, botão de atalho para a documentação de APIs (`ApiExplorerModal`) e botão para abrir o menu em dispositivos móveis.

### 6.2 Módulo Dashboard (`DashboardPage`)

O painel inicial consolida os principais indicadores para a tomada de decisão rápida da recepção:

1. **Banner Superior:** Acesso com 1 clique para "Nova Reserva" e visualização rápida do mapa de quartos.
2. **Grid de Métricas (`MetricCard`):**
   - _Taxa de Ocupação Geral:_ Porcentagem calculada entre quartos ocupados/reservados e o total do hotel.
   - _Quartos Ocupados:_ Total de quartos com hóspedes ativos no momento.
   - _Quartos Disponíveis:_ Total de quartos aptos para venda imediata na recepção.
   - _Quartos Sujos / Governança:_ Total de quartos aguardando limpeza prioritária.
3. **Timeline de Atividades do Dia (`TodayActivities`):**
   - Hóspedes previstos para check-in com botão de ação rápida "Fazer Check-in".
   - Hóspedes previstos para check-out com botão de ação rápida "Fazer Check-out".
4. **Visão Sintética de Quartos (`QuickRoomStatus`):**
   - Lista visual dos quartos com seus status atuais e botão para alterar status de governança.

### 6.3 Módulo de Reservas (`ReservationsPage`)

Central de controle das reservas hoteleiras:

- **Filtros por Abas:** Alterna facilmente entre "Todas as Reservas", "Pendentes", "Ativas (Hospedados)", "Concluídas" e "Canceladas", com badge de contagem em cada aba.
- **Busca Global Instantânea:** Filtra por nome do hóspede, número de documento (CPF/Passaporte), número do quarto ou identificador numérico da reserva.
- **Tabela de Reservas (`ReservationTable`):** Exibe ID, hóspede, quarto alocado, período de hospedagem, status visual via `Badge` e menu de ações:
  - _Ver Detalhes:_ Abre modal com ficha cadastral completa.
  - _Check-in:_ Disponível para reservas pendentes.
  - _Check-out:_ Disponível para reservas ativas.
  - _Excluir:_ Disponível com diálogo de confirmação via `ConfirmModal`.
- **Formulário de Nova Reserva (`ReservationFormModal`):**
  - Seleção de hóspede existente ou cadastro rápido de novo hóspede.
  - Seleção de quarto disponível agrupado por tipo (STD, LUX, STE, PRE, etc.).
  - Seleção de datas com cálculo automático de diárias e validação cronológica.

### 6.4 Módulo de Quartos e Governança (`RoomsPage`)

Interface pensada para a equipe de recepção e governança predial:

- **Alternância de Visualização:** Suporta modo **Grid de Cards** (`RoomCard`) e modo **Tabela Detalhada** (`RoomTable`).
- **Filtros por Estado de Governança:** Todos, Disponíveis, Ocupados, Reservados, Sujos e Em Limpeza.
- **Filtro por Tipo de Quarto:** Standard, Suíte, Luxo, Presidencial, etc.
- **Card do Quarto (`RoomCard`):** Exibe número do quarto, tipo, badge de status e botões de atalho rápido de acordo com o status atual:
  - Se estiver **Sujo**, exibe botão para "Iniciar Limpeza".
  - Se estiver **Em Limpeza**, exibe botão para "Marcar como Limpo / Disponível".
- **Modal de Transição de Governança (`RoomStatusModal`):** Permite transição manual explícita com registro de observações.

### 6.5 Módulo de Hóspedes (`GuestsPage`)

Diretório de clientes do hotel:

- **Busca Rápida:** Localiza hóspedes por nome, CPF/documento, e-mail ou telefone.
- **Tabela de Hóspedes (`GuestTable`):** Exibe nome, documento, e-mail, telefone e histórico de estadias.
- **Modal de Cadastro/Edição (`GuestFormModal`):** Validação de campos obrigatórios (nome, documento) e dados de contato.
- **Modal de Detalhes (`GuestDetailModal`):** Apresenta perfil do hóspede e lista de todas as reservas associadas ao documento.

### 6.6 Simulador de Notificações de Parceiros (`PartnerSimulatorModal`)

Ferramenta integrada diretamente na interface para testes operacionais:

- Permite simular a chegada de reservas de canais externos (Booking.com, Expedia, Airbnb).
- Carrega templates pré-configurados com dados realistas.
- Permite editar o JSON do payload antes do envio.
- Dispara a requisição HTTP real para a Azure Function de inserção (`fc_gp_cloudInn_insert`), atualizando a tela imediatamente ao receber o status 200.

### 6.7 Explorador de Contratos Swagger (`ApiExplorerModal`)

Painel em modal para inspeção dos contratos OpenAPI 3.0:

- Apresenta todos os endpoints da especificação Swagger (`/DOC/api/swagger.yaml`).
- Mostra método HTTP, caminho, resumo e mapeamento exato com os requisitos funcionais **RF01 a RF11**.

---

## 7. Gerenciamento de Estado Global (`HotelContext`)

O estado global da aplicação é provido pelo `HotelProvider` e consumido através do hook customizado `useHotel()`.

```javascript
// Exemplo de consumo na camada de apresentação
import { useHotel } from "../../context/HotelContext.jsx";

export function MeuComponente() {
  const {
    reservations,
    rooms,
    guests,
    loading,
    stats,
    handleCheckIn,
    handleCheckOut,
    addToast,
  } = useHotel();

  // Renderização e handlers...
}
```

### 7.1 Métricas Computadas Automaticamente (`stats`)

O contexto utiliza `useMemo` para computar em tempo real:

- `occupancyRate`: Taxa percentual de ocupação `((occupied + reserved) / total) * 100`.
- `occupiedRooms`, `reservedRooms`, `availableRooms`, `dirtyRooms`, `cleaningRooms`.
- `pendingCount`, `activeCount`, `completedCount`.
- `totalReservations`, `totalGuests`, `totalRooms`.

### 7.2 Notificações de Feedback (`Toasts`)

- Ações de mutação geram notificações visuais automáticas com temporizador de 4,5 segundos.
- Tipos suportados: `success`, `error`, `warning` e `info`.

### 7.3 Gerenciamento de Sessão e Controle de Acesso (`AuthContext`)

A camada de controle de acesso é provida pelo `AuthProvider` (`src/context/AuthContext.jsx`) e consumida através do hook `useAuth()`:

```javascript
import { useAuth } from "../../context/AuthContext.jsx";

export function MeuMenu() {
  const { currentUser, role, permissions, can, switchRole, logout } = useAuth();

  return (
    <div>
      <span>Operador: {currentUser?.name} ({currentUser?.roleLabel})</span>
      {can("viewMetrics") && <IndicadoresFinanceiros />}
      {can("manageStaff") && <BotaoGestaoEquipe />}
    </div>
  );
}
```

- **Persistência de Sessão:** Armazena o usuário ativo no `localStorage` com restauração automática ao recarregar a aplicação.
- **Alternador de Papéis para Demonstração:** Permite alternar instantaneamente entre perfis (`manager`, `sub_manager`, `receptionist`, `housekeeper`) para validação visual dos fluxos de trabalho.

### 7.4 Arquitetura de Animações e Transições de Interface (Motion)

Para transformar o CloudInn em uma ferramenta hoteleira de alto refinamento ergonômico, foi integrada a biblioteca **Motion** (`motion/react`). A arquitetura de animações segue rigorosamente o princípio de **motion com propósito operacional**, priorizando transições que comunicam hierarquia espacial, feedback imediato de ações e troca suave de contexto sem impactar o tempo de resposta ou sobrecarregar a GPU.

#### 7.4.1 Matriz de Componentes e Padrões de Animação

| Componente / Fluxo | Padrão Motion Aplicado | Configuração Física / Transição | Propósito e Benefício UX |
| :--- | :--- | :--- | :--- |
| **Transição de Rotas** (`App.jsx`) | `<AnimatePresence mode="wait">` + `<motion.div>` | `opacity: 0 → 1`, `y: 8 → 0`, `duration: 0.18s` | Elimina cortes abruptos de tela, comunicando mudança de módulo de forma contínua. |
| **Drawer / Sidebar Mobile** (`AppLayout.jsx`) | `<motion.aside>` + `<motion.div>` (backdrop) | Slide lateral com mola: `x: "-100%" → 0%`, `damping: 30`, `stiffness: 300` | Sensação tátil e natural de gaveta ao abrir/fechar o menu em smartphones e tablets. |
| **Indicador da Rota Ativa** (`Sidebar.jsx`) | `<motion.div layoutId="activeNavTab">` | Mola fluida contínua: `stiffness: 500`, `damping: 35` | O fundo ativo desliza suavemente entre os itens do menu conforme a rota selecionada muda. |
| **Modais Operacionais** (`Modal.jsx`) | `<AnimatePresence>` + `<motion.div>` | Backdrop fade (`0 → 1`), Dialog: `scale: 0.96 → 1`, `y: 12 → 0`, spring `damping: 25` | Foco progressivo com aceleração suave e fechamento limpo via teardown de animação. |
| **Sistema de Toasts** (`Toast.jsx`) | `<AnimatePresence>` + `<motion.div>` | Entrada lateral: `x: 40 → 0`, `opacity: 0 → 1`, saída: `x: 40`, `opacity: 0` | Empilhamento dinâmico e desaparecimento suave após o temporizador ou fechamento manual. |
| **Abas de Filtro Operacional** (`ReservationsPage.jsx` & `RoomsPage.jsx`) | `layoutId="active...Indicator"` | Deslizamento horizontal com física: `stiffness: 400`, `damping: 32` | Sinalização visual nítida da categoria selecionada sem recálculo de layout desnecessário. |
| **Menu de Perfil e RBAC** (`Header.jsx`) | Popover com `<AnimatePresence>` e spring | `scale: 0.95 → 1`, `y: -6 → 0`, `damping: 25`, `stiffness: 350` | Abertura instantânea e contextual do seletor rápido de colaboradores e troca de visão. |
| **Cartões de Métrica & Ações** (`DashboardPage.jsx` & `MetricCard.jsx`) | Grid com `staggerChildren: 0.08s` + `whileHover={{ y: -3 }}` | Animação cascateada na entrada do dashboard e elevação sutil sob o cursor do mouse | Facilita a leitura escaneável de métricas chave e realça elementos clicáveis. |
| **Cartões de Quarto** (`RoomCard.jsx`) | `layout` + `whileHover={{ y: -2 }}` | Transição fluida de posição durante reordenação e filtragem de status | Suaviza reorganização dos quartos ao alternar entre disponíveis, ocupados e sujos. |
| **Tela de Login** (`LoginPage.jsx`) | Entrada coordenada de colunas + `AnimatePresence` | Colunas: `x: ±16 → 0`, feedback de erro com animação de altura, cards com `whileHover` | Apresentação acolhedora do ambiente corporativo com seleção rápida de perfis. |

#### 7.4.2 Exemplo Arquitetural de Rota com AnimatePresence

```jsx
// src/App.jsx
import { AnimatePresence, motion } from "motion/react";

<AnimatePresence mode="wait">
  <motion.div
    key={currentRoute}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18, ease: "easeOut" }}
  >
    {renderContent()}
  </motion.div>
</AnimatePresence>
```

#### 7.4.3 Princípio do layoutId para Elementos Compartilhados

O uso da diretiva `layoutId` do Motion permite que elementos compartilhados — como o fundo iluminado do menu ativo na `Sidebar` ou a linha marcadora das abas em `ReservationsPage` e `RoomsPage` — transitem fluidamente entre posições no DOM através de interpolação geométrica FLIP (*First, Last, Invert, Play*), garantindo 60fps constantes mesmo em dispositivos de menor capacidade computacional:

```jsx
// src/components/layout/Sidebar.jsx
{isActive && (
  <motion.div
    layoutId="activeNavTab"
    className="absolute inset-0 bg-[#14248A] rounded-xl shadow-md z-0"
    transition={{ type: "spring", stiffness: 500, damping: 35 }}
  />
)}
<Icon className="w-4 h-4 relative z-10 shrink-0" />
<span className="relative z-10 font-semibold">{item.label}</span>
```

---

## 8. Camada de Integração e Roteamento para Azure Functions

A comunicação com o backend ocorre através da classe `ApiClient` (`src/services/apiClient.js`), que detecta automaticamente as variáveis de ambiente das Azure Functions:

### 8.1 Mapeamento de Funções do Azure no Frontend

| Função Azure Backend    | Variável de Ambiente       | Método     | Entidades e Operações Suportadas                                                                     |
| :---------------------- | :------------------------- | :--------- | :--------------------------------------------------------------------------------------------------- |
| `fc_gp_cloudInn_select` | `VITE_CLOUDINN_SELECT_URL` | `GET`      | Consulta reservas, quartos, hóspedes e equipe (`entity=reservation\|room\|guest\|staff`)             |
| `fc_gp_cloudInn_insert` | `VITE_CLOUDINN_INSERT_URL` | `POST`     | Cadastro de reservas, quartos, hóspedes e novos colaboradores (`staff` com índices em `id`/`username`)|
| `fc_gp_cloudInn_update` | `VITE_CLOUDINN_UPDATE_URL` | `PUT/POST` | Check-in (`action=checkin`), check-out (`action=checkout`), quartos e atualização de staff          |
| `fc_gp_cloudInn_delete` | `VITE_CLOUDINN_DELETE_URL` | `DELETE`   | Exclusão/desativação de reservas, quartos, hóspedes e colaboradores (`entity=staff`)                 |
| `fc_gp_cloudInn_health` | `VITE_CLOUDINN_HEALTH_URL` | `GET`      | Verificação de disponibilidade, conectividade MongoDB e integridade das coleções                     |

### 8.2 Fallback Gracioso e Alta Disponibilidade

Caso o frontend esteja rodando sem conexão direta com o Azure Functions ou em ambiente de testes:

1. O `ApiClient` tenta a chamada remota para o Azure Functions ou para a bridge local (`/backend/localBridge.cjs`).
2. A bridge local (`localBridge.cjs`) expõe todos os 5 handlers das Azure Functions conectando ao MongoDB Atlas se `MONGO_BD_URI` estiver preenchida, ou usando `createMockDb` com as coleções `reservations`, `rooms`, `guests` e `staff`.
3. Se houver falha de rede ou timeout, os serviços (`reservationService`, `roomService`, `guestService`, `staffService`) acionam o `mockStorage`.
4. O `mockStorage` armazena e sincroniza as coleções em memória/sessão local, garantindo que o operador nunca veja telas em branco ou quebras de execução.

---

## 9. Configuração, Execução e Build

### 9.1 Variáveis de Ambiente (`.env`)

```env
# Conexão opcional com backend Azure Functions
VITE_CLOUDINN_SELECT_URL=https://<app>.azurewebsites.net/api/fc_gp_cloudInn_select
VITE_CLOUDINN_INSERT_URL=https://<app>.azurewebsites.net/api/fc_gp_cloudInn_insert
VITE_CLOUDINN_UPDATE_URL=https://<app>.azurewebsites.net/api/fc_gp_cloudInn_update
VITE_CLOUDINN_DELETE_URL=https://<app>.azurewebsites.net/api/fc_gp_cloudInn_delete
VITE_CLOUDINN_HEALTH_URL=https://<app>.azurewebsites.net/api/fc_gp_cloudInn_health

# Chave opcional de API conforme contrato OpenAPI
VITE_API_KEY=sua_api_key_aqui
```

### 9.2 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento do Vite na porta 3000.
- `npm run build`: Compila os assets para a pasta `dist/` com otimização e minificação para produção.
- `npm test`: Executa a suíte de testes unitários automatizados das Azure Functions.

---

## 10. Conclusão

O frontend do **CloudInn** entrega uma experiência de gestão hoteleira completa, unindo fidelidade às regras de negócio (RF01-RF11), padrão visual coerente com a paleta institucional e arquitetura de software modular, testável e pronta para deploy em ambientes corporativos em nuvem.
