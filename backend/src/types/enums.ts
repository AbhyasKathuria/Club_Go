export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  FACULTY = 'FACULTY',
  VOLUNTEER = 'VOLUNTEER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  LAUNCHED = 'LAUNCHED',
  CLOSED = 'CLOSED',
}

export enum AttendanceStatus {
  NOT_ATTENDED = 'NOT_ATTENDED',
  CHECKED_IN = 'CHECKED_IN',
}

export enum ScanType {
  TEAM = 'TEAM',
  INDIVIDUAL = 'INDIVIDUAL',
}

export enum ScanResult {
  SUCCESS = 'SUCCESS',
  DUPLICATE = 'DUPLICATE',
  INVALID = 'INVALID',
}
