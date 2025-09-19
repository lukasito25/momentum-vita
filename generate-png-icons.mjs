import fs from 'fs';
import { createCanvas } from 'canvas';

// Create PNG icon with Canvas
function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, size, size);
  bgGradient.addColorStop(0, '#1e40af');
  bgGradient.addColorStop(0.5, '#3b82f6');
  bgGradient.addColorStop(1, '#60a5fa');

  // Background circle
  ctx.fillStyle = bgGradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
  ctx.fill();

  // Orange gradient for barbell
  const orangeGradient = ctx.createLinearGradient(0, 0, size, 0);
  orangeGradient.addColorStop(0, '#f59e0b');
  orangeGradient.addColorStop(1, '#ea580c');

  // Green gradient
  const greenGradient = ctx.createLinearGradient(0, 0, size, size);
  greenGradient.addColorStop(0, '#10b981');
  greenGradient.addColorStop(1, '#059669');

  const scale = size / 512;

  // Left barbell weight
  ctx.fillStyle = orangeGradient;
  ctx.fillRect(80 * scale, 220 * scale, 60 * scale, 72 * scale);

  // Barbell bar
  ctx.fillStyle = orangeGradient;
  ctx.fillRect(140 * scale, 248 * scale, 232 * scale, 16 * scale);

  // Right barbell weight
  ctx.fillStyle = orangeGradient;
  ctx.fillRect(372 * scale, 220 * scale, 60 * scale, 72 * scale);

  // Central power circle
  ctx.fillStyle = greenGradient;
  ctx.beginPath();
  ctx.arc(256 * scale, 256 * scale, 35 * scale, 0, 2 * Math.PI);
  ctx.fill();

  // Inner white circle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(256 * scale, 256 * scale, 25 * scale, 0, 2 * Math.PI);
  ctx.fill();

  // Lightning bolt
  ctx.fillStyle = orangeGradient;
  ctx.beginPath();
  ctx.moveTo(246 * scale, 240 * scale);
  ctx.lineTo(260 * scale, 240 * scale);
  ctx.lineTo(252 * scale, 256 * scale);
  ctx.lineTo(266 * scale, 256 * scale);
  ctx.lineTo(246 * scale, 280 * scale);
  ctx.lineTo(254 * scale, 264 * scale);
  ctx.lineTo(240 * scale, 264 * scale);
  ctx.closePath();
  ctx.fill();

  // Letter M
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${64 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', 256 * scale, 400 * scale);

  // Progress bars
  ctx.fillStyle = greenGradient;
  ctx.fillRect(320 * scale, 160 * scale, 60 * scale, 6 * scale);
  ctx.fillRect(320 * scale, 175 * scale, 45 * scale, 6 * scale);
  ctx.fillRect(320 * scale, 190 * scale, 70 * scale, 6 * scale);

  return canvas;
}

// Generate icons
const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

// Create icons directory if it doesn't exist
if (!fs.existsSync('public/icons')) {
  fs.mkdirSync('public/icons', { recursive: true });
}

sizes.forEach(size => {
  const canvas = createIcon(size);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icons/icon-${size}x${size}.png`, buffer);
  console.log(`Generated icon-${size}x${size}.png`);
});

console.log('All PNG icons generated successfully!');