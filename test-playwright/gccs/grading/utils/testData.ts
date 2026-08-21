export const CREDENTIALS = {
  // Overridable via GitHub Actions secrets (GCCS_USERNAME/GCCS_PASSWORD) so
  // CI doesn't need this test-env credential hardcoded in the repo; falls
  // back to the known test account for local runs.
  valid: {
    username: process.env.GCCS_USERNAME || 'FE_GCCS',
    password: process.env.GCCS_PASSWORD || 'P@ssw0rd.1',
  },
  invalidUsername: { username: 'NOT_A_REAL_USER', password: 'P@ssw0rd.1' },
  invalidPassword: { username: 'FE_GCCS', password: 'WrongPass123!' },
  sqlInjection: { username: "' OR 1=1 --", password: "' OR 1=1 --" },
};

export function uniqueSuffix(): string {
  const nanos = process.hrtime.bigint() % 100000n;
  return `${process.pid}${nanos.toString()}`;
}

export const GRADE_CATEGORY_CASES = {
  valid: () => ({
    grade: `AUTO-${uniqueSuffix()}`,
    minScore: '10',
    maxScore: '50',
    description: 'Automated test category - safe to delete',
  }),
  duplicate: { grade: 'A', minScore: '0', maxScore: '100', description: 'Duplicate of existing grade A' },
  empty: { grade: '', minScore: '', maxScore: '', description: '' },
  whitespaceOnly: { grade: '   ', minScore: '0', maxScore: '100', description: '' },
  htmlInjection: { grade: '<b>Bold</b>', minScore: '0', maxScore: '100', description: '<img src=x onerror=alert(1)>' },
  scriptInjection: { grade: '<script>alert(1)</script>', minScore: '0', maxScore: '100', description: 'xss test' },
  sqlInjection: { grade: "' OR 1=1 --", minScore: '0', maxScore: '100', description: 'DROP TABLE grade_categories;' },
  emoji: { grade: '🔥Grade🔥', minScore: '0', maxScore: '100', description: '✅ nice condition 😀' },
  veryLong: { grade: 'A'.repeat(300), minScore: '0', maxScore: '100', description: 'B'.repeat(2000) },
  negativeScore: { grade: `NEG-${uniqueSuffix()}`, minScore: '-10', maxScore: '100', description: 'negative min score' },
  minGreaterThanMax: { grade: `INV-${uniqueSuffix()}`, minScore: '90', maxScore: '10', description: 'min > max' },
};

export const QUESTION_CASES = {
  valid: () => ({
    question: `Automated evaluative question ${uniqueSuffix()}?`,
    pointYes: '5',
    pointNo: '0',
  }),
  empty: { question: '', pointYes: '', pointNo: '' },
  scriptInjection: { question: '<script>alert(1)</script>', pointYes: '0', pointNo: '0' },
  veryLong: { question: 'Q'.repeat(2000), pointYes: '0', pointNo: '0' },
};

export const ITEM_GRADING_CASES = {
  valid: () => ({
    remarks: `Automated item grading remarks ${uniqueSuffix()}`,
  }),
  empty: { remarks: '' },
  whitespaceOnly: { remarks: '   ' },
  scriptInjection: { remarks: '<script>alert(1)</script>' },
  htmlInjection: { remarks: '<img src=x onerror=alert(1)>' },
  sqlInjection: { remarks: "' OR 1=1 --" },
  emoji: { remarks: '🔥 remarks 🔥 ✅😀' },
  veryLong: { remarks: 'R'.repeat(2000) },
};

/** Generates N unique item-grading test datasets, each backed by a distinct dynamic tag. */
export function generateItemGradingDataset(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    tag: `AUTO-IG-${uniqueSuffix()}-${i + 1}`,
    remarks: `Automated item grading #${i + 1} - ${uniqueSuffix()}`,
  }));
}

// Real customer/product/serial combos confirmed to exist in the gccs-test environment
// (found via direct API probing) - needed because the endpoint validates against real
// customer and product records, not arbitrary strings. Two distinct customers so a
// "valid" run isn't forced into a same-day Pre-RON every time it repeats.
const KNOWN_COMBOS = [
  { phone_number: '087770666214', product_code: 'BH2723JABM.IDALB0A', serial_number: '9779999999992u9' },
  // Local phone format also accepted with a "+62" country-code prefix.
  { phone_number: '+6287770666214', product_code: 'BH2723CABK.IDALB0A', serial_number: 'B065K60142005J4' },
];
// Post codes confirmed to be covered by a grading service center. A "valid" payload
// rotates through these because each successful call creates a real RON/work order in
// the test environment, so reusing one repeatedly is fine but spreading them out avoids
// pinning every automated run to a single service center's queue.
const SERVICEABLE_POST_CODES = ['40286', '40115', '60271', '13210', '16320'];
const KNOWN_PHONE = KNOWN_COMBOS[0].phone_number;
const KNOWN_PRODUCT_CODE = KNOWN_COMBOS[0].product_code;
const KNOWN_SERIAL = KNOWN_COMBOS[0].serial_number;

export const WORKORDER_GRADING_CASES = {
  valid: () => {
    const combo = KNOWN_COMBOS[Number(uniqueSuffix()) % KNOWN_COMBOS.length];
    return {
      ...combo,
      post_code: SERVICEABLE_POST_CODES[Number(uniqueSuffix()) % SERVICEABLE_POST_CODES.length],
      app_name: 'WMS',
    };
  },
  emptyPhoneNumber: { phone_number: '', product_code: KNOWN_PRODUCT_CODE, serial_number: KNOWN_SERIAL, post_code: '40286', app_name: 'WMS' },
  emptyProductCode: { phone_number: KNOWN_PHONE, product_code: '', serial_number: KNOWN_SERIAL, post_code: '40286', app_name: 'WMS' },
  emptySerialNumber: { phone_number: KNOWN_PHONE, product_code: KNOWN_PRODUCT_CODE, serial_number: '', post_code: '40286', app_name: 'WMS' },
  emptyPostCode: { phone_number: KNOWN_PHONE, product_code: KNOWN_PRODUCT_CODE, serial_number: KNOWN_SERIAL, post_code: '', app_name: 'WMS' },
  // Business rule confirmed via probing: app_name is optional - an empty value still
  // creates the work order successfully (200/isOk:true), it does not 400.
  emptyAppName: { phone_number: KNOWN_PHONE, product_code: KNOWN_PRODUCT_CODE, serial_number: KNOWN_SERIAL, post_code: '40286', app_name: '' },
  allEmpty: { phone_number: '', product_code: '', serial_number: '', post_code: '', app_name: '' },
  invalidPhoneNumber: { phone_number: 'not-a-phone-number', product_code: KNOWN_PRODUCT_CODE, serial_number: KNOWN_SERIAL, post_code: '40286', app_name: 'WMS' },
  unknownProductCode: { phone_number: KNOWN_PHONE, product_code: 'UNKNOWN-XYZ-999', serial_number: KNOWN_SERIAL, post_code: '40286', app_name: 'WMS' },
  unknownSerialNumber: { phone_number: KNOWN_PHONE, product_code: KNOWN_PRODUCT_CODE, serial_number: 'UNKNOWN-XYZ-999', post_code: '40286', app_name: 'WMS' },
  sqlInjection: { phone_number: "' OR 1=1 --", product_code: "' OR 1=1 --", serial_number: "' OR 1=1 --", post_code: '40286', app_name: "' OR 1=1 --" },
  scriptInjection: { phone_number: '<script>alert(1)</script>', product_code: '<script>alert(1)</script>', serial_number: '<script>alert(1)</script>', post_code: '40286', app_name: '<script>alert(1)</script>' },
  veryLong: { phone_number: '0'.repeat(500), product_code: 'P'.repeat(500), serial_number: 'S'.repeat(500), post_code: '40286', app_name: 'A'.repeat(500) },
  emoji: { phone_number: KNOWN_PHONE, product_code: '🔥PRD🔥', serial_number: '✅SN✅', post_code: '40286', app_name: 'WMS 😀' },
};
