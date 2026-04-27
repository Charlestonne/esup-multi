import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { EventsModule } from './events/events.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration] }),
    EventsModule,
    MonitoringModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
