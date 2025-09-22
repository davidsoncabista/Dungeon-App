
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { setDate, subMonths, format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Inicializa o Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// --- FUNÇÕES EXISTENTES ---

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

// --- NOVA FUNÇÃO: Gatilho para gerar a primeira fatura ---
/**
 * Acionado quando um usuário muda de plano, especialmente de 'Visitante' para um plano pago.
 * Gera a primeira fatura (joia + mensalidade) com base na data de inscrição.
 */
export const onUserPlanChange = functions
  .region("southamerica-east1")
  .firestore.document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // A função só executa se o plano mudou DE 'Visitante' PARA outro plano
    if (before.category !== "Visitante" || after.category === "Visitante") {
      console.log(`[PlanChange] Mudança de plano para o usuário ${context.params.userId} não requer fatura inicial.`);
      return null;
    }

    console.log(`[PlanChange] Usuário ${context.params.userId} assinou o plano ${after.category}. Gerando fatura inicial.`);

    try {
      // Busca os dados do plano selecionado
      const planSnapshot = await db.collection("plans").where("name", "==", after.category).limit(1).get();
      if (planSnapshot.empty) {
        console.error(`[PlanChange] Plano "${after.category}" não encontrado.`);
        return null;
      }
      const plan = planSnapshot.docs[0].data();
      const planPrice = plan.price || 0;
      
      const settingsDoc = await db.collection('systemSettings').doc('config').get();
      const registrationFee = settingsDoc.data()?.registrationFee || 0;


      const today = new Date();
      const dayOfMonth = today.getDate();
      
      // A primeira fatura sempre vence 10 dias após a criação para dar tempo de pagar.
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 10);

      let description = "";
      let nextBillingMonthSkipped = false;
      let totalAmount = registrationFee;

      // Se o usuário se inscreve após o dia 15
      if (dayOfMonth > 15) {
        const nextMonth = format(addMonths(today, 1), "MMMM/yyyy", { locale: ptBR });
        description = `Joia + Mensalidade (${format(today, "MMMM", { locale: ptBR })} e ${nextMonth})`;
        totalAmount += planPrice * 2; // Soma duas mensalidades
        nextBillingMonthSkipped = true; // Marca para pular a próxima cobrança automática
      } else {
      // Se o usuário se inscreve até o dia 15
        description = `Joia + Mensalidade (${format(today, "MMMM/yyyy", { locale: ptBR })})`;
        totalAmount += planPrice; // Soma a mensalidade aqui também
      }

      const transactionRef = db.collection("transactions").doc();

      const batch = db.batch();
      
      // Cria a transação inicial
      batch.set(transactionRef, {
        id: transactionRef.id,
        uid: transactionRef.id,
        userId: context.params.userId,
        userName: after.name,
        description: description,
        amount: totalAmount,
        status: "Pendente",
        type: "Inicial",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        dueDate: admin.firestore.Timestamp.fromDate(dueDate),
      });

      // Atualiza o usuário para marcar que a próxima fatura deve ser pulada, se for o caso
      if (nextBillingMonthSkipped) {
        const userRef = db.collection("users").doc(context.params.userId);
        batch.update(userRef, { skipNextBilling: true });
      }

      await batch.commit();
      console.log(`[PlanChange] Fatura inicial de R$${totalAmount} gerada para ${after.name}.`);
      return null;

    } catch (error) {
      console.error(`[PlanChange] Erro ao gerar fatura inicial para o usuário ${context.params.userId}:`, error);
      return null;
    }
  });


// --- FUNÇÃO DE GERAR FATURAS MENSAIS MODIFICADA ---
export const generateMonthlyInvoices = functions
  .region("southamerica-east1")
  .pubsub.schedule("0 9 5 * *") // "Às 09:00 do dia 5 de cada mês"
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    console.log("[Scheduler] Iniciando a geração de faturas mensais.");

    try {
      const plansSnapshot = await db.collection("plans").get();
      const plansMap = new Map(plansSnapshot.docs.map(doc => [doc.data().name, doc.data()]));

      const usersSnapshot = await db.collection("users").get();
      if (usersSnapshot.empty) {
        console.log("[Scheduler] Nenhum usuário encontrado para faturar.");
        return null;
      }

      const batch = db.batch();
      const today = new Date();
      const monthYear = format(today, "MMMM/yyyy", { locale: ptBR });
      const dueDate = setDate(today, 15);
      let invoicesCreated = 0;

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        const userRef = userDoc.ref;

        // Pula usuários que são 'Visitante' ou estão marcados para pular a cobrança deste mês
        if (!user.category || user.category === "Visitante") continue;
        
        if (user.skipNextBilling === true) {
          console.log(`[Scheduler] Pulando fatura para o usuário ${user.uid} conforme regra de inscrição.`);
          // Remove a marcação para que ele seja cobrado normally no futuro
          batch.update(userRef, { skipNextBilling: false });
          continue;
        }

        const plan = plansMap.get(user.category);
        if (!plan || !plan.price || plan.price <= 0) continue;

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
          dueDate: admin.firestore.Timestamp.fromDate(dueDate),
        });
        invoicesCreated++;
      }

      await batch.commit();
      console.log(`[Scheduler] Geração de faturas concluída! ${invoicesCreated} faturas foram criadas.`);
      return null;
    } catch (error) {
      console.error("[Scheduler] Erro durante a geração de faturas:", error);
      return null;
    }
  });

// --- FUNÇÃO PARA VERIFICAR PAGAMENTOS ATRASADOS ---
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

        // Busca por QUALQUER fatura pendente, seja inicial ou mensal
        const overdueInvoicesSnapshot = await db.collection("transactions")
          .where("userId", "==", user.uid)
          .where("status", "==", "Pendente")
          .get();

        if (!overdueInvoicesSnapshot.empty) {
          // Se encontrou qualquer fatura pendente, marca o usuário como pendente
          const userRef = db.collection("users").doc(user.uid);
          batch.update(userRef, { status: "Pendente" });
          usersWithOverduePayment++;
          console.log(`[Scheduler] Usuário ${user.uid} marcado como Pendente devido a faturas em aberto.`);
        }
      }

      if (usersWithOverduePayment > 0) {
        await batch.commit();
      }
      
      console.log(`[Scheduler] Verificação de atrasos concluída. ${usersWithOverduePayment} usuários foram marcados como pendentes.`);
      return null;
    } catch (error) {
      console.error("[Scheduler] Erro durante a verificação de pagamentos atrasados:", error);
      return null;
    }
  });


// --- FUNÇÕES DE PAGAMENTO ---
export const createMercadoPagoPayment = functions
 .region("southamerica-east1")
 .https.onCall(async (data, context) => {
   
   const mercadopagoConfig = functions.config().mercadopago;
   if (!mercadopagoConfig || !mercadopagoConfig.access_token) {
       console.error("Token de acesso do Mercado Pago não encontrado na configuração.");
       throw new functions.https.HttpsError(
           "failed-precondition",
           "A funcionalidade de pagamento com Mercado Pago não está configurada."
       );
   }
   const mpClient = new MercadoPagoConfig({ 
       accessToken: mercadopagoConfig.access_token
   });

   if (!context.auth) {
       throw new functions.https.HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
   }

   const { transactionId } = data;
   if (!transactionId) {
       throw new functions.https.HttpsError("invalid-argument", "O ID da transação é obrigatório.");
   }
   
   try {
       const transactionRef = db.collection("transactions").doc(transactionId);
       const transactionDoc = await transactionRef.get();

       if (!transactionDoc.exists) {
           throw new functions.https.HttpsError("not-found", "A transação não foi encontrada.");
       }
       const transactionData = transactionDoc.data()!;
       
       if (transactionData.userId !== context.auth.uid) {
            throw new functions.https.HttpsError("permission-denied", "Você não tem permissão para pagar esta transação.");
       }
       if (transactionData.status === 'Pago') {
            throw new functions.https.HttpsError("failed-precondition", "Esta cobrança já foi paga.");
       }
       
       const successUrl = `https://studio--adbelm.us-central1.hosted.app/billing?payment_success=true`;
       const failureUrl = `https://studio--adbelm.us-central1.hosted.app/billing?payment_canceled=true`;
       
       const preference = new Preference(mpClient);
       const preferenceResponse = await preference.create({
           body: {
               items: [
                   {
                       id: transactionId,
                       title: transactionData.description,
                       quantity: 1,
                       unit_price: transactionData.amount,
                       currency_id: 'BRL',
                   }
               ],
               payer: {
                   email: context.auth.token.email,
               },
               back_urls: {
                   success: successUrl,
                   failure: failureUrl,
               },
               auto_return: "approved",
               external_reference: transactionId,
               notification_url: `https://southamerica-east1-adbelm.cloudfunctions.net/mercadoPagoWebhook`,
               // Adicionando metadados para reativar o usuário
               metadata: {
                 user_id: context.auth.uid,
                 transaction_id: transactionId,
               },
           }
       });

       return { preferenceId: preferenceResponse.id };

   } catch (error: any) {
       console.error("Erro ao criar preferência de pagamento no Mercado Pago:", error);
       if (error.cause) console.error("Detalhes do erro:", error.cause);
       throw new functions.https.HttpsError("internal", "Ocorreu um erro inesperado ao processar o seu pagamento.");
   }
 });

export const mercadoPagoWebhook = functions
 .region("southamerica-east1")
 .https.onRequest(async (request, response) => {
   
   console.log("[Mercado Pago Webhook] Notificação recebida:", JSON.stringify(request.body));

   const { body } = request;
   const paymentId = body.data?.id;

   if (body.type === "payment" && paymentId) {
       console.log(`[Mercado Pago Webhook] Processando o ID do pagamento: ${paymentId}`);
       try {
           const mercadopagoConfig = functions.config().mercadopago;
           const accessToken = mercadopagoConfig.access_token;
           if (!accessToken) {
               console.error("[Mercado Pago Webhook] ERRO CRÍTICO: Token de Acesso do Mercado Pago não configurado no servidor.");
               response.status(500).send("Erro de configuração do servidor.");
               return;
           }

           const paymentResponse = await fetch(
               `https://api.mercadopago.com/v1/payments/${paymentId}`,
               {
                   headers: { 'Authorization': `Bearer ${accessToken}` }
               }
           );

           if (!paymentResponse.ok) {
               const errorText = await paymentResponse.text();
               console.warn(`[Mercado Pago Webhook] A API do Mercado Pago retornou um erro para o paymentId ${paymentId}. Status: ${paymentResponse.status}. Resposta: ${errorText}`);
               response.status(200).send("OK: Pagamento não encontrado, provavelmente é um teste.");
               return;
           }

           const paymentDetails = await paymentResponse.json() as any;
           const transactionId = paymentDetails.external_reference;
           const userId = paymentDetails.metadata?.user_id;

           if (!transactionId) {
               console.error(`[Mercado Pago Webhook] Erro no Webhook: external_reference (ID da transação) não encontrada nos detalhes do pagamento ${paymentId}.`);
               response.status(200).send("OK: external_reference faltando.");
               return;
           }

           if (paymentDetails.status === "approved") {
               const transactionRef = db.collection("transactions").doc(transactionId);
               
               const batch = db.batch();
               
               batch.update(transactionRef, {
                   status: "Pago",
                   paidAt: admin.firestore.FieldValue.serverTimestamp(),
               });

               // Se o ID do usuário veio nos metadados, reativa o status dele
               if (userId) {
                 const userRef = db.collection("users").doc(userId);
                 batch.update(userRef, { status: "Ativo" });
                 console.log(`[Mercado Pago Webhook] Status do usuário ${userId} atualizado para Ativo.`);
               }
               
               await batch.commit();

               console.log(`[Mercado Pago Webhook] Transação ${transactionId} marcada como paga com sucesso.`);
           } else {
               console.log(`[Mercado Pago Webhook] O status do pagamento ${paymentId} é '${paymentDetails.status}'. Nenhuma atualização necessária.`);
           }

       } catch (error: any) {
           console.error(`[Mercado Pago Webhook] Erro inesperado ao processar o pagamento ${paymentId}:`, error);
           response.status(500).send("Erro interno do servidor ao processar o webhook.");
           return;
       }
   } else {
       console.log("[Mercado Pago Webhook] Tipo de evento não processado ou ID de dados em falta:", body.type);
   }
   
   response.status(200).send("OK");
 });
