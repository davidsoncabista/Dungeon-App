import { Timestamp } from "firebase/firestore";

export type UserCategory = "Player" | "Gamer" | "Master" | "Visitante";
export type UserStatus = "Ativo" | "Pendente" | "Bloqueado";
export type AdminRole = "Administrador" | "Editor" | "Revisor" | "Membro";
export type GameType = "RPG" | "Board Game" | "Card Game";

export interface User {
  id: string; // Corresponde ao UID do Firebase Auth
  uid: string; // UID do Firebase Auth
  name: string;
  email: string;
  avatar?: string;
  category: UserCategory;
  status: UserStatus;
  role: AdminRole;
  createdAt: Timestamp; // Adicionado para rastrear data de criação

  // Novos campos
  nickname?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  birthdate?: string; // Formato YYYY-MM-DD
  address?: string;
  socialMedia?: string;
  gameTypes?: GameType[];
}
