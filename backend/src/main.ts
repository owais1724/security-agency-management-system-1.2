
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.use(cookieParser());

  const isProduction = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: isProduction
      ? [process.env.FRONTEND_URL || 'https://sams-portal.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

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
  const startLocal = async () => {
    const { NestFactory } = await import('@nestjs/core');
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.use(cookieParser());
    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    });
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`Local server running on http://localhost:${port}`);
  };
  startLocal();
}
