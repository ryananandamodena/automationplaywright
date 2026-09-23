/**
 * Video Helper — Rename & organise Playwright videos
 *
 * Playwright stores videos under test-results/<hash>/*.webm.
 * This helper copies them to a clean videos/ folder with the Test Case ID.
 *
 * Usage (in afterEach or test.afterAll):
 *   await VideoHelper.organise(page, 'TC-SO-001-Create-SO-Inden');
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEOS_DIR = path.join(__dirname, '..', 'videos');

export class VideoHelper {
  /**
   * Copy the video recorded by Playwright for `page` to the videos/ folder.
   * @param {import('@playwright/test').Page} page
   * @param {string} videoName — desired filename WITHOUT extension, e.g. 'TC-SO-001-Create-SO-Inden'
   * @returns {string|null} — destination path or null if no video found
   */
  static async organise(page, videoName) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });

    try {
      const video = page.video();
      if (!video) {
        console.log('  ⚠ No video recorded for this test');
        return null;
      }

      // Small delay to ensure the browser has completely written the video file
      await new Promise(r => setTimeout(r, 1500));

      const sourcePath = await video.path();
      if (!sourcePath || !fs.existsSync(sourcePath)) {
        console.log('  ⚠ Video file not found at:', sourcePath);
        return null;
      }

      const destPath = path.join(VIDEOS_DIR, `${videoName}.webm`);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`  🎬 Video saved: videos/${videoName}.webm`);
      return destPath;
    } catch (err) {
      console.log(`  ⚠ Video organise error: ${err.message}`);
      return null;
    }
  }

  /** Return the videos output directory */
  static getDir() {
    return VIDEOS_DIR;
  }
}
