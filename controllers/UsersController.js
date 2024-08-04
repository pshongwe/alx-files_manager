const crypto = require('crypto');
const { User } = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      const newUser = new User({
        email,
        password: hashedPassword,
      });

      await newUser.save();

      return res.status(201).send({ email: newUser.email, id: newUser._id });
    } catch (err) {
      return res.status(500).send({ error: 'Error creating user' });
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const user = await User.findById(userId).select('email _id');
      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      return res.status(200).send({ email: user.email, id: user._id });
    } catch (err) {
      return res.status(500).send({ error: 'Error retrieving user' });
    }
  }
}

module.exports = UsersController;
