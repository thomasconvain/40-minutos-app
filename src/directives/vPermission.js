import { useAuth } from '@/composables/useAuth'

const { hasPermission, hasRole, canAccess } = useAuth()

export default {
  mounted(el, binding) {
    const { value } = binding
    
    if (!value) {
      console.warn('v-permission directive requires a value')
      return
    }
    
    let hasAccess = false
    
    if (typeof value === 'string') {
      // Single permission
      hasAccess = hasPermission(value)
    } else if (Array.isArray(value)) {
      // Multiple permissions (user needs at least one)
      hasAccess = value.some(permission => hasPermission(permission))
    } else if (typeof value === 'object') {
      // Object with permissions and/or roles
      const { permissions = [], roles = [], requireAll = false } = value
      
      if (roles.length > 0) {
        const hasRequiredRole = roles.some(role => hasRole(role))
        if (!hasRequiredRole) {
          hasAccess = false
        } else {
          hasAccess = canAccess(permissions, roles)
        }
      } else {
        if (requireAll) {
          hasAccess = permissions.every(permission => hasPermission(permission))
        } else {
          hasAccess = permissions.some(permission => hasPermission(permission))
        }
      }
    }
    
    if (!hasAccess) {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    }
  },
  
  updated(el, binding) {
    const { value } = binding
    
    if (!value) return
    
    let hasAccess = false
    
    if (typeof value === 'string') {
      hasAccess = hasPermission(value)
    } else if (Array.isArray(value)) {
      hasAccess = value.some(permission => hasPermission(permission))
    } else if (typeof value === 'object') {
      const { permissions = [], roles = [], requireAll = false } = value
      
      if (roles.length > 0) {
        const hasRequiredRole = roles.some(role => hasRole(role))
        if (!hasRequiredRole) {
          hasAccess = false
        } else {
          hasAccess = canAccess(permissions, roles)
        }
      } else {
        if (requireAll) {
          hasAccess = permissions.every(permission => hasPermission(permission))
        } else {
          hasAccess = permissions.some(permission => hasPermission(permission))
        }
      }
    }
    
    if (hasAccess) {
      el.style.display = ''
      el.removeAttribute('data-permission-hidden')
    } else {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    }
  }
}