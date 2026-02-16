import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { MigrationService } from './migration.service';

@Module({
  providers: [EmployeesService, MigrationService],
  controllers: [EmployeesController],
  exports: [EmployeesService],
})
export class EmployeesModule { }
