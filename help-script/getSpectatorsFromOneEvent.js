const admin = require('firebase-admin');
const fs = require('fs');

// Inicializa Firebase Admin
const serviceAccount = require('./credentials.json'); // Asegúrate de tener este archivo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const getSpectatorData = async (eventId) => {
  try {
    const docRef = db.collection('events').doc(eventId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`❌ No se encontró el evento con ID: ${eventId}`);
      return;
    }

    const data = docSnap.data();

    if (!data.zSpectator) {
      console.log('⚠️ La clave "zSpectator" no está presente en el documento.');
      return;
    }

    console.log('✅ Datos de zSpectator:');
    console.log(JSON.stringify(data.zSpectator, null, 2));

    // (Opcional) Guardar en archivo JSON
    fs.writeFileSync(`zSpectator-${eventId}.json`, JSON.stringify(data.zSpectator, null, 2));
    console.log(`📁 Datos guardados en zSpectator-${eventId}.json`);
  } catch (error) {
    console.error('🔥 Error al obtener los datos:', error);
  }
};

// Ejecutar con ID como argumento de línea de comandos
const [, , eventId] = process.argv;
if (!eventId) {
  console.log('ℹ️ Uso: node getSpectatorData.js <eventId>');
  process.exit(1);
}

getSpectatorData(eventId);
