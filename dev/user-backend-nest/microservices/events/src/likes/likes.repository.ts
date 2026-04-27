import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like } from './likes.schema';

@Injectable()
export class LikesRepository {
  constructor(@InjectModel(Like.name) private likeModel: Model<Like>) {}

  async countByEventId(eventId: string): Promise<number> {
    return this.likeModel.countDocuments({ eventId }).exec();
  }

  async countByEventIds(
    eventIds: string[],
  ): Promise<Record<string, number>> {
    const counts = await this.likeModel.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]);
    const result: Record<string, number> = {};
    for (const item of counts) {
      result[item._id] = item.count;
    }
    return result;
  }

  async findByUsername(username: string): Promise<string[]> {
    const likes = await this.likeModel
      .find({ username }, { eventId: 1 })
      .exec();
    return likes.map((l) => l.eventId);
  }

  async create(eventId: string, username: string): Promise<void> {
    await this.likeModel.create({ eventId, username });
  }

  async delete(eventId: string, username: string): Promise<void> {
    await this.likeModel.deleteOne({ eventId, username }).exec();
  }

  async exists(eventId: string, username: string): Promise<boolean> {
    const doc = await this.likeModel
      .findOne({ eventId, username }, { _id: 1 })
      .exec();
    return doc !== null;
  }
}
