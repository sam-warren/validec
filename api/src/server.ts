import { createServer } from 'http';
import logger from './utils/logger';
import app from './app';
import path from 'path';
import fs from 'fs';

// Port
const PORT = process.env.API_PORT || 7000;

// Create HTTP server
const server = createServer(app);

// OpenAPI spec
const openApiSpecPath = path.join('public', 'api-spec', 'swagger.json');
const openApiSpec = JSON.parse(fs.readFileSync(openApiSpecPath, 'utf8'));

// Serve OpenAPI JSON spec
app.get('/api-spec', (req, res) => {
  res.json(openApiSpec);
});

// Serve RAPIDOC UI
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'rapi-doc.html'));
});

server.on('listening', () => {
  logger.info(`Server is running on port ${PORT}`);
});

server.listen(PORT);
