const { User } = require('../utils/dbUtils');
const redisClient = require('../utils/redisUtils');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class AuthController {
    static async getConnect(req, res) {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).send({ error: 'Unauthorized' });
        }

        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [email, password] = credentials.split(':');

        if (!email || !password) {
            return res.status(401).send({ error: 'Unauthorized' });
        }

        const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
        const user = await User.findOne({ email, password: hashedPassword });

        if (!user) {
            return res.status(401).send({ error: 'Unauthorized' });
        }

        const token = uuidv4();
        await redisClient.set(`auth_${token}`, user._id.toString(), 'EX', 24 * 60 * 60);

        return res.status(200).send({ token });
    }

    static async getDisconnect(req, res) {
        const token = req.header('X-Token');
        if (!token) {
            return res.status(401).send({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).send({ error: 'Unauthorized' });
        }

        await redisClient.del(`auth_${token}`);
        return res.status(204).send();
    }
}

module.exports = AuthController;
