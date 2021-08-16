export default class JobError extends Error {
  constructor(message: string) {
    const newMessage = message;
    super(newMessage);
  }
}
