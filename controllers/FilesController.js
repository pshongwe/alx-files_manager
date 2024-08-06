import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import UsersController from './UsersController';

class FilesController {
  static async postUpload(req, res) {
    try {
      // Retrieve the user based on the token
      const user = await UsersController.getUserFromToken(req.headers.authorization);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate the request body
      const {
        name, type, parentId = 0, isPublic = false, data,
      } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Handle the parent folder
      if (parentId) {
        const parentFile = await this.getFileById(parentId);
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Create the new file
      let localPath = null;
      if (type !== 'folder') {
        // Save the file to disk
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        const filePath = `${folderPath}/${uuidv4()}`;
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
        localPath = filePath;
      }

      // Save the file to the database
      const newFile = await this.createFile({
        userId: user.id,
        name,
        type,
        isPublic,
        parentId,
        localPath,
      });

      return res.status(201).json(newFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
