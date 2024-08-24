<template>
  <div>
    <input v-model="amount" type="number" placeholder="Monto" />
    <!-- <input v-model="description" type="text" placeholder="Descripción" /> -->
    <input v-model="email" type="email" placeholder="Email" />
    <button @click="generatePaymentLink">Generar Link de Pago</button>
    
    <div v-if="paymentLink">
      <p>Link de pago generado:</p>
      <a :href="paymentLink" target="_blank">Pagar</a>
    </div>
  </div>
</template>

<script>
import { createPaymentLink } from '@/services/mercadoPago';

export default {
  data() {
    return {
      amount: 0,
      description: 'Prueba- Paga por tu experienccia 40 Minuto',
      email: '',
      paymentLink: '',
    };
  },
  methods: {
    async generatePaymentLink() {
      try {
        this.paymentLink = await createPaymentLink({
          amount: this.amount,
          description: this.description,
          email: this.email,
        });
      } catch (error) {
        alert('Hubo un problema al generar el link de pago.');
      }
    },
  },
};
</script>
