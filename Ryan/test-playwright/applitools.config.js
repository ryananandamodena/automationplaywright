/**
 * Applitools Eyes Configuration
 * https://applitools.com/docs/api-ref/sdk-api/playwright/js/configuration
 */

export default {
  // Test concurrency - how many visual tests run in parallel
  testConcurrency: 5,

  // Browser configurations for visual testing
  browser: [
    // Desktop browsers
    { width: 1920, height: 1080, name: 'chrome' },
    { width: 1920, height: 1080, name: 'firefox' },
    { width: 1366, height: 768, name: 'edge' },
    
    // Tablets
    { deviceName: 'iPad Pro', screenOrientation: 'landscape' },
    { deviceName: 'iPad', screenOrientation: 'portrait' },
    
    // Mobile devices
    { deviceName: 'iPhone 14 Pro', screenOrientation: 'portrait' },
    { deviceName: 'Galaxy S22', screenOrientation: 'portrait' },
  ],

  // Batch settings - group tests together
  batchName: 'MHC & FMS Visual Regression Tests',
  
  // Application under test
  appName: 'Modena MHC & FMS',
  
  // Match level - how strict is the comparison
  // strict | content | layout | exact
  matchLevel: 'strict',
  
  // Ignore regions that change frequently
  ignoreDisplacements: true,
  
  // Save diffs for debugging
  saveDiffs: true,
  
  // Wait before screenshot (for animations to complete)
  waitBeforeScreenshots: 500,
  
  // Server URL (use default Applitools cloud)
  serverUrl: 'https://eyes.applitools.com',
  
  // API key - will be read from environment variable
  // Set via: $env:APPLITOOLS_API_KEY = "your-key-here"
  apiKey: process.env.APPLITOOLS_API_KEY,
  
  // Branch name for visual baseline management
  branchName: process.env.APPLITOOLS_BRANCH || 'main',
  
  // Parent branch for comparing
  parentBranchName: 'main',
  
  // Save new tests as baseline automatically
  saveNewTests: true,
  
  // Compare with baseline even if it's from another branch
  compareWithParentBranch: true,
  
  // Abort if baseline not found (false = create new baseline)
  abortIdleSecs: 300,
  
  // Features
  features: {
    // Enable layout breakpoints for responsive testing
    layoutBreakpoints: true,
    
    // Use Ultra Fast Grid for parallel execution
    useFastGrid: true,
  },
};
