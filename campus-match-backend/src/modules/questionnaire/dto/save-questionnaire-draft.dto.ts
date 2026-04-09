import { IsArray, IsInt, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionnaireAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  answerValue: string;
}

export class SaveQuestionnaireDraftDto {
  @IsOptional()
  @IsInt()
  questionnaireVersionId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionnaireAnswerDto)
  answers: QuestionnaireAnswerDto[];
}
