import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BlockModule } from './modules/block/block.module';
import { ChatModule } from './modules/chat/chat.module';
import { MatchModule } from './modules/match/match.module';
import { PreferenceModule } from './modules/preference/preference.module';
import { QuestionnaireModule } from './modules/questionnaire/questionnaire.module';
import { ReportModule } from './modules/report/report.module';
import { SchoolModule } from './modules/school/school.module';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    AuthModule,
    SchoolModule,
    UserModule,
    QuestionnaireModule,
    PreferenceModule,
    MatchModule,
    ChatModule,
    BlockModule,
    ReportModule,
    UploadModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
