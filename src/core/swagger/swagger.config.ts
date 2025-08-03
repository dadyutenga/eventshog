import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('EventsHog API')
  .setDescription('The EventsHog API description')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
};

export function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document, swaggerOptions);
}
