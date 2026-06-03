/**
 * Vehicle Test Data Collection
 * Contains 15 positive test cases with dynamic data
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

// Helper function to generate future date
function generateFutureDate(yearsAhead = 1) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + yearsAhead);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(generateRandomNumber(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to generate past date
function generatePastDate(yearsBack = 5) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - yearsBack);
  const year = date.getFullYear();
  const month = String(generateRandomNumber(1, 12)).padStart(2, '0');
  const day = String(generateRandomNumber(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// License plate prefixes
const platePrefixes = ['B', 'D', 'F', 'H', 'G', 'E', 'T', 'K', 'R', 'S', 'L', 'M', 'N', 'P', 'W'];
const plateLetters = ['ABCDEFGHJKLMNPRSTVWXYZ'];

// Generate unique license plate
function generateLicensePlate() {
  const prefix = platePrefixes[generateRandomNumber(0, platePrefixes.length - 1)];
  const number = String(generateRandomNumber(1, 9999)).padStart(4, '0');
  const letters = generateRandomString(3);
  return `${prefix} ${number} ${letters}`;
}

// Vehicle test data collection - 15 positive test cases
export const vehicleTestData = [
  {
    id: 1,
    vehicleType: 'Leased',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Daihatsu Xenia',
    cylinder: '3',
    type: 'Medium SUV',
    seats: '5',
    year: '2018',
    cc: '1000',
    chassis: `DAIHATSU${generateRandomString(10)}`,
    engine: `K3-VE${generateRandomString(6)}`,
    fuel: '5', // Petrol
    transmission: '2', // Automatic
    userName: 'Dedi Selametan',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    leaseStartDate: generatePastDate(3),
    leaseEndDate: generateFutureDate(1),
    amount: '275000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Leased Daihatsu Xenia - Positive Test Case 1'
  },
  {
    id: 2,
    vehicleType: 'Owned',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Honda Civic',
    cylinder: '4',
    type: 'Sedan',
    seats: '4',
    year: '2019',
    cc: '1500',
    chassis: `HONDA${generateRandomString(10)}`,
    engine: `L15B7-${generateRandomString(6)}`,
    fuel: '5',
    transmission: '1', // Manual
    userName: 'Budi Santoso',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(2),
    insuranceDate: generateFutureDate(2),
    leaseStartDate: generatePastDate(4),
    leaseEndDate: generateFutureDate(2),
    amount: '350000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Owned Honda Civic - Positive Test Case 2'
  },
  {
    id: 3,
    vehicleType: 'Leased',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Toyota Innova',
    cylinder: '4',
    type: 'Large SUV',
    seats: '7',
    year: '2020',
    cc: '2000',
    chassis: `TOYOTA${generateRandomString(10)}`,
    engine: `1TR-FE${generateRandomString(6)}`,
    fuel: '5',
    transmission: '1',
    userName: 'Siti Rahayu',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(3),
    insuranceDate: generateFutureDate(3),
    leaseStartDate: generatePastDate(2),
    leaseEndDate: generateFutureDate(3),
    amount: '450000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Leased Toyota Innova - Positive Test Case 3'
  },
  {
    id: 4,
    vehicleType: 'Owned',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Mitsubishi Xpander',
    cylinder: '4',
    type: 'MPV',
    seats: '7',
    year: '2021',
    cc: '1500',
    chassis: `MITSUB${generateRandomString(10)}`,
    engine: `4A91${generateRandomString(6)}`,
    fuel: '5',
    transmission: '2',
    userName: 'Ahmad Fauzi',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    leaseStartDate: generatePastDate(1),
    leaseEndDate: generateFutureDate(1),
    amount: '280000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Owned Mitsubishi Xpander - Positive Test Case 4'
  },
  {
    id: 5,
    vehicleType: 'Leased',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Nissan Livina',
    cylinder: '4',
    type: 'MPV',
    seats: '7',
    year: '2019',
    cc: '1500',
    chassis: `NISSAN${generateRandomString(10)}`,
    engine: `HR15DE${generateRandomString(6)}`,
    fuel: '5',
    transmission: '2',
    userName: 'Rina Susilowati',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(2),
    insuranceDate: generateFutureDate(2),
    leaseStartDate: generatePastDate(3),
    leaseEndDate: generateFutureDate(2),
    amount: '265000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Leased Nissan Livina - Positive Test Case 5'
  },
  {
    id: 6,
    vehicleType: 'Owned',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Suzuki Ertiga',
    cylinder: '4',
    type: 'MPV',
    seats: '7',
    year: '2020',
    cc: '1400',
    chassis: `SUZUKI${generateRandomString(10)}`,
    engine: `K15B${generateRandomString(6)}`,
    fuel: '5',
    transmission: '1',
    userName: 'Joko Pramono',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    leaseStartDate: generatePastDate(2),
    leaseEndDate: generateFutureDate(1),
    amount: '220000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Owned Suzuki Ertiga - Positive Test Case 6'
  },
  {
    id: 7,
    vehicleType: 'Leased',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Toyota Alphard',
    cylinder: '4',
    type: 'Premium MPV',
    seats: '7',
    year: '2021',
    cc: '2500',
    chassis: `ALPHARD${generateRandomString(10)}`,
    engine: `2AR-FE${generateRandomString(6)}`,
    fuel: '5',
    transmission: '2',
    userName: 'Diana Kusuma',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(2),
    insuranceDate: generateFutureDate(2),
    leaseStartDate: generatePastDate(1),
    leaseEndDate: generateFutureDate(2),
    amount: '850000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Leased Toyota Alphard - Positive Test Case 7'
  },
  {
    id: 8,
    vehicleType: 'Owned',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Honda HR-V',
    cylinder: '4',
    type: 'Compact SUV',
    seats: '5',
    year: '2022',
    cc: '1500',
    chassis: `HRV${generateRandomString(10)}`,
    engine: `L15Z1${generateRandomString(6)}`,
    fuel: '5',
    transmission: '2',
    userName: 'Ferry Gunawan',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    leaseStartDate: generatePastDate(1),
    leaseEndDate: generateFutureDate(1),
    amount: '320000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Owned Honda HR-V - Positive Test Case 8'
  },
  {
    id: 9,
    vehicleType: 'Leased',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Toyota Fortuner',
    cylinder: '4',
    type: 'Large SUV',
    seats: '7',
    year: '2020',
    cc: '2700',
    chassis: `FORTUNR${generateRandomString(10)}`,
    engine: `2TR-FE${generateRandomString(6)}`,
    fuel: '5',
    transmission: '2',
    userName: 'Hendra Wijaya',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(2),
    insuranceDate: generateFutureDate(2),
    leaseStartDate: generatePastDate(2),
    leaseEndDate: generateFutureDate(2),
    amount: '550000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Leased Toyota Fortuner - Positive Test Case 9'
  },
  {
    id: 10,
    vehicleType: 'Owned',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Mitsubishi Pajero',
    cylinder: '4',
    type: 'Large SUV',
    seats: '7',
    year: '2019',
    cc: '3000',
    chassis: `PAJERO${generateRandomString(10)}`,
    engine: `6G75${generateRandomString(6)}`,
    fuel: '5',
    transmission: '2',
    userName: 'Yanti Novitasari',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    leaseStartDate: generatePastDate(3),
    leaseEndDate: generateFutureDate(1),
    amount: '620000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Owned Mitsubishi Pajero - Positive Test Case 10'
  },
  {
    id: 11,
    vehicleType: 'Leased',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Honda Jazz',
    cylinder: '4',
    type: 'Hatchback',
    seats: '5',
    year: '2018',
    cc: '1400',
    chassis: `JAZZ${generateRandomString(10)}`,
    engine: `L15A1${generateRandomString(6)}`,
    fuel: '5',
    transmission: '1',
    userName: 'Toni Mahendra',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    leaseStartDate: generatePastDate(4),
    leaseEndDate: generateFutureDate(1),
    amount: '195000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Leased Honda Jazz - Positive Test Case 11'
  },
  {
    id: 12,
    vehicleType: 'Owned',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Suzuki Baleno',
    cylinder: '4',
    type: 'Hatchback',
    seats: '5',
    year: '2019',
    cc: '1300',
    chassis: `BALENO${generateRandomString(10)}`,
    engine: `K12C${generateRandomString(6)}`,
    fuel: '5',
    transmission: '1',
    userName: 'Mega Utami',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(2),
    insuranceDate: generateFutureDate(2),
    leaseStartDate: generatePastDate(2),
    leaseEndDate: generateFutureDate(2),
    amount: '180000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Owned Suzuki Baleno - Positive Test Case 12'
  },
  {
    id: 13,
    vehicleType: 'Leased',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Toyota Vios',
    cylinder: '4',
    type: 'Sedan',
    seats: '5',
    year: '2017',
    cc: '1500',
    chassis: `VIOS${generateRandomString(10)}`,
    engine: `2NR-FE${generateRandomString(6)}`,
    fuel: '5',
    transmission: '1',
    userName: 'Rendi Kurniawan',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    leaseStartDate: generatePastDate(5),
    leaseEndDate: generateFutureDate(1),
    amount: '210000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Leased Toyota Vios - Positive Test Case 13'
  },
  {
    id: 14,
    vehicleType: 'Owned',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Hyundai Stargazer',
    cylinder: '4',
    type: 'MPV',
    seats: '7',
    year: '2023',
    cc: '1500',
    chassis: `STARGAZ${generateRandomString(10)}`,
    engine: `G4FL${generateRandomString(6)}`,
    fuel: '5',
    transmission: '2',
    userName: 'Lisa Permata',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(2),
    insuranceDate: generateFutureDate(2),
    leaseStartDate: generatePastDate(1),
    leaseEndDate: generateFutureDate(2),
    amount: '290000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Owned Hyundai Stargazer - Positive Test Case 14'
  },
  {
    id: 15,
    vehicleType: 'Leased',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Wuling Confero',
    cylinder: '4',
    type: 'MPV',
    seats: '7',
    year: '2020',
    cc: '1500',
    chassis: `CONFERO${generateRandomString(10)}`,
    engine: `L15Z1${generateRandomString(6)}`,
    fuel: '5',
    transmission: '1',
    userName: 'Bagus Pratama',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    leaseStartDate: generatePastDate(2),
    leaseEndDate: generateFutureDate(1),
    amount: '175000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`,
    description: 'Leased Wuling Confero - Positive Test Case 15'
  }
];

// Export for use in test files
export default vehicleTestData;
