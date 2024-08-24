const functions = require("firebase-functions");
const mercadopago = require("mercadopago");

// Configurar Mercado Pago con el token almacenado en Firebase Functions
mercadopago.configurations.setAccessToken(functions.config().mercadopago.token);

exports.createPaymentLink = functions.https.onRequest(async (req, res) => {
  const {amount} = req.body;

  const preference = {
    items: [
      {
        title: "Pago de servicio",
        quantity: 1,
        currency_id: "ARS",
        unit_price: parseFloat(amount),
      },
    ],
    back_urls: {
      success: "https://tusitio.com/success",
      failure: "https://tusitio.com/failure",
      pending: "https://tusitio.com/pending",
    },
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    res.json({init_point: response.body.init_point});
  } catch (error) {
    console.error("Error al crear el link de pago:", error);
    res.status(500).send("Error al crear el link de pago");
  }
});
