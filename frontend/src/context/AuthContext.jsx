/**
 * @fileoverview Contexto de Autenticação e Controle de Sessão de Funcionários do CloudInn
 */
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  DEFAULT_EMPLOYEES,
  USER_ROLES,
  getRolePermissions,
} from "../config/auth.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "cloudinn_auth_employee";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Garante que o usuário armazenado ainda é válido
        const found = DEFAULT_EMPLOYEES.find(
          (emp) => emp.email === parsed.email || emp.id === parsed.id
        );
        if (found) return found;
      }
    } catch (e) {
      console.warn("Erro ao ler sessão do funcionário:", e);
    }
    return null; // Inicialmente deslogado para exibir a tela de login
  });

  // Salva no localStorage quando o usuário mudar
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  /**
   * Realiza login com email e senha
   */
  const login = (emailOrName, password) => {
    const cleanEmail = emailOrName.trim().toLowerCase();
    
    // Procura por email ou por nome aproximado
    const employee = DEFAULT_EMPLOYEES.find((emp) => {
      const emailMatches = emp.email.toLowerCase() === cleanEmail;
      const nameMatches = emp.name.toLowerCase() === cleanEmail;
      return emailMatches || nameMatches;
    });

    if (!employee) {
      return {
        success: false,
        message: "Funcionário não cadastrado. Verifique o email digitado.",
      };
    }

    if (employee.password !== password.trim()) {
      return {
        success: false,
        message: "Senha incorreta. Utilize a senha padrão (123).",
      };
    }

    setCurrentUser(employee);
    return { success: true, user: employee };
  };

  /**
   * Login rápido baseado no perfil operacional (para facilidade de demonstração e testes)
   */
  const loginAsRole = (role) => {
    const employee = DEFAULT_EMPLOYEES.find((emp) => emp.role === role);
    if (employee) {
      setCurrentUser(employee);
      return { success: true, user: employee };
    }
    return { success: false, message: "Perfil não encontrado." };
  };

  /**
   * Troca direta de perfil (atalho no topo do sistema para testar diferentes visões)
   */
  const switchEmployee = (employeeId) => {
    const found = DEFAULT_EMPLOYEES.find((emp) => emp.id === employeeId);
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  /**
   * Encerra a sessão do funcionário
   */
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Permissões dinâmicas baseadas no perfil do usuário logado
  const permissions = useMemo(() => {
    if (!currentUser) return getRolePermissions(null);
    return getRolePermissions(currentUser.role);
  }, [currentUser]);

  const value = {
    user: currentUser,
    isAuthenticated: !!currentUser,
    permissions,
    login,
    loginAsRole,
    switchEmployee,
    logout,
    employeesList: DEFAULT_EMPLOYEES,
    USER_ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
