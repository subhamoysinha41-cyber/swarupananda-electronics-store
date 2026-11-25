import react from '@vitejs/plugin-react';

export default {
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          const path = id.replace(/\\/g, '/');
          if (path.includes('/node_modules/@fluentui/') || path.includes('/node_modules/@griffel/')) return 'fluent-ui';
          if (path.includes('/node_modules/framer-motion/')) return 'motion';
          if (
            path.includes('/node_modules/react/') ||
            path.includes('/node_modules/react-dom/') ||
            path.includes('/node_modules/react-router')
          ) return 'framework';
          if (path.includes('/node_modules/axios/')) return 'axios';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    setupFiles: './tests/setup.ts',
    globals: true,
  },
};
