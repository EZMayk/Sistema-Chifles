import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Enable raw body for Stripe webhook verification
    rawBody: true,
    bodyParser: true,
  });

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle("Payment Service API")
    .setDescription(
      "Payment processing service with Stripe integration, webhook support and payment providers",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Payments", "Payment processing endpoints")
    .addTag("Stripe Webhooks", "Stripe webhook handlers")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env.PAYMENT_SERVICE_PORT || 3002;
  await app.listen(port);
  console.log(`Payment Service running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api`);
}

bootstrap();
