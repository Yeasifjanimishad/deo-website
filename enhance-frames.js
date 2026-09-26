import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const framesDir = path.resolve('public/frames');
const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg'));

console.log(`Starting HD enhancement for ${files.length} frames...`);

async function processFrames() {
  let count = 0;
  for (const file of files) {
    const filePath = path.join(framesDir, file);
    const tempPath = path.join(framesDir, `temp-${file}`);

    try {
      await sharp(filePath)
        .resize({ width: 1920, height: 1080, fit: 'cover', kernel: sharp.kernel.lanczos3 })
        .sharpen({ sigma: 1.5, m1: 1.0, m2: 2.0 })
        .modulate({
          brightness: 1.02,
          saturation: 1.12
        })
        .jpeg({
          quality: 95,
          chromaSubsampling: '4:4:4',
          mozjpeg: true
        })
        .toFile(tempPath);

      fs.renameSync(tempPath, filePath);
      count++;
      if (count % 30 === 0 || count === files.length) {
        console.log(`Enhanced ${count}/${files.length} frames...`);
      }
    } catch (err) {
      console.error(`Error enhancing ${file}:`, err);
    }
  }
  console.log('HD Image enhancement complete for all 180 frames!');
}

processFrames();
