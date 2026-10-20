# Time2Crack: comment le modèle a été calibré

Quand on parle de calibration d’un estimateur de résistance de mot de passe, la question clé n’est pas “ai-je un gros dataset ?” mais plutôt “quelles attaques sont réellement modélisées, avec quelles données, et à quelle échelle ?”.

Dans Time2Crack, la calibration ne repose pas sur un seul corpus, mais sur plusieurs sources empiriques, selon la famille d’attaque.

## Vue d’ensemble

| Famille | Source | Ordre de grandeur |
| --- | --- | ---: |
| Dictionnaire | Top passwords / HIBP-like | 105 entrées |
| Markov | RockYou dérivé | ~1 million |
| PCFG | RockYou dérivé | ~1 million |
| PCFG auxiliaire | `common-zxcvbn.txt` | 30 223 mots de passe |
| Hybride | RockYou2021 | 14,3 millions |
| Mask EN | RockYou 1M | ~1 million |
| Mask FR | Corpus français natif | 2,47 millions |
| Mask NL | Corpus néerlandais | ~5,3 millions |
| Combinator | Passphrases observées | 57 549 / 1 794 / 534 |

## Ce qu’il faut retenir

- Il n’existe pas un seul “training set” magique.
- Chaque attaque a sa propre logique de calibration.
- Certains chiffres sont des corpus bruts, d’autres des corpus dérivés ou pondérés.
- On ne doit pas additionner tous les chiffres entre eux.

## Le point important

La bonne lecture n’est pas “combien de mots de passe au total ?” mais plutôt:

- quelle attaque couvre quel type de mot de passe ?
- quelles données empiriques ont servi à la calibrer ?
- où le modèle est robuste, et où il reste approximatif ?

En pratique, Time2Crack s’appuie sur **des millions à des dizaines de millions d’observations**, selon le modèle, avec une source de référence citée dans la documentation projet à **32,6 M de mots de passe pondérés** pour RockYou2021.

## Message à faire passer

Le but n’est pas de prétendre à une exactitude absolue. Le but est de rapprocher l’estimation du comportement réel d’un attaquant, attaque par attaque, avec des calibrations explicites et vérifiables.
