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
   * Um objeto com detalhes contextuais sobre a ação.
   */
  details: Record<string, any>;

  /**
   * O timestamp de quando o log foi criado.
   */
  timestamp: Timestamp;
}
