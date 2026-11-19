# Notes de version

## v1.8.4
- Le télémètre estime maintenant la hausse en pixels et l'avance latérale selon l'arme, la distance, le zoom et le mouvement choisi.
- L'optique sélectionnée est prise en compte; aucun effet balistique d'accessoire non documenté n'est supposé.
- La couleur automatique explore tout le spectre RVB, affine la couleur de contraste et accepte jusqu'à 256 favoris personnalisés.

## v1.8.3
- Le statut de téléchargement terminé reste affiché même après une vérification simultanée.
- Le message indique clairement que la mise à jour est prête et qu'un redémarrage l'installera.
- Test de non-régression : une nouvelle vérification ne doit pas masquer l'état prêt après téléchargement.

## v1.8.2
- Gestion des profils renforcée : noms vides ou en double refusés, imports validés et renommages/suppressions contrôlés. Les profils importés et créés restent indépendants.
- Sauvegarde de configuration atomique ; en cas de configuration illisible, le fichier original est conservé au lieu d'être remplacé par des valeurs par défaut.
- Guide du télémètre réorganisé avec un schéma et des explications exactes sur le FOV vertical, la lunette, la calibration, l'écart au viseur et les limites des estimations.
- Format des paramètres existants inchangé ; les mises à jour automatiques de l'installeur restent activées.

## v1.8.1
- Correction de la suppression des profils : le profil actif reste correctement sélectionné même si un profil situé avant lui est supprimé.
- Les nouveaux profils possèdent désormais une copie indépendante de leurs réglages personnalisés.
- Renommage sécurisé et ajout de tests automatiques pour la gestion des profils.


## v1.8.0
- **Atelier de viseur personnalisé** : construis ton propre viseur en ajoutant jusqu'à 24 éléments indépendants. Choisis leur forme, leur taille, leur épaisseur, leur rotation, leur position horizontale/verticale et leur couleur.
- **Nouvelles formes** : plus, traits horizontal et vertical, point creux, losange, pentagone, hexagone, octogone, étoile et coins de cadre.
- Les compositions personnalisées sont conservées dans les profils et dans les codes de partage AR2X.


## v1.7.4
- Télémètre : remplacement de la longue liste déroulante des armes par une barre de recherche avec résultats filtrés.

## Nouveautés de la v1.7.3
- Guide du télémètre entièrement réécrit dans les réglages : utilisation pas à pas, lecture des repères, rôle de l'arme et de la lunette, FOV, calibration et limites de l'estimation.

## Nouveautés de la v1.7.2
- HUD des objectifs interactif : clique sur un objectif pour le cocher ou le décocher directement depuis le petit overlay.
- HUD des objectifs déplaçable à la souris depuis son en-tête, avec mémorisation de la position entre les lancements.

## Nouveautés de la v1.7.1
- **Les vraies images du jeu partout** : chaque arme, munition, chargeur, accessoire, sac, soin et aliment a maintenant son image venant du wiki Apocalypse Rising (351 objets sur 352, plus les 17 calibres de munitions). Elles s'affichent dans le wiki instantané (Ctrl+Alt+W) : une petite image dans la liste, une grande sur la fiche, et les deux armes face à face dans le Duel Express.
- Sur le site : images sur toutes les fiches, dans Find Item, le comparateur, le Défi random et le sac à dos (les objets rangés dans le sac montrent leur image).
- Sans connexion, les images manquantes sont simplement masquées.

## Rappel v1.7.0
- **Kin Flats dans le Loot Run et la boussole** : sur le site, le Planificateur de Loot Run a deux boutons, Archipel et Kin Flats. Sur Kin Flats, clique sur les icônes (cliniques, pompiers, police, supérettes, hôpitaux, églises) pour tracer ton chemin. Un parcours tout prêt « Kin : Clinique → Pompiers → Police » est dans la liste. « Afficher la boussole en jeu » l'envoie dans l'appli et le cap s'affiche en haut de l'écran.
- **La boussole connaît tous les lieux du jeu** : 366 lieux (villes, lieux cachés du wiki, bâtiments de Kin Flats, véhicules, événements, tes lieux perso). Dans le wiki instantané, tape un trajet en plusieurs étapes : « Clinique de Kin > Caserne de pompiers de Kin n°1 > Commissariat de Kin ».
- **Carte tactique en overlay (Ctrl+Alt+M)** : ta carte (archipel ou Kin Flats) en transparence par-dessus le jeu, avec les bâtiments utiles, les lieux cachés, tes lieux perso et ton Loot Run (étape en cours en surbrillance, cap et distance en bas). Appui court : elle reste affichée, rappuie pour la masquer. Touche maintenue : elle disparaît dès que tu relâches. **Ctrl+Alt+Maj+M** change de carte. Taille, opacité et éléments affichés se règlent dans Aides en jeu → Carte tactique.
- **Mes réglages favoris** : une petite étoile à côté de chaque réglage (Couleur auto, FOV du télémètre, opacité du minuteur…). Clique dessus et le réglage arrive dans « Mes favoris », tout en haut des réglages.
- **Assistant de configuration** : au premier lancement (ou via le bouton « Assistant » en haut des réglages), 4 écrans rapides : ton FOV Roblox pour le télémètre, ton viseur et la Couleur auto, tes aides (boussole, minuteur, objectifs, télémètre), puis la vérification de tes raccourcis AZERTY (alerte AltGr et test en direct de chaque touche).

## Rappel v1.6.0
- **Réglages rangés en catégories** : fini la longue liste. À gauche, 6 grandes catégories avec une icône : Mon viseur, Mes armes, Aides en jeu, Wiki et entraînement, Apparence, Réglages de l'appli. En haut, des onglets pour chaque partie (ex : Aides en jeu → Wiki instantané, Télémètre, Boussole, Minuteur, Objectifs).
- Chaque onglet commence par une phrase simple qui explique à quoi il sert.
- **Recherche de réglage** (Ctrl+F) : tape « couleur », « touche » ou « boussole » et tous les réglages qui correspondent s'affichent.
- L'aperçu du viseur et les profils restent à droite quand tu règles ton viseur ou tes armes.
- Les raccourcis clavier sont classés par groupe (Mon viseur, Aides en jeu, Minuteur, L'appli).
- Site : la carte de Kin Flats est redessinée dans le style du site (routes, chemins, champs, collines), avec les bâtiments utiles (supérettes, pompiers, police, église, clinique, hôpital) que l'on peut masquer.

## Rappel v1.5.0
- **Wiki instantané en overlay (Ctrl+Alt+W)** : une barre de recherche semi-transparente s'ouvre par-dessus Roblox, façon Spotlight / PowerToys Run. Tape 3 lettres (M4A1, Ashland…) : stats clés, TTK, meilleurs spawns ou description du lieu, sans Alt-Tab. Entrée = action principale (arme → télémètre, lieu → cap), Ctrl+Entrée = ouvrir la fiche dans le wiki complet, Échap = fermer. Le wiki complet passe sur **Ctrl+Alt+Maj+W**.
- **Duel Express** : tape « Holographic Sight vs OCR Sight » (ou deux armes, soins, sacs, chargeurs) et l'appli donne un verdict en gros : « Prends OCR Sight : +1 pt de précision en visée, grossissement 4x ». Aussi sur le site (bouton Duel Express).
- **Télémètre / mode sniper (Ctrl+Alt+D)** : une jauge translucide à côté du viseur. Chaque trait a la hauteur d'un joueur debout à 75, 100, 150… studs avec ta lunette : compare l'ennemi au trait le plus proche, tu lis sa distance, les dégâts au corps de ton arme à cette distance et la chute de balle. **Ctrl+Alt+Maj+D** change de lunette (1x, 3,4x, 4x, 6x…). L'arme suit ta barre rapide (noms des emplacements) ou se choisit dans le wiki. Calibration et champ de vision réglables.
- **Boussole / cap de navigation (Ctrl+Alt+K)** : en haut de l'écran, le cap à suivre (ex : 229° S-O vers Regional Airport), la distance et le temps de trajet (marche, sprint, véhicule). Destination choisie dans le wiki instantané (« Ashland > Regional Airport »), sur la carte du wiki (« Afficher la boussole en jeu ») ou depuis un Loot Run complet. **Ctrl+Alt+J** passe à l'étape suivante.
- **Thèmes visuels (HUD Skins)** : Classique, Nocturne / NVG (noir profond, vert phosphore), Militaire / Olive (kaki et ambre), Minimaliste / E-Sport (anthracite et cyan). Le thème change l'appli, toutes les fenêtres en jeu et le site ouvert dans l'appli.
- Sauvegarde : nouvelle partie « Thème, télémètre, boussole ».

## Rappel v1.4.0
- **Wiki AR2 dans l'appli** : tout le site (armes, TTK, build, carte, loot run, balistique, boss, survie, défi, Find Item, crosshair…) s'ouvre dans sa propre fenêtre de l'appli. **Ctrl+Alt+W**, le menu près de l'horloge (« Wiki AR2 (site complet)… ») ou le bouton dans les réglages.
  - Le wiki est chargé en ligne : il est toujours à jour sans réinstaller l'appli. Sans internet, une page « hors ligne » réessaie toute seule (le crosshair, les objectifs et le minuteur marchent quand même).
  - **Envoi direct, sans copier-coller** : dans l'onglet Crosshair du wiki, « Envoyer dans l'appli » ajoute ton crosshair comme nouveau profil et l'active. Le bouton « Envoyer à l'appli » des Objectifs les ajoute direct à l'appli. Le bouton « Appli » en haut ouvre les réglages.
  - F5 recharge, Ctrl + / Ctrl - / Ctrl 0 pour le zoom, Alt+← pour revenir. Les liens externes (wiki fandom, devforum…) s'ouvrent dans ton navigateur. La taille et la position de la fenêtre sont gardées.

## Rappel v1.3.0
- **Minuteur tactique** : Ctrl+Alt+T affiche ou masque, Ctrl+Alt+F1 / F2 / F3 lancent les minuteurs rapides (caisses militaires 15 min, hélico crashé 10 min, boost 5 min), Ctrl+Alt+R arrête tout. Orange à la fin, puis « PRÊT » en rouge avec un bip discret.
- **Entraînement de visée** : réflexes, précision, suivi et test de visibilité du crosshair sur 7 fonds.

## Rappel v1.2.0
- **Couleur automatique** (Ctrl+Alt+A) : l'appli regarde le fond autour du crosshair et prend la couleur la plus visible (sur de l'herbe verte : magenta ; sur le ciel : jaune ; sur la neige : noir). Tu règles le temps de rafraîchissement (150 ms à 5 s), la zone analysée, l'anti-clignotement, le fondu, la palette, le mode (palette / couleur opposée / noir-blanc) et le contour auto.
- **Liste blanche** : le crosshair s'affiche seulement quand une appli cochée est au premier plan (Roblox par défaut). Bouton « Ajouter la fenêtre active ».
- **Objectifs** : une liste à cocher (objectif de la partie), avec des listes prêtes (début de partie, run militaire, boss). Tu peux la coller depuis le Défi aléatoire du site. Elle peut s'afficher en petit dans un coin (Ctrl+Alt+O). Ctrl+Alt+N coche l'objectif suivant.
- **Sauvegarde complète** : tu exportes ou importes tout (profils, changement d'arme, couleur auto, liste blanche, objectifs, raccourcis, réglages) par fichier ou par code AR2CFG-. Tu choisis les parties et tu peux ajouter ou tout remplacer. L'import accepte aussi les codes AR2X- et la sauvegarde du site.
- Couleur auto : Roblox doit être en plein écran fenêtré ou en mode fenêtré (pas en plein écran exclusif).

## Téléchargements
- `AR2-Crosshair-Setup.exe` : installeur Windows (recommandé, mises à jour automatiques)
- `AR2-Crosshair-Portable.exe` : version portable (te prévient des mises à jour)
- `AR2-Crosshair-Windows.zip` : dossier à décompresser

Windows SmartScreen peut afficher un avertissement (exe non signé) : « Informations complémentaires » puis « Exécuter quand même ». Aucune injection dans Roblox : l'appli est une fenêtre transparente au-dessus du jeu.
