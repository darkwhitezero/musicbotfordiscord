const fs = require('node:fs/promises');
const path = require('node:path');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function cleanupCache(cacheDir, activeFiles) {
  let entries;
  try {
    entries = await fs.readdir(cacheDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const now = Date.now();
  const removed = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const filePath = path.join(cacheDir, entry.name);
    if (activeFiles.has(path.resolve(filePath))) {
      continue;
    }

    const stats = await fs.stat(filePath);
    if (now - stats.mtimeMs > ONE_DAY_MS) {
      await fs.unlink(filePath);
      removed.push(filePath);
    }
  }

  return removed;
}

module.exports = {
  cleanupCache,
  ONE_DAY_MS
};
