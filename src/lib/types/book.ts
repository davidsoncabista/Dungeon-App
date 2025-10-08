import type { Timestamp } from "firebase/firestore";

export interface Book {
    id: string;
    title: string;
    description: string;
    actionText: string;
    actionLink: string;
    createdAt: Timestamp;
}
