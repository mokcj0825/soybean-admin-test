import { NestFactory } from '@nestjs/core';
import { V3AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(V3AppModule);
  
  // 设置全局前缀
  app.setGlobalPrefix('v3/api');
  
  // 启用 CORS
  app.enableCors();
  
  await app.listen(9529);
  
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     V3 DDD Architecture API Server Started        ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`\n🚀 Server running on: http://localhost:9529`);
  console.log(`📝 API Endpoint: http://localhost:9529/v3/api/order\n`);
}

bootstrap();

