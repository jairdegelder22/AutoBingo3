# Releasevoorbereiding AutoBingo 1.3.3

## Klaargezet in de code

- Appversie 1.3.3 in Expo, npm en het native iOS-project.
- Het iOS-privacymanifest vermeldt Device ID en Product Interaction voor Analytics, gekoppeld aan een blijvend installatie-ID, zonder gebruik voor advertentietracking door deze meting.
- Dezelfde verklaringen staan in de Expo-configuratie zodat een latere prebuild ze behoudt.
- Offline activiteit, unieke actieve apparaten en lokale spelers per gestart spel worden gemeten. Zie [actieve-spelers.md](actieve-spelers.md).
- Het terugzetten van de klok naar wintertijd laat geen dag uit de lokale wachtrij vervallen.
- EAS gebruikt voor het productieprofiel al automatische verhoging van het remote buildnummer.

## App Store Connect vóór indienen

Maak een nieuwe iOS-versie **1.3.3** aan. Werk bij **App Privacy** de antwoorden bij op basis van de werkelijk verzamelde gegevens. Voor de nieuwe meting zijn dit Device ID en Product Interaction, met doel Analytics. Deze gegevens zijn gekoppeld aan het installatie-ID; geef ze niet op als volledig anoniem. De nieuwe meting gebruikt deze gegevens niet voor tracking volgens Apples definitie.

Dit is een aanvulling op de bestaande gegevensverzameling door accounts, lobby's, advertenties, aankopen en support. Controleer die bestaande antwoorden apart; ze worden niet automatisch gewijzigd door het privacymanifest. Controleer ook de privacyrapportage van de uiteindelijke Xcode-build en de meegeleverde SDK-manifests.

Bronnen: [Apple privacygegevens](https://developer.apple.com/app-store/app-privacy-details/), [Apple privacymanifest](https://developer.apple.com/documentation/technotes/tn3184-adding-data-collection-details-to-your-privacy-manifest), [Expo privacyconfiguratie](https://docs.expo.dev/guides/apple-privacy/).

## Privacyverklaring publiceren

Publiceer de bijgewerkte `docs/privacybeleid.html` via de ingestelde GitHub Pages-bron. Controleer de daadwerkelijk ingestelde branch/map onder GitHub → Settings → Pages. De app verwijst naar:

https://jairdegelder22.github.io/AutoBingo3/privacybeleid.html

Controleer op die pagina de datum 20 oktober 2026 en de tekst over gebruiksstatistieken en offline opslag. Samenvoegen naar een branch publiceert alleen als de Pages-instellingen die branch gebruiken.

## TestFlight-checklist op echte apparaten

Gebruik een productiebuild, geen ontwikkelbuild: ontwikkelbuilds versturen geen activiteit.

- [ ] Update een bestaande installatie; instellingen en premium blijven behouden.
- [ ] Open de app herhaaldelijk; één apparaat blijft één actief apparaat die dag.
- [ ] Start een offline spel met drie lokale spelers; de sessie heeft `local_player_count = 3`.
- [ ] Speel zonder internet, sluit de app, open later met internet; de oorspronkelijke dag en sessie komen alsnog binnen.
- [ ] Start twee spellen; er zijn twee apparaatsessies, zonder dubbeltelling bij opnieuw naar de voorgrond gaan.
- [ ] Speel online op twee apparaten; elk registreert alleen zijn eigen lokale spelers.
- [ ] Controleer online lobby, vinkjes, stoppen en opnieuw spelen.
- [ ] Controleer inloggen, premium herstellen en de privacylink.
- [ ] Controleer de Supabase-views `app_activity_summary`, `app_activity_daily` en `app_games_daily`.

## Build en publicatie

Maak na samenvoegen en controleren van de releasecode een iOS-build met het bestaande EAS-profiel `production`. Controleer in de buildgegevens versie 1.3.3 en een nieuw buildnummer. Upload naar App Store Connect en test via TestFlight. Dien vervolgens dezelfde goed geteste build in voor review. Bij een codecorrectie is een nieuwe build nodig.

De eerder besproken vermindering van lobby-polling is geen onderdeel van deze wijziging. Deze releasevoorbereiding verklaart de nieuwe statistiekfunctie; het is geen volledige audit van alle oudere wijzigingen op de ontwikkelbranch.

## Voorstel voor updatebeschrijving

Verbeteringen aan AutoBingo en de betrouwbaarheid van de app. We hebben de privacyverklaring bijgewerkt met informatie over gebruiksstatistieken.

Pas deze tekst vóór indienen aan als de release ook andere zichtbare functies toevoegt.
