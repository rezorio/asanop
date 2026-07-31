import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IntakeFormsService } from './intake-forms.service';
import { SubmitIntakeFormDto } from './dto/intake-form.dto';

@Controller('forms')
export class PublicIntakeFormsController {
  constructor(private readonly intakeFormsService: IntakeFormsService) {}

  @Get(':token')
  preview(@Param('token') token: string) {
    return this.intakeFormsService.previewPublic(token);
  }

  @Post(':token/submit')
  submit(@Param('token') token: string, @Body() dto: SubmitIntakeFormDto) {
    return this.intakeFormsService.submitPublic(token, dto);
  }
}
