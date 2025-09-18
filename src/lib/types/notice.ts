
import type { Timestamp } from "firebase/firestore";

export interface Notice {
    id: string;
    uid: string; // Adicionado para consistência
    title: string;
    description: string;
    link?: string;
    createdAt: Timestamp;
    targetUserId?: string; 
    readBy?: string[];
}
