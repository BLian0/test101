import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';

import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('auth/login')
  login(@Body() body: Record<string, unknown>) {
    return this.adminService.login(body);
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/:userId')
  getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Post('users/:userId/ban')
  banUser(@Param('userId') userId: string, @Body() body: Record<string, unknown>) {
    return this.adminService.banUser(userId, body);
  }

  @Get('reports')
  getReports() {
    return this.adminService.getReports();
  }

  @Get('reports/:reportId')
  getReportDetail(@Param('reportId') reportId: string) {
    return this.adminService.getReportDetail(reportId);
  }

  @Post('reports/:reportId/resolve')
  resolveReport(@Param('reportId') reportId: string, @Body() body: Record<string, unknown>) {
    return this.adminService.resolveReport(reportId, body);
  }

  @Get('schools/:schoolId/email-rules')
  getEmailRules(@Param('schoolId') schoolId: string) {
    return this.adminService.getEmailRules(schoolId);
  }

  @Post('schools/:schoolId/email-rules')
  createEmailRule(@Param('schoolId') schoolId: string, @Body() body: Record<string, unknown>) {
    return this.adminService.createEmailRule(schoolId, body);
  }

  @Put('email-rules/:ruleId')
  updateEmailRule(@Param('ruleId') ruleId: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateEmailRule(ruleId, body);
  }

  @Get('questionnaires')
  getQuestionnaires() {
    return this.adminService.getQuestionnaires();
  }

  @Get('operation-logs')
  getOperationLogs() {
    return this.adminService.getOperationLogs();
  }
}
