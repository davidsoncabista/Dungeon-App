import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from './firebase';
import type { User } from './types/user';

// Inicializa o Firestore uma vez
const db = getFirestore(app);

/**
 * Registra uma ação de auditoria no Firestore.
 * @param actor - O objeto do usuário que está realizando a ação.
 * @param action - Uma string que descreve a ação (ex: 'USER_LOGIN').
 * @param details - Um objeto opcional com detalhes contextuais.
 */
export const createAuditLog = async (actor: User, action: string, details: object = {}) => {
  if (!actor || !actor.uid) {
    console.error("Erro de auditoria: Objeto 'actor' inválido ou sem UID.");
    return;
  }
  
  try {
    await addDoc(collection(db, 'auditLogs'), {
      actor: {
        uid: actor.uid,
        displayName: actor.name,
        email: actor.email,
        role: actor.role || 'Membro', // Garante um valor padrão
      },
      action,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
    // A falha no log não deve interromper a experiência do usuário.
  }
};
