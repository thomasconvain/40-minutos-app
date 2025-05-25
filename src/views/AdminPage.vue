<template>
  <div>
    <!-- Header similar al Home -->
    <div class="flex flex-row items-center justify-between mb-10">
      <img src="../assets/logo_horizontal.png" width="150" />
      <button class="btn bg-white border-none" @click="logout">Cerrar sesión</button>
    </div>
    
    <h1 class="justify-self-start text-2xl text-black font-bold mb-6">Resultados</h1>

    <!-- Verificando autorización -->
    <div v-if="isCheckingAuth" class="text-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="mt-2 text-black">Verificando acceso...</p>
    </div>

    <!-- Usuario no autorizado -->
    <div v-else-if="!isAuthorized" class="text-center py-8">
      <div class="mx-auto w-full max-w-screen-xl rounded-2xl bg-white p-6 md:p-8 shadow-xl">
        <h2 class="text-xl font-bold text-black mb-4">Acceso Restringido</h2>
        <p class="text-black mb-4">No tienes permisos para acceder a esta página.</p>
        <button class="btn bg-black text-white hover:bg-gray-800" @click="logout">
          Cerrar Sesión
        </button>
      </div>
    </div>

    <!-- Cargando datos -->
    <div v-else-if="isLoading" class="text-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="mt-2 text-black">Cargando datos financieros...</p>
    </div>

    <!-- Contenido autorizado -->
    <div v-else>
      <!-- Tabs para Eventos Activos/Inactivos/Test -->
      <div class="mx-auto max-w-screen-xl mb-4">
        <div class="tabs-boxed w-full">
          <div role="tablist" class="tabs tabs-lifted tab-container w-full">
            <a role="tab" class="tab tab-responsive flex-1" :class="{ 'tab-active bg-gray-200': activeTab === 'activos' }" @click="activeTab = 'activos'">
              <span class="text-black">Activos ({{ activeEvents.length }})</span>
            </a>
            <a role="tab" class="tab tab-responsive flex-1" :class="{ 'tab-active bg-gray-200': activeTab === 'inactivos' }" @click="activeTab = 'inactivos'">
              <span class="text-black">Cerrado ({{ inactiveEvents.length }})</span>
            </a>
            <a role="tab" class="tab tab-responsive flex-1" :class="{ 'tab-active bg-gray-200': activeTab === 'test' }" @click="activeTab = 'test'">
              <span class="text-black">Test ({{ testEvents.length }})</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Contenido de Eventos Activos -->
      <div v-if="activeTab === 'activos'">
        <section class="pt-6 pb-4">
          <div class="mx-auto max-w-screen-xl">
            <div v-if="activeEvents.length === 0" class="text-center py-8">
              <p class="text-lg text-black">No hay eventos activos</p>
            </div>
            
            <!-- Carrusel de eventos activos -->
            <div v-else class="relative w-full overflow-hidden">
              <div class="carousel carousel-center w-full rounded-box gap-4" id="activeCarousel">
                <div v-for="event in activeEvents" :key="event.id" class="carousel-item w-full mx-auto">
                  <!-- Tarjeta de evento con datos financieros -->
                  <div class="bg-white text-black shadow-xl rounded-xl w-full p-6">
                    <!-- Header del evento -->
                    <div class="mb-4">
                      <h2 class="text-xl font-bold text-black mb-2">{{ getEventName(event) }}</h2>
                      <div class="text-sm text-black mb-2">{{ formatDate(event.date) }}</div>
                      <div class="flex gap-2">
                        <div class="badge" :class="event.settings?.isActive ? 'badge-success' : 'badge-neutral'">
                          {{ event.settings?.isActive ? 'Activo' : 'Inactivo' }}
                        </div>
                        <div class="badge badge-info">
                          {{ event.zSpectator?.length || 0 }} reservas
                        </div>
                      </div>
                      
                      <!-- Ganancia Neta destacada -->
                      <div class="mt-4 p-3 bg-gray-100 rounded-lg">
                        <div class="text-sm text-black">Ganancia Neta</div>
                        <div class="text-2xl font-bold text-black">
                          ${{ formatCurrency(getEventNetProfit(event)) }}
                        </div>
                      </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Tablas financieras -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                      <!-- Tabla de Ingresos -->
                      <div>
                        <h3 class="text-lg font-semibold mb-3 text-black">💰 Ingresos</h3>
                        <div class="overflow-x-auto">
                          <table class="table table-sm">
                            <thead>
                              <tr>
                                <th class="text-black">Método</th>
                                <th class="text-right text-black">Cant.</th>
                                <th class="text-right text-black">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td class="text-black">Mercado Pago</td>
                                <td class="text-right text-black">{{ event.revenue?.mercadoPago?.count || 0 }}</td>
                                <td class="text-right font-semibold text-black">${{ formatCurrency(event.revenue?.mercadoPago?.amount || 0) }}</td>
                              </tr>
                              <tr>
                                <td class="text-black">Transferencia</td>
                                <td class="text-right text-black">{{ event.revenue?.bankTransfer?.count || 0 }}</td>
                                <td class="text-right font-semibold text-black">${{ formatCurrency(event.revenue?.bankTransfer?.amount || 0) }}</td>
                              </tr>
                              <tr>
                                <td class="text-black">Efectivo</td>
                                <td class="text-right text-black">{{ event.revenue?.cash?.count || 0 }}</td>
                                <td class="text-right font-semibold text-black">${{ formatCurrency(event.revenue?.cash?.amount || 0) }}</td>
                              </tr>
                              <tr class="border-t-2">
                                <td class="font-bold text-black">Total</td>
                                <td class="text-right font-bold text-black">{{ getTotalPayments(event) }}</td>
                                <td class="text-right font-bold text-black">${{ formatCurrency(getTotalRevenue(event)) }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <!-- Tabla de Costos -->
                      <div>
                        <h3 class="text-lg font-semibold mb-3 text-black">💸 Costos</h3>
                        <div class="overflow-x-auto">
                          <table class="table table-sm">
                            <thead>
                              <tr>
                                <th class="text-black">Concepto</th>
                                <th class="text-right text-black">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              <template v-if="event.expenditures && event.expenditures.length > 0">
                                <tr v-for="expenditure in event.expenditures" :key="expenditure.id">
                                  <td class="text-black">{{ expenditure.description || 'Sin descripción' }}</td>
                                  <td class="text-right font-semibold text-black">${{ formatCurrency(expenditure.amount || 0) }}</td>
                                </tr>
                                <tr class="border-t-2">
                                  <td class="font-bold text-black">Total</td>
                                  <td class="text-right font-bold text-black">${{ formatCurrency(getTotalCosts(event)) }}</td>
                                </tr>
                              </template>
                              <tr v-else>
                                <td colspan="2" class="text-center text-black">No hay costos registrados</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            
              <!-- Botones de navegación activos -->
              <div v-if="activeEvents.length > 1" class="flex justify-center mt-4 gap-3">
                <button 
                  class="btn btn-circle btn-sm" 
                  :class="{'btn-primary': activeCarouselPosition > 0, 'opacity-50': activeCarouselPosition === 0}"
                  :disabled="activeCarouselPosition === 0"
                  @click="scrollCarousel('activeCarousel', 'prev', 'active')"
                >❮</button>
                <button 
                  class="btn btn-circle btn-sm" 
                  :class="{'btn-primary': activeCarouselPosition < activeEvents.length - 1, 'opacity-50': activeCarouselPosition >= activeEvents.length - 1}"
                  :disabled="activeCarouselPosition >= activeEvents.length - 1"
                  @click="scrollCarousel('activeCarousel', 'next', 'active')"
                >❯</button>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <!-- Contenido de Eventos Inactivos -->
      <div v-if="activeTab === 'inactivos'">
        <section class="pt-6 pb-4">
          <div class="mx-auto max-w-screen-xl">
            <div v-if="inactiveEvents.length === 0" class="text-center py-8">
              <p class="text-lg text-black">No hay eventos inactivos</p>
            </div>
            
            <!-- Carrusel de eventos inactivos -->
            <div v-else class="relative w-full overflow-hidden">
              <div class="carousel carousel-center w-full rounded-box gap-4" id="inactiveCarousel">
                <div v-for="event in inactiveEvents" :key="event.id" class="carousel-item w-full mx-auto">
                  <!-- Tarjeta de evento con datos financieros -->
                  <div class="bg-white text-black shadow-xl rounded-xl w-full p-6">
                    <!-- Header del evento -->
                    <div class="mb-4">
                      <h2 class="text-xl font-bold text-black mb-2">{{ getEventName(event) }}</h2>
                      <div class="text-sm text-black mb-2">{{ formatDate(event.date) }}</div>
                      <div class="flex gap-2">
                        <div class="badge" :class="event.settings?.isActive ? 'badge-success' : 'badge-neutral'">
                          {{ event.settings?.isActive ? 'Activo' : 'Inactivo' }}
                        </div>
                        <div class="badge badge-info">
                          {{ event.zSpectator?.length || 0 }} reservas
                        </div>
                      </div>
                      
                      <!-- Ganancia Neta destacada -->
                      <div class="mt-4 p-3 bg-gray-100 rounded-lg">
                        <div class="text-sm text-black">Ganancia Neta</div>
                        <div class="text-2xl font-bold text-black">
                          ${{ formatCurrency(getEventNetProfit(event)) }}
                        </div>
                      </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Tablas financieras -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                      <!-- Tabla de Ingresos -->
                      <div>
                        <h3 class="text-lg font-semibold mb-3 text-black">💰 Ingresos</h3>
                        <div class="overflow-x-auto">
                          <table class="table table-sm">
                            <thead>
                              <tr>
                                <th class="text-black">Método</th>
                                <th class="text-right text-black">Cant.</th>
                                <th class="text-right text-black">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td class="text-black">Mercado Pago</td>
                                <td class="text-right text-black">{{ event.revenue?.mercadoPago?.count || 0 }}</td>
                                <td class="text-right font-semibold text-black">${{ formatCurrency(event.revenue?.mercadoPago?.amount || 0) }}</td>
                              </tr>
                              <tr>
                                <td class="text-black">Transferencia</td>
                                <td class="text-right text-black">{{ event.revenue?.bankTransfer?.count || 0 }}</td>
                                <td class="text-right font-semibold text-black">${{ formatCurrency(event.revenue?.bankTransfer?.amount || 0) }}</td>
                              </tr>
                              <tr>
                                <td class="text-black">Efectivo</td>
                                <td class="text-right text-black">{{ event.revenue?.cash?.count || 0 }}</td>
                                <td class="text-right font-semibold text-black">${{ formatCurrency(event.revenue?.cash?.amount || 0) }}</td>
                              </tr>
                              <tr class="border-t-2">
                                <td class="font-bold text-black">Total</td>
                                <td class="text-right font-bold text-black">{{ getTotalPayments(event) }}</td>
                                <td class="text-right font-bold text-black">${{ formatCurrency(getTotalRevenue(event)) }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <!-- Tabla de Costos -->
                      <div>
                        <h3 class="text-lg font-semibold mb-3 text-black">💸 Costos</h3>
                        <div class="overflow-x-auto">
                          <table class="table table-sm">
                            <thead>
                              <tr>
                                <th class="text-black">Concepto</th>
                                <th class="text-right text-black">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              <template v-if="event.expenditures && event.expenditures.length > 0">
                                <tr v-for="expenditure in event.expenditures" :key="expenditure.id">
                                  <td class="text-black">{{ expenditure.description || 'Sin descripción' }}</td>
                                  <td class="text-right font-semibold text-black">${{ formatCurrency(expenditure.amount || 0) }}</td>
                                </tr>
                                <tr class="border-t-2">
                                  <td class="font-bold text-black">Total</td>
                                  <td class="text-right font-bold text-black">${{ formatCurrency(getTotalCosts(event)) }}</td>
                                </tr>
                              </template>
                              <tr v-else>
                                <td colspan="2" class="text-center text-black">No hay costos registrados</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            
              <!-- Botones de navegación inactivos -->
              <div v-if="inactiveEvents.length > 1" class="flex justify-center mt-4 gap-3">
                <button 
                  class="btn btn-circle btn-sm" 
                  :class="{'btn-primary': inactiveCarouselPosition > 0, 'opacity-50': inactiveCarouselPosition === 0}"
                  :disabled="inactiveCarouselPosition === 0"
                  @click="scrollCarousel('inactiveCarousel', 'prev', 'inactive')"
                >❮</button>
                <button 
                  class="btn btn-circle btn-sm" 
                  :class="{'btn-primary': inactiveCarouselPosition < inactiveEvents.length - 1, 'opacity-50': inactiveCarouselPosition >= inactiveEvents.length - 1}"
                  :disabled="inactiveCarouselPosition >= inactiveEvents.length - 1"
                  @click="scrollCarousel('inactiveCarousel', 'next', 'inactive')"
                >❯</button>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <!-- Contenido de Eventos Test -->
      <div v-if="activeTab === 'test'">
        <section class="pt-6 pb-4">
          <div class="mx-auto max-w-screen-xl">
            <div v-if="testEvents.length === 0" class="text-center py-8">
              <p class="text-lg text-black">No hay eventos de test</p>
            </div>
            
            <div v-else class="relative w-full overflow-hidden">
              <div class="carousel carousel-center w-full rounded-box gap-4" id="testCarousel">
                <div v-for="event in testEvents" :key="event.id" class="carousel-item w-full mx-auto">
                  <div class="bg-white text-black shadow-xl rounded-xl w-full p-6">
                    <div class="mb-4">
                      <h2 class="text-xl font-bold text-black mb-2">{{ getEventName(event) }}</h2>
                      <div class="text-sm text-black mb-2">{{ formatDate(event.date) }}</div>
                      <div class="flex gap-2">
                        <div class="badge badge-warning">Test</div>
                        <div class="badge badge-info">{{ event.zSpectator?.length || 0 }} reservas</div>
                      </div>
                      <div class="mt-4 p-3 bg-gray-100 rounded-lg">
                        <div class="text-sm text-black">Ganancia Neta</div>
                        <div class="text-2xl font-bold text-black">${{ formatCurrency(getEventNetProfit(event)) }}</div>
                      </div>
                    </div>
                    <div class="divider"></div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                      <div>
                        <h3 class="text-lg font-semibold mb-3 text-black">💰 Ingresos</h3>
                        <div class="overflow-x-auto">
                          <table class="table table-sm">
                            <thead>
                              <tr>
                                <th class="text-black">Método</th>
                                <th class="text-right text-black">Cant.</th>
                                <th class="text-right text-black">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td class="text-black">Mercado Pago</td>
                                <td class="text-right text-black">{{ event.revenue?.mercadoPago?.count || 0 }}</td>
                                <td class="text-right font-semibold text-black">${{ formatCurrency(event.revenue?.mercadoPago?.amount || 0) }}</td>
                              </tr>
                              <tr>
                                <td class="text-black">Transferencia</td>
                                <td class="text-right text-black">{{ event.revenue?.bankTransfer?.count || 0 }}</td>
                                <td class="text-right font-semibold text-black">${{ formatCurrency(event.revenue?.bankTransfer?.amount || 0) }}</td>
                              </tr>
                              <tr>
                                <td class="text-black">Efectivo</td>
                                <td class="text-right text-black">{{ event.revenue?.cash?.count || 0 }}</td>
                                <td class="text-right font-semibold text-black">${{ formatCurrency(event.revenue?.cash?.amount || 0) }}</td>
                              </tr>
                              <tr class="border-t-2">
                                <td class="font-bold text-black">Total</td>
                                <td class="text-right font-bold text-black">{{ getTotalPayments(event) }}</td>
                                <td class="text-right font-bold text-black">${{ formatCurrency(getTotalRevenue(event)) }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold mb-3 text-black">💸 Costos</h3>
                        <div class="overflow-x-auto">
                          <table class="table table-sm">
                            <thead>
                              <tr>
                                <th class="text-black">Concepto</th>
                                <th class="text-right text-black">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              <template v-if="event.expenditures && event.expenditures.length > 0">
                                <tr v-for="expenditure in event.expenditures" :key="expenditure.id">
                                  <td class="text-black">{{ expenditure.description || 'Sin descripción' }}</td>
                                  <td class="text-right font-semibold text-black">${{ formatCurrency(expenditure.amount || 0) }}</td>
                                </tr>
                                <tr class="border-t-2">
                                  <td class="font-bold text-black">Total</td>
                                  <td class="text-right font-bold text-black">${{ formatCurrency(getTotalCosts(event)) }}</td>
                                </tr>
                              </template>
                              <tr v-else>
                                <td colspan="2" class="text-center text-black">No hay costos registrados</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="testEvents.length > 1" class="flex justify-center mt-4 gap-3">
                <button class="btn btn-circle btn-sm" :class="{'btn-primary': testCarouselPosition > 0, 'opacity-50': testCarouselPosition === 0}" :disabled="testCarouselPosition === 0" @click="scrollCarousel('testCarousel', 'prev', 'test')">❮</button>
                <button class="btn btn-circle btn-sm" :class="{'btn-primary': testCarouselPosition < testEvents.length - 1, 'opacity-50': testCarouselPosition >= testEvents.length - 1}" :disabled="testCarouselPosition >= testEvents.length - 1" @click="scrollCarousel('testCarousel', 'next', 'test')">❯</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { format } from "date-fns";
import { es } from "date-fns/locale";

const router = useRouter();
const events = ref([]);
const isLoading = ref(true);
const venueNames = ref({});
const hostNames = ref({});
const assemblyNames = ref({});
const activeCarouselPosition = ref(0);
const inactiveCarouselPosition = ref(0);
const testCarouselPosition = ref(0);
const activeTab = ref('activos');
const isAuthorized = ref(false);
const isCheckingAuth = ref(true);

const AUTHORIZED_EMAIL = 'javier@alzares.cl';

const logout = async () => {
  try {
    await signOut(auth);
    console.log('Sesión cerrada con éxito');
    router.push('/login');
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message);
  }
};

const formatDate = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return "Fecha no disponible";
  }
  return format(timestamp.toDate(), "EEEE dd 'de' MMMM 'de' yyyy '|' HH:mm", {
    locale: es,
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const getEventName = (event) => {
  if (event._venueId && venueNames.value[event._venueId]) {
    return venueNames.value[event._venueId];
  }
  if (event.assemblyId && assemblyNames.value[event.assemblyId]) {
    return assemblyNames.value[event.assemblyId];
  }
  if (event.hostId && hostNames.value[event.hostId]) {
    return hostNames.value[event.hostId];
  }
  return "Evento sin nombre";
};

const getTotalRevenue = (event) => {
  if (!event.revenue) return 0;
  return (event.revenue.mercadoPago?.amount || 0) + 
         (event.revenue.bankTransfer?.amount || 0) + 
         (event.revenue.cash?.amount || 0);
};

const getTotalCosts = (event) => {
  if (!event.expenditures || !Array.isArray(event.expenditures)) return 0;
  return event.expenditures.reduce((sum, exp) => sum + (exp.amount || 0), 0);
};

const getTotalPayments = (event) => {
  if (!event.revenue) return 0;
  return (event.revenue.mercadoPago?.count || 0) + 
         (event.revenue.bankTransfer?.count || 0) + 
         (event.revenue.cash?.count || 0);
};

const getEventNetProfit = (event) => {
  return getTotalRevenue(event) - getTotalCosts(event);
};

const activeEvents = computed(() => {
  return events.value.filter(event => event.settings?.isActive && (event.settings?.isTest !== true));
});

const inactiveEvents = computed(() => {
  return events.value.filter(event => !event.settings?.isActive && !event.settings?.isTest);
});

const testEvents = computed(() => {
  return events.value.filter(event => event.settings?.isTest);
});

const fetchEvents = async () => {
  try {
    isLoading.value = true;
    console.log('Fetching events...');
    
    const querySnapshot = await getDocs(collection(db, "events"));
    
    console.log('Events found:', querySnapshot.docs.length);
    
    events.value = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('Event data:', doc.id, data);
      return {
        id: doc.id,
        ...data,
        revenue: {
          mercadoPago: { amount: 0, count: 0 },
          bankTransfer: { amount: 0, count: 0 },
          cash: { amount: 0, count: 0 }
        },
        expenditures: []
      };
    });
    
    // Ordenar manualmente por fecha
    events.value.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      try {
        return b.date.toDate() - a.date.toDate();
      } catch {
        return 0;
      }
    });
    
    console.log('Mapped events:', events.value.length);
    
    await Promise.all([
      fetchVenueNames(),
      fetchHostNames(),
      fetchAssemblyNames()
    ]);
    
    for (const event of events.value) {
      await fetchEventRevenue(event);
      await fetchEventExpenditures(event);
    }
  } catch (error) {
    console.error("Error fetching events:", error);
  } finally {
    isLoading.value = false;
  }
};

const fetchVenueNames = async () => {
  const venueIds = [...new Set(events.value.map(e => e._venueId).filter(Boolean))];
  for (const venueId of venueIds) {
    try {
      const venueDoc = await getDoc(doc(db, 'venues', venueId));
      if (venueDoc.exists()) {
        venueNames.value[venueId] = venueDoc.data().name || 'Lugar no disponible';
      }
    } catch (error) {
      console.error(`Error fetching venue ${venueId}:`, error);
    }
  }
};

const fetchHostNames = async () => {
  const hostIds = [...new Set(events.value.map(e => e.hostId).filter(Boolean))];
  for (const hostId of hostIds) {
    try {
      const hostDoc = await getDoc(doc(db, 'hosts', hostId));
      if (hostDoc.exists()) {
        hostNames.value[hostId] = hostDoc.data().name || '';
      }
    } catch (error) {
      console.error(`Error fetching host ${hostId}:`, error);
    }
  }
};

const fetchAssemblyNames = async () => {
  const assemblyIds = [...new Set(events.value.map(e => e.assemblyId).filter(Boolean))];
  for (const assemblyId of assemblyIds) {
    try {
      const assemblyDoc = await getDoc(doc(db, 'assembly', assemblyId));
      if (assemblyDoc.exists()) {
        assemblyNames.value[assemblyId] = assemblyDoc.data().name || 'Ensamble no disponible';
      }
    } catch (error) {
      console.error(`Error fetching assembly ${assemblyId}:`, error);
    }
  }
};

const fetchEventRevenue = async (event) => {
  try {
    // Consultar pagos por eventId para cada método
    const methods = ['mercadoPago', 'bankTransfer', 'cash'];
    
    for (const method of methods) {
      try {
        const q = query(
          collection(db, 'payments'),
          where('eventId', '==', event.id),
          where('method', '==', method)
        );
        
        const querySnapshot = await getDocs(q);
        
        let totalAmount = 0;
        let count = 0;
        
        querySnapshot.forEach(doc => {
          const payment = doc.data();
          totalAmount += payment.amount || 0;
          count++;
        });
        
        // Asignar los valores calculados
        if (method === 'mercadoPago') {
          event.revenue.mercadoPago.amount = totalAmount;
          event.revenue.mercadoPago.count = count;
        } else if (method === 'bankTransfer') {
          event.revenue.bankTransfer.amount = totalAmount;
          event.revenue.bankTransfer.count = count;
        } else if (method === 'cash') {
          event.revenue.cash.amount = totalAmount;
          event.revenue.cash.count = count;
        }
        
        console.log(`Event ${event.id} - ${method}: ${count} payments, $${totalAmount}`);
        
      } catch (methodError) {
        console.error(`Error fetching ${method} payments for event ${event.id}:`, methodError);
      }
    }
  } catch (error) {
    console.error(`Error fetching revenue for event ${event.id}:`, error);
  }
};

const fetchEventExpenditures = async (event) => {
  try {
    const q = query(
      collection(db, 'expenditures'),
      // Asumiendo que expenditures tiene un campo eventId
    );
    const querySnapshot = await getDocs(q);
    
    event.expenditures = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(exp => exp.eventId === event.id);
  } catch (error) {
    console.error(`Error fetching expenditures for event ${event.id}:`, error);
    event.expenditures = [];
  }
};

// Función para desplazar el carrusel
const scrollCarousel = (carouselId, direction, type) => {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;
  
  const scrollAmount = direction === 'next' ? carousel.offsetWidth : -carousel.offsetWidth;
  carousel.scrollBy({left: scrollAmount, behavior: 'smooth'});
  
  // Actualizar la posición después del desplazamiento
  if (type === 'active') {
    if (direction === 'next') {
      activeCarouselPosition.value++;
    } else {
      activeCarouselPosition.value--;
    }
  } else if (type === 'inactive') {
    if (direction === 'next') {
      inactiveCarouselPosition.value++;
    } else {
      inactiveCarouselPosition.value--;
    }
  } else if (type === 'test') {
    if (direction === 'next') {
      testCarouselPosition.value++;
    } else {
      testCarouselPosition.value--;
    }
  }
};

// Función para manejar el evento de scroll del carrusel
const handleCarouselScroll = (carouselId, type) => {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;
  
  // Calcular la posición actual basada en el desplazamiento
  const scrollLeft = carousel.scrollLeft;
  const itemWidth = carousel.offsetWidth;
  const newPosition = Math.round(scrollLeft / itemWidth);
  
  // Actualizar la posición solo si ha cambiado
  if (type === 'active' && newPosition !== activeCarouselPosition.value) {
    activeCarouselPosition.value = newPosition;
  } else if (type === 'inactive' && newPosition !== inactiveCarouselPosition.value) {
    inactiveCarouselPosition.value = newPosition;
  } else if (type === 'test' && newPosition !== testCarouselPosition.value) {
    testCarouselPosition.value = newPosition;
  }
};

const checkUserAuthorization = (user) => {
  if (!user) {
    isAuthorized.value = false;
    isCheckingAuth.value = false;
    router.push('/login');
    return;
  }

  if (user.email === AUTHORIZED_EMAIL) {
    isAuthorized.value = true;
    isCheckingAuth.value = false;
    // Solo cargar datos si el usuario está autorizado
    fetchEvents().then(() => {
      // Añadir event listeners para scroll de todos los carruseles
      const activeCarousel = document.getElementById('activeCarousel');
      const inactiveCarousel = document.getElementById('inactiveCarousel');
      const testCarousel = document.getElementById('testCarousel');
      
      if (activeCarousel) {
        activeCarousel.addEventListener('scroll', () => handleCarouselScroll('activeCarousel', 'active'));
      }
      if (inactiveCarousel) {
        inactiveCarousel.addEventListener('scroll', () => handleCarouselScroll('inactiveCarousel', 'inactive'));
      }
      if (testCarousel) {
        testCarousel.addEventListener('scroll', () => handleCarouselScroll('testCarousel', 'test'));
      }
    });
  } else {
    isAuthorized.value = false;
    isCheckingAuth.value = false;
    console.log(`Usuario ${user.email} no autorizado para acceder al panel de administración`);
  }
};

onMounted(() => {
  // Escuchar cambios en la autenticación
  onAuthStateChanged(auth, (user) => {
    checkUserAuthorization(user);
  });
});

// Limpiar event listeners cuando el componente se destruya
onBeforeUnmount(() => {
  const activeCarousel = document.getElementById('activeCarousel');
  const inactiveCarousel = document.getElementById('inactiveCarousel');
  const testCarousel = document.getElementById('testCarousel');
  
  if (activeCarousel) {
    activeCarousel.removeEventListener('scroll', () => handleCarouselScroll('activeCarousel', 'active'));
  }
  if (inactiveCarousel) {
    inactiveCarousel.removeEventListener('scroll', () => handleCarouselScroll('inactiveCarousel', 'inactive'));
  }
  if (testCarousel) {
    testCarousel.removeEventListener('scroll', () => handleCarouselScroll('testCarousel', 'test'));
  }
});
</script>
