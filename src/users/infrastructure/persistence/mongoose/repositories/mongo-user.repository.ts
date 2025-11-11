import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventBus } from '@nestjs/cqrs';
import { UserRepository } from '../../../../domain/ports';
import { User } from '../../../../domain/aggregates';
import { UserId, Email, Password, FullName } from '../../../../domain/value-objects';
import { UserDocument, UserSchema } from '../schemas';
import { EventStore, PasswordHasher } from '../../../../../shared';

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserSchema.name, 'writeConnection')
    private readonly writeModel: Model<UserDocument>,
    @Inject('EventStore')
    private readonly eventStore: EventStore,
    @Inject('PasswordHasher')
    private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus,
  ) {}

  async save(user: User): Promise<void> {
    const userData = {
      _id: user.userId.value,
      fullName: user.fullName.value,
      email: user.email.value,
      password: user.password.hashedValue,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    try {
      await this.writeModel.create(userData);
    } catch (error) {
      if (error.code === 11000) {
        await this.writeModel.findByIdAndUpdate(user.userId.value, userData, {
          new: true,
        });
      } else {
        throw error;
      }
    }

    const uncommittedEvents = user.uncommittedEvents;
    if (uncommittedEvents.length > 0) {
      await this.eventStore.saveEvents(
        user.userId.value,
        uncommittedEvents,
        user.version - uncommittedEvents.length,
      );

      for (const event of uncommittedEvents) {
        await this.eventBus.publish(event);
      }

      user.markEventsAsCommitted();
    }
  }

  async findById(id: UserId): Promise<User | null> {
    const userDoc = await this.writeModel.findById(id.value).exec();
    if (!userDoc) {
      return null;
    }

    return this.mapToDomain(userDoc);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userDoc = await this.writeModel
      .findOne({
        email: email.value,
      })
      .exec();
    if (!userDoc) {
      return null;
    }

    return this.mapToDomain(userDoc);
  }

  async exists(email: Email): Promise<boolean> {
    const count = await this.writeModel.countDocuments({ email: email.value });
    return count > 0;
  }

  async delete(id: UserId): Promise<void> {
    await this.writeModel.findByIdAndDelete(id.value);
  }

  private mapToDomain(userDoc: UserDocument): User {
    const userId = new UserId(userDoc._id.toString());
    const userFullName = new FullName(userDoc.fullName);
    const userEmail = new Email(userDoc.email);
    const userPassword = new Password(userDoc.password, this.passwordHasher, true);

    return new User(
      userId,
      userFullName,
      userEmail,
      userPassword,
      userDoc.createdAt,
      userDoc.updatedAt,
    );
  }
}
