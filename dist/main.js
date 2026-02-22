import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';
async function bootstrap() {
    const env = loadEnv();
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(env.PORT);
}
bootstrap();
//# sourceMappingURL=main.js.map