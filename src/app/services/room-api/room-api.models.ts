// Modele z kontraktu API: todo-backend/00-kontrakt-api.md

export type RoomStatus = 'LOBBY' | 'IN_ROUND' | 'REVEALED' | 'CLOSED';

export interface PlayerDto {
  id: string;
  nick: string;
  isHost: boolean;
}

/** Publiczny stan pokoju, bez tajnych danych. */
export interface RoomStateDto {
  code: string;
  status: RoomStatus;
  /** W kolejności dołączenia. */
  players: PlayerDto[];
  /** 0 = żadnej rundy jeszcze nie było. */
  roundNumber: number;
  /** W IN_ROUND i REVEALED, inaczej null. */
  startingPlayerId: string | null;
}

/** Publiczne podsumowanie pokoju na liście (ekran główny). */
export interface RoomSummaryDto {
  code: string;
  hostNick: string;
  playersCount: number;
  status: Exclude<RoomStatus, 'CLOSED'>;
}

export interface RoomListDto {
  /** Od ostatnio aktywnego, najwyżej `limit`. */
  rooms: RoomSummaryDto[];
  /** Liczba wszystkich otwartych pokoi (może być większa niż rooms.length). */
  total: number;
}

export interface CreateRoomResponse {
  code: string;
  playerId: string;
  playerToken: string;
}

export interface JoinRoomResponse {
  playerId: string;
  playerToken: string;
}

/** Rola tylko dla właściciela tokenu. */
export interface MyRoleDto {
  playerId: string;
  /** false = brak rundy albo gracz dołączył w trakcie. */
  participating: boolean;
  isSpy: boolean;
  /** null, jeśli szpieg albo !participating. */
  phrase: string | null;
  /** Tylko gdy participating && showCategory. */
  category: string | null;
  isStarting: boolean;
}

export interface StartRoundRequest {
  phrase: string;
  category: string;
  showCategory: boolean;
  /** Może być pusta (0 szpiegów). */
  spyPlayerIds: string[];
  startingPlayerId: string;
}

export interface RevealDto {
  roundNumber: number;
  phrase: string;
  category: string;
  spyPlayerIds: string[];
}

export type ErrorCode = 'ROOM_NOT_FOUND' | 'ROOM_CLOSED' | 'NICK_TAKEN' | 'UNAUTHORIZED'
  | 'NOT_HOST' | 'INVALID_STATE' | 'VALIDATION' | 'NOT_ENOUGH_PLAYERS';

export interface ErrorDto {
  error: ErrorCode;
  message?: string;
}

/**
 * Błąd zwracany przez RoomApiService. Poza kodami z kontraktu:
 * NETWORK — brak połączenia / CORS (status 0), UNKNOWN — odpowiedź bez ErrorDto.
 */
export interface ApiError {
  code: ErrorCode | 'NETWORK' | 'UNKNOWN';
  status: number;
  message?: string;
}
