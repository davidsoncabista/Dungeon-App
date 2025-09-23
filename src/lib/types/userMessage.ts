
import type { Timestamp } from "firebase/firestore";

export type MessageCategory = 'aviso' | 'advertencia' | 'bloqueio' | 'multa';

export interface UserMessage {
    id: string;
    recipientId: string;
    recipientName?: string; // Denormalized
    senderId: string;
    senderName: string; // Denormalized
    title: string;
    content: string;
    category: MessageCategory;
    createdAt: Timestamp;
    read: boolean;
}
