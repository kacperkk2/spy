import { ValidatorFn, Validators } from '@angular/forms';
import { ApiError } from './room-api.models';

/** Kod pokoju: 5 znaków bez mylących 0/O/1/I/L (kontrakt: „Ustalenia produktowe”). */
export const ROOM_CODE_LENGTH = 5;
const ROOM_CODE_PATTERN = /^[A-HJKMNP-Z2-9]{5}$/;

export const NICK_MAX_LENGTH = 20;

export function normalizeRoomCode(code: string): string {
  return (code ?? '').trim().toUpperCase();
}

export function isValidRoomCode(code: string): boolean {
  return ROOM_CODE_PATTERN.test(normalizeRoomCode(code));
}

export const roomCodeValidator: ValidatorFn = control =>
  !control.value || isValidRoomCode(control.value) ? null : { roomCode: true };

/** Nick: 1–20 znaków po trim. */
export const nickValidators: ValidatorFn[] = [
  Validators.required,
  control => (control.value ?? '').trim().length === 0 ? { required: true } : null,
  control => (control.value ?? '').trim().length > NICK_MAX_LENGTH ? { maxlength: true } : null,
];

export function apiErrorMessage(error: ApiError): string {
  switch (error.code) {
    case 'ROOM_NOT_FOUND':
    case 'ROOM_CLOSED': return 'Pokój nie istnieje lub został zamknięty';
    case 'NICK_TAKEN': return 'Ten nick jest już zajęty';
    case 'UNAUTHORIZED': return 'Sesja w pokoju wygasła';
    case 'NOT_HOST': return 'Tylko twórca pokoju może to zrobić';
    case 'INVALID_STATE': return 'Ta akcja nie jest teraz możliwa';
    case 'NOT_ENOUGH_PLAYERS': return 'Potrzeba co najmniej 2 graczy';
    case 'VALIDATION': return error.message || 'Niepoprawne dane';
    case 'NETWORK': return 'Brak połączenia z serwerem';
    default: return 'Coś poszło nie tak';
  }
}
