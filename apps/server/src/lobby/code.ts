const LOBBY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LOBBY_CODE_LENGTH = 6;
const MAX_CODE_GENERATION_ATTEMPTS = 128;

export type LobbyCodeExists = (code: string) => boolean;

export function generateLobbyCode(
  hasCode: LobbyCodeExists,
  random: () => number = Math.random,
): string {
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    let code = '';

    for (let index = 0; index < LOBBY_CODE_LENGTH; index += 1) {
      const characterIndex = Math.floor(random() * LOBBY_CODE_ALPHABET.length);
      code += LOBBY_CODE_ALPHABET[characterIndex];
    }

    if (!hasCode(code)) {
      return code;
    }
  }

  throw new Error('Unable to generate a unique lobby code');
}
