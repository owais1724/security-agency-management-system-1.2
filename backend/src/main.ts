
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import cookieParser from 'cookie-parser';

async function createApp() {
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
      ? [process.env.FRONTEND_URL || 'https://sams-portal.com', /\.vercel\.app$/, /\.railway\.app$/]
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  return app;
}

// Global cached server for Vercel (Cold Start Optimization)
let cachedServer: any;

export default async (req: any, res: any) => {
  if (!cachedServer) {
    const app = await createApp();
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer(req, res);
};

// Local Dev
if (!process.env.VERCEL) {
  (async () => {
    const app = await createApp();
    const port = process.env.PORT || 3000;
    await app.listen(port);
    const logger = new Logger('Bootstrap');
    logger.log(`Application running on http://localhost:${port}`);
  })();
}
