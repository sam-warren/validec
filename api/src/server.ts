import { createServer } from 'http';
import logger from './utils/logger';
import app from './app';
import redocExpress from 'redoc-express';
// import * as OpenApiValidator from "express-openapi-validator";
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

// Serve ReDoc UI
app.use(
  '/api-docs',
  redocExpress({
    title: 'CEDH Tools API Documentation',
    specUrl: '/api-spec',
    redocOptions: {
      hideDownloadButton: false,
      hideHostname: false
    }
  })
);

// Validate requests against OpenAPI spec
// app.use(
//   OpenApiValidator.middleware({
//     apiSpec: openApiSpec,
//     validateRequests: false,
//     validateResponses: false,
//   }),
// );

server.on('listening', () => {
  logger.info(`Server is running on port ${PORT}`);
});

server.listen(PORT);
