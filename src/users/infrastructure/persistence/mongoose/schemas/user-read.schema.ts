import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserReadDocument = UserReadSchema & Document;

/**
 * Schema para o banco de leitura (Read Database)
 * Este schema NÃO inclui o campo password por segurança
 * Usado apenas para consultas e projeções CQRS
 */
@Schema({ collection: 'users' })
export class UserReadSchema {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  // Campo password NÃO existe neste schema (read-only database)

  @Prop({ required: false })
  lastLoginAt?: Date;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const UserReadSchemaFactory = SchemaFactory.createForClass(UserReadSchema);

