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
const filePath = path.join(__dirname, './inputs/30_09_24.xlsx'); // Ruta al archivo Excel
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[1]; // Obtener la segunda hoja del archivo Excel
const sheet = workbook.Sheets[sheetName];

// Convertir los datos del Excel en formato JSON
const data = XLSX.utils.sheet_to_json(sheet);

// Función para comparar dos objetos y ver si son iguales
const isEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

// Subir o actualizar los datos en Firestore
const uploadOrUpdateDataInFirestore = async () => {
  const promises = data.map(async (row, i) => {
    // Verificar si el campo email no está vacío
    if (!row.email) {
      console.log(`Fila ${i + 1} omitida. No tiene email.`);
      return;
    }

    // Manejar companionsInfo: Intentar parsear si es un string JSON
    let companionsInfoArray = [];
    if (typeof row.companionsInfo === 'string' && row.companionsInfo.trim()) {
      try {
        companionsInfoArray = JSON.parse(row.companionsInfo); // Parsear cadena JSON
      } catch (error) {
        console.log(`Error en la fila ${i + 1}: companionsInfo no es un JSON válido. Se guardará como arreglo vacío.`);
        companionsInfoArray = []; // Si hay un error, dejar el campo como un arreglo vacío
      }
    }

    // Convertir subscribed_events_id a un arreglo si es una cadena de texto
    let subscribedEventsArray = [];
    if (typeof row.subscribedEventsId === 'string' && row.subscribedEventsId.trim()) {
      try {
        subscribedEventsArray = JSON.parse(row.subscribedEventsId);
      } catch (error) {
        console.log(`Error en la fila ${i + 1}: subscribed_events_id no es un JSON válido. Se omitirá esta llave.`);
        subscribedEventsArray = null; // Si hay un error, dejar el campo como null
      }
    }

    // Estructurar los datos de cada fila
    const documentData = {
      email: row.email.replace(/\s/g, ''),
      name: row.name,
      lastName: row.lastName,
      numberOfPeople: row.numberOfPeople,
      phone: row.phone.replace(/\s/g, ''),
      subscribedEventsId: subscribedEventsArray,
      companionsInfo: companionsInfoArray,
      isCheckinActive: row.isCheckinActive,
      isChecked: row.isChecked,
      uniquePaymentForGroup: row.uniquePaymentForGroup
    };

    try {
      // Comprobar si el documento con ese email ya existe
      const spectatorRef = db.collection('spectators').where('email', '==', documentData.email);
      const existingDocs = await spectatorRef.get();

      if (!existingDocs.empty) {
        const doc = existingDocs.docs[0];
        const existingData = doc.data();

        // Comparar los datos actuales con los nuevos
        if (!isEqual(existingData, documentData)) {
          // Si los datos son diferentes, actualizar el documento
          await db.collection('spectators').doc(doc.id).update(documentData);
          console.log(`Documento ${i + 1} actualizado correctamente`);
        } else {
          console.log(`Documento ${i + 1} no tiene cambios. Omitido.`);
        }
      } else {
        // Si no existe el documento, crearlo
        await db.collection('spectators').add(documentData);
        console.log(`Documento ${i + 1} subido correctamente`);
      }
    } catch (error) {
      console.error(`Error al procesar el documento ${i + 1}:`, error);
    }
  });

  await Promise.all(promises);
};

// Llamar a la función para subir o actualizar los datos
uploadOrUpdateDataInFirestore()
  .then(() => console.log('Carga masiva completa'))
  .catch((error) => console.error('Error al completar la carga masiva:', error));
