// 从 assets/_script/Logger.js 转换

export enum LoggerLevel {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  ALL = 5
}

 export const LOG_PREFIX = "[ZS]";
let _level: LoggerLevel = LoggerLevel.OFF;

export class Logger {
  static setLoggerLevel(level: LoggerLevel): void {
    _level = level;
  }

  static baseLog(method: "log" | "debug" | "info" | "warn" | "error", minLevel: LoggerLevel, args: any[]): void {
    if (_level >= minLevel || (method === "log" && _level === LoggerLevel.ALL)) {
      // 使用 apply 保持与原 JS 行为一致
      (console as any)[method].apply(console, [LOG_PREFIX].concat(args));
    }
  }

  static log(...args: any[]): void {
    // 仅在 ALL 级别下打印普通 log（兼容原逻辑）
    if (_level === LoggerLevel.ALL) {
      Logger.baseLog("log", LoggerLevel.ALL, args);
    }
  }

  static debug(...args: any[]): void {
    Logger.baseLog("debug", LoggerLevel.DEBUG, args);
  }

  static info(...args: any[]): void {
    Logger.baseLog("info", LoggerLevel.INFO, args);
  }

  static warn(...args: any[]): void {
    Logger.baseLog("warn", LoggerLevel.WARN, args);
  }

  static error(...args: any[]): void {
    Logger.baseLog("error", LoggerLevel.ERROR, args);
  }

  // 简写别名，兼容旧接口
  static  v = (...args: any[]): void => {
    Logger.log.apply(undefined, args as any);
  };

  static  d = (...args: any[]): void => {
    Logger.debug.apply(undefined, args as any);
  };

  static  i = (...args: any[]): void => {
    Logger.info.apply(undefined, args as any);
  };

  static  w = (...args: any[]): void => {
    Logger.warn.apply(undefined, args as any);
  };

  static  e = (...args: any[]): void => {
    Logger.error.apply(undefined, args as any);
  };

  // 预留的实时日志相关接口，先保持空实现以兼容调用
  static  realtimeDebug  (){};
  static  realtimeInfo  (){};
  static  realtimeWarn (){};
  static  realtimeError  (){};
  static  setRealtimeFilterMsg  (){};
  static  addRealtimeFilterMsg  (){};
}


