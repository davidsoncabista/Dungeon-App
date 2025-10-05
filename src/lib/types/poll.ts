
import type { Timestamp } from "firebase/firestore";

/**
 * Representa um item de conteúdo dentro da descrição de uma votação.
 * Pode ser um texto genérico ou um perfil de membro.
 */
export interface PollDescriptionItem {
  type: 'text' | 'member_profile';
  title: string;
  description: string;
  memberId?: string; // UID do membro, se o tipo for 'member_profile'
}

export interface Poll {
  id: string;
  title: string;
  /** A descrição agora é uma lista de itens de conteúdo. */
  description: PollDescriptionItem[];
  options: string[];
  eligibleVoters: string[]; // Array de UIDs
  status: "Aberta" | "Fechada";
  createdAt: Timestamp;
  closedAt?: Timestamp;
}

export interface Vote {
  id: string;
  pollId: string;
  userId: string;
  selectedOption: string;
  votingWeight: number; // Peso do voto no momento do voto
  votedAt: Timestamp;
}
