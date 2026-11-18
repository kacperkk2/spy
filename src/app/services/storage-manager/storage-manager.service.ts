import { Injectable } from '@angular/core';
import { CONFIG } from 'src/app/app.properties';

/** Sesja gracza w pokoju (token z dołączenia / utworzenia). */
export interface RoomSession {
  code: string;
  playerId: string;
  playerToken: string;
  nick: string;
  /** Pokój założony przez tego gracza — może być tylko jeden. */
  isHost?: boolean;
}

/**
 * Sesje trzymane per pokój — wyjście z pokoju i wejście do innego nie gubi tokenu z poprzedniego
 * (serwer nie usuwa gracza, więc bez tokenu powrót kończyłby się NICK_TAKEN).
 * `current` to pokój, do którego prowadzi „Wróć do pokoju”.
 */
interface StoredRoomSessions {
  current: string | null;
  sessions: RoomSession[];
}

const MAX_ROOM_SESSIONS = 10;

@Injectable({
  providedIn: 'root'
})
export class StorageManagerService {

  private formKey: string = CONFIG.FORM_KEY;
  private roomSessionKey: string = CONFIG.ROOM_SESSION_KEY;
  private roomSessionsKey: string = CONFIG.ROOM_SESSIONS_KEY;
  private nickKey: string = CONFIG.NICK_KEY;

  constructor() { }

  public getForm() {
    const storageForm = localStorage.getItem(this.formKey);
    return storageForm == null ? null : JSON.parse(storageForm);
  }

  public saveForm(form: any) {
    return localStorage.setItem(this.formKey, JSON.stringify(form));
  }

  /** Bez kodu — sesja bieżącego pokoju; z kodem — sesja tego pokoju. */
  public getRoomSession(code?: string): RoomSession | null {
    const stored = this.readRoomSessions();
    const wanted = code != null ? normalize(code) : stored.current;
    return wanted ? stored.sessions.find(s => s.code === wanted) ?? null : null;
  }

  public getRoomSessions(): RoomSession[] {
    return this.readRoomSessions().sessions;
  }

  /** Sesja pokoju założonego przez gracza (o ile jeszcze ją mamy). */
  public getHostedSession(): RoomSession | null {
    return this.readRoomSessions().sessions.find(s => s.isHost) ?? null;
  }

  /**
   * Zapisuje sesję (kod normalizowany do wielkich liter) i ustawia jej pokój jako bieżący.
   * Nicku globalnego nie rusza — nick użyty w pokoju (np. zastępczy przy zajętym) nie nadpisuje ustawionego przez gracza.
   */
  public saveRoomSession(session: RoomSession) {
    const normalized: RoomSession = { ...session, code: normalize(session.code) };
    const stored = this.readRoomSessions();
    const sessions = [normalized, ...stored.sessions.filter(s => s.code !== normalized.code)].slice(0, MAX_ROOM_SESSIONS);
    this.writeRoomSessions({ current: normalized.code, sessions });
  }

  /** Ustawia pokój jako bieżący (o ile mamy do niego sesję). */
  public setCurrentRoom(code: string) {
    const stored = this.readRoomSessions();
    const wanted = normalize(code);
    if (stored.current !== wanted && stored.sessions.some(s => s.code === wanted)) {
      this.writeRoomSessions({ ...stored, current: wanted });
    }
  }

  /** Usuwa sesję danego pokoju. */
  public clearRoomSession(code: string) {
    const stored = this.readRoomSessions();
    const wanted = normalize(code);
    this.writeRoomSessions({
      current: stored.current === wanted ? null : stored.current,
      sessions: stored.sessions.filter(s => s.code !== wanted),
    });
  }

  /** Nick gracza — ustawiany raz, używany przy tworzeniu pokoju i dołączaniu. */
  public getNick(): string | null {
    const nick = localStorage.getItem(this.nickKey)?.trim();
    return nick ? nick : null;
  }

  public saveNick(nick: string) {
    localStorage.setItem(this.nickKey, nick);
  }

  private readRoomSessions(): StoredRoomSessions {
    const result: StoredRoomSessions = { current: null, sessions: [] };
    try {
      const raw = JSON.parse(localStorage.getItem(this.roomSessionsKey) ?? 'null') as Partial<StoredRoomSessions> | null;
      if (raw && Array.isArray(raw.sessions)) {
        result.sessions = raw.sessions.filter(isValidSession);
        result.current = typeof raw.current === 'string' && result.sessions.some(s => s.code === raw.current) ? raw.current : null;
      }
    } catch {
      // uszkodzony wpis — traktujemy jak brak sesji
    }
    // migracja ze starego formatu (jedna sesja)
    const legacy = localStorage.getItem(this.roomSessionKey);
    if (legacy != null) {
      localStorage.removeItem(this.roomSessionKey);
      try {
        const session = JSON.parse(legacy);
        if (isValidSession(session) && !result.sessions.some(s => s.code === session.code)) {
          result.sessions.unshift(session);
          result.current = session.code;
          this.writeRoomSessions(result);
        }
      } catch {
        // ignorujemy
      }
    }
    return result;
  }

  private writeRoomSessions(stored: StoredRoomSessions) {
    localStorage.setItem(this.roomSessionsKey, JSON.stringify(stored));
  }
}

function normalize(code: string): string {
  return code.trim().toUpperCase();
}

function isValidSession(session: any): session is RoomSession {
  return !!session && typeof session.code === 'string' && !!session.code && !!session.playerId
    && !!session.playerToken && session.nick != null;
}
