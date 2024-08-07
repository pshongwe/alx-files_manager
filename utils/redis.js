import { createClient } from 'redis';
import { promisify } from 'util';

/**
 * Redis Client class
 */
class RedisClient {
  /**
   * Creates redis client instance.
   */
  constructor() {
    this.client = createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.clientConnected = true;
    this.client.on('error', (error) => {
      console.error(`Redis client error: ${error}`);
      this.clientConnected = false;
    });
    this.client.on('connect', () => {
      this.clientConnected = true;
    });
  }

  /**
   * Check if redis connection is active
   * @returns {boolean} - True if the Redis client is connected, otherwise false
   */
  isAlive() {
    return this.clientConnected;
  }

  /**
   * Get value from Redis by key
   * @param {string} key - The key to retrieve from Redis
   * @returns {Promise<string>} - The value associated with the key
   */
  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  /**
   * Set value in Redis with expiration
   * @param {string} key - The key to set in Redis
   * @param {string} value - The value to set in Redis
   * @param {number} duration - The expiration time in seconds
   */
  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  /**
   * Delete value from Redis by key
   * @param {string} key - The key to delete from Redis
   * @returns {Promise<number>} - The number of keys that were removed
   */
  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}

/**
 * Export an instance of RedisClient
 */
const redisClient = new RedisClient();
export default redisClient;
