import winston from 'winston';

let loggerOpts: winston.LoggerOptions;

if (typeof window !== 'undefined') {
    // i think we're in a browser
    loggerOpts = {
        level: 'info',
        transports: [
            new winston.transports.Console({
                format: winston.format.simple(),
            }),
        ],
    };
} else {
    // i think we're in node
    // TODO: these filenames need to be configurable
    const transports: Array<any> = [
        new winston.transports.File({
            filename: './logs/error.log',
            level: 'error',
        }),
        new winston.transports.File({ filename: './logs/combined.log' }),
    ];

    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({ format: winston.format.simple() }),
      )
    }

    loggerOpts = {
        level: 'info',
        format: winston.format.json(),
        transports,
    };
}

export const log: winston.Logger = winston.createLogger(loggerOpts);

/**
 * Make a new logger, using the calling filename as label.
 */
export default function(callingModuleFile: string): winston.Logger {
  const parts = callingModuleFile.split("/");
  const label = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.label({ label }),
      winston.format.timestamp(),
      winston.format.prettyPrint()
    ),
    transports: [new winston.transports.Console()]
  });
  return logger;
}
