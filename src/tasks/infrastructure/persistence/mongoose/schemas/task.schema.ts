import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<TaskSchema> & { _id: Types.ObjectId };

@Schema({ collection: 'tasks' })
export class TaskSchema {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  familyId: string;

  @Prop({ required: true })
  assignments: Array<{
    assignedTo: string;
    assignedBy: string;
    assignedAt: Date;
  }>;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  dueDate?: Date;

  @Prop()
  location?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ required: true, default: 0 })
  version: number;
}

export const TaskSchemaFactory = SchemaFactory.createForClass(TaskSchema);
