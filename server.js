import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// JelajahToba root entrypoint for Delcom Web Services
require('./jelajahtoba-backend/server.js');
