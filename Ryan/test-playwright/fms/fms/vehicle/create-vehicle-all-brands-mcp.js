/**
 * FMS Vehicle Create All Brands Test - MCP Server Version
 * Test script using MCP Playwright tools to create vehicles for all brands
 *
 * @author Ryan Ananda
 * @description Automated test using MCP server tools for browser interaction
 */

const BASE_URL = 'https://portal-dev.modena.com';
const VEHICLE_URL = `${BASE_URL}/fms/vehicle`;
const LOGIN_EMAIL = 'ryan.ananda@modena.com';
const LOGIN_PASSWORD = 'P@ssw0rd_ryan.ananda';

// Brand types for testing
const VEHICLE_BRANDS = [
  { name: 'Toyota', models: ['Innova', 'Fortuner', 'Alphard', 'Vios', 'Camry'] },
  { name: 'Honda', models: ['Civic', 'HR-V', 'Jazz', 'CR-V', 'Accord'] },
  { name: 'Daihatsu', models: ['Xenia', 'Terios', 'Ayla', 'Sigra'] },
  { name: 'Suzuki', models: ['Ertiga', 'Baleno', 'Vitara', 'Jimny'] },
  { name: 'Mitsubishi', models: ['Xpander', 'Pajero', 'Outlander', 'Triton'] },
  { name: 'Nissan', models: ['Livina', 'X-Trail', 'Terrano', 'Leaf'] },
  { name: 'Hyundai', models: ['Stargazer', 'Creta', 'Santa Fe', 'Tucson'] },
  { name: 'Wuling', models: ['Confero', 'Air EV', 'Almaz', 'Formo'] }
];

// Helper functions
function generateLicensePlate() {
  const prefixes = ['B', 'D', 'F', 'H', 'G', 'E', 'T', 'K', 'R', 'S'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix} ${number} ${letters}`;
}

function generateUniqueId(prefix = 'AUTO') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function generateFutureDate(years = 1) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
}

function createTestData(brand, model, vehicleType = 'Owned') {
  return {
    licensePlate: generateLicensePlate(),
    vehicleName: `${brand} ${model}`,
    chassis: generateUniqueId('CHS'),
    engine: generateUniqueId('ENG'),
    year: String(2020 + Math.floor(Math.random() * 5)),
    cc: String(1500 + Math.floor(Math.random() * 2000)),
    seats: '5',
    cylinder: '4',
    stnk: `S-${Math.floor(Math.random() * 90000000) + 10000000}`,
    userName: 'Automation Test User',
    description: `Test vehicle - ${brand} ${model} - ${generateUniqueId()}`,
    vehicleType: vehicleType,
    transmission: Math.random() > 0.5 ? 'Automatic' : 'Manual',
    fuel: 'Petrol',
    status: 'Active',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    amount: String(200000000 + Math.floor(Math.random() * 500000000))
  };
}

// Main test function using MCP tools
async function runCreateAllBrandsTest() {
  console.log('🚀 Starting FMS Vehicle Create All Brands Test (MCP Version)');
  console.log('=' .repeat(60));

  const testResults = [];
  let successCount = 0;

  try {
    // Step 1: Launch browser
    console.log('📱 Launching browser...');
    await mcp_playwright_playwright_launch({
      browserType: 'chromium',
      headless: false,
      width: 1280,
      height: 720
    });

    // Step 2: Navigate to FMS vehicle page
    console.log('🌐 Navigating to FMS vehicle page...');
    await mcp_playwright_playwright_navigate({
      url: VEHICLE_URL,
      waitUntil: 'load'
    });

    // Wait for page to load
    await mcp_playwright_playwright_wait({ milliseconds: 3000 });

    // Step 3: Handle login if needed
    const currentUrl = await mcp_playwright_playwright_get_url();
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login') || currentUrl.includes('my-application')) {
      console.log('🔐 Handling login...');

      // Check if we're on my-application page
      if (currentUrl.includes('my-application')) {
        console.log('  → SSO page detected, selecting FMS...');
        await mcp_playwright_playwright_click({
          selector: 'text=FMS (DEV)'
        });
        await mcp_playwright_playwright_wait({ milliseconds: 2000 });

        // Handle confirm dialog if present
        try {
          await mcp_playwright_playwright_click({
            selector: 'button:has-text("Confirm")'
          });
          await mcp_playwright_playwright_wait({ milliseconds: 2000 });
        } catch (e) {
          console.log('  → No confirm dialog found');
        }
      } else {
        // Regular login
        await mcp_playwright_playwright_fill({
          selector: 'input[type="email"]',
          value: LOGIN_EMAIL
        });
        await mcp_playwright_playwright_fill({
          selector: 'input[type="password"]',
          value: LOGIN_PASSWORD
        });
        await mcp_playwright_playwright_click({
          selector: 'button:has-text("Sign In")'
        });
        await mcp_playwright_playwright_wait_for_navigation({
          waitUntil: 'load'
        });
      }

      // Navigate to vehicle page after login
      await mcp_playwright_playwright_navigate({
        url: VEHICLE_URL,
        waitUntil: 'load'
      });
      await mcp_playwright_playwright_wait({ milliseconds: 3000 });
    }

    // Step 4: Test each brand
    for (let i = 0; i < VEHICLE_BRANDS.length; i++) {
      const brand = VEHICLE_BRANDS[i];
      console.log(`\n🏍️ Testing Brand ${i + 1}/${VEHICLE_BRANDS.length}: ${brand.name}`);

      try {
        // Create test data
        const vehicleType = i % 2 === 0 ? 'Owned' : 'Leased';
        const testData = createTestData(brand.name, brand.models[0], vehicleType);
        console.log(`  📋 Test Data: ${testData.licensePlate} - ${testData.vehicleName}`);

        // Step 4a: Click Add Vehicle button
        console.log('  ➕ Opening add vehicle form...');
        await mcp_playwright_playwright_click({
          selector: 'button:has-text("Add Vehicle")'
        });
        await mcp_playwright_playwright_wait({ milliseconds: 2000 });

        // Step 4b: Fill form fields
        console.log('  📝 Filling vehicle form...');

        // License Plate
        await mcp_playwright_playwright_fill({
          selector: 'input[placeholder*="plate" i], input[name*="plate" i]',
          value: testData.licensePlate
        });

        // Vehicle Name
        await mcp_playwright_playwright_fill({
          selector: 'input[placeholder*="name" i], input[name*="name" i]',
          value: testData.vehicleName
        });

        // Chassis Number
        await mcp_playwright_playwright_fill({
          selector: 'input[placeholder*="chassis" i], input[name*="chassis" i]',
          value: testData.chassis
        });

        // Engine Number
        await mcp_playwright_playwright_fill({
          selector: 'input[placeholder*="engine" i], input[name*="engine" i]',
          value: testData.engine
        });

        // Year
        await mcp_playwright_playwright_fill({
          selector: 'input[type="number"][placeholder*="year" i]',
          value: testData.year
        });

        // CC
        await mcp_playwright_playwright_fill({
          selector: 'input[type="number"][placeholder*="cc" i]',
          value: testData.cc
        });

        // Seats
        await mcp_playwright_playwright_fill({
          selector: 'input[type="number"][placeholder*="seat" i]',
          value: testData.seats
        });

        // Cylinder
        await mcp_playwright_playwright_fill({
          selector: 'input[type="number"][placeholder*="cylinder" i]',
          value: testData.cylinder
        });

        // STNK Number
        await mcp_playwright_playwright_fill({
          selector: 'input[placeholder*="stnk" i], input[name*="stnk" i]',
          value: testData.stnk
        });

        // User Name
        await mcp_playwright_playwright_fill({
          selector: 'input[placeholder*="user" i], input[name*="user" i]',
          value: testData.userName
        });

        // Description
        await mcp_playwright_playwright_fill({
          selector: 'textarea[placeholder*="description" i], textarea[name*="description" i]',
          value: testData.description
        });

        // Vehicle Type (select dropdown)
        await mcp_playwright_playwright_select_option({
          selector: 'select[name*="type" i], select[placeholder*="type" i]',
          value: testData.vehicleType
        });

        // Transmission
        await mcp_playwright_playwright_select_option({
          selector: 'select[name*="transmission" i]',
          value: testData.transmission
        });

        // Fuel Type
        await mcp_playwright_playwright_select_option({
          selector: 'select[name*="fuel" i]',
          value: testData.fuel
        });

        // Status
        await mcp_playwright_playwright_select_option({
          selector: 'select[name*="status" i]',
          value: testData.status
        });

        // Tax Date
        await mcp_playwright_playwright_fill({
          selector: 'input[type="date"][name*="tax" i]',
          value: testData.taxDate
        });

        // Insurance Date
        await mcp_playwright_playwright_fill({
          selector: 'input[type="date"][name*="insurance" i]',
          value: testData.insuranceDate
        });

        // Amount
        await mcp_playwright_playwright_fill({
          selector: 'input[type="number"][placeholder*="amount" i], input[name*="amount" i]',
          value: testData.amount
        });

        console.log('  ✅ Form filled successfully');

        // Step 4c: Submit form
        console.log('  💾 Submitting form...');
        await mcp_playwright_playwright_click({
          selector: 'button:has-text("Save"), button:has-text("Submit"), button[type="submit"]'
        });
        await mcp_playwright_playwright_wait({ milliseconds: 3000 });

        // Check for success message
        const pageContent = await mcp_playwright_playwright_get_content();
        const success = pageContent.includes('success') || pageContent.includes('berhasil') || pageContent.includes('created');

        if (success) {
          successCount++;
          console.log(`  ✅ ${brand.name} vehicle created successfully`);
        } else {
          console.log(`  ❌ ${brand.name} vehicle creation may have failed`);
        }

        testResults.push({
          brand: brand.name,
          success: success,
          licensePlate: testData.licensePlate,
          vehicleName: testData.vehicleName,
          vehicleType: testData.vehicleType
        });

        // Wait before next brand
        await mcp_playwright_playwright_wait({ milliseconds: 2000 });

        // Navigate back to vehicle list
        await mcp_playwright_playwright_navigate({
          url: VEHICLE_URL,
          waitUntil: 'load'
        });
        await mcp_playwright_playwright_wait({ milliseconds: 2000 });

      } catch (error) {
        console.log(`  ❌ Error testing ${brand.name}: ${error.message}`);
        testResults.push({
          brand: brand.name,
          success: false,
          error: error.message,
          licensePlate: null
        });
      }
    }

    // Step 5: Generate report
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.brand}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.licensePlate) {
        console.log(`    License Plate: ${result.licensePlate}`);
        console.log(`    Vehicle: ${result.vehicleName}`);
        console.log(`    Type: ${result.vehicleType}`);
      }
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    console.log(`\n📊 Summary: ${successCount}/${VEHICLE_BRANDS.length} brands successful`);

    // Take final screenshot
    await mcp_playwright_playwright_screenshot({
      path: 'test-results/mcp-all-brands-final.png'
    });

  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
  } finally {
    // Close browser
    console.log('🔒 Closing browser...');
    await mcp_playwright_playwright_close();
  }

  console.log('✅ Test completed');
}

// Run the test
runCreateAllBrandsTest().catch(console.error);