const functions = require("firebase-functions");
const cors = require("cors")({origin: true});
const {MercadoPagoConfig, Preference, Payment} = require("mercadopago");

// Inicializa el cliente de Mercado Pago con el access token
const client = new MercadoPagoConfig({
  accessToken: functions.config().mercadopago.token,
  options: {timeout: 5000},
});

exports.createPaymentLink = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const {amount, description, email, backUrls} = req.body;


    const preference = {
      items: [
        {
          title: description || "Pago de servicio",
          quantity: 1,
          currency_id: "CLP",
          unit_price: parseFloat(amount),
        },
      ],
      payer: {
        email: email,
      },
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

exports.getPaymentDetails = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    const paymentId = req.query.payment_id;

    try {
      const payment = new Payment(client);
      const paymentResponse = await payment.get({id: paymentId});
      // eslint-disable-next-line max-len
      const amountPaid = paymentResponse.transaction_details.total_paid_amount;

      // Aquí puedes devolver la información que necesites
      res.status(200).send({amount: amountPaid, payment: paymentResponse.body});
    } catch (error) {
      console.error("Error al obtener el pago:", error);
      // eslint-disable-next-line max-len
      res.status(500).send({error: "No se pudo obtener la información del pago"});
    }
  });
});

// Brevo Email Sending Function
const axios = require("axios");

const apiKey = functions.config().brevo.api_key;
const headers = {
  "api-key": apiKey,
  "Content-Type": "application/json",
};

exports.sendEmailWithBrevo = functions.https.onCall(async (data, context) => {
  const {to, params, templateId, newEventId} = data;

  try {
    let currentSubscribedEvents = [];

    // 1. Intentar obtener contacto
    try {
      const contactRes = await axios.get(`https://api.brevo.com/v3/contacts/${to}`, {headers});

      if (contactRes.data?.attributes?.SUBSCRIBED_EVENTS) {
        currentSubscribedEvents = contactRes.data.attributes
            .SUBSCRIBED_EVENTS.split(",")
            .map((e) => e.trim());
      }
    } catch (err) {
      // Si el contacto no existe, ignoramos el error
      if (err.response?.data?.code !== "document_not_found") {
        throw err; // Si es otro error, lo lanzamos
      }
    }

    // 2. Añadir nuevo evento si no existe aún
    if (!currentSubscribedEvents.includes(newEventId)) {
      currentSubscribedEvents.push(newEventId);
    }

    // 3. Crear o actualizar el contacto
    await axios.post("https://api.brevo.com/v3/contacts", {
      email: to,
      attributes: {
        NOMBRE: params.name || "",
        APELLIDOS: params.surname || "",
        SMS: params.phone || "",
        WHATSAPP: params.phone || "",
        FIREBASE_ID: params.firebaseId || "",
        SUBSCRIBED_EVENTS: currentSubscribedEvents.join(","),
      },
      listIds: [2], // tu ID real de lista
      updateEnabled: true,
    }, {headers});

    // 4. Enviar el correo
    await axios.post("https://api.brevo.com/v3/smtp/email", {
      to: [{email: to}],
      templateId,
      params,
      headers: {"X-Mailin-custom": "Firebase Function"},
    }, {headers});

    return {success: true};
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    throw new functions.https.HttpsError("internal", error.message);
  }
});


