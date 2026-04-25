import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = 3000;
  await app.listen(port, '0.0.0.0');

  const url = await app.getUrl();

  logger.log(`🚀 Application is running on: ${url}`);
  logger.log(
    `📊 GraphQL Playground (Apollo Sandbox) available at: ${url}/graphql`,
  );
}
bootstrap();
