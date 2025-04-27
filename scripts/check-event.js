const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Configuración de Firebase (copiada de src/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyBLgwoTQ1EB59nr9rerF0gonBbblZ9IJ0g",
  authDomain: "minutos-87fe9.firebaseapp.com",
  projectId: "minutos-87fe9",
  storageBucket: "minutos-87fe9.appspot.com",
  messagingSenderId: "28186647799",
  appId: "1:28186647799:web:1228819cff4f9d77c987f2",
  measurementId: "G-0YK2NL06SG"
};

// Inicializar Firebase sin analytics
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkEvent(eventId) {
  try {
    const docRef = doc(db, 'events', eventId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const eventData = docSnap.data();
      console.log('Evento encontrado:');
      console.log('ID:', eventId);
      
      // Verificar las condiciones de ActiveEvents.vue
      console.log('Condiciones para aparecer en ActiveEvents:');
      console.log('settings.isActive =', eventData.settings?.isActive);
      console.log('settings.isPrivate =', eventData.settings?.isPrivate);
      console.log('status.isFinished =', eventData.status?.isFinished);
      
      // Imprimir estructura completa para análisis
      console.log('\nEstructura completa del evento:');
      console.log(JSON.stringify(eventData, null, 2));
      
      // Validar si cumple los criterios para mostrarse
      const deberiaMostrarse = 
        eventData.settings?.isActive === true && 
        eventData.settings?.isPrivate === false && 
        eventData.status?.isFinished === false;
      
      console.log('\nDebe mostrarse en ActiveEvents:', deberiaMostrarse);
      
      if (!deberiaMostrarse) {
        console.log('\nRazones por las que no se muestra:');
        if (eventData.settings?.isActive !== true) console.log('- settings.isActive no es true');
        if (eventData.settings?.isPrivate !== false) console.log('- settings.isPrivate no es false');
        if (eventData.status?.isFinished !== false) console.log('- status.isFinished no es false');
      }
    } else {
      console.log('No se encontró ningún evento con ID:', eventId);
    }
  } catch (error) {
    console.error('Error al obtener el evento:', error);
  }
}

// Verificar el evento específico
checkEvent('kWOS1R8cSyC9ibEnlKvm');