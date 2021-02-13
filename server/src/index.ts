import http from 'http';

import app from './server';

const server = http.createServer(app);

let currentApp = app;
server.listen(3001);

// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.accept('./server', () => {
    server.removeListener('request', currentApp);
    server.on('request', app);
    currentApp = app;
  });
}
