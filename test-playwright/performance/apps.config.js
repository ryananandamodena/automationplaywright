// Target apps & URLs for k6 performance tests.
// Keep in sync with each app's playwright.config baseURL / hardcoded login URLs.
export const APPS = {
  fms: {
    name: 'FMS (Fleet Management System)',
    urls: [
      { name: 'login', url: 'https://portal-dev.modena.com/login' },
    ],
  },
  mhc: {
    name: 'MHC (Modena Healthcare Center)',
    urls: [
      { name: 'home', url: 'https://more-dev.modena.com' },
    ],
  },
  gccs: {
    name: 'GCCS (Global Customer Care System)',
    urls: [
      { name: 'home', url: 'https://gccs-test.modena.com' },
    ],
  },
  prive: {
    name: 'PRIVE',
    urls: [
      { name: 'home', url: 'https://prive-living.com' },
    ],
  },
  sfa: {
    name: 'SFA (Sales Force Automation)',
    urls: [
      { name: 'login', url: 'https://portal-dev.modena.com/login' },
    ],
  },
  scmp: {
    name: 'SCMP (Supply Chain Management Portal)',
    urls: [
      { name: 'eta-information', url: 'https://portal-dev.modena.com/scmp/eta-information' },
    ],
  },
  service1: {
    name: 'Service 1 (Modena Registrasi)',
    urls: [
      { name: 'client-registration', url: 'https://msp-dev.modena.com/client-registration' },
    ],
  },
};
