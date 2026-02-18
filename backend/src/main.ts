
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Use Helmet for security headers
  app.use(helmet());

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

  app.use(cookieParser());

  const isProduction = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: isProduction
      ? [process.env.FRONTEND_URL || 'https://sams-portal.com'] // Strict origin in production
      : ['http://localhost:3000', 'http://localhost:3001'],     // Local dev origins
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
  }

  await app.init();
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

