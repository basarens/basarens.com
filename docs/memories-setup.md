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

- De kaart bovenaan kan een video tonen via `MEMORIES_FEATURE_VIDEO_URL` in `.env.local` en de hostinginstellingen. Gebruik een direct afspeelbare videolink of een pad op deze site. Zonder video toont de kaart een tijdelijke placeholder; het bijschrift blijft zichtbaar. De video heeft bediening en speelt niet automatisch af. Gebruik voor een besloten video geen bestand onder `public`: bestanden daar zijn voor iedereen met het bestandspad bereikbaar, onafhankelijk van de uitnodigingslink.

- Maximaal 20 foto’s per selectie, 20 MB per foto: JPEG, PNG, WEBP, HEIC/HEIF. HEIC is uploadbaar, maar niet iedere browser kan een voorbeeld tonen. Originele bestanden worden bewaard, inclusief eventuele locatiegegevens/EXIF. Er is geen bestandsconversie.
- Bestanden gaan rechtstreeks naar Supabase via een tijdelijke upload-URL. Dat voorkomt de limiet voor grote bestanden op de websitehosting. Iedere foto krijgt een willekeurige bestandsnaam; overschrijven is uitgeschakeld.
- Na upload controleert de server de opgeslagen bestandsgrootte en bevestigt de ontvangst. Een mislukte bevestiging kan worden herhaald zonder de foto opnieuw te uploaden. Al bevestigde foto’s worden overgeslagen bij opnieuw proberen.
- De database begrenst iedere uitnodiging op 1.000 reserveringen en 5 GiB aan opgegeven bestandsgrootte, ook bij gelijktijdige verzoeken. Mislukte/afgebroken uploads kunnen pending-reserveringen achterlaten; controleer deze vóór verwijderen. MIME-filtering is geen inhoudelijke fotovalidatie; behandel uploads als niet-vertrouwde bestanden.
- Het gedeelde archief toont 24 foto’s per pagina, nieuwste inzendingen eerst, met een knop om de volgende pagina te laden. Namen en verhalen zijn zichtbaar. Na upload vernieuwt het archief automatisch; voor inzendingen van anderen is er een vernieuwknop. Tijdelijke leeslinks zijn één uur geldig. De bucket en database blijven privé: alleen de website kan na controle van de uitnodigingscode leeslinks maken. Deze tijdelijke links kunnen tijdens hun geldigheid ook worden doorgestuurd. Er is geen verwijderfunctie voor bezoekers.
- Een gewijzigd token maakt de oude uitnodigingslink onbruikbaar voor nieuwe verzoeken. Eerder uitgegeven signed upload-URL’s kunnen nog tot twee uur werken. Eerdere foto’s blijven opgeslagen.
- Supabase is opslag, geen onafhankelijke back-up. Exporteer de originele bestanden en metadata regelmatig naar een tweede locatie. Houd ook de opslaglimieten van je Supabase-abonnement in de gaten.

De pagina is pas echt beschikbaar voor vrienden na configuratie én deployment. Er worden geen externe infrastructuurinstellingen door deze codewijziging aangemaakt.
