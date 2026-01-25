export enum ServiceType {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CORPORATE = 'corporate',
}

/** Service format / delivery style. */
export enum ServiceFormat {
  // Online
  PRIVATE = 'private',
  GROUP_LIVE = 'group_live',
  RECORDED = 'recorded',
  HYBRID = 'hybrid',
  // Offline
  PRIVATE_STUDIO = 'private_studio',
  PRIVATE_HOME = 'private_home',
  GROUP_STUDIO = 'group_studio',
  WORKSHOP_RETREAT = 'workshop_retreat',
  // Corporate
  ONSITE_GROUP = 'onsite_group',
  ONLINE_CORPORATE = 'online_corporate',
  WELLNESS_PROGRAM = 'wellness_program',
  CORPORATE_WORKSHOP = 'corporate_workshop',
}

export enum ServiceMode {
  LIVE = 'live',
  RECORDED = 'recorded',
  HYBRID = 'hybrid',
  ONSITE = 'onsite',
}

export enum ServiceFrequency {
  SINGLE = 'single',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum ServiceAudience {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
  COMPANY = 'company',
}
