import { test, expect } from '@playwright/test';

// Configure test to use Chromium only
test.use({ browserName: 'chromium' });

// Shared brand list - used for both Master Brand and Master Vehicle
const brands = [
  'Mitsubishi',
  'Daihatsu',
  'Toyota',
  'Honda',
  'Suzuki',
  'Nissan',
  'Mazda',
  'Wuling',
  'Hyundai',
  'Kia',
  'Isuzu',
  'BMW',
  'Mercedes-Benz',
  'Lexus',
  'Audi',
  'Volkswagen',
  'Chevrolet',
  'Ford',
  'Peugeot',
  'DFSK',
  'Chery',
  'Subaru',
  'Volvo',
  'Jaguar',
  'Land Rover',
  'Porsche',
  'MINI',
  'Jeep',
  'Hino',
  'UD Trucks',
  'Scania',
  'MG',
  'Renault',
  'Citroen',
  'Geely',
  'BYD',
  'Great Wall',
  'Haval'
];

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

// Vehicle types
const vehicleTypes = ['Sedan', 'Mini SUV', 'MPV', 'SUV', 'Hatchback', 'Pick-up', 'Truk', 'Blind Van'];

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
    'COROLLA 1.8 HE A/T',
    'VELLFIRE 2.4 A/T',
    'HIACE 2.5 A/T',
    'HILUX 2.4 G A/T',
    'LAND CRUISER 4.6 A/T',
    'PRADO 4.0 A/T',
    'C-HR 1.8 A/T',
    'RUSH 1.5 G A/T',
    'CALYA 1.2 E A/T',
    'AGYA 1.2 G A/T',
    'SIENNA 3.5 A/T'
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
    'HR-V 1.5L SE CVT',
    'ACCORD 2.0 A/T',
    'WR-V 1.5 S A/T',
    'CR-Z 1.5 A/T',
    'FREED 1.5 S A/T',
    'STEPWGN 2.0 A/T',
    'LEGEND 3.5 A/T',
    'NSX 3.5 A/T',
    'PASSPORT 3.5 A/T',
    'PILOT 3.5 A/T',
    'RIDGELINE 3.5 A/T'
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
    'Mitsubishi FE-71 (MoMo)',
    'Mitsubishi Colt L300',
    'Mitsubishi Delica',
    'Mitsubishi Mirage',
    'Mitsubishi Attrage',
    'Mitsubishi Triton',
    'Mitsubishi Fighter',
    'Mitsubishi Rosa',
    'Mitsubishi Fuso Canter',
    'Mitsubishi Pajero',
    'Mitsubishi ASX'
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
    'Daihatsu Hi-Max',
    'Daihatsu Sirion',
    'Daihatsu Charade',
    'Daihatsu Taft',
    'Daihatsu Feroza',
    'Daihatsu Rocky Retro',
    'Daihatsu Materia',
    'Daihatsu Copen',
    'Daihatsu Move',
    'Daihatsu Tanto',
    'Daihatsu Hijet'
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
    'Kona Electric',
    'Starex',
    'H-1',
    'Accent',
    'Elantra',
    'Sonata',
    'Veloster',
    'Ioniq Electric',
    'Kona',
    'Grandeur',
    'Genesis'
  ],
  'Suzuki': [
    'Suzuki Ertiga',
    'Suzuki XL7',
    'Suzuki Jimny',
    'Suzuki Vitara',
    'Suzuki Brezza',
    'Suzuki Baleno',
    'Suzuki Ciaz',
    'Suzuki Dzire',
    'Suzuki Carry',
    'Suzuki APV',
    'Suzuki Swift',
    'Suzuki Ignis',
    'Suzuki S-Presso',
    'Suzuki Celerio',
    'Suzuki Karimun',
    'Suzuki Katana',
    'Suzuki Futura',
    'Suzuki Sidekick',
    'Suzuki Grand Vitara',
    'Suzuki SX4'
  ],
  'Nissan': [
    'Nissan X-Trail',
    'Nissan Kicks',
    'Nissan Magnite',
    'Nissan Navara',
    'Nissan Serena',
    'Nissan Leaf',
    'Nissan Terra',
    'Nissan Almera',
    'Nissan Note',
    'Nissan Livina',
    'Nissan GT-R',
    'Nissan 370Z',
    'Nissan Patrol',
    'Nissan Safari',
    'Nissan Elgrand',
    'Nissan NV350',
    'Nissan NV200',
    'Nissan March',
    'Nissan Sunny',
    'Nissan Teana'
  ],
  'Mazda': [
    'Mazda CX-5',
    'Mazda CX-3',
    'Mazda CX-9',
    'Mazda CX-30',
    'Mazda3',
    'Mazda6',
    'Mazda MX-5',
    'Mazda BT-50',
    'Mazda CX-8',
    'Mazda2',
    'Mazda CX-7',
    'Mazda RX-8',
    'Mazda Tribute',
    'Mazda Premacy',
    'Mazda Biante',
    'Mazda CX-60',
    'Mazda CX-90',
    'Mazda MX-30',
    'Mazda Demio',
    'Mazda Axela'
  ],
  'Wuling': [
    'Wuling Almaz',
    'Wuling Cortez',
    'Wuling Confero',
    'Wuling Formo',
    'Wuling Airtek',
    'Wuling EV',
    'Wuling Starlight',
    'Wuling Binguo',
    'Wuling Alvez',
    'Wuling Capcay',
    'Wuling Hongguang',
    'Wuling Sunshine',
    'Wuling Sunshine Van',
    'Wuling Formo S',
    'Wuling Confero S',
    'Wuling Cortez S',
    'Wuling Almaz RS',
    'Wuling Air EV',
    'Wuling Cloud EV',
    'Wuling GSEV'
  ],
  'Kia': [
    'Kia Seltos',
    'Kia Sportage',
    'Kia Sorento',
    'Kia Carnival',
    'Kia Rio',
    'Kia Picanto',
    'Kia Stinger',
    'Kia K5',
    'Kia Sonet',
    'Kia Carens',
    'Kia Soul',
    'Kia Telluride',
    'Kia Mohave',
    'Kia K900',
    'Kia Ceed',
    'Kia Stonic',
    'Kia Seltos X-Line',
    'Kia EV6',
    'Kia Niro',
    'Kia Optima'
  ],
  'Isuzu': [
    'Isuzu D-Max',
    'Isuzu MU-X',
    'Isuzu Elf',
    'Isuzu Giga',
    'Isuzu Forward',
    'Isuzu NMR',
    'Isuzu NPR',
    'Isuzu NQR',
    'Isuzu NKR',
    'Isuzu FTR',
    'Isuzu FSR',
    'Isuzu FRR',
    'Isuzu CYZ',
    'Isuzu CYL',
    'Isuzu Panther',
    'Isuzu Bison',
    'Isuzu Vega',
    'Isuzu Hi-Lander',
    'Isuzu D-Max X-Rider',
    'Isuzu D-Max X-Series'
  ],
  'BMW': [
    'BMW 320i',
    'BMW 530i',
    'BMW X3',
    'BMW X5',
    'BMW X7',
    'BMW 740i',
    'BMW M3',
    'BMW M5',
    'BMW iX',
    'BMW i4',
    'BMW 118i',
    'BMW 220i',
    'BMW 420i',
    'BMW 520i',
    'BMW 630i',
    'BMW 840i',
    'BMW X1',
    'BMW X2',
    'BMW X4',
    'BMW X6',
    'BMW Z4',
    'BMW i3',
    'BMW i7',
    'BMW iX3',
    'BMW M2',
    'BMW M4',
    'BMW M8',
    'BMW XM',
    'BMW X5 M',
    'BMW X6 M'
  ],
  'Mercedes-Benz': [
    'Mercedes C200',
    'Mercedes E300',
    'Mercedes S450',
    'Mercedes GLC',
    'Mercedes GLE',
    'Mercedes GLS',
    'Mercedes A-Class',
    'Mercedes B-Class',
    'Mercedes EQC',
    'Mercedes G-Class',
    'Mercedes A180',
    'Mercedes A200',
    'Mercedes A250',
    'Mercedes C180',
    'Mercedes C300',
    'Mercedes CLA200',
    'Mercedes CLA250',
    'Mercedes CLS400',
    'Mercedes E200',
    'Mercedes E400',
    'Mercedes GLA200',
    'Mercedes GLA250',
    'Mercedes GLB200',
    'Mercedes GLC300',
    'Mercedes GLE350',
    'Mercedes GLS450',
    'Mercedes AMG GT',
    'Mercedes Maybach',
    'Mercedes EQA',
    'Mercedes EQB'
  ],
  'Lexus': [
    'Lexus ES300h',
    'Lexus RX350',
    'Lexus LX570',
    'Lexus NX300',
    'Lexus UX200',
    'Lexus GS300',
    'Lexus LS500',
    'Lexus RC300',
    'Lexus LC500',
    'Lexus GX460',
    'Lexus ES250',
    'Lexus ES350',
    'Lexus RX450h',
    'Lexus NX350h',
    'Lexus UX250h',
    'Lexus GS350',
    'Lexus LS460',
    'Lexus RC350',
    'Lexus LX600',
    'Lexus GX550'
  ],
  'Audi': [
    'Audi A4',
    'Audi A6',
    'Audi A8',
    'Audi Q3',
    'Audi Q5',
    'Audi Q7',
    'Audi Q8',
    'Audi e-tron',
    'Audi RS6',
    'Audi RS7',
    'Audi A3',
    'Audi A5',
    'Audi A7',
    'Audi S3',
    'Audi S4',
    'Audi S5',
    'Audi S6',
    'Audi S7',
    'Audi S8',
    'Audi TT'
  ],
  'Volkswagen': [
    'Volkswagen Golf',
    'Volkswagen Passat',
    'Volkswagen Tiguan',
    'Volkswagen Touareg',
    'Volkswagen Polo',
    'Volkswagen Jetta',
    'Volkswagen Beetle',
    'Volkswagen Amarok',
    'Volkswagen Caddy',
    'Volkswagen Transporter',
    'Volkswagen Caravelle',
    'Volkswagen Multivan',
    'Volkswagen T-Roc',
    'Volkswagen T-Cross',
    'Volkswagen Teramont',
    'Volkswagen Arteon',
    'Volkswagen ID.3',
    'Volkswagen ID.4',
    'Volkswagen ID.Buzz',
    'Volkswagen Taos'
  ],
  'Chevrolet': [
    'Chevrolet Cruze',
    'Chevrolet Malibu',
    'Chevrolet Camaro',
    'Chevrolet Corvette',
    'Chevrolet Equinox',
    'Chevrolet Traverse',
    'Chevrolet Tahoe',
    'Chevrolet Suburban',
    'Chevrolet Colorado',
    'Chevrolet Silverado',
    'Chevrolet Spark',
    'Chevrolet Sonic',
    'Chevrolet Trax',
    'Chevrolet Trailblazer',
    'Chevrolet Blazer',
    'Chevrolet Bolt',
    'Chevrolet Aveo',
    'Chevrolet Optra',
    'Chevrolet Captiva',
    'Chevrolet Spin'
  ],
  'Ford': [
    'Ford Focus',
    'Ford Fiesta',
    'Ford Mustang',
    'Ford F-150',
    'Ford Ranger',
    'Ford Explorer',
    'Ford Expedition',
    'Ford Escape',
    'Ford Edge',
    'Ford Everest',
    'Ford EcoSport',
    'Ford Bronco',
    'Ford Territory',
    'Ford Mondeo',
    'Ford Fusion',
    'Ford Taurus',
    'Ford Transit',
    'Ford E-Series',
    'Ford F-250',
    'Ford F-350'
  ],
  'Peugeot': [
    'Peugeot 208',
    'Peugeot 308',
    'Peugeot 508',
    'Peugeot 2008',
    'Peugeot 3008',
    'Peugeot 5008',
    'Peugeot 408',
    'Peugeot 108',
    'Peugeot 208',
    'Peugeot 308 SW',
    'Peugeot 508 SW',
    'Peugeot Rifter',
    'Peugeot Traveller',
    'Peugeot Expert',
    'Peugeot Partner',
    'Peugeot e-208',
    'Peugeot e-2008',
    'Peugeot e-308',
    'Peugeot e-Rifter',
    'Peugeot e-Traveller'
  ],
  'DFSK': [
    'DFSK Glory 580',
    'DFSK Glory E3',
    'DFSK Super Cab',
    'DFSK Gelora E',
    'DFSK Gelora',
    'DFSK EC35',
    'DFSK EQ200',
    'DFSK Fengon 580',
    'DFSK Fengon 600',
    'DFSK Fengon 500',
    'DFSK Glory i-Auto',
    'DFSK Glory S560',
    'DFSK Sitec',
    'DFSK C31',
    'DFSK C32',
    'DFSK C35',
    'DFSK C36',
    'DFSK K01',
    'DFSK K02',
    'DFSK K07'
  ],
  'Chery': [
    'Chery Tiggo 8 Pro',
    'Chery Tiggo 7 Pro',
    'Chery Tiggo 5x',
    'Chery Tiggo 2',
    'Chery Arrizo 5',
    'Chery Arrizo 6',
    'Chery Arrizo 8',
    'Chery Omoda 5',
    'Chery eQ1',
    'Chery eQ2',
    'Chery eQ5',
    'Chery QQ',
    'Chery Fulwin',
    'Chery Eastar',
    'Chery CrossEast',
    'Chery Karry',
    'Chery Jetour',
    'Chery Exeed',
    'Chery Jetour X70',
    'Chery Jetour X90'
  ],
  'Subaru': [
    'Subaru Forester',
    'Subaru Outback',
    'Subaru XV',
    'Subaru Impreza',
    'Subaru WRX',
    'Subaru BRZ',
    'Subaru Legacy',
    'Subaru Ascent',
    'Subaru Crosstrek',
    'Subaru Levorg',
    'Subaru Tribeca',
    'Subaru Baja',
    'Subaru SVX',
    'Subaru Justy',
    'Subaru Rex',
    'Subaru Sambar',
    'Subaru Exiga',
    'Subaru Trezia',
    'Subaru Dex',
    'Subaru Pleo'
  ],
  'Volvo': [
    'Volvo XC60',
    'Volvo XC90',
    'Volvo XC40',
    'Volvo S60',
    'Volvo S90',
    'Volvo V60',
    'Volvo V90',
    'Volvo C40',
    'Volvo EX90',
    'Volvo EX30',
    'Volvo V40',
    'Volvo V50',
    'Volvo V70',
    'Volvo S40',
    'Volvo S80',
    'Volvo C30',
    'Volvo C70',
    'Volvo XC70',
    'Volvo V60 Cross Country',
    'Volvo V90 Cross Country'
  ],
  'Jaguar': [
    'Jaguar XE',
    'Jaguar XF',
    'Jaguar XJ',
    'Jaguar F-Type',
    'Jaguar F-Pace',
    'Jaguar E-Pace',
    'Jaguar I-Pace',
    'Jaguar XK',
    'Jaguar XKR',
    'Jaguar XJ220',
    'Jaguar S-Type',
    'Jaguar X-Type',
    'Jaguar XJS',
    'Jaguar XJ-S',
    'Jaguar XJ6',
    'Jaguar XJ8',
    'Jaguar XJR',
    'Jaguar XFR',
    'Jaguar XKR-S',
    'Jaguar Project 7'
  ],
  'Land Rover': [
    'Land Rover Range Rover',
    'Land Rover Range Rover Sport',
    'Land Rover Range Rover Evoque',
    'Land Rover Range Rover Velar',
    'Land Rover Discovery',
    'Land Rover Discovery Sport',
    'Land Rover Defender',
    'Land Rover Freelander',
    'Land Rover LR2',
    'Land Rover LR3',
    'Land Rover LR4',
    'Land Rover Defender 90',
    'Land Rover Defender 110',
    'Land Rover Defender 130',
    'Land Rover Range Rover Classic',
    'Land Rover Discovery 1',
    'Land Rover Discovery 2',
    'Land Rover Discovery 3',
    'Land Rover Discovery 4',
    'Land Rover Series I'
  ],
  'Porsche': [
    'Porsche 911',
    'Porsche Cayenne',
    'Porsche Macan',
    'Porsche Panamera',
    'Porsche Taycan',
    'Porsche 718 Boxster',
    'Porsche 718 Cayman',
    'Porsche 918 Spyder',
    'Porsche Cayman',
    'Porsche Boxster',
    'Porsche 911 GT3',
    'Porsche 911 GT2',
    'Porsche 911 Turbo',
    'Porsche 911 Carrera',
    'Porsche 911 Targa',
    'Porsche Cayenne Coupe',
    'Porsche Macan GTS',
    'Porsche Panamera GTS',
    'Porsche Taycan Turbo',
    'Porsche Taycan Cross Turismo'
  ],
  'MINI': [
    'MINI Cooper',
    'MINI Cooper S',
    'MINI Countryman',
    'MINI Clubman',
    'MINI Paceman',
    'MINI Coupe',
    'MINI Roadster',
    'MINI Convertible',
    'MINI John Cooper Works',
    'MINI Electric',
    'MINI One',
    'MINI One D',
    'MINI Cooper D',
    'MINI Cooper SD',
    'MINI Countryman S',
    'MINI Countryman JCW',
    'MINI Clubman S',
    'MINI Clubman JCW',
    'MINI GP',
    'MINI Aceman'
  ],
  'Jeep': [
    'Jeep Wrangler',
    'Jeep Grand Cherokee',
    'Jeep Cherokee',
    'Jeep Compass',
    'Jeep Renegade',
    'Jeep Gladiator',
    'Jeep Patriot',
    'Jeep Liberty',
    'Jeep Commander',
    'Jeep Wagoneer',
    'Jeep Grand Wagoneer',
    'Jeep CJ',
    'Jeep YJ',
    'Jeep TJ',
    'Jeep JK',
    'Jeep JL',
    'Jeep Rubicon',
    'Jeep Sahara',
    'Jeep Sport',
    'Jeep Overland'
  ],
  'Hino': [
    'Hino Dutro',
    'Hino Ranger',
    'Hino Profia',
    'Hino Ponse',
    'Hino Lina',
    'Hino FM',
    'Hino FG',
    'Hino FL',
    'Hino FM1J',
    'Hino FM2J',
    'Hino FM3J',
    'Hino FG1J',
    'Hino FG2J',
    'Hino FL1J',
    'Hino FL2J',
    'Hino AK1J',
    'Hino AK4J',
    'Hino SG1J',
    'Hino SG2J',
    'Hino SS2J'
  ],
  'UD Trucks': [
    'UD Trucks Quester',
    'UD Trucks Croner',
    'UD Trucks Quon',
    'UD Trucks Kazet',
    'UD Trucks Condor',
    'UD Trucks Big Thumb',
    'UD Trucks Serpo',
    'UD Trucks NISSAN DIESEL',
    'UD Trucks UD130',
    'UD Trucks UD140',
    'UD Trucks UD180',
    'UD Trucks UD220',
    'UD Trucks UD260',
    'UD Trucks UD280',
    'UD Trucks UD330',
    'UD Trucks UD350',
    'UD Trucks UD380',
    'UD Trucks UD410',
    'UD Trucks UD440',
    'UD Trucks UD520'
  ],
  'Scania': [
    'Scania R-Series',
    'Scania S-Series',
    'Scania G-Series',
    'Scania P-Series',
    'Scania L-Series',
    'Scania XT-Series',
    'Scania Citywide',
    'Scania OmniExpress',
    'Scania Interlink',
    'Scania Touring',
    'Scania R450',
    'Scania R500',
    'Scania R540',
    'Scania S500',
    'Scania S540',
    'Scania G410',
    'Scania G450',
    'Scania P360',
    'Scania P400',
    'Scania L360'
  ],
  'MG': [
    'MG ZS',
    'MG ZS EV',
    'MG HS',
    'MG HS PHEV',
    'MG Marvel R',
    'MG MG3',
    'MG MG5',
    'MG MG4',
    'MG MG6',
    'MG RX5',
    'MG RX8',
    'MG One',
    'MG Gloster',
    'MG Hector',
    'MG Astor',
    'MG Comet EV',
    'MG Cyberster',
    'MG EHS',
    'MG EZS',
    'MG G50'
  ],
  'Renault': [
    'Renault Clio',
    'Renault Megane',
    'Renault Captur',
    'Renault Kadjar',
    'Renault Koleos',
    'Renault Duster',
    'Renault Sandero',
    'Renault Logan',
    'Renault Fluence',
    'Renault Latitude',
    'Renault Talisman',
    'Renault Scenic',
    'Renault Grand Scenic',
    'Renault Espace',
    'Renault Kangoo',
    'Renault Trafic',
    'Renault Master',
    'Renault Zoe',
    'Renault Twingo',
    'Renault Twizy'
  ],
  'Citroen': [
    'Citroen C3',
    'Citroen C4',
    'Citroen C5',
    'Citroen C3 Aircross',
    'Citroen C4 Cactus',
    'Citroen C5 Aircross',
    'Citroen Berlingo',
    'Citroen SpaceTourer',
    'Citroen Jumper',
    'Citroen Jumpy',
    'Citroen DS3',
    'Citroen DS4',
    'Citroen DS5',
    'Citroen DS7',
    'Citroen Ami',
    'Citroen e-C3',
    'Citroen e-C4',
    'Citroen e-Berlingo',
    'Citroen e-SpaceTourer',
    'Citroen e-Jumpy'
  ],
  'Geely': [
    'Geely Coolray',
    'Geely Azkarra',
    'Geely Okavango',
    'Geely Emgrand',
    'Geely Geometry C',
    'Geely Geometry A',
    'Geely Tugella',
    'Geely Monjaro',
    'Geely Panda Mini',
    'Geely Xingyue',
    'Geely Haoyue',
    'Geely Jiaji',
    'Geely Binyue',
    'Geely Boyue',
    'Geely Emgrand GS',
    'Geely Emgrand GL',
    'Geely Vision',
    'Geely GC9',
    'Geely MK',
    'Geely LC'
  ],
  'BYD': [
    'BYD Atto 3',
    'BYD Dolphin',
    'BYD Seal',
    'BYD Tang',
    'BYD Han',
    'BYD Qin',
    'BYD Song',
    'BYD Yuan',
    'BYD e1',
    'BYD e2',
    'BYD e3',
    'BYD e5',
    'BYD e6',
    'BYD e9',
    'BYD D1',
    'BYD M3',
    'BYD T3',
    'BYD Qin Plus',
    'BYD Song Plus',
    'BYD Yuan Plus'
  ],
  'Great Wall': [
    'Great Wall Haval H6',
    'Great Wall Haval Jolion',
    'Great Wall Haval H9',
    'Great Wall Haval H5',
    'Great Wall Haval F7',
    'Great Wall Haval F7x',
    'Great Wall Wingle 5',
    'Great Wall Wingle 6',
    'Great Wall Wingle 7',
    'Great Wall Poer',
    'Great Wall Cannon',
    'Great Wall Steed',
    'Great Wall V200',
    'Great Wall V240',
    'Great Wall M4',
    'Great Wall M6',
    'Great Wall Tank 300',
    'Great Wall Tank 500',
    'Great Wall WEY VV5',
    'Great Wall WEY VV7'
  ],
  'Haval': [
    'Haval H6',
    'Haval Jolion',
    'Haval H9',
    'Haval H5',
    'Haval H2',
    'Haval H4',
    'Haval F7',
    'Haval F7x',
    'Haval Dargo',
    'Haval Big Dog',
    'Haval Chitu',
    'Haval Chulong',
    'Haval H6 GT',
    'Haval H6 Supreme',
    'Haval H6 Ultra',
    'Haval Jolion Ultra',
    'Haval Jolion Premium',
    'Haval H9 Lux',
    'Haval H9 Ultra',
    'Haval Tank 300'
  ],
  'Default': [
    'Standard Model A',
    'Standard Model B',
    'Standard Model C',
    'Standard Model D',
    'Standard Model E',
    'Standard Model F',
    'Standard Model G',
    'Standard Model H',
    'Standard Model I',
    'Standard Model J'
  ]
};

// Helper function to generate random number in range
function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random string
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get vehicle names for a brand (fallback to default)
function getVehicleNamesForBrand(brandName) {
  return vehicleNames[brandName] || vehicleNames['Default'];
}

// Determine vehicle type based on name
function determineVehicleType(vehicleName) {
  const name = vehicleName.toLowerCase();
  if (name.includes('camry') || name.includes('civic') || name.includes('corolla') || 
      name.includes('city') || name.includes('jazz') || name.includes('vios') || 
      name.includes('yaris') || name.includes('mazda3') || name.includes('mazda6') ||
      name.includes('320i') || name.includes('530i') || name.includes('c200') || name.includes('e300')) {
    return 'Sedan';
  } else if (name.includes('hr-v') || name.includes('br-v') || name.includes('rav4') || 
             name.includes('kona') || name.includes('venue') || name.includes('seltos') ||
             name.includes('jimny') || name.includes('brezza') || name.includes('cx-3')) {
    return 'Mini SUV';
  } else if (name.includes('suv') || name.includes('fortuner') || name.includes('pajero') || 
             name.includes('santa') || name.includes('tucson') || name.includes('palisade') || 
             name.includes('creta') || name.includes('outlander') || name.includes('x-trail') ||
             name.includes('cx-5') || name.includes('cx-9') || name.includes('sportage') ||
             name.includes('sorento') || name.includes('x3') || name.includes('x5') || name.includes('glc')) {
    return 'SUV';
  } else if (name.includes('l-300') || name.includes('gran max') || name.includes('luxio') ||
             name.includes('carry') || name.includes('navara') || name.includes('bt-50')) {
    return 'Pick-up';
  } else if (name.includes('blind') || name.includes('box') || name.includes('fuso') || name.includes('apv')) {
    return 'Truk';
  } else if (name.includes('hatchback') || name.includes('mazda2') || name.includes('picanto') || name.includes('rio')) {
    return 'Hatchback';
  }
  return 'MPV';
}

// Generate vehicle data from created brands
function generateVehicleDataFromBrands(createdBrands) {
  const vehicles = [];
  
  for (let i = 0; i < 15; i++) {
    const brand = createdBrands[generateRandomNumber(0, createdBrands.length - 1)];
    const vehicleList = getVehicleNamesForBrand(brand);
    const vehicleName = vehicleList[generateRandomNumber(0, vehicleList.length - 1)];
    const branch = branches[generateRandomNumber(0, branches.length - 1)];
    const color = colors[generateRandomNumber(0, colors.length - 1)];
    const type = determineVehicleType(vehicleName);
    
    vehicles.push({
      id: i + 1,
      branch: branch,
      brand: brand,
      name: vehicleName,
      type: type,
      color: color,
      additionalInfo: `${branch} - ${generateRandomString(6)}`,
      description: `Test Case #${i + 1}: ${brand} - ${vehicleName} (${type}) at ${branch}`
    });
  }
  
  return vehicles;
}

test('Create Master Brand then Master Vehicle - Sequential', async ({ page }) => {
  test.setTimeout(1800000); // 30 minutes timeout for bulk data entry
  
  // ============================================
  // STEP 1: LOGIN
  // ============================================
  console.log('=== STEP 1: LOGIN ===');
  
  await page.goto('https://portal-dev.modena.com/login');
  
  try {
    await page.waitForURL('**/login', { timeout: 3000 });
    
    if (page.url().includes('login')) {
      console.log('Logging in...');
      await page.getByRole('textbox', { name: 'Enter your email' }).fill('ryan.ananda@modena.com');
      await page.getByRole('textbox', { name: 'Enter your password' }).fill('P@ssw0rd_ryan.ananda');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      
      await page.waitForURL('**/my-application', { timeout: 15000 });
      await page.context().storageState({ path: 'storageState.json' });
    }
  } catch (e) {
    console.log('Already logged in or redirected, proceeding...');
  }
  
  // ============================================
  // STEP 2: CREATE MASTER BRAND
  // ============================================
  console.log('=== STEP 2: CREATE MASTER BRAND ===');
  
  try {
    await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).waitFor({ state: 'visible', timeout: 10000 });
  } catch {
    console.log('Context might be different, trying to navigate blindly');
  }
  
  await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByRole('link', { name: 'Master Brand' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Get existing brands from the table
  const existingBrands = [];
  try {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Get all brand names from the table - try multiple column indexes
    const brandRows = await page.locator('table tbody tr').all();
    for (const row of brandRows) {
      try {
        // Try column 1 first (usually brand name)
        let brandName = await row.locator('td').nth(1).textContent();
        
        // If empty, try column 0 (might be first column)
        if (!brandName || !brandName.trim()) {
          brandName = await row.locator('td').nth(0).textContent();
        }
        
        // If still empty, try column 2
        if (!brandName || !brandName.trim()) {
          brandName = await row.locator('td').nth(2).textContent();
        }
        
        if (brandName && brandName.trim()) {
          existingBrands.push(brandName.trim().toLowerCase()); // Store in lowercase for case-insensitive comparison
        }
      } catch (e) {
        // Skip if can't get text
      }
    }
    console.log(`Found ${existingBrands.length} existing brands in the system`);
    console.log('Existing brands:', existingBrands);
  } catch (e) {
    console.log('Could not fetch existing brands, will try to create all');
  }
  
  // Track successfully created brands and skipped brands
  const createdBrands = [];
  const skippedBrands = [];
  const uniqueBrands = [...new Set(brands)];
  
  // Helper function to generate unique brand code
  function generateBrandCode(brandName, index, suffix = '') {
    const codePrefix = brandName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const codeSuffix = (index + 1).toString().padStart(3, '0');
    return `${codePrefix}${codeSuffix}${suffix}`;
  }
  
  for (let i = 0; i < uniqueBrands.length; i++) {
    const brandName = uniqueBrands[i];
    
    // Check if brand already exists (case-insensitive)
    if (existingBrands.includes(brandName.toLowerCase())) {
      console.log(`⊘ Skipping ${brandName} - already exists in the system`);
      createdBrands.push(brandName); // Still add to createdBrands for vehicle creation
      skippedBrands.push(brandName);
      continue;
    }
    
    // Try to create brand with retry for duplicate code
    let brandCreated = false;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (!brandCreated && retryCount < maxRetries) {
      // Generate code dynamically with retry suffix if needed
      const retrySuffix = retryCount > 0 ? String.fromCharCode(65 + retryCount - 1) : ''; // A, B, C, etc.
      const brandCode = generateBrandCode(brandName, i, retrySuffix);
      
      console.log(`Adding brand: ${brandName} with code: ${brandCode}${retryCount > 0 ? ' (retry ' + retryCount + ')' : ''}`);
      
      // Wait for page to be ready
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      
      // Check if page is still active
      if (page.isClosed()) {
        console.log('Page was closed, stopping test');
        break;
      }
      
      await page.getByRole('button', { name: 'Add Brand' }).click();
      await page.waitForTimeout(1000);
      
      const textboxes = page.getByRole('textbox');
      
      await textboxes.nth(0).fill(brandCode);
      await textboxes.nth(1).fill(brandName);
      await page.getByRole('textbox', { name: 'Brand description (optional)' }).fill(brandName);
      
      await page.getByRole('button', { name: 'Save Brand' }).click();
      
      try {
        await page.getByRole('button', { name: 'Save Brand' }).waitFor({ state: 'hidden', timeout: 3000 });
        createdBrands.push(brandName);
        brandCreated = true;
        console.log(`✓ Brand ${brandName} created successfully with code: ${brandCode}`);
      } catch {
        // Check if it's a duplicate code error
        const duplicateCodeError = await page.locator('text=/code already exists|duplicate code|code is already taken/i').isVisible({ timeout: 1000 }).catch(() => false);
        
        if (duplicateCodeError) {
          console.log(`⚠ Code ${brandCode} already exists, generating new code...`);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          retryCount++;
        } else {
          // Other error (possibly duplicate brand name)
          console.log(`✗ Could not save ${brandName} (${brandCode}) - possibly duplicate brand name`);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          break; // Exit retry loop for non-code errors
        }
      }
      await page.waitForTimeout(500);
    }
    
    if (!brandCreated) {
      console.log(`✗ Failed to create brand ${brandName} after ${retryCount} retries`);
    }
  }
  
  console.log(`\n=== BRAND SUMMARY ===`);
  console.log(`Total brands processed: ${uniqueBrands.length}`);
  console.log(`Brands created: ${createdBrands.length - skippedBrands.length}`);
  console.log(`Brands skipped (already exist): ${skippedBrands.length}`);
  console.log(`Available brands for vehicles: ${createdBrands.length}`);
  
  // ============================================
  // STEP 3: CREATE MASTER VEHICLE
  // ============================================
  console.log('\n=== STEP 3: CREATE MASTER VEHICLE ===');
  
  // Navigate to Master Vehicle Model
  await page.getByRole('button', { name: 'Master Data', exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole('link', { name: 'Master Vehicle Model' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Get existing vehicles from the table
  const existingVehicles = [];
  try {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Get all vehicle names from the table
    const vehicleRows = await page.locator('table tbody tr').all();
    for (const row of vehicleRows) {
      try {
        const vehicleName = await row.locator('td').nth(1).textContent();
        if (vehicleName && vehicleName.trim()) {
          existingVehicles.push(vehicleName.trim().toLowerCase());
        }
      } catch (e) {
        // Skip if can't get text
      }
    }
    console.log(`Found ${existingVehicles.length} existing vehicles in the system`);
  } catch (e) {
    console.log('Could not fetch existing vehicles, will try to create all');
  }
  
  // Generate vehicle data from created brands
  const vehicleTestData = generateVehicleDataFromBrands(createdBrands);
  console.log(`Generated ${vehicleTestData.length} vehicle test data`);
  
  // Track created and skipped vehicles
  let vehiclesCreated = 0;
  let vehiclesSkipped = 0;
  
  // Create vehicles
  for (const vehicle of vehicleTestData) {
    // Check if vehicle already exists (case-insensitive)
    if (existingVehicles.includes(vehicle.name.toLowerCase())) {
      console.log(`⊘ Skipping vehicle ${vehicle.name} - already exists in the system`);
      vehiclesSkipped++;
      continue;
    }
    
    console.log(`Creating vehicle: ${vehicle.brand} - ${vehicle.name}`);
    
    await page.getByRole('button', { name: 'Add Vehicle Model' }).click();
    await page.waitForTimeout(500);
    
    // Select brand - react-select style
    await page.getByRole('combobox').click();
    await page.waitForTimeout(300);
    
    await page.getByRole('combobox').fill(vehicle.brand);
    await page.waitForTimeout(300);
    
    await page.getByRole('combobox').press('Enter');
    await page.waitForTimeout(300);
    
    // Fill vehicle details
    await page.getByRole('textbox', { name: 'Civic' }).fill(vehicle.name);
    await page.getByRole('textbox', { name: 'Sedan' }).fill(vehicle.type);
    await page.getByRole('textbox', { name: 'Merah' }).fill(vehicle.color);
    await page.getByRole('textbox', { name: 'Additional information about' }).fill(vehicle.additionalInfo);
    
    await page.getByRole('button', { name: 'Create Vehicle Model' }).click();
    
    // Check if creation was successful
    try {
      // Wait for success - modal should close
      await page.getByRole('button', { name: 'Create Vehicle Model' }).waitFor({ state: 'hidden', timeout: 3000 });
      vehiclesCreated++;
      console.log(`✓ Vehicle ${vehicle.name} created`);
    } catch {
      // Check if error message appeared (duplicate)
      const errorMessage = await page.locator('text=/already exists|duplicate|already taken/i').isVisible({ timeout: 1000 }).catch(() => false);
      if (errorMessage) {
        console.log(`✗ Vehicle ${vehicle.name} - duplicate detected, skipping`);
        vehiclesSkipped++;
      } else {
        console.log(`? Vehicle ${vehicle.name} - status unknown, continuing`);
        vehiclesCreated++;
      }
      // Close modal if still open
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    
    await page.waitForTimeout(500);
  }
  
  console.log('\n=== ALL TESTS COMPLETED ===');
  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`BRANDS:`);
  console.log(`  - Total processed: ${uniqueBrands.length}`);
  console.log(`  - Created: ${createdBrands.length - skippedBrands.length}`);
  console.log(`  - Skipped (already exist): ${skippedBrands.length}`);
  console.log(`VEHICLES:`);
  console.log(`  - Total processed: ${vehicleTestData.length}`);
  console.log(`  - Created: ${vehiclesCreated}`);
  console.log(`  - Skipped (already exist): ${vehiclesSkipped}`);
});