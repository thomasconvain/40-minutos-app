const admin = require('firebase-admin');
const { UserRole, Permission } = require('../src/types.js');

// Inicializar Firebase Admin (asegúrate de tener las credenciales configuradas)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // O usa tu archivo de credenciales:
    // credential: admin.credential.cert(require('./path-to-service-account-key.json'))
  });
}

const db = admin.firestore();

async function createAdminUser() {
  try {
    // Configura estos datos con tu información
    const adminData = {
      uid: "TU_FIREBASE_UID", // Reemplaza con tu Firebase Auth UID
      email: "javier@alzares.cl", // Tu email
      role: UserRole.SUPER_ADMIN,
      permissions: [
        Permission.READ_EVENTS,
        Permission.CREATE_EVENTS,
        Permission.UPDATE_EVENTS,
        Permission.DELETE_EVENTS,
        Permission.READ_SPECTATORS,
        Permission.UPDATE_SPECTATORS,
        Permission.DELETE_SPECTATORS,
        Permission.MANAGE_PAYMENTS,
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_USERS,
        Permission.READ_ASSEMBLIES,
        Permission.READ_HOSTS
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Crear el documento en la colección users
    await db.collection('users').doc(adminData.uid).set(adminData);
    
    console.log('✅ Usuario admin creado exitosamente:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Role: ${adminData.role}`);
    console.log(`   UID: ${adminData.uid}`);
    console.log(`   Permisos: ${adminData.permissions.length}`);
    
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
  }
}

// Instrucciones de uso
console.log('🔧 INSTRUCCIONES:');
console.log('1. Obtén tu Firebase Auth UID desde la consola de Firebase Authentication');
console.log('2. Reemplaza "TU_FIREBASE_UID" en este script con tu UID real');
console.log('3. Verifica que el email sea correcto');
console.log('4. Ejecuta: node help-script/createAdminUser.js');
console.log('');

// Ejecutar solo si se proporciona el UID como argumento
const uid = process.argv[2];
if (uid && uid !== 'TU_FIREBASE_UID') {
  console.log(`🚀 Creando usuario admin con UID: ${uid}`);
  
  // Actualizar el UID en adminData antes de ejecutar
  createAdminUser().then(() => {
    console.log('✨ Proceso completado');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
} else {
  console.log('ℹ️  Para ejecutar, proporciona tu UID: node help-script/createAdminUser.js TU_FIREBASE_UID');
}

module.exports = { createAdminUser };