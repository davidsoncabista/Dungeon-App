
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { setDate, subMonths } from "date-fns";
import Stripe from "stripe";

// Inicializa o Firebase Admin SDK para que as funções tenham acesso aos serviços.
admin.initializeApp();
const db = admin.firestore();

// Inicializa o cliente Stripe de forma segura.
let stripe: Stripe;
const stripeConfig = functions.config().stripe;
if (stripeConfig && stripeConfig.secret) {
    stripe = new Stripe(stripeConfig.secret, {
      apiVersion: "2024-06-20",
    });
} else {
    console.warn("Stripe secret key not found. Stripe functionality will be disabled.");
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
    // Se o documento `after` não existe, a reserva foi deletada. Nenhuma ação a tomar.
    if (!change.after.exists) {
      console.log(`[Bookings] A reserva ${bookingId} foi excluída. Nenhuma ação adicional.`);
      return null;
    }

    // --- A partir daqui, a reserva FOI CRIADA OU ATUALIZADA ---
    const newData = change.after.data();

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
    // Pega os dados antigos apenas se eles existirem (caso de atualização).
    const oldData = change.before.exists ? change.before.data() : null;
    const newGuests = newData.guests || [];
    const oldGuests = oldData ? (oldData.guests || []) : [];

    // Se for uma atualização e a lista de convidados não mudou, não faz nada
    if (change.before.exists && JSON.stringify(newGuests) === JSON.stringify(oldGuests)) {
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
    
    if (!stripe) {
      console.error("Stripe não foi inicializado. Verifique a configuração da chave secreta.");
      response.status(500).send("Erro de configuração do servidor.");
      return;
    }

    const sig = request.headers["stripe-signature"];
    const webhookSecret = stripeConfig?.webhook_secret;

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
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    response.status(200).send();
  });


/**
 * Função Chamável (onCall) para criar uma sessão de pagamento PIX no Stripe.
 */
export const createPixPayment = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    // Verifica se o Stripe está configurado
    if (!stripe) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "A funcionalidade de pagamento não está configurada no servidor."
        );
    }
    // Verifica se o usuário está autenticado
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "O usuário precisa estar autenticado para realizar pagamentos."
        );
    }

    const { transactionId } = data;
    if (!transactionId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "O ID da transação é obrigatório."
        );
    }

    try {
        // Busca a transação no Firestore
        const transactionRef = db.collection("transactions").doc(transactionId);
        const transactionDoc = await transactionRef.get();

        if (!transactionDoc.exists) {
            throw new functions.https.HttpsError("not-found", "A transação não foi encontrada.");
        }

        const transactionData = transactionDoc.data()!;
        
        // Verifica se o usuário que chama é o dono da transação
        if (transactionData.userId !== context.auth.uid) {
             throw new functions.https.HttpsError(
                "permission-denied",
                "Você não tem permissão para pagar esta transação."
            );
        }
        
        if (transactionData.status === 'Pago') {
             throw new functions.https.HttpsError(
                "failed-precondition",
                "Esta cobrança já foi paga."
            );
        }

        // Cria a sessão de checkout no Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["pix"],
            line_items: [
                {
                    price_data: {
                        currency: "brl",
                        product_data: {
                            name: transactionData.description,
                        },
                        unit_amount: Math.round(transactionData.amount * 100), // O valor deve ser em centavos
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            // TODO: Substituir por URLs reais do seu app
            success_url: `https://adbelm.web.app/billing?payment_success=true`,
            cancel_url: `https://adbelm.web.app/billing?payment_canceled=true`,
            // Associa o ID da transação do Firestore à sessão do Stripe
            metadata: {
                transaction_id: transactionId,
            },
        });

        const paymentIntent = session.payment_intent;
        
        if (typeof paymentIntent !== 'string') {
             throw new functions.https.HttpsError("internal", "Falha ao obter detalhes do pagamento.");
        }

        // Recupera o PaymentIntent para obter os dados do PIX
        const intent = await stripe.paymentIntents.retrieve(paymentIntent);
        const pixData = intent.next_action?.pix_display_qr_code;

        if (!pixData) {
             throw new functions.https.HttpsError("internal", "Não foi possível gerar os dados do PIX.");
        }

        // Retorna os dados do PIX para o frontend
        return {
            qrCodeUrl: pixData.image_url_png,
            qrCodeText: pixData.data,
        };

    } catch (error: any) {
        console.error("Erro ao criar pagamento PIX:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Ocorreu um erro inesperado ao processar seu pagamento.");
    }
  });

    