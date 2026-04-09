import { IsArray, IsIn, IsInt, IsString, Max, Min } from 'class-validator';

export class UpdatePreferenceDto {
  @IsArray()
  preferredGenders: Array<'MALE' | 'FEMALE' | 'ALL'>;

  @IsInt()
  @Min(18)
  @Max(35)
  ageMin: number;

  @IsInt()
  @Min(18)
  @Max(35)
  ageMax: number;

  @IsString()
  @IsIn(['SERIOUS', 'EXPLORE', 'BOTH'])
  relationshipGoal: string;

  @IsString()
  @IsIn(['CONSERVATIVE', 'BALANCED', 'OPEN'])
  intimacyPreference: string;

  @IsString()
  @IsIn(['STABILITY', 'GROWTH', 'FREEDOM'])
  valuePriority: string;

  @IsString()
  @IsIn(['CALM', 'DIRECT', 'WARM'])
  emotionalStyle: string;
}
