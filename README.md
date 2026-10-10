# Promki Gier

Porównywarka promocji na gry. W 100% statyczna aplikacja (React + Vite + Tailwind CSS + Lucide), bez backendu. Działa na GitHub Pages i Vercel.

**Strona:** https://growekk.github.io/promki-gier/

## Co potrafi

- **Wyszukiwarka z podpowiedziami na żywo** (skrót `/`), historia ostatnich wyszukiwań.
- **Filtry:** platforma (Steam, Epic, GOG, PlayStation, Xbox, Switch), typ oferty (oficjalny / marketplace / konto), podwójny suwak ceny, minimalny rabat, tylko AAA, ukrywanie kont.
- **Widok gry:** tabela ofert od najtańszej, poziom zaufania sklepu, odznaka *All-Time Low*, skala „teraz vs rekord vs cena katalogowa”, kalkulator oszczędności względem Steam.
- **Linki do ~30 stron bez API:** Eneba, G2A, Kinguin, Instant Gaming, Gamivo, Allegro, rynki kont (z ostrzeżeniem), PS Store, Xbox, eShop, porównywarki.
- **Rozdawane za darmo:** aktualne darmówki z Epic, Steam i GOG.
- **Ulubione i alerty cenowe** zapisywane w przeglądarce (localStorage), sprawdzane przy otwarciu strony i co 30 minut, z powiadomieniem systemowym.
- **Waluty:** PLN / EUR / USD po kursie EBC.
- **Tryb offline:** gdy API nie odpowiada, aplikacja pokazuje zapisaną migawkę prawdziwych danych z banerem i datą.

## Skąd są dane

| Dane | Źródło | Klucz API |
|---|---|---|
| Ceny w ~15 sklepach PC, najniższa cena w historii | [CheapShark](https://apidocs.cheapshark.com/) | nie |
| Darmowe gry | [GamerPower](https://www.gamerpower.com/api-read) | nie |
| Kursy walut | [Frankfurter](https://frankfurter.dev) (EBC) | nie |

Marketplace'y (G2A, Eneba, Kinguin…) i rynki kont nie mają publicznego API, więc aplikacja **nie pokazuje ich cen**. Daje linki, które otwierają wyszukiwanie danej gry u nich. Nie ma tu zmyślonych cen.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

`npm run snapshot` odświeża migawkę offline (`src/data/snapshot.json`).

## Publikacja na GitHub Pages w 3 krokach

1. **Utwórz repozytorium i wypchnij kod**
   ```bash
   git init && git add . && git commit -m "Pierwsza wersja"
   gh repo create promki-gier --public --source . --push
   ```
2. **Włącz Pages z GitHub Actions**: Settings → Pages → Source: **GitHub Actions**
   (albo `gh api repos/<login>/promki-gier/pages -X POST -f build_type=workflow`).
3. **Gotowe.** Workflow `.github/workflows/deploy.yml` buduje i publikuje stronę przy każdym `git push`.
   Adres: `https://<login>.github.io/promki-gier/`.

Alternatywa bez Actions: `npm run build && npm run deploy` (pakiet `gh-pages` publikuje folder `dist` na gałąź `gh-pages`).
