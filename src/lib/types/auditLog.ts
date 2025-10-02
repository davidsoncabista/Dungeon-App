import type { Timestamp } from "firebase/firestore";
import type { User } from "./user";

/**
 * Representa a estrutura de um documento de log de auditoria.
 */
export interface AuditLog {
  id: string;
  
  /**
   * O ator que realizou a ação.
   */
  actor: {
    uid: string;
    displayName: string | null;
    email: string | null;
    role: User['role'];
  };

  /**
   * A ação que foi realizada (ex: 'USER_LOGIN', 'CREATE_BOOKING').
   */
  action: string;
  
  /**
   * O objeto ou usuário que sofreu a ação (opcional).
   */
  target?: {
    type: 'user' | 'booking' | 'room' | 'payment';
    id: string;
    displayName?: string; // Nome do usuário, título da reserva, etc.
    displayId?: string; // Email, ID da sala, etc.
  };

  /**
   * Um objeto com detalhes contextuais sobre a ação.
   */
  details: Record<string, any>;

  /**
   * O timestamp de quando o log foi criado.
   */
  timestamp: Timestamp;
}
