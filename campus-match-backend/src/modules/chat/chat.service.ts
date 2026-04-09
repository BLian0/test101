import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { APP_STATE, type AppState } from '../../common/app-state.token';
import { RequestContextService } from '../../common/request-context.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @Inject(APP_STATE) private readonly appState: AppState,
    private readonly requestContext: RequestContextService,
    private readonly chatGateway: ChatGateway,
  ) {}

  private containsContactInfo(content: string) {
    const phonePattern = /1\d{10}/;
    const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    const wechatPattern = /(微信|vx|vx号|wechat|V信)/i;

    return phonePattern.test(content) || emailPattern.test(content) || wechatPattern.test(content);
  }

  async getConnections() {
    const blockedIds = new Set((await this.appState.getBlocks()).map(item => item.blockedUserId));
    return {
      items: (await this.appState.getConnections()).filter(item => !blockedIds.has(item.targetUserId)),
    };
  }

  async getConnectionDetail(connectionId: string) {
    const detail = await this.appState.getConnectionDetail(Number(connectionId));
    const blockedIds = new Set((await this.appState.getBlocks()).map(item => item.blockedUserId));
    if (!detail || blockedIds.has(detail.targetUserId)) {
      throw new NotFoundException('CHAT_CONNECTION_NOT_FOUND');
    }

    return detail;
  }

  async sendFirstMessage(connectionId: string, payload: Record<string, unknown>) {
    const currentUserId = this.requestContext.requireUserId();
    const content = String(payload.content ?? '').trim();
    if (!content) {
      throw new BadRequestException('CHAT_MESSAGE_CONTENT_REQUIRED');
    }

    if (this.containsContactInfo(content)) {
      throw new BadRequestException('CHAT_FIRST_MESSAGE_CONTACT_INFO_FORBIDDEN');
    }

    const detail = await this.appState.sendFirstMessage(Number(connectionId), content);
    if (!detail) {
      throw new BadRequestException('CHAT_FIRST_MESSAGE_NOT_ALLOWED');
    }

    this.chatGateway.emitChatUpdated([currentUserId, detail.targetUserId], {
      connectionId: Number(connectionId),
      conversationId: detail.conversationId,
      targetUserIds: [currentUserId, detail.targetUserId],
    });

    return {
      message: 'first message sent',
      connection: detail,
    };
  }

  async getMessages(conversationId: string) {
    const currentConversationId = Number(conversationId);
    const visibleConnection = (await this.appState.getConnections()).find(
      item => item.conversationId === currentConversationId,
    );
    if (!visibleConnection) {
      throw new NotFoundException('CHAT_CONVERSATION_NOT_FOUND');
    }

    await this.appState.markConversationRead(currentConversationId);
    const items = await this.appState.getMessages(currentConversationId);

    return {
      conversationId: currentConversationId,
      items,
    };
  }

  async sendText(conversationId: string, payload: Record<string, unknown>) {
    const currentUserId = this.requestContext.requireUserId();
    const content = String(payload.content ?? '').trim();
    if (!content) {
      throw new BadRequestException('CHAT_MESSAGE_CONTENT_REQUIRED');
    }

    const items = await this.appState.sendConversationMessage(Number(conversationId), 'TEXT', content);
    if (!items) {
      throw new BadRequestException('CHAT_MUTUAL_MESSAGE_NOT_ALLOWED');
    }

    const connection = (await this.appState.getConnections()).find(
      item => item.conversationId === Number(conversationId),
    );
    if (connection) {
      this.chatGateway.emitChatUpdated([currentUserId, connection.targetUserId], {
        connectionId: connection.id,
        conversationId: Number(conversationId),
        targetUserIds: [currentUserId, connection.targetUserId],
      });
    }

    return { message: 'text message sent', conversationId: Number(conversationId), items };
  }

  async sendImage(conversationId: string, payload: Record<string, unknown>) {
    const currentUserId = this.requestContext.requireUserId();
    const content = String(payload.imageUrl ?? payload.content ?? '').trim();
    if (!content) {
      throw new BadRequestException('CHAT_IMAGE_REQUIRED');
    }

    const items = await this.appState.sendConversationMessage(Number(conversationId), 'IMAGE', content);
    if (!items) {
      throw new BadRequestException('CHAT_MUTUAL_MESSAGE_NOT_ALLOWED');
    }

    const connection = (await this.appState.getConnections()).find(
      item => item.conversationId === Number(conversationId),
    );
    if (connection) {
      this.chatGateway.emitChatUpdated([currentUserId, connection.targetUserId], {
        connectionId: connection.id,
        conversationId: Number(conversationId),
        targetUserIds: [currentUserId, connection.targetUserId],
      });
    }

    return { message: 'image message sent', conversationId: Number(conversationId), items };
  }

  async sendVoice(conversationId: string, payload: Record<string, unknown>) {
    const currentUserId = this.requestContext.requireUserId();
    const content = String(payload.voiceUrl ?? payload.content ?? '').trim();
    if (!content) {
      throw new BadRequestException('CHAT_VOICE_REQUIRED');
    }

    const items = await this.appState.sendConversationMessage(Number(conversationId), 'VOICE', content);
    if (!items) {
      throw new BadRequestException('CHAT_MUTUAL_MESSAGE_NOT_ALLOWED');
    }

    const connection = (await this.appState.getConnections()).find(
      item => item.conversationId === Number(conversationId),
    );
    if (connection) {
      this.chatGateway.emitChatUpdated([currentUserId, connection.targetUserId], {
        connectionId: connection.id,
        conversationId: Number(conversationId),
        targetUserIds: [currentUserId, connection.targetUserId],
      });
    }

    return { message: 'voice message sent', conversationId: Number(conversationId), items };
  }
}
