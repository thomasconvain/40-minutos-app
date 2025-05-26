import { ref, computed } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { UserRole, Permission } from '@/types.js'

const currentUser = ref(null)
const userRole = ref(null)
const userPermissions = ref([])
const userEntityId = ref(null) // Para almacenar hostId o assemblyId
const isLoading = ref(true)

const rolePermissions = {
  [UserRole.SPECTATOR]: [
    Permission.READ_EVENTS
  ],
  [UserRole.HOST]: [
    Permission.READ_OWN_EVENTS,
    Permission.UPDATE_OWN_EVENTS,
    Permission.READ_OWN_SPECTATORS,
    Permission.VIEW_OWN_DASHBOARD,
    Permission.UPDATE_OWN_HOST
  ],
  [UserRole.PERFORMER]: [
    Permission.READ_ASSEMBLIES,
    Permission.UPDATE_OWN_ASSEMBLY,
    Permission.VIEW_OWN_DASHBOARD,
    Permission.VIEW_REPORTS
  ],
  [UserRole.ADMIN]: [
    Permission.READ_EVENTS,
    Permission.CREATE_EVENTS,
    Permission.UPDATE_EVENTS,
    Permission.READ_SPECTATORS,
    Permission.UPDATE_SPECTATORS,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_REPORTS
  ],
  [UserRole.SUPER_ADMIN]: [
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
  ]
}

export function useAuth() {
  const isAuthenticated = computed(() => !!currentUser.value)
  const isAdmin = computed(() => userRole.value === UserRole.ADMIN || userRole.value === UserRole.SUPER_ADMIN)
  const isSuperAdmin = computed(() => userRole.value === UserRole.SUPER_ADMIN)
  const isHost = computed(() => userRole.value === UserRole.HOST)
  const isPerformer = computed(() => userRole.value === UserRole.PERFORMER)
  const isSpectator = computed(() => userRole.value === UserRole.SPECTATOR)

  const initAuth = () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          currentUser.value = user
          await loadUserRole(user.uid, user.email)
        } else {
          currentUser.value = null
          userRole.value = null
          userPermissions.value = []
          userEntityId.value = null
        }
        isLoading.value = false
        resolve(user)
      })
    })
  }

  const loadUserRole = async (uid, email) => {
    try {
      // 1. Verificar si existe en users collection (admins)
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        userRole.value = userData.role || UserRole.SPECTATOR
        
        // Si tiene referencia a permissions collection, cargar permisos desde ahí
        if (userData.permissions && typeof userData.permissions === 'string') {
          const permissionsDoc = await getDoc(doc(db, 'permissions', userData.permissions))
          if (permissionsDoc.exists()) {
            const permissionsData = permissionsDoc.data()
            userPermissions.value = permissionsData[userData.role] || permissionsData.super_admin || []
          } else {
            userPermissions.value = rolePermissions[userRole.value] || []
          }
        } else {
          // Si permissions es un array directo o no existe
          userPermissions.value = userData.permissions || rolePermissions[userRole.value] || []
        }
        return
      }

      // 2. Verificar si es host
      const hostsQuery = query(collection(db, 'hosts'), where('email', '==', email))
      const hostsSnapshot = await getDocs(hostsQuery)
      if (!hostsSnapshot.empty) {
        const hostDoc = hostsSnapshot.docs[0]
        const hostData = hostDoc.data()
        userRole.value = hostData.role || UserRole.HOST
        userPermissions.value = hostData.permissions || rolePermissions[UserRole.HOST]
        userEntityId.value = hostDoc.id
        return
      }

      // 3. Verificar si es performer
      const assembliesQuery = query(collection(db, 'assembly'), where('email', '==', email))
      const assembliesSnapshot = await getDocs(assembliesQuery)
      if (!assembliesSnapshot.empty) {
        const assemblyDoc = assembliesSnapshot.docs[0]
        const assemblyData = assemblyDoc.data()
        userRole.value = assemblyData.role || UserRole.PERFORMER
        userPermissions.value = assemblyData.permissions || rolePermissions[UserRole.PERFORMER]
        userEntityId.value = assemblyDoc.id
        return
      }

      // 4. Verificar si es spectator
      const spectatorDoc = await getDoc(doc(db, 'spectators', uid))
      if (spectatorDoc.exists()) {
        const spectatorData = spectatorDoc.data()
        userRole.value = spectatorData.role || UserRole.SPECTATOR
        userPermissions.value = spectatorData.permissions || rolePermissions[UserRole.SPECTATOR]
        return
      }

      // 5. Usuario por defecto es spectator
      userRole.value = UserRole.SPECTATOR
      userPermissions.value = rolePermissions[UserRole.SPECTATOR]
      
    } catch (error) {
      console.error('Error loading user role:', error)
      userRole.value = UserRole.SPECTATOR
      userPermissions.value = rolePermissions[UserRole.SPECTATOR]
    }
  }

  const hasPermission = (permission) => {
    return userPermissions.value.includes(permission)
  }

  const hasRole = (role) => {
    return userRole.value === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(userRole.value)
  }

  const canAccess = (requiredPermissions = [], requiredRoles = []) => {
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      return false
    }
    
    if (requiredPermissions.length === 0) {
      return true
    }
    
    return requiredPermissions.some(permission => hasPermission(permission))
  }

  const canAccessReports = () => {
    return hasPermission(Permission.VIEW_REPORTS)
  }

  const canManageEvent = (eventHostId = null) => {
    if (hasPermission(Permission.UPDATE_EVENTS)) return true
    if (hasPermission(Permission.UPDATE_OWN_EVENTS) && eventHostId === userEntityId.value) return true
    return false
  }

  const canViewEventSpectators = (eventHostId = null) => {
    if (hasPermission(Permission.READ_SPECTATORS)) return true
    if (hasPermission(Permission.READ_OWN_SPECTATORS) && eventHostId === userEntityId.value) return true
    return false
  }

  const requireAuth = () => {
    if (!isAuthenticated.value) {
      throw new Error('Authentication required')
    }
  }

  const requirePermission = (permission) => {
    requireAuth()
    if (!hasPermission(permission)) {
      throw new Error(`Permission ${permission} required`)
    }
  }

  const requireRole = (role) => {
    requireAuth()
    if (!hasRole(role)) {
      throw new Error(`Role ${role} required`)
    }
  }

  return {
    currentUser: computed(() => currentUser.value),
    userRole: computed(() => userRole.value),
    userPermissions: computed(() => userPermissions.value),
    userEntityId: computed(() => userEntityId.value),
    isLoading: computed(() => isLoading.value),
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isHost,
    isPerformer,
    isSpectator,
    initAuth,
    loadUserRole,
    hasPermission,
    hasRole,
    hasAnyRole,
    canAccess,
    canAccessReports,
    canManageEvent,
    canViewEventSpectators,
    requireAuth,
    requirePermission,
    requireRole,
    rolePermissions
  }
}