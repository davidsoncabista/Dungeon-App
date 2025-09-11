export type RoomStatus = "Disponível" | "Em Manutenção" | "Ocupada";

export interface Room {
  id: string;
  uid: string; // Adicionado para consistência com 'users'
  name: string;
  description: string;
  capacity: number;
  status: RoomStatus;
  image?: string;
}
