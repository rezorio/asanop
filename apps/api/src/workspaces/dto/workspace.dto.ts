import {

  IsEmail,

  IsOptional,

  IsString,

  MaxLength,

  MinLength,

} from 'class-validator';



export class CreateWorkspaceDto {

  @IsString()

  @MinLength(1)

  @MaxLength(80)

  name!: string;

}



export class CreateInviteDto {

  @IsEmail()

  email!: string;



  /** WorkspaceRole id. Defaults to Contributor when omitted. */

  @IsOptional()

  @IsString()

  roleId?: string;

}



export class AcceptInviteDto {

  @IsString()

  @MinLength(10)

  token!: string;

}


