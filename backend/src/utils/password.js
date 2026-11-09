import bcrypt from 'bcryptjs';

export const PASSWORD_SALT_ROUNDS = 12;

export function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
