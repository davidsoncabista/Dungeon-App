import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { setDate, subMonths } from "date-fns";
import Stripe from "stripe";

// Inicializa o Firebase Admin SDK para que as funções tenham acesso aos serviços.
admin.initializeApp();
const db = admin.firestore();

// Inicializa o cliente Stripe.
// As chaves devem ser configuradas como variáveis de ambiente no Firebase:
// firebase functions:config:set stripe.secret="sk_test_..."
// firebase functions:config:set stripe.webhook_secret="whsec_..."
const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: "2024-06-20",
});


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
    // Se o documento `after` não existe, significa que a reserva foi deletada.
    if (!change.after.exists) {
        console.log(`[Bookings] A reserva ${bookingId} foi excluída. Nenhuma ação adicional.`);
        return null;
    }
    
    // A partir daqui, o documento existe (foi criado ou atualizado)
    const newData = change.after.data();
    
    // Verificação de segurança adicional para o TypeScript
    if (!newData) {
        console.error(`[Bookings] Erro crítico: O documento ${bookingId} existe, mas não foi possível ler os dados.`);
        return null;
    }

    // --- LÓGICA 1: EXCLUIR RESERVA VAZIA ---
    if (newData.participants && newData.participants.length === 0) {
      console.log(`[Bookings] A reserva ${bookingId} não tem mais participantes. Excluindo...`);
      try {
        await change.after.ref.delete();
        console.log(`[Bookings] Reserva ${bookingId} excluída com sucesso.`);
      } catch (error) {
        console.error(`[Bookings] Erro ao excluir a reserva ${bookingId}:`, error);
      }
      return null; // Encerra a execução após a exclusão
    }

    // --- LÓGICA 2: COBRANÇA DE CONVIDADOS EXTRAS (só executa se a reserva não foi excluída) ---
    const oldData = change.before.data() || {}; // Se for uma nova reserva, oldData será um objeto vazio
    const newGuests = newData.guests || [];
    const oldGuests = oldData.guests || [];

    // Se a lista de convidados não mudou em uma atualização, não faz nada
    if (change.before.exists && JSON.stringify(newGuests) === JSON.stringify(oldGuests)) {
        console.log(`[Charges] A lista de convidados da reserva ${bookingId} não mudou. Nenhuma ação de cobrança necessária.`);
        return null;
    }

    const organizerId = newData.organizerId;
    if (!organizerId) return null;
    
    const userDoc = await db.collection('users').doc(organizerId).get();
    if (!userDoc.exists) return null;
    const userData = userDoc.data();
    if (!userData) return null;

    const plansSnapshot = await db.collection('plans').where('name', '==', userData.category).limit(1).get();
    if (plansSnapshot.empty) return null;
    const planData = plansSnapshot.docs[0].data();

    const freeInvites = planData.invites || 0;
    const extraInvitePrice = planData.extraInvitePrice || 0;
    
    // Se o plano não tem cobrança por convidado extra, não faz nada
    if (extraInvitePrice <= 0) {
      console.log(`[Charges] Plano "${planData.name}" não possui taxa para convidados extras.`);
      return null;
    }

    // Lógica para determinar o ciclo de faturamento (dia 15 de cada mês)
    const today = new Date();
    const renewalDay = 15;
    let cycleStart: Date;

    if (today.getDate() < renewalDay) {
      cycleStart = setDate(subMonths(today, 1), renewalDay);
    } else {
      cycleStart = setDate(today, renewalDay);
    }
    const cycleStartStr = cycleStart.toISOString().split('T')[0];

    // Busca todas as reservas do organizador no ciclo atual
    const bookingsInCycleSnapshot = await db.collection('bookings')
        .where('organizerId', '==', organizerId)
        .where('date', '>=', cycleStartStr)
        .get();

    let totalGuestsInCycle = 0;
    bookingsInCycleSnapshot.forEach(doc => {
        // Ignora a própria reserva que está sendo processada no cálculo do "já utilizado"
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
    
    // Calcula quantos convidados já foram cobrados em outras reservas deste ciclo
    const previouslyChargedGuests = totalGuestsInCycle > freeInvites ? totalGuestsInCycle - freeInvites : 0;
    // Calcula quantos novos convidados precisam ser cobrados nesta transação específica
    const guestsToChargeNow = (totalGuestsWithThisBooking - freeInvites) - previouslyChargedGuests;

    if (guestsToChargeNow <= 0) {
        console.log("[Charges] Nenhum novo convidado a ser cobrado nesta atualização.");
        return null;
    }

    const chargeAmount = guestsToChargeNow * extraInvitePrice;
    // Usa um ID previsível para a cobrança, para que possamos atualizá-la se a reserva for editada
    const transactionId = `charge_${bookingId}`;

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
        }, { merge: true }); // `merge: true` permite atualizar se a cobrança já existir

        console.log(`[Charges] Cobrança de R$ ${chargeAmount} gerada/atualizada para o usuário ${organizerId}.`);

    } catch (error) {
        console.error(`[Charges] Erro ao gerar cobrança para o usuário ${organizerId}:`, error);
    }
    
    return null;
  });

/**
 * Endpoint de Webhook para receber eventos do Stripe e atualizar o status
 * dos pagamentos no Firestore.
 */
export const stripeWebhook = functions
  .region("southamerica-east1")
  .https.onRequest(async (request, response) => {
    const sig = request.headers["stripe-signature"];
    const webhookSecret = functions.config().stripe.webhook_secret;

    if (!sig || !webhookSecret) {
      console.error("Webhook Error: Stripe signature or webhook secret is missing.");
      response.status(400).send("Webhook Error: Missing signature or secret.");
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(request.rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed.`, err.message);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Lida com o evento
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        const transactionId = session.metadata?.transaction_id;

        if (!transactionId) {
          console.error("Webhook Error: transaction_id not found in session metadata.", session.id);
          break;
        }

        try {
          const transactionRef = db.collection("transactions").doc(transactionId);
          await transactionRef.update({
            status: "Pago",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`Transaction ${transactionId} successfully marked as paid.`);
        } catch (error) {
          console.error(`Error updating transaction ${transactionId} in Firestore:`, error);
          // Mesmo que falhe, retornamos 200 para o Stripe não reenviar.
          // O erro será logado para investigação.
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Retorna uma resposta 200 para o Stripe saber que o evento foi recebido.
    response.status(200).send();
  });
