const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
   winston.format.timestamp(),
   winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
   format: logFormat,
   transports: [
      // Write all logs with importance level of 'info' or higher to combined.log
      new winston.transports.File({
         filename: path.join(__dirname, '../../logs/combined.log'),
         level: 'info',
         maxsize: 5242880, // 5MB
         maxFiles: 5,
      }),
      // Write all logs with importance level of 'error' or higher to error.log
      new winston.transports.File({
         filename: path.join(__dirname, '../../logs/error.log'),
         level: 'error',
         maxsize: 5242880, // 5MB
         maxFiles: 5,
      })
   ],
});

// If we're not in production then log to the console as well
if (process.env.NODE_ENV !== 'production') {
   logger.add(new winston.transports.Console({
      format: winston.format.simple()
   }));
}

module.exports = logger;
