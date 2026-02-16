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
import { AttendanceModule } from './attendance/attendance.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    AttendanceModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
