import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default async function Icon() {
  const logoPath = join(process.cwd(), 'public/images/brand/logo-secondary-bw.png');
  const logoBuffer = await readFile(logoPath);

  // Get logo dimensions
  const meta = await sharp(logoBuffer).metadata();
  const w = meta.width;
  const h = meta.height;

  // Crop just the "B" — roughly the first 22% of the width
  const cropWidth = Math.round(w * 0.22);
  const cropped = await sharp(logoBuffer)
    .extract({ left: 0, top: 0, width: cropWidth, height: h })
    .toBuffer();

  // Create dark circle background, composite the B on top
  const circle = Buffer.from(
    `<svg width="64" height="64"><circle cx="32" cy="32" r="32" fill="#0a0a0a"/></svg>`
  );

  const icon = await sharp(circle)
    .composite([
      {
        input: await sharp(cropped)
          .resize({ height: 44, fit: 'inside' })
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png()
    .toBuffer();

  return new Response(icon, {
    headers: { 'Content-Type': 'image/png' },
  });
}
