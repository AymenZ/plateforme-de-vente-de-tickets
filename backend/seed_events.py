"""Script pour insérer les événements de test dans la base de données."""
from app.database import SessionLocal, engine, Base
from app.models.event import Event
from app.models.user import User
from app.models.role import Role

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Chercher un organisateur pour assigner les événements
# On prend org@eventhub.tn, ou le premier ORGANIZER, ou le premier ADMIN
organizer = (
    db.query(User).filter(User.email == "org@eventhub.tn").first()
    or db.query(User).join(Role).filter(Role.name == "ORGANIZER").first()
    or db.query(User).join(Role).filter(Role.name == "ADMIN").first()
)

if not organizer:
    print("✗ Aucun organisateur trouvé. Lancez d'abord : python seed_roles.py && python seed_users.py")
    db.close()
    exit(1)

print(f"  Organisateur : {organizer.email} (id={organizer.id})")

EVENTS = [
    {
        "title": "Festival International de Carthage",
        "category": "Musique",
        "date": "2026-07-20",
        "time": "22:00",
        "location": "Carthage - Théâtre Antique",
        "image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
        "description": "Un concert exceptionnel dans le cadre mythique du Théâtre Antique de Carthage.",
        "capacity": 7500,
        "attendees": 6800,
        "duration": "3h",
        "age_min": 10,
        "extra_info": "Artiste invité : Saber Rebai",
        "price": 50,
        "tickets": [
            {"id": "1-vip", "name": "CAT 1 - VIP", "price": 120},
            {"id": "1-standard", "name": "CAT 2 - Standard", "price": 80},
            {"id": "1-economy", "name": "CAT 3 - Économique", "price": 50},
        ],
    },
    {
        "title": "JCC - Journées Cinématographiques de Carthage",
        "category": "Cinéma",
        "date": "2026-11-05",
        "time": "18:00",
        "location": "Tunis - Cité de la Culture",
        "image": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400",
        "description": "Projection de films arabes et africains dans le cadre du célèbre festival JCC.",
        "capacity": 1200,
        "attendees": 950,
        "duration": "2h30",
        "age_min": 12,
        "extra_info": "Film d'ouverture : Production Tunisienne 2026",
        "price": 20,
        "tickets": [
            {"id": "2-premium", "name": "Siège Premium", "price": 35},
            {"id": "2-standard", "name": "Siège Standard", "price": 20},
        ],
    },
    {
        "title": "Marathon de Tunis",
        "category": "Sport",
        "date": "2026-03-15",
        "time": "07:00",
        "location": "Tunis - Avenue Habib Bourguiba",
        "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400",
        "description": "Participez au marathon officiel de Tunis avec plusieurs catégories de distance.",
        "capacity": 5000,
        "attendees": 4200,
        "duration": "4h",
        "age_min": 18,
        "extra_info": "Distance principale : 42 km",
        "price": 0,
        "tickets": [
            {"id": "3-marathon", "name": "Marathon (42 km)", "price": 0},
            {"id": "3-semi", "name": "Semi-Marathon (21 km)", "price": 0},
            {"id": "3-10k", "name": "Course 10 km", "price": 0},
        ],
    },
    {
        "title": "Festival International du Sahara",
        "category": "Culture",
        "date": "2026-12-25",
        "time": "16:00",
        "location": "Douz",
        "image": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400",
        "description": "Festival culturel mettant en valeur les traditions sahariennes et les spectacles folkloriques.",
        "capacity": 3000,
        "attendees": 2500,
        "duration": "5h",
        "age_min": 0,
        "extra_info": "Spectacle : Fantasia & musique bédouine",
        "price": 15,
        "tickets": [
            {"id": "4-vip", "name": "Accès VIP", "price": 60},
            {"id": "4-standard", "name": "Accès Standard", "price": 35},
            {"id": "4-child", "name": "Enfant (-12 ans)", "price": 15},
        ],
    },
    {
        "title": "Gaming Expo Tunisia",
        "category": "Tech/Gaming",
        "date": "2026-09-10",
        "time": "10:00",
        "location": "Tunis - Palais des Congrès",
        "image": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400",
        "description": "Tournois e-sport, nouveautés gaming et rencontres avec des streamers tunisiens.",
        "capacity": 2000,
        "attendees": 1700,
        "duration": "8h",
        "age_min": 10,
        "extra_info": "Tournoi principal : FIFA & Valorant",
        "price": 40,
        "tickets": [
            {"id": "5-vip", "name": "Pass VIP", "price": 70},
            {"id": "5-standard", "name": "Pass Standard", "price": 40},
        ],
    },
    {
        "title": "Festival Jazz de Tabarka",
        "category": "Musique",
        "date": "2026-08-05",
        "time": "21:00",
        "location": "Tabarka",
        "image": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400",
        "description": "Concerts live de jazz dans le cadre magnifique de Tabarka.",
        "capacity": 4000,
        "attendees": 3500,
        "duration": "3h",
        "age_min": 12,
        "extra_info": "Artiste : Jazz Band International",
        "price": 60,
        "tickets": [
            {"id": "6-vip", "name": "VIP Jazz", "price": 90},
            {"id": "6-standard", "name": "Standard", "price": 60},
        ],
    },
    {
        "title": "Salon de l'Entrepreneuriat",
        "category": "Conférence",
        "date": "2026-04-18",
        "time": "09:00",
        "location": "Sfax - Centre International des Foires",
        "image": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400",
        "description": "Rencontres avec des entrepreneurs tunisiens et conférences sur l'innovation.",
        "capacity": 1500,
        "attendees": 1200,
        "duration": "7h",
        "age_min": 16,
        "extra_info": "Invité spécial : CEO Startup Tunisienne",
        "price": 20,
        "tickets": [
            {"id": "7-early", "name": "Early Bird", "price": 20},
            {"id": "7-standard", "name": "Standard", "price": 30},
            {"id": "7-premium", "name": "Premium Networking", "price": 50},
        ],
    },
    {
        "title": "Pièce Théâtre Municipal",
        "category": "Théâtre",
        "date": "2026-05-02",
        "time": "19:30",
        "location": "Tunis - Théâtre Municipal",
        "image": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400",
        "description": "Une pièce dramatique tunisienne contemporaine jouée au Théâtre Municipal.",
        "capacity": 900,
        "attendees": 750,
        "duration": "2h",
        "age_min": 12,
        "extra_info": "Compagnie : Théâtre National Tunisien",
        "price": 25,
        "tickets": [
            {"id": "8-front", "name": "Front Row", "price": 40},
            {"id": "8-standard", "name": "Standard", "price": 25},
        ],
    },
    {
        "title": "Festival des Enfants - La Marsa",
        "category": "Famille",
        "date": "2026-06-10",
        "time": "15:00",
        "location": "La Marsa",
        "image": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400",
        "description": "Animations, jeux et spectacles pour toute la famille.",
        "capacity": 1800,
        "attendees": 1400,
        "duration": "4h",
        "age_min": 0,
        "extra_info": "Animation : Magicien & clown",
        "price": 10,
        "tickets": [
            {"id": "9-adult", "name": "Adulte", "price": 15},
            {"id": "9-child", "name": "Enfant", "price": 10},
        ],
    },
]

inserted = 0
for ev in EVENTS:
    existing = db.query(Event).filter(Event.title == ev["title"]).first()
    if existing:
        print(f"  ✓ '{ev['title']}' existe déjà (id={existing.id}), ignoré.")
        continue

    event = Event(**ev, organizer_id=organizer.id)
    db.add(event)
    inserted += 1
    print(f"  + '{ev['title']}' créé.")

db.commit()
db.close()
print(f"\n✅ Seed événements terminé ({inserted} ajoutés).")
