# Finance-module instellen

Zonder Supabase werkt `/finance` als lokale, versleutelde kluis in de browser. Maak daar een wachtzin aan en importeer jullie bankexport. Het bestand wordt alleen in de browser verwerkt. Download na iedere import een versleutelde back-up. Op een ander apparaat kun je die back-up met dezelfde wachtzin herstellen; er is geen automatische synchronisatie.

De wachtzin wordt niet opgeslagen. Als je de wachtzin vergeet of de browsergegevens wist zonder back-up, zijn de gegevens niet te herstellen. Op een gedeeld apparaat kan iemand de kluis openen als die de wachtzin kent. De bankexport en transacties staan niet in deze repository.

## Later Supabase koppelen

Wanneer de Supabase-variabelen worden ingevuld, schakelt de module over naar het gedeelde accountmodel. De lokale data wordt dan **niet automatisch overgezet**. Bewaar de versleutelde back-up totdat de migratie is uitgevoerd.

1. Maak een privé Supabase-project aan. Zet publieke registratie uit bij **Authentication → Providers → Email**. Maak onder **Authentication → Users** twee accounts aan, één voor elk van jullie.
2. Voer [supabase/finance.sql](supabase/finance.sql) uit in de SQL Editor. Voeg daarna de twee Auth-user-ID's toe met de `insert into public.finance_members`-regel onderaan dat bestand.
3. Zet de project-URL en **publishable key** in `.env.local` en in de Vercel-omgevingsvariabelen, volgens `.env.example`. Gebruik hier nooit een service role of secret key.
4. Start of herstart de site. Log in op `/finance`. Importeer de ING-export met de vier rekeningen als CSV of XLSX. Het originele bestand wordt alleen in het geheugen gelezen; alleen genormaliseerde transacties gaan naar de database.
5. Stel onder **Rekeningen** per rekening in of die gezamenlijk of persoonlijk is en of het een lopende of spaarrekening is. Pas daarna klopt het spaaroverzicht.

Bij een herhaalde import worden transacties op basis van een vingerafdruk overgeslagen. Interne overboekingen worden herkend wanneer beide rekeningnummers in dezelfde import staan. Importeer dus eerst een export met alle vier rekeningen. Categorieën zijn voorlopige regels; de post **Overig** vraagt handmatige controle voordat je uitgavenadvies gebruikt.

De pagina geeft voorlopig geen beleggingsadvies of automatisch vrij besteedbaar bedrag. Daarvoor zijn betrouwbare categorieën, vaste lasten en doelbedragen nodig.
