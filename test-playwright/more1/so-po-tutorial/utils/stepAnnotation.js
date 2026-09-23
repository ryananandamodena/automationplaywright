/**
 * Step Annotation Helper — Logs tutorial-style step headers
 *
 * Makes console output and video recordings clearer as tutorial steps.
 *
 * Example output:
 *   ══════════════════════════════════════════
 *   TC-SO-001 — Create Sales Order - INDEN
 *   ──────────────────────────────────────────
 *   STEP 1 — Login
 *   ══════════════════════════════════════════
 */

export class StepAnnotation {
  /**
   * @param {string} testCaseId — e.g. 'TC-SO-001'
   * @param {string} testCaseName — e.g. 'Create Sales Order - INDEN'
   */
  constructor(testCaseId, testCaseName) {
    this.testCaseId = testCaseId;
    this.testCaseName = testCaseName;
    this.stepCounter = 0;
  }

  /** Print the test case header (call once at start) */
  header() {
    const line = '═'.repeat(55);
    console.log(`\n${line}`);
    console.log(`  ${this.testCaseId} — ${this.testCaseName}`);
    console.log(`${line}\n`);
  }

  /**
   * Announce the start of a step.
   * @param {string} action — e.g. 'Login', 'Select Customer'
   * @param {string} [detail] — optional extra detail, e.g. item code
   */
  step(action, detail) {
    this.stepCounter++;
    const line = '─'.repeat(55);
    console.log(line);
    console.log(`  STEP ${this.stepCounter} — ${action}`);
    if (detail) console.log(`  ${detail}`);
    console.log(line);
  }

  /** Print a success message for the current step */
  success(message) {
    console.log(`  ✅ ${message}`);
  }

  /** Print a warning message */
  warn(message) {
    console.log(`  ⚠️  ${message}`);
  }

  /** Print footer summary */
  footer(data = {}) {
    const line = '═'.repeat(55);
    console.log(`\n${line}`);
    console.log(`  ${this.testCaseId} — TEST COMPLETED`);
    for (const [key, val] of Object.entries(data)) {
      console.log(`  ${key}: ${val}`);
    }
    console.log(`${line}\n`);
  }
}
