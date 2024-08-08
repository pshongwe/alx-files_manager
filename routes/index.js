import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

function routeForward(app) {
  const router = express.Router();

  app.use('/', router);

  router.get('/status', AppController.getStatus);
  router.get('/stats', AppController.getStats);

  router.post('/users', UsersController.postNew);
  router.get('/users/me', UsersController.getMe);

  router.get('/connect', AuthController.getConnect);
  router.get('/disconnect', AuthController.getDisconnect);

  router.post('/files', FilesController.postUpload);
  router.get('/files/:id/data', FilesController.getFile);
  router.get('/files/:id', FilesController.getShow);
  router.get('/files', FilesController.getIndex);
  router.put('/files/:id/publish', FilesController.putPublish);
  router.put('/files/:id/unpublish', FilesController.putUnpublish);
}

export default routeForward;
