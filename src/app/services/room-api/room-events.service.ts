import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiError, RevealDto, RoomStateDto } from './room-api.models';

export type RoomEvent =
  | { type: 'room-state'; data: RoomStateDto }
  | { type: 'round-started'; data: RoomStateDto }
  | { type: 'round-revealed'; data: RevealDto }
  | { type: 'room-closed'; data: {} };

const EVENT_TYPES: RoomEvent['type'][] = ['room-state', 'round-started', 'round-revealed', 'room-closed'];

/**
 * - `connecting` — pierwsze łączenie albo ponowne łączenie po zerwaniu (EventSource robi to sam),
 * - `open` — strumień działa,
 * - `closed` — brak aktywnego strumienia.
 */
export type ConnectionStatus = 'connecting' | 'open' | 'closed';

/**
 * Strumień zdarzeń SSE pokoju (kontrakt: sekcja „Zdarzenia SSE”).
 * Zakładamy jedno aktywne połączenie naraz — jego stan jest w `status$`.
 */
@Injectable({
  providedIn: 'root'
})
export class RoomEventsService {

  private readonly statusSubject = new BehaviorSubject<ConnectionStatus>('closed');
  readonly status$ = this.statusSubject.asObservable();

  constructor(private zone: NgZone) { }

  /**
   * Zimny Observable: każda subskrypcja otwiera własny EventSource, odsubskrybowanie go zamyka.
   * Kończy się po `room-closed`. Kończy się błędem (ApiError), gdy przeglądarka zrezygnuje
   * z ponownego łączenia — np. serwer odpowiedział 401/404 (EventSource nie podaje statusu,
   * więc przyczynę trzeba ustalić przez REST, np. getState).
   */
  events(code: string, token: string): Observable<RoomEvent> {
    const url = `${environment.apiUrl}/rooms/${encodeURIComponent(code.trim().toUpperCase())}`
      + `/events?token=${encodeURIComponent(token)}`;

    return new Observable<RoomEvent>(subscriber => {
      this.setStatus('connecting');
      const es = new EventSource(url);

      es.onopen = () => this.setStatus('open');

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          // przeglądarka nie będzie już ponawiać
          this.setStatus('closed');
          const error: ApiError = { code: 'UNKNOWN', status: -1, message: 'Strumień zdarzeń został zamknięty' };
          this.zone.run(() => subscriber.error(error));
        } else {
          // CONNECTING — EventSource ponawia sam
          this.setStatus('connecting');
        }
      };

      EVENT_TYPES.forEach(type => {
        es.addEventListener(type, (e: MessageEvent) => {
          let data: any;
          try {
            data = e.data ? JSON.parse(e.data) : {};
          } catch {
            console.error(`Niepoprawne dane zdarzenia ${type}`, e.data);
            return;
          }
          this.zone.run(() => {
            subscriber.next({ type, data } as RoomEvent);
            if (type === 'room-closed') {
              subscriber.complete();
            }
          });
        });
      });

      return () => {
        es.close();
        this.setStatus('closed');
      };
    });
  }

  private setStatus(status: ConnectionStatus) {
    if (this.statusSubject.value !== status) {
      this.zone.run(() => this.statusSubject.next(status));
    }
  }
}
