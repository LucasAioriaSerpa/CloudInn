/**
 * @fileoverview Configuração de autenticação de funcionários e controle de acesso baseado em papéis (RBAC)
 */

export const USER_ROLES = {
  MANAGER: "manager",
  SUB_MANAGER: "sub_manager",
  RECEPTIONIST: "receptionist",
  HOUSEKEEPER: "housekeeper",
};

export const ROLE_LABELS = {
  [USER_ROLES.MANAGER]: "Gerente Geral",
  [USER_ROLES.SUB_MANAGER]: "Sub-Gerente",
  [USER_ROLES.RECEPTIONIST]: "Recepcionista",
  [USER_ROLES.HOUSEKEEPER]: "Governanta Chefe",
};

export const ROLE_BADGES = {
  [USER_ROLES.MANAGER]: {
    label: "Gerente Geral",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-600",
  },
  [USER_ROLES.SUB_MANAGER]: {
    label: "Sub-Gerente",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-600",
  },
  [USER_ROLES.RECEPTIONIST]: {
    label: "Recepcionista",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-600",
  },
  [USER_ROLES.HOUSEKEEPER]: {
    label: "Governanta",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-600",
  },
};

/**
 * Funcionários cadastrados no sistema CloudInn com credenciais e papéis operacionais
 */
export const DEFAULT_EMPLOYEES = [
  {
    id: "emp_gerente",
    name: "Mariana Costa",
    email: "gerente@cloudinn.com",
    password: "123",
    role: USER_ROLES.MANAGER,
    roleLabel: "Gerente Geral",
    department: "Diretoria & Gestão Geral",
    avatar: "MC",
    color: "#14248A",
    description: "Visão integral 360° do hotel: dashboard executivo, gestão de reservas, governança, hóspedes e ferramentas administrativas.",
  },
  {
    id: "emp_subgerente",
    name: "Fernando Albuquerque",
    email: "subgerente@cloudinn.com",
    password: "123",
    role: USER_ROLES.SUB_MANAGER,
    roleLabel: "Sub-Gerente",
    department: "Supervisão Operacional",
    avatar: "FA",
    color: "#28262C",
    description: "Supervisão completa de toda a operação hoteleira, controle de reservas e governança dos quartos.",
  },
  {
    id: "emp_recepcao",
    name: "Lucas Oliveira",
    email: "recepcao@cloudinn.com",
    password: "123",
    role: USER_ROLES.RECEPTIONIST,
    roleLabel: "Recepcionista",
    department: "Recepção & Front Desk",
    avatar: "LO",
    color: "#998FC7",
    description: "Visão focada em reservas, check-in, check-out de hóspedes e consulta rápida de quartos disponíveis.",
  },
  {
    id: "emp_governanca",
    name: "Claudia Santos",
    email: "governanca@cloudinn.com",
    password: "123",
    role: USER_ROLES.HOUSEKEEPER,
    roleLabel: "Governanta Chefe",
    department: "Governança & Higienização",
    avatar: "CS",
    color: "#059669",
    description: "Visão focada exclusivamente no estado dos quartos: controle de quartos sujos, em limpeza e liberados/limpos.",
  },
];

/**
 * Matriz de permissões por papel
 */
export function getRolePermissions(role) {
  const isManagerOrSub = role === USER_ROLES.MANAGER || role === USER_ROLES.SUB_MANAGER;
  const isReceptionist = role === USER_ROLES.RECEPTIONIST;
  const isHousekeeper = role === USER_ROLES.HOUSEKEEPER;

  return {
    // Visões de página permitidas
    canViewDashboard: isManagerOrSub,
    canViewReservations: isManagerOrSub || isReceptionist,
    canViewRooms: true, // todos têm acesso a algum nível de quartos
    canViewHousekeepingBoard: isManagerOrSub || isHousekeeper,
    canViewGuests: isManagerOrSub || isReceptionist,
    
    // Ações operacionais
    canPerformCheckInCheckOut: isManagerOrSub || isReceptionist,
    canCreateReservation: isManagerOrSub || isReceptionist,
    canDeleteReservation: isManagerOrSub, // apenas gerência pode excluir
    canUpdateRoomStatus: true,
    canQuickCleanRooms: isManagerOrSub || isHousekeeper,
    canManageGuests: isManagerOrSub || isReceptionist,
    canDeleteGuest: isManagerOrSub,
    
    // Ferramentas administrativas
    canAccessPartnerSimulator: isManagerOrSub,
    canAccessSwaggerDocs: isManagerOrSub,
    canResetDemoData: isManagerOrSub,
    
    // Rota inicial padrão após login
    defaultRoute: isHousekeeper
      ? "/quartos"
      : isReceptionist
      ? "/reservas"
      : "/",
  };
}
