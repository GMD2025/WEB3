import { PubSub } from 'graphql-subscriptions';

export class PubSubManager {
  private static instance: PubSubManager;
  private pubSub: PubSub;

  private constructor() {
    this.pubSub = new PubSub();
  }

  static getInstance(): PubSubManager {
    if (!PubSubManager.instance) {
      PubSubManager.instance = new PubSubManager();
    }
    return PubSubManager.instance;
  }

  async publish(triggerName: string, payload: any): Promise<void> {
    await this.pubSub.publish(triggerName, payload);
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return this.pubSub.asyncIterator<T>(triggers);
  }

  static readonly GAME_UPDATED = 'GAME_UPDATED';
  static readonly GAME_ACTION = 'GAME_ACTION';
  static readonly PLAYER_JOINED = 'PLAYER_JOINED';
  static readonly PLAYER_LEFT = 'PLAYER_LEFT';
}