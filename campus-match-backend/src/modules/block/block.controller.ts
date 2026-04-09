import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { BlockService } from './block.service';

@Controller('blocks')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.blockService.create(body);
  }

  @Get()
  list() {
    return this.blockService.list();
  }

  @Delete(':blockedUserId')
  remove(@Param('blockedUserId') blockedUserId: string) {
    return this.blockService.remove(blockedUserId);
  }
}
