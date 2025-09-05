export type UserCategory = "Player" | "Gamer" | "Master";
export type UserStatus = "Ativo" | "Pendente" | "Bloqueado";
export type AdminRole = "Administrador" | "Editor" | "Revisor";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  category: UserCategory;
  status: UserStatus;
  role?: AdminRole;
}
