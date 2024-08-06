import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

function routeForward(app) {
  const router = express.Router();

  app.use('/', router);

  // Define routes
  router.get('/status', AppController.getStatus);
  router.get('/stats', AppController.getStats);
  router.post('/users', UsersController.postNew);
  router.get('/connect', AuthController.getConnect);
  router.get('/disconnect', AuthController.getDisconnect);
  router.get('/users/me', UsersController.getMe);
  router.post('/files', FilesController.postUpload);
  router.get('/files/:id', FilesController.getFile);
  router.put('/files/:id', FilesController.putFile);
  router.delete('/files/:id', FilesController.deleteFile);
  router.put('/files/:id', FilesController.putPublish);
  router.put('/files/:id', FilesController.putUnpublish);
}

export default routeForward;
