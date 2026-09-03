import { defineConfig, Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { extractPMSRoomTypesFromUrl } from './src/utils/bookingExtractor';

function apiExtractorPlugin(): Plugin {
  return {
    name: 'api-extractor-plugin',
    configureServer(server) {
      const handleExtract = async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const targetUrl = parsed.url;
            const searchContext = parsed.searchContext;

            if (!targetUrl || typeof targetUrl !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing or invalid "url" parameter in body.' }));
              return;
            }

            console.log(`[API /api/extract] Extracting URL: ${targetUrl}`, searchContext ? `Context: ${JSON.stringify(searchContext)}` : '');
            const data = await extractPMSRoomTypesFromUrl(targetUrl, searchContext);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data, null, 2));
          } catch (error: any) {
            console.error('[API Error]:', error?.message || error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: error?.message || 'Failed to extract data from URL.',
              })
            );
          }
        });
      };

      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && (req.url === '/api/extract' || req.url === '/exract_data_bookingcom/api/extract' || req.url.endsWith('/api/extract'))) {
          handleExtract(req, res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  base: '/exract_data_bookingcom/',
  server: {
    port: 3001,
    strictPort: true,
  },
  plugins: [tailwindcss(), apiExtractorPlugin()],
});
