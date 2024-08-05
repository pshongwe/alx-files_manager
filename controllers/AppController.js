const { isAlive: isDbAlive, nbUsers, nbFiles } = require('../utils/db');
const { isAlive: isRedisAlive } = require('../utils/redis');


class AppController {
  static async getStatus(req, res) {
    const dbStatus = await isDbAlive();
    const redisStatus = await isRedisAlive();
    res.status(200).send({ redis: redisStatus, db: dbStatus });
  }

  static async getStats(req, res) {
    const userCount = await nbUsers();
    const fileCount = await nbFiles();
    res.status(200).send({ users: userCount, files: fileCount });
  }
}

module.exports = AppController;
