import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContextStore {
  userId: number | null;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>();

  run<T>(store: RequestContextStore, callback: () => T) {
    return this.storage.run(store, callback);
  }

  getUserId() {
    return this.storage.getStore()?.userId ?? null;
  }

  requireUserId() {
    const userId = this.getUserId();
    if (!userId) {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }

    return userId;
  }
}
