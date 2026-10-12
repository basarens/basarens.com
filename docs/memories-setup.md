# Besloten fotoarchief

Het archief op `/herinneringen` vereist een persoonlijk Supabase-account en een actieve vermelding in `public.memories_members`. De oude gedeelde uitnodigingslink verwijst alleen nog naar deze pagina en geeft geen toegang. Er is geen openbare registratie; alleen door Bas goedgekeurde accounts krijgen toegang.

## Installatie en e-mail

1. Stel `NEXT_PUBLIC_SUPABASE_URL` en `MEMORIES_SUPABASE_SECRET_KEY` in, lokaal en bij de hosting. De secret key blijft uitsluitend op de server. De server gebruikt deze ook voor de cookieclient van Auth; er gaat geen Supabase-key naar de browser.
2. Voer eerst `supabase/memories.sql`, daarna `supabase/memories-dates.sql` en `supabase/memories-accounts.sql` uit. Houd beide opslagbuckets private. `memories-featured` bevat alleen MP4 en heeft een limiet van 10 MiB.
3. Maak uitsluitend de expliciet goedgekeurde Auth-accounts aan. Voeg hun user_id, lowercase e-mail, weergavenaam en rol toe aan `memories_members`. Verifieer e-mail via de inlogcode. Accountgegevens en e-mailadressen horen niet in de repository.
4. Configureer een maildienst, bijvoorbeeld Resend SMTP, met een geverifieerd verzenddomein en een sleutel met alleen verzendrechten. Supabase gebruikt `smtp.resend.com`, poort 465, gebruikersnaam `resend`; de sleutel hoort uitsluitend in het SMTP-wachtwoordveld van Supabase. Ontvangst van bestaande domeinmail hoeft niet gewijzigd te worden.
5. Gebruik `supabase/memories-login-email.html` voor de Magic Link- en Confirm sign up-templates van Supabase. De pagina vraagt een code; de templates moeten dus `{{ .Token }}` bevatten. Voor een kleine vriendengroep volstaat het gratis mailpakket. Zet betaalde overages niet aan zonder toestemming.

## Beveiliging

- De sessie staat in aparte HttpOnly-, Secure- en SameSite=Lax-cookies. De server verifieert de gebruiker bij Supabase Auth en controleert de actieve membership opnieuw bij elk API- en mediaverzoek.
- `active = false` trekt archieftoegang direct in, ook voor reeds gedeelde website-fotolinks. Downloaded foto's en screenshots kun je niet terughalen. Tijdelijke storage-links die vóór de omschakeling zijn uitgegeven, kunnen tot hun oorspronkelijke vervaldatum nog werken.
- Foto's en video worden via `/api/memories/media/<id>` gestreamd, met private/no-store-headers. Storage-links blijven op de server. De server ondersteunt byte ranges voor de video. De browser krijgt geen herbruikbare Supabase-leeslinks.
- Databasetabellen hebben RLS en geen rechten voor anon/authenticated. Alleen de server gebruikt de service key, na accountcontrole. Foto-opslag blijft privé; geen openbare storage-policies.
- Schrijfacties vereisen dezelfde origin; in productie uitsluitend `https://www.basarens.com`. Loginpogingen hebben een gedeelde database-limiet per e-mailadres. Alleen actieve leden krijgen een code en automatische accountregistratie is uitgeschakeld.
- Fotoreserveringen zijn gekoppeld aan uploaded_by; alleen die persoon kan zijn upload bevestigen. Metadatawijzigingen registreren edited_by en vergelijken de oude waarden atomisch. Er is geen volledige versiegeschiedenis.
- Metadata en media krijgen no-store; de pagina krijgt noindex, nofollow, no-referrer en DENY voor framing. Noindex is geen toegangsbeveiliging.

## Gebruik

Iedere actieve vriend kan het volledige bevestigde archief zien, foto's insturen en context, fotograaf en fotodatum aanpassen. De voorkant toont context en fotodatum, de achterkant alle informatie. Jaar, jaar + maand of een volledige datum zijn mogelijk; onbekende delen blijven NULL. Bij upload geldt de datum voor de hele selectie, later kan hij per foto aangepast worden. Datums staan los van de uploaddatum.

Maximaal 20 foto's per selectie en 20 MiB per foto: JPEG, PNG, WEBP, HEIC/HEIF. HEIC is uploadbaar, maar niet elke browser toont het voorbeeld. Originele bestanden inclusief eventuele EXIF/locatiegegevens worden bewaard. Bestanden gaan rechtstreeks naar een tijdelijke private upload-URL; de server bevestigt de echte bestandsgrootte. De quotatrigger begrenst het aantal reserveringen en hun totale grootte per uploadgroep.

Zoeken op context of fotograaf en sorteren op laatst toegevoegd, fotodatum of shuffle werken op het hele archief. Shuffle gebruikt een vaste seed voor vervolgpagina's en tekent alleen de benodigde pagina. De uitgelichte video speelt inline in een loop en start stil, met een eigen geluidsknop. De achterste foto komt uit `featured/friends-2026-10-12.jpeg` in `memories-inbox`.

## Controles en beheer

`node --test tests/memories-upload.test.mjs tests/memories-accounts.test.mjs tests/memories-login.test.mjs`

De integratiecontrole `node scripts/verify-memories.mjs` (of `--live`) vereist een goedgekeurde sessie via MEMORIES_TEST_COOKIE of `.private/memories-test-cookie.txt`. De controle gebruikt uitsluitend één eigen tijdelijke testfoto en verwijdert die daarna. Bewaar testcookies nooit in Git en verwijder ze na de controle.

Voeg vrienden alleen na expliciete toestemming toe. Geef de eigenaar de rol owner; vrienden krijgen friend. Trek toegang in door active op false te zetten. Bewaar daarnaast een afzonderlijke back-up: dit archief vervangt geen fotoback-up. De openbare broncode mag geen persoonlijke e-mailadressen, credentials of media bevatten.

## Verwijderstemmen
Voer supabase/memories-removal-votes.sql uit. Twee actieve, verschillende accounts stemmen een foto naar de prullenbak. Dezelfde account telt maar eenmaal en kan een stem intrekken zolang de foto zichtbaar is. De bewerking vergrendelt de foto tijdens stemmen en herstellen, zodat gelijktijdige stemmen goed tellen. Alleen de eigenaar ziet de prullenbak, kan de originele bestanden daarvan ophalen en terugzetten; herstellen wist de stemmen. Bestanden blijven privaat bewaard en worden niet fysiek gewist. Eerder geladen beelden kunnen nog op een toestel staan.

