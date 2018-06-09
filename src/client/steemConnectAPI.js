import sc2 from 'sc2-sdk';

const api = sc2.Initialize({
  app: 'ulogs.app', //process.env.STEEMCONNECT_CLIENT_ID
  baseURL: process.env.STEEMCONNECT_HOST,  //process.env.r
  callbackURL: 'http://ulogs.org/callback', // process.env.STEEMCONNECT_REDIRECT_URL
});

export default api;
