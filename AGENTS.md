Expo SDK 58 / React Native app for the lab practicum system. The target is a
mid-range Android phone, so every change is judged on two things: it is
**obvious to the next programmer** and it is **light on the JS thread**.

## Expo changes every SDK — check the docs, not memory

Before touching an Expo, EAS, or React Native API, open the docs matching the
`expo` version in `package.json`: `https://docs.expo.dev/versions/v58.0.0/`
(index + common corrections: https://docs.expo.dev/llms.txt).

- Add dependencies with `npx expo install <pkg>`, in the same commit as the
  first code that uses them. Prefer Expo modules over third-party libraries.
- `ios/` and `android/` are generated (CNG): configure native behavior in
  `app.json` and config plugins. A new native library needs a development build.
- EAS: `npx eas-cli@latest <command>`. Docs: https://docs.expo.dev/eas/index.md

## Code map

Each file belongs to one layer. Dependencies flow downward:
`features → state / services → domain`.

| Layer | Holds | Rule |
| --- | --- | --- |
| `src/domain/` | Business rules: validation, calculations, status | Pure functions, no React/Firebase, each with a `*.test.ts` |
| `src/services/firestore/` | Queries, listeners, batches, callables | The only place that imports `firebase/firestore`; returns normalized data (`normalize.ts`) |
| `src/state/` | Cross-screen contexts (auth, assistant sessions, student attendance) | Reuse an existing context before opening a new listener |
| `src/features/<feature>/` | Screens, `use<Feature>.ts` hooks, feature components | Screens render; logic lives in the hook, rules in `domain/` |
| `src/shared/ui/` | Base components + theme tokens | Use what `shared/ui` exports before writing a new component |
| `src/app/` | `AppNavigator`, `DockTabs`, `navigation.ts` | React Navigation native-stack, **not** Expo Router |

Navigation: the main tabs (Home, Schedule, Attendance, Profile) live in
`DockTabs` and open through `openDockTab(navigation, tab)`. Every other screen
is added to `RootStackParamList` + `AppNavigator`; role-specific screens are
registered only for that role. Rarely opened screens load via `lazyScreen`.

## Performance

React Compiler is on (`app.json`), so routine memoization is automatic. Spend
effort where the compiler cannot help:

- **Firestore listeners**: every `onSnapshot` returns its unsubscribe and is
  released in the `useEffect` cleanup. Effect dependencies are stable
  primitives (a string key built from sorted ids), so a listener reopens only
  when its data scope changes.
- **Narrow queries**: filter on the server (`where`, date ranges, `limit`),
  not on the client. Split `in` filters into groups of 30 with `chunkIds`
  (`batching.ts`). A new composite query adds its index to
  `firestore.indexes.json` in the same commit.
- **Atomic writes**: related documents are written in one `writeBatch` or
  transaction. Inside a transaction, every `get` runs before any `update`/`set`.
- **Rendering**: heavy work (aggregation, grouping, `Map` lookups) runs once
  per data change in a hook or `domain/` function, outside JSX and
  `renderItem`. Long lists use `ScreenList` (virtualized) with a
  `keyExtractor` based on the document id.
- **Formatters**: create `Intl.*` instances once at module level (see
  `shared/format/date.ts`).
- **Timers**: tick at the coarsest interval the UI needs (per minute, not per
  second) and pause while the app is in the background.

## Writing style

- Names state the content: `labSlotRules.ts`, `useAslabFinance.ts`,
  `PeriodFilter.tsx`. One public component per file; split a file past ~300
  lines or once it carries two responsibilities.
- Explicit types at module boundaries (props, hook return values, service
  functions). Firestore data passes through a normalizer, so the rest of the
  code works with definite types.
- Lint rules are followed as written. When a rule truly must be skipped, give
  the reason on the same `eslint-disable-next-line` line.
- Comments explain the *why* or a constraint the code cannot show, in one or
  two lines, in the language of the surrounding file. UI copy is Indonesian.
- Short functions with early returns; named constants for meaningful numbers
  (`MAX_IN_FILTER_VALUES`, `CURRENT_WINDOW_DAYS`).

## UI

- Read `design.md` before any UI change; it is the source of truth for
  tokens, chrome, and navigation.
- Root/navbar pages use `RootTopBar` (`AppTopBar`). Detail, login, form, and
  every pushed page use `BackButton` only. The dock scanner (`BarcodeScan`
  with `fromDock: true`) is a root page.
- Data states: loading → `SkeletonList`, failure → `ErrorState` with
  `onRetry`, empty → `EmptyState` with an action. `LoadingState` is only for
  waiting on a process (camera, QR, location).
- Login inputs keep the `username` + `current-password` autofill hints and
  leave `textContentType` unset.

## Firestore rules

Every `firestore.rules` change ships with allow and deny cases in
`scripts/test-attendance-rules.mts` and is called out in the PR, because rules
deploy separately from the app.

## Done means

All of these pass before committing:

```bash
npx tsc --noEmit
npx expo lint
npm test             # register new test files in the "test" script of package.json
npm run check:ui
npm run verify:contracts
npm run test:rules   # when firestore.rules changes (needs Java)
```

## Git

- One branch per issue/feature (`feat/…`, `fix/…`, `refactor/…`, `docs/…`).
- Atomic Conventional Commits: one logical change per commit,
  `type(scope): summary`, matching the language of the repo history.
- Commits and PRs carry only the developer's name: no `Co-Authored-By`
  trailers and no AI/bot attribution.
- The PR body covers the problem, the solution, rules/index impact, and how it
  was tested.
