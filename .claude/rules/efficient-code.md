# Efficient Code (Mobile)

Keep render and network work minimal. These are the efficiency traps reviewers (cubic, CodeRabbit) repeatedly flag.

## 1. Don't `setState` inside `useEffect` to mirror derived / server data

Syncing computed or server data into local state via an effect causes an extra render+commit and trips `react-hooks-extra/no-direct-set-state-in-use-effect`. Pick the right tool:

- **Pure derivation** → compute with `useMemo`, render directly. No state at all.
- **Editable state seeded from server that must re-seed when the source changes** → use React's *adjust-state-during-render* pattern (the official "You Might Not Need an Effect"). Guard with a key so it runs once per change:

```tsx
const [map, setMap] = useState({});
const [prevKey, setPrevKey] = useState<string | null>(null);

const syncKey = derived ? `${id}|${recordsKey}` : null;
if (derived && syncKey !== null && syncKey !== prevKey) {
  setPrevKey(syncKey);   // set during render — React re-renders before commit, no effect
  setMap(derived);
}
```

Effects are for *external* side effects (subscriptions, imperative APIs), not for keeping one piece of state in sync with another.

## 2. React Query: key it right, cache it right

- **Every response-shaping argument belongs in the `queryKey`.** A `limit`/filter/search that changes the response but is missing from the key causes cache collisions (two callers share a slot; first write wins). `queryKey: key(studentId, page, limit)` — not `key(studentId, page)`.
- **Pair `staleTime` with `refetchInterval`.** Polling without `staleTime` re-fetches immediately on every remount inside the interval window. Set `staleTime` ≈ the interval.
- **Don't restate defaults.** `refetchOnWindowFocus: true` is already the default — setting it is noise that implies an override.
- **Prefer `useQuery` over hand-rolled `useState`+`useEffect`+fetch.** You get caching, dedup, background refresh, and focus refetch for free; the manual pattern has none and leaks loading/error edge cases.
- **Don't re-fetch what a mutation already returned.** An extra `getX(id)` after `createX`/`updateX` is a wasted round-trip — return the mutation result or `queryClient.setQueryData(key, result)` (only if the shapes match).

## 3. Cancel races in debounced/async effects

A debounced search effect with no cancellation lets a slow earlier response overwrite a fast later one. Guard every `setState` after `await`:

```tsx
useEffect(() => {
  let cancelled = false;
  (async () => {
    const r = await fetchPage(search);
    if (cancelled) return;     // stale response — drop it
    setItems(r.items);
  })();
  return () => { cancelled = true; };
}, [search]);
```

## 4. Compensate partial failures in multi-step mutations

A create that does `createTemplate()` then `assignStudents()` leaves an orphan if step 2 throws. Wrap step 2; on failure, run a compensating delete and rethrow — don't leave half-built server state with no error surfaced.

## 5. Share subscriptions; don't duplicate them

Use library hooks that manage a single internal subscription (`useNetInfo()`) instead of each consumer calling `addEventListener`. N components calling a hand-rolled listener hook = N subscriptions syncing N state slices.

## 6. Don't recompute or re-slice what's already bounded

If the API already returns `limit` rows, a client-side `.slice(0, limit)` is dead work — drop it. Memoize derived lists/maps with `useMemo` keyed on the real inputs so they don't rebuild every render.
