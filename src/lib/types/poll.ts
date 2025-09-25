
import type { Timestamp } from "firebase/firestore";

export interface Poll {
  id: string;
  title: string;
  description: string;
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
