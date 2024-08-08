/* eslint-disable no-unused-vars */
import fs from 'fs';
import { promisify } from 'util';
import mailgun from 'mailgun-js';
import mimeMessage from 'mime-message';

const readFileAsync = promisify(fs.readFile);

const DOMAIN = process.env.MAILGUN_DOMAIN;
const API_KEY = process.env.MAILGUN_API_KEY;
const SENDER_EMAIL = process.env.MAILGUN_SENDER;

/**
 * Contains routines for mail delivery with Mailgun.
 */
export default class Mailer {
  static buildMessage(dest, subject, message) {
    const msgData = {
      type: 'text/html',
      encoding: 'UTF-8',
      from: SENDER_EMAIL,
      to: [dest],
      cc: [],
      bcc: [],
      replyTo: [],
      date: new Date(),
      subject,
      body: message,
    };

    if (!SENDER_EMAIL) {
      throw new Error(`Invalid sender: ${SENDER_EMAIL}`);
    }
    if (mimeMessage.validMimeMessage(msgData)) {
      const mimeMsg = mimeMessage.createMimeMessage(msgData);
      return mimeMsg.toString();
    }
    throw new Error('Invalid MIME message');
  }

  static sendMail(dest, subject, message) {
    const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
    const mail = Mailer.buildMessage(dest, subject, message);

    const data = {
      from: SENDER_EMAIL,
      to: dest,
      subject,
      html: message,
      'h:Content-Type': 'text/html',
    };

    mg.messages().send(data, (error, body) => {
      if (error) {
        console.log(`The API returned an error: ${error.message || error.toString()}`);
        return;
      }
      console.log('Message sent successfully');
      console.log(body);
    });
  }
}
