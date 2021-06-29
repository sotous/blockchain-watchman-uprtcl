import fetch from 'node-fetch';
require('dotenv').config();

export class Auth0Connection {
  host: string;
  clientId: string;
  clientSecret: string;
  audience: string;
  grantType: string;
  jwtToken: Promise<string>;

  constructor(
    _host: string,
    _clientId: string,
    _clientSecret: string,
    _audience: string,
    _grantType: string
  ) {
    this.host = _host;
    this.clientId = _clientId;
    this.clientSecret = _clientSecret;
    this.audience = _audience;
    this.grantType = _grantType;
    this.jwtToken = new Promise<string>(async (resolve) => {
      const jwt = await this.getToken();
      resolve(jwt.access_token);
    });
  }

  async getToken() {
    const body = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      audience: this.audience,
      grant_type: this.grantType,
    };

    const response = await fetch(this.host, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  }
}
