import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FamilyDocument = FamilySchema & Document;

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
}

export const FamilySchemaFactory = SchemaFactory.createForClass(FamilySchema);
