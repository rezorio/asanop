import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { InvitesModule } from './invites/invites.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { AutomationsModule } from './automations/automations.module';
import { IntakeFormsModule } from './intake-forms/intake-forms.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SectionsModule } from './sections/sections.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    InvitesModule,
    CustomFieldsModule,
    NotificationsModule,
    SearchModule,
    AttachmentsModule,
    AutomationsModule,
    IntakeFormsModule,
    DashboardModule,
    SectionsModule,
    RolesModule,
  ],
})
export class AppModule {}
