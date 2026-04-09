import { Controller, Get } from '@nestjs/common';

import { SchoolService } from './school.service';

@Controller()
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get('public/schools/current')
  getCurrentSchool() {
    return this.schoolService.getCurrentSchool();
  }

  @Get('public/schools/current/email-rules')
  getEmailRules() {
    return this.schoolService.getEmailRules();
  }
}
