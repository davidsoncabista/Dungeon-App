
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Inicializa o Firebase Admin SDK para que as funções tenham acesso aos serviços.
admin.initializeApp();

/**
 * Gatilho do Authentication que cria um documento de usuário no Firestore
 * sempre que um novo usuário se registra.
 */
export const createUserDocument = functions
  .region("southamerica-east1")
  .auth.user()
  .onCreate(async (user) => {
    console.log(`[Auth] Triggered for new user. UID: ${user.uid}, Email: ${user.email}`);
    
    const firestore = admin.firestore();
    const userRef = firestore.collection("users").doc(user.uid);

    const newUser = {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "Novo Aventureiro",
      avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      category: "Visitante", // Categoria inicial padrão
      status: "Pendente",     // Status inicial padrão
      role: "Membro",         // Nível de acesso padrão
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await userRef.set(newUser);
      console.log(`[Firestore] User document created successfully for UID: ${user.uid}`);
    } catch (error) {
      console.error(`[Firestore] Error creating user document for UID: ${user.uid}`, error);
    }
  });


/**
 * Gatilho do Firestore que define/remove um "custom claim" de administrador
 * sempre que o campo `role` de um usuário é alterado.
 */
export const setAdminClaim = functions
  .region("southamerica-east1")
  .firestore.document("users/{userId}")
  .onUpdate(async (change, context) => {
    const { userId } = context.params;
    const newData = change.after.data();
    const oldData = change.before.data();

    // Se o campo 'role' não mudou, não faz nada.
    if (newData.role === oldData.role) {
      console.log(`[Claims] Role for user ${userId} has not changed. Skipping.`);
      return null;
    }

    const newRole = newData.role;
    const auth = admin.auth();

    try {
      // Se o novo 'role' é 'Administrador', define o custom claim.
      if (newRole === "Administrador") {
        await auth.setCustomUserClaims(userId, { admin: true });
        console.log(`[Claims] Successfully set admin claim for user ${userId}.`);
      } 
      // Se o 'role' anterior era 'Administrador' e o novo não é, remove o claim.
      else if (oldData.role === "Administrador" && newRole !== "Administrador") {
        await auth.setCustomUserClaims(userId, { admin: false });
        console.log(`[Claims] Successfully removed admin claim for user ${userId}.`);
      } else {
        console.log(`[Claims] Role changed for ${userId} to ${newRole}, but no action required for claims.`);
      }
      return null;
    } catch (error) {
      console.error(`[Claims] Error setting custom claims for user ${userId}:`, error);
      return null;
    }
  });
