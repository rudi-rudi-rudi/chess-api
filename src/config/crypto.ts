import crypto from 'node:crypto';

export const randomId = () => crypto.randomUUID();
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
