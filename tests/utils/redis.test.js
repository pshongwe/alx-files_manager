/* eslint-disable no-undef */
// tests/redisClient.test.js

import { expect } from 'chai';
import sinon from 'sinon';
import { createClient } from 'redis';
import redisClient from '../../utils/redis';

describe('redisClient', () => {
  let clientStub;

  // eslint-disable-next-line no-undef
  before(() => {
    clientStub = sinon.stub(createClient.prototype);
    clientStub.on = sinon.stub().callsFake((event, callback) => {
      if (event === 'connect') {
        callback();
      }
    });
    clientStub.GET = sinon.stub();
    clientStub.SETEX = sinon.stub();
    clientStub.DEL = sinon.stub();
  });

  after(() => {
    sinon.restore();
  });

  describe('isAlive', () => {
    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return true if the Redis client is connected', () => {
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(redisClient.isAlive()).to.be.true;
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return false if the Redis client is not connected', () => {
      clientStub.on = sinon.stub().callsFake((event, callback) => {
        if (event === 'error') {
          callback();
        }
      });
      redisClient.clientConnected = false;
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(redisClient.isAlive()).to.be.false;
    });
  });

  describe('get', () => {
    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return the value for a given key', async () => {
      const key = 'testKey';
      const value = 'testValue';
      clientStub.GET.withArgs(key).resolves(value);

      const result = await redisClient.get(key);
      // eslint-disable-next-line jest/valid-expect
      expect(result).to.equal(value);
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return null if the key does not exist', async () => {
      const key = 'nonexistentKey';
      clientStub.GET.withArgs(key).resolves(null);

      const result = await redisClient.get(key);
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(result).to.be.null;
    });
  });

  describe('set', () => {
    it('should set the value for a given key with expiration', async () => {
      const key = 'testKey';
      const value = 'testValue';
      const duration = 60;
      clientStub.SETEX.withArgs(key, duration, value).resolves('OK');

      await redisClient.set(key, value, duration);
      expect(clientStub.SETEX.calledWith(key, duration, value)).to.be.true;
    });
  });

  describe('del', () => {
    it('should delete the value for a given key', async () => {
      const key = 'testKey';
      clientStub.DEL.withArgs(key).resolves(1);

      await redisClient.del(key);
      expect(clientStub.DEL.calledWith(key)).to.be.true;
    });
  });
});
