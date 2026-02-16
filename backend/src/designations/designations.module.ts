import { Module } from '@nestjs/common';
import { DesignationsService } from './designations.service';
import { DesignationsController } from './designations.controller';

@Module({
  providers: [DesignationsService],
  controllers: [DesignationsController]
})
export class DesignationsModule {}
