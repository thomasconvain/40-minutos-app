const functions = require("firebase-functions");
const cors = require("cors")({origin: true});
const {MercadoPagoConfig, Preference} = require("mercadopago");

// Inicializa el cliente de Mercado Pago con el access token
const client = new MercadoPagoConfig({
  accessToken: functions.config().mercadopago.token,
  options: {timeout: 5000},
});

exports.createPaymentLink = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const {amount, description, email} = req.body;

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
      back_urls: {
        success: "https://cuarenta-minutos.web.app/",
        failure: "https://cuarenta-minutos.web.app/",
        pending: "https://cuarenta-minutos.web.app/",
      },
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
