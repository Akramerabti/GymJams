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
    "name": "Island Gym",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "87 Grand Boulevard",
      "city": "L’Île-Perrot",
      "state": "QC",
      "country": "Canada",
      "zipCode": "J7V 4W6"
    },
    "description": "Well-equipped 24-hour facility with juice bar, aerobics room, personal trainers, over 100 machines.",
    "amenities": ["Cardio Equipment", "Strength Training", "Juice Bar", "Aerobics Room", "Personal Training"],
    "gymChain": "Island Gym",
    "website": "https://islandgym.ca",
    "phone": "+1 514-425-5555",
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
    "name": "Anytime Fitness L’Île-Perrot",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "88 Boulevard Don-Quichotte",
      "city": "L’Île-Perrot",
      "state": "QC",
      "country": "Canada",
      "zipCode": "J7V 6L7"
    },
    "description": "Neighborhood 24-hour gym for beginners to fitness regulars with personalized support.",
    "amenities": ["24/7 Access", "Cardio Equipment", "Strength Equipment", "Personal Plans"],
    "gymChain": "Anytime Fitness",
    "website": "https://www.anytimefitness.quebec/gyms/9900028/l’ile-perrot-qc-j7v-6l7/",
    "phone": "+1 514-425-5225",
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
    "name": "Gym Fit Forme Pointe-Claire",
    "location": {
      "type": "Point",
      "coordinates": null,
      "address": "2375 Route Trans-Canadienne #B",
      "city": "Pointe-Claire",
      "state": "QC",
      "country": "Canada",
      "zipCode": "H9R 5Z5"
    },
    "description": "Full-service fitness center with group classes, personal training, juice bar, saunas, massage loungers, Wi-Fi.",
    "amenities": ["Cardio Equipment", "Strength Training", "Group Classes", "Juice Bar", "Sauna", "Massage Loungers", "Wi-Fi"],
    "gymChain": "Gym Fit Forme",
    "website": "https://gymfitforme.com/",
    "phone": "+1 514-426-0321",
    "hours": {
      "monday": {"open":"05:00","close":"00:00"},
      "tuesday": {"open":"05:00","close":"00:00"},
      "wednesday": {"open":"05:00","close":"00:00"},
      "thursday": {"open":"05:00","close":"00:00"},
      "friday": {"open":"05:00","close":"00:00"},
      "saturday": {"open":"07:00","close":"22:00"},
      "sunday": {"open":"07:00","close":"22:00"}
    },
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
