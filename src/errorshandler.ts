import Connect from './connect';

export default class JobError extends Error {
  constructor(message: string) {
    const newMessage = Connect.replace(message);
    super(newMessage);
  }
}
