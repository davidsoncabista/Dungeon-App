
import type { Timestamp } from "firebase/firestore";

export type TransactionStatus = "Pago" | "Pendente" | "Vencido";
export type TransactionType = "Mensalidade" | "Avulso";

export interface Transaction {
  id: string;
  userId: string;
  userName: string; // Denormalized for easier display
  description: string;
  amount: number; // Storing as a number is better for calculations
  status: TransactionStatus;
  type: TransactionType;
  createdAt: Timestamp;
  paidAt?: Timestamp;
  dueDate?: Timestamp;
}
