import { Injectable } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';

import type { Request } from 'express';

export interface StoredUploadFile {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
}

@Injectable()
export class UploadService {
  private readonly uploadRoot = join(process.cwd(), 'uploads');

  constructor() {
    mkdirSync(join(this.uploadRoot, 'avatars'), { recursive: true });
    mkdirSync(join(this.uploadRoot, 'chat', 'images'), { recursive: true });
    mkdirSync(join(this.uploadRoot, 'chat', 'voices'), { recursive: true });
  }

  getUploadDestination(kind: 'avatar' | 'chat-image' | 'chat-voice') {
    if (kind === 'avatar') {
      return join(this.uploadRoot, 'avatars');
    }

    if (kind === 'chat-image') {
      return join(this.uploadRoot, 'chat', 'images');
    }

    return join(this.uploadRoot, 'chat', 'voices');
  }

  getSafeFilename(file: StoredUploadFile) {
    const extension = extname(file.originalname || '') || this.guessExtension(file.mimetype);
    const safeExtension = extension.startsWith('.') ? extension : `.${extension}`;
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExtension}`;
  }

  private guessExtension(mimeType?: string) {
    if (!mimeType) {
      return '.bin';
    }

    if (mimeType.startsWith('image/')) {
      return `.${mimeType.split('/')[1]}`;
    }

    if (mimeType.startsWith('audio/')) {
      return `.${mimeType.split('/')[1]}`;
    }

    return '.bin';
  }

  private buildFileResponse(file: StoredUploadFile, req: Request, category: 'avatar' | 'chat-image' | 'chat-voice') {
    const relativeUrl = file.path
      .replace(this.uploadRoot, '')
      .replace(/\\/g, '/')
      .replace(/^\/?/, '/media/');
    const origin = `${req.protocol}://${req.get('host')}`;

    return {
      message: `${category} uploaded`,
      file: {
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        url: `${origin}${relativeUrl}`,
        relativeUrl,
      },
    };
  }

  uploadAvatar(file: StoredUploadFile, req: Request) {
    return this.buildFileResponse(file, req, 'avatar');
  }

  uploadChatImage(file: StoredUploadFile, req: Request) {
    return this.buildFileResponse(file, req, 'chat-image');
  }

  uploadChatVoice(file: StoredUploadFile, req: Request) {
    return this.buildFileResponse(file, req, 'chat-voice');
  }
}
