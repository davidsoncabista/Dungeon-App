
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { setDate, subMonths } from "date-fns";
import Stripe from "stripe";
import { MercadoPagoConfig, Preference } from "mercadopago";
import fetch from "node-fetch";

// Inicializa o Firebase Admin SDK para que as funções tenham acesso aos serviços.
admin.initializeApp();
const db = admin.firestore();

// --- INICIALIZAÇÃO SEGURA DOS CLIENTES ---

// Stripe
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });
} else {
    console.warn("Stripe secret key not found. Stripe functionality will be disabled.");
}

// Mercado Pago
let mpClient: MercadoPagoConfig | undefined;
if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    mpClient = new MercadoPagoConfig({ 
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        options: { timeout: 5000, idempotencyKey: 'abc' }
    });
} else {
    console.warn("Mercado Pago access token not found. Mercado Pago functionality will be disabled.");
}


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
    if (!change.after.exists) {
      console.log(`[Bookings] A reserva ${bookingId} foi excluída. Nenhuma ação adicional.`);
      return null;
    }

    const newData = change.after.data();
    
    // Adicionamos a verificação explícita para garantir que newData não é undefined.
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

    // --- LÓGICA 2: COBRANÇA DE CONVIDADOS EXTRAS ---
    const oldData = change.before.data() || {};
    const newGuests = newData.guests || [];
    const oldGuests = oldData.guests || [];

    // Se for uma atualização e a lista de convidados não mudou, não faz nada
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
    
    // Se o plano não cobra por convidados extras, encerra a função.
    if (extraInvitePrice <= 0) {
      return null;
    }

    // --- Cálculo do ciclo de cobrança ---
    const today = new Date();
    const renewalDay = 15;
    let cycleStart: Date;

    if (today.getDate() < renewalDay) {
      cycleStart = setDate(subMonths(today, 1), renewalDay);
    } else {
      cycleStart = setDate(today, renewalDay);
    }
    const cycleStartStr = cycleStart.toISOString().split('T')[0];

    // Busca todas as reservas do organizador no ciclo atual para contar os convidados.
    const bookingsInCycleSnapshot = await db.collection('bookings')
        .where('organizerId', '==', organizerId)
        .where('date', '>=', cycleStartStr)
        .get();

    let totalGuestsInCycle = 0;
    bookingsInCycleSnapshot.forEach(doc => {
        // Não conta a reserva atual na contagem de convidados já existentes
        if (doc.id !== bookingId) {
            totalGuestsInCycle += (doc.data().guests || []).length;
        }
    });
    
    const guestsInThisBooking = newGuests.length;
    const totalGuestsWithThisBooking = totalGuestsInCycle + guestsInThisBooking;
    
    // Se o total de convidados não excede a cota gratuita, não há o que cobrar.
    if (totalGuestsWithThisBooking <= freeInvites) {
        return null;
    }
    
    // Calcula quantos convidados já foram cobrados no ciclo para evitar cobrança dupla.
    const previouslyChargedGuests = totalGuestsInCycle > freeInvites ? totalGuestsInCycle - freeInvites : 0;
    // Calcula quantos novos convidados precisam ser cobrados nesta operação específica.
    const guestsToChargeNow = (totalGuestsWithThisBooking - freeInvites) - previouslyChargedGuests;

    if (guestsToChargeNow <= 0) {
        return null;
    }

    const chargeAmount = guestsToChargeNow * extraInvitePrice;
    // Usa um ID de transação previsível para evitar criar múltiplas cobranças para a mesma reserva.
    const transactionId = `charge_${bookingId}`;
    const transactionRef = db.collection('transactions').doc(transactionId);
    
    try {
        await transactionRef.set({
            id: transactionId,
            uid: transactionId, // Consistência
            userId: organizerId,
            userName: userData.name,
            description: `Taxa de ${guestsToChargeNow} convidado(s) extra(s) na reserva "${newData.title}"`,
            amount: chargeAmount,
            status: "Pendente",
            type: "Avulso",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }); // `merge: true` atualiza se já existir, ou cria se não.

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
    
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe não foi inicializado ou o webhook secret não foi configurado.");
      response.status(500).send("Erro de configuração do servidor.");
      return;
    }

    const sig = request.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
      console.error("Webhook Error: Stripe signature is missing.");
      response.status(400).send("Webhook Error: Missing signature.");
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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const transactionId = session.metadata?.transaction_id;

      if (!transactionId) {
        console.error("Webhook Error: transaction_id not found in session metadata.", session.id);
        response.status(400).send("Webhook Error: Missing transaction_id in metadata.");
        return;
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
        response.status(500).send(`Error updating transaction.`);
        return;
      }
    } else {
        console.log(`Unhandled event type ${event.type}`);
    }

    response.status(200).send();
  });


/**
 * Função Chamável (onCall) para criar uma sessão de pagamento no Stripe.
 */
export const createStripePayment = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!stripe) {
        throw new functions.https.HttpsError(
            "failed-precondition", "A funcionalidade de pagamento com Stripe não está configurada."
        );
    }
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated", "O usuário precisa estar autenticado."
        );
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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'boleto'],
            line_items: [{
                price_data: {
                    currency: "brl",
                    product_data: { name: transactionData.description },
                    unit_amount: Math.round(transactionData.amount * 100),
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: `https://adbelm.web.app/billing?payment_success=true`,
            cancel_url: `https://adbelm.web.app/billing?payment_canceled=true`,
            metadata: { transaction_id: transactionId },
        });

        return { url: session.url };

    } catch (error: any) {
        console.error("Erro ao criar sessão de pagamento no Stripe:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Ocorreu um erro inesperado ao processar seu pagamento com Stripe.");
    }
  });


/**
 * Função Chamável (onCall) para criar uma preferência de pagamento no Mercado Pago.
 */
export const createMercadoPagoPayment = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!mpClient) {
        throw new functions.https.HttpsError("failed-precondition", "A funcionalidade de pagamento com Mercado Pago não está configurada.");
    }
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }

    const { transactionId, payer } = data;
    if (!transactionId) {
        throw new functions.https.HttpsError("invalid-argument", "O ID da transação é obrigatório.");
    }
     if (!payer || !payer.email || !payer.name) {
        throw new functions.https.HttpsError("invalid-argument", "As informações do pagador (email, nome) são obrigatórias.");
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
                    name: payer.name,
                    email: payer.email,
                },
                back_urls: {
                    success: `https://adbelm.web.app/billing?payment_success=true`,
                    failure: `https://adbelm.web.app/billing?payment_canceled=true`,
                    pending: `https://adbelm.web.app/billing?payment_pending=true`,
                },
                auto_return: "approved",
                external_reference: transactionId,
                notification_url: `https://southamerica-east1-adbelm.cloudfunctions.net/mercadoPagoWebhook`,
            }
        });

        return { init_point: preferenceResponse.init_point };

    } catch (error: any) {
        console.error("Erro ao criar preferência de pagamento no Mercado Pago:", error);
        if (error.cause) console.error("Detalhes do erro:", error.cause);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Ocorreu um erro inesperado ao processar seu pagamento com Mercado Pago.");
    }
  });


/**
 * Endpoint de Webhook para receber notificações do Mercado Pago.
 */
export const mercadoPagoWebhook = functions
  .region("southamerica-east1")
  .https.onRequest(async (request, response) => {
    
    const { body } = request;
    console.log("[Mercado Pago Webhook] Received notification:", JSON.stringify(body));

    if (body.type === "payment" && body.action === "payment.updated" && body.data?.id) {
        const paymentId = body.data.id;
        console.log(`[Mercado Pago Webhook] Processing payment ID: ${paymentId}`);

        try {
            const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            if (!accessToken) {
                console.error("Mercado Pago Access Token is not configured on server.");
                response.status(500).send("Server configuration error.");
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
                throw new Error(`Failed to fetch payment details: ${paymentResponse.status} ${errorText}`);
            }

            const paymentDetails = await paymentResponse.json() as any;
            const transactionId = paymentDetails.external_reference;

            if (!transactionId) {
                console.error("Webhook Error: external_reference (transaction_id) not found in payment details.", paymentId);
                response.status(400).send("Webhook Error: Missing external_reference.");
                return;
            }

            if (paymentDetails.status === "approved") {
                const transactionRef = db.collection("transactions").doc(transactionId);
                await transactionRef.update({
                    status: "Pago",
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`[Mercado Pago Webhook] Transaction ${transactionId} successfully marked as paid.`);
            } else {
                console.log(`[Mercado Pago Webhook] Payment ${paymentId} status is '${paymentDetails.status}'. No update needed.`);
            }

        } catch (error) {
            console.error(`[Mercado Pago Webhook] Error processing payment ${paymentId}:`, error);
            response.status(500).send("Internal server error while processing webhook.");
            return;
        }
    }

    response.status(200).send("OK");
  });

    