import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let app;
let initError = null;

try {
  app = require('../jelajahtoba-backend/server.js');
} catch (e) {
  initError = {
    message: e.message,
    stack: e.stack
  };
  console.error('CRITICAL: Error loading backend in api/index.js:', e);
}

export default async function handler(req, res) {
  if (initError) {
    return res.status(500).json({
      error: 'Backend initialization failed',
      details: initError
    });
  }
  return app(req, res);
}
