import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../../..');
const AR_PATH = resolve(ROOT, 'src/translations/ar.json');
const EN_PATH = resolve(ROOT, 'src/translations/en.json');

// Per i18next v4 + Arabic CLDR. Any key value containing `{{count}}` MUST have
// at least one suffixed sibling so plural resolution works at runtime.
const ARABIC_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];
const ENGLISH_SUFFIXES = ['_one', '_other'];
// `hasOwnSuffix` always checks the full CLDR set — a key already named
// `*_few` is itself a plural variant regardless of language.
const ALL_PLURAL_SUFFIXES = ARABIC_SUFFIXES;

type JsonObject = { [k: string]: string | JsonObject };

function load(path: string): JsonObject {
  return JSON.parse(readFileSync(path, 'utf-8')) as JsonObject;
}

type Violation = { fullKey: string; value: string };

function findCountKeysWithoutFamily(
  tree: JsonObject,
  suffixes: readonly string[],
): Violation[] {
  const out: Violation[] = [];

  function walk(node: JsonObject, prefix: string) {
    for (const [key, value] of Object.entries(node)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        walk(value, fullKey);
      }
      else if (typeof value === 'string' && value.includes('{{count}}')) {
        const hasOwnSuffix = ALL_PLURAL_SUFFIXES.some(s => key.endsWith(s));
        if (hasOwnSuffix)
          continue;

        const hasFamily = suffixes.some(s => node[`${key}${s}`] !== undefined);
        if (!hasFamily) {
          out.push({ fullKey, value });
        }
      }
    }
  }

  walk(tree, '');
  return out;
}

describe('redesign plural-suffix coverage', () => {
  it('every Arabic {{count}} key has a CLDR plural family', () => {
    const ar = load(AR_PATH);
    const violations = findCountKeysWithoutFamily(ar, ARABIC_SUFFIXES);
    if (violations.length > 0) {
      throw new Error(
        `Arabic keys with {{count}} but no plural family (_zero/_one/_two/_few/_many/_other):\n${
          violations.map(v => `  ${v.fullKey} → "${v.value}"`).join('\n')
        }`,
      );
    }
    expect(violations).toHaveLength(0);
  });

  it('every English {{count}} key has at least _one and _other', () => {
    const en = load(EN_PATH);
    const violations = findCountKeysWithoutFamily(en, ENGLISH_SUFFIXES);
    if (violations.length > 0) {
      throw new Error(
        `English keys with {{count}} but no _one/_other family:\n${
          violations.map(v => `  ${v.fullKey} → "${v.value}"`).join('\n')
        }`,
      );
    }
    expect(violations).toHaveLength(0);
  });
});
