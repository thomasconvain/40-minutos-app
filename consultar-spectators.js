// Script para consultar email y teléfono de spectators de un evento específico
// Ejecutar con: node consultar-spectators.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBLgwoTQ1EB59nr9rerF0gonBbblZ9IJ0g",
  authDomain: "minutos-87fe9.firebaseapp.com",
  projectId: "minutos-87fe9",
  storageBucket: "minutos-87fe9.appspot.com",
  messagingSenderId: "28186647799",
  appId: "1:28186647799:web:1228819cff4f9d77c987f2",
  measurementId: "G-0YK2NL06SG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// CAMBIAR AQUÍ EL ID DEL EVENTO QUE QUIERES CONSULTAR
const EVENT_ID = '9D1nEWdbDly3W2H05fKz';

async function consultarSpectators() {
  try {
    console.log(`📋 Consultando spectators para evento: ${EVENT_ID}\n`);
    
    // 1. Obtener el evento para ver los spectatorIds en zSpectator
    const eventRef = doc(db, 'events', EVENT_ID);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      console.log('❌ Evento no encontrado');
      return;
    }
    
    const eventData = eventSnap.data();
    const zSpectator = eventData.zSpectator || [];
    
    if (zSpectator.length === 0) {
      console.log('❌ No hay spectators registrados en este evento');
      return;
    }
    
    console.log(`👥 Total de spectators en evento: ${zSpectator.length}\n`);
    console.log('=' .repeat(80));
    console.log('| #  | NOMBRE COMPLETO                    | EMAIL                          | TELÉFONO       | ACOMPAÑANTES |');
    console.log('=' .repeat(80));
    
    // 2. Para cada spectator en zSpectator, obtener sus datos completos
    for (let i = 0; i < zSpectator.length; i++) {
      const spectatorEntry = zSpectator[i];
      const spectatorId = spectatorEntry.spectatorId;
      
      if (!spectatorId) continue;
      
      // Obtener datos completos del spectator
      const spectatorRef = doc(db, 'spectators', spectatorId);
      const spectatorSnap = await getDoc(spectatorRef);
      
      if (spectatorSnap.exists()) {
        const spectatorData = spectatorSnap.data();
        
        // Formatear datos para mostrar
        const numero = String(i + 1).padStart(2, ' ');
        const nombre = (spectatorEntry.nameComplete || `${spectatorData.name || ''} ${spectatorData.lastName || ''}`.trim() || 'Sin nombre').padEnd(34, ' ').substring(0, 34);
        const email = (spectatorData.email || 'Sin email').padEnd(30, ' ').substring(0, 30);
        const telefono = (spectatorData.phone || 'Sin teléfono').padEnd(14, ' ').substring(0, 14);
        const acompanantes = String(spectatorEntry.numberOfCompanions || 0).padStart(10, ' ');
        
        console.log(`| ${numero} | ${nombre} | ${email} | ${telefono} | ${acompanantes} |`);
      } else {
        // Si no existe el documento del spectator
        const numero = String(i + 1).padStart(2, ' ');
        const nombre = (spectatorEntry.nameComplete || 'Spectator eliminado').padEnd(34, ' ').substring(0, 34);
        const email = 'SPECTATOR NO ENCONTRADO'.padEnd(30, ' ');
        const telefono = ''.padEnd(14, ' ');
        const acompanantes = String(spectatorEntry.numberOfCompanions || 0).padStart(10, ' ');
        
        console.log(`| ${numero} | ${nombre} | ${email} | ${telefono} | ${acompanantes} |`);
      }
    }
    
    console.log('=' .repeat(80));
    console.log(`\n📊 Resumen:`);
    console.log(`   Total registrados: ${zSpectator.length}`);
    
    // Calcular total de personas (incluyendo acompañantes)
    const totalPersonas = zSpectator.reduce((total, spec) => {
      return total + 1 + (spec.numberOfCompanions || 0);
    }, 0);
    
    console.log(`   Total personas (con acompañantes): ${totalPersonas}`);
    
    // Generar CSV
    console.log(`\n💾 Generando archivo CSV...`);
    
    let csvContent = 'Numero,Nombre Completo,Email,Telefono,Acompanantes\n';
    
    for (let i = 0; i < zSpectator.length; i++) {
      const spectatorEntry = zSpectator[i];
      const spectatorId = spectatorEntry.spectatorId;
      
      if (!spectatorId) continue;
      
      const spectatorRef = doc(db, 'spectators', spectatorId);
      const spectatorSnap = await getDoc(spectatorRef);
      
      if (spectatorSnap.exists()) {
        const spectatorData = spectatorSnap.data();
        
        const numero = i + 1;
        const nombre = spectatorEntry.nameComplete || `${spectatorData.name || ''} ${spectatorData.lastName || ''}`.trim() || 'Sin nombre';
        const email = spectatorData.email || 'Sin email';
        const telefono = spectatorData.phone || 'Sin teléfono';
        const acompanantes = spectatorEntry.numberOfCompanions || 0;
        
        csvContent += `${numero},"${nombre}","${email}","${telefono}",${acompanantes}\n`;
      }
    }
    
    const fileName = `spectators-${EVENT_ID}-${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(fileName, csvContent);
    console.log(`📁 Archivo CSV generado: ${fileName}`);
    
  } catch (error) {
    console.error('❌ Error al consultar spectators:', error);
  }
}

// Ejecutar la consulta
consultarSpectators();