# Prototypes de remplacement des caps silencieux

Date: 2026-05-13

Objectif: remplacer le cap silencieux qui écrase les rangs trop élevés, sans perdre l'information utile pour le debug ou l'interface.

## Version 1 - Minimal compatible

Cette version garde le contrat actuel autant que possible.

### Idée

- Les champs existants restent utilisables: `standard`, `attack_rank`, `optimistic`, `worst_case`, `best_attack`.
- Chaque attaque conserve `rank`, mais on ajoute `raw_rank` et `cap`.
- Le cap reste appliqué, mais il devient visible.

### Shape proposé

```js
{
  standard: 1.2e6,
  attack_rank: 65,
  optimistic: 65,
  worst_case: 4.2e22,
  best_attack: "combinator",
  details: {
    brute: {
      rank: 4.2e22,
      raw_rank: 4.2e22,
      cap: null,
      model: "brute"
    },
    dictionary: {
      rank: 3.0e30,
      raw_rank: 1.1e40,
      cap: {
        applied: true,
        reason: "exceeds_brute",
        limit: 3.0e30
      },
      model: "dictionary"
    }
  }
}
```

### Lecture

- `rank` reste la valeur consommée par l’existant.
- `raw_rank` expose la sortie du modèle avant correction.
- `cap` dit si la valeur a été plafonnée.

### Avantages

- Risque de régression faible.
- L’UI peut rester presque inchangée.
- Le debug devient possible sans refonte complète.

### Inconvénients

- Le contrat reste un peu ambigu.
- On garde deux vérités dans le même objet.
- Le modèle n’est pas encore vraiment séparé du mécanisme de garde-fou.

## Version 2 - Clean explicite

Cette version sépare nettement la donnée calculée, la correction et la présentation.

### Idée

- Le résultat est structuré par couches.
- Le score global et l’attaque gagnante sont séparés.
- Les caps deviennent des métadonnées explicites, pas un simple remplacement de valeur.

### Shape proposé

```js
{
  score: {
    standard: 1.2e6,
    attack_rank: 65,
    optimistic: 65,
    worst_case: 4.2e22
  },
  attack: {
    best_attack: "combinator",
    best_attack_rank: 65,
    best_attack_seconds: 2.1e-8
  },
  details: {
    dictionary: {
      raw_rank: 1.1e40,
      capped_rank: 3.0e30,
      cap_reason: "exceeds_brute",
      capped: true,
      model: "dictionary"
    }
  }
}
```

### Lecture

- `score` est ce que l’interface principale doit afficher comme difficulté globale.
- `attack` est ce que l’UI affiche comme meilleure attaque.
- `details` conserve la vérité de chaque sous-modèle.

### Avantages

- Contrat plus clair.
- Le debug est net.
- Le cap devient un mécanisme visible et inspectable.
- Les futurs tests de non-régression sont plus simples.

### Inconvénients

- Casse davantage les consommateurs existants.
- Nécessite un petit refactor UI.
- Implique de faire migrer les appels qui lisent directement `rank.standard`.

## Exemple concret

Mot de passe fictif:

- modèle `dictionary` calcule `1.1e40`
- borne brute du mot de passe: `3.0e30`

### Avant

```js
dictionary.rank === 3.0e30
```

Le dépassement disparaît.

### Après, version 1

```js
dictionary.rank === 3.0e30
dictionary.raw_rank === 1.1e40
dictionary.cap.applied === true
```

### Après, version 2

```js
details.dictionary.raw_rank === 1.1e40
details.dictionary.capped_rank === 3.0e30
details.dictionary.cap_reason === "exceeds_brute"
```

## Recommandation

- Si on veut corriger vite et avec peu de casse: **version 1**
- Si on veut un contrat propre à long terme: **version 2**

Pour `P3`, la version 2 est la cible la plus saine. La version 1 est une passerelle acceptable si on veut migrer progressivement.
