import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join } from 'path';

const PWA_ICONS_DIR = join(process.cwd(), 'public', 'pwa-icons');
const OUTPUT_DIR = join(process.cwd(), 'public', 'pwa-icons-optimized');

async function optimizePWAIcons() {
  try {
    const files = await readdir(PWA_ICONS_DIR);
    await mkdir(OUTPUT_DIR, { recursive: true });

    let optimizedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.png')) continue;

      // Skip already optimized icon
      if (file === 'icon-512x512.png') {
        console.log(`⏭️  Skipping ${file} (already optimized)`);
        skippedCount++;
        continue;
      }

      const inputPath = join(PWA_ICONS_DIR, file);
      const outputPath = join(OUTPUT_DIR, file);

      // Extract size from filename (e.g., icon-192x192.png → 192)
      const sizeMatch = file.match(/(\d+)x\d+/);
      if (!sizeMatch) {
        console.log(`⚠️  Skipping ${file} (invalid filename format)`);
        continue;
      }

      const size = parseInt(sizeMatch[1]);

      try {
        await sharp(inputPath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({
            quality: 90,
            compressionLevel: 9,
            palette: true // Use palette mode for smaller files
          })
          .toFile(outputPath);

        console.log(`✓ Optimized ${file}`);
        optimizedCount++;
      } catch (error) {
        console.error(`✗ Failed to optimize ${file}:`, error.message);
      }
    }

    console.log(`\n✅ PWA icons optimization complete!`);
    console.log(`   Optimized: ${optimizedCount} files`);
    console.log(`   Skipped: ${skippedCount} files`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. mv public/pwa-icons public/pwa-icons-backup`);
    console.log(`   2. mv public/pwa-icons-optimized public/pwa-icons`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

optimizePWAIcons();
