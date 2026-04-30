import fs from 'fs';
import path from 'path';

const binDir = path.resolve(process.cwd(), 'node_modules', '.bin');

function setExecutableBits(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return;

    const mode = stat.mode | 0o111;
    fs.chmodSync(filePath, mode);
  } catch (error) {
    // Ignore errors on platforms where chmod is not meaningful.
  }
}

if (fs.existsSync(binDir)) {
  for (const entry of fs.readdirSync(binDir)) {
    setExecutableBits(path.join(binDir, entry));
  }
}
