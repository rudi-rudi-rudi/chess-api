import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map