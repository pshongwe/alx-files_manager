import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';
import { promises as fsPromises } from 'fs';
import extras from '../utils/extras';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const fileQueue = new Queue('fileQueue');

class FilesController {
  /**
   * Should create a new file in DB and in disk
   */
  static async postUpload(req, res) {
    const { userId } = await extras.getUserIdAndKey(req);

    if (!extras.isValidId(userId)) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (!userId && req.body.type === 'image') {
      await fileQueue.add({});
    }

    const user = await extras.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { error: validationError, fileParams } = await extras.validateBody(
      req,
    );

    if (validationError) return res.status(400).send({ error: validationError });

    if (fileParams.parentId !== 0 && !extras.isValidId(fileParams.parentId)) return res.status(400).send({ error: 'Parent not found' });

    const { error, code, newFile } = await extras.saveFile(
      userId,
      fileParams,
      FOLDER_PATH,
    );

    if (error) {
      if (res.body.type === 'image') await fileQueue.add({ userId });
      return res.status(code).send(error);
    }

    if (fileParams.type === 'image') {
      await fileQueue.add({
        fileId: newFile.id.toString(),
        userId: newFile.userId.toString(),
      });
    }

    return res.status(201).send(newFile);
  }

  /**
   * Should retrieve the file document based on the ID
   */
  static async getShow(req, res) {
    const fileId = req.params.id;

    const { userId } = await extras.getUserIdAndKey(req);

    const user = await extras.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    if (!extras.isValidId(fileId) || !extras.isValidId(userId)) return res.status(404).send({ error: 'Not found' });

    const result = await extras.getFileFromDb({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!result) return res.status(404).send({ error: 'Not found' });

    const file = extras.processFile(result);

    return res.status(200).send(file);
  }

  /**
   * should retrieve all users file documents for a specific
   * parentId and with pagination
   */
  static async getIndex(req, res) {
    const { userId } = await extras.getUserIdAndKey(req);

    const user = await extras.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    let parentId = req.query.parentId || '0';

    if (parentId === '0') parentId = 0;

    let page = Number(req.query.page) || 0;

    if (Number.isNaN(page)) page = 0;

    if (parentId !== 0 && parentId !== '0') {
      if (!extras.isValidId(parentId)) return res.status(401).send({ error: 'Unauthorized' });

      parentId = ObjectId(parentId);

      const folder = await extras.getFileFromDb({
        _id: ObjectId(parentId),
      });

      if (!folder || folder.type !== 'folder') return res.status(200).send([]);
    }

    const pipeline = [
      { $match: { parentId } },
      { $skip: page * 20 },
      {
        $limit: 20,
      },
    ];

    const fileCursor = await extras.getFilesOfParentId(pipeline);

    const fileList = [];
    await fileCursor.forEach((doc) => {
      const document = extras.processFile(doc);
      fileList.push(document);
    });

    return res.status(200).send(fileList);
  }

  /**
   * Should set isPublic to true on the file document based on the ID
   */
  static async putPublish(req, res) {
    const { error, code, updatedFile } = await this.publishUnpublish(
      req,
      true,
    );

    if (error) return res.status(code).send({ error });

    return res.status(code).send(updatedFile);
  }

  /**
   * Should set isPublic to false on the file document based on the ID
   */
  static async putUnpublish(req, res) {
    const { error, code, updatedFile } = await this.publishUnpublish(
      req,
      false,
    );

    if (error) return res.status(code).send({ error });

    return res.status(code).send(updatedFile);
  }

  /**
   * Should return the content of the file document based on the ID
   */
  static async getFile(req, res) {
    const { userId } = await extras.getUserIdAndKey(req);
    const { id: fileId } = req.params;
    const size = req.query.size || 0;

    if (!extras.isValidId(fileId)) return res.status(404).send({ error: 'Not found' });

    const file = await extras.getFileFromDb({
      _id: ObjectId(fileId),
    });

    if (!file || !extras.isOwnerAndPublic(file, userId)) return res.status(404).send({ error: 'Not found' });

    if (file.type === 'folder') {
      return res
        .status(400)
        .send({ error: "A folder doesn't have content" });
    }

    const { error, code, data } = await extras.getFileData(file, size);

    if (error) return res.status(code).send({ error });

    const mimeType = mime.contentType(file.name);

    res.setHeader('Content-Type', mimeType);

    return res.status(200).send(data);
  }
}

export default FilesController;
