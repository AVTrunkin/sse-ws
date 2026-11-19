import Entity from './Entity';
import createRequest from './createRequest';

const SERVER_URL = 'http://localhost:3000';

export default class ChatAPI extends Entity {
  checkNickname(name, callback) {
    createRequest({
      url: `${SERVER_URL}/new-user`,
      method: 'POST',
      body: { name },
      callback,
    });
  }
}
