import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
const { diskStorage } = require('multer');

import type { Request } from 'express';

import { UploadService, type StoredUploadFile } from './upload.service';

const uploadServiceHelper = new UploadService();

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  private ensureFile(file: StoredUploadFile | undefined) {
    if (!file) {
      throw new BadRequestException('UPLOAD_FILE_REQUIRED');
    }

    return file;
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: unknown, _file: StoredUploadFile, callback: (error: Error | null, destination: string) => void) => {
          callback(null, uploadServiceHelper.getUploadDestination('avatar'));
        },
        filename: (_req: unknown, file: StoredUploadFile, callback: (error: Error | null, filename: string) => void) => {
          callback(null, uploadServiceHelper.getSafeFilename(file));
        },
      }),
      fileFilter: (_req: unknown, file: StoredUploadFile, callback: (error: Error | null, acceptFile: boolean) => void) => {
        callback(null, file.mimetype.startsWith('image/'));
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(@UploadedFile() file: StoredUploadFile, @Req() req: Request) {
    return this.uploadService.uploadAvatar(this.ensureFile(file), req);
  }

  @Post('chat-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: unknown, _file: StoredUploadFile, callback: (error: Error | null, destination: string) => void) => {
          callback(null, uploadServiceHelper.getUploadDestination('chat-image'));
        },
        filename: (_req: unknown, file: StoredUploadFile, callback: (error: Error | null, filename: string) => void) => {
          callback(null, uploadServiceHelper.getSafeFilename(file));
        },
      }),
      fileFilter: (_req: unknown, file: StoredUploadFile, callback: (error: Error | null, acceptFile: boolean) => void) => {
        callback(null, file.mimetype.startsWith('image/'));
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadChatImage(@UploadedFile() file: StoredUploadFile, @Req() req: Request) {
    return this.uploadService.uploadChatImage(this.ensureFile(file), req);
  }

  @Post('chat-voice')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: unknown, _file: StoredUploadFile, callback: (error: Error | null, destination: string) => void) => {
          callback(null, uploadServiceHelper.getUploadDestination('chat-voice'));
        },
        filename: (_req: unknown, file: StoredUploadFile, callback: (error: Error | null, filename: string) => void) => {
          callback(null, uploadServiceHelper.getSafeFilename(file));
        },
      }),
      fileFilter: (_req: unknown, file: StoredUploadFile, callback: (error: Error | null, acceptFile: boolean) => void) => {
        callback(null, file.mimetype.startsWith('audio/'));
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  uploadChatVoice(@UploadedFile() file: StoredUploadFile, @Req() req: Request) {
    return this.uploadService.uploadChatVoice(this.ensureFile(file), req);
  }
}
