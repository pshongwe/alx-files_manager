const { isDBAlive, getUserCount, getFileCount } = require('../utils/db');
const { isRedisAlive } = require('../utils/redis');

class AppController {
  static async getStatus(req, res) {
    const dbStatus = await isDBAlive();
    const redisStatus = await isRedisAlive();
    res.status(200).send({ redis: redisStatus, db: dbStatus });
  }

  static async getStats(req, res) {
    const userCount = await getUserCount();
    const fileCount = await getFileCount();
    res.status(200).send({ users: userCount, files: fileCount });
  }
}

module.exports = AppController;
