#!/usr/bin/env node
/**
 * Playwright MCP Server
 *
 * MCP Server yang menyediakan tools untuk mengontrol browser melalui Playwright.
 * Memungkinkan AI assistants untuk:
 * - Navigasi ke URL
 * - Klik elemen
 * - Isi form
 * - Ambil screenshot
 * - Eksekusi JavaScript
 * - Dan lainnya
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { chromium, firefox, webkit } from "playwright";
import { spawn } from "child_process";
// ============================================================
// GLOBAL STATE
// ============================================================
// Menyimpan session browser yang aktif
let currentSession = null;
// Konfigurasi default
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_BROWSER = 'chromium';
// ============================================================
// HELPER FUNCTIONS
// ============================================================
/**
 * Memastikan browser sudah siap, jika belum akan membuat session baru
 */
async function ensureBrowser(browserType = DEFAULT_BROWSER) {
    if (currentSession && currentSession.browser.isConnected()) {
        return currentSession;
    }
    let browser;
    switch (browserType) {
        case 'firefox':
            browser = await firefox.launch({ headless: false });
            break;
        case 'webkit':
            browser = await webkit.launch({ headless: false });
            break;
        case 'chromium':
        default:
            browser = await chromium.launch({ headless: false });
            break;
    }
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    currentSession = {
        browser,
        context,
        page,
        createdAt: new Date()
    };
    return currentSession;
}
/**
 * Format error message
 */
function formatError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
// ============================================================
// MCP SERVER SETUP
// ============================================================
const server = new McpServer({
    name: "playwright-server",
    version: "1.0.0"
});
// ============================================================
// TOOLS - BROWSER MANAGEMENT
// ============================================================
/**
 * Tool: Membuka browser baru atau menggunakan yang sudah ada
 */
server.tool("playwright_launch", {
    browserType: z.enum(['chromium', 'firefox', 'webkit']).optional().describe("Browser type to launch (default: chromium)"),
    headless: z.boolean().optional().describe("Run in headless mode (default: false)"),
    width: z.number().optional().describe("Viewport width (default: 1280)"),
    height: z.number().optional().describe("Viewport height (default: 720)")
}, async ({ browserType, headless, width, height }) => {
    const bt = browserType ?? 'chromium';
    const hl = headless ?? false;
    const w = width ?? 1280;
    const h = height ?? 720;
    try {
        // Tutup browser lama jika ada
        if (currentSession) {
            await currentSession.browser.close();
            currentSession = null;
        }
        let browser;
        switch (bt) {
            case 'firefox':
                browser = await firefox.launch({ headless: hl });
                break;
            case 'webkit':
                browser = await webkit.launch({ headless: hl });
                break;
            case 'chromium':
            default:
                browser = await chromium.launch({ headless: hl });
                break;
        }
        const context = await browser.newContext({
            viewport: { width: w, height: h }
        });
        const page = await context.newPage();
        currentSession = {
            browser,
            context,
            page,
            createdAt: new Date()
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Browser ${bt} launched successfully`,
                        viewport: { width: w, height: h },
                        headless: hl
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error launching browser: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Menutup browser
 */
server.tool("playwright_close", {}, async () => {
    try {
        if (currentSession) {
            await currentSession.browser.close();
            currentSession = null;
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ success: true, message: "Browser closed successfully" }, null, 2)
                    }
                ]
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: "No active browser session to close"
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error closing browser: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - NAVIGATION
// ============================================================
/**
 * Tool: Navigasi ke URL
 */
server.tool("playwright_navigate", {
    url: z.string().describe("URL to navigate to"),
    waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle', 'commit']).optional().describe("Wait until condition (default: load)"),
    timeout: z.number().optional().describe("Timeout in milliseconds (default: 30000)")
}, async ({ url, waitUntil, timeout }) => {
    const wu = waitUntil ?? 'load';
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.goto(url, { waitUntil: wu, timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        url: session.page.url(),
                        title: await session.page.title()
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Navigation error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Go back
 */
server.tool("playwright_go_back", {
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.goBack({ timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        url: session.page.url()
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Go back error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Go forward
 */
server.tool("playwright_go_forward", {
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.goForward({ timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        url: session.page.url()
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Go forward error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Refresh page
 */
server.tool("playwright_refresh", {
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.reload({ timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        url: session.page.url()
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Refresh error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - INTERACTION
// ============================================================
/**
 * Tool: Klik elemen
 */
server.tool("playwright_click", {
    selector: z.string().describe("CSS selector or XPath for element to click"),
    button: z.enum(['left', 'right', 'middle']).optional().describe("Mouse button (default: left)"),
    clickCount: z.number().optional().describe("Number of clicks (default: 1)"),
    delay: z.number().optional().describe("Delay between mousedown and mouseup in ms"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, button, clickCount, delay, timeout }) => {
    const btn = button ?? 'left';
    const cc = clickCount ?? 1;
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.click(selector, { button: btn, clickCount: cc, delay, timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Clicked on element: ${selector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Click error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Double click
 */
server.tool("playwright_double_click", {
    selector: z.string().describe("CSS selector for element to double click"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.dblclick(selector, { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Double clicked on element: ${selector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Double click error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Isi input field
 */
server.tool("playwright_fill", {
    selector: z.string().describe("CSS selector for input element"),
    value: z.string().describe("Value to fill"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, value, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.fill(selector, value, { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Filled value into: ${selector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Fill error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Type text (character by character)
 */
server.tool("playwright_type", {
    selector: z.string().describe("CSS selector for element"),
    text: z.string().describe("Text to type"),
    delay: z.number().optional().describe("Delay between keystrokes in ms (default: 0)"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, text, delay, timeout }) => {
    const d = delay ?? 0;
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.type(selector, text, { delay: d, timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Typed text into: ${selector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Type error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Press key
 */
server.tool("playwright_press", {
    selector: z.string().describe("CSS selector for element"),
    key: z.string().describe("Key to press (e.g., 'Enter', 'Tab', 'Escape', 'ArrowDown')"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, key, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.press(selector, key, { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Pressed key '${key}' on element: ${selector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Press key error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Select option from dropdown
 */
server.tool("playwright_select_option", {
    selector: z.string().describe("CSS selector for select element"),
    value: z.string().optional().describe("Value to select"),
    label: z.string().optional().describe("Label to select"),
    index: z.number().optional().describe("Index to select"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, value, label, index, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        let option = {};
        if (value !== undefined)
            option.value = value;
        if (label !== undefined)
            option.label = label;
        if (index !== undefined)
            option.index = index;
        await session.page.selectOption(selector, option, { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Selected option in: ${selector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Select option error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Check/uncheck checkbox
 */
server.tool("playwright_set_checked", {
    selector: z.string().describe("CSS selector for checkbox/radio element"),
    checked: z.boolean().describe("Whether to check or uncheck"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, checked, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.setChecked(selector, checked, { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `${checked ? 'Checked' : 'Unchecked'}: ${selector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Set checked error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Hover over element
 */
server.tool("playwright_hover", {
    selector: z.string().describe("CSS selector for element to hover"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.hover(selector, { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Hovered over: ${selector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Hover error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Focus element
 */
server.tool("playwright_focus", {
    selector: z.string().describe("CSS selector for element to focus"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.focus(selector, { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Focused on: ${selector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Focus error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Upload single file
 */
server.tool("playwright_upload_file", {
    selector: z.string().describe("CSS selector for file input"),
    filePath: z.string().describe("Path to file to upload"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, filePath, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        // Verify file exists
        const fs = await import('fs');
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        // Get file info
        const stats = fs.statSync(filePath);
        const fileName = filePath.split(/[\\/]/).pop() || filePath;
        await session.page.setInputFiles(selector, filePath, { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Uploaded file: ${fileName}`,
                        fileName: fileName,
                        filePath: filePath,
                        fileSize: stats.size,
                        fileSizeReadable: `${(stats.size / 1024).toFixed(2)} KB`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Upload file error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Upload multiple files
 */
server.tool("playwright_upload_multiple_files", {
    selector: z.string().describe("CSS selector for file input (must support multiple files)"),
    filePaths: z.array(z.string()).describe("Array of file paths to upload"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, filePaths, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        const fs = await import('fs');
        // Verify all files exist
        const fileInfos = [];
        for (const filePath of filePaths) {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            const stats = fs.statSync(filePath);
            const fileName = filePath.split(/[\\/]/).pop() || filePath;
            fileInfos.push({
                fileName,
                filePath,
                fileSize: stats.size,
                fileSizeReadable: `${(stats.size / 1024).toFixed(2)} KB`
            });
        }
        // Upload all files
        await session.page.setInputFiles(selector, filePaths, { timeout: to });
        const totalSize = fileInfos.reduce((sum, f) => sum + f.fileSize, 0);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Uploaded ${filePaths.length} files`,
                        fileCount: filePaths.length,
                        files: fileInfos,
                        totalSize: totalSize,
                        totalSizeReadable: `${(totalSize / 1024).toFixed(2)} KB`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Upload multiple files error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Upload file with drag and drop
 */
server.tool("playwright_upload_file_drag_drop", {
    dropZoneSelector: z.string().describe("CSS selector for drop zone element"),
    filePath: z.string().describe("Path to file to upload"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ dropZoneSelector, filePath, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        const fs = await import('fs');
        // Verify file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const stats = fs.statSync(filePath);
        const fileName = filePath.split(/[\\/]/).pop() || filePath;
        const fileContent = fs.readFileSync(filePath);
        // Create DataTransfer with file
        await session.page.evaluate(async ({ selector, fileName, fileContent, fileType }) => {
            const dropZone = document.querySelector(selector);
            if (!dropZone) {
                throw new Error(`Drop zone not found: ${selector}`);
            }
            // Convert base64 to Uint8Array
            const binaryString = atob(fileContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            // Create File object
            const file = new File([bytes], fileName, { type: fileType });
            // Create DataTransfer
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            // Dispatch drop event
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dataTransfer
            });
            dropZone.dispatchEvent(dropEvent);
        }, {
            selector: dropZoneSelector,
            fileName: fileName,
            fileContent: fileContent.toString('base64'),
            fileType: 'application/octet-stream'
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Uploaded file via drag & drop: ${fileName}`,
                        fileName: fileName,
                        filePath: filePath,
                        fileSize: stats.size,
                        fileSizeReadable: `${(stats.size / 1024).toFixed(2)} KB`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Upload file drag & drop error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Clear uploaded files
 */
server.tool("playwright_clear_uploaded_files", {
    selector: z.string().describe("CSS selector for file input"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.setInputFiles(selector, [], { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Cleared uploaded files"
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Clear uploaded files error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Validate file before upload
 */
server.tool("playwright_validate_file_upload", {
    filePath: z.string().describe("Path to file to validate"),
    maxSizeMB: z.number().optional().describe("Maximum file size in MB (optional)"),
    allowedExtensions: z.array(z.string()).optional().describe("Allowed file extensions (e.g., ['.jpg', '.png', '.pdf'])")
}, async ({ filePath, maxSizeMB, allowedExtensions }) => {
    try {
        const fs = await import('fs');
        const path = await import('path');
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            valid: false,
                            error: `File not found: ${filePath}`
                        }, null, 2)
                    }
                ]
            };
        }
        const stats = fs.statSync(filePath);
        const fileName = filePath.split(/[\\/]/).pop() || filePath;
        const fileExt = path.extname(filePath).toLowerCase();
        const fileSizeMB = stats.size / (1024 * 1024);
        // Validate size
        if (maxSizeMB && fileSizeMB > maxSizeMB) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            valid: false,
                            error: `File size (${fileSizeMB.toFixed(2)} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
                            fileName,
                            fileSize: stats.size,
                            fileSizeMB: fileSizeMB.toFixed(2)
                        }, null, 2)
                    }
                ]
            };
        }
        // Validate extension
        if (allowedExtensions && allowedExtensions.length > 0) {
            const isAllowed = allowedExtensions.some(ext => fileExt === ext.toLowerCase() || fileExt === `.${ext.toLowerCase()}`);
            if (!isAllowed) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                valid: false,
                                error: `File extension '${fileExt}' is not allowed. Allowed: ${allowedExtensions.join(', ')}`,
                                fileName,
                                fileExtension: fileExt
                            }, null, 2)
                        }
                    ]
                };
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        valid: true,
                        message: "File validation passed",
                        fileName,
                        filePath,
                        fileExtension: fileExt,
                        fileSize: stats.size,
                        fileSizeMB: fileSizeMB.toFixed(2),
                        fileSizeReadable: `${(stats.size / 1024).toFixed(2)} KB`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `File validation error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Get uploaded file info from input
 */
server.tool("playwright_get_uploaded_files_info", {
    selector: z.string().describe("CSS selector for file input"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        const filesInfo = await session.page.evaluate((sel) => {
            const input = document.querySelector(sel);
            if (!input || !input.files) {
                return { hasFiles: false, fileCount: 0, files: [] };
            }
            const files = Array.from(input.files).map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            }));
            return {
                hasFiles: files.length > 0,
                fileCount: files.length,
                files: files
            };
        }, selector);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(filesInfo, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Get uploaded files info error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - WAITING
// ============================================================
/**
 * Tool: Wait for selector
 */
server.tool("playwright_wait_for_selector", {
    selector: z.string().describe("CSS selector to wait for"),
    state: z.enum(['attached', 'detached', 'visible', 'hidden']).optional().describe("State to wait for (default: visible)"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, state, timeout }) => {
    const st = state ?? 'visible';
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.waitForSelector(selector, { state: st, timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Element found: ${selector}`,
                        state: st
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Wait for selector error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Wait for navigation
 */
server.tool("playwright_wait_for_navigation", {
    url: z.string().optional().describe("URL or URL pattern to wait for"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ url, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.waitForURL(url ?? '**', { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        url: session.page.url()
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Wait for navigation error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Wait for timeout
 */
server.tool("playwright_wait", {
    milliseconds: z.number().describe("Time to wait in milliseconds")
}, async ({ milliseconds }) => {
    try {
        const session = await ensureBrowser();
        await session.page.waitForTimeout(milliseconds);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Waited for ${milliseconds}ms`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Wait error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - INFORMATION
// ============================================================
/**
 * Tool: Get page content
 */
server.tool("playwright_get_content", {}, async () => {
    try {
        const session = await ensureBrowser();
        const content = await session.page.content();
        return {
            content: [
                {
                    type: "text",
                    text: content
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Get content error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Get page title
 */
server.tool("playwright_get_title", {}, async () => {
    try {
        const session = await ensureBrowser();
        const title = await session.page.title();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ title }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Get title error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Get current URL
 */
server.tool("playwright_get_url", {}, async () => {
    try {
        const session = await ensureBrowser();
        const url = session.page.url();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ url }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Get URL error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Get element text
 */
server.tool("playwright_get_text", {
    selector: z.string().describe("CSS selector for element"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        const element = await session.page.waitForSelector(selector, { timeout: to });
        const text = await element.textContent();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ text }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Get text error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Get element attribute
 */
server.tool("playwright_get_attribute", {
    selector: z.string().describe("CSS selector for element"),
    attribute: z.string().describe("Attribute name to get"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, attribute, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        const element = await session.page.waitForSelector(selector, { timeout: to });
        const value = await element.getAttribute(attribute);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ [attribute]: value }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Get attribute error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Check if element exists
 */
server.tool("playwright_element_exists", {
    selector: z.string().describe("CSS selector for element"),
    timeout: z.number().optional().describe("Timeout in milliseconds (default: 5000)")
}, async ({ selector, timeout }) => {
    const to = timeout ?? 5000;
    try {
        const session = await ensureBrowser();
        const element = await session.page.$(selector);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ exists: element !== null }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Element exists check error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Query all matching elements
 */
server.tool("playwright_query_all", {
    selector: z.string().describe("CSS selector for elements")
}, async ({ selector }) => {
    try {
        const session = await ensureBrowser();
        const elements = await session.page.$$(selector);
        const results = [];
        for (const element of elements) {
            const text = await element.textContent();
            results.push({ text });
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        count: elements.length,
                        elements: results
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Query all error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - SCREENSHOT & VISUAL
// ============================================================
/**
 * Tool: Take screenshot
 */
server.tool("playwright_screenshot", {
    path: z.string().optional().describe("Path to save screenshot (default: screenshot.png)"),
    fullPage: z.boolean().optional().describe("Take full page screenshot (default: false)"),
    selector: z.string().optional().describe("CSS selector for element to screenshot")
}, async ({ path, fullPage, selector }) => {
    const p = path ?? 'screenshot.png';
    const fp = fullPage ?? false;
    try {
        const session = await ensureBrowser();
        let buffer;
        if (selector) {
            const element = await session.page.$(selector);
            if (!element) {
                throw new Error(`Element not found: ${selector}`);
            }
            buffer = await element.screenshot();
        }
        else {
            buffer = await session.page.screenshot({ fullPage: fp, path: p });
        }
        // Convert to base64 for transmission
        const base64 = buffer.toString('base64');
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: selector ? `Element screenshot saved: ${p}` : `Screenshot saved: ${p}`,
                        fullPage: fp,
                        base64Preview: base64.substring(0, 100) + '...'
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Screenshot error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Get page viewport size
 */
server.tool("playwright_get_viewport", {}, async () => {
    try {
        const session = await ensureBrowser();
        const viewport = session.page.viewportSize();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ viewport }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Get viewport error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Set viewport size
 */
server.tool("playwright_set_viewport", {
    width: z.number().describe("Viewport width"),
    height: z.number().describe("Viewport height")
}, async ({ width, height }) => {
    try {
        const session = await ensureBrowser();
        await session.page.setViewportSize({ width, height });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        viewport: { width, height }
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Set viewport error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - JAVASCRIPT EXECUTION
// ============================================================
/**
 * Tool: Execute JavaScript
 */
server.tool("playwright_evaluate", {
    script: z.string().describe("JavaScript code to execute in browser context")
}, async ({ script }) => {
    try {
        const session = await ensureBrowser();
        const result = await session.page.evaluate(script);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ result }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Evaluate error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Execute JavaScript on element
 */
server.tool("playwright_evaluate_on_element", {
    selector: z.string().describe("CSS selector for element"),
    script: z.string().describe("JavaScript function to execute (element will be passed as arg)")
}, async ({ selector, script }) => {
    try {
        const session = await ensureBrowser();
        const element = await session.page.$(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }
        const result = await element.evaluate((el, userScript) => {
            return eval(userScript);
        }, script);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ result }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Evaluate on element error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - COOKIES & STORAGE
// ============================================================
/**
 * Tool: Get cookies
 */
server.tool("playwright_get_cookies", {}, async () => {
    try {
        const session = await ensureBrowser();
        const cookies = await session.context.cookies();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ cookies }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Get cookies error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Set cookies
 */
server.tool("playwright_set_cookies", {
    cookies: z.array(z.object({
        name: z.string(),
        value: z.string(),
        domain: z.string().optional(),
        path: z.string().optional(),
        expires: z.number().optional(),
        httpOnly: z.boolean().optional(),
        secure: z.boolean().optional(),
        sameSite: z.enum(['Strict', 'Lax', 'None']).optional()
    })).describe("Array of cookies to set")
}, async ({ cookies }) => {
    try {
        const session = await ensureBrowser();
        await session.context.addCookies(cookies);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Set ${cookies.length} cookies`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Set cookies error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Clear cookies
 */
server.tool("playwright_clear_cookies", {}, async () => {
    try {
        const session = await ensureBrowser();
        await session.context.clearCookies();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "All cookies cleared"
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Clear cookies error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Get local storage
 */
server.tool("playwright_get_local_storage", {}, async () => {
    try {
        const session = await ensureBrowser();
        const storage = await session.page.evaluate(() => {
            return Object.assign({}, window.localStorage);
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ localStorage: storage }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Get local storage error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Set local storage
 */
server.tool("playwright_set_local_storage", {
    key: z.string().describe("Storage key"),
    value: z.string().describe("Storage value")
}, async ({ key, value }) => {
    try {
        const session = await ensureBrowser();
        await session.page.evaluate(({ k, v }) => {
            window.localStorage.setItem(k, v);
        }, { k: key, v: value });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Set localStorage['${key}']`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Set local storage error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - DIALOGS & ALERTS
// ============================================================
/**
 * Tool: Handle dialog (alert, confirm, prompt)
 */
server.tool("playwright_handle_dialog", {
    accept: z.boolean().optional().describe("Accept or dismiss dialog (default: true)"),
    promptText: z.string().optional().describe("Text to enter for prompt dialogs")
}, async ({ accept, promptText }) => {
    const acc = accept ?? true;
    try {
        const session = await ensureBrowser();
        session.page.once('dialog', async (dialog) => {
            if (promptText && dialog.type() === 'prompt') {
                await dialog.accept(promptText);
            }
            else if (acc) {
                await dialog.accept();
            }
            else {
                await dialog.dismiss();
            }
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Dialog handler set up"
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Handle dialog error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - AUTHENTICATION
// ============================================================
/**
 * Tool: Basic authentication
 */
server.tool("playwright_set_basic_auth", {
    username: z.string().describe("Username"),
    password: z.string().describe("Password")
}, async ({ username, password }) => {
    try {
        const session = await ensureBrowser();
        await session.page.setExtraHTTPHeaders({
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Basic auth headers set"
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Set basic auth error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Set extra HTTP headers
 */
server.tool("playwright_set_headers", {
    headers: z.record(z.string()).describe("Headers to set (key-value pairs)")
}, async ({ headers }) => {
    try {
        const session = await ensureBrowser();
        await session.page.setExtraHTTPHeaders(headers);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Set ${Object.keys(headers).length} headers`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Set headers error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - TEST EXECUTION (Playwright Test Runner)
// ============================================================
/**
 * Helper: Execute Playwright test command
 */
async function executePlaywrightTest(args, cwd) {
    return new Promise((resolve) => {
        const output = [];
        // Use npx to run playwright test
        const proc = spawn('npx', ['playwright', 'test', ...args], {
            cwd,
            shell: true,
            env: { ...process.env, FORCE_COLOR: 'true' }
        });
        proc.stdout.on('data', (data) => {
            output.push(data.toString());
        });
        proc.stderr.on('data', (data) => {
            output.push(data.toString());
        });
        proc.on('close', (code) => {
            resolve({
                success: code === 0,
                output: output.join(''),
                exitCode: code ?? -1
            });
        });
        proc.on('error', (error) => {
            resolve({
                success: false,
                output: `Error executing test: ${error.message}`,
                exitCode: -1
            });
        });
    });
}
/**
 * Tool: Jalankan specific test file
 */
server.tool("playwright_run_test", {
    testFile: z.string().describe("Path ke file test (contoh: test-playwright/fms/fms/masterdata/masterapproval/master-approval-crud.spec.js)"),
    grep: z.string().optional().describe("Filter test case dengan grep pattern"),
    timeout: z.number().optional().describe("Timeout dalam ms (default: 120000)"),
}, async ({ testFile, grep, timeout }) => {
    try {
        const args = [testFile];
        if (grep) {
            args.push('--grep', grep);
        }
        if (timeout) {
            args.push('--timeout', timeout.toString());
        }
        // Always use headed mode for visibility
        args.push('--headed');
        const result = await executePlaywrightTest(args, process.cwd());
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: result.success,
                        testFile,
                        grep: grep || null,
                        exitCode: result.exitCode,
                        output: result.output.substring(0, 10000) // Limit output length
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error running test: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Jalankan semua test di direktori
 */
server.tool("playwright_run_all_tests", {
    testDir: z.string().optional().describe("Direktori test (default: test-playwright)"),
    grep: z.string().optional().describe("Filter test case dengan grep pattern"),
    timeout: z.number().optional().describe("Timeout dalam ms (default: 120000)"),
    retries: z.number().optional().describe("Jumlah retry untuk failed tests"),
}, async ({ testDir, grep, timeout, retries }) => {
    try {
        const args = [];
        if (testDir) {
            args.push(testDir);
        }
        else {
            args.push('test-playwright');
        }
        if (grep) {
            args.push('--grep', grep);
        }
        if (timeout) {
            args.push('--timeout', timeout.toString());
        }
        if (retries) {
            args.push('--retries', retries.toString());
        }
        // Always use headed mode
        args.push('--headed');
        const result = await executePlaywrightTest(args, process.cwd());
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: result.success,
                        testDir: testDir || 'test-playwright',
                        grep: grep || null,
                        timeout: timeout || 120000,
                        retries: retries || 0,
                        exitCode: result.exitCode,
                        output: result.output.substring(0, 10000)
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error running tests: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: List semua test files
 */
server.tool("playwright_list_tests", {
    testDir: z.string().optional().describe("Direktori test (default: test-playwright)"),
}, async ({ testDir }) => {
    try {
        const dir = testDir || 'test-playwright';
        const args = [dir, '--list'];
        const result = await executePlaywrightTest(args, process.cwd());
        // Parse test names from output
        const testMatches = result.output.match(/  ✓|✗|->/g) || [];
        const lines = result.output.split('\n').filter(l => l.includes('.spec.js'));
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        testDir: dir,
                        testCount: testMatches.length,
                        tests: lines.slice(0, 100).map(l => l.trim()).filter(l => l.length > 0)
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error listing tests: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Get test results dari last run
 */
server.tool("playwright_get_test_results", {
    testDir: z.string().optional().describe("Direktori test (default: test-playwright)"),
}, async ({ testDir }) => {
    try {
        const dir = testDir || 'test-playwright';
        const resultsPath = `${dir}/test-results/.last-run.json`;
        const fs = await import('fs');
        if (fs.existsSync(resultsPath)) {
            const data = fs.readFileSync(resultsPath, 'utf-8');
            const results = JSON.parse(data);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            resultsPath,
                            data: results
                        }, null, 2)
                    }
                ]
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        message: "No test results found. Run tests first with playwright_run_test or playwright_run_all_tests"
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting test results: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - EMULATION
// ============================================================
/**
 * Tool: Emulate mobile device
 */
server.tool("playwright_emulate_mobile", {
    device: z.enum(['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'Galaxy S5', 'Pixel 5', 'iPad', 'iPad Pro']).describe("Device to emulate")
}, async ({ device }) => {
    try {
        const session = await ensureBrowser();
        const devices = {
            'iPhone 11': { width: 414, height: 896, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1' },
            'iPhone 12': { width: 390, height: 844, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
            'iPhone 13': { width: 390, height: 844, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
            'iPhone 14': { width: 393, height: 852, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' },
            'Galaxy S5': { width: 360, height: 640, userAgent: 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36' },
            'Pixel 5': { width: 393, height: 851, userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36' },
            'iPad': { width: 768, height: 1024, userAgent: 'Mozilla/5.0 (iPad; CPU OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1' },
            'iPad Pro': { width: 1024, height: 1366, userAgent: 'Mozilla/5.0 (iPad; CPU OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1' }
        };
        const config = devices[device];
        if (!config) {
            throw new Error(`Unknown device: ${device}`);
        }
        await session.page.setViewportSize({ width: config.width, height: config.height });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Emulating ${device}`,
                        viewport: { width: config.width, height: config.height }
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Emulate mobile error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - DRAG AND DROP
// ============================================================
/**
 * Tool: Drag and drop an element
 */
server.tool("playwright_drag_and_drop", {
    sourceSelector: z.string().describe("CSS selector for source element to drag"),
    targetSelector: z.string().describe("CSS selector for target element to drop on"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ sourceSelector, targetSelector, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        await session.page.dragAndDrop(sourceSelector, targetSelector, { timeout: to });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Dragged from ${sourceSelector} to ${targetSelector}`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Drag and drop error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Mouse drag (more control over drag operation)
 */
server.tool("playwright_drag", {
    selector: z.string().describe("CSS selector for element to drag"),
    targetX: z.number().describe("Target X coordinate to drag to"),
    targetY: z.number().describe("Target Y coordinate to drag to"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
}, async ({ selector, targetX, targetY, timeout }) => {
    const to = timeout ?? DEFAULT_TIMEOUT;
    try {
        const session = await ensureBrowser();
        const box = await session.page.locator(selector).boundingBox();
        if (!box) {
            throw new Error(`Element not found: ${selector}`);
        }
        const fromX = box.x + box.width / 2;
        const fromY = box.y + box.height / 2;
        await session.page.mouse.move(fromX, fromY);
        await session.page.mouse.down();
        await session.page.mouse.move(targetX, targetY, { steps: 10 });
        await session.page.mouse.up();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `Dragged element from (${fromX}, ${fromY}) to (${targetX}, ${targetY})`
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Drag error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// TOOLS - DOWNLOAD
// ============================================================
/**
 * Tool: Download file
 */
server.tool("playwright_download_file", {
    selector: z.string().describe("CSS selector for download link/button"),
    downloadPath: z.string().optional().describe("Path to save downloaded file (default: ./downloads)")
}, async ({ selector, downloadPath }) => {
    const downloadDir = downloadPath || "./downloads";
    try {
        const session = await ensureBrowser();
        // Create downloads directory if not exists
        const fs = await import('fs');
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }
        // Start download
        const downloadPromise = session.page.waitForEvent('download', { timeout: 30000 });
        await session.page.click(selector);
        const download = await downloadPromise;
        // Save file
        const fileName = download.suggestedFilename();
        const destPath = `${downloadDir}/${fileName}`;
        await download.saveAs(destPath);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `File downloaded: ${fileName}`,
                        fileName: fileName,
                        path: destPath
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Download error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
/**
 * Tool: Get download info (for files triggered via JavaScript)
 */
server.tool("playwright_start_download", {
    url: z.string().describe("URL to download from"),
    downloadPath: z.string().optional().describe("Path to save downloaded file (default: ./downloads)")
}, async ({ url, downloadPath }) => {
    const downloadDir = downloadPath || "./downloads";
    try {
        const session = await ensureBrowser();
        // Create downloads directory if not exists
        const fs = await import('fs');
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }
        // Create download promise
        const downloadPromise = session.page.waitForEvent('download', { timeout: 30000 });
        // Navigate to download URL
        await session.page.goto(url, { waitUntil: 'networkidle' });
        const download = await downloadPromise;
        const fileName = download.suggestedFilename();
        const destPath = `${downloadDir}/${fileName}`;
        await download.saveAs(destPath);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: `File downloaded from URL: ${fileName}`,
                        fileName: fileName,
                        path: destPath
                    }, null, 2)
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Start download error: ${formatError(error)}`
                }
            ],
            isError: true
        };
    }
});
// ============================================================
// START SERVER
// ============================================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Playwright MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map