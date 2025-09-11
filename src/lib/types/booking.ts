
import type { User } from "./user";
import type { Room } from "./room";

export interface Booking {
  id: string;
  roomId: Room["id"];
  organizerId: User["uid"];
  date: string;
  startTime: string;
  endTime: string;
  title?: string; // Título da sessão
  description?: string; // Descrição opcional
  participants: string[]; // Array de UIDs dos participantes
  guests?: number; // Representa não-associados
  status: "Confirmada" | "Pendente" | "Cancelada";
}

    