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
const sheetName = workbook.SheetNames[1]; // Obtener la segunda hoja del archivo Excel
const sheet = workbook.Sheets[sheetName];

// Convertir los datos del Excel en formato JSON
const data = XLSX.utils.sheet_to_json(sheet);
console.log(data);

// Subir cada fila a Firestore
const uploadDataToFirestore = async () => {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    console.log(row);

    // Verificar si el campo email no está vacío
    if (!row.email) {
      console.log(`Fila ${i + 1} omitida. No tiene email.`);
      continue; // Saltar esta fila si no tiene email
    }

    // Manejar companionsInfo: Intentar parsear si es un string JSON
    let companionsInfoArray = [];
    console.log('HOLAAAAAAA', row.companionsInfo);
    if (typeof row.companionsInfo === 'string' && row.companionsInfo.trim()) {
      try {
        companionsInfoArray = JSON.parse(row.companionsInfo); // Parsear cadena JSON
        console.log(companionsInfoArray);
      } catch (error) {
        console.log(`Error en la fila ${i + 1}: companionsInfo no es un JSON válido.`);
        continue; // Omitir la fila si el JSON es inválido
      }
    }

    // Convertir subscribed_events_id a un arreglo si es una cadena de texto
    let subscribedEventsArray = [];
    if (typeof row.subscribed_events_id === 'string' && row.subscribed_events_id.trim()) {
      subscribedEventsArray = row.subscribed_events_id.split(',').map(event => event.trim()); // Convertir cadena a arreglo
      console.log(`subscribed_events_id parseado en la fila ${i + 1}:`, subscribedEventsArray);
    } else if (Array.isArray(row.subscribed_events_id)) {
      subscribedEventsArray = row.subscribed_events_id; // Si ya es un arreglo, lo dejamos como está
    }

    // Estructurar los datos de cada fila
    const documentData = {
      email: row.email,
      name: row.name,
      lastName: row.lastName,
      numberOfPeople: row.numberOfPeople,
      phone: row.phone,
      subscribedEventsId: subscribedEventsArray,
      companionsInfo: companionsInfoArray || null,
    };

    try {
      // Crear un documento nuevo en Firestore
      await db.collection('spectators').add(documentData);
      console.log(`Documento ${i + 1} subido correctamente`);
    } catch (error) {
      console.error(`Error al subir el documento ${i + 1}:`, error);
    }
  }
};

// Llamar a la función para subir los datos
uploadDataToFirestore()
  .then(() => console.log('Carga masiva completa'))
  .catch((error) => console.error('Error al completar la carga masiva:', error));
