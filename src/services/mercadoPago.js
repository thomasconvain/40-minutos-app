export const createPaymentLink = async ({ amount, description, paymentMethodId, email, backUrls}) => {
  try {
    const response = await fetch('https://us-central1-minutos-87fe9.cloudfunctions.net/createPaymentLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description,
        paymentMethodId,
        email,
        backUrls
      }),
    });

    if (!response.ok) {
      throw new Error('Error al crear el link de pago');
    }

    const data = await response.json();
    return data.init_point;
  } catch (error) {
    console.error('Error:', error);
    throw error;  // Lanza el error para manejarlo en el componente si es necesario
  }
};
