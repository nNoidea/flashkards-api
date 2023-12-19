## Vereisten

Ik verwacht dat volgende software reeds geïnstalleerd is:

-   [NodeJS](https://nodejs.org)
-   [Yarn](https://yarnpkg.com)
-   [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
-   [TypeScript](https://www.typescriptlang.org/id/download) (zou normaal gesproken automatisch moeten installeren)
-   [ts-node](https://www.npmjs.com/package/ts-node) (zou normaal gesproken automatisch moeten installeren)

## Opstarten

### Dependencies installeren

-   Kloon de repository en installeer de afhankelijkheden.

-   Schakel dev dependcies niet uit als u gemakkelijk met TypeScript wilt werken en testen wilt uitvoeren.

```sh
git clone <this repo>
cd  2324-webservices-OguzAydinlioglu
yarn install
```

### MySQL

Maak een MySQL-server aan met een wachtwoord en start de server.

### Maak `.env` bestanden

Maak in de _root map_ een bestand aan met de naam `.env`, met de volgende inhoud:

```sh
# OF production. Als je dit verandert van "development", wordt `seeding` uitgeschakeld! Als je dit wijzigt naar "test", wordt de resetmodus ingeschakeld voor het huidige databaseschema.
NODE_ENV=development
# De poort die je opent om je API toegankelijk te maken voor de wereld.
PORT=9000
DATABASE_HOST=localhost
# Verander dit in de poort die je opent voor MySQL.
DATABASE_PORT=
DATABASE_NAME=flashkards
DATABASE_USERNAME=root
# Het wachtwoord van je database.
DATABASE_PASSWORD=
# Genereer gewoon een lang en sterk wachtwoord aan.
JWTSECRET=
```

Als je de testsuite ook wilt gebruiken, maak dan een ander bestand aan met de naam `.env.test`:

```sh
# `Seeding` moet altijd worden uitgeschakeld voor testen. Dus niet veranderen naar "development".
NODE_ENV=test
# De poort die je opent om je API toegankelijk te maken voor de wereld.
PORT=9000
DATABASE_HOST=localhost
# Verander dit in de poort die je opent voor MySQL.
DATABASE_PORT=
DATABASE_NAME=flashkards
DATABASE_USERNAME=root
# Het wachtwoord van je database.
DATABASE_PASSWORD=
# Genereer gewoon een lang en sterk wachtwoord aan.
JWTSECRET=
```

### Startup

#### Normale startup

Compileer TS naar JS en voer het uit met de aangepaste opdracht:

```sh
yarn tsc
yarn startJS
```

#### Developer start-up

Als u de code met TypeScript wilt uitvoeren, gebruik dan de volgende commando:

```
yarn start
```

#### Reset

Als u hetzelfde DB-schema gebruikt voor TypeScript en JavaScript, zal het migratieproces mislukken. Reset of verwijder de DB of stel verschillende schema namen in in de configuratiebestanden van de gecompileerde JS. Dit wordt veroorzaakt door knextables in DB.

Je kunt de database resetten door "reset" in te voeren aan het einde van de startopdrachten:

-   TS:

    ```
    yarn start reset
    ```

    Of

-   JS:
    ```
    yarn startJS reset
    ```

Vergeet niet dat, tenzij je wijzigingen aanbrengt, beide talen standaard hetzelfde schema proberen te verbinden (en dus ook te resetten).

## Testen

Voer de tests uit met het volgende commando:

```
yarn test
```

De tests moeten worden uitgevoerd op een lege DB (sommige tests zijn zoektests die afhankelijk zijn van het aantal items). Om deze reden zal het testcommando een nieuw schema aanmaken voor testdoeleinden.

Ik commit alleen als elke test geslaagd is, de tests zouden niet out of box moeten falen.
