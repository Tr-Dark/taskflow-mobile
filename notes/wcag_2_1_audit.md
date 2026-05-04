# TaskFlow WCAG 2.1 Audit

## Zakres
- Audit dotyczy obecnej wersji aplikacji mobilnej `TaskFlow`.
- To jest przegląd techniczny z poziomu kodu i architektury UI.
- Nie zastępuje pełnego testu manualnego na urządzeniu.

## Co już spełniamy
- `Perceivable`
  - aplikacja ma tryb jasny i ciemny
  - tekst można powiększyć przez ustawienia `small / medium / large`
  - wiele stanów wyboru ma dodatkową ikonę `check`, więc nie opierają się tylko na kolorze
- `Operable`
  - główne przyciski i chippy mają większe pola dotyku
  - modalne selektory można zamknąć kliknięciem poza arkuszem
  - poprawiono `safe area` i zachowanie przy klawiaturze
- `Understandable`
  - ustawienia mają jaśniejsze opisy
  - podstawowe przepływy mają prostsze etykiety i komunikaty
  - dodano lokalizację `pl / en / uk` dla kluczowych ekranów
- `Robust`
  - komponenty interaktywne dostały `accessibilityRole="button"`
  - powiadomienia mają fallback dla `Expo Go`, więc zachowanie jest przewidywalne

## Co trzeba jeszcze sprawdzić ręcznie
- Kontrast wszystkich tekstów w trybie ciemnym.
- Zachowanie ekranów z długą treścią przy `fontSize = large`.
- Czy wszystkie mniej używane ekrany są już w pełni zlokalizowane.
- Czy screen reader na Androidzie czyta kolejność elementów tak, jak oczekujemy.

## Otwarte ryzyka
- Część starszych ekranów nadal może zawierać teksty hardcoded po polsku.
- Nie wszystkie komunikaty toast / notification są jeszcze spięte z systemem tłumaczeń.
- Pełne testy `expo-notifications` wymagają development build, nie `Expo Go`.
