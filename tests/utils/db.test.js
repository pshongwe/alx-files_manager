/* eslint-disable no-undef */
import { expect } from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import dbClient from '../../utils/db';

describe('dBClient', () => {
  let mongoClientStub;
  let dbStub;
  let collectionStub;

  // eslint-disable-next-line no-undef
  before(() => {
    collectionStub = {
      countDocuments: sinon.stub(),
    };

    dbStub = {
      collection: sinon.stub().returns(collectionStub),
    };

    mongoClientStub = sinon.stub(MongoClient.prototype, 'connect').resolves({
      db: sinon.stub().returns(dbStub),
    });
  });

  after(() => {
    mongoClientStub.restore();
  });

  describe('isAlive', () => {
    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return true if the database is connected', async () => {
      await dbClient.client.connect();
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(dbClient.isAlive()).to.be.true;
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return false if the database is not connected', () => {
      dbClient.db = null;
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(dbClient.isAlive()).to.be.false;
    });
  });

  describe('nbUsers', () => {
    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return the number of users in the database', async () => {
      const count = 10;
      collectionStub.countDocuments.resolves(count);
      await dbClient.client.connect();
      const result = await dbClient.nbUsers();
      // eslint-disable-next-line jest/valid-expect
      expect(result).to.equal(count);
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return 0 if the database is not connected', async () => {
      dbClient.db = null;
      const result = await dbClient.nbUsers();
      // eslint-disable-next-line jest/valid-expect
      expect(result).to.equal(0);
    });
  });

  describe('nbFiles', () => {
    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return the number of files in the database', async () => {
      const count = 20;
      collectionStub.countDocuments.resolves(count);
      await dbClient.client.connect();
      const result = await dbClient.nbFiles();
      // eslint-disable-next-line jest/valid-expect
      expect(result).to.equal(count);
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return 0 if the database is not connected', async () => {
      dbClient.db = null;
      const result = await dbClient.nbFiles();
      // eslint-disable-next-line jest/valid-expect
      expect(result).to.equal(0);
    });
  });
});
