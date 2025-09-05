export interface Notice {
    id: string;
    title: string;
    description: string;
    link?: string;
    createdAt: string;
    targetUserId?: string; // ID do usuário específico, se for um aviso individual
    readBy: string[]; // Array de IDs de usuários que já leram/dispensaram
}
