# Stores Module (Zustand)

**Pattern:** State + actions in same object, immutable updates via spread. Never direct mutation.

---

## Stores

### `useModalStore` — `src/stores/useModalStore.ts`
Controls demo modal open/close state.
```typescript
{ isOpen: boolean, open: () => void, close: () => void }
```

### `useLocaleStore` — `src/stores/useLocaleStore.ts`
Active locale. Source of truth for components — never read locale directly from i18next.
```typescript
{ locale: 'en' | 'pt-BR' | 'es', setLocale: (locale) => void }
```

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
