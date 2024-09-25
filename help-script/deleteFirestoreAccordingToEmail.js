const admin = require('firebase-admin');
const XLSX = require('xlsx');
const path = require('path');

// Inicializar Firebase Admin SDK con las credenciales
const serviceAccount = require('./credentials.json'); // Ruta al archivo de credenciales

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Leer el archivo Excel
const filePath = path.join(__dirname, './inputs/24_09_24.xlsx'); // Ruta al archivo Excel
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[1]; // Obtener la primera hoja del archivo Excel
const sheet = workbook.Sheets[sheetName];

// Convertir los datos del Excel en formato JSON
const data = XLSX.utils.sheet_to_json(sheet);

// Función para eliminar documentos de Firestore basados en el email
const deleteDocumentsByEmail = async () => {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const email = row.email;

    // Verificar si el email no está vacío
    if (!email) {
      console.log(`Fila ${i + 1} omitida. No tiene email.`);
      continue; // Saltar esta fila si no tiene email
    }

    try {
      // Buscar documentos en Firestore que tengan el mismo email
      const querySnapshot = await db.collection('spectators').where('email', '==', email).get();
      
      if (querySnapshot.empty) {
        console.log(`No se encontraron documentos con el email ${email}`);
        continue;
      }

      // Eliminar los documentos encontrados
      querySnapshot.forEach(async (doc) => {
        await db.collection('spectators').doc(doc.id).delete();
        console.log(`Documento con email ${email} eliminado correctamente.`);
      });
    } catch (error) {
      console.error(`Error al eliminar documentos con el email ${email}:`, error);
    }
  }
};

// Llamar a la función para eliminar los documentos
deleteDocumentsByEmail()
  .then(() => console.log('Eliminación masiva completa'))
  .catch((error) => console.error('Error al completar la eliminación masiva:', error));
