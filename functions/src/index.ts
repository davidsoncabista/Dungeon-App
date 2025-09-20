import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { setDate, subMonths } from "date-fns";
import * as crypto from "crypto";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Inicializa o Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// --- As suas outras funções (createUserDocument, setAdminClaim, etc.) ---
// ... O seu código para as outras funções permanece aqui ...
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

/**
 * Função Chamável (onCall) para criar uma preferência de pagamento no Mercado Pago.
 */
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
        throw new functions.https.HttpsError("unauthenticated", "O utilizador precisa de estar autenticado.");
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
            }
        });

        // Retorna o ID da preferência para o SDK do frontend
        return { preferenceId: preferenceResponse.id };

    } catch (error: any) {
        console.error("Erro ao criar preferência de pagamento no Mercado Pago:", error);
        if (error.cause) console.error("Detalhes do erro:", error.cause);
        throw new functions.https.HttpsError("internal", "Ocorreu um erro inesperado ao processar o seu pagamento.");
    }
  });


/**
 * Endpoint de Webhook para receber notificações do Mercado Pago.
 */
export const mercadoPagoWebhook = functions
  .region("southamerica-east1")
  .https.onRequest(async (request, response) => {
    
    console.log("[Mercado Pago Webhook] Notificação recebida:", JSON.stringify(request.body));
    console.log("[Mercado Pago Webhook] Cabeçalhos recebidos:", JSON.stringify(request.headers));

    const mercadopagoConfig = functions.config().mercadopago;
    const webhookSecret = mercadopagoConfig ? mercadopagoConfig.webhook_secret : undefined;

    if (webhookSecret) {
        try {
            const signature = request.headers["x-signature"];
            const requestId = request.headers["x-request-id"];

            if (typeof signature === 'string' && typeof requestId === 'string') {
                const timestampHeaderPart = requestId.toString().split(',').find(part => part.trim().startsWith('ts='));
                const timestamp = timestampHeaderPart ? timestampHeaderPart.split('=')[1] : null;

                if (timestamp && request.body.data?.id) {
                    const signatureParts = signature.split(',');
                    if (signatureParts.length < 2 || !signatureParts[1]) {
                        throw new Error("Formato de assinatura inválido. Hash em falta.");
                    }
                    const hash = signatureParts[1];
                    const providedHash = hash.replace('v1=', '');
                    const signedTemplate = `id:${request.body.data.id};request-id:${requestId};ts:${timestamp};`;

                    const hmac = crypto.createHmac('sha256', webhookSecret);
                    hmac.update(signedTemplate);
                    const calculatedHash = hmac.digest('hex');

                    if (calculatedHash !== providedHash) {
                        console.warn("Falha na verificação da assinatura do Webhook. Assinatura inválida.");
                        response.status(400).send("Falha na verificação da assinatura.");
                        return;
                    }
                    console.log("Assinatura do Webhook verificada com sucesso.");
                } else {
                    console.log("A simulação do Webhook não contém todos os cabeçalhos para validação, a prosseguir sem validação.");
                }
            } else {
                 console.log("Cabeçalhos de assinatura ausentes, provavelmente é uma simulação. A prosseguir sem validação.");
            }
        } catch (error: any) {
            console.error("Erro durante a validação da assinatura:", error.message);
            response.status(400).send("Erro de validação da assinatura.");
            return;
        }
    } else {
        console.warn("Segredo do Webhook não configurado. A notificação não foi validada.");
    }

    const { body } = request;
    const paymentId = body.data?.id;

    if (body.type === "payment" && paymentId) {
        console.log(`[Mercado Pago Webhook] A processar o ID do pagamento: ${paymentId}`);
        try {
            const accessToken = mercadopagoConfig.access_token;
            if (!accessToken) {
                console.error("Token de Acesso do Mercado Pago não configurado no servidor.");
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
                throw new Error(`Falha ao buscar detalhes do pagamento: ${paymentResponse.status} ${errorText}`);
            }

            const paymentDetails = await paymentResponse.json() as any;
            const transactionId = paymentDetails.external_reference;

            if (!transactionId) {
                console.error("Erro no Webhook: external_reference não encontrada nos detalhes do pagamento.", paymentId);
                response.status(400).send("Erro no Webhook: external_reference em falta.");
                return;
            }

            if (paymentDetails.status === "approved") {
                const transactionRef = db.collection("transactions").doc(transactionId);
                await transactionRef.update({
                    status: "Pago",
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`[Mercado Pago Webhook] A transação ${transactionId} foi marcada como paga com sucesso.`);
            } else {
                console.log(`[Mercado Pago Webhook] O status do pagamento ${paymentId} é '${paymentDetails.status}'. Nenhuma atualização necessária.`);
            }

        } catch (error: any) {
            console.error(`[Mercado Pago Webhook] Erro ao processar o pagamento ${paymentId}:`, error);
            response.status(500).send("Erro interno do servidor ao processar o webhook.");
            return;
        }
    } else {
        console.log("Tipo de evento não processado ou ID de dados em falta:", body.type);
    }
    
    response.status(200).send("OK");
  });

