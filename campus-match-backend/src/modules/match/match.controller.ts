import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { MatchService } from './match.service';

@Controller('recommendations')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  getRecommendations(@Query() query: Record<string, unknown>) {
    return this.matchService.getRecommendations(query);
  }

  @Post(':targetUserId/like')
  like(@Param('targetUserId') targetUserId: string) {
    return this.matchService.like(targetUserId);
  }

  @Post(':targetUserId/pass')
  pass(@Param('targetUserId') targetUserId: string) {
    return this.matchService.pass(targetUserId);
  }

  @Get(':targetUserId/insight')
  getInsight(@Param('targetUserId') targetUserId: string) {
    return this.matchService.getInsight(targetUserId);
  }
}
