import { ObjectId } from 'mongodb';
import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import redisClient from './redis';
import dbClient from './db';

const extras = {
  /**
   * Gets a user from database
   * @query {object} query expression for finding
   * user
   * @return {object} user document object
   */
  async getUser(query) {
    const user = await dbClient.userCollection.findOne(query);

    return user;
  },

  /**
   * Gets a user id and key of redis from request
   * @request {request_object} express request obj
   * @return {object} object containing userId and
   * redis key for token
   */
  async getUserIdAndKey(req) {
    const obj = { userId: null, key: null };
    const xToken = req.header('X-Token');

    if (!xToken) {
      return obj;
    }

    obj.key = `auth_${xToken}`;
    obj.userId = await redisClient.get(obj.key);

    return obj;
  },

  /**
   * Checks if a file is public and belongs to a
   * specific user
   * @file {object} file to evaluate
   * @userId {string} id of user to check ownership
   * @return {boolean} true or false
   */
  isOwnerAndPublic(file, userId) {
    if ((!file.isPublic && !userId)
      || (userId && file.userId.toString() !== userId && !file.isPublic)
    ) {
      return false;
    }

    return true;
  },

  /**
   * Checks if Id is Valid for Mongo
   * @id {string|number} id to be evaluated
   * @return {boolean} true if valid, false if not
   */
  isValidId(id) {
    try {
      ObjectId(id);
    } catch (err) {
      return false;
    }
    return true;
  },

  /**
   * Gets a files data from database
   * @file {object} file to obtain data of
   * @size {string} size in case of file being image
   * @return {object} data of file or error and status code
   */
  async getFileData(file, size) {
    let { localPath } = file;
    let data;

    if (size) localPath = `${localPath}_${size}`;

    try {
      data = await fsPromises.readFile(localPath);
    } catch (err) {
      return { error: 'Not found', code: 404 };
    }

    return { data };
  },

  /**
   * Transform _id into id in a file document
   * @doc {object} document to be processed
   * @return {object} processed document
   */
  processFile(doc) {
    const file = { id: doc._id, ...doc };

    delete file.localPath;
    delete file._id;

    return file;
  },

  /**
   * gets list of file documents from db belonging
   * to a parent id
   * @query {obj} query used to find file
   * @return {Array} list of files
   */
  async getFilesOfParentId(query) {
    const fileList = await dbClient.fileCollection.aggregate(query);
    return fileList;
  },

  /**
   * saves files to database and disk
   * @userId {string} query used to find file
   * @fileParams {obj} object with attributes of file to save
   * @FOLDER_PATH {string} path to save file in disk
   * @return {obj} object with error if present and file
   */
  async saveFile(userId, fileParams, FOLDER_PATH) {
    const {
      name, type, isPublic, data,
    } = fileParams;
    let { parentId } = fileParams;

    if (parentId !== 0) parentId = ObjectId(parentId);

    const query = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    if (fileParams.type !== 'folder') {
      const fileNameUUID = uuidv4();

      const fileDataDecoded = Buffer.from(data, 'base64');
      const path = `${FOLDER_PATH}/${fileNameUUID}`;

      query.localPath = path;

      try {
        await fsPromises.mkdir(FOLDER_PATH, { recursive: true });
        await fsPromises.writeFile(path, fileDataDecoded);
      } catch (err) {
        return { error: err.message, code: 400 };
      }
    }

    const result = await dbClient.fileCollection.insertOne(query);
    const file = this.processFile(query);
    const newFile = { id: result.insertedId, ...file };

    return { error: null, newFile };
  },

  /**
   * Validates if body is valid for creating file
   * @req {req_object} express req obj
   * @return {object} object with err and validated params
   */
  async validateBody(req) {
    const {
      name, type, isPublic = false, data,
    } = req.body;

    let { parentId = 0 } = req.body;

    const typesAllowed = ['file', 'image', 'folder'];
    let msg = null;

    if (parentId === '0') parentId = 0;

    if (!name) {
      msg = 'Missing name';
    } else if (!type || !typesAllowed.includes(type)) {
      msg = 'Missing type';
    } else if (!data && type !== 'folder') {
      msg = 'Missing data';
    } else if (parentId && parentId !== '0') {
      let file;

      if (this.isValidId(parentId)) {
        file = await this.getFileFromDb({
          _id: ObjectId(parentId),
        });
      } else {
        file = null;
      }

      if (!file) {
        msg = 'Parent not found';
      } else if (file.type !== 'folder') {
        msg = 'Parent is not a folder';
      }
    }

    const obj = {
      error: msg,
      fileParams: {
        name,
        type,
        parentId,
        isPublic,
        data,
      },
    };

    return obj;
  },

  /**
   * gets file document from db
   * @query {obj} query used to find file
   * @return {object} file
   */
  async getFileFromDb(query) {
    const file = await dbClient.fileCollection.findOne(query);
    return file;
  },
};

export default extras;
