import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/utils/**/*.js', 'src/auth.js'],
      all: true
    }
  }
});
