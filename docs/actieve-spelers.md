# Actieve spelers bekijken

Open het AutoBingo-project in Supabase → **Table Editor** en kies een van deze views.
Als de Table Editor de view niet toont, open **SQL Editor** en voer uit:

```sql
select * from public.app_activity_summary;
select * from public.app_activity_daily;
select * from public.app_games_daily;
```

- `app_activity_summary`: unieke apparaten vandaag, de laatste 7 dagen en de laatste 30 dagen, inclusief vandaag. `active_devices` betekent app geopend; `playing_devices` betekent een echt spel geopend. Online/offline apparaten worden apart geteld en kunnen overlappen.
- `app_activity_daily`: dezelfde cijfers per kalenderdag, inclusief dagen zonder activiteit, over de laatste 90 dagen.
- `app_games_daily`: gestarte spelsessies per apparaat en het aantal deelnames van lokale spelers. Twee spelers die drie spellen spelen zijn zes `player_participations`, geen zes unieke mensen. Een online lobby op drie apparaten levert drie apparaatsessies op.
- `app_game_sessions`: elke apparaatsessie met `local_player_count` en `mode`, voor het aantal spelers per spel op dat apparaat.
- `estimated_player_places`: per apparaat het hoogste lokale spelersaantal in de periode, opgeteld over apparaten. Dit is een schatting van spelersplekken; geen telling van unieke personen.

Een apparaat wordt binnen een periode één keer geteld. Herinstallatie of wissen van appdata kan een nieuw installatie-ID opleveren; dezelfde persoon op twee apparaten telt twee keer. Er worden geen namen, e-mailadressen, lobbycodes of account-ID's naar deze statistiektabellen gestuurd.

De daggrens is Europe/Amsterdam, ook voor apparaten elders. Een app die openblijft na middernacht wordt binnen vijf minuten op de nieuwe dag geregistreerd. Spelsessies worden toegeschreven aan hun startdag. Tutorials en ontwikkelbuilds worden niet als spellen geregistreerd; ontwikkelbuilds sturen helemaal geen activiteit.

Zonder internet bewaart de app maximaal 90 dagen activiteit lokaal. Bij openen, terugkeer naar de voorgrond en elke vijf minuten in de voorgrond probeert hij achterstallige activiteit te versturen. Reeds bevestigde, ongewijzigde activiteit veroorzaakt geen nieuwe requests. Gewoonlijk zijn er één request bij de eerste opening en één bij het starten van een spel; elk volgend spel veroorzaakt ook een request. Bij de limiet van 250 spelsessies per apparaat per dag blijft de dagtelling werken, maar worden verdere spelsessies die dag niet opgeslagen.

## Ingebruikname

De database-inrichting staat in `supabase_active_usage.sql`. De statistieken beginnen zodra gebruikers een appversie met deze meting installeren. Bestaande installaties krijgen geen verzonnen gebruikshistorie; oude `last_seen_at`-waarden worden niet overgenomen. Volledig offline gebruik verschijnt pas nadat de app opnieuw geopend wordt met internet. De app moet daarvoor nog lokaal over die gegevens beschikken.

Deze views en tabellen zijn alleen voor beheerders/service-role toegankelijk. De publieke RPC kan alleen begrensde activiteit indienen en geeft geen gegevens terug. De installatie-ID is door de app aangeleverd, dus de cijfers zijn gebruiksstatistieken en geen geverifieerde personenregistratie. De privacyverklaring in `docs/privacybeleid.html` beschrijft de toegevoegde meting en moet met de appversie worden gepubliceerd.
