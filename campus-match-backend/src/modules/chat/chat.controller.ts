import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('connections')
  getConnections() {
    return this.chatService.getConnections();
  }

  @Get('connections/:connectionId')
  getConnectionDetail(@Param('connectionId') connectionId: string) {
    return this.chatService.getConnectionDetail(connectionId);
  }

  @Post('connections/:connectionId/first-message')
  sendFirstMessage(
    @Param('connectionId') connectionId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.chatService.sendFirstMessage(connectionId, body);
  }

  @Get('conversations/:conversationId/messages')
  getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Post('conversations/:conversationId/messages/text')
  sendText(
    @Param('conversationId') conversationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.chatService.sendText(conversationId, body);
  }

  @Post('conversations/:conversationId/messages/image')
  sendImage(
    @Param('conversationId') conversationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.chatService.sendImage(conversationId, body);
  }

  @Post('conversations/:conversationId/messages/voice')
  sendVoice(
    @Param('conversationId') conversationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.chatService.sendVoice(conversationId, body);
  }
}
