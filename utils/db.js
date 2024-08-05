import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MongoDB Client class
 */
class DBClient {
  /**
   * Creates MongoDB client instance.
   */
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
        this.clientConnected = true;
      })
      .catch((error) => {
        console.error(`MongoDB client error: ${error}`);
        this.clientConnected = false;
      });
  }

  /**
   * Check if MongoDB connection is active
   * @returns {boolean} - True if the MongoDB client is connected, otherwise false
   */
  isAlive() {
    return this.clientConnected;
  }

  /**
   * Get number of users in the database
   * @returns {Promise<number>} - The number of documents in the users collection
   */
  async nbUsers() {
    if (!this.isAlive()) return 0;
    return this.client.db().collection('users').countDocuments();
  }

  /**
   * Get number of files in the database
   * @returns {Promise<number>} - The number of documents in the files collection
   */
  async nbFiles() {
    if (!this.isAlive()) return 0;
    return this.client.db().collection('files').countDocuments();
  }
}

/**
 * Export an instance of DBClient
 */
const dbClient = new DBClient();
export default dbClient;
