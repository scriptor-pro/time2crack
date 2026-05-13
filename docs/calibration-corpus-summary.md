# Calibration corpus summary

This document summarizes the password corpora and calibration sources used by the model. The counts below are approximate and should not be added naively across rows: some values are raw corpora, others are derived calibration sets, frequency-weighted sources, or wordlists.

## Quick view

| Attack / model | Corpus or source | Approx. size | Role in the model |
| --- | --- | ---: | --- |
| Dictionary | `TOP_PASSWORDS` / HIBP-style top passwords | 105 entries | Direct empirical ranking for the most common leaked passwords |
| Markov | RockYou-derived n-gram training set | ~1,000,000 passwords | Character transition calibration for the Markov model |
| PCFG | RockYou-derived PCFG training set | ~1,000,000 passwords | Skeleton and segment calibration for PCFG |
| PCFG auxiliary | `common-zxcvbn.txt` | 30,223 passwords | Extra local calibration corpus for structural patterns |
| Hybrid | RockYou2021 / clear-password calibration | 14.3M passwords | Empirical calibration of mutation rules and hybrid attack strength |
| Mask EN | RockYou 1M word-count analysis | ~1,000,000 passwords | English letter-space calibration for mask patterns |
| Mask FR | Native French corpus | 2.47M passwords | French letter-space calibration for mask patterns |
| Mask NL | Dutch subtitles corpus | ~5.3M subtitles | Dutch letter-space calibration for mask patterns |
| Combinator | Observed passphrase calibration | 57,549 2-word / 1,794 3-word / 534 4+ word passphrases | Passphrase ranking and separator calibration |

## What the numbers mean

- `1,000,000` for Markov and PCFG refers to the training corpus size used for those model families.
- `30,223` is the size of the auxiliary `common-zxcvbn` corpus used for PCFG-style structural stats.
- `14.3M` for Hybrid is the clear-password RockYou calibration corpus used to fit mutation effectiveness.
- `2.47M` and `~5.3M` are language-specific corpora used to tune mask letter-space estimates.
- `57,549 / 1,794 / 534` are observed passphrase counts used to calibrate the combinator model, not general password-list sizes.

## Best single answer

If you want one honest sentence:

> The model is calibrated on **several million to tens of millions of real-password observations**, depending on the attack family, with the largest empirical source being **RockYou2021 at 32.6M weighted passwords** in the project documentation.

## Important caveat

Do not sum every row together:

- some rows describe the same source in different derived forms
- some rows are language-specific corpora, not password leaks
- some rows are frequency-weighted or deduplicated
- some rows are calibration subsets for a single attack family only

The useful interpretation is per attack family, not as one global “training set size”.
