import { defineConfig } from 'cypress';

export default defineConfig({
  viewportHeight: 760,
  viewportWidth: 360,
  e2e: {
    baseUrl: 'http://localhost:8100',
  },
});
