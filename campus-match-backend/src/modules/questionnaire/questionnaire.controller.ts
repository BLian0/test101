import { Body, Controller, Get, Post } from '@nestjs/common';

import { SaveQuestionnaireDraftDto } from './dto/save-questionnaire-draft.dto';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';
import { QuestionnaireService } from './questionnaire.service';

@Controller('questionnaires')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Get('active')
  getActiveVersion() {
    return this.questionnaireService.getActiveVersion();
  }

  @Get('active/questions')
  getActiveQuestions() {
    return this.questionnaireService.getActiveQuestions();
  }

  @Post('sessions/draft')
  saveDraft(@Body() body: SaveQuestionnaireDraftDto) {
    return this.questionnaireService.saveDraft(body);
  }

  @Post('sessions/submit')
  submit(@Body() body: SubmitQuestionnaireDto) {
    return this.questionnaireService.submit(body);
  }

  @Get('me/result')
  getMyResult() {
    return this.questionnaireService.getMyResult();
  }
}
