import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';

export const PLAYER_TOKEN_HEADER = 'X-Player-Token';

/**
 * Dokłada nagłówek X-Player-Token z sesji danego pokoju do żądań na ten pokój
 * (`{apiUrl}/rooms/{code}...`). Token z innego pokoju i tak dałby 401, więc go nie wysyłamy.
 */
@Injectable()
export class PlayerTokenInterceptor implements HttpInterceptor {

  constructor(private storageManager: StorageManagerService) { }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.headers.has(PLAYER_TOKEN_HEADER)) {
      return next.handle(req);
    }
    const url = req.url.toUpperCase();
    const session = this.storageManager.getRoomSessions().find(s => {
      const roomUrl = `${environment.apiUrl}/rooms/${encodeURIComponent(s.code)}`.toUpperCase();
      return url === roomUrl || url.startsWith(roomUrl + '/');
    });
    if (!session) {
      return next.handle(req);
    }
    return next.handle(req.clone({ setHeaders: { [PLAYER_TOKEN_HEADER]: session.playerToken } }));
  }
}
