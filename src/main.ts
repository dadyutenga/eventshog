
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { json, text } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './core/swagger/swagger.config';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

async function downloadCertificateIfNeeded(): Promise<void> {
  const certUrl = process.env.CERT_URL;
  const certPath = process.env.DB_SSL_CA_PATH;

  if (!certUrl || !certPath) {
    console.log('CERT_URL or DB_SSL_CA_PATH not provided, skipping certificate download');
    return;
  }

  // Check if certificate already exists
  const fullPath = path.resolve(certPath);
  if (fs.existsSync(fullPath)) {
    console.log(`Certificate already exists at: ${fullPath}`);
    return;
  }

  try {
    console.log(`Downloading certificate from: ${certUrl}`);
    await downloadFile(certUrl, fullPath);
    
    // Verify the file was downloaded
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`Certificate downloaded successfully. Size: ${stats.size} bytes`);
    } else {
      throw new Error('Certificate file not found after download');
    }
  } catch (error) {
    console.error(`Failed to download certificate: ${error.message}`);
    throw error;
  }
}

function downloadFile(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (error) => {
        fs.unlink(filePath, () => {}); // Delete the file if it exists
        reject(error);
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function bootstrap() {
  // Download certificate before starting the app
  await downloadCertificateIfNeeded();
  
  const app = await NestFactory.create(AppModule);
  
  // Configure body parsers
  app.use(json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  
  // Add text parser for webhooks
  app.use(text({
    type: 'text/plain',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Enable CORS
  app.enableCors();

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  // Swagger documentation
  setupSwagger(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
