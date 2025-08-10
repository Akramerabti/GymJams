import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import geocodingService from '../src/services/geocoding.service.js';

//RUN: node --experimental-modules ./server/scripts/seed-gyms.js

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
config({ path: path.join(__dirname, '../.env') });

console.log('Environment loaded from:', path.join(__dirname, '../.env'));
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Only amenities allowed by the Gym model
const allowedAmenities = [
  'Free Weights', 'Cardio Equipment', 'Swimming Pool', 'Sauna', 'Steam Room',
  'Group Classes', 'Personal Training', 'Locker Rooms', 'Parking',
  'Juice Bar', 'Towel Service', '24/7 Access', 'CrossFit Box',
  'Rock Climbing Wall', 'Basketball Court', 'Racquetball Court'
];

const gyms =[
  {
    "name": "Éconofitness Québec - Sainte-Foy",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "2600 Boulevard Laurier",
      "city": "Québec",
      "state": "QC",
      "country": "Canada",
      "zipCode": "G1V 4T3"
    },
    "description": "Self-service budget gym—open 24/7 with parking and tanning booths.",
    "amenities": ["Cardio Equipment", "Free Weights", "24/7 Access", "Parking"],
    "gymChain": "Éconofitness",
    "website": "https://econofitness.ca/en/gym/quebec",
    "phone": "",
    "hours": {
      "monday": {"open":"00:00","close":"23:59"},
      "tuesday": {"open":"00:00","close":"23:59"},
      "wednesday": {"open":"00:00","close":"23:59"},
      "thursday": {"open":"00:00","close":"23:59"},
      "friday": {"open":"00:00","close":"23:59"},
      "saturday": {"open":"00:00","close":"23:59"},
      "sunday": {"open":"00:00","close":"23:59"}
    },
    "isVerified": true,
    "isActive": true,
    "type": "gym",
    "createdBy": "GymTonic"
    
  },
  {
    "name": "Mega Fitness Gym 24hr",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "1400 Avenue Saint-Jean-Baptiste",
      "city": "Québec",
      "state": "QC",
      "country": "Canada",
      "zipCode": "G2E 5B7"
    },
    "description": "Well-equipped 24-hour fitness facility with a wide range of machines and free weights.",
    "amenities": ["Cardio Equipment", "Free Weights", "24/7 Access"],
    "gymChain": "Mega Fitness",
    "website": "",
    "phone": "+1 418-877-5454",
    "hours": {
      "monday":{"open":"00:00","close":"23:59"},
      "tuesday":{"open":"00:00","close":"23:59"},
      "wednesday":{"open":"00:00","close":"23:59"},
      "thursday":{"open":"00:00","close":"23:59"},
      "friday":{"open":"00:00","close":"23:59"},
      "saturday":{"open":"00:00","close":"23:59"},
      "sunday":{"open":"00:00","close":"23:59"}
    },
    "isVerified": true,
    "isActive": true,
    "type": "gym",
    "createdBy": "GymTonic"
  },
  {
    "name": "Univers Gym",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "4250 1re Avenue",
      "city": "Québec",
      "state": "QC",
      "country": "Canada",
      "zipCode": "G1H 2S5"
    },
    "description": "Well-equipped fitness centre with quality machines and friendly atmosphere.",
    "amenities": ["Cardio Equipment", "Free Weights", "Locker Rooms"],
    "gymChain": "Univers Gym",
    "website": "",
    "phone": "+1 418-260-9888",
    "hours": {},
    "isVerified": true,
    "isActive": true,
    "type": "gym",
    "createdBy": "GymTonic"
  },
  {
    "name": "Nautilus Plus Quebec Place",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "880 Boulevard Honoré-Mercier",
      "city": "Québec",
      "state": "QC",
      "country": "Canada",
      "zipCode": "G1R 4X5"
    },
    "description": "Part of the Nautilus Plus chain offering group classes, training, and machines.",
    "amenities": ["Cardio Equipment", "Group Classes", "Free Weights"],
    "gymChain": "Nautilus Plus",
    "website": "",
    "phone": "",
    "hours": {},
    "isVerified": true,
    "isActive": true,
    "type": "gym",
    "createdBy": "GymTonic"
  },
  {
    "name": "Gym Le Chalet",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "2327 Boulevard du Versant Nord",
      "city": "Québec",
      "state": "QC",
      "country": "Canada",
      "zipCode": "G1N 4C2"
    },
    "description": "Local fitness club with strength and cardio machines, popular in Québec City.",
    "amenities": ["Cardio Equipment", "Free Weights"],
    "gymChain": "Gyms Local",
    "website": "",
    "phone": "+1 418-260-9552",
    "hours": {},
    "isVerified": true,
    "isActive": true,
    "type": "gym",
    "createdBy": "GymTonic"
  },
  {
    "name": "World Gym Beauport",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "2837 Avenue Saint-David",
      "city": "Québec",
      "state": "QC",
      "country": "Canada",
      "zipCode": "G1C 0J3"
    },
    "description": "Franchise gym offering full-service fitness, cardio, weights, and group training.",
    "amenities": ["Cardio Equipment", "Free Weights", "Group Classes", "Locker Rooms"],
    "gymChain": "World Gym",
    "website": "",
    "phone": "+1 418-661-0200",
    "hours": {},
    "isVerified": true,
    "isActive": true,
    "type": "gym",
    "createdBy": "GymTonic",
    
  },
  {
    "name": "Le Podium (Powerlifting & Athletic Performance)",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "1995 Rue Frank-Carrel, Suite 105",
      "city": "Québec",
      "state": "QC",
      "country": "Canada",
      "zipCode": ""
    },
    "description": "Dedicated powerlifting and performance gym supporting all fitness levels.",
    "amenities": ["Free Weights", "Cardio Equipment"],
    "gymChain": "Le Podium",
    "website": "",
    "phone": "",
    "hours": {},
    "isVerified": true,
    "isActive": true,
    "type": "gym",
    "createdBy": "GymTonic"
  },
  {
    "name": "Nordik Fight Club (MMA)",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "909 Boulevard Charest Ouest #1/2",
      "city": "Québec",
      "state": "QC",
      "country": "Canada",
      "zipCode": ""
    },
    "description": "Top MMA gym offering Brazilian Jiu-Jitsu, Muay Thai, wrestling and more.",
    "amenities": ["Cardio Equipment"],
    "gymChain": "Nordik Fight Club",
    "website": "",
    "phone": "",
    "hours": {},
    "isVerified": true,
    "isActive": true,
    "type": "gym",
    "createdBy": "GymTonic"
  },
  {
    "name": "Tristar Gym Montreal (MMA)",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "Montreal, QC",
      "city": "Montreal",
      "state": "QC",
      "country": "Canada",
      "zipCode": ""
    },
    "description": "World-renowned MMA training center home of Georges St-Pierre’s team.",
    "amenities": ["Cardio Equipment"],
    "gymChain": "Tristar Gym",
    "website": "https://tristargym.com",
    "phone": "",
    "hours": {},
    "isVerified": true,
    "isActive": true,
    "type": "gym",
    "createdBy": "GymTonic"
  }
]


gyms.forEach(gym => {
  gym.createdBy = "GymTonic";
  if (Array.isArray(gym.amenities)) {
    gym.amenities = gym.amenities.filter(a => allowedAmenities.includes(a));
  }
});

async function seedGyms() {
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymjams');
  const db = mongoose.connection.db;
  const gymsCollection = db.collection('gyms');

  let seededCount = 0;
  for (const gym of gyms) {
    try {
      console.log(`\nProcessing: ${gym.name}`);
      const loc = gym.location;
      if (!loc.coordinates) {
        console.log(`Geocoding: ${loc.address}, ${loc.city}, ${loc.state}, ${loc.country}, ${loc.zipCode}`);
        const geo = await geocodingService.geocodeAddress(
          loc.address,
          loc.city,
          loc.state,
          loc.country,
          loc.zipCode
        );
        if (geo && geo.lat && geo.lng) {
          loc.coordinates = [geo.lng, geo.lat];
          console.log(`Coordinates found: [${geo.lng}, ${geo.lat}]`);
        } else {
          console.warn(`Could not geocode: ${gym.name}`);
          continue;
        }
      }
      gym.location = {
        ...loc,
        coordinates: loc.coordinates,
        type: 'Point'
      };
      const result = await gymsCollection.insertOne(gym);
      seededCount++;
      console.log(`Seeded: ${gym.name} (ID: ${result.insertedId})`);
    } catch (err) {
      console.error(`Error seeding ${gym.name}:`, err);
    }
  }

  const total = await gymsCollection.countDocuments();
  console.log(`\nSeeding complete! Seeded ${seededCount} gyms. Total gyms in DB: ${total}`);
  await mongoose.disconnect();
}

seedGyms();
