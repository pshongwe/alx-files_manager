const crypto = require('crypto');
const { User } = require('../utils/dbUtils');

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
}

module.exports = UsersController;
