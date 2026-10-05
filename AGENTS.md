<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Prototype is front-end only: all data lives in one seeded in-memory store (src/lib/store.ts); every screen derives numbers from it so counters never contradict.
- tsconfig drops noUncheckedIndexedAccess/exactOptionalPropertyTypes/noPropertyAccessFromIndexSignature: mock-data-heavy UI code, keeps strict otherwise.
