import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    if (
      process.env.NODE_ENV !== 'test' ||
      !/asanop[_-]test/i.test(databaseUrl)
    ) {
      throw new Error(
        'Refusing to run e2e tests: set NODE_ENV=test and DATABASE_URL to a dedicated database containing "asanop_test".',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  it('/api/auth/login (POST) rejects bad credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nope@example.com', password: 'password1' })
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
