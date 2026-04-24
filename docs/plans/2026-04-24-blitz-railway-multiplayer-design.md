# Blitz Railway Multiplayer Design

## Goal

Trasformare `blitz` da pagina statica single-file a web app seria deployabile su Railway, con:

- routing reale a path
- hub minigiochi accessibile da inizio gioco e schermata finale
- lobby via link condivisibile senza account
- gara arcade live sulla stessa pista fino a 8 player
- bot supportati nella stessa architettura
- collisioni soft server-authoritative

## Product Decisions

- Deploy: tutto su Railway
- Accesso: nickname + link/codice lobby, nessun account nel primo MVP
- Modalita core: practice, gara bot, multiplayer live
- Multiplayer target: 7/8 player nella stessa pista
- Collision model: soft collisions, non fisica completa
- Routing: path veri, non `hash`

## Recommended Architecture

### Repo Structure

Il repo viene evoluto in monorepo leggero Node/TypeScript:

- `apps/web`: React + Vite + Phaser
- `apps/server`: Node + Express + Socket.IO
- `packages/shared`: tipi, eventi socket, costanti di gioco
- `docs/plans`: design e piani

Nel primo step il deploy resta singolo su Railway: il server Node serve asset buildati del frontend e apre anche il websocket realtime.

### Why This Architecture

Questa struttura evita di costruire una fullstack app generica per poi lottare con un canvas game e con il realtime. Il backend vive come game server persistente, mentre il frontend resta libero di rendere UI e gioco con un loop fluido. Per un MVP serio multiplayer, questo e il miglior equilibrio tra velocita di consegna e base tecnica.

## Routing

Path previsti:

- `/`: landing/app entry
- `/hub`: hub minigiochi e modalita
- `/hub/minigames/lights`: semaforo
- `/hub/minigames/penalty`: rigori
- `/practice`: practice race single player
- `/bot-race`: gara contro bot
- `/lobby/:code`: lobby multiplayer condivisibile
- `/race/:sessionId`: gara live
- `/results/:sessionId`: classifica finale

Il server deve fare fallback dell'app shell lato frontend e lasciare disponibili endpoint HTTP e websocket per lobby e gara.

## Core User Flows

### Main Flow

`/` -> `/hub` -> creazione lobby o scelta modalita -> countdown -> gara -> risultati -> rematch o ritorno lobby/hub

### Lobby Flow

1. Host entra in `/hub`
2. Crea lobby
3. Riceve URL come `/lobby/ABCD12`
4. Condivide il link
5. Ogni giocatore entra con nickname
6. Host configura pista, numero bot, limite player
7. I player segnano `ready`
8. Host avvia la gara

### Minigame Flow

L'hub raccoglie semaforo, rigori e le modalita gara. Il semaforo diventa anche countdown riutilizzabile e puo essere rilanciato senza uscire dal minigioco.

## Game Modes

### Practice Race

Single player locale, utile per testare steering, camera, HUD e pista.

### Bot Race

Stessa scena di gara del multiplayer, ma con bot generati dal server o simulati in locale in base alla fase di rollout. L'obiettivo e usare lo stesso motore di gara e ridurre codice parallelo.

### Multiplayer Race

Gara live sulla stessa pista con auto visibili in tempo reale, nomi, posizioni e collisioni soft.

## Realtime Model

### Server Authority

Il server e `source of truth` per:

- stato lobby
- ingresso/uscita player
- countdown start
- stato gara
- posizione, velocita e heading di tutte le auto
- bot
- lap/checkpoint/progresso pista
- collisioni soft
- classifica finale

I client inviano solo input compatti:

- steer left/right
- accelerate
- brake
- ready/rematch

### Update Strategy

- tick server fisso, ad esempio 20 Hz
- snapshot broadcastati ai client a ritmo stabile
- client con interpolation e lieve prediction locale
- correzione morbida quando il server riallinea la posizione

Questo riduce cheating e soprattutto impedisce che 7/8 player divergano in stati diversi.

## Track and Physics Model

### Track

Per il primo MVP la pista deve essere semplice, chiara e leggibile:

- singolo tracciato principale
- top-down arcade
- checkpoint numerati
- progress calcolato su spline/segmenti o centerline discretizzata

### Physics

La fisica resta arcade:

- accelerazione e frenata semplici
- grip e drift leggeri
- steering piu controllabile dell'HTML attuale
- limitazione di sterzo alle alte velocita
- damping per evitare auto ingestibili

### Soft Collisions

Le collisioni tra auto non bloccano brutalmente.
Effetti previsti:

- piccolo pushback laterale
- rallentamento breve
- perdita controllo temporanea limitata
- nessun incastro permanente

Questo mantiene caos e divertimento senza trasformare il primo MVP in un simulatore di netcode.

## Client App

### UI Layer

React gestisce:

- pagine
- form nickname
- hub
- lobby
- HUD di contorno
- risultati
- error states

### Game Layer

Phaser gestisce:

- scena gara
- rendering pista
- rendering auto
- HUD in-canvas o overlay
- input
- animazioni countdown
- effetti collisione

Separare UI e scena di gioco evita che il render React interferisca con il loop gameplay.

## Data Model

### Lobby

- `code`
- `hostId`
- `players[]`
- `settings`
- `status`

### Player

- `id`
- `nickname`
- `carId`
- `ready`
- `connectionState`

### RaceSession

- `sessionId`
- `lobbyCode`
- `trackId`
- `startedAt`
- `playersState[]`
- `botsState[]`
- `countdownState`
- `status`

### PlayerState

- `x`
- `y`
- `vx`
- `vy`
- `angle`
- `lap`
- `checkpoint`
- `progress`
- `penalties`

## Minigames Hub

L'hub non deve sembrare un'aggiunta secondaria. Diventa il punto di accesso ufficiale al prodotto:

- da landing: bottone verso hub
- da results: ritorno a hub
- minigiochi retro integrati nello stesso tono visivo
- semaforo con retry immediato
- rigori isolati come modalita rapida

## Deployment on Railway

### Service Shape

Un solo servizio Railway nel MVP:

- build frontend
- build server
- serve static files
- websocket/socket.io attivo

### Environment

- `PORT`
- `NODE_ENV`
- eventuali flag lobby/race

Persistenza nel primo MVP puo restare in memoria per lobby e sessioni attive, se accettiamo che un redeploy azzeri le partite in corso. Database e persistenza storica possono arrivare dopo.

## Testing Strategy

### Unit

- logica lobby
- assegnazione host
- join/leave
- start conditions
- progress/lap calculation
- collisioni soft
- bot behavior minimo

### Integration

- create lobby
- join player multipli
- countdown
- start race
- finish results

### Frontend

- routing base
- screen transitions
- hub navigation
- retry semaforo

### Manual

- due browser in locale
- piu client su stessa lobby
- reconnect semplice
- race con bot e player misti

## Non-Goals for MVP 1

- account e login
- matchmaking pubblico
- chat
- profili persistenti
- piu piste complesse
- collisioni complete
- spettatori completi
- ranking/stats permanenti

## Main Risk

Il rischio non e creare le pagine. Il rischio e far funzionare una gara condivisa con 7/8 player senza controlli ingestibili e senza desync evidenti. Per questo il MVP deve restare:

- pista semplice
- fisica arcade
- collisioni soft
- server authoritative

Questa e la base corretta per crescere verso una versione piu ricca senza buttare il lavoro.
