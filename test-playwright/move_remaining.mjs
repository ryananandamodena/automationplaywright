import fs from 'fs/promises';
import path from 'path';

const targetBaseDir = './Dokumen';
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

async function moveRemaining() {
    try {
        const pngFiles = await findPngFiles('./');
        console.log(`[i] Ditemukan ${pngFiles.length} file .png yang tersisa.`);

        let movedCount = 0;
        const targetDir = path.join(targetBaseDir, 'Lainnya');
        await fs.mkdir(targetDir, { recursive: true });

        for (const file of pngFiles) {
            // Gunakan random string agar tidak bentrok
            const uniqueName = Math.random().toString(36).substring(2, 8) + '-' + file.name;
            const targetFilePath = path.join(targetDir, uniqueName);

            try {
                await fs.rename(file.path, targetFilePath);
                console.log(`  -> Memindahkan: ${file.name} ke folder Lainnya sebagai ${uniqueName}`);
                movedCount++;
            } catch (err) {
                console.error(`  [X] Gagal memindahkan ${file.name}: ${err.message}`);
            }
        }
        console.log(`\n[V] Selesai! Berhasil memindahkan ${movedCount} file yang tersisa.`);
    } catch (error) {
        console.error(error);
    }
}

moveRemaining();
