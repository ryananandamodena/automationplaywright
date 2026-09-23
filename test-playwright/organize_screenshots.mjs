import fs from 'fs/promises';
import path from 'path';

// Konfigurasi pemetaan nama file ke nama folder aplikasi
const appMappings = [
    { prefix: 'mhc-', folder: 'mhc' },
    { prefix: 'contract-', folder: 'contract' },
    { prefix: 'e2e-', folder: 'e2e_tests' },
    { prefix: 'FAIL_', folder: 'test_results/fail' },
    { prefix: 'PASS_', folder: 'test_results/pass' },
    { prefix: 'sales-', folder: 'sfa' },
    { regex: /^[0-9a-fA-F]{8}-.*-attachment\.png$/, folder: 'attachments' },
    { regex: /^\d{2}-/, folder: 'login_flow' },
    { prefix: 'error-', folder: 'errors' }
];

const targetBaseDir = './Dokumen'; // Folder target utama
const excludeDirs = ['Dokumen', 'node_modules', '.git'];

async function findPngFiles(dir, fileList = []) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
        if (file.isDirectory()) {
            if (!excludeDirs.includes(file.name)) {
                await findPngFiles(path.join(dir, file.name), fileList);
            }
        } else if (file.name.toLowerCase().endsWith('.png')) {
            fileList.push({ name: file.name, path: path.join(dir, file.name) });
        }
    }
    
    return fileList;
}

async function organizeScreenshots() {
    try {
        await fs.mkdir(targetBaseDir, { recursive: true });
        console.log(`[+] Folder utama dibuat/ditemukan: ${targetBaseDir}`);

        console.log(`[i] Mencari file .png di seluruh folder...`);
        const pngFiles = await findPngFiles('./');

        console.log(`[i] Ditemukan ${pngFiles.length} file .png untuk diproses.`);

        let movedCount = 0;

        for (const file of pngFiles) {
            let targetFolder = 'Lainnya'; // Default

            for (const mapping of appMappings) {
                if (mapping.prefix && file.name.startsWith(mapping.prefix)) {
                    targetFolder = mapping.folder;
                    break;
                } else if (mapping.regex && mapping.regex.test(file.name)) {
                    targetFolder = mapping.folder;
                    break;
                }
            }

            const targetDirPath = path.join(targetBaseDir, targetFolder);
            const targetFilePath = path.join(targetDirPath, file.name);

            // Jika sumber dan target sama, lewati
            if (path.resolve(file.path) === path.resolve(targetFilePath)) {
                continue;
            }

            await fs.mkdir(targetDirPath, { recursive: true });

            try {
                await fs.rename(file.path, targetFilePath);
                console.log(`  -> Memindahkan: ${file.name} ke folder ${targetFolder}`);
                movedCount++;
            } catch (err) {
                console.error(`  [X] Gagal memindahkan ${file.name}: ${err.message}`);
            }
        }

        console.log(`\n[V] Selesai! Berhasil memindahkan ${movedCount} file ke dalam folder ${targetBaseDir}.`);
    } catch (error) {
        console.error('[X] Terjadi kesalahan:', error);
    }
}

organizeScreenshots();
