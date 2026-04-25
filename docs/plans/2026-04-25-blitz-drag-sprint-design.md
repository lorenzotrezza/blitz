# Blitz Drag Sprint Design

**Date:** 2026-04-25

## Context

Il party arcade base e stato riallineato su lobby neutra, sessioni comuni e results screen condivisa.
La famiglia `Corse` oggi ha solo `Sprint Circuit`, che copre la gara top-down su circuito. Serve
una seconda variante piu leggibile e piu rapida, orientata al party multiplayer.

Il fix del bug `server offline` della lobby e volutamente fuori scope in questo documento.

## Goal

Aggiungere una nuova variante `Corse` chiamata `Drag Sprint`, multiplayer-first, head-to-head e
lane-based, con strada dritta fissa, guida piu leggibile, ostacoli chiari e power-up ben definiti.

## Product Decision

`Drag Sprint` non sostituisce `Sprint Circuit`.

La famiglia `Corse` diventa:

- `Sprint Circuit`
- `Drag Sprint`

`Drag Sprint` include tre modalita selezionabili dall'host:

- `Finish Line`
- `Best of 3`
- `Survival`

## Core Gameplay

`Drag Sprint` e una corsa verticale a strada fissa, senza curve e senza inclinazioni dinamiche del
tracciato. La camera resta stabile e la leggibilita viene prima dell'effetto scenico.

Principi base:

- tre corsie fisse
- cambio corsia secco, non steering analogico
- boost e freno leggibili
- ostacoli con telegraph prima dell'impatto
- power-up pochi, chiari e con effetto deterministico
- sessione realtime simultanea per tutti i player

## Controls

Input previsti:

- `left`
- `right`
- `boost`
- `brake`

Regole:

- il cambio corsia usa un piccolo cooldown per evitare spam ingestibile
- il player puo occupare una sola corsia alla volta
- il boost e breve e ad alto impatto
- il freno serve a evitare ostacoli o timing sbagliati, non a creare drift

## Obstacles

Set iniziale:

- `cone`
  - ostacolo semplice, rallenta o rompe il ritmo
- `oil`
  - penalita breve, blocca il cambio corsia o degrada il controllo
- `slow-car`
  - traffico lento da superare
- `construction`
  - blocco pesante, va evitato

Tutti gli ostacoli devono:

- spawnare in modo leggibile
- evitare situazioni inevitabili
- essere simmetrici o equivalenti tra i player

## Power-Ups

Set iniziale:

- `nitro`
  - boost corto e forte
- `shield`
  - assorbe un impatto
- `magnet`
  - amplia la pickup zone per pochi secondi
- `repair`
  - rimuove lo stato negativo attivo

Principi:

- un solo power-up attivo per player alla volta
- feedback visivo chiaro
- niente effetti casuali poco leggibili

## Game Modes

### Finish Line

- sprint breve
- traguardo fisso
- vince chi arriva prima
- ranking finale per ordine di arrivo e tempo

### Best of 3

- tre sprint brevi consecutivi
- punti per ogni manche
- vince chi chiude con piu punti
- il results screen mostra punti e manche vinte

### Survival

- strada potenzialmente infinita
- vince chi resta vivo o davanti piu a lungo
- il results screen mostra tempo o distanza sopravvissuta

## Party Arcade Integration

### Lobby

Quando l'host seleziona `Corse`, la lobby mostra:

- `Sprint Circuit`
- `Drag Sprint`

Se l'host seleziona `Drag Sprint`, la lobby mostra anche:

- `Finish Line`
- `Best of 3`
- `Survival`

La configurazione resta host-driven e vive nei `settings` della lobby.

### Session Model

Il server continua a trattare la sessione come:

- `game: race`
- `variant: drag-sprint`

Il ruleset attivo viene trasportato nello stato sessione e nei risultati finali.

### Results Flow

Il results screen resta comune a tutto il party arcade.

Cambiano solo summary e label:

- `Finish Line`: ordine arrivo + tempo
- `Best of 3`: punti + manche vinte
- `Survival`: distanza o tempo sopravvissuto

Le host actions non cambiano:

- `Rigioca`
- `Torna alla Lobby`
- `Cambia Gioco`

## Technical Direction

`Drag Sprint` deve usare lo stesso framework generale di sessione gia introdotto per gli altri
giochi:

- registry host-driven
- runtime server authoritative
- input via `client:game-input`
- state via `server:session-state`
- finish via `server:session-finished`

La nuova variante richiede tipi dedicati per:

- mode
- player state
- obstacle state
- power-up state
- session snapshot

## Non-Goals

Fuori scope per questo step:

- fix della lobby `server offline`
- redesign del deploy/dev bootstrap
- modalita single-player dedicata per `Drag Sprint`
- sostituzione di `Sprint Circuit`

## Success Criteria

- `Corse` mostra sia `Sprint Circuit` sia `Drag Sprint`
- `Drag Sprint` usa strada dritta fissa e 3 corsie
- la guida non inclina il tracciato "a caso"
- esistono ostacoli e power-up leggibili
- le tre modalita `Finish Line`, `Best of 3` e `Survival` sono host-selectable
- la sessione converge sul results screen comune senza branch speciali
