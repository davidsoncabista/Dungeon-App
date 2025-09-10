
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Inicializa o Firebase Admin SDK.
// As credenciais são obtidas automaticamente do ambiente do Firebase.
admin.initializeApp();

/**
 * Gatilho do Authentication que cria um documento de usuário no Firestore
 * sempre que um novo usuário se registra.
 */
export const createUserDocument = functions
  .region("southamerica-east1") // Garante que a função rode na mesma região do seu Firestore
  .auth.user()
  .onCreate(async (user) => {
    // Busca o banco de dados do Firestore
    const firestore = admin.firestore();
    
    // Define o caminho para o novo documento do usuário na coleção "users"
    const userRef = firestore.collection("users").doc(user.uid);

    // Dados iniciais para o novo usuário
    const newUser = {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "Novo Aventureiro",
      avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      category: "Visitante", // Categoria inicial padrão
      status: "Pendente",     // Status inicial padrão
      role: "Membro",         // Nível de acesso padrão
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Data de criação
    };

    // Salva os dados no Firestore
    try {
      await userRef.set(newUser);
      console.log(`Documento de usuário criado com sucesso para o UID: ${user.uid}`);
    } catch (error) {
      console.error(`Erro ao criar documento de usuário para o UID: ${user.uid}`, error);
    }
  });
