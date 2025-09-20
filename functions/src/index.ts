import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { setDate, subMonths, format, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Inicializa o Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// --- Suas funções existentes (createUserDocument, setAdminClaim, etc.) ---
// ... (O código das suas outras funções permanece o mesmo) ...
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
     category: "Visitante",
     status: "Pendente",
     role: "Membro",
     createdAt: admin.firestore.FieldValue.serverTimestamp(),
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

export const setAdminClaim = functions
 .region("southamerica-east1")
 .firestore.document("users/{userId}")
 .onUpdate(async (change, context) => {
   const { userId } = context.params;
   const newData = change.after.data();
   const oldData = change.before.data();

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

export const handleBookingWrite = functions
 .region("southamerica-east1")
 .firestore.document("bookings/{bookingId}")
 .onWrite(async (change, context) => {
   const { bookingId } = context.params;

   if (!change.after.exists) {
     console.log(`[Bookings] A reserva ${bookingId} foi excluída. Nenhuma ação adicional.`);
     return null;
   }

   const newData = change.after.data();
   
   if (!newData) {
       console.error(`[Bookings] Erro crítico: O documento ${bookingId} existe, mas não foi possível ler os dados.`);
       return null;
   }

   if (newData.participants && newData.participants.length === 0) {
     console.log(`[Bookings] A reserva ${bookingId} não tem mais participantes. Excluindo...`);
     try {
       await change.after.ref.delete();
       console.log(`[Bookings] Reserva ${bookingId} excluída com sucesso.`);
     } catch (error) {
       console.error(`[Bookings] Erro ao excluir a reserva ${bookingId}:`, error);
     }
     return null;
   }

   const oldData = change.before.data() || {};
   const newGuests = newData.guests || [];
   const oldGuests = oldData.guests || [];

   if (change.before.exists && JSON.stringify(newGuests) === JSON.stringify(oldGuests)) {
       console.log(`[Charges] A lista de convidados da reserva ${bookingId} não mudou.`);
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
   
   if (extraInvitePrice <= 0) {
     return null;
   }

   const today = new Date();
   const renewalDay = 15;
   let cycleStart: Date;

   if (today.getDate() < renewalDay) {
     cycleStart = setDate(subMonths(today, 1), renewalDay);
   } else {
     cycleStart = setDate(today, renewalDay);
   }
   const cycleStartStr = cycleStart.toISOString().split('T')[0];

   const bookingsInCycleSnapshot = await db.collection('bookings')
       .where('organizerId', '==', organizerId)
       .where('date', '>=', cycleStartStr)
       .get();

   let totalGuestsInCycle = 0;
   bookingsInCycleSnapshot.forEach(doc => {
       if (doc.id !== bookingId) {
           totalGuestsInCycle += (doc.data().guests || []).length;
       }
   });
   
   const guestsInThisBooking = newGuests.length;
   const totalGuestsWithThisBooking = totalGuestsInCycle + guestsInThisBooking;
   
   if (totalGuestsWithThisBooking <= freeInvites) {
       return null;
   }
   
   const previouslyChargedGuests = totalGuestsInCycle > freeInvites ? totalGuestsInCycle - freeInvites : 0;
   const guestsToChargeNow = (totalGuestsWithThisBooking - freeInvites) - previouslyChargedGuests;

   if (guestsToChargeNow <= 0) {
       return null;
   }

   const chargeAmount = guestsToChargeNow * extraInvitePrice;
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
       }, { merge: true });

       console.log(`[Charges] Cobrança de R$ ${chargeAmount} gerada/atualizada para o usuário ${organizerId}.`);

   } catch (error) {
       console.error(`[Charges] Erro ao gerar cobrança para o usuário ${organizerId}:`, error);
   }
   
   return null;
 });

// --- FUNÇÃO DE PAGAMENTO ---
export const createMercadoPagoPayment = functions
 .region("southamerica-east1")
 .https.onCall(async (data, context) => {
   // ... (seu código existente)
 });

// --- ATUALIZAÇÃO NO WEBHOOK ---
export const mercadoPagoWebhook = functions
 .region("southamerica-east1")
 .https.onRequest(async (request, response) => {
   
   console.log("[Mercado Pago Webhook] Notificação recebida:", JSON.stringify(request.body));

   const { body } = request;
   const paymentId = body.data?.id;

   if (body.type === "payment" && paymentId) {
       console.log(`[Mercado Pago Webhook] Processando o ID do pagamento: ${paymentId}`);
       try {
           // ... (código para buscar o pagamento)

           const paymentDetails = await paymentResponse.json() as any;
           const transactionId = paymentDetails.external_reference;
           
           if (!transactionId) {
               // ... (tratamento de erro)
               return;
           }

           if (paymentDetails.status === "approved") {
               const transactionRef = db.collection("transactions").doc(transactionId);
               const userRef = db.collection("users").doc(paymentDetails.metadata.user_id); // Assumindo que você salva o userId nos metadados

               // Atualiza a transação e o status do usuário em um batch
               const batch = db.batch();
               batch.update(transactionRef, {
                   status: "Pago",
                   paidAt: admin.firestore.FieldValue.serverTimestamp(),
               });
               batch.update(userRef, { status: "Ativo" });
               
               await batch.commit();

               console.log(`[Mercado Pago Webhook] Transação ${transactionId} paga. Status do usuário ${paymentDetails.metadata.user_id} atualizado para Ativo.`);
           } else {
               console.log(`[Mercado Pago Webhook] O status do pagamento ${paymentId} é '${paymentDetails.status}'. Nenhuma atualização necessária.`);
           }
       } catch (error: any) {
           console.error(`[Mercado Pago Webhook] Erro inesperado ao processar o pagamento ${paymentId}:`, error);
           response.status(500).send("Erro interno do servidor ao processar o webhook.");
           return;
       }
   }
   
   response.status(200).send("OK");
 });

// --- FUNÇÃO DE GERAR FATURAS MODIFICADA ---
export const generateMonthlyInvoices = functions
  .region("southamerica-east1")
  .pubsub.schedule("0 9 5 * *") // "Às 09:00 do dia 5 de cada mês"
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    console.log("[Scheduler] Iniciando a geração de faturas mensais.");

    try {
      const plansSnapshot = await db.collection("plans").get();
      // ... (código para mapear os planos)

      const usersSnapshot = await db.collection("users").get();
      // ... (código para verificar se existem usuários)

      const batch = db.batch();
      const today = new Date();
      const dueDate = setDate(today, 15); // Vencimento no dia 15 do mês atual
      const monthYear = format(today, "MMMM/yyyy", { locale: ptBR });
      let invoicesCreated = 0;

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        
        // ... (lógica para pular visitantes e usuários sem plano)

        const transactionRef = db.collection("transactions").doc();
        batch.set(transactionRef, {
          id: transactionRef.id,
          uid: transactionRef.id,
          userId: user.uid,
          userName: user.name,
          description: `Mensalidade ${user.category} - ${monthYear}`,
          amount: plan.price,
          status: "Pendente",
          type: "Mensalidade",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          dueDate: admin.firestore.Timestamp.fromDate(dueDate), // Adiciona a data de vencimento
        });
        invoicesCreated++;
      }

      await batch.commit();
      console.log(`[Scheduler] Geração de faturas concluída! ${invoicesCreated} faturas criadas.`);
      return null;
    } catch (error) {
      console.error("[Scheduler] Erro durante a geração de faturas:", error);
      return null;
    }
  });

// --- NOVA FUNÇÃO PARA VERIFICAR PAGAMENTOS ATRASADOS ---
export const checkOverduePayments = functions
  .region("southamerica-east1")
  .pubsub.schedule("0 9 16 * *") // "Às 09:00 do dia 16 de cada mês"
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    console.log("[Scheduler] Iniciando verificação de pagamentos atrasados.");

    try {
      const usersSnapshot = await db.collection("users").where("category", "!=", "Visitante").get();
      if (usersSnapshot.empty) {
        console.log("[Scheduler] Nenhum usuário ativo para verificar.");
        return null;
      }

      const batch = db.batch();
      let usersWithOverduePayment = 0;

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();

        const overdueInvoicesSnapshot = await db.collection("transactions")
          .where("userId", "==", user.uid)
          .where("type", "==", "Mensalidade")
          .where("status", "==", "Pendente")
          .get();

        if (!overdueInvoicesSnapshot.empty) {
          // Se encontrou qualquer mensalidade pendente, marca o usuário como pendente
          const userRef = db.collection("users").doc(user.uid);
          batch.update(userRef, { status: "Pendente" });
          usersWithOverduePayment++;
          console.log(`[Scheduler] Usuário ${user.uid} marcado como Pendente devido a faturas em aberto.`);
        }
      }

      await batch.commit();
      console.log(`[Scheduler] Verificação de atrasos concluída. ${usersWithOverduePayment} usuários foram marcados como pendentes.`);
      return null;
    } catch (error) {
      console.error("[Scheduler] Erro durante a verificação de pagamentos atrasados:", error);
      return null;
    }
  });