// Enums as constants
export const UserRole = {
  SPECTATOR: 'spectator',
  HOST: 'host',
  PERFORMER: 'performer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
}

export const Permission = {
  READ_EVENTS: 'read_events',
  CREATE_EVENTS: 'create_events',
  UPDATE_EVENTS: 'update_events',
  DELETE_EVENTS: 'delete_events',
  READ_OWN_EVENTS: 'read_own_events',
  UPDATE_OWN_EVENTS: 'update_own_events',
  READ_SPECTATORS: 'read_spectators',
  UPDATE_SPECTATORS: 'update_spectators',
  DELETE_SPECTATORS: 'delete_spectators',
  READ_OWN_SPECTATORS: 'read_own_spectators',
  MANAGE_PAYMENTS: 'manage_payments',
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_OWN_DASHBOARD: 'view_own_dashboard',
  VIEW_REPORTS: 'view_reports',
  MANAGE_USERS: 'manage_users',
  READ_ASSEMBLIES: 'read_assemblies',
  UPDATE_OWN_ASSEMBLY: 'update_own_assembly',
  READ_HOSTS: 'read_hosts',
  UPDATE_OWN_HOST: 'update_own_host'
}

// Types as JSDoc comments for documentation
/**
 * @typedef {Object} Event
 * @property {string} _ref
 * @property {string} assemblyId
 * @property {string} chapterId
 * @property {string} contentReferenceId
 * @property {Date} date
 * @property {string} hostId
 * @property {string} venueId
 * @property {Object} settings
 * @property {string} settings.invitationCode
 * @property {boolean} settings.isActive
 * @property {boolean} settings.isPrivate
 * @property {boolean} settings.isTipAccepted
 * @property {string[]} paymentMethodIds
 * @property {Object} status
 * @property {boolean} status.isCheckinOpen
 * @property {boolean} status.isFinished
 * @property {boolean} status.isReservationOpen
 * @property {SpectatorInfo[]} zSpectator
 */

/**
 * @typedef {Object} SpectatorInfo
 * @property {Date} createdAt
 * @property {string} spectatorId
 * @property {number} numberOfCompanions
 * @property {number} evaluationId
 * @property {boolean} hasCheckin
 * @property {boolean} hasCheckout
 * @property {string} paymentId
 */

/**
 * @typedef {Object} PaymentMethods
 * @property {string} paymentType
 * @property {string} instructions
 * @property {string} [bank]
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [number]
 * @property {string} [type]
 * @property {string} [destinationAccountOwner]
 * @property {string} [provider]
 */

/**
 * @typedef {Object} User
 * @property {string} uid
 * @property {string} email
 * @property {string} role
 * @property {string[]} permissions
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} Spectator
 * @property {string} [_ref]
 * @property {string} email
 * @property {string} name
 * @property {string} lastName
 * @property {string} phone
 * @property {string[]} subscribedEventsId
 * @property {number} numberOfCompanions
 * @property {string} role
 * @property {string[]} permissions
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */