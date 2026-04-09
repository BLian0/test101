import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { parseAccessToken } from '../../common/auth-token';

interface ChatUpdatePayload {
  connectionId: number;
  conversationId: number | null;
  targetUserIds: number[];
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly socketUsers = new Map<string, number>();

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    const userId = parseAccessToken(token);

    if (!userId) {
      client.disconnect(true);
      return;
    }

    this.socketUsers.set(client.id, userId);
    client.join(this.getUserRoom(userId));
  }

  handleDisconnect(client: Socket) {
    this.socketUsers.delete(client.id);
  }

  @SubscribeMessage('chat:ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() payload: Record<string, unknown>) {
    client.emit('chat:pong', {
      timestamp: new Date().toISOString(),
      ...payload,
    });
  }

  emitChatUpdated(userIds: number[], payload: ChatUpdatePayload) {
    const uniqueUserIds = Array.from(new Set(userIds.filter(id => Number.isInteger(id) && id > 0)));
    uniqueUserIds.forEach(userId => {
      this.server.to(this.getUserRoom(userId)).emit('chat:updated', payload);
    });
  }

  private getUserRoom(userId: number) {
    return `user:${userId}`;
  }

  private extractToken(client: Socket) {
    const authToken =
      typeof client.handshake.auth?.token === 'string' ? client.handshake.auth.token : undefined;
    const queryToken =
      typeof client.handshake.query?.token === 'string' ? client.handshake.query.token : undefined;
    const headerToken = client.handshake.headers.authorization;

    if (authToken) return authToken;
    if (queryToken) return queryToken;
    if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
      return headerToken.slice('Bearer '.length).trim();
    }

    return null;
  }
}
