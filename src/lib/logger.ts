import winston from 'winston';

const { combine, timestamp, colorize, printf, json } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

const devFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize(),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

const prodFormat = combine(timestamp(), json());

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? prodFormat : devFormat,
  }),
];

if (isProduction && !isBuild) {
  transports.push(
    new winston.transports.File({
      filename: '/var/log/mediaos/error.log',
      level: 'error',
      format: prodFormat,
    }),
    new winston.transports.File({
      filename: '/var/log/mediaos/app.log',
      format: prodFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  transports,
});
