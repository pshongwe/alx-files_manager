import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

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
      const existingUser = await dbClient.userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).send({ error: 'Already exist' });
      }

      const hashedPassword = sha1(password);
      const newUser = await dbClient.userCollection.insertOne({
        email,
        password: hashedPassword,
      });

      return res.status(201).send({ email: newUser.email, id: newUser._id });
    } catch (err) {
      console.log(err);
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

      const user = await dbClient.userCollection.findOne({
        _id: ObjectId(userId),
      });

      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      return res.status(201).send({ email: user.email, id: user._id });
    } catch (err) {
      return res.status(500).send({ error: 'Error retrieving user' });
    }
  }
}

export default UsersController;
