import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';

import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';

import { UsersModule } from './users/users.module';

import { AgenciesModule } from './agencies/agencies.module';

import { ClientsModule } from './clients/clients.module';

import { ProjectsModule } from './projects/projects.module';

import { EmployeesModule } from './employees/employees.module';

import { DesignationsModule } from './designations/designations.module';

import { RolesModule } from './roles/roles.module';

import { LeavesModule } from './leaves/leaves.module';
import { PayrollModule } from './payroll/payroll.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AttendanceModule } from './attendance/attendance.module';




import * as Joi from 'joi';

@Module({

  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),


    PrismaModule,

    AuthModule,

    UsersModule,

    AgenciesModule,

    ClientsModule,

    ProjectsModule,

    EmployeesModule,

    DesignationsModule,

    RolesModule,

    LeavesModule,
    PayrollModule,
    AuditLogsModule,
    AttendanceModule,
  ],



  controllers: [AppController],

  providers: [AppService],

})

export class AppModule { }

