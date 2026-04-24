# Blitz Party Arcade Design

**Date:** 2026-04-25

## Goal

Evolvere Blitz da esperienza centrata su una singola corsa a una party arcade app multiplayer-first, in cui la lobby esiste al di fuori dei giochi e gestisce selezione modalità, selezione gioco, sessione, risultati e decisioni post-partita.

## Product Direction

- `/` resta il sito storico legacy.
- `/hub` diventa il vero ingresso alla nuova app party.
- L'hub sceglie prima la modalità:
  - `Singolo`
  - `Multiplayer`
- In `Singolo` si seleziona il gioco e si entra direttamente in una sessione locale.
- In `Multiplayer` si crea o si raggiunge una lobby neutra al gioco.
- L'host seleziona il gioco dentro la lobby e tutti i player condividono lo stesso flow di ready, start, post-match e rematch.

## Core Decision

La lobby non deve più appartenere alla corsa. Deve diventare una `party lobby` con stato neutro al gioco.

Il modello corretto è:

- `PartyLobby`
  - room persistente
  - roster player
  - host
  - stato ready
  - gioco selezionato
  - variante selezionata
  - impostazioni del gioco
- `GameSession`
  - runtime specifico del gioco scelto
  - creata dalla lobby quando l'host avvia
  - termina sempre in una `results screen`
- `GameResults`
  - classifica
  - statistiche
  - azioni disponibili per l'host

## Supported Game Families

Il primo catalogo ufficiale è composto solo da questi blocchi:

- `Semaforo`
- `Rigori`
- `Corse`

### Semaforo

- `Single`
  - prova libera con retry immediato
  - benchmark Leclerc/ghost
- `Multiplayer`
  - sessione live simultanea
  - tutti vedono lo stesso countdown randomizzato
  - tutti reagiscono nello stesso istante
  - risultati per manche e classifica finale

### Rigori

- `Single`
  - sfida arcade locale
- `Multiplayer`
  - gioco a turni
  - scelta nascosta di tiro e parata
  - reveal e risoluzione server-side
  - alternanza tiratore/portiere
  - classifica finale o tabellone breve

### Corse

La famiglia `Corse` va rifatta da zero come insieme di varianti. L'attuale ovale automatico non è un gioco valido e deve essere trattato come prototipo da superare.

Varianti previste:

- `Sprint Circuit`
  - gara top-down su pista vera con curve, checkpoint e giri
  - modalità principale
- `Traffic Survival`
  - corsa arcade con traffico, ostacoli e distanza/tempo
  - modalità party più rapida e leggibile
- `Drag Sprint`
  - corsa breve a focus su reaction, boost e tempismo

Per il primo rilascio della famiglia corse va implementata solo `Sprint Circuit`, lasciando le altre due come step successivi.

## UX Flow

### Hub

`/hub`

Scelta iniziale:

- `Singolo`
- `Multiplayer`

### Single Player

Flow:

- scegli gioco
- se il gioco è `Corse`, scegli variante
- avvia sessione locale
- a fine partita:
  - `Rigioca`
  - `Cambia gioco`
  - `Torna hub`

### Multiplayer

Flow:

- `Crea lobby`
- `Entra con codice`
- una volta dentro:
  - roster
  - ready state
  - host badge
  - codice/link invito
  - gioco selezionato
  - impostazioni gioco
- l'host sceglie:
  - `Semaforo`
  - `Rigori`
  - `Corse`
- se seleziona `Corse`, sceglie anche la variante
- l'host avvia la sessione
- a fine partita multiplayer si apre sempre una results screen comune

### Multiplayer Post-Game

La schermata risultati deve essere unica e indipendente dal gioco.

L'host deve poter scegliere:

- `Rigioca`
- `Torna alla lobby`
- `Cambia gioco`

I non-host vedono stato d'attesa e decisione host.

## Technical Architecture

### Shared Domain

Il dominio condiviso deve essere esteso con tipi neutrali al gioco:

- `PartyMode`
- `PartyGame`
- `PartyGameVariant`
- `PartyLobbyStatus`
- `GameSessionStatus`
- `PartyLobbyState`
- `GameSessionEnvelope`
- `GameResults`

### Server

Il server deve essere diviso in tre livelli:

- `PartyLobbyService`
  - crea/join/leave/ready/update settings/select game
- `GameRuntimeRegistry`
  - mappa `selectedGame` e `selectedVariant` al runtime corretto
- `GameManager`
  - mantiene le sessioni attive
  - inoltra input
  - emette snapshot o turn resolution
  - conclude in `GameResults`

### Socket Layer

Gli eventi socket devono diventare neutrali al gioco:

- `client:create-lobby`
- `client:join-lobby`
- `client:leave-lobby`
- `client:set-ready`
- `client:update-lobby-settings`
- `client:select-game`
- `client:start-session`
- `client:game-input`
- `client:post-game-action`
- `server:lobby-updated`
- `server:lobby-error`
- `server:session-started`
- `server:session-state`
- `server:session-finished`
- `server:post-game-updated`

### Client

Il client React deve essere riorganizzato in:

- `Hub`
  - scelta modalità
- `Party Lobby`
  - gestione room e selezione gioco
- `Session Pages`
  - UI specifiche dei giochi
- `Results`
  - board comune post-partita

## Race Rebuild Direction

La famiglia `Corse` deve essere ricostruita con questi principi:

- no più loop automatico su ellisse
- pista top-down con geometria reale
- controlli arcade ma seri
- traiettoria, checkpoint, giri, collisioni soft
- varianti multiple sullo stesso framework base

`Sprint Circuit` deve essere il primo target:

- pista vera disegnata come set di segmenti/zone
- spawn grid
- steering più leggibile
- accelerazione/freno reali
- ranking per posizione e completamento giro

## What Stays

- home legacy su `/`
- estetica 10bit/pixel-art
- tono e inside jokes del progetto
- hub React già introdotto
- infrastruttura Railway + Socket.IO

## What Must Change

- lobby attuale centrata sulla corsa
- distinzione prodotto `practice / bot / live`
- bot mode come ramo principale
- runtime della corsa attuale
- results page troppo accoppiata alla singola sessione gara

## Release Order

Ordine consigliato:

1. rifondazione `hub + party lobby`
2. results flow comune
3. `Semaforo` multiplayer
4. `Rigori` multiplayer
5. `Corse: Sprint Circuit`
6. varianti corse successive

## Success Criteria

- l'hub sceglie prima `Singolo` o `Multiplayer`
- la lobby è neutra al gioco
- tutti i giochi usano lo stesso flow di lobby/start/results/rematch
- `Semaforo` e `Rigori` sono realmente multiplayer
- `Corse` non usa più l'ovale automatico attuale
- l'host può decidere nel post-game se rigiocare, tornare in lobby o cambiare gioco
