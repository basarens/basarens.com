# Foto’s insturen via een persoonlijke link

Het gedeelde fotoarchief staat op `/herinneringen/<MEMORIES_UPLOAD_TOKEN>`. Iedereen met deze link kan alle bevestigde foto’s, namen en verhalen bekijken én zelf foto’s insturen, ook na doorsturen van de link. Het archief bevat ook foto’s van eerdere uitnodigingen. Er is geen link vanaf de homepage. `/herinneringen` vertelt bezoekers dat ze een uitnodiging nodig hebben. De uitnodigingspagina gebruikt noindex en no-referrer. De link is een toegangssleutel, geen individuele login.

## Activeren

1. Gebruik je eigen Supabase-project en voer `supabase/memories.sql` uit in de SQL editor. Dit maakt een privébucket `memories-inbox` en een afgeschermde tabel voor naam, verhaal, originele bestandsnaam en ontvangststatus. Er worden geen leesrechten aan bezoekers gegeven. Als de bucket al bestaat, controleer of deze privé is, maximaal 20 MB per bestand toestaat en alleen de vijf MIME-types uit het script accepteert. De API weigert een publiek/onbegrensd bucket.
2. Stel in `.env.local` en bij de hostingprovider in:
   - `NEXT_PUBLIC_SUPABASE_URL`: project-URL.
   - `MEMORIES_SUPABASE_SECRET_KEY`: een server-side Supabase secret key (`sb_secret_…`) of service-role key. Nooit een `NEXT_PUBLIC_`-naam geven, inchecken of aan vrienden sturen. De bestaande finance-client blijft de publishable key gebruiken.
   - `MEMORIES_UPLOAD_TOKEN`: een willekeurige toegangssleutel van minstens 32 tekens, bijvoorbeeld gegenereerd met `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
3. Herstart de lokale server of deploy de website met de instellingen. Deel daarna `https://basarens.com/herinneringen/<jouw-token>`.
4. Test eerst één foto vanaf je telefoon: na verzending moet de pagina ‘Ontvangen’ tonen, de tabel een `complete`-regel en de bucket het bestand bevatten. Test ook een verkeerde link: deze moet 404 geven. De geheime server-key mag nooit in de browser of netwerkantwoorden staan.

Zonder configuratie slaat de pagina niets op en geeft dat duidelijk aan. Ongeldige links tonen geen uploadformulier. Voor een lokale visuele preview kun je alleen het uitnodigingstoken configureren; opslag blijft dan uitgeschakeld.

## Gedrag en beheer

- Het uploadformulier staat boven het fotoarchief. De zoekbalk doorzoekt alle bevestigde foto’s op een deel van de context of fotograaf, zonder onderscheid tussen hoofdletters en kleine letters. Zoekresultaten worden op de server gefilterd vóór paginering; ook foto’s die nog niet geladen waren worden gevonden. Typen start het zoeken na 250 ms. Met ‘Wis zoekopdracht’ verschijnt het volledige archief weer.

- Tik of klik op een foto om de kaart om te draaien. Op de achterkant kun je de context en fotograaf bekijken, aanpassen en opslaan. Iedereen met een geldige link heeft dezelfde bewerkrechten. De velden fotograaf en context gebruiken de bestaande kolommen `name` en `message`; er is geen database-migratie nodig. Nieuwe inzendingen nemen aanvankelijk de opgegeven naam over als fotograaf. De inzenddatum en originele foto veranderen niet. Bij gelijktijdig bewerken wordt een verouderde wijziging geweigerd; de gebruiker kan de nieuwste context bekijken voordat die opnieuw aanpast. Er is geen versiegeschiedenis.
- Controle: `node --test tests/memories-upload.test.mjs`. Voor een echte test met één tijdelijke foto: `node scripts/verify-memories.mjs`, of `node scripts/verify-memories.mjs --live` voor www.basarens.com. Deze test wijzigt uitsluitend zijn eigen testrecord en ruimt foto en record daarna op.

- De kaart bovenaan toont `bas-video-2026-10-12.mp4` uit de private Supabase-bucket `memories-featured` (alleen `video/mp4`, maximaal 10 MiB). De server maakt na controle van de uitnodigingslink een afspeellink die één uur geldig is. De pagina wordt dynamisch geladen, zodat iedere nieuwe paginalading een verse link krijgt. De video speelt automatisch zonder geluid in een loop, ook inline op mobiel; met de eigen knop kun je het geluid aan- en uitzetten; de standaard videobediening is verborgen. Zonder beschikbare video verschijnt de placeholder. Bewaar besloten video's niet onder `public`, waar ze onafhankelijk van de uitnodigingslink bereikbaar zijn.

- Maximaal 20 foto’s per selectie, 20 MB per foto: JPEG, PNG, WEBP, HEIC/HEIF. HEIC is uploadbaar, maar niet iedere browser kan een voorbeeld tonen. Originele bestanden worden bewaard, inclusief eventuele locatiegegevens/EXIF. Er is geen bestandsconversie.
- Bestanden gaan rechtstreeks naar Supabase via een tijdelijke upload-URL. Dat voorkomt de limiet voor grote bestanden op de websitehosting. Iedere foto krijgt een willekeurige bestandsnaam; overschrijven is uitgeschakeld.
- Na upload controleert de server de opgeslagen bestandsgrootte en bevestigt de ontvangst. Een mislukte bevestiging kan worden herhaald zonder de foto opnieuw te uploaden. Al bevestigde foto’s worden overgeslagen bij opnieuw proberen.
- De database begrenst iedere uitnodiging op 1.000 reserveringen en 5 GiB aan opgegeven bestandsgrootte, ook bij gelijktijdige verzoeken. Mislukte/afgebroken uploads kunnen pending-reserveringen achterlaten; controleer deze vóór verwijderen. MIME-filtering is geen inhoudelijke fotovalidatie; behandel uploads als niet-vertrouwde bestanden.
- Het gedeelde archief toont 24 foto’s per pagina, nieuwste inzendingen eerst, met een knop om de volgende pagina te laden. Namen en verhalen zijn zichtbaar. Na upload vernieuwt het archief automatisch; voor inzendingen van anderen is er een vernieuwknop. Tijdelijke leeslinks zijn één uur geldig. De bucket en database blijven privé: alleen de website kan na controle van de uitnodigingscode leeslinks maken. Deze tijdelijke links kunnen tijdens hun geldigheid ook worden doorgestuurd. Er is geen verwijderfunctie voor bezoekers.
- Een gewijzigd token maakt de oude uitnodigingslink onbruikbaar voor nieuwe verzoeken. Eerder uitgegeven signed upload-URL’s kunnen nog tot twee uur werken. Eerdere foto’s blijven opgeslagen.
- Supabase is opslag, geen onafhankelijke back-up. Exporteer de originele bestanden en metadata regelmatig naar een tweede locatie. Houd ook de opslaglimieten van je Supabase-abonnement in de gaten.

De pagina is pas echt beschikbaar voor vrienden na configuratie én deployment. Er worden geen externe infrastructuurinstellingen door deze codewijziging aangemaakt.

- De achterste kaart toont de private foto `featured/friends-2026-10-12.jpeg` uit `memories-inbox`, via een link van een uur die alleen na controle van de uitnodigingslink wordt gemaakt. Deze uitgelichte foto staat los van de inzendingen in het archief.

- Optionele fotodatum: voer `supabase/memories-dates.sql` uit na het basisschema, ook voor bestaande installaties. Dit voegt nullable `photo_year`, `photo_month` en `photo_day` toe met kalendercontroles en een index voor latere datumfilters. De uploaddatum blijft apart. Jaar, jaar + maand of een volledige datum zijn mogelijk; onbekende delen blijven NULL. Bij upload geldt de datum voor de hele selectie, daarna kan iedereen met de link de datum per foto aanpassen of leegmaken. Gelijktijdige datumwijzigingen worden beschermd tegen overschrijven.
