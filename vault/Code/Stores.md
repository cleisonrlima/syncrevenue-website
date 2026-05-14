# Stores Module (Zustand)

**Pattern:** State + actions in same object, immutable updates via spread. Never direct mutation.

---

## Stores

### `useModalStore` — `src/stores/useModalStore.ts`
Controls demo modal open/close state.
```typescript
{ isOpen: boolean, open: () => void, close: () => void }
```

### `useLocaleStore` — `src/store/useLocaleStore.ts` (Story 1.3 ✓)
Active locale. Source of truth for components — never read locale directly from i18next.
```typescript
export type Locale = 'en' | 'pt-BR' | 'es'
{ locale: Locale, changeLocale: (locale: Locale) => void }
```
Synced from i18next-detected locale at startup in `main.tsx`. Direct `setState` also used by LanguageSwitcher.

### `useAdminStore` — `src/stores/useAdminStore.ts`
Admin session state.
```typescript
{ admin: { id, email } | null, setAdmin: (admin) => void, clearAdmin: () => void }
```

---

## Pattern

```typescript
// Correct — immutable update
set((state) => ({ isOpen: true }))

// Wrong — direct mutation
state.isOpen = true
```

---

## Status

| Story | Files Created |
|---|---|
| 1.4 | — |
