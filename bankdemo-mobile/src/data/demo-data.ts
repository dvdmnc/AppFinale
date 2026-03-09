export const demoData = {
  user: {
    name: 'Yassin',
    email: 'yassin@bankdemo.com',
    accountNumber: 'DE89370400440532013000',
    balance: 1245.50,
    currency: 'EUR',
    lastLogin: {
      timestamp: '2026-03-07T08:30:00Z',
      location: 'Lyon, France',
      device: 'iPhone 14',
    },
  },
  transactions: [
    { id: 'tx-001', type: 'income' as const, payee: 'Salaire mensuel', amount: 3500.0, currency: 'EUR', date: '2026-03-01T09:00:00Z', status: 'completed' as const, category: 'salaire' },
    { id: 'tx-002', type: 'expense' as const, payee: 'Netflix', amount: -20.0, currency: 'EUR', date: '2026-03-05T14:22:00Z', status: 'completed' as const, category: 'divertissement' },
    { id: 'tx-003', type: 'transfer' as const, payee: 'Alex Martin', amount: -150.0, currency: 'EUR', date: '2026-03-06T18:45:00Z', status: 'completed' as const, category: 'transfert' },
    { id: 'tx-004', type: 'expense' as const, payee: 'Carrefour', amount: -85.3, currency: 'EUR', date: '2026-03-06T11:15:00Z', status: 'completed' as const, category: 'courses' },
    { id: 'tx-005', type: 'transfer' as const, payee: 'Sara Lopez', amount: -50.0, currency: 'EUR', date: '2026-03-04T16:30:00Z', status: 'pending' as const, category: 'transfert' },
    { id: 'tx-006', type: 'expense' as const, payee: 'Amazon', amount: -42.99, currency: 'EUR', date: '2026-03-03T20:10:00Z', status: 'completed' as const, category: 'achats' },
    { id: 'tx-007', type: 'income' as const, payee: 'Projet freelance', amount: 800.0, currency: 'EUR', date: '2026-02-28T10:00:00Z', status: 'completed' as const, category: 'freelance' },
  ],
  atms: [
    { id: 'atm-001', name: 'BNP Paribas – Bellecour', address: '14 Place Bellecour, 69002 Lyon', lat: 45.7578, lng: 4.8320, distance: 2.1, available24h: true, services: ['Retraits', 'Dépôts', 'Solde'] },
    { id: 'atm-002', name: 'Société Générale – Part-Dieu', address: '17 Bd Vivier Merle, 69003 Lyon', lat: 45.7606, lng: 4.8590, distance: 1.5, available24h: false, services: ['Retraits', 'Solde'] },
    { id: 'atm-003', name: 'Crédit Agricole – Confluence', address: '112 Cours Charlemagne, 69002 Lyon', lat: 45.7434, lng: 4.8185, distance: 0.8, available24h: true, services: ['Retraits', 'Dépôts', 'Solde', 'Virements'] },
    { id: 'atm-004', name: 'LCL – Presqu\'île', address: '58 Rue de la République, 69002 Lyon', lat: 45.7640, lng: 4.8357, distance: 1.2, available24h: true, services: ['Retraits', 'Solde'] },
    { id: 'atm-005', name: 'HSBC – Vieux Lyon', address: '3 Place Saint-Jean, 69005 Lyon', lat: 45.7620, lng: 4.8266, distance: 3.4, available24h: false, services: ['Retraits', 'Dépôts', 'Solde'] },
  ],
  notifications: [
    { id: 'notif-001', type: 'transaction', title: 'Paiement reçu', message: 'Vous avez reçu €3 500,00 — Salaire mensuel', timestamp: '2026-03-01T09:00:00Z', read: true },
    { id: 'notif-002', type: 'security', title: 'Nouvelle connexion', message: 'Connexion depuis iPhone 14 à Lyon, France', timestamp: '2026-03-07T08:30:00Z', read: false },
    { id: 'notif-003', type: 'transaction', title: 'Paiement envoyé', message: '€150,00 envoyé à Alex Martin', timestamp: '2026-03-06T18:45:00Z', read: true },
    { id: 'notif-004', type: 'alert', title: 'Carte bientôt expirée', message: 'Votre carte se terminant par 3000 expire le 04/2026', timestamp: '2026-03-05T10:00:00Z', read: false },
  ],
  securityEvents: [
    { id: 'sec-001', type: 'login', description: 'Connexion réussie', timestamp: '2026-03-07T08:30:00Z', location: 'Lyon, France', device: 'iPhone 14', suspicious: false },
    { id: 'sec-002', type: 'login', description: 'Connexion réussie', timestamp: '2026-03-06T18:20:00Z', location: 'Lyon, France', device: 'iPhone 14', suspicious: false },
    { id: 'sec-003', type: 'failed_login', description: 'Tentative de connexion échouée', timestamp: '2026-03-04T03:15:00Z', location: 'Inconnu', device: 'Navigateur Chrome', suspicious: true },
  ],
  sessions: [
    { id: 'session-001', device: 'iPhone 14', location: 'Lyon, France', lastActive: '2026-03-07T08:30:00Z', current: true },
    { id: 'session-002', device: 'iPad Pro', location: 'Lyon, France', lastActive: '2026-03-05T22:15:00Z', current: false },
  ],
  recipients: [
    { id: 'r-1', name: 'Alex Martin', iban: 'FR76 3000 6000 0112 3456 7890 189' },
    { id: 'r-2', name: 'Sara Lopez', iban: 'ES91 2100 0418 4502 0005 1332' },
  ],
};
