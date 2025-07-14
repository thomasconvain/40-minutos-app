const functions = require("firebase-functions");
const cors = require("cors")({origin: true});
const {MercadoPagoConfig, Preference, Payment} = require("mercadopago");
// const axios = require("axios"); // COMMENTED OUT - ONLY USED FOR BREVO EMAILS
const admin = require("firebase-admin");

// Inicializa Firebase Admin si no está ya inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Inicializa Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: functions.config().mercadopago.token,
  options: {timeout: 5000},
});

// === 1. CREAR LINK DE PAGO ===
exports.createPaymentLink = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const {amount, description, email, backUrls} = req.body;

    const preference = {
      items: [{
        title: description || "Pago de servicio",
        quantity: 1,
        currency_id: "CLP",
        unit_price: parseFloat(amount),
      }],
      payer: {email},
      back_urls: backUrls,
      auto_return: "approved",
    };

    try {
      const preferenceAPI = new Preference(client);
      const response = await preferenceAPI.create({body: preference});
      res.json({init_point: response.init_point});
    } catch (error) {
      console.error("Error al crear el link de pago:", error);
      res.status(500).send("Error al crear el link de pago");
    }
  });
});

// === 2. OBTENER DETALLES DEL PAGO ===
exports.getPaymentDetails = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    const paymentId = req.query.payment_id;

    try {
      const payment = new Payment(client);
      const paymentResponse = await payment.get({id: paymentId});
      const amountPaid = paymentResponse.transaction_details.total_paid_amount;

      res.status(200).send({
        amount: amountPaid,
        payment: paymentResponse.body,
      });
    } catch (error) {
      console.error("Error al obtener el pago:", error);
      res.status(500).send({
        error: "No se pudo obtener la información del pago",
      });
    }
  });
});

// === 3. ENVIAR CORREO CON BREVO === - COMMENTED OUT TO DISABLE BREVO EMAILS
// const apiKey = functions.config().brevo.api_key;
// const headers = {
//   "api-key": apiKey,
//   "Content-Type": "application/json",
// };
// 
// exports.sendEmailWithBrevo = functions.https.onCall(async (data, context) => {
//   const {to, params, templateId, newEventId} = data;
// 
//   try {
//     let currentSubscribedEvents = [];
// 
//     try {
//       const contactRes = await axios.get(`https://api.brevo.com/v3/contacts/${to}`, {headers});
//       if (contactRes.data?.attributes?.SUBSCRIBED_EVENTS) {
//         currentSubscribedEvents = contactRes.data.attributes
//             .SUBSCRIBED_EVENTS.split(",")
//             .map((e) => e.trim());
//       }
//     } catch (err) {
//       if (err.response?.data?.code !== "document_not_found") throw err;
//     }
// 
//     if (!currentSubscribedEvents.includes(newEventId)) {
//       currentSubscribedEvents.push(newEventId);
//     }
// 
//     await axios.post("https://api.brevo.com/v3/contacts", {
//       email: to,
//       attributes: {
//         NOMBRE: params.name || "",
//         APELLIDOS: params.surname || "",
//         SMS: params.phone || "",
//         WHATSAPP: params.phone || "",
//         FIREBASE_ID: params.firebaseId || "",
//         SUBSCRIBED_EVENTS: currentSubscribedEvents.join(","),
//       },
//       listIds: [2],
//       updateEnabled: true,
//     }, {headers});
// 
//     await axios.post("https://api.brevo.com/v3/smtp/email", {
//       to: [{email: to}],
//       templateId,
//       params,
//       headers: {"X-Mailin-custom": "Firebase Function"},
//     }, {headers});
// 
//     return {success: true};
//   } catch (error) {
//     console.error("Error:", error.response?.data || error.message);
//     throw new functions.https.HttpsError("internal", error.message);
//   }
// });

// === 4. LIMPIAR EVENT SPECTATORS AL BORRAR USUARIO ===
exports.cleanUpEventSpectators = functions.auth.user().onDelete(
    async (user) => {
      const uid = user.uid;

      try {
        const eventsSnapshot = await db.collection("events").get();
        const batch = db.batch();

        eventsSnapshot.forEach((doc) => {
          const data = doc.data();
          const eventSpectators = data.eventSpectators || [];

          const updatedSpectators = eventSpectators.filter(
              (spectator) => spectator.id !== uid,
          );

          if (updatedSpectators.length !== eventSpectators.length) {
            batch.update(doc.ref, {eventSpectators: updatedSpectators});
            console.log(
                `Actualizado evento ${doc.id}: usuario ${uid} removido.`,
            );
          }
        });

        await batch.commit();
        console.log(`Usuario ${uid} eliminado de todos los eventos.`);
      } catch (err) {
        console.error("Error al limpiar eventSpectators:", err);
      }
    });
