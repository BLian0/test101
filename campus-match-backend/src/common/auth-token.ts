const PREFIX = 'dev-access-token';

export function buildAccessToken(userId: number) {
  return `${PREFIX}:${userId}`;
}

export function parseAccessToken(token: string | null | undefined) {
  if (!token) return null;
  if (!token.startsWith(`${PREFIX}:`)) return null;

  const userId = Number(token.slice(`${PREFIX}:`.length));
  if (!Number.isInteger(userId) || userId <= 0) return null;

  return userId;
}
