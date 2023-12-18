import { env } from 'process';
import util from 'util';
import { get } from '../utils/env';

export enum LogCategory {
  system,
  request,
  trace,
};

export enum Levels {
  debug,
  info,
  warn,
  error,
};

export type ILogDetails = {
  message?: string;
  errorId?: string;
  error?: Error;
  ownerId?: string;
  category?: string;
  url?: string;
  requestMethod?: string;
} & any;

export interface ILogger {
  info(details: ILogDetails): void;
  warn(details: ILogDetails): void;
  error(details: ILogDetails): void;
  debug(details: ILogDetails): void;
};

export class LogFactory {
  private static loggers: Map<string, ILogger> = new Map<string, ILogger>();
  public static LOG_LEVEL = parseInt(get('LOG_LEVEL'));

  public static getLogger(category:LogCategory): ILogger{
    if (!LogFactory.loggers[category]) {
      LogFactory.loggers[category] = new Logger(category, LogFactory.LOG_LEVEL);
    }

    return LogFactory.loggers[category];
  };
};

export class Logger implements ILogger{
  private category: LogCategory;

  public constructor(
    category: LogCategory,
    private level: Levels,
  ) {
    this.category = category;
  };

  public info(details: ILogDetails): void {
    this.output(details, Levels.info);
  };
  
  public warn(details: ILogDetails): void {
    this.output(details, Levels.warn);
  };
  
  public error(details: ILogDetails): void {
    this.output(details, Levels.error);
  };

  public debug(details: ILogDetails): void {
    this.output(details, Levels.debug);
  };

  private output(details: ILogDetails, outputLevel: Levels) {
    if (outputLevel <= this.level) {
      details.category = LogCategory[this.category];
      // eslint-disable-next-line no-console
      console.log(util.format("%j", details));
    }
  };
};