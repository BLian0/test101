import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { APP_STATE, type AppState } from '../../common/app-state.token';
@Injectable()
export class BlockService {
  constructor(@Inject(APP_STATE) private readonly appState: AppState) {}

  async create(payload: Record<string, unknown>) {
    const blockedUserId = Number(payload.blockedUserId);
    if (!blockedUserId) {
      throw new BadRequestException('BLOCK_TARGET_REQUIRED');
    }

    const candidate = await this.appState.findCandidateById(blockedUserId);
    if (!candidate) {
      throw new NotFoundException('BLOCK_TARGET_NOT_FOUND');
    }

    return {
      message: 'block created',
      items: await this.appState.createBlock(blockedUserId),
    };
  }

  async list() {
    return { items: await this.appState.getBlocks() };
  }

  async remove(blockedUserId: string) {
    return {
      message: 'block removed',
      blockedUserId: Number(blockedUserId),
      items: await this.appState.removeBlock(Number(blockedUserId)),
    };
  }
}
