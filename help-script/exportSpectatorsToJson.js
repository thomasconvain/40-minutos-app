const admin = require('firebase-admin');
const fs = require('fs');

// Inicializar Firebase Admin SDK
const serviceAccount = require('./credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Función para exportar la colección 'spectators' a un archivo JSON
const exportSpectatorsToJSON = async () => {
  try {
    const spectatorsRef = db.collection('spectators');
    const snapshot = await spectatorsRef.get();

    if (snapshot.empty) {
      console.log('No hay documentos en la colección.');
      return;
    }

    // Crear un arreglo para almacenar los datos
    const spectatorsData = [];

    // Añadir los datos de cada documento al arreglo
    snapshot.forEach((doc) => {
      spectatorsData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Guardar los datos en un archivo JSON
    const filePath = './help-script/outputs/spectators/spectators.json';
    fs.writeFileSync(filePath, JSON.stringify(spectatorsData, null, 2));

    console.log(`Datos exportados exitosamente a ${filePath}`);
  } catch (error) {
    console.error('Error exportando los datos: ', error);
  }
};

// Ejecutar la función
exportSpectatorsToJSON();
