import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

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
      package: 'user',
      protoPath: join(__dirname, '../../proto/user.proto'),
    },
  });

  // connect GRPC --post
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: 'localhost:5002',
      package: 'post',
      protoPath: join(__dirname, '../../proto/post.proto'),
    },
  });

  // Connect to Kafka
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification-service',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'notification-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
