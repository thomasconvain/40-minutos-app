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
    console.log('=' .repeat(200));
    console.log('| #  | NOMBRE COMPLETO                    | EMAIL                          | TELÉFONO       | ACOMP. | CHECK-IN | CHECK-OUT | PAGÓ | MÉTODO PAGO      | MONTO    | LINK CHECKOUT                    |');
    console.log('=' .repeat(200));
    
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
        const acompanantes = String(spectatorEntry.numberOfCompanions || 0).padStart(6, ' ');
        
        // Estados de check-in y check-out
        const hasCheckedIn = spectatorEntry.hasCheckIn ? 'SÍ' : 'NO';
        const hasCheckedOut = spectatorEntry.hasCheckOut ? 'SÍ' : 'NO';
        const checkinStatus = hasCheckedIn.padEnd(8, ' ');
        const checkoutStatus = hasCheckedOut.padEnd(9, ' ');
        
        // Información de pago
        const payments = spectatorData.payments || [];
        let hasPaid = 'NO';
        let paymentMethod = 'N/A';
        let totalAmount = 0;
        
        if (payments.length > 0) {
          hasPaid = 'SÍ';
          // Tomar el último pago
          const lastPayment = payments[payments.length - 1];
          paymentMethod = lastPayment.paymentMethod || 'N/A';
          totalAmount = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
        }
        
        const paidStatus = hasPaid.padEnd(4, ' ');
        const methodFormatted = paymentMethod.padEnd(16, ' ').substring(0, 16);
        const amountFormatted = totalAmount > 0 ? `$${Number(totalAmount).toLocaleString()}`.padStart(9, ' ') : 'N/A'.padStart(9, ' ');
        
        // Generar link de checkout
        const checkoutLink = `https://cuarenta-minutos.web.app/checkout/${spectatorId}/${EVENT_ID}`;
        const linkFormatted = checkoutLink.padEnd(32, ' ').substring(0, 32);
        
        console.log(`| ${numero} | ${nombre} | ${email} | ${telefono} | ${acompanantes} | ${checkinStatus} | ${checkoutStatus} | ${paidStatus} | ${methodFormatted} | ${amountFormatted} | ${linkFormatted} |`);
      } else {
        // Si no existe el documento del spectator
        const numero = String(i + 1).padStart(2, ' ');
        const nombre = (spectatorEntry.nameComplete || 'Spectator eliminado').padEnd(34, ' ').substring(0, 34);
        const email = 'SPECTATOR NO ENCONTRADO'.padEnd(30, ' ');
        const telefono = ''.padEnd(14, ' ');
        const acompanantes = String(spectatorEntry.numberOfCompanions || 0).padStart(6, ' ');
        
        // Estados por defecto para spectators no encontrados
        const hasCheckedIn = spectatorEntry.hasCheckIn ? 'SÍ' : 'NO';
        const hasCheckedOut = spectatorEntry.hasCheckOut ? 'SÍ' : 'NO';
        const checkinStatus = hasCheckedIn.padEnd(8, ' ');
        const checkoutStatus = hasCheckedOut.padEnd(9, ' ');
        const paidStatus = 'N/A'.padEnd(4, ' ');
        const methodFormatted = 'N/A'.padEnd(16, ' ');
        const amountFormatted = 'N/A'.padStart(9, ' ');
        
        // Para spectators eliminados, mostrar link vacío
        const linkFormatted = 'N/A'.padEnd(32, ' ');
        
        console.log(`| ${numero} | ${nombre} | ${email} | ${telefono} | ${acompanantes} | ${checkinStatus} | ${checkoutStatus} | ${paidStatus} | ${methodFormatted} | ${amountFormatted} | ${linkFormatted} |`);
      }
    }
    
    console.log('=' .repeat(200));
    console.log(`\n📊 Resumen:`);
    console.log(`   Total registrados: ${zSpectator.length}`);
    
    // Calcular total de personas (incluyendo acompañantes)
    const totalPersonas = zSpectator.reduce((total, spec) => {
      return total + 1 + (spec.numberOfCompanions || 0);
    }, 0);
    
    console.log(`   Total personas (con acompañantes): ${totalPersonas}`);
    
    // Calcular estadísticas de check-in, check-out y pagos
    let checkedInCount = 0;
    let checkedOutCount = 0;
    let paidCount = 0;
    let totalPaymentAmount = 0;
    
    for (const spectatorEntry of zSpectator) {
      if (spectatorEntry.hasCheckIn) checkedInCount++;
      if (spectatorEntry.hasCheckOut) checkedOutCount++;
      
      // Para calcular pagos, necesitamos los datos del spectator
      if (spectatorEntry.spectatorId) {
        const spectatorRef = doc(db, 'spectators', spectatorEntry.spectatorId);
        const spectatorSnap = await getDoc(spectatorRef);
        
        if (spectatorSnap.exists()) {
          const spectatorData = spectatorSnap.data();
          const payments = spectatorData.payments || [];
          
          if (payments.length > 0) {
            paidCount++;
            const spectatorTotal = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
            totalPaymentAmount += spectatorTotal;
          }
        }
      }
    }
    
    console.log(`   Check-ins realizados: ${checkedInCount}`);
    console.log(`   Check-outs realizados: ${checkedOutCount}`);
    console.log(`   Spectators que pagaron: ${paidCount}`);
    console.log(`   Monto total pagado: $${totalPaymentAmount.toLocaleString()}`);
    
    // Generar CSV
    console.log(`\n💾 Generando archivo CSV...`);
    
    let csvContent = 'Numero,Nombre Completo,Email,Telefono,Acompanantes,Check-In,Check-Out,Tuvo Pago,Metodo Pago,Monto Total,Link Checkout\n';
    
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
        
        // Estados de check-in y check-out
        const hasCheckedIn = spectatorEntry.hasCheckIn ? 'SÍ' : 'NO';
        const hasCheckedOut = spectatorEntry.hasCheckOut ? 'SÍ' : 'NO';
        
        // Información de pago
        const payments = spectatorData.payments || [];
        let hasPaid = 'NO';
        let paymentMethod = 'N/A';
        let totalAmount = 0;
        
        if (payments.length > 0) {
          hasPaid = 'SÍ';
          const lastPayment = payments[payments.length - 1];
          paymentMethod = lastPayment.paymentMethod || 'N/A';
          totalAmount = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
        }
        
        // Generar link de checkout para CSV
        const checkoutLink = `https://cuarenta-minutos.web.app/checkout/${spectatorId}/${EVENT_ID}`;
        
        csvContent += `${numero},"${nombre}","${email}","${telefono}",${acompanantes},"${hasCheckedIn}","${hasCheckedOut}","${hasPaid}","${paymentMethod}",${Number(totalAmount)},"${checkoutLink}"\n`;
      } else {
        // Si no existe el documento del spectator
        const numero = i + 1;
        const nombre = spectatorEntry.nameComplete || 'Spectator eliminado';
        const hasCheckedIn = spectatorEntry.hasCheckIn ? 'SÍ' : 'NO';
        const hasCheckedOut = spectatorEntry.hasCheckOut ? 'SÍ' : 'NO';
        const acompanantes = spectatorEntry.numberOfCompanions || 0;
        
        csvContent += `${numero},"${nombre}","SPECTATOR NO ENCONTRADO","",${acompanantes},"${hasCheckedIn}","${hasCheckedOut}","N/A","N/A",0,"N/A"\n`;
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