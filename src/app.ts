import express from 'express';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import helmet from 'helmet';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';
import http from 'http';
import { normalizePort, onError, onListening } from './utils/helpers';

export const app = express();
export const server = http.createServer(app);
export const port = normalizePort(process.env.PORT || '3000');

app.use(helmet()); // https://expressjs.com/en/advanced/best-practice-security.html#use-helmet
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', router);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(new createError.NotFound());
});

// pass any errors to the error handler
app.use(errorHandler);

app.set('port', port);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
