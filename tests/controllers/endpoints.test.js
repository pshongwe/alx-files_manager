/* eslint-disable jest/expect-expect */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable jest/valid-expect */
/* eslint-disable consistent-return */
/* eslint-disable jest/no-test-callback */
/* eslint-disable no-undef */
/* eslint-disable jest/lowercase-name */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
import { expect } from 'chai';
import request from 'supertest';
import app from '../../server';

describe('API Endpoints', () => {
  let userToken;
  let userId;
  let fileId;

  before((done) => {
    // Create a user and get a token for authenticated requests
    request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'password' })
      .end((err, res) => {
        if (err) return done(err);
        userId = res.body.id;
        request(app)
          .get('/connect')
          .auth('test@example.com', 'password')
          .end((err, res) => {
            if (err) return done(err);
            userToken = res.body.token;
            done();
          });
      });
  });

  after((done) => {
    // Disconnect the user
    request(app)
      .get('/disconnect')
      .set('X-Token', userToken)
      .end(() => {
        done();
      });
  });

  describe('GET /status', () => {
    it('should return the status of the API', (done) => {
      request(app)
        .get('/status')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('redis');
          expect(res.body).to.have.property('db');
          done();
        });
    });
  });

  describe('GET /stats', () => {
    it('should return the statistics of the API', (done) => {
      request(app)
        .get('/stats')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('users');
          expect(res.body).to.have.property('files');
          done();
        });
    });
  });

  describe('POST /users', () => {
    it('should create a new user', (done) => {
      request(app)
        .post('/users')
        .send({ email: 'newuser@example.com', password: 'password' })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('email', 'newuser@example.com');
          done();
        });
    });
  });

  describe('GET /connect', () => {
    it('should authenticate the user and return a token', (done) => {
      request(app)
        .get('/connect')
        .auth('newuser@example.com', 'password')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('token');
          done();
        });
    });
  });

  describe('GET /disconnect', () => {
    it('should disconnect the user', (done) => {
      request(app)
        .get('/disconnect')
        .set('X-Token', userToken)
        .expect(204, done);
    });
  });

  describe('GET /users/me', () => {
    it('should return the authenticated user details', (done) => {
      request(app)
        .get('/users/me')
        .set('X-Token', userToken)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('id', userId);
          expect(res.body).to.have.property('email', 'test@example.com');
          done();
        });
    });
  });

  describe('POST /files', () => {
    it('should create a new file', (done) => {
      request(app)
        .post('/files')
        .set('X-Token', userToken)
        .send({ name: 'testfile.txt', type: 'file', data: 'SGVsbG8gd29ybGQ=' })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name', 'testfile.txt');
          fileId = res.body.id;
          done();
        });
    });
  });

  describe('GET /files/:id', () => {
    it('should return the file details', (done) => {
      request(app)
        .get(`/files/${fileId}`)
        .set('X-Token', userToken)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('id', fileId);
          expect(res.body).to.have.property('name', 'testfile.txt');
          done();
        });
    });
  });

  describe('GET /files', () => {
    it('should return the list of files with pagination', (done) => {
      request(app)
        .get('/files')
        .set('X-Token', userToken)
        .query({ page: 0 })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('PUT /files/:id/publish', () => {
    it('should publish the file', (done) => {
      request(app)
        .put(`/files/${fileId}/publish`)
        .set('X-Token', userToken)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('isPublic', true);
          done();
        });
    });
  });

  describe('PUT /files/:id/unpublish', () => {
    it('should unpublish the file', (done) => {
      request(app)
        .put(`/files/${fileId}/unpublish`)
        .set('X-Token', userToken)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('isPublic', false);
          done();
        });
    });
  });

  describe('GET /files/:id/data', () => {
    it('should return the file data', (done) => {
      request(app)
        .get(`/files/${fileId}/data`)
        .set('X-Token', userToken)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.equal('Hello world');
          done();
        });
    });
  });
});
