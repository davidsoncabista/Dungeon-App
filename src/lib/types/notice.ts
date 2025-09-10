
import type { Timestamp } from "firebase/firestore";

export interface Notice {
    id: string;
    title: string;
    description: string;
    link?: string;
    createdAt: Timestamp; // Alterado para Timestamp do Firestore
    targetUserId?: string; 
    readBy?: string[]; // Array de UIDs que leram/dispensaram
}

    