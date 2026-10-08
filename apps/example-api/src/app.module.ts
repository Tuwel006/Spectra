import { Module } from '@nestjs/common';
import { SpectraModule } from '@spectra/runtime';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

// SpectraModule.forRoot() with no args → the runtime reads
// `.spectra/config.json` (written by `spectra generate`) at boot
// and mounts the studio at whatever endpoint you specified on the
// command line:
//
//   pnpm --filter @spectra/cli test:e2e -- --endpoint /my-docs
//       → studio at http://localhost:3002/my-docs
//
//   pnpm --filter @spectra/cli test:e2e -- --endpoint /spectra
//       → studio at http://localhost:3002/spectra
//
//   pnpm --filter @spectra/cli test:e2e -- --endpoint /api-explorer
//       → studio at http://localhost:3002/api-explorer
//
// You can still pass an explicit `endpoint` to override what the
// config file says (useful behind a reverse proxy that strips a
// prefix, for example). You can also pass `projectRoot` if the
// .spectra/ folder lives somewhere other than process.cwd().

@Module({
  imports: [
    SpectraModule.forRoot(),
    AuthModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
