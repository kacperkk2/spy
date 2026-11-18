# 02 — Model domeny w pamięci

**Zależy od:** 01. Kontrakt: `00-kontrakt-api.md`.

## Zakres
- `Room { code, status, players (lista w kolejności dołączenia), hostPlayerId, roundNumber, currentRound?, lastActivityAt }`.
- `Player { id, nick, token, joinedAt }`.
- `Round { number, phrase, category, showCategory, spyPlayerIds, startingPlayerId, participantIds }`.
- `RoomRepository`: `ConcurrentHashMap<String, Room>`. Modyfikacje pokoju synchronizowane per pokój (np. `synchronized(room)` albo lock), bo SSE i REST działają współbieżnie.
- Generator kodu: 5 znaków z alfabetu `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (bez `0/O/1/I/L`), z ponawianiem przy kolizji.
- Generator tokenu: `SecureRandom`, 32 bajty, base64url.
- Indeks token → (code, playerId) albo wyszukiwanie w pokoju.
- Każda operacja aktualizuje `lastActivityAt`.

## Kryteria akceptacji
- Testy jednostkowe: generator kodów nie używa zakazanych znaków, kolizja kodu jest obsłużona.
