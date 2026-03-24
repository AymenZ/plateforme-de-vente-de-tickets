export const events = [
  {
    id: 1,
    title: "Festival International de Carthage",
    category: "Musique",
    date: "2026-07-20",
    time: "22:00",
    location: "Carthage - Théâtre Antique",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
    description:
      "Un concert exceptionnel dans le cadre mythique du Théâtre Antique de Carthage.",
    capacity: 7500,
    attendees: 6800,
    duration: "3h",
    ageMin: 10,
    extraInfo: "Artiste invité : Saber Rebai",
    price: 50,
    tickets: [
      { id: "1-vip", name: "CAT 1 - VIP", price: 120 },
      { id: "1-standard", name: "CAT 2 - Standard", price: 80 },
      { id: "1-economy", name: "CAT 3 - Économique", price: 50 },
    ],
  },

  {
    id: 2,
    title: "JCC - Journées Cinématographiques de Carthage",
    category: "Cinéma",
    date: "2026-11-05",
    time: "18:00",
    location: "Tunis - Cité de la Culture",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400",
    description:
      "Projection de films arabes et africains dans le cadre du célèbre festival JCC.",
    capacity: 1200,
    attendees: 950,
    duration: "2h30",
    ageMin: 12,
    extraInfo: "Film d'ouverture : Production Tunisienne 2026",
    price: 20,
    tickets: [
      { id: "2-premium", name: "Siège Premium", price: 35 },
      { id: "2-standard", name: "Siège Standard", price: 20 },
    ],
  },

  {
    id: 3,
    title: "Marathon de Tunis",
    category: "Sport",
    date: "2026-03-15",
    time: "07:00",
    location: "Tunis - Avenue Habib Bourguiba",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400",
    description:
      "Participez au marathon officiel de Tunis avec plusieurs catégories de distance.",
    capacity: 5000,
    attendees: 4200,
    duration: "4h",
    ageMin: 18,
    extraInfo: "Distance principale : 42 km",
    price: 0,
    tickets: [
      { id: "3-marathon", name: "Marathon (42 km)", price: 0 },
      { id: "3-semi", name: "Semi-Marathon (21 km)", price: 0 },
      { id: "3-10k", name: "Course 10 km", price: 0 },
    ],
  },

  {
    id: 4,
    title: "Festival International du Sahara",
    category: "Culture",
    date: "2026-12-25",
    time: "16:00",
    location: "Douz",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400",
    description:
      "Festival culturel mettant en valeur les traditions sahariennes et les spectacles folkloriques.",
    capacity: 3000,
    attendees: 2500,
    duration: "5h",
    ageMin: 0,
    extraInfo: "Spectacle : Fantasia & musique bédouine",
    price: 15,
    tickets: [
      { id: "4-vip", name: "Accès VIP", price: 60 },
      { id: "4-standard", name: "Accès Standard", price: 35 },
      { id: "4-child", name: "Enfant (-12 ans)", price: 15 },
    ],
  },

  {
    id: 5,
    title: "Gaming Expo Tunisia",
    category: "Tech/Gaming",
    date: "2026-09-10",
    time: "10:00",
    location: "Tunis - Palais des Congrès",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400",
    description:
      "Tournois e-sport, nouveautés gaming et rencontres avec des streamers tunisiens.",
    capacity: 2000,
    attendees: 1700,
    duration: "8h",
    ageMin: 10,
    extraInfo: "Tournoi principal : FIFA & Valorant",
    price: 40,
    tickets: [
      { id: "5-vip", name: "Pass VIP", price: 70 },
      { id: "5-standard", name: "Pass Standard", price: 40 },
    ],
  },

  {
    id: 6,
    title: "Festival Jazz de Tabarka",
    category: "Musique",
    date: "2026-08-05",
    time: "21:00",
    location: "Tabarka",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400",
    description:
      "Concerts live de jazz dans le cadre magnifique de Tabarka.",
    capacity: 4000,
    attendees: 3500,
    duration: "3h",
    ageMin: 12,
    extraInfo: "Artiste : Jazz Band International",
    price: 60,
    tickets: [
      { id: "6-vip", name: "VIP Jazz", price: 90 },
      { id: "6-standard", name: "Standard", price: 60 },
    ],
  },

  {
    id: 7,
    title: "Salon de l'Entrepreneuriat",
    category: "Conférence",
    date: "2026-04-18",
    time: "09:00",
    location: "Sfax - Centre International des Foires",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400",
    description:
      "Rencontres avec des entrepreneurs tunisiens et conférences sur l'innovation.",
    capacity: 1500,
    attendees: 1200,
    duration: "7h",
    ageMin: 16,
    extraInfo: "Invité spécial : CEO Startup Tunisienne",
    price: 20,
    tickets: [
      { id: "7-early", name: "Early Bird", price: 20 },
      { id: "7-standard", name: "Standard", price: 30 },
      { id: "7-premium", name: "Premium Networking", price: 50 },
    ],
  },

  {
    id: 8,
    title: "Pièce Théâtre Municipal",
    category: "Théâtre",
    date: "2026-05-02",
    time: "19:30",
    location: "Tunis - Théâtre Municipal",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400",
    description:
      "Une pièce dramatique tunisienne contemporaine jouée au Théâtre Municipal.",
    capacity: 900,
    attendees: 750,
    duration: "2h",
    ageMin: 12,
    extraInfo: "Compagnie : Théâtre National Tunisien",
    price: 25,
    tickets: [
      { id: "8-front", name: "Front Row", price: 40 },
      { id: "8-standard", name: "Standard", price: 25 },
    ],
  },

  {
    id: 9,
    title: "Festival des Enfants - La Marsa",
    category: "Famille",
    date: "2026-06-10",
    time: "15:00",
    location: "La Marsa",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400",
    description:
      "Animations, jeux et spectacles pour toute la famille.",
    capacity: 1800,
    attendees: 1400,
    duration: "4h",
    ageMin: 0,
    extraInfo: "Animation : Magicien & clown",
    price: 10,
    tickets: [
      { id: "9-adult", name: "Adulte", price: 15 },
      { id: "9-child", name: "Enfant", price: 10 },
    ],
  },
];

// Extraire les catégories uniques
export const categories = [...new Set(events.map((e) => e.category))];

// ============================================
// 📊 ORGANISATEUR - MOCK DATA POUR DASHBOARD
// ============================================

/**
 * Événements créés par l'organisateur (avec statut, ventes, etc.)
 * Utilisé pour le Dashboard et le formulaire de modification
 */
export const organizerEvents = [
  {
    id: 101,
    title: "Workshop React Avancé",
    category: "Tech",
    date: "2026-03-15",
    time: "10:00",
    location: "Tunis - Hub Numerique",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
    description:
      "Workshop intensif sur les hooks React et state management avec patterns avancés.",
    capacity: 100,
    status: "Publié", // "Publié" | "Brouillon" | "Annulé" | "Terminé"
    createdAt: "2026-02-15",
    ticketsSold: 87,
    revenue: 2175, // 87 * 25
    price: 25,
    tickets: [
      { id: "101-standard", name: "Pass Standard", price: 25, quantity: 100 },
    ],
  },

  {
    id: 102,
    title: "Conférence Web3 & Blockchain",
    category: "Conférence",
    date: "2026-04-05",
    time: "14:00",
    location: "Tunis - Cité de la Culture",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400",
    description:
      "Plongez dans le monde de la blockchain avec les experts tunisiens.",
    capacity: 200,
    status: "Publié",
    createdAt: "2026-02-10",
    ticketsSold: 156,
    revenue: 3510, // 156 * (35 mixed prices)
    price: 35,
    tickets: [
      { id: "102-early", name: "Early Bird", price: 25, quantity: 100 },
      { id: "102-standard", name: "Standard", price: 35, quantity: 100 },
    ],
  },

  {
    id: 103,
    title: "Atelier Design UX/UI",
    category: "Tech",
    date: "2026-05-20",
    time: "09:00",
    location: "Sfax - Centre Innovation",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400",
    description:
      "Apprenez les principes du design moderne avec des cas d'études réels.",
    capacity: 80,
    status: "Brouillon", // Pas encore publié
    createdAt: "2026-02-20",
    ticketsSold: 0,
    revenue: 0,
    price: 30,
    tickets: [
      { id: "103-standard", name: "Pass Atelier", price: 30, quantity: 80 },
    ],
  },

  {
    id: 104,
    title: "Networking Dev Tunisie",
    category: "Réseautage",
    date: "2026-03-22",
    time: "18:00",
    location: "Tunis - Techpark",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400",
    description:
      "Soirée networking pour développeurs tunisiens - gratuit avec inscription.",
    capacity: 150,
    status: "Publié",
    createdAt: "2026-02-18",
    ticketsSold: 142,
    revenue: 0, // Événement gratuit
    price: 0,
    tickets: [
      {
        id: "104-free",
        name: "Accès Gratuit",
        price: 0,
        quantity: 150,
      },
    ],
  },

  {
    id: 105,
    title: "Masterclass Entrepreneuriat Digital",
    category: "Conférence",
    date: "2026-06-15",
    time: "10:00",
    location: "Tunis - Hub Startup",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400",
    description:
      "Masterclass avec fondateurs de startups tunisiennes réussies.",
    capacity: 250,
    status: "Publié",
    createdAt: "2026-02-05",
    ticketsSold: 189,
    revenue: 5670, // Pricing mixte
    price: 50,
    tickets: [
      { id: "105-vip", name: "VIP + Déjeuner", price: 80, quantity: 50 },
      {
        id: "105-standard",
        name: "Accès Standard",
        price: 50,
        quantity: 200,
      },
    ],
  },

  {
    id: 106,
    title: "Hackathon Dev 48h",
    category: "Tech",
    date: "2026-04-28",
    time: "09:00",
    location: "Tunis - Innovation Space",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
    description:
      "Hackathon de 48 heures avec prix à la clé pour les meilleurs projets.",
    capacity: 200,
    status: "Terminé", // Événement passé
    createdAt: "2026-01-20",
    ticketsSold: 178,
    revenue: 5340, // 178 * 30
    price: 30,
    tickets: [
      { id: "106-team", name: "Équipe (3 pers)", price: 30, quantity: 200 },
    ],
  },
];

/**
 * Statistiques du Dashboard Organisateur
 * Données fictives agrégées
 */
export const organizerStats = {
  totalEvents: organizerEvents.length,
  publishedEvents: organizerEvents.filter((e) => e.status === "Publié").length,
  draftEvents: organizerEvents.filter((e) => e.status === "Brouillon").length,
  totalTicketsSold: organizerEvents.reduce((acc, e) => acc + e.ticketsSold, 0),
  totalRevenue: organizerEvents.reduce((acc, e) => acc + e.revenue, 0),
  totalCapacity: organizerEvents.reduce((acc, e) => acc + e.capacity, 0),
  averageOccupancyRate:
    (organizerEvents.reduce((acc, e) => acc + e.ticketsSold, 0) /
      organizerEvents.reduce((acc, e) => acc + e.capacity, 0)) *
    100,

  // Événements par statut
  byStatus: {
    Publié: organizerEvents.filter((e) => e.status === "Publié").length,
    Brouillon: organizerEvents.filter((e) => e.status === "Brouillon").length,
    Annulé: organizerEvents.filter((e) => e.status === "Annulé").length,
    Terminé: organizerEvents.filter((e) => e.status === "Terminé").length,
  },

  // Événements par catégorie
  byCategory: {
    Tech: organizerEvents.filter((e) => e.category === "Tech").length,
    Conférence: organizerEvents.filter((e) => e.category === "Conférence")
      .length,
    Réseautage: organizerEvents.filter((e) => e.category === "Réseautage")
      .length,
  },

  // Tendances (fictives pour 30 jours)
  salesTrend: [
    { day: 1, sales: 12 },
    { day: 2, sales: 15 },
    { day: 3, sales: 8 },
    { day: 4, sales: 22 },
    { day: 5, sales: 18 },
    { day: 6, sales: 25 },
    { day: 7, sales: 31 },
    { day: 8, sales: 28 },
    { day: 9, sales: 35 },
    { day: 10, sales: 42 },
  ],

  // Événement le plus populaire
  topEvent: organizerEvents.reduce((prev, current) =>
    prev.ticketsSold > current.ticketsSold ? prev : current
  ),

  // Prochains événements
  upcomingEvents: organizerEvents
    .filter((e) => e.status === "Publié")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3),
};

/**
 * Template vierge pour créer un nouvel événement
 * Utilisé au démarrage du formulaire de création
 */
export const eventFormTemplate = {
  title: "",
  description: "",
  category: "",
  date: "",
  time: "10:00",
  endDate: "",
  endTime: "12:00",
  location: "",
  timezone: "Africa/Tunis",
  isOnline: false,
  onlineLink: "",
  capacity: 100,
  price: 0,
  image: "",
  status: "Brouillon",
  ticketTiers: [
    {
      id: 1,
      name: "Standard",
      price: 0,
      quantity: 100,
      description: "",
      endsAt: null,
    },
  ],
  // Métadonnées
  createdAt: new Date().toISOString(),
  lastSavedAt: new Date().toISOString(),
  isDraft: true,
};

/**
 * Catégories disponibles pour les événements
 */
export const eventCategories = [
  { id: "tech", name: "Tech", icon: "💻" },
  { id: "conference", name: "Conférence", icon: "🎤" },
  { id: "networking", name: "Réseautage", icon: "🤝" },
  { id: "workshop", name: "Workshop", icon: "🛠️" },
  { id: "concert", name: "Concert", icon: "🎵" },
  { id: "sport", name: "Sport", icon: "⚽" },
  { id: "culture", name: "Culture", icon: "🎭" },
  { id: "family", name: "Famille", icon: "👨‍👩‍👧‍👦" },
  { id: "cinema", name: "Cinéma", icon: "🎬" },
  { id: "gaming", name: "Gaming", icon: "🎮" },
];