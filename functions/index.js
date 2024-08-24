const functions = require("firebase-functions");
const cors = require("cors")({origin: true}); // Importar y configurar CORS
const {MercadoPagoConfig, Payment} = require("mercadopago");

// Inicializar el cliente de Mercado Pago con el access token
const client = new MercadoPagoConfig({
  accessToken: functions.config().mercadopago.token,
  options: {timeout: 5000},
});

exports.createPaymentLink = functions.https.onRequest((req, res) => {
  cors(req, res, async () => { // Envolver la función con CORS
    const {amount, description, email, paymentMethodId} = req.body;

    const body = {
      transaction_amount: parseFloat(amount),
      description: description || "Pago de servicio",
      payment_method_id: paymentMethodId || "visa",
      payer: {
        email: email || "test@example.com",
      },
    };

    const requestOptions = {
      idempotencyKey: "some-unique-key",
    };

    try {
      const payment = new Payment(client);
      const response = await payment.create({body, requestOptions});
      res.json({init_point: response.body.init_point});
    } catch (error) {
      console.error("Error al crear el link de pago:", error);
      res.status(500).send("Error al crear el link de pago");
    }
  });
});
