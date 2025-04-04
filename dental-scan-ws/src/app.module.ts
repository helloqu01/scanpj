import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScanGateway } from './scan.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [ScanGateway],
})
export class AppModule {}
