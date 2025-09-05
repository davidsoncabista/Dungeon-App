import type { User } from "./user";
import type { Room } from "./room";

export interface Booking {
  id: string;
  roomId: Room["id"];
  organizerId: User["id"];
  date: string;
  startTime: string;
  endTime: string;
  participants: User[];
  guests?: number; // Representa não-associados
  status: "Confirmada" | "Pendente" | "Cancelada";
}
