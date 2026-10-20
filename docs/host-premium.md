# Premiumhosts zonder verplicht inloggen

## Gedrag

De host heeft premium nodig. Deelnemers kunnen gratis en zonder account aansluiten.
Een host zonder accountsessie krijgt automatisch een technische Supabase-sessie.
Die sessie wordt niet als ingelogd account getoond. Vrijwillig inloggen blijft werken.

De app koppelt aankopen aan de geverifieerde sessie via de bestaande RevenueCat-ID
`account-<Supabase user ID>`. Bij het overstappen van een installatie-ID worden
bestaande winkelaankopen gesynchroniseerd. De server vertrouwt geen premiumboolean
of gebruikers-ID uit de aanvraag: hij controleert de bearer token bij Supabase Auth
en vraagt zelf de RevenueCat-status op.

Bestaande premiumcodes worden op de server met een hash gecontroleerd.
Een huidig lokaal code-unlock moet na de update eenmalig opnieuw worden ingevoerd.
Alleen codes met het effect premium tellen mee; een code voor alleen skins niet.
De code `AUTOBINGO-TEST-SKINS-2026` telt mee.
Het uitzetten van code-premium trekt de bijbehorende servergrant in. Offline
wordt de intrekking bewaard en vóór de volgende hostverificatie uitgevoerd.

## Reeds uitgevoerd in Supabase

- Automatische apparaatsessies zijn door de eigenaar ingeschakeld en live getest.
- Migratie `prepare_verified_host_premium_grants`.
- Migratie `allow_verified_premium_hosts_and_free_account_guests`.
- Edge Function `verify-host-premium`, versie 2.
- RLS blijft ingeschakeld. Nieuwe authenticated INSERTs in lobbies vereisen een
  bevestigde premiumgrant en host_user_id gelijk aan auth.uid().
- Deelnemers hebben geen premiumgrant nodig. Zij wijzigen bij het deelnemen
  geen lobbyinstellingen.
- De Edge Function valideert zelf elk token via /auth/v1/user. Daarom staat de
  oude gatewaycheck uit; die ondersteunt de ES256-sessies van dit project niet.
- RevenueCat API v1 accepteert de bestaande publieke SDK-sleutel voor het uitlezen
  van klantstatus. Dit is live gecontroleerd. Er is geen extra geheime sleutel nodig.
  Een optionele serveroverride heet REVENUECAT_API_KEY.

De serverfunctie sluit bij verbindingsfouten of ongeldige antwoorden de toegang af.
RevenueCat-grants voor het aanmaken van nieuwe lobby's zijn maximaal tien minuten
geldig sinds verificatie; codegrants blijven geldig totdat ze worden ingetrokken.
Bestaande lobby's kunnen door hun eigenaar worden bijgewerkt en verwijderd.

## Belangrijke compatibiliteitsfase

De oude anon-policies zijn nog aanwezig voor reeds uitgebrachte appversies.
Daarom is de oude openbare aanmaakroute nog niet servermatig afgesloten.
Nieuwe apparaatsessies gebruiken authenticated en krijgen alleen met een bevestigde
premiumgrant aanmaakrechten. Dit is geen volledige beveiliging van de oude API.

Sluit de oude aanmaakroute pas af bij de uitrol van de aangepaste app, met een
afgesproken updatepad voor oudere premiumgebruikers. Deze stap is nog NIET uitgevoerd:

```sql
drop policy "anon can insert lobbies" on public.lobbies;
drop policy "anon can update lobbies" on public.lobbies;
alter policy "anon can insert lobby_players" on public.lobby_players
  with check (role <> 'host');
alter policy "anon can update lobby_players" on public.lobby_players
  using (role <> 'host') with check (role <> 'host');
alter policy "anon can delete lobby_players" on public.lobby_players
  using (role <> 'host');
```

Voor deze omschakeling: nieuwe TestFlight-build testen met winkelpremium,
code-premium en een gratis deelnemer. De nieuwe app moet beschikbaar zijn voordat
de oude gast-hostroute wordt afgesloten. De bestaande gedeelde lobby- en
bordtoegang is niet omgebouwd tot een volledig afgeschermd lidmaatschapsmodel.

## Verificatie

```sh
node scripts/test-host-premium.mjs
node --experimental-vm-modules scripts/test-host-lobby-service.mjs
```

Geslaagd: servervalidatie van identiteit, verlopen/lifetime/grace-aankopen,
codecontrole, ingetrokken codegrant, vervalste premiumstatus, gelijktijdige
controle, apparaten zonder account, bestaande accounts, eigenaarschap en gratis deelname.

Live API-test met twee tijdelijke apparaten:
premiumhost aanmaken 201; gratis authenticated host 403; hostspeler 201;
gratis authenticated deelnemer 201; deelnemer zonder account 201;
vervalste hostrol 403; spel starten 200; bord bijwerken 201; lobby verwijderen 204.
De testlobby en actieve testgrants zijn opgeruimd. Eén tijdelijk technisch
Auth-testrecord bleef achter door herhaalde API-fouten bij verwijderen; het heeft
geen actieve premiumgrant. De lokale opruimreferentie staat in
`/private/tmp/autobingo-host-integration-test.json`.

Nog vereist: echte winkelaankoop en herstel via TestFlight, gevolgd door
de compatibiliteitsomschakeling. De huidige geïnstalleerde build bevat de
nieuwe clientcode nog niet. Versie kan 1.3.3 blijven; EAS verhoogt het buildnummer.

De volledige lokale Expo/Babel-controle wordt gehinderd door een defect lokaal
gensync-pakket. Syntax is apart gecontroleerd met een bestaande parser.
Daarnaast meldt Git fouten bij het lezen van lokale packbestanden; deze wijziging
herstelt de repository en de eerder aangetroffen bestandskopieën niet.
De gerichte whitespacecontrole voor de aangepaste bestanden is wel geslaagd.

De databaseadviseur vermeldt bestaande aandachtspunten, onder andere een
[wijzigbaar search_path van set_updated_at](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
en de bestaande
[gedeelde GraphQL-zichtbaarheid van tabellen](https://supabase.com/docs/guides/database/database-linter?lint=0026_pg_graphql_anon_table_exposed).
Deze releasewijziging is geen volledige databasebeveiligingsaudit.
De adviseur noemt ook de ingeschakelde anonieme Auth-sessies: toegang tot eigen
accountrecords blijft via auth.uid() beperkt; lobby-aanmaak vereist daarnaast
een serverbevestigde premiumgrant. Dit gebruik van technische sessies is bewust.

## Toegepaste SQL ter referentie

### Voorbereiding

```sql
alter table public.account_entitlements add column if not exists host_verified_at timestamptz;
create or replace function public.can_host_lobby()
returns boolean language sql stable security invoker set search_path = '' as $$
select auth.uid() is not null and exists (
  select 1 from public.account_entitlements e
  where e.user_id = auth.uid() and e.active
    and (e.expires_at is null or e.expires_at > now())
    and (
      (e.entitlement_id = 'premium_host_code' and e.source = 'unlock_code')
      or (e.entitlement_id = 'premium' and e.source = 'revenuecat'
        and e.host_verified_at > now() - interval '10 minutes')
    )
);
$$;
revoke all on function public.can_host_lobby() from public;
grant execute on function public.can_host_lobby() to anon, authenticated;
```

### Toegang voor bevestigde hosts en gratis deelnemers

```sql
alter table public.lobbies alter column host_user_id set default auth.uid();
create policy "verified premium hosts can create lobbies" on public.lobbies for insert to authenticated
with check (host_user_id = (select auth.uid()) and (select public.can_host_lobby()));
create policy "account hosts can update own lobbies" on public.lobbies for update to authenticated
using (host_user_id = (select auth.uid())) with check (host_user_id = (select auth.uid()));
create policy "account hosts can delete own lobbies" on public.lobbies for delete to authenticated
using (host_user_id = (select auth.uid()));
create policy "account players can read shared lobbies" on public.lobbies for select to authenticated using (true);
create policy "account players can read shared lobby players" on public.lobby_players for select to authenticated using (true);
create policy "account players can join shared lobbies" on public.lobby_players for insert to authenticated
with check (exists (select 1 from public.lobbies l where l.id=lobby_id and (role <> 'host' or l.host_user_id=(select auth.uid()))));
create policy "account players can update guest or owned host players" on public.lobby_players for update to authenticated
using (role <> 'host' or exists (select 1 from public.lobbies l where l.id=lobby_id and l.host_user_id=(select auth.uid())))
with check (role <> 'host' or exists (select 1 from public.lobbies l where l.id=lobby_id and l.host_user_id=(select auth.uid())));
create policy "account players can remove guest or owned host players" on public.lobby_players for delete to authenticated
using (role <> 'host' or exists (select 1 from public.lobbies l where l.id=lobby_id and l.host_user_id=(select auth.uid())));
create policy "account players can read shared boards" on public.lobby_board_cells for select to authenticated using (true);
create policy "account players can write shared boards" on public.lobby_board_cells for insert to authenticated
with check (exists (select 1 from public.lobbies l where l.id=lobby_id));
create policy "account players can update shared boards" on public.lobby_board_cells for update to authenticated
using (exists (select 1 from public.lobbies l where l.id=lobby_id))
with check (exists (select 1 from public.lobbies l where l.id=lobby_id));
create policy "account players can reset shared boards" on public.lobby_board_cells for delete to authenticated
using (exists (select 1 from public.lobbies l where l.id=lobby_id));
```

## Documentatie

- [RevenueCat API v1: authenticatie](https://www.revenuecat.com/docs/api-v1)
- [RevenueCat klantstatus](https://www.revenuecat.com/docs/api-v1/customers)
- [Supabase getUser: servervalidatie](https://supabase.com/docs/reference/javascript/auth-getuser)
- [Supabase gateway JWT-check en ES256](https://supabase.com/docs/guides/troubleshooting/edge-function-401-error-response)

