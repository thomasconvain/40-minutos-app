export const createPaymentLink = async (amount) => {
  try {
    const response = await fetch('https://us-central1-tu-proyecto.cloudfunctions.net/createPaymentLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();
    return data.init_point;
  } catch (error) {
    console.error('Error al generar el link de pago:', error);
    throw error;
  }
};