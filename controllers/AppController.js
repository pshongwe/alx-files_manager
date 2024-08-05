const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AppController {
  static async getStatus(req, res) {
    const dbStatus = await dbClient.isAlive();
    const redisStatus = await redisClient.isAlive();
    res.status(200).send({ redis: redisStatus, db: dbStatus });
  }

  static async getStats(req, res) {
    const userCount = await dbClient.nbUsers();
    const fileCount = await dbClient.nbFiles();
    res.status(200).send({ users: userCount, files: fileCount });
  }
}

module.exports = AppController;
