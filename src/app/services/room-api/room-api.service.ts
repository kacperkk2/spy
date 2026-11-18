import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ApiError,
  CreateRoomResponse,
  ErrorDto,
  JoinRoomResponse,
  MyRoleDto,
  RevealDto,
  RoomListDto,
  RoomStateDto,
  StartRoundRequest,
} from './room-api.models';

/**
 * Klient REST pokoi (kontrakt: todo-backend/00-kontrakt-api.md).
 * Token gracza dokłada PlayerTokenInterceptor z sesji pokoju (StorageManagerService),
 * więc przed wywołaniem metod „gracza pokoju” trzeba zapisać sesję (saveRoomSession).
 * Błędy są mapowane na ApiError.
 */
@Injectable({
  providedIn: 'root'
})
export class RoomApiService {

  private readonly baseUrl = `${environment.apiUrl}/rooms`;

  constructor(private http: HttpClient) { }

  /** Publiczna lista otwartych pokoi (bez tokenu). */
  listRooms(limit: number): Observable<RoomListDto> {
    return this.handle(this.http.get<RoomListDto>(this.baseUrl, { params: { limit } }));
  }

  createRoom(nick: string): Observable<CreateRoomResponse> {
    return this.handle(this.http.post<CreateRoomResponse>(this.baseUrl, { nick }));
  }

  joinRoom(code: string, nick: string): Observable<JoinRoomResponse> {
    return this.handle(this.http.post<JoinRoomResponse>(`${this.roomUrl(code)}/players`, { nick }));
  }

  getState(code: string): Observable<RoomStateDto> {
    return this.handle(this.http.get<RoomStateDto>(this.roomUrl(code)));
  }

  getMe(code: string): Observable<MyRoleDto> {
    return this.handle(this.http.get<MyRoleDto>(`${this.roomUrl(code)}/me`));
  }

  getReveal(code: string): Observable<RevealDto> {
    return this.handle(this.http.get<RevealDto>(`${this.roomUrl(code)}/reveal`));
  }

  startRound(code: string, req: StartRoundRequest): Observable<RoomStateDto> {
    return this.handle(this.http.post<RoomStateDto>(`${this.roomUrl(code)}/rounds`, req));
  }

  reveal(code: string): Observable<RevealDto> {
    return this.handle(this.http.post<RevealDto>(`${this.roomUrl(code)}/rounds/current/reveal`, null));
  }

  closeRoom(code: string): Observable<void> {
    return this.handle(this.http.delete<void>(this.roomUrl(code)));
  }

  private roomUrl(code: string): string {
    return `${this.baseUrl}/${encodeURIComponent(code.trim().toUpperCase())}`;
  }

  private handle<T>(request: Observable<T>): Observable<T> {
    return request.pipe(catchError((err: unknown) => throwError(() => toApiError(err))));
  }
}

export function toApiError(err: unknown): ApiError {
  if (!(err instanceof HttpErrorResponse)) {
    return { code: 'UNKNOWN', status: -1, message: String(err) };
  }
  if (err.status === 0) {
    return { code: 'NETWORK', status: 0, message: err.message };
  }
  const body = err.error as Partial<ErrorDto> | null;
  if (body && typeof body === 'object' && typeof body.error === 'string') {
    return { code: body.error, status: err.status, message: body.message };
  }
  return { code: 'UNKNOWN', status: err.status, message: err.message };
}
