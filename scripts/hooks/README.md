# Git hooks

Copies versionnées des hooks locaux (git ne versionne pas `.git/hooks/`).

## post-commit

Après chaque commit, met à jour `<span id="commit-date">`, `<span id="commit-message">`
et `<span id="build-version">` dans les pages qui les contiennent
(`*/how-time2crack-works.html`, `index.html`), puis les ajoute au commit (amend).

Garde-fous : pas de boucle sur son propre amend, pages avec modifications en cours
ignorées, rien pendant un rebase / merge / cherry-pick.

## Installation

```bash
cp scripts/hooks/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```
