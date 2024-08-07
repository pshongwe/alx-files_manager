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
    this.clientConnected = true;
    this.client.on('error', (error) => {
      console.error(`Redis client error: ${error.message}`);
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
   * @return {string} - The value associated with the key
   */
  async get(key) {
    return promisify(this.client.GET).bind(this.client)(key);
  }

  /**
   * Set value in Redis with expiration
   * @param {string} key - The key to set in Redis
   * @param {string} value - The value to set in Redis
   * @param {number} duration - The expiration time in seconds
   * @return {undefined}  No return
   */
  async set(key, value, duration) {
    await promisify(this.client.SETEX)
      .bind(this.client)(key, duration, value);
  }

  /**
   * Delete value from Redis by key
   * @param {string} key - The key to delete from Redis
   * @return {undefined}  No return
   */
  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

/**
 * Export an instance of RedisClient
 */
const redisClient = new RedisClient();
export default redisClient;
