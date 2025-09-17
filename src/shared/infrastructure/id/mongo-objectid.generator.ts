import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { IdGenerator } from '../../domain/ports';

@Injectable()
export class MongoObjectIdGenerator implements IdGenerator {
  generate(): string {
    return new Types.ObjectId().toString();
  }
}
