export default class Connection {
  constructor(url) {
    if (typeof url !== 'string') {
      throw new Error('url parameter of type "string" is required');
    }
    this.url = url;
  }

  get(endpoint) {
    const options = {
      method: 'GET'
    };

    return fetch(this.url + endpoint, options)
      .then(this.handleResponse);
  }

  post(data, endpoint) {
    const options = {
      method: 'POST',
      body: data
    };

    return fetch(this.url + endpoint, options)
      .then(this.handleResponse);
  }

  handleResponse(response) {
    return response.json();
  }
}
