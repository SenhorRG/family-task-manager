import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FamilyDocument = HydratedDocument<FamilySchema> & { _id: Types.ObjectId };

@Schema({ collection: 'families' })
export class FamilySchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  members: Array<{
    userId: string;
    role: string;
    responsibility: string;
    joinedAt: Date;
  }>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ required: true, default: 0 })
  version: number;
}

export const FamilySchemaFactory = SchemaFactory.createForClass(FamilySchema);
