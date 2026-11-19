# Ar2-wiki-et-map-interactive

Wiki communautaire d'Apocalypse Rising 2 : catalogue d'armes et d'objets, comparateur, carte interactive et outils de planification.


## Images

Les images des armes, munitions, chargeurs, accessoires, sacs et objets viennent du [wiki Apocalypse Rising (Fandom)](https://roblox-apocalypse-rising.fandom.com/wiki/Apocalypse_Rising_Wiki) (licence CC BY-SA). La liste complète des sources est dans [img/items/CREDITS.md](img/items/CREDITS.md).

Les images des événements aléatoires viennent du même wiki ; les sources sont dans [img/events/CREDITS.md](img/events/CREDITS.md). L'onglet « Événements aléatoires » explique chaque événement (loot, infectés, emplacements) avec des probabilités estimées : le jeu ne publie aucun taux officiel.

L'onglet « Guide des accessoires » réunit les 24 accessoires : effets, réticules, armes compatibles, rareté estimée et la carte des 120 spawns documentés par le wiki (photos dans [img/attachments/CREDITS.md](img/attachments/CREDITS.md)).

L'onglet « Cosmétiques » liste les 481 cosmétiques documentés par le wiki (vêtements, chapeaux, masques, ceintures, tenues rares, cosmétiques d'événement et packs Robux) avec leurs lieux, les infectés qui les lâchent, leurs couleurs et une rareté estimée (images dans [img/cosmetics/CREDITS.md](img/cosmetics/CREDITS.md)). Les fiches sont aussi accessibles depuis Find Item, la recherche instantanée et un filtre dédié de la carte. Tu peux ajouter les cosmétiques à ta liste de loot, les marquer comme trouvés et les conserver dans ta sauvegarde. Les pourcentages sont des estimations : le jeu ne publie aucun taux officiel.

## Données et fonctionnement hors ligne

La révision et la date du snapshot du catalogue sont indiquées en bas du site et décrites dans [data-version.json](./data-version.json). Cette date décrit l'état du dépôt, pas une vérification officielle de chaque statistique. Les données principales du catalogue sont séparées de l'interface dans [site-data.js](./site-data.js); les scripts de cosmétiques, événements et accessoires restent dans leurs fichiers dédiés.

Le site peut être installé depuis un navigateur compatible. Après une première visite en ligne, le service worker conserve la page, les données et les ressources visitées pour les ouvrir hors ligne. Les images et ressources externes qui n'ont pas encore été chargées nécessitent toujours une connexion.

## Vérifications

Les contrôles des données et des ressources du site se lancent sans dépendances supplémentaires :

```sh
node --test test/*.test.js
```
