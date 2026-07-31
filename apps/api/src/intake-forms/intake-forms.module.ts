import { Module, forwardRef } from '@nestjs/common';
import { IntakeFormsService } from './intake-forms.service';
import { IntakeFormsController } from './intake-forms.controller';
import { PublicIntakeFormsController } from './public-intake-forms.controller';
import { WorkspaceMemberGuard } from '../common/guards';
import { TasksModule } from '../tasks/tasks.module';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [
    forwardRef(() => TasksModule),
    CustomFieldsModule,
    AutomationsModule,
  ],
  controllers: [IntakeFormsController, PublicIntakeFormsController],
  providers: [IntakeFormsService, WorkspaceMemberGuard],
})
export class IntakeFormsModule {}
