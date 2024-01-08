import { v4 as uuid } from 'uuid';

const chars = `1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM?!@#$%^&*'`;

export const anyId = () => uuid();

export const anyInt = ({
  min=0,
  max=Number.MAX_SAFE_INTEGER,
} : {
  min?: number,
  max?: number,
}={}) => {
  return Math.floor(Math.random() * (max - min) + min);
};

export const anyAlphaNumeric = (min: number = 1, max: number = 15) => {
  const delta = Math.abs((max + 1) - min);
  if (delta === 0) return "";

  return Array(delta).fill(0, 0, delta).map(() => {
    const n = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    return chars[n % chars.length];
  }).join('');
};

export const anyEmail = () => {
  const username = anyAlphaNumeric();
  return `${username}@bublr.com`;
};

export const anyPassword = () => {

};

export const anyArrayOfStrings = (n: number = 5) => Array.from({ length: n }, _ => anyAlphaNumeric())

export const manyOf = <A>(length: number, init: () => A) =>
  Array.from({ length }, () => init());