import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Social Media Application!!')
    .addBearerAuth()
    .setDescription('Use the base API URL as http://localhost:8000')
    .setTermsOfService('http://localhost:8000/terms-of-service')
    .setLicense(
      'MIT License',
      'https://github.com/git/git-scm.com/blob/main/MIT-LICENSE.txt',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // connect GRPC --admin
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: 'localhost:5000',
      package: 'notification',
      protoPath: join(__dirname, '../../proto/admin.proto'),
    },
  });

  // connect GRPC --user
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: 'localhost:5001',
      package: 'userNotification',
      protoPath: join(__dirname, '../../proto/user.proto'),
    },
  });

  // connect GRPC --post
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: 'localhost:5002',
      package: 'postNotification',
      protoPath: join(__dirname, '../../proto/notification.proto'),
    },
  });

  // Connect to Kafka
  console.log('Connecting to Kafka...');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification-service',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'notification-consumer',
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 5000,
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
      },
      run: {
        autoCommit: true,
        autoCommitInterval: 5000,
        autoCommitThreshold: 100,
        eachBatchAutoResolve: true,
      },
    },
  });
  console.log('Kafka microservice connected');

  await app.startAllMicroservices();
  console.log('Notification service microservices started and listening!');
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
