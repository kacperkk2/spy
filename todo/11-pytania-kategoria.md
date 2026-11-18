# 11 — Pytania: przekazywanie kategorii

**Niezależne od backendu** (część dotycząca pokoju zależy od 09).

## Problem
`GameComponent.goToQuestions()` nawiguje do `/questions/` + `settings.category`. Gdy „Pokazuj kategorię graczom” jest wyłączone, `category` ma wartość `null`, więc trasa to `/questions/null`. `QuestionsComponent` ustawia kategorię `['null']`, która nie pasuje do żadnej z `CONFIG.CATEGORIES`, i pytanie wychodzi `undefined`.

## Zmiana
- `GameComponent.goToQuestions()`: przy `category == null` nawigować do `/questions` bez parametru.
- `QuestionsComponent`: ignorować parametr spoza `CONFIG.CATEGORIES` i nie losować pytania z pustej listy (ewentualnie pokazać „Wybierz kategorię”).
- W pokoju (task 09): przycisk „?” prowadzi do `/questions/{category}`, gdy `MyRoleDto.category` jest znana, a w przeciwnym razie do `/questions`. Powrót (`location.back()`) wraca do `/room/{code}`.

## Weryfikacja
Gra offline z wyłączonym „Pokazuj kategorię”: „?” otwiera pytania bez błędu i bez `undefined`.
