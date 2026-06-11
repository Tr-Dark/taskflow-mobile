# Alternatywne uruchomienie aplikacji przez APK

Alternatywną metodą uruchomienia aplikacji jest skorzystanie z gotowego pliku `APK`, przygotowanego dla systemu Android. Rozwiązanie to pozwala na sprawdzenie działania programu bez konieczności lokalnego uruchamiania projektu przez `npm` i `Expo`.

## Link do builda

[Pobierz APK z Expo EAS Build](https://expo.dev/accounts/tr-dark/projects/taskflow-mobile/builds/8aadd85d-e972-4730-b12d-4c78afaa0a47)

## Jak uruchomić aplikację

1. Otwórz link na telefonie lub komputerze.
2. Pobierz plik `APK`.
3. Przenieś plik na telefon, jeśli pobierałeś go na komputerze.
4. Otwórz plik `APK` na telefonie.
5. Jeśli Android pokaże komunikat o instalacji z nieznanego źródła, zezwól jednorazowo na instalację.
6. Zainstaluj aplikację i uruchom ją jak zwykły program na Androidzie.

## Czy ten plik jest bezpieczny?

Tak, ten `APK` został zbudowany z projektu `TaskFlow` w usłudze `Expo EAS Build`.

W praktyce oznacza to, że:

- build pochodzi z mojego własnego projektu `Expo`
- aplikacja została wygenerowana na podstawie kodu źródłowego z repozytorium projektu
- aplikacja nie wymaga backendu do podstawowego działania
- dane użytkownika są zapisywane lokalnie na urządzeniu

## Kiedy warto użyć tej opcji

Ta opcja jest najlepsza, gdy chcesz:

- szybko sprawdzić działanie aplikacji
- poklikać interfejs na telefonie
- przetestować wersję bardziej zbliżoną do normalnej aplikacji Android

## Uwaga

Najwygodniej testować ten `APK` na telefonie z Androidem.  
Wersja `APK` nie jest potrzebna do uruchamiania w przeglądarce ani przez `Expo Go`.
