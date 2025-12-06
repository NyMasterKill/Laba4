/**
 * ER-диаграмма и связи между сущностями (для задачи 1.3.4)
 *
 * User:
 * - OneToOne -> Profile
 * - OneToOne -> GosuslugiBinding
 * - OneToMany -> Bookings
 * - OneToMany -> Rides
 * - OneToMany -> Payments
 * - OneToMany -> Fines
 * - OneToMany -> Subscriptions
 *
 * Profile:
 * - ManyToOne -> User
 *
 * GosuslugiBinding:
 * - ManyToOne -> User
 *
 * Vehicle:
 * - ManyToOne -> Station
 * - OneToMany -> Bookings
 * - OneToMany -> Rides
 * - OneToMany -> MaintenanceLogs
 *
 * Station:
 * - OneToMany -> Vehicles
 *
 * Booking:
 * - ManyToOne -> User
 * - ManyToOne -> Vehicle
 * - OneToMany -> Rides
 *
 * Ride:
 * - ManyToOne -> User
 * - ManyToOne -> Vehicle
 * - ManyToOne -> Booking
 *
 * Payment:
 * - ManyToOne -> User
 *
 * Fine:
 * - ManyToOne -> User
 *
 * Subscription:
 * - ManyToOne -> User
 * - ManyToOne -> TariffPlan
 *
 * TariffPlan:
 * - OneToMany -> Subscriptions
 *
 * MaintenanceLog:
 * - ManyToOne -> Vehicle
 * - ManyToOne -> Employee
 *
 * Employee:
 * - ManyToOne -> Role
 * - OneToMany -> MaintenanceLogs
 *
 * Role:
 * - OneToMany -> Employees
 */
export const ER_DIAGRAM = {
  User: {
    oneToOne: ['Profile', 'GosuslugiBinding'],
    oneToMany: ['Bookings', 'Rides', 'Payments', 'Fines', 'Subscriptions']
  },
  Profile: {
    manyToOne: ['User']
  },
  GosuslugiBinding: {
    manyToOne: ['User']
  },
  Vehicle: {
    manyToOne: ['Station'],
    oneToMany: ['Bookings', 'Rides', 'MaintenanceLogs']
  },
  Station: {
    oneToMany: ['Vehicles']
  },
  Booking: {
    manyToOne: ['User', 'Vehicle'],
    oneToMany: ['Rides']
  },
  Ride: {
    manyToOne: ['User', 'Vehicle', 'Booking']
  },
  Payment: {
    manyToOne: ['User']
  },
  Fine: {
    manyToOne: ['User']
  },
  Subscription: {
    manyToOne: ['User', 'TariffPlan']
  },
  TariffPlan: {
    oneToMany: ['Subscriptions']
  },
  MaintenanceLog: {
    manyToOne: ['Vehicle', 'Employee']
  },
  Employee: {
    manyToOne: ['Role'],
    oneToMany: ['MaintenanceLogs']
  },
  Role: {
    oneToMany: ['Employees']
  }
};