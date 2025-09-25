import { Timestamp } from "firebase/firestore";

export type UserCategory = "Player" | "Gamer" | "Master" | "Visitante";
export type UserStatus = "Ativo" | "Pendente" | "Bloqueado";
export type AdminRole = "Administrador" | "Editor" | "Revisor" | "Membro" | "Visitante";
export type GameType = "RPG" | "Board Game" | "Card Game";

export interface Address {
    cep: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
}

export interface User {
  id: string; // Corresponde ao UID do Firebase Auth
  uid: string; // UID do Firebase Auth
  name: string;
  email: string;
  avatar?: string;
  category: UserCategory;
  status: UserStatus;
  role: AdminRole;
  createdAt: Timestamp | Date | null; // Adicionado para rastrear data de criação

  // Novos campos
  nickname?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  birthdate?: string | null; // Formato YYYY-MM-DD
  address?: Address;
  socialMedia?: string;
  gameTypes?: GameType[];
}
