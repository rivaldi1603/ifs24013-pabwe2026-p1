import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found!');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');

const routes = [
  'auth/login',
  'auth/register',
  'auth/regiter',
  'login',
  'register',
  'regiter',
  'dashboard',
  'profil',
  'profile',
  'admin',
  'settings',
  'pengaturan',
  'destinasi',
  'jasa-lokal',
  'transportasi',
  'kuliner',
  'cerita',
  '404'
];

for (const route of routes) {
  // Create .html file (e.g. dist/auth/login.html)
  const htmlFilePath = path.join(distDir, `${route}.html`);
  const htmlFileDir = path.dirname(htmlFilePath);
  if (!fs.existsSync(htmlFileDir)) {
    fs.mkdirSync(htmlFileDir, { recursive: true });
  }
  fs.writeFileSync(htmlFilePath, html);

  // Create directory with index.html (e.g. dist/auth/login/index.html)
  if (route !== '404') {
    const dirPath = path.join(distDir, route);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(path.join(dirPath, 'index.html'), html);
  }
}

console.log(`Generated static fallback routes for ${routes.length} paths successfully.`);
