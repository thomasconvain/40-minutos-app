<template>
  <div class="payment-container">
    <input v-model="amount" placeholder="Ingresa el monto" type="number" />
    <button @click="generatePaymentLink">Generar Link de Pago</button>
    <div v-if="paymentLink">
      <a :href="paymentLink" target="_blank">Pagar con Mercado Pago</a>
    </div>
  </div>
</template>

<script>
import { createPaymentLink } from '@/services/mercadoPago';

export default {
  data() {
    return {
      amount: '',
      paymentLink: null,
    };
  },
  methods: {
    async generatePaymentLink() {
      try {
        this.paymentLink = await createPaymentLink(this.amount);
      } catch (error) {
        alert('Error al generar el link de pago.');
      }
    },
  },
};
</script>

<style scoped>
.payment-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  text-align: center;
}
</style>
