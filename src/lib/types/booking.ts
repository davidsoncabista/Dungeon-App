
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
  guests: string[]; // Array de UIDs dos convidados (visitantes ou inativos)
  status: "Confirmada" | "Pendente" | "Cancelada";
}
