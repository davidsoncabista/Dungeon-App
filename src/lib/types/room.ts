export type RoomStatus = "Disponível" | "Em Manutenção" | "Ocupada";

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  status: RoomStatus;
  image?: string;
}
