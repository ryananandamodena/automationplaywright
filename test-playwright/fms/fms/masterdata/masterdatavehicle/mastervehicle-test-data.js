/**
 * Master Vehicle Model Test Data Collection
 * Contains positive test cases with dynamic data
 */

// Helper function to generate unique random strings
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate random number in range
function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Branch list
const branches = [
  'Head Office',
  'Pool (Ganjil)',
  'Surabaya Branch',
  'Denpasar Branch',
  'Makassar Branch',
  'Banjarmasin Branch',
  'Balikpapan Branch',
  'Kediri Branch',
  'Medan Branch',
  'Semarang Branch',
  'Yogyakarta Branch',
  'Jakarta Branch',
  'Bandung Branch'
];

// Colors
const colors = ['Hitam', 'Putih', 'Silver', 'Merah', 'Biru', 'Abu-abu', 'Hijau'];

// Vehicle brands and their option values
const brands = [
  { name: 'Mitsubishi', value: '16' },
  { name: 'Daihatsu', value: '17' },
  { name: 'Toyota', value: '18' },
  { name: 'Honda', value: '19' },
  { name: 'Hyundai', value: '20' }
];

// Vehicle types by category
const vehicleTypes = {
  'Sedan': ['Sedan'],
  'Mini SUV': ['Mini SUV'],
  'MPV': ['MPV'],
  'SUV': ['SUV'],
  'Hatchback': ['Hatchback'],
  'Pick-up': ['Pick-up'],
  'Truk': ['Truk'],
  'Blind Van': ['Blind Van']
};

// Vehicle names by brand
const vehicleNames = {
  'Toyota': [
    'CAMRY 2.5V AT',
    'AVANZA 1.3 G A/T',
    'AVANZA 1.3 E CVT A/T',
    'INNOVA 2.0 G A/T',
    'FORTUNER 2.8 GR A/T',
    'VIOS 1.5 E A/T',
    'YARIS 1.5 S A/T',
    'ALPHARD 2.5X A/T',
    'RAV4 2.0 A/T',
    'COROLLA 1.8 HE A/T'
  ],
  'Honda': [
    'HONDA HR-V RU1 1.5 E CVT',
    'HONDA HR-V 1.5L E CVT',
    'CIVIC 1.5 TC A/T',
    'BR-V 1.5 S A/T',
    'MOBILIO 1.5 E A/T',
    'CR-V 2.0 A/T',
    'ODYSSEY 2.4 A/T',
    'JAZZ 1.5 V A/T',
    'CITY 1.5 V A/T',
    'HR-V 1.5L SE CVT'
  ],
  'Mitsubishi': [
    'Mitsubishi L-300',
    'Mitsubishi CDE Long',
    'Mitsubishi CDE Standard',
    'Mitsubishi CDE Box',
    'Mitsubishi Fuso Box',
    'Mitsubishi Xpander',
    'Mitsubishi Pajero Sport',
    'Mitsubishi Outlander',
    'Mitsubishi Eclipse Cross',
    'Mitsubishi FE-71 (MoMo)'
  ],
  'Daihatsu': [
    'Daihatsu Xenia',
    'Daihatsu Sigra',
    'Daihatsu Terios',
    'Daihatsu Rocky',
    'Daihatsu Ayla',
    'Daihatsu Gran Max',
    'Daihatsu Luxio',
    'Daihatsu GRANDPICK-New Blind Van',
    'Daihatsu Blind Van',
    'Daihatsu Hi-Max'
  ],
  'Hyundai': [
    'IONIQ 5 EV SIGNATURE EXN',
    'Stargazer',
    'Santa Fe',
    'Tucson',
    'Creta',
    'Palisade',
    'IONIQ 6',
    'Nexo',
    'Venue',
    'Kona Electric'
  ]
};

// Generate random vehicle data
function generateVehicleData() {
  const brand = brands[generateRandomNumber(0, brands.length - 1)];
  const vehicleList = vehicleNames[brand.name];
  const vehicleName = vehicleList[generateRandomNumber(0, vehicleList.length - 1)];
  const branch = branches[generateRandomNumber(0, branches.length - 1)];
  const color = colors[generateRandomNumber(0, colors.length - 1)];
  
  // Determine type based on vehicle name
  let type = 'MPV';
  if (vehicleName.toLowerCase().includes('camry') || vehicleName.toLowerCase().includes('civic') || vehicleName.toLowerCase().includes('corolla') || vehicleName.toLowerCase().includes('city') || vehicleName.toLowerCase().includes('jazz') || vehicleName.toLowerCase().includes('vios') || vehicleName.toLowerCase().includes('yaris')) {
    type = 'Sedan';
  } else if (vehicleName.toLowerCase().includes('hr-v') || vehicleName.toLowerCase().includes('br-v') || vehicleName.toLowerCase().includes('rav4') || vehicleName.toLowerCase().includes('kona') || vehicleName.toLowerCase().includes('venue')) {
    type = 'Mini SUV';
  } else if (vehicleName.toLowerCase().includes('suv') || vehicleName.toLowerCase().includes('fortuner') || vehicleName.toLowerCase().includes('pajero') || vehicleName.toLowerCase().includes('santa') || vehicleName.toLowerCase().includes('tucson') || vehicleName.toLowerCase().includes('palisade') || vehicleName.toLowerCase().includes('creta') || vehicleName.toLowerCase().includes('outlander')) {
    type = 'SUV';
  } else if (vehicleName.toLowerCase().includes('l-300') || vehicleName.toLowerCase().includes('gran max') || vehicleName.toLowerCase().includes('luxio')) {
    type = 'Pick-up';
  } else if (vehicleName.toLowerCase().includes('blind') || vehicleName.toLowerCase().includes('box')) {
    type = 'Truk';
  } else if (vehicleName.toLowerCase().includes('xpander') || vehicleName.toLowerCase().includes('stargazer') || vehicleName.toLowerCase().includes('innova') || vehicleName.toLowerCase().includes('avanza') || vehicleName.toLowerCase().includes('xenia') || vehicleName.toLowerCase().includes('sigra') || vehicleName.toLowerCase().includes('mobilio') || vehicleName.toLowerCase().includes('odyssey') || vehicleName.toLowerCase().includes('alphard') || vehicleName.toLowerCase().includes('rocky') || vehicleName.toLowerCase().includes('terios') || vehicleName.toLowerCase().includes('ayla')) {
    type = 'MPV';
  }
  
  return {
    branch: branch,
    brand: brand.name,
    brandValue: brand.value,
    name: vehicleName,
    type: type,
    color: color,
    additionalInfo: `${branch} - ${generateRandomString(6)}`
  };
}

// Generate 15 test cases
export const masterVehicleTestData = [];

for (let i = 1; i <= 15; i++) {
  const data = generateVehicleData();
  masterVehicleTestData.push({
    id: i,
    ...data,
    description: `Test Case #${i}: ${data.brand} - ${data.name} (${data.type}) at ${data.branch}`
  });
}

// Brand options mapping for test
export const brandOptions = {
  'Mitsubishi': '16',
  'Daihatsu': '17',
  'Toyota': '18',
  'Honda': '19',
  'Hyundai': '20'
};

// Export default
export default masterVehicleTestData;
