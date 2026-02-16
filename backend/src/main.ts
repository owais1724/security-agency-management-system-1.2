
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Register global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());


  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:4100'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
  }

  return app.getHttpAdapter().getInstance();
}

let cachedHandler: any;

export default async (req: any, res: any) => {
  if (!cachedHandler) {
    cachedHandler = await bootstrap();
  }
  return cachedHandler(req, res);
};

if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}

