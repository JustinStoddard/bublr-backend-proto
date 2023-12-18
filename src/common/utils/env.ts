import dotenv from 'dotenv';

dotenv.config();

export class ConfigurationError extends Error {
  constructor(key: string, issue: string) {
    super(`${key}: ${issue}`);
  }
}

export class ConfigurationMissingError extends ConfigurationError {
  constructor(key: string) {
    super(key, 'missing');
  }
}

const tryGet = (key: string) => {
  const value = process.env[key]?.trim();
  if (value === undefined || value.length === 0) {
    return null;
  }

  return value;
}

export const get = (key: string, defaultArg?: string) => {
  const value = tryGet(key);
  if (value === null) {
    if (defaultArg !== undefined) return defaultArg;
    throw new ConfigurationMissingError(key);
  }

  return value;
}