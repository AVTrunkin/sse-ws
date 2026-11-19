import createRequest from './createRequest';

export default class Entity {
  constructor(url) {
    this.url = url;
  }

  list(callback) {
    return createRequest({ 
      url: this.url, 
      method: 'GET', 
      callback });
  }

  get(id, callback) {
    return createRequest({ 
      url: `${this.url}/${id}`, 
      method: 'GET', 
      callback });
  }

  create(data, callback) {
    return createRequest({ 
      url: this.url, 
      method: 'POST', 
      body: data, 
      callback });
  }

  update(id, data, callback) {
    return createRequest({
      url: `${this.url}/${id}`,
      method: 'PUT',
      body: data,
      callback,
    });
  }

  delete(id, callback) {
    return createRequest({ url: `${this.url}/${id}`, method: 'DELETE', callback });
  }
}
