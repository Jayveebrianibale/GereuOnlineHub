const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, push } = require('firebase/database');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQ",
  authDomain: "gereuonlinehub.firebaseapp.com",
  databaseURL: "https://gereuonlinehub-default-rtdb.firebaseio.com",
  projectId: "gereuonlinehub",
  storageBucket: "gereuonlinehub.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqrstuv"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Sample data
const sampleApartments = [
  {
    title: "Cozy Studio Apartment in Makati",
    price: "₱15,000",
    location: "Makati City",
    address: "123 Ayala Avenue, Makati City, Metro Manila",
    image: "https://via.placeholder.com/400x300?text=Studio+Apartment",
    rating: 4.5,
    reviews: 127,
    amenities: ["WiFi", "Air Conditioning", "Kitchen", "Washing Machine", "Parking", "Security", "Elevator", "Gym"],
    description: "Fully furnished studio apartment perfect for young professionals. Located in the heart of Makati with easy access to business districts, shopping malls, and public transportation. Features modern amenities and 24/7 security.",
    size: "25 sqm",
    bedrooms: 1,
    bathrooms: 1,
    available: true
  },
  {
    title: "Spacious 2BR Condo in BGC",
    price: "₱35,000",
    location: "Taguig City",
    address: "456 Bonifacio High Street, Taguig City, Metro Manila",
    image: "https://via.placeholder.com/400x300?text=2BR+Condo",
    rating: 4.8,
    reviews: 89,
    amenities: ["WiFi", "Air Conditioning", "Kitchen", "Washing Machine", "Parking", "Security", "Elevator", "Swimming Pool", "Playground", "Concierge"],
    description: "Beautiful 2-bedroom condo unit ideal for families. Located in the prestigious BGC area with world-class amenities. Features floor-to-ceiling windows, modern kitchen, and master bedroom with ensuite bathroom.",
    size: "65 sqm",
    bedrooms: 2,
    bathrooms: 2,
    available: true
  }
];

const sampleLaundryServices = [
  {
    title: "QuickWash Express Laundry",
    price: "₱150 per 5kg",
    turnaround: "Same Day (4-6 hours)",
    image: "https://via.placeholder.com/400x300?text=Express+Laundry",
    rating: 4.3,
    reviews: 156,
    description: "Fast and reliable laundry service with same-day delivery. We use premium detergents and fabric softeners to ensure your clothes are clean and fresh. Special care for delicate items.",
    services: ["Wash & Dry", "Ironing", "Dry Cleaning", "Express Service", "Pickup & Delivery"],
    pickup: "Free within 5km radius",
    delivery: "Free delivery within 3km, P50 beyond",
    minOrder: "₱200 minimum",
    available: true
  },
  {
    title: "Elite Clean Laundry & Dry Cleaning",
    price: "₱200 per 5kg",
    turnaround: "Next Day (24 hours)",
    image: "https://via.placeholder.com/400x300?text=Premium+Laundry",
    rating: 4.7,
    reviews: 203,
    description: "Premium laundry and dry cleaning service for your most delicate garments. We use eco-friendly products and professional equipment to ensure the best care for your clothes.",
    services: ["Wash & Dry", "Ironing", "Dry Cleaning", "Alterations", "Shoe Cleaning", "Leather Care", "Wedding Dress Cleaning"],
    pickup: "Free within 10km radius",
    delivery: "Free delivery within 5km, P100 beyond",
    minOrder: "₱300 minimum",
    available: true
  }
];

const sampleAutoServices = [
  {
    title: "Complete Car Service Package",
    price: "₱2,500",
    duration: "3-4 hours",
    image: "https://via.placeholder.com/400x300?text=Car+Service",
    rating: 4.6,
    reviews: 178,
    description: "Comprehensive car maintenance service including oil change, filter replacement, brake inspection, and general checkup. Our certified mechanics ensure your vehicle runs smoothly and safely.",
    services: ["Oil Change", "Filter Replacement", "Brake Inspection", "Battery Check", "Tire Rotation", "Fluid Top-up", "Engine Diagnostic"],
    category: "Maintenance",
    includes: ["Premium Oil", "Oil Filter", "Air Filter", "Cabin Filter", "Brake Fluid", "Coolant", "Labor"],
    available: true
  },
  {
    title: "Motorcycle Complete Tune-up",
    price: "₱1,200",
    duration: "2-3 hours",
    image: "https://via.placeholder.com/400x300?text=Motorcycle+Service",
    rating: 4.4,
    reviews: 142,
    description: "Professional motorcycle repair and tune-up service. We specialize in all major motorcycle brands and provide quality parts and service. Your bike will run like new after our service.",
    services: ["Engine Tune-up", "Carburetor Cleaning", "Chain Adjustment", "Brake Service", "Electrical Check", "Tire Service", "Battery Check"],
    category: "Repair",
    includes: ["Spark Plugs", "Air Filter", "Oil Change", "Chain Lube", "Brake Pads", "Labor"],
    available: true
  }
];

const sampleMotorParts = [
  {
    name: "Yamaha R15 V3 Piston Kit",
    price: "₱3,500",
    image: "https://via.placeholder.com/400x300?text=Piston+Kit",
    description: "High-performance piston kit for Yamaha R15 V3. Includes piston, rings, and gaskets. Made from high-quality aluminum alloy for durability and performance.",
    category: "engine",
    brand: "Yamaha",
    model: "R15 V3",
    available: true
  },
  {
    name: "Brembo Brake Pads Front Set",
    price: "₱2,800",
    image: "https://via.placeholder.com/400x300?text=Brake+Pads",
    description: "Premium brake pads for sport bikes. Provides excellent stopping power and heat resistance. Compatible with most sport motorcycle models.",
    category: "brake",
    brand: "Brembo",
    model: "Universal Sport Bike",
    available: true
  },
  {
    name: "LED Headlight Bulb H4",
    price: "₱1,200",
    image: "https://via.placeholder.com/400x300?text=LED+Bulb",
    description: "Ultra-bright LED headlight bulb with 6000K white light. Easy plug-and-play installation. 3x brighter than halogen bulbs with longer lifespan.",
    category: "electrical",
    brand: "Philips",
    model: "H4 LED",
    available: true
  },
  {
    name: "Carbon Fiber Exhaust Slip-on",
    price: "₱8,500",
    image: "https://via.placeholder.com/400x300?text=Exhaust",
    description: "Lightweight carbon fiber slip-on exhaust for sport bikes. Improves performance and gives aggressive sound. Easy installation with included mounting hardware.",
    category: "accessories",
    brand: "Akrapovic",
    model: "Universal Sport",
    available: true
  }
];

async function populateDatabase() {
  try {
    console.log('Starting to populate database with sample services...');

    // Add apartments
    console.log('Adding sample apartments...');
    for (const apartment of sampleApartments) {
      const apartmentRef = ref(database, 'apartments');
      const newApartmentRef = push(apartmentRef);
      await set(newApartmentRef, apartment);
      console.log(`Added apartment: ${apartment.title}`);
    }

    // Add laundry services
    console.log('Adding sample laundry services...');
    for (const laundry of sampleLaundryServices) {
      const laundryRef = ref(database, 'laundryServices');
      const newLaundryRef = push(laundryRef);
      await set(newLaundryRef, laundry);
      console.log(`Added laundry service: ${laundry.title}`);
    }

    // Add auto services
    console.log('Adding sample auto services...');
    for (const auto of sampleAutoServices) {
      const autoRef = ref(database, 'autoServices');
      const newAutoRef = push(autoRef);
      await set(newAutoRef, auto);
      console.log(`Added auto service: ${auto.title}`);
    }

    // Add motor parts
    console.log('Adding sample motor parts...');
    for (const part of sampleMotorParts) {
      const partRef = ref(database, 'motorParts');
      const newPartRef = push(partRef);
      await set(newPartRef, part);
      console.log(`Added motor part: ${part.name}`);
    }

    console.log('✅ Database populated successfully with sample services!');
    console.log('Added:');
    console.log(`- ${sampleApartments.length} apartments`);
    console.log(`- ${sampleLaundryServices.length} laundry services`);
    console.log(`- ${sampleAutoServices.length} auto services`);
    console.log(`- ${sampleMotorParts.length} motor parts`);
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
  }
}

// Run the script
populateDatabase();
