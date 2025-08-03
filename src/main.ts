
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { json, text } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './core/swagger/swagger.config';

async function bootstrap() {
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
