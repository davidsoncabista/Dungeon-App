import { addDoc, collection, serverTimestamp, doc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from './firebase';
import type { User } from './types/user';
import type { AuditLog } from './types/auditLog';

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
    const logCollectionRef = collection(db, 'auditLogs');
    const newLogRef = doc(logCollectionRef); // Cria uma referência com ID gerado
    
    const newLog: Omit<AuditLog, 'timestamp'> = {
        id: newLogRef.id,
        uid: newLogRef.id,
        actor: {
            uid: actor.uid,
            displayName: actor.name,
            email: actor.email,
            role: actor.role,
        },
        action,
        details,
    };

    await addDoc(logCollectionRef, {
        ...newLog,
        timestamp: serverTimestamp(),
    });

  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
    // A falha no log não deve interromper a experiência do usuário.
  }
};
