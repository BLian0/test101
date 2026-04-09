import { Body, Controller, Get, Post } from '@nestjs/common';

import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.reportService.create(body);
  }

  @Get('me')
  listMine() {
    return this.reportService.listMine();
  }
}
