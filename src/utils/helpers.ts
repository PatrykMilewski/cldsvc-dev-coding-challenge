/**
 * Normalize a port into a number, string, or false.
 */
import { port, server } from '../app';

export const normalizePort = (val: string): string | number | boolean => {
  const parsedPort = parseInt(val, 10);

  if (Number.isNaN(parsedPort)) {
    // named pipe
    return val;
  }

  if (parsedPort >= 0) {
    // port number
    return parsedPort;
  }

  return false;
};

/**
 * Event listener for HTTP server "error" event.
 */
export const onError = (error: ExpressError): void => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port.toString()}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`); // eslint-disable-line no-console
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`); // eslint-disable-line no-console
      process.exit(1);
      break;
    default:
      throw error;
  }
};

interface ExpressError extends Error {
  syscall?: string;
  code?: string;
}

/**
 * Event listener for HTTP server "listening" event.
 */

export const onListening = (): void => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port ?? 'unknown'}`;
  console.log(`Listening on ${bind}`); // eslint-disable-line no-console
};
