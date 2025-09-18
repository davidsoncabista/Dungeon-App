
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { setDate, subMonths } from "date-fns";

// Inicializa o Firebase Admin SDK para que as funções tenham acesso aos serviços.
admin.initializeApp();
const db = admin.firestore();


/**
 * Gatilho do Authentication que cria um documento de usuário no Firestore
 * sempre que um novo usuário se registra.
 */
export const createUserDocument = functions
  .region("southamerica-east1")
  .auth.user()
  .onCreate(async (user) => {
    console.log(`[Auth] Triggered for new user. UID: ${user.uid}, Email: ${user.email}`);
    
    const userRef = db.collection("users").doc(user.uid);

    const newUser = {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "Novo Aventureiro",
      avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      category: "Visitante", // Categoria inicial, mas o status 'Pendente' força o cadastro
      status: "Pendente",     // Status inicial que força o preenchimento do perfil
      role: "Membro",         // Nível de acesso padrão
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Os campos obrigatórios (cpf, phone, birthdate, address) ficam vazios/nulos
      cpf: null,
      phone: null,
      birthdate: null,
      address: null,
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
    let claims = {};

    switch(newRole) {
        case 'Administrador':
            claims = { admin: true, role: 'Administrador' };
            break;
        case 'Editor':
            claims = { admin: false, role: 'Editor' };
            break;
        case 'Revisor':
            claims = { admin: false, role: 'Revisor' };
            break;
        default:
             claims = { admin: false, role: 'Membro' };
             break;
    }

    try {
        await auth.setCustomUserClaims(userId, claims);
        console.log(`[Claims] Successfully set claims for user ${userId} to ${JSON.stringify(claims)}.`);
        return null;
    } catch (error) {
      console.error(`[Claims] Error setting custom claims for user ${userId}:`, error);
      return null;
    }
  });


/**
 * Gatilho do Firestore que executa lógicas de negócio em reservas.
 * 1. Se uma reserva ficar sem participantes, ela é automaticamente excluída.
 * 2. Se convidados extras forem adicionados, gera uma cobrança automática.
 */
export const handleBookingWrite = functions
  .region("southamerica-east1")
  .firestore.document("bookings/{bookingId}")
  .onWrite(async (change, context) => {
    const { bookingId } = context.params;

    // --- CASO 1: RESERVA EXCLUÍDA ---
    // Se o documento foi excluído (`change.after` não existe), não há mais nada a fazer.
    if (!change.after.exists) {
        console.log(`[Bookings] A reserva ${bookingId} foi excluída. Nenhuma ação adicional.`);
        return null;
    }
    
    // A partir daqui, temos certeza de que a reserva foi criada ou atualizada.
    // O `newData` definitivamente existe e não é `undefined`.
    const newData = change.after.data();

    // --- LÓGICA 1: EXCLUIR RESERVA VAZIA ---
    // Agora o acesso a `newData.participants` é seguro.
    if (newData.participants && newData.participants.length === 0) {
      console.log(`[Bookings] A reserva ${bookingId} não tem mais participantes. Excluindo...`);
      try {
        await change.after.ref.delete();
        console.log(`[Bookings] Reserva ${bookingId} excluída com sucesso.`);
      } catch (error) {
        console.error(`[Bookings] Erro ao excluir a reserva ${bookingId}:`, error);
      }
      // A função termina aqui se a reserva for excluída.
      return null;
    }

    // --- LÓGICA 2: COBRANÇA DE CONVIDADOS EXTRAS ---
    // Se não há dados anteriores (é uma criação), usamos um objeto vazio como base.
    // O método `data()` pode retornar undefined, então garantimos um objeto com `|| {}`
    const oldData = change.before.data() || {};
    
    // Agora o acesso a `newData` e `oldData` é seguro.
    const newGuests = newData.guests || [];
    const oldGuests = oldData.guests || [];

    // Só executa se a lista de convidados mudou.
    if (JSON.stringify(newGuests) === JSON.stringify(oldGuests) && change.before.exists) {
        console.log(`[Charges] A lista de convidados da reserva ${bookingId} não mudou. Nenhuma ação de cobrança necessária.`);
        return null;
    }

    const organizerId = newData.organizerId;
    if (!organizerId) return null;
    
    // 1. Obter dados do organizador e seu plano
    const userDoc = await db.collection('users').doc(organizerId).get();
    if (!userDoc.exists) return null;
    const userData = userDoc.data();
    if (!userData) return null; // Garante que userData não é undefined

    const plansSnapshot = await db.collection('plans').where('name', '==', userData.category).limit(1).get();
    if (plansSnapshot.empty) return null;
    const planData = plansSnapshot.docs[0].data();

    const freeInvites = planData.invites || 0;
    const extraInvitePrice = planData.extraInvitePrice || 0;
    
    // Se o plano não tem cobrança de convidado extra, encerra a função.
    if (extraInvitePrice <= 0) {
      console.log(`[Charges] Plano "${planData.name}" não possui taxa para convidados extras.`);
      return null;
    }

    // 2. Calcular o ciclo de faturamento (do dia 15 ao 14 do mês seguinte)
    const today = new Date();
    const renewalDay = 15;
    let cycleStart: Date;

    if (today.getDate() < renewalDay) {
      cycleStart = setDate(subMonths(today, 1), renewalDay);
    } else {
      cycleStart = setDate(today, renewalDay);
    }
    const cycleStartStr = cycleStart.toISOString().split('T')[0];

    // 3. Contar quantos convidados já foram usados no ciclo
    const bookingsInCycleSnapshot = await db.collection('bookings')
        .where('organizerId', '==', organizerId)
        .where('date', '>=', cycleStartStr)
        .get();

    let totalGuestsInCycle = 0;
    bookingsInCycleSnapshot.forEach(doc => {
        // Ignora a reserva atual na contagem, pois vamos analisá-la separadamente
        if (doc.id !== bookingId) {
            totalGuestsInCycle += (doc.data().guests || []).length;
        }
    });
    
    const guestsInThisBooking = newGuests.length;
    const totalGuestsWithThisBooking = totalGuestsInCycle + guestsInThisBooking;
    
    if (totalGuestsWithThisBooking <= freeInvites) {
        console.log(`[Charges] O total de convidados (${totalGuestsWithThisBooking}) não excede a cota gratuita (${freeInvites}).`);
        return null;
    }
    
    // 4. Calcular o número de convidados a serem cobrados
    const previouslyChargedGuests = totalGuestsInCycle > freeInvites ? totalGuestsInCycle - freeInvites : 0;
    const guestsToChargeNow = (totalGuestsWithThisBooking - freeInvites) - previouslyChargedGuests;

    if (guestsToChargeNow <= 0) {
        console.log("[Charges] Nenhum novo convidado a ser cobrado nesta atualização.");
        return null;
    }

    // 5. Gerar a cobrança
    const chargeAmount = guestsToChargeNow * extraInvitePrice;
    const transactionId = `charge_${bookingId}`; // ID previsível para evitar duplicatas

    const transactionRef = db.collection('transactions').doc(transactionId);
    
    try {
        await transactionRef.set({
            id: transactionId,
            uid: transactionId,
            userId: organizerId,
            userName: userData.name,
            description: `Taxa de ${guestsToChargeNow} convidado(s) extra(s) na reserva "${newData.title}"`,
            amount: chargeAmount,
            status: "Pendente",
            type: "Avulso",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }); // Usa merge para atualizar se já existir

        console.log(`[Charges] Cobrança de R$ ${chargeAmount} gerada/atualizada para o usuário ${organizerId}.`);

    } catch (error) {
        console.error(`[Charges] Erro ao gerar cobrança para o usuário ${organizerId}:`, error);
    }
    
    return null;
  });