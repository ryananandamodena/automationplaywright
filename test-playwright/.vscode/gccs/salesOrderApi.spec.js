import { test, expect } from '@playwright/test';

test.describe('Sales Order API Tests', () => {
    const baseUrl = 'https://dev.modena.com/service_app/api/more/salesorder';
    const securityCode = '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b';

    // Test Data dengan berbagai item code
    const testDataPositive = [
        {
            name: 'Slim Hood 70cm',
            payload: {
                transaction_type: "DRAFT",
                po_number: "magento/000000436",
                end_customer_name: "Arry Lazuardi",
                end_customer_email: "arry.work@gmail.com",
                end_customer_phone: "081235888717",
                delivery_date: "2026-01-08",
                resi: "",
                carts: [
                    {
                        item_code: "AX2711CABK.IDXAB0A",
                        parent_pack_id: "",
                        item_name: "Slim Hood 70cm",
                        quantity: 1.0,
                        address_label: "Setia Budi",
                        address: "Jl. Prof. DR. Satrio MODENA Experience Center",
                        country_name: "Indonesia",
                        province_name: "DKI Jakarta",
                        city_name: "Jakarta Selatan",
                        district_name: "Setia Budi",
                        subdistrict_name: "Kuningan Timur",
                        recipient_name: "Arry Lazuardi",
                        recipient_phone: "081235888717",
                        remark: "",
                        is_installation: false,
                        is_disassemble: false,
                        line_total: 2065500,
                        postcode: "12950",
                        longitude: 106.8299599,
                        latitude: -6.225761,
                        is_free_item: false
                    }
                ]
            }
        },
        {
            name: 'Built-in Oven 60cm',
            payload: {
                transaction_type: "DRAFT",
                po_number: "magento/000000437",
                end_customer_name: "Budi Santoso",
                end_customer_email: "budi.santoso@gmail.com",
                end_customer_phone: "081234567890",
                delivery_date: "2026-01-10",
                resi: "",
                carts: [
                    {
                        item_code: "BO3630.IDXAB0A",
                        parent_pack_id: "",
                        item_name: "Built-in Oven 60cm",
                        quantity: 1.0,
                        address_label: "Kemang",
                        address: "Jl. Kemang Raya No. 10",
                        country_name: "Indonesia",
                        province_name: "DKI Jakarta",
                        city_name: "Jakarta Selatan",
                        district_name: "Kemang",
                        subdistrict_name: "Bangka",
                        recipient_name: "Budi Santoso",
                        recipient_phone: "081234567890",
                        remark: "Lantai 2",
                        is_installation: true,
                        is_disassemble: false,
                        line_total: 8500000,
                        postcode: "12730",
                        longitude: 106.8145,
                        latitude: -6.2607,
                        is_free_item: false
                    }
                ]
            }
        },
        {
            name: 'Gas Cooktop 90cm',
            payload: {
                transaction_type: "DRAFT",
                po_number: "magento/000000438",
                end_customer_name: "Siti Rahayu",
                end_customer_email: "siti.rahayu@yahoo.com",
                end_customer_phone: "082112345678",
                delivery_date: "2026-01-12",
                resi: "",
                carts: [
                    {
                        item_code: "BH5925.IDXAB0A",
                        parent_pack_id: "",
                        item_name: "Gas Cooktop 90cm",
                        quantity: 2.0,
                        address_label: "Pondok Indah",
                        address: "Jl. Metro Pondok Indah No. 25",
                        country_name: "Indonesia",
                        province_name: "DKI Jakarta",
                        city_name: "Jakarta Selatan",
                        district_name: "Pondok Indah",
                        subdistrict_name: "Pondok Pinang",
                        recipient_name: "Siti Rahayu",
                        recipient_phone: "082112345678",
                        remark: "",
                        is_installation: true,
                        is_disassemble: true,
                        line_total: 12500000,
                        postcode: "12310",
                        longitude: 106.7875,
                        latitude: -6.2631,
                        is_free_item: false
                    }
                ]
            }
        },
        {
            name: 'Dishwasher 60cm',
            payload: {
                transaction_type: "DRAFT",
                po_number: "magento/000000439",
                end_customer_name: "Ahmad Wijaya",
                end_customer_email: "ahmad.wijaya@outlook.com",
                end_customer_phone: "085678901234",
                delivery_date: "2026-01-15",
                resi: "",
                carts: [
                    {
                        item_code: "WP6052.IDXAB0A",
                        parent_pack_id: "",
                        item_name: "Dishwasher 60cm",
                        quantity: 1.0,
                        address_label: "Kelapa Gading",
                        address: "Jl. Boulevard Kelapa Gading Blok A1",
                        country_name: "Indonesia",
                        province_name: "DKI Jakarta",
                        city_name: "Jakarta Utara",
                        district_name: "Kelapa Gading",
                        subdistrict_name: "Kelapa Gading Barat",
                        recipient_name: "Ahmad Wijaya",
                        recipient_phone: "085678901234",
                        remark: "Depan lobby",
                        is_installation: true,
                        is_disassemble: false,
                        line_total: 15750000,
                        postcode: "14240",
                        longitude: 106.9053,
                        latitude: -6.1589,
                        is_free_item: false
                    }
                ]
            }
        }
    ];

    // Negative Test Data
    const testDataNegative = [
        {
            name: 'Invalid Item Code',
            payload: {
                transaction_type: "DRAFT",
                po_number: "magento/000000440",
                end_customer_name: "Test User",
                end_customer_email: "test@test.com",
                end_customer_phone: "081234567890",
                delivery_date: "2026-01-08",
                resi: "",
                carts: [
                    {
                        item_code: "INVALID_ITEM_CODE_123",
                        parent_pack_id: "",
                        item_name: "Invalid Product",
                        quantity: 1.0,
                        address_label: "Test Address",
                        address: "Jl. Test No. 123",
                        country_name: "Indonesia",
                        province_name: "DKI Jakarta",
                        city_name: "Jakarta Selatan",
                        district_name: "Test District",
                        subdistrict_name: "Test Subdistrict",
                        recipient_name: "Test User",
                        recipient_phone: "081234567890",
                        remark: "",
                        is_installation: false,
                        is_disassemble: false,
                        line_total: 1000000,
                        postcode: "12345",
                        longitude: 106.8299599,
                        latitude: -6.225761,
                        is_free_item: false
                    }
                ]
            },
            expectedStatus: [400, 422, 500]
        },
        {
            name: 'Empty Item Code',
            payload: {
                transaction_type: "DRAFT",
                po_number: "magento/000000441",
                end_customer_name: "Test User 2",
                end_customer_email: "test2@test.com",
                end_customer_phone: "081234567891",
                delivery_date: "2026-01-09",
                resi: "",
                carts: [
                    {
                        item_code: "",
                        parent_pack_id: "",
                        item_name: "Empty Item Code Product",
                        quantity: 1.0,
                        address_label: "Test Address",
                        address: "Jl. Test No. 456",
                        country_name: "Indonesia",
                        province_name: "DKI Jakarta",
                        city_name: "Jakarta Pusat",
                        district_name: "Menteng",
                        subdistrict_name: "Menteng Atas",
                        recipient_name: "Test User 2",
                        recipient_phone: "081234567891",
                        remark: "",
                        is_installation: false,
                        is_disassemble: false,
                        line_total: 500000,
                        postcode: "10310",
                        longitude: 106.8456,
                        latitude: -6.1987,
                        is_free_item: false
                    }
                ]
            },
            expectedStatus: [400, 422, 500]
        },
        {
            name: 'Negative Quantity',
            payload: {
                transaction_type: "DRAFT",
                po_number: "magento/000000442",
                end_customer_name: "Test User 3",
                end_customer_email: "test3@test.com",
                end_customer_phone: "081234567892",
                delivery_date: "2026-01-10",
                resi: "",
                carts: [
                    {
                        item_code: "AX2711CABK.IDXAB0A",
                        parent_pack_id: "",
                        item_name: "Slim Hood 70cm",
                        quantity: -5.0,
                        address_label: "Test Address",
                        address: "Jl. Test No. 789",
                        country_name: "Indonesia",
                        province_name: "DKI Jakarta",
                        city_name: "Jakarta Barat",
                        district_name: "Cengkareng",
                        subdistrict_name: "Cengkareng Barat",
                        recipient_name: "Test User 3",
                        recipient_phone: "081234567892",
                        remark: "",
                        is_installation: false,
                        is_disassemble: false,
                        line_total: -2000000,
                        postcode: "11730",
                        longitude: 106.7234,
                        latitude: -6.1456,
                        is_free_item: false
                    }
                ]
            },
            expectedStatus: [400, 422, 500]
        },
        {
            name: 'Invalid Email Format',
            payload: {
                transaction_type: "DRAFT",
                po_number: "magento/000000443",
                end_customer_name: "Test User 4",
                end_customer_email: "invalid-email-format",
                end_customer_phone: "081234567893",
                delivery_date: "2026-01-11",
                resi: "",
                carts: [
                    {
                        item_code: "BO3630.IDXAB0A",
                        parent_pack_id: "",
                        item_name: "Built-in Oven 60cm",
                        quantity: 1.0,
                        address_label: "Test Address",
                        address: "Jl. Test No. 101",
                        country_name: "Indonesia",
                        province_name: "DKI Jakarta",
                        city_name: "Jakarta Timur",
                        district_name: "Jatinegara",
                        subdistrict_name: "Rawa Bunga",
                        recipient_name: "Test User 4",
                        recipient_phone: "081234567893",
                        remark: "",
                        is_installation: false,
                        is_disassemble: false,
                        line_total: 8500000,
                        postcode: "13350",
                        longitude: 106.8765,
                        latitude: -6.2134,
                        is_free_item: false
                    }
                ]
            },
            expectedStatus: [400, 422, 500]
        }
    ];

    // ==================== POSITIVE TEST CASES ====================

    testDataPositive.forEach((testData, index) => {
        test(`Positive Case ${index + 1}: Create Sales Order - ${testData.name}`, async ({ request }, testInfo) => {
            const response = await request.post(baseUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'Security-Code': securityCode
                },
                data: testData.payload
            });

            const responseBody = await response.json();
            
            // Attach Request Payload to report
            await testInfo.attach('Request Payload', {
                body: JSON.stringify(testData.payload, null, 2),
                contentType: 'application/json'
            });

            // Attach Response to report
            await testInfo.attach('Response Body', {
                body: JSON.stringify({
                    status: response.status(),
                    statusText: response.statusText(),
                    headers: response.headers(),
                    body: responseBody
                }, null, 2),
                contentType: 'application/json'
            });

            console.log(`\n=== Positive Case ${index + 1}: ${testData.name} ===`);
            console.log('Item Code:', testData.payload.carts[0].item_code);
            console.log('Response Status:', response.status());
            console.log('Response Body:', JSON.stringify(responseBody, null, 2));

            // Assertions
            expect(responseBody).toBeDefined();
            expect(responseBody.status).toBeDefined();
        });
    });

    // ==================== NEGATIVE TEST CASES ====================

    testDataNegative.forEach((testData, index) => {
        test(`Negative Case ${index + 1}: ${testData.name}`, async ({ request }, testInfo) => {
            const response = await request.post(baseUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'Security-Code': securityCode
                },
                data: testData.payload
            });

            const responseBody = await response.json();
            
            // Attach Request Payload to report
            await testInfo.attach('Request Payload', {
                body: JSON.stringify(testData.payload, null, 2),
                contentType: 'application/json'
            });

            // Attach Response to report
            await testInfo.attach('Response Body', {
                body: JSON.stringify({
                    status: response.status(),
                    statusText: response.statusText(),
                    headers: response.headers(),
                    body: responseBody
                }, null, 2),
                contentType: 'application/json'
            });

            console.log(`\n=== Negative Case ${index + 1}: ${testData.name} ===`);
            console.log('Item Code:', testData.payload.carts[0]?.item_code || 'N/A');
            console.log('Response Status:', response.status());
            console.log('Response Body:', JSON.stringify(responseBody, null, 2));

            // Assertions - expecting error responses
            expect(responseBody).toBeDefined();
            expect(testData.expectedStatus).toContain(response.status());
        });
    });

    // ==================== ADDITIONAL NEGATIVE CASES ====================

    test('Negative Case: Empty Cart Array', async ({ request }, testInfo) => {
        const payload = {
            transaction_type: "DRAFT",
            po_number: "magento/000000444",
            end_customer_name: "Test Empty Cart",
            end_customer_email: "emptycart@test.com",
            end_customer_phone: "081234567894",
            delivery_date: "2026-01-12",
            resi: "",
            carts: []
        };

        const response = await request.post(baseUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Security-Code': securityCode
            },
            data: payload
        });

        const responseBody = await response.json();
        
        // Attach Request Payload to report
        await testInfo.attach('Request Payload', {
            body: JSON.stringify(payload, null, 2),
            contentType: 'application/json'
        });

        // Attach Response to report
        await testInfo.attach('Response Body', {
            body: JSON.stringify({
                status: response.status(),
                statusText: response.statusText(),
                headers: response.headers(),
                body: responseBody
            }, null, 2),
            contentType: 'application/json'
        });

        console.log('\n=== Negative Case: Empty Cart Array ===');
        console.log('Response Status:', response.status());
        console.log('Response Body:', JSON.stringify(responseBody, null, 2));

        expect(responseBody).toBeDefined();
        expect([400, 422, 500, 502]).toContain(response.status());
    });

    test('Negative Case: Invalid Security Code', async ({ request }, testInfo) => {
        const payload = {
            transaction_type: "DRAFT",
            po_number: "magento/000000445",
            end_customer_name: "Test Invalid Security",
            end_customer_email: "invalidsec@test.com",
            end_customer_phone: "081234567895",
            delivery_date: "2026-01-13",
            resi: "",
            carts: [
                {
                    item_code: "AX2711CABK.IDXAB0A",
                    parent_pack_id: "",
                    item_name: "Slim Hood 70cm",
                    quantity: 1.0,
                    address_label: "Test",
                    address: "Jl. Test",
                    country_name: "Indonesia",
                    province_name: "DKI Jakarta",
                    city_name: "Jakarta Selatan",
                    district_name: "Test",
                    subdistrict_name: "Test",
                    recipient_name: "Test",
                    recipient_phone: "081234567895",
                    remark: "",
                    is_installation: false,
                    is_disassemble: false,
                    line_total: 2065500,
                    postcode: "12950",
                    longitude: 106.8299599,
                    latitude: -6.225761,
                    is_free_item: false
                }
            ]
        };

        const response = await request.post(baseUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Security-Code': 'invalid-security-code-12345'
            },
            data: payload
        });

        let responseBody;
        try {
            responseBody = await response.json();
        } catch {
            responseBody = await response.text();
        }
        
        // Attach Request Payload to report
        await testInfo.attach('Request Payload', {
            body: JSON.stringify(payload, null, 2),
            contentType: 'application/json'
        });

        // Attach Response to report
        await testInfo.attach('Response Body', {
            body: JSON.stringify({
                status: response.status(),
                statusText: response.statusText(),
                headers: response.headers(),
                body: responseBody
            }, null, 2),
            contentType: 'application/json'
        });

        console.log('\n=== Negative Case: Invalid Security Code ===');
        console.log('Response Status:', response.status());

        expect([400, 401, 403]).toContain(response.status());
    });

    test('Negative Case: Missing Required Fields', async ({ request }, testInfo) => {
        const payload = {
            transaction_type: "DRAFT"
            // Missing all other required fields
        };

        const response = await request.post(baseUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Security-Code': securityCode
            },
            data: payload
        });

        const responseBody = await response.json();
        
        // Attach Request Payload to report
        await testInfo.attach('Request Payload', {
            body: JSON.stringify(payload, null, 2),
            contentType: 'application/json'
        });

        // Attach Response to report
        await testInfo.attach('Response Body', {
            body: JSON.stringify({
                status: response.status(),
                statusText: response.statusText(),
                headers: response.headers(),
                body: responseBody
            }, null, 2),
            contentType: 'application/json'
        });

        console.log('\n=== Negative Case: Missing Required Fields ===');
        console.log('Response Status:', response.status());
        console.log('Response Body:', JSON.stringify(responseBody, null, 2));

        expect(responseBody).toBeDefined();
        expect([400, 422, 500, 502]).toContain(response.status());
    });
});
