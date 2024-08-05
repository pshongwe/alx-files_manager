import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;

/**
 * MongoDB Client class
 */
class DBClient {
  /**
   * Creates MongoDB client instance.
   */
  constructor() {
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
        this.userCollection = this.db.collection('users');
        this.fileCollection = this.db.collection('files');
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
    return !!this.db;
  }

  /**
   * Get number of users in the database
   * @returns {Promise<number>} - The number of documents in the users collection
   */
  async nbUsers() {
    if (!this.isAlive()) return 0;
    return this.userCollection.countDocuments();
  }

  /**
   * Get number of files in the database
   * @returns {Promise<number>} - The number of documents in the files collection
   */
  async nbFiles() {
    if (!this.isAlive()) return 0;
    return this.fileCollection.countDocuments();
  }
}

/**
 * Export an instance of DBClient
 */
const dbClient = new DBClient();
export default dbClient;
