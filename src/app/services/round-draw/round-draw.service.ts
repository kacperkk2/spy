import { Injectable } from '@angular/core';
import { CONFIG } from 'src/app/app.properties';

export interface DrawOptions {
  categories: string[];
  categoriesRandom: boolean;
  spies: number;
  spiesRandom: boolean;
  oneSpyChance: number;
  showCategory: boolean;
}

export interface DrawnRound<T> {
  phrase: string;
  category: string;
  showCategory: boolean;
  spyIds: T[];
  startingId: T;
}

export interface DrawCategory {
  name: string;
  values: string[];
}

/** Źródło losowości w [0, 1) — podmienialne w testach. */
export type RandomFn = () => number;

/**
 * Losowanie rundy: hasło, kategoria, szpiedzy i gracz zaczynający.
 * Używane przez tryb offline (id 1..N) i docelowo przez tryb pokoju (playerId z lobby).
 */
@Injectable({
  providedIn: 'root'
})
export class RoundDrawService {

  draw<T>(playerIds: T[], opts: DrawOptions): DrawnRound<T> {
    return drawRound(playerIds, opts);
  }
}

export function drawRound<T>(
  playerIds: T[],
  opts: DrawOptions,
  categories: DrawCategory[] = CONFIG.CATEGORIES,
  random: RandomFn = Math.random,
): DrawnRound<T> {
  if (playerIds.length === 0) {
    throw new Error('Brak graczy do losowania rundy');
  }

  const category = pickCategory(categories, opts, random);
  const spiesCount = opts.spiesRandom
    ? randomSpiesCount(playerIds.length, opts.oneSpyChance, random)
    : Number(opts.spies);

  return {
    phrase: pickRandom(category.values, random),
    category: category.name,
    showCategory: opts.showCategory,
    spyIds: shuffle(playerIds, random).slice(0, Math.max(0, Math.min(spiesCount, playerIds.length))),
    startingId: pickRandom(playerIds, random),
  };
}

function pickCategory(categories: DrawCategory[], opts: DrawOptions, random: RandomFn): DrawCategory {
  const pool = opts.categoriesRandom
    ? categories
    : categories.filter(c => opts.categories.includes(c.name));
  if (pool.length === 0) {
    throw new Error('Brak kategorii do losowania');
  }
  return pickRandom(pool, random);
}

/**
 * Z prawdopodobieństwem oneSpyChance% jest 1 szpieg, inaczej równomiernie
 * 0 albo 2..min(gracze, MAX_SPIES_LIMIT).
 */
export function randomSpiesCount(players: number, oneSpyChance: number, random: RandomFn = Math.random): number {
  if (random() < oneSpyChance / 100) {
    return 1;
  }
  const effectiveMax = Math.min(players, CONFIG.MAX_SPIES_LIMIT);
  // effectiveMax wartości: 0, 2, 3, ..., effectiveMax
  const roll = Math.floor(random() * effectiveMax);
  return roll < 1 ? 0 : roll + 1;
}

/** Fisher-Yates; zwraca nową tablicę. */
export function shuffle<T>(items: T[], random: RandomFn = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandom<T>(items: T[], random: RandomFn): T {
  return items[Math.floor(random() * items.length)];
}
