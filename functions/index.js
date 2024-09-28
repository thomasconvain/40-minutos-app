const functions = require("firebase-functions");
const cors = require("cors")({origin: true});
const {MercadoPagoConfig, Preference, Payment} = require("mercadopago");

// Inicializa el cliente de Mercado Pago con el access token
const client = new MercadoPagoConfig({
  accessToken: functions.config().mercadopago.token_dev,
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

