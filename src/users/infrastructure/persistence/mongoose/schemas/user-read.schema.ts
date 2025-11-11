import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserReadDocument = HydratedDocument<UserReadSchema> & { _id: Types.ObjectId };

@Schema({ collection: 'users' })
export class UserReadSchema {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  lastLoginAt?: Date;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const UserReadSchemaFactory = SchemaFactory.createForClass(UserReadSchema);
