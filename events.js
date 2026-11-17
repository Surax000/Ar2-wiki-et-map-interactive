/* AR2 – Guide des événements aléatoires
 * Données : wiki Apocalypse Rising (Fandom), pages « Random Events » et pages de chaque événement.
 * Images : img/events/*.webp (wiki Apocalypse Rising, licence CC BY-SA).
 * Probabilités : le jeu ne publie aucun taux officiel. Les pourcentages affichés sont des estimations
 * calculées à partir du nombre d'emplacements, du nombre d'événements actifs en même temps et de la rareté décrite par le wiki.
 */
(function () {
    'use strict';
    const IMG = 'img/events/';
    const WIKI = 'https://roblox-apocalypse-rising.fandom.com/wiki/';

    // Niveaux de fréquence -> chance estimée qu'au moins un exemplaire soit présent sur ton serveur
    const FREQ = {
        5: { label: 'Très courant', pct: 90, color: '#4ade80' },
        4: { label: 'Courant',      pct: 70, color: '#a3e635' },
        3: { label: 'Peu commun',   pct: 45, color: '#facc15' },
        2: { label: 'Rare',         pct: 25, color: '#fb923c' },
        1: { label: 'Très rare',    pct: 10, color: '#f87171' }
    };
    const FAM = {
        militaire:  { label: 'Militaire / OTAN', color: '#ff6b6b' },
        sovietique: { label: 'Soviétique / milice', color: '#ff9f43' },
        police:     { label: 'Police',           color: '#4dabf7' },
        civil:      { label: 'Civil',            color: '#94d82d' },
        divers:     { label: 'Divers / rare',    color: '#f783ac' }
    };
    const RADIO = {
        mil: { label: 'Radio militaire', title: 'Visible avec la Military Field Radio', item: 'field-radio' },
        mil2: { label: 'Radio militaire (The Drying)', title: 'Visible avec la Military Field Radio pendant The Drying', item: 'field-radio' },
        mil3: { label: 'Radio de milice', title: 'Visible avec le Covert Militia Radio Receiver', item: 'militia-radio' }
    };
    // Loot : '@id' = objet du site (image + lien Find Item), sinon texte. Tag : g = garanti, c = possible, r = rare
    const EVENTS = [
        { id: 'heli', t: ['Helicopter'], en: 'Helicopter Crash Site', fr: "Crash d'hélicoptère", fam: 'militaire', img: ['heli', 'heli-gif'], page: 'Helicopter_Crash_Site_(Apocalypse_Rising_2)',
          freq: 3, max: 2, loot: 4, danger: 4, radio: 'mil', smoke: true, spotsWiki: 12,
          desc: "Un hélicoptère militaire (MH-60 Seahawk) à moitié enterré, cassé en morceaux et entouré de caisses. La fumée noire se voit de très loin. C'est l'un des tout premiers événements du jeu et la meilleure source d'armes OTAN.",
          rules: ["Jusqu'à 2 crashs sur la carte en même temps, parfois sur la même île.", "Il n'apparaît que si aucun joueur n'est près de l'emplacement.", "Il disparaît une fois pillé quand plus personne n'est autour, ou après 15 à 20 minutes sans aucune interaction."],
          inf: [['NATO Operator', '2 à 5 infectés spéciaux, avec FAL, AUG, MP5K, UZI, M9, Hi-Power ou M16A2'], ['NATO Pilot', 'peut lâcher un M9']],
          lootList: [['@m16a2', 'c'], ['@m4a1', 'c'], ['@xm177', 'c'], ['@aug', 'c'], ['@g3', 'c'], ['@fal', 'c'], ['@m249-saw', 'c'], ['@m21', 'c'], ['@m40a1', 'c'], ['@psg-1', 'r'], ['@msg-90', 'r'], ['@l96a1', 'r'], ['@mp5k', 'c'], ['@uzi', 'c'], ['@hi-power', 'c'], ['@m93r', 'r'], ['@m9', 'c'], ['@mil-sup', 'c'], ['@military-medkit', 'c'], ['@mre', 'c'], ['@water', 'c'], ['@mess-kit', 'c'], ['@seasoning-kit', 'c'], ['@heavy-us-recon', 'c'], ['Grass Ghillie Suit (petite caisse verte)', 'r']],
          tip: "Avec la Military Field Radio, le crash s'affiche sur ta carte (cercle rouge). Arrive par le côté opposé à la fumée : d'autres joueurs la voient aussi." },
        { id: 'rogue', t: ['Rogue Helicopter'], en: 'Rogue Helicopter Crash Site', fr: "Crash d'hélico « Rogue »", fam: 'divers', img: ['rogue', 'rogue-gif'], page: 'Rogue_Helicopter_Crash_Site',
          freq: 2, max: 1, loot: 5, danger: 4, radio: null, smoke: true, spotsWiki: 5,
          desc: "Un hélicoptère noir sans marquage (Black Hawk modifié) écrasé, gardé par les infectés « Rogue ». Il apparaît surtout sur Faris Island : près de Fairview, deux fois autour du Junkyard et en face de Salem. Un exemplaire intact est posé sur l'héliport de la Military Prison.",
          rules: ["Seulement 5 emplacements connus, surtout au nord de la carte.", "La Military Field Radio ne le montre pas : il faut le repérer à la fumée."],
          inf: [['« Rogue » Pilot', ''], ['« Rogue » Operative', 'peut lâcher SPAS-12, MP5 ou MP5K'], ['« Rogue » Specialist', ''], ['« Rogue » Operative (Scout)', 'rarement le Rogue UZI']],
          lootList: [['@rogue-uzi', 'r'], ['@spas-12', 'c'], ['@mp5', 'c'], ['@mp5k', 'c'], ['@psg-1', 'c'], ['@l96a1', 'c'], ['@fal', 'c'], ['@xm177', 'c'], ['@aug', 'c'], ['@g3', 'c'], ['@uzi', 'c'], ['@military-medkit', 'c'], ['@large-medkit', 'c'], ['@duffel', 'c'], ['@heavy-us-rucksack', 'c'], ['Tactical Sweater, cosmétiques', 'c']],
          tip: "Le meilleur loot « forces spéciales » du jeu, mais 2 à 4 infectés spéciaux. Garde un soin rapide (Small MedKit) dans ta barre." },
        { id: 'transport', t: ['Transport Plane'], en: 'Military Transport Plane', fr: 'Avion de transport militaire', fam: 'militaire', img: ['transport', 'transport2'], page: 'Military_Transport_Plane',
          freq: 2, max: 1, loot: 5, danger: 4, radio: 'mil', smoke: false, spotsWiki: 2,
          desc: "Un gros avion cargo blanc posé à la Naval Air Station ou au Regional Airport. Il existe deux versions : avec un Humvee dans la soute, ou sans. Celle sans Humvee cache une caisse d'armes des forces spéciales dans le casier du haut.",
          rules: ["Emplacements : Naval Air Station et Regional Airport.", "2 Military Weapon Crates dans l'avion, 1 Military Weapon Case dehors sur deux barils, plus un établi de réparation."],
          inf: [['NATO Technician', ''], ['XM177 Operator', ''], ['Transport Pilot', ''], ['NATO Operator', ''], ['NATO Specialist', '']],
          lootList: [['2 Military Weapon Crates', 'g'], ['1 Military Weapon Case', 'g'], ['Special Forces Weapon Case (version sans Humvee)', 'c'], ['@tan-us-recon', 'r'], ['@tan-us-rucksack', 'r'], ['@tan-us-duffel', 'r'], ['@rangefinder', 'c'], ['@bandage', 'c'], ['Accessoires', 'c']],
          tip: "La Dusty Military Crate de l'avion est le seul moyen d'avoir les sacs militaires beiges (tan) en dehors de The Drying." },
        { id: 'nato', t: ['NATO Operator Collision'], en: 'NATO Operator Collision', fr: "Collision d'opérateur OTAN", fam: 'militaire', img: ['nato', 'nato2'], page: 'NATO_Operator_Collision', boss: 'nato-operator-m4',
          freq: 3, max: 1, loot: 4, danger: 4, radio: 'mil', smoke: true, spotsWiki: 4,
          desc: "Un camion militaire noir qui a percuté une camionnette civile. La fumée de l'accident se voit de loin. 3 emplacements sur Faris Island et 1 sur Halsey Island.",
          rules: ["1 à 3 NATO Operators autour, plus un mécanicien infecté.", "Le boss « Operator » (Operator M4A1) n'est pas garanti."],
          inf: [['NATO Operative', 'lâche souvent un M16A2'], ['NATO « Operator »', 'boss non garanti : Operator M4A1'], ['Mechanic', '']],
          lootList: [['@operator-m4a1', 'r'], ['@m16a2', 'c'], ['@uzi', 'c'], ['@mp5k', 'c'], ['@g3', 'c'], ['@fal', 'c'], ['@aug', 'c'], ['@l96a1', 'c'], ['@hi-power', 'c'], ['Special Forces Weapon Bag', 'c'], ['Special Forces Equipment Case', 'c'], ['Accessoires, munitions, outils', 'c']],
          tip: "Regarde le plateau du camion : accessoires, armes de mêlée et utilitaires peuvent y apparaître." },
        { id: 'convoy', t: ['Military Convoy'], en: 'Military Convoy', fr: 'Convoi militaire', fam: 'militaire', img: ['convoy'], page: 'Military_Convoy',
          freq: 3, max: 1, loot: 4, danger: 3, radio: 'mil', smoke: false, spotsWiki: 3,
          desc: "Trois véhicules de l'armée (2 camions M939 et 1 Humvee) arrêtés devant une berline civile, en pleine route. Facile à voir de loin, donc aussi très visé par les autres joueurs.",
          rules: ["Toujours 2 Military Weapon Crates et 1 Military Equipment Case.", "Plusieurs soldats infectés et 1 ou 2 NATO Operators."],
          inf: [['Soldier', 'plusieurs'], ['NATO Operator', '1 ou 2']],
          lootList: [['2 Military Weapon Crates', 'g'], ['1 Military Equipment Case', 'g'], ['5.56mm NATO Battle Pack', 'c'], ['Chargeurs 30 coups 5.56 / 20 coups 7.62', 'c'], ['@mre', 'c'], ['@water', 'c'], ['@military-medkit', 'c'], ['LMG Belt Loader', 'c'], ['Accessoires (poignée, viseur, silencieux)', 'c']],
          tip: "Très bon pour les munitions 5.56 et les accessoires. Ne reste pas au milieu de la route en pillant." },
        { id: 'blockade', t: ['Military Blockade'], en: 'Military Blockade', fr: 'Barrage militaire', fam: 'militaire', img: ['blockade'], page: 'Military_Blockade',
          freq: 4, max: 1, loot: 3, danger: 2, radio: 'mil', smoke: false, spotsWiki: 4,
          desc: "Un barrage routier fait main : 2 Humvees, des caisses militaires, des blocs et une radio. Une caisse médicale militaire est coincée sous un des Humvees.",
          rules: ["1 à 3 soldats infectés.", "Un accessoire peut apparaître sur les caisses où est posée la radio."],
          inf: [['Soldier', '1 à 3']],
          lootList: [['2 Military Weapon Crates', 'g'], ['Military Medical Crate', 'g'], ['Accessoires', 'c'], ['@mre', 'c'], ['@water', 'c'], ['@duffel', 'c']],
          tip: "Pas énorme, mais rapide à fouiller et peu dangereux." },
        { id: 'spetsnaz', t: ['Spetsnaz Camps'], en: 'Soviet Military Camp (Spetsnaz Bandit Camp)', fr: 'Camp soviétique Spetsnaz', fam: 'sovietique', img: ['spetsnaz', 'spetsnaz2'], page: 'Spetsnaz_Bandit_Camp', boss: 'soviet-spetsnaz',
          freq: 4, max: 1, loot: 4, danger: 4, radio: 'mil3', smoke: false, spotsWiki: 12,
          desc: "Un camp de forces spéciales soviétiques : une grande tente marron et plusieurs pick-up, loin des villes, surtout dans les forêts du nord.",
          rules: ["12 emplacements répartis sur les îles.", "Un Soviet Operator lâche toujours l'AO-46."],
          inf: [['Spetsnaz', 'garanti'], ['Soviet Operator (Berezka gris)', 'garanti'], ['Soviet Operator (AO-46)', "garanti, lâche toujours l'AO-46"]],
          lootList: [['@ao-46', 'g'], ['@ak-74', 'c'], ['@aks-74u', 'c'], ['5.45 Soviet (boîtes et caisses)', 'c'], ['Chargeurs AK-74 30 et 45 coups', 'c'], ['@sports-drink', 'c'], ['@gun-cleaning-kit', 'c'], ['Soviet Gas Mask, Fur Hat', 'c'], ['@as-val', 'r'], ['@ots-14-groza', 'r'], ['@vss', 'r'], ['9mm Subsonic Ammo Can', 'r']],
          tip: "Les infectés spéciaux sont la vraie récompense : AS Val, Groza et VSS (munitions 9mm subsonique) viennent d'eux." },
        { id: 'atv', t: ['Renegade ATV'], en: 'Soviet Renegade ATV Crash', fr: 'Crash de quad soviétique', fam: 'sovietique', img: ['atv', 'renegade'], page: 'Soviet_Renegade_ATV_Crash', boss: 'soviet-renegade',
          freq: 4, max: 1, loot: 3, danger: 2, radio: 'mil3', smoke: false, spotsWiki: 10,
          desc: "Un quad rouge aux pneus crevés, avec des provisions dessus et à côté. Un Soviet Renegade infecté traîne autour. 5 emplacements sur Halsey, 4 sur Faris et 1 sur Mackinaw.",
          rules: ["Le Soviet Renegade apparaît toujours.", "Il lâche toujours un Vintage Soviet Backpack et un PP-19 Bizon."],
          inf: [['Soviet Renegade', 'garanti']],
          lootList: [['@pp-19-bizon', 'g'], ['@vintage-soviet', 'g'], ['@kobra', 'c'], ['@makarov', 'c'], ['7.62mm Soviet', 'c'], ['Nourriture (glacière)', 'c'], ['Berezka Sumrak / Green Soviet Ammo Webbing', 'r']],
          tip: "Un des seuls endroits pour le camouflage Berezka Sumrak. Rapide à faire en début de partie." },
        { id: 'plane', t: ['Plane Crash'], en: 'Plane Crash (Smuggler Cargo Plane)', fr: "Crash d'avion de contrebande", fam: 'sovietique', img: ['plane', 'plane-gif'], page: 'Plane_Crash',
          freq: 3, max: 1, loot: 4, danger: 1, radio: 'mil3', smoke: true, spotsWiki: 6,
          desc: "Un petit avion jaune écrasé, sa cargaison éparpillée tout autour. Même modèle que l'avion du Smuggler Airstrip et du Bootlegger Crash. Pas d'infecté spécial.",
          rules: ["6 emplacements connus.", "La Soviet Weapon Crate est le gros lot."],
          inf: [],
          lootList: [['Soviet Weapon Crate', 'g'], ['@dragunov', 'c'], ['@svt-40', 'c'], ['@mosin-m44', 'c'], ['@mosin-nagant', 'c'], ['Attachment Case', 'c'], ['Sac aléatoire', 'c'], ['Consommables', 'c']],
          tip: "Parfait pour un fusil de précision soviétique sans combat." },
        { id: 'militia', t: ['Militia Camp'], en: 'Militia Insurgent Camp', fr: 'Camp de miliciens', fam: 'sovietique', img: ['militia'], page: 'Map_Modifiers',
          freq: 3, max: 1, loot: 3, danger: 3, radio: 'mil3', smoke: false,
          desc: "Un campement de miliciens armés d'armes soviétiques. Le wiki le cite parmi les événements révélés par le Covert Militia Radio Receiver, mais il n'a pas encore de page détaillée.",
          rules: ["Peu d'infos sur le wiki : loot et infectés à confirmer en jeu."],
          inf: [['Militia', 'plusieurs']],
          lootList: [['Armes de milice / soviétiques', 'c'], ['Militia Commander Keys', 'r'], ['@militia-radio', 'r']],
          tip: "Le Covert Militia Radio Receiver te montre ce camp sur ta carte." },
        { id: 'police', t: ['Police Barricade'], en: 'Police Blockade', fr: 'Barrage de police', fam: 'police', img: ['police-old', 'police'], page: 'Police_Blockade',
          freq: 4, max: 1, loot: 2, danger: 2, radio: null, smoke: false, spotsWiki: 6,
          desc: "Un barrage avec une voiture de police, un CUV de police et une herse. Une Security Weapon Case est posée sur le capot et le coffre peut contenir des armes de police.",
          rules: ["1 ou 2 policiers infectés, un SWAT pas toujours présent.", "Un policier armé d'un AC-556 peut apparaître."],
          inf: [['Police Officer', '1 ou 2, parfois avec AC-556'], ['SWAT Officer', 'pas garanti']],
          lootList: [['Security Weapon Case', 'g'], ['@ac-556', 'c'], ['@maverick-88', 'c'], ['@model-788-carbine', 'c'], ['@m9', 'c'], ['@bandage', 'c'], ['@small-medkit', 'c'], ['@health-booster', 'c'], ['Security Equipment Case', 'c']],
          tip: "Utile si tu cherches une arme principale ou de l'eau, sinon pas prioritaire." },
        { id: 'fbi', t: ['FBI Investigation'], en: 'FBI Stakeout', fr: 'Planque du FBI', fam: 'police', img: ['fbi'], page: 'FBI_Stakeout',
          freq: 3, max: 1, loot: 2, danger: 1, radio: null, smoke: false, spotsWiki: 6,
          desc: "Deux voitures noires garées dans un coin discret, avec des dossiers sur le capot. Les emplacements suivent les lieux « criminels » : Casino, Salem, Ashland, Fairview, Beaufort.",
          rules: ["1 ou 2 agents du FBI infectés.", "Premier événement totalement nouveau de la Beta Map."],
          inf: [['FBI Agent', 'lâche un P220 ou un G17']],
          lootList: [['@p220', 'c'], ['@g17', 'c'], ['Police Weapon Case', 'g'], ['@binoculars', 'c'], ['FBI Shirt (seul endroit du jeu)', 'r']],
          tip: "Le seul endroit pour la chemise du FBI." },
        { id: 'prison', t: ['Prison Bus'], en: 'Prison Bus', fr: 'Bus pénitentiaire', fam: 'police', img: ['prison'], page: 'Prison_Bus',
          freq: 3, max: 1, loot: 3, danger: 3, radio: null, smoke: false, spotsWiki: 4,
          desc: "Un bus de prisonniers bloqué et attaqué par des criminels. 4 emplacements sur Faris Island.",
          rules: ["Riot Officer, 2 Jailbreakers et 3 prisonniers infectés.", "Le Riot Officer lâche toujours un SPAS-12."],
          inf: [['Riot Officer', 'garanti : SPAS-12'], ['Jailbreaker ×2', 'garanti : M16A1 ou Model 44'], ['Prisoner ×3', 'chance : Shiv']],
          lootList: [['@spas-12', 'g'], ['@m16a1', 'g'], ['@model-44', 'c'], ['@m1-garand', 'r'], ['Shiv', 'c'], ['Arme civile (entrée du bus)', 'c'], ['Accessoire (près du siège conducteur)', 'r'], ['Pièces de véhicule', 'c']],
          tip: "Le coffre de la voiture noire peut cacher un M1 Garand." },
        { id: 'funeral', t: ['Funeral Convoy'], en: 'Funeral Convoy', fr: 'Convoi funéraire', fam: 'civil', img: ['funeral'], page: 'Funeral_Convoy', boss: 'hearse-bodyguard',
          freq: 3, max: 1, loot: 3, danger: 2, radio: null, smoke: false, spotsWiki: 4,
          desc: "Deux berlines de luxe noires et un pick-up noir avec un cercueil à l'arrière, entourés d'infectés en costume.",
          rules: ["Le Hearse Bodyguard lâche toujours un M1 Thompson.", "3 à 5 invités infectés, qui lâchent surtout de l'eau."],
          inf: [['Hearse Bodyguard', 'garanti : M1 Thompson'], ['Funeral Goer ×3-5', 'eau']],
          lootList: [['@thompson', 'g'], ['Chargeur tambour 50 coups (Thompson)', 'r'], ['@water', 'c'], ['Nourriture (voitures)', 'c'], ['Bowler Hat', 'r']],
          tip: "Une super arme de début de partie, garantie." },
        { id: 'ambulance', t: ['Ambulance Collision'], en: 'Traffic Collision', fr: 'Collision avec ambulance', fam: 'civil', img: ['ambulance'], page: 'Traffic_Collision',
          freq: 4, max: 1, loot: 2, danger: 1, radio: null, smoke: false, spotsWiki: 4,
          desc: "Un pick-up et un break accidentés, soignés par une ambulance garée à côté avec un brancard sorti.",
          rules: ["1 à 3 civils infectés et du personnel médical infecté."],
          inf: [['Civilian', '1 à 3'], ['Medic', 'plusieurs']],
          lootList: [['@large-medkit', 'c'], ['@small-medkit', 'c'], ['@health-booster', 'c'], ['@bandage', 'c'], ['Vêtements, sacs civils', 'c']],
          tip: "Presque pas d'armes, mais la meilleure recharge de soins de la carte." },
        { id: 'grave', t: ['#1 Soda Hat Grave'], en: 'Fresh Grave (Number 1)', fr: 'Tombe fraîche « #1 »', fam: 'civil', img: ['grave1', 'grave'], page: 'Fresh_Grave_(Number_1)',
          freq: 1, max: 1, loot: 1, danger: 1, radio: null, smoke: false, spotsWiki: 2,
          desc: "Une tombe avec une pierre en forme de « 1 », clin d'œil à Bob l'éponge. Elle apparaît au sud de l'église de Beaufort et à l'est de l'église d'Eden. Sa version normale, la Fresh Grave, apparaît près des églises avec une hache.",
          rules: ["Beaucoup plus rare que la Fresh Grave normale."],
          inf: [],
          lootList: [['#1 Soda Hat (cosmétique rare)', 'g'], ['Entrenchment Shovel', 'c'], ['Fire Axe (Fresh Grave normale)', 'c']],
          tip: "À vérifier en passant devant les églises : ça ne coûte rien." },
        { id: 'techno', t: ['Party Bus (Techno)'], en: 'Party Trailer (Techno)', fr: 'Camion de fête doré (Techno)', fam: 'divers', img: ['techno', 'techno2'], page: 'Party_Trailer', boss: 'techno-lord',
          freq: 3, max: 1, loot: 4, danger: 3, radio: null, smoke: false, spotsWiki: 3,
          desc: "Un semi-remorque doré transformé en mini-boîte de nuit : canapé, mini-frigos et cabine de DJ. 3 emplacements pour cette version.",
          rules: ["Gold Technolord, 2 Gold Bodyguards et un fêtard garantis.", "Le camion du Regional Airport ne peut pas être violet."],
          inf: [['Gold Technolord', 'garanti : Desert Eagle ou Sweeper Desert Eagle'], ['Gold Bodyguard ×2', 'garanti'], ['Partygoer', 'pilules de stamina']],
          lootList: [['@sweeper-desert-eagle', 'r'], ['@desert-eagle', 'c'], ['@mac-10', 'c'], ['@tec-9', 'c'], ['@golden-duffel', 'c'], ['@stamina-booster', 'c'], ['@rangefinder', 'c'], ['@binoculars', 'c'], ['@electrolyte', 'c'], ['Party Clothes', 'c']],
          tip: "Le coffre-fort au fond de la remorque contient l'arme secondaire." },
        { id: 'disco', t: ['Party Bus (Disco)'], en: 'Party Trailer (Disco)', fr: 'Camion de fête magenta (Disco)', fam: 'divers', img: ['disco'], page: 'Party_Trailer', boss: 'techno-lord',
          freq: 3, max: 1, loot: 4, danger: 3, radio: null, smoke: false, spotsWiki: 3,
          desc: "La version magenta du camion de fête. Ses infectés ont une des chutes de cosmétique les plus rares du jeu.",
          rules: ["2 Magenta Technolords, 1 Magenta Bodyguard et un fêtard garantis."],
          inf: [['Magenta Technolord ×2', 'garanti : UZI'], ['Magenta Bodyguard', 'garanti'], ['Partygoer', '']],
          lootList: [['@uzi', 'g'], ['@magenta-duffel', 'c'], ['@desert-eagle', 'c'], ['@mac-10', 'c'], ['@tec-9', 'c'], ['@stamina-booster', 'c'], ['Gold Chain', 'r'], ['Party Clothes', 'c']],
          tip: "Vise la chaîne en or et le sac magenta." },
        { id: 'bank', t: ['Bank Truck Robbery'], en: 'Bank Truck Robbery', fr: 'Braquage de fourgon blindé', fam: 'divers', img: ['bank', 'bandit-pink'], page: 'Bank_Truck_Robbery',
          freq: 3, max: 1, loot: 4, danger: 3, radio: null, smoke: false, spotsWiki: 2,
          desc: "Un fourgon blindé blanc criblé de balles. Trois braqueurs en cagoule (blanc, rose, orange) restent toujours à côté.",
          rules: ["Les 3 Balaclava Bandits sont garantis.", "Chacun peut lâcher sa cagoule de sa couleur."],
          inf: [['Bandit cagoule blanche', 'garanti : Softshell Suitcase'], ['Bandit cagoule rose', 'garanti : BAR + chargeurs'], ['Bandit cagoule orange', 'garanti : Mini-14 + chargeurs']],
          lootList: [['@bar', 'g'], ['@mini-14', 'g'], ['@soft-suitcase', 'g'], ['Balaclava (rose, orange, blanche)', 'r'], ['Loot civil (fourgon)', 'c']],
          tip: "Trois récompenses garanties : c'est un des meilleurs événements pour s'équiper." },
        { id: 'pirate', t: ['Pirate Event'], en: 'Pirate Stash', fr: 'Trésor pirate', fam: 'divers', img: ['pirate', 'pirate-npc'], page: 'Pirate_Stash', boss: 'pirate',
          freq: 3, max: 1, loot: 4, danger: 2, radio: null, smoke: false, spotsWiki: 5,
          desc: "Une barque avec deux sacs poubelle et un coffre en train d'être enterré sur la plage.",
          rules: ["Le coffre contient toujours 3 « Scurvy » Energy Tonics, plus un posé dessus : 4 au total.", "Un pirate infecté garde le trésor."],
          inf: [['Pirate', 'cosmétiques pirate, Broadside Lupara']],
          lootList: [['@scurvy-tonic', 'g'], ['@broadside-lupara', 'r'], ['@pirate-rucksack', 'c'], ['Barbes de pirate', 'c']],
          tip: "Le « Scurvy » Tonic dure 2 fois plus longtemps qu'un Military Health Booster. Le Broadside Lupara ne se trouve qu'ici." },
        { id: 'boat', t: ['Supply Boat'], en: 'Supply Boat', fr: 'Bateau de ravitaillement', fam: 'divers', img: ['boat1', 'boat2'], page: 'Random_Events',
          freq: 4, max: 1, loot: 3, danger: 1, radio: null, smoke: false,
          desc: "Une barque échouée chargée de matériel. Deux versions : avec une bonbonne de propane et une caisse d'armes, ou avec une caisse « Vietnam ».",
          rules: ["Aucun infecté.", "Un sac (Rucksack ou Daypack) est souvent posé à l'avant."],
          inf: [],
          lootList: [['Weapon Case (version propane)', 'g'], ['@m14', 'c'], ['@xm177', 'c'], ['@maverick-88', 'c'], ['@model-788-carbine', 'c'], ['@rucksack-civ', 'c'], ['@daypack', 'c'], ['Vietnam Crate, glacière, boîte de munitions (version Vietnam)', 'c']],
          tip: "Un super kit de départ si tu apparais au nord de la prison." },
        { id: 'keyboard', t: ['Keyboard Island'], en: 'Keyboard Island', fr: 'Keyboard Island', fam: 'divers', img: ['keyboard'], page: 'Keyboard_Island',
          freq: 2, max: 1, loot: 2, danger: 1, radio: null, smoke: false, spotsWiki: 3,
          desc: "Un petit îlot perdu en pleine mer avec des palmiers, une barque échouée et un PC ouvert sur Roblox Studio. Il apparaît dans les coins des cases A1, E1 et D6, loin des côtes.",
          rules: ["Une seule île à la fois, ou aucune.", "Sur les serveurs privés, le bureau est plus souvent renversé, sans clavier."],
          inf: [['Cletus et Clyde', 'pas toujours là']],
          lootList: [['Stranded PC Keyboard', 'r'], ['Arme de surplus (caisse verte du bateau)', 'c'], ['@orange-juice', 'c'], ['@soda', 'c'], ['@sports-drink', 'c'], ['Conserves', 'c']],
          tip: "Prends un bateau et de l'eau : si l'île n'est pas là, reviens avant d'avoir faim." },
        { id: 'vip', t: ['VIP Helicopter'], en: 'VIP Helicopter', fr: 'Hélicoptère VIP', fam: 'divers', img: [], page: 'VIP_Helicopter',
          freq: 2, max: 1, loot: 3, danger: 3, radio: null, smoke: false, spotsWiki: 1,
          desc: "Un petit hélicoptère jaune posé sur le toit du Casino (case D1). Il remplace l'ancien VIP Plane de l'aéroport.",
          rules: ["Un seul emplacement : le toit du Casino."],
          inf: [['VIP', 'seul moyen d\'avoir le Yellow Opal Gemstone Necklace'], ['VIP Bodyguard ×2-3', 'MP5 et M9']],
          lootList: [['Yellow Opal Gemstone Necklace', 'r'], ['@mp5', 'c'], ['@m9', 'c'], ['Chargeurs MP5 30 coups (2-3)', 'c'], ['@stamina-booster', 'c'], ['@water', 'c']],
          tip: "Une bonne façon d'avoir un MP5 avec plusieurs chargeurs." },
        { id: 'excalibur', t: ["Excalibur's Sword"], en: 'Sword in the Stone', fr: "Épée dans la pierre (Excalibur)", fam: 'divers', img: ['excalibur', 'sword'], page: 'Steel_Longsword',
          freq: 2, max: 1, loot: 2, danger: 1, radio: null, smoke: false, spotsWiki: 1,
          desc: "Une Steel Longsword plantée dans une pierre, sur l'île au milieu du Crater Lake (Halsey Island). Le wiki indique qu'elle a peut-être été retirée.",
          rules: ["Pendant Halloween, la pierre se déplace sur un rocher accessible en parkour.", "Introuvable pendant The Drying (Oasis)."],
          inf: [],
          lootList: [['Steel Longsword (45 dégâts par coup, combo de 3)', 'g']],
          tip: "Une autre Steel Longsword existe dans la salle fermée du sous-sol de l'arcade." }
    ];
    // Événements sans point sur la carte du site
    const EXTRA = [
        { id: 'fishing', en: 'Fishing Spot', fr: 'Coin de pêche', fam: 'civil', img: ['fishing'], freq: 3, loot: 1, danger: 1,
          desc: "Deux amis infectés, Cletus et Clyde, qui pêchent pendant l'apocalypse, avec une glacière.", lootList: [['@soda', 'c'], ['@sports-drink', 'c'], ['@water', 'c']] },
        { id: 'mtruck', en: 'Militia Supply Truck', fr: 'Camion de ravitaillement de milice', fam: 'sovietique', img: ['militia'], freq: 3, loot: 3, danger: 3, radio: 'mil3', page: 'Militia_Supply_Truck',
          desc: "Un pick-up sans roues avec une palette et deux barils sur le toit, qui tire un tas de caisses. Environ 5 emplacements. Il remplace l'ancien Sedan Haul.",
          lootList: [['Militia Weapon Crate', 'g'], ['Militia Commander Keys', 'c'], ['@militia-radio', 'c'], ['Freezer, Wooden Chest, Medical Cases', 'c']] },
        { id: 'grave-n', en: 'Fresh Grave', fr: 'Tombe fraîche', fam: 'civil', img: ['grave'], freq: 4, loot: 1, danger: 1, page: 'Fresh_Grave',
          desc: "Une pierre tombale devant une tombe rebouchée, en général près des églises. Une hache est plantée dans la terre.", lootList: [['Fire Axe', 'g']] }
    ];
    const SEASONS = [
        { id: 'paques', label: 'Pâques', color: '#b197fc', list: [
            ['rabbit', "Rabbit Hunter's Camp", 'Camp du chasseur de lapins', "Infected Rabbit Hunter garanti.", 'Pâques 2024-2025'],
            ['bunny', 'Bunny Bus', 'Bus du lapin', "Infected Chocolatier garanti.", 'Pâques 2024-2025'],
            ['egg', 'Egg Shell Nest', "Nid de coquilles d'œuf", "Cosmétiques coquille d'œuf au sol.", 'Pâques 2024-2025']] },
        { id: 'valentin', label: 'Saint-Valentin', color: '#ff6b9a', list: [
            ['bachelor', "Bachelor's Truck", 'Pick-up du célibataire', "Infected Bachelor garanti, glacière et 2 sièges, un Large MedKit au sol.", 'Saint-Valentin 2024-2025']] },
        { id: 'noel', label: 'Noël', color: '#74c0fc', list: [
            ['sleigh', 'Sleigh Crash', 'Traîneau du Père Noël écrasé', "Plus de caisses qu'un crash d'hélico : cadeaux, sacs de Noël, coffre-fort du traîneau. Infected Santa et 1 à 3 lutins. Loot presque au hasard, du vêtement civil aux armes des forces spéciales. Plusieurs crashs possibles en même temps.", 'Noël 2021-2024'],
            ['winter-convoy', 'Winter Convoy', "Convoi d'hiver", "Bonshommes de neige infectés, caisses d'armes et cadeaux.", 'Noël 2022-2024'],
            ['snowman', 'Snowman', 'Bonhomme de neige', "Nez en carotte et chapeau haut-de-forme au sol.", 'Noël 2021-2024'],
            ['xmas-tree', 'Christmas Tree', 'Sapin de Noël', "Dans les maisons des grandes villes : cadeaux et Sugar Cookies.", 'Noël 2022-2024'],
            ['nato-tree', 'Christmas Tree (NATO)', "Sapin de l'OTAN", "Dans les lieux OTAN comme la Naval Air Station : Special Forces Weapon Case et chargeurs OTAN.", 'Noël 2022-2024'],
            ['tuna', '« Tuna » Caveman Iceberg', "Iceberg de l'homme des cavernes", "6 à 8 boîtes de thon et la tenue primitive.", 'Noël 2023-2024'],
            ['dogsled', 'Dogsled', 'Traîneau à chiens', "Infectés isolés (insulated) : consommables, armes secondaires civiles, ushankas. Ils peuvent lâcher du beurre de cacahuète.", 'Noël 2023-2024'],
            ['snowmobile', 'Snowmobile', 'Motoneige', "Deux infectés isolés : consommables, armes principales civiles, sacs, soins.", 'Noël 2023-2024']] },
        { id: 'halloween', label: 'Halloween', color: '#ff7a18', list: [
            ['pillars', 'Summoning Circle (Pillars)', "Cercle d'invocation (piliers)", "Thralls et Servants. Goop et une pièce de Blood Ghillie. Depuis Halloween 2026, offre des Demonic Bones à l'autel pour recevoir un cosmétique ou un objet au hasard.", 'Halloween 2022-2026'],
            ['altar', 'Summoning Circle (Altar)', "Cercle d'invocation (autel)", "Même loot que la version piliers, sous forme de tour.", 'Halloween 2022-2026'],
            ['demon', 'Demon Hunter Motorcycle', 'Moto du chasseur de démons', "Infected Demon Hunter, petite caisse et petit étui d'arme. Un Combat Knife peut être dans la roue avant. Apparaît près des zones « corrompues ».", 'Halloween 2023-2024']] },
        { id: 'drying', label: 'The Drying (été)', color: '#e5c07b', list: [
            ['derelict', 'Derelict Supply Transport', 'Transport de ravitaillement abandonné', "Miliciens du désert (Eliminator, Elite avec FAL, Guard, Trooper garantis). Sarsaparilla, MRE, eau.", 'The Drying 2023-2024'],
            ['derelict-attack', 'Derelict Attack', 'Attaque abandonnée', "Miliciens du désert : fusils type AK-74, gros bidon d'essence, Sarsaparilla, rations, pain.", 'The Drying 2023'],
            ['counter', 'NATO Counter Attack', 'Contre-attaque OTAN', "Soldats et NATO Operators : AK-47, AKS-74U, PKM.", 'The Drying 2023'],
            ['white-atv', 'Derelict Patrol ATV', 'Quad de patrouille', "Desert Wanderer : caisse d'armes de police, caisse d'accessoire, étui de guitare ou Heavy Rucksack.", 'The Drying 2023'],
            ['legend-moto', 'Legendary Soldier Motorcycle', 'Moto du soldat légendaire', "Legendary Soldier (tenue léopard) et un mécanicien. Visible avec la Military Field Radio pendant The Drying.", 'The Drying 2024'],
            ['sandy', 'Sandy Chest Cache', 'Coffre ensablé', "Un coffre caché sous le sable avec une arme de surplus ou de surplus Vietnam.", 'The Drying 2023-2024']] }
    ];

    // ------------------------------------------------------------
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pts = e => (e.t && typeof MAP_POINTS !== 'undefined') ? MAP_POINTS.filter(p => p.kind === 'event' && e.t.includes(p.typeLabel)) : [];
    function stats(e) {
        const n = pts(e).length || e.spotsWiki || 0;
        const f = FREQ[e.freq] || FREQ[3];
        const max = e.max || 1;
        const per = n ? Math.min(1, max / n) : 0;              // chance qu'un emplacement précis soit le bon, si l'événement est actif
        const visit = f.pct / 100 * per;                         // chance de le trouver en allant à 1 emplacement au hasard
        return { n, f, max, per, visit };
    }
    const pct = v => v >= .995 ? '100 %' : v < .01 ? '< 1 %' : Math.round(v * 100) + ' %';
    const stars = (n, c) => `<span class="ev-stars" style="color:${c}" aria-label="${n} sur 5">${'★'.repeat(n)}<span class="opacity-25">${'★'.repeat(5 - n)}</span></span>`;
    function itemOf(k) { if (!k || k[0] !== '@') return null; return (typeof ALL_ITEMS !== 'undefined' && ALL_ITEMS.find(i => i.id === k.slice(1))) || null; }
    const TAG = { g: ['Garanti', '#4ade80'], c: ['Possible', '#94a3b8'], r: ['Rare', '#f472b6'] };
    function lootChip([k, tag]) {
        const it = itemOf(k), t = TAG[tag] || TAG.c;
        const name = it ? it.name.replace(/<[^>]+>/g, '') : k;
        const pic = it && typeof itemPic === 'function' && typeof itemImgInfo === 'function' && itemImgInfo(it.id) ? `<span class="ev-lpic">${itemPic(it.id)}</span>` : '';
        const inner = `${pic}<span class="min-w-0 truncate">${esc(name)}</span><em style="color:${t[1]};border-color:${t[1]}55">${t[0]}</em>`;
        return it ? `<button type="button" data-ev-item="${esc(it.id)}" class="ev-loot" title="Voir où trouver ${esc(name)} (Find Item)">${inner}</button>` : `<span class="ev-loot">${inner}</span>`;
    }
    const famBadge = id => { const f = FAM[id] || FAM.divers; return `<span class="ev-badge" style="color:${f.color};border-color:${f.color}66;background:${f.color}14">${esc(f.label)}</span>`; };

    let evFam = 'tous', evQ = '', evSort = 'loot', evOpen = null;
    function filtered() {
        const q = evQ.toLowerCase();
        let l = EVENTS.filter(e => (evFam === 'tous' || e.fam === evFam) && (!q || (e.fr + ' ' + e.en + ' ' + e.desc + ' ' + e.lootList.map(x => { const it = itemOf(x[0]); return it ? it.name : x[0]; }).join(' ')).toLowerCase().includes(q)));
        const s = { loot: (a, b) => b.loot - a.loot || b.freq - a.freq, freq: (a, b) => stats(b).visit - stats(a).visit, danger: (a, b) => a.danger - b.danger || b.loot - a.loot, name: (a, b) => a.fr.localeCompare(b.fr) }[evSort];
        return l.sort(s);
    }

    function card(e) {
        const s = stats(e), g = e.lootList.filter(x => x[1] === 'g');
        const hero = e.img[0] ? `<img src="${IMG}${e.img[0]}.webp" alt="${esc(e.fr)}" loading="lazy" decoding="async" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-tactical-muted text-xs font-mono">Pas encore d'image sur le wiki</div>`;
        return `<article class="ev-card bg-tactical-card border border-tactical-border rounded-2xl overflow-hidden flex flex-col" style="border-top:3px solid ${(FAM[e.fam] || FAM.divers).color}">
            <button type="button" data-ev-open="${e.id}" class="ev-hero relative block w-full aspect-[16/9] bg-tactical-bg overflow-hidden" title="Voir le détail">${hero}
                <span class="absolute left-2 top-2">${famBadge(e.fam)}</span>
                ${e.radio ? `<span class="absolute right-2 top-2 ev-badge" style="color:#fde68a;border-color:#fde68a66;background:#000a" title="${esc(RADIO[e.radio].title)}">${esc(RADIO[e.radio].label)}</span>` : ''}
                <span class="absolute left-0 right-0 bottom-0 px-3 pb-2 pt-6 text-left bg-gradient-to-t from-black/90 to-transparent"><b class="block text-white text-lg leading-tight font-extrabold">${esc(e.fr)}</b><span class="text-[11px] text-white/70 font-mono">${esc(e.en)}</span></span>
            </button>
            <div class="p-4 flex flex-col gap-3 flex-1">
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="ev-stat"><i>Emplacements</i><b>${s.n || '?'}</b></div>
                    <div class="ev-stat"><i>Fréquence</i><b style="color:${s.f.color}">${s.f.label}</b></div>
                    <div class="ev-stat" title="Chance de trouver l'événement en allant à un seul emplacement au hasard (estimation)"><i>Chance / visite</i><b class="text-tactical-accent">${pct(s.visit)}</b></div>
                </div>
                <div class="flex items-center justify-between text-[11px] text-tactical-muted"><span>Loot ${stars(e.loot, '#facc15')}</span><span>Danger ${stars(e.danger, '#f87171')}</span></div>
                <p class="text-xs text-white/80 leading-relaxed">${esc(e.desc)}</p>
                ${g.length ? `<div><div class="ev-sec">Garanti</div><div class="flex flex-wrap gap-1.5">${g.map(lootChip).join('')}</div></div>` : ''}
                <div class="mt-auto flex flex-wrap gap-2 pt-1">
                    <button type="button" data-ev-open="${e.id}" class="xh-btn !py-1.5 !px-3 !text-[11px]">Tout savoir</button>
                    ${s.n && pts(e).length ? `<button type="button" data-ev-map="${e.id}" class="xh-btn !py-1.5 !px-3 !text-[11px]">Voir les ${pts(e).length} emplacements</button>` : ''}
                </div>
            </div>
        </article>`;
    }

    function detail(e) {
        const s = stats(e), map = pts(e);
        const gal = e.img.map((k, i) => `<img src="${IMG}${k}.webp" alt="" loading="lazy" class="${i ? 'w-28 h-20' : 'w-full max-h-[340px]'} object-cover rounded-xl border border-tactical-border">`);
        const bossBtn = e.boss && typeof BOSS_DATA !== 'undefined' && BOSS_DATA.find(b => b.id === e.boss) ? `<button type="button" data-ev-boss="${e.boss}" class="xh-btn !py-1 !px-2 !text-[10px]">Fiche du boss</button>` : '';
        return `<div class="flex flex-col lg:flex-row gap-5">
            <div class="lg:w-[46%] flex flex-col gap-2">${gal[0] || `<div class="w-full h-48 rounded-xl border border-tactical-border bg-tactical-bg flex items-center justify-center text-xs text-tactical-muted">Pas encore d'image sur le wiki</div>`}<div class="flex gap-2">${gal.slice(1).join('')}</div>
                <div class="ev-prob">
                    <div class="ev-sec !mt-0">Probabilités (estimation)</div>
                    ${bar("Présent sur ton serveur", s.f.pct / 100, s.f.color)}
                    ${bar(`Un emplacement précis (${s.max} actif${s.max > 1 ? 's' : ''} sur ${s.n || '?'})`, s.per, '#38bdf8')}
                    ${bar('En visitant 1 emplacement au hasard', s.visit, 'rgb(var(--t-acc,0 255 136))')}
                    ${s.n > 1 ? bar(`En visitant les ${s.n} emplacements`, s.f.pct / 100, '#a78bfa') : ''}
                    <p class="text-[10px] text-tactical-muted mt-2">Le jeu ne donne aucun taux officiel. Calcul : fréquence décrite par le wiki × (événements actifs en même temps ÷ nombre d'emplacements).</p>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-1">${famBadge(e.fam)}${e.radio ? `<span class="ev-badge" style="color:#fde68a;border-color:#fde68a66">${esc(RADIO[e.radio].title)}</span>` : ''}${e.smoke ? '<span class="ev-badge" style="color:#cbd5e1;border-color:#cbd5e166">Fumée visible de loin</span>' : ''}</div>
                <h3 class="text-2xl font-extrabold text-white leading-tight">${esc(e.fr)}</h3>
                <div class="text-xs font-mono text-tactical-muted mb-3">${esc(e.en)}${e.page ? ` • <a href="${WIKI}${e.page}" target="_blank" rel="noopener" class="underline hover:text-tactical-accent">page du wiki</a>` : ''}</div>
                <div class="flex gap-4 text-[11px] text-tactical-muted mb-3"><span>Loot ${stars(e.loot, '#facc15')}</span><span>Danger ${stars(e.danger, '#f87171')}</span><span>Emplacements <b class="text-white">${s.n || '?'}</b>${e.spotsWiki && e.spotsWiki !== s.n ? ` <span title="Nombre donné par le wiki">(wiki : ${e.spotsWiki})</span>` : ''}</span></div>
                <p class="text-sm text-white/85 leading-relaxed">${esc(e.desc)}</p>
                ${e.rules && e.rules.length ? `<div class="ev-sec">Comment ça marche</div><ul class="text-xs text-white/80 space-y-1 list-disc pl-4">${e.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
                ${e.inf && e.inf.length ? `<div class="ev-sec">Infectés ${bossBtn}</div><div class="flex flex-col gap-1">${e.inf.map(([n, d]) => `<div class="flex items-baseline gap-2 text-xs"><b class="text-red-300 shrink-0">${esc(n)}</b><span class="text-tactical-muted">${esc(d)}</span></div>`).join('')}</div>` : '<div class="ev-sec">Infectés</div><p class="text-xs text-tactical-muted">Aucun infecté spécial.</p>'}
                <div class="ev-sec">Loot <span class="normal-case tracking-normal font-normal">(clique sur un objet pour voir où le trouver ailleurs)</span></div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">${e.lootList.slice().sort((a, b) => 'grc'.indexOf(a[1]) - 'grc'.indexOf(b[1])).map(lootChip).join('')}</div>
                ${e.tip ? `<div class="mt-4 rounded-xl border border-tactical-accent/40 bg-tactical-accent/10 px-3 py-2 text-xs text-white"><b class="text-tactical-accent">Astuce : </b>${esc(e.tip)}</div>` : ''}
                ${map.length ? `<div class="ev-sec">Emplacements sur la carte</div><div class="flex flex-wrap gap-1.5">${map.map((p, i) => `<button type="button" data-ev-pt="${esc(p.uid)}" class="xh-btn !py-1 !px-2 !text-[10px]">${i + 1}. ${esc(nearName(p))}</button>`).join('')}</div>` : ''}
            </div>
        </div>`;
    }
    function bar(label, v, c) {
        return `<div class="mt-2"><div class="flex justify-between text-[11px]"><span class="text-white/80">${esc(label)}</span><b class="font-mono" style="color:${c}">${pct(v)}</b></div><div class="h-2 rounded-full bg-tactical-bg border border-tactical-border overflow-hidden"><div class="h-full rounded-full" style="width:${Math.max(2, Math.round(v * 100))}%;background:${c}"></div></div></div>`;
    }
    function nearName(p) {
        if (typeof MAP_DATA === 'undefined') return p.name;
        let best = null, bd = Infinity;
        MAP_DATA.locations.forEach(l => { if (l.custom) return; const d = Math.hypot(l.x - p.x, l.y - p.y); if (d < bd) { bd = d; best = l; } });
        const g = typeof gridSquare === 'function' ? gridSquare(p.x, p.y) : '';
        return best && bd < 160 ? `près de ${best.name.replace(/<[^>]+>/g, '')}${g ? ' (' + g + ')' : ''}` : (g ? 'case ' + g : p.name);
    }

    function probTable() {
        const l = EVENTS.map(e => [e, stats(e)]).sort((a, b) => b[1].visit - a[1].visit);
        const mx = Math.max(...l.map(x => x[1].visit));
        return `<div class="bg-tactical-card border border-tactical-border rounded-2xl p-4">
            <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2"><h3 class="text-sm font-extrabold text-white uppercase tracking-wider">Classement des chances</h3><span class="text-[10px] text-tactical-muted">chance de trouver l'événement en allant à 1 emplacement au hasard (estimation)</span></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">${l.map(([e, s]) => `<button type="button" data-ev-open="${e.id}" class="flex items-center gap-2 text-left text-xs py-1 rounded hover:bg-white/5 px-1">
                <span class="w-2 h-2 rounded-full shrink-0" style="background:${(FAM[e.fam] || FAM.divers).color}"></span>
                <span class="w-44 shrink-0 truncate text-white">${esc(e.fr)}</span>
                <span class="flex-1 h-2 rounded-full bg-tactical-bg overflow-hidden"><span class="block h-full rounded-full" style="width:${Math.max(3, s.visit / mx * 100)}%;background:${s.f.color}"></span></span>
                <b class="w-12 text-right font-mono" style="color:${s.f.color}">${pct(s.visit)}</b></button>`).join('')}</div></div>`;
    }

    function radios() {
        const mil = EVENTS.filter(e => e.radio === 'mil'), mil3 = EVENTS.filter(e => e.radio === 'mil3');
        const box = (img, title, txt, list, where, id) => `<div class="bg-tactical-card border border-tactical-border rounded-2xl p-4 flex gap-4">
            <img src="${IMG}${img}.webp" alt="" class="w-24 h-24 object-contain shrink-0 rounded-xl bg-tactical-bg border border-tactical-border p-1" loading="lazy">
            <div class="min-w-0"><b class="text-white text-sm">${esc(title)}</b> <span class="ev-badge" style="color:#c084fc;border-color:#c084fc66">RARE</span>
                <p class="text-xs text-white/75 mt-1">${esc(txt)}</p>
                <div class="flex flex-wrap gap-1 mt-2">${list.map(e => `<button type="button" data-ev-open="${e.id}" class="ev-badge hover:text-white" style="color:${(FAM[e.fam] || FAM.divers).color};border-color:${(FAM[e.fam] || FAM.divers).color}66">${esc(e.fr)}</button>`).join('')}${EXTRA.filter(x => x.radio && RADIO[x.radio].item === id).map(x => `<span class="ev-badge" style="color:${(FAM[x.fam] || FAM.divers).color};border-color:${(FAM[x.fam] || FAM.divers).color}66">${esc(x.fr)}</span>`).join('')}</div>
                <p class="text-[11px] text-tactical-muted mt-2"><b class="text-white/80">Où la trouver : </b>${esc(where)}</p>
                <button type="button" data-ev-item="${id}" class="xh-btn !py-1 !px-2 !text-[10px] mt-2">Voir dans Find Item</button></div></div>`;
        return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            ${box('radio', 'Military Field Radio', "Équipe-la : de temps en temps, une notification « A new … has been added to your map » apparaît et un cercle rouge montre la zone de l'événement sur ta carte. Le cercle disparaît quand l'événement disparaît.", mil, 'Geothermal Power Plant (bureau du 2e étage), Destroyer Shipwreck, JROTC Camp, tente logistique du port de Magnolia. Aussi la Hive (The Drying) et la Citadel (Halloween 2025).', 'field-radio')}
            ${box('covert', 'Covert Militia Radio Receiver', "Même principe pour les événements soviétiques, de milice et de contrebande. Une seule radio peut être équipée à la fois.", mil3, "2e étage du bâtiment KDPW à Magnolia, Sedan Haul, Soviet Cave, Militia Commander Quarters.", 'militia-radio')}
        </div>`;
    }

    function seasonal() {
        return SEASONS.map(s => `<div class="mb-5"><div class="flex items-center gap-2 mb-2"><span class="w-3 h-3 rounded-full" style="background:${s.color}"></span><h3 class="text-sm font-extrabold uppercase tracking-wider" style="color:${s.color}">${esc(s.label)}</h3><span class="text-[10px] text-tactical-muted font-mono">${s.list.length} événement${s.list.length > 1 ? 's' : ''}</span></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">${s.list.map(([img, en, fr, txt, when]) => `<div class="bg-tactical-card border border-tactical-border rounded-xl overflow-hidden flex flex-col" style="border-top:3px solid ${s.color}">
                <div class="aspect-[16/9] bg-tactical-bg overflow-hidden"><img src="${IMG}${img}.webp" alt="${esc(fr)}" loading="lazy" class="w-full h-full object-cover"></div>
                <div class="p-3"><b class="text-white text-sm leading-tight block">${esc(fr)}</b><span class="text-[10px] font-mono text-tactical-muted">${esc(en)} • ${esc(when)}</span><p class="text-xs text-white/75 mt-1.5">${esc(txt)}</p></div></div>`).join('')}</div></div>`).join('');
    }

    function extras() {
        return `<div class="grid grid-cols-1 md:grid-cols-3 gap-3">${EXTRA.map(e => `<div class="bg-tactical-card border border-tactical-border rounded-xl overflow-hidden flex" style="border-left:3px solid ${(FAM[e.fam] || FAM.divers).color}">
            <img src="${IMG}${e.img[0]}.webp" alt="" loading="lazy" class="w-32 object-cover shrink-0">
            <div class="p-3 min-w-0"><b class="text-white text-sm block leading-tight">${esc(e.fr)}</b><span class="text-[10px] font-mono text-tactical-muted">${esc(e.en)} • ${FREQ[e.freq].label}</span><p class="text-xs text-white/75 mt-1">${esc(e.desc)}</p>
            <div class="flex flex-wrap gap-1 mt-2">${e.lootList.map(lootChip).join('')}</div></div></div>`).join('')}</div>`;
    }

    function render() {
        const root = document.getElementById('ev-root'); if (!root) return;
        if (!root.dataset.ready) {
            root.dataset.ready = '1';
            root.addEventListener('click', onClick);
            root.addEventListener('input', ev => { if (ev.target.id === 'ev-search') { evQ = ev.target.value.trim(); renderGrid(); } });
            root.addEventListener('change', ev => { if (ev.target.id === 'ev-sort') { evSort = ev.target.value; renderGrid(); } });
            const modal = document.getElementById('ev-modal');
            modal.addEventListener('click', ev => { if (ev.target === modal || ev.target.closest('[data-ev-close]')) close(); else onClick(ev); });
            document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && evOpen) close(); });
            const total = EVENTS.length + EXTRA.length + SEASONS.reduce((a, s) => a + s.list.length, 0);
            root.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                ${[['1', "Ils apparaissent au hasard", "Chaque serveur tire au sort quels événements apparaissent et où, parmi des emplacements fixes. Ils n'apparaissent jamais sous les yeux d'un joueur."],
                   ['2', 'Ils ne restent pas', "Un événement pillé disparaît quand plus personne n'est autour. Sans aucune visite, il disparaît après 15 à 20 minutes, puis un autre peut apparaître ailleurs."],
                   ['3', 'Les radios les montrent', "La Military Field Radio et le Covert Militia Radio Receiver affichent certains événements sur ta carte. Sinon, cherche la fumée noire."]]
                    .map(([n, t, d]) => `<div class="bg-tactical-card border border-tactical-border rounded-2xl p-4 flex gap-3"><span class="w-8 h-8 rounded-full bg-tactical-accent text-tactical-bg font-extrabold flex items-center justify-center shrink-0">${n}</span><div><b class="text-white text-sm">${t}</b><p class="text-xs text-white/70 mt-1">${d}</p></div></div>`).join('')}
            </div>
            <div class="flex flex-col md:flex-row gap-2 mb-3">
                <input id="ev-search" type="search" placeholder="Chercher un événement ou un objet (ex : SPAS-12, pirate, soins)…" class="flex-1 bg-tactical-card border border-tactical-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-tactical-muted focus:outline-none focus:border-tactical-accent">
                <select id="ev-sort" class="bg-tactical-card border border-tactical-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-tactical-accent">
                    <option value="loot">Trier : meilleur loot</option><option value="freq">Trier : plus facile à trouver</option><option value="danger">Trier : moins dangereux</option><option value="name">Trier : A → Z</option>
                </select>
            </div>
            <div id="ev-fams" class="flex flex-wrap gap-1.5 mb-4"></div>
            <div id="ev-grid" class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 mb-8"></div>
            <h3 class="text-lg font-extrabold text-white mb-2">Les probabilités</h3>
            <div class="mb-8">${probTable()}</div>
            <h3 class="text-lg font-extrabold text-white mb-2">Les radios qui montrent les événements</h3>
            <div class="mb-8">${radios()}</div>
            <h3 class="text-lg font-extrabold text-white mb-2">Autres petits événements</h3>
            <div class="mb-8">${extras()}</div>
            <h3 class="text-lg font-extrabold text-white mb-1">Événements des fêtes et saisons</h3>
            <p class="text-xs text-tactical-muted mb-3">Ils n'apparaissent que pendant l'événement saisonnier. Pendant The Drying, le convoi, le barrage, la collision OTAN et le crash d'hélico passent en version beige avec des Dusty Military Shipping Crates (sacs et cosmétiques beiges).</p>
            ${seasonal()}
            <p class="text-[11px] text-tactical-muted mt-6">${total} événements. Infos et images : <a href="${WIKI}Random_Events" target="_blank" rel="noopener" class="underline hover:text-tactical-accent">page Random Events du wiki Apocalypse Rising</a> (licence CC BY-SA). Les noms des événements ne sont pas officiels, même en anglais.</p>`;
        }
        renderGrid();
    }
    function renderGrid() {
        const fams = [['tous', 'Tous', 'rgb(var(--t-acc,0 255 136))'], ...Object.entries(FAM).map(([k, f]) => [k, f.label, f.color])];
        document.getElementById('ev-fams').innerHTML = fams.map(([k, l, c]) => {
            const n = k === 'tous' ? EVENTS.length : EVENTS.filter(e => e.fam === k).length, on = evFam === k;
            return `<button type="button" data-ev-fam="${k}" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${on ? 'text-tactical-bg' : 'text-white/80 hover:text-white'}" style="border-color:${c}${on ? '' : '66'};${on ? `background:${c}` : ''}">${esc(l)} <span class="opacity-60 font-mono">${n}</span></button>`;
        }).join('');
        const l = filtered();
        document.getElementById('ev-grid').innerHTML = l.length ? l.map(card).join('') : `<div class="col-span-full text-sm text-tactical-muted bg-tactical-card border border-tactical-border rounded-xl p-4">Aucun événement pour « ${esc(evQ)} ».</div>`;
    }
    function open(id) {
        const e = EVENTS.find(x => x.id === id); if (!e) return;
        evOpen = id;
        const m = document.getElementById('ev-modal');
        document.getElementById('ev-modal-body').innerHTML = detail(e);
        m.classList.remove('hidden'); m.classList.add('flex');
        m.querySelector('.ev-modal-box').scrollTop = 0;
    }
    function close() { evOpen = null; const m = document.getElementById('ev-modal'); m.classList.add('hidden'); m.classList.remove('flex'); }
    function showOnMap(e) {
        close();
        if (typeof mapFilters === 'undefined') return;
        mapFilters.aleatoire = true; if (typeof famFilters !== 'undefined') famFilters[e.fam] = true;
        if (typeof mapMode !== 'undefined') mapMode = 'normal';
        const list = pts(e);
        // texte de recherche qui ne garde que cet événement
        const cands = [e.t[0], list[0] && list[0].name.replace(/\s*\(.*$/, '')].filter(Boolean);
        const ok = q => { q = q.toLowerCase(); return MAP_POINTS.filter(p => (p.name + ' ' + (p.typeLabel || '') + ' ' + (p.island || '') + ' ' + p.desc).toLowerCase().includes(q)).every(p => p.kind === 'event' && e.t.includes(p.typeLabel)); };
        const q = cands.find(ok) || '';
        currentGroup = 'carte'; renderMainTabs(); onGroupChange();
        setTimeout(() => {
            mapSearch = q; const ms = document.getElementById('map-search'); if (ms) ms.value = q;
            if (typeof refreshMap === 'function') refreshMap();
            if (typeof renderMapResults === 'function') renderMapResults();
            if (typeof drawMap === 'function') drawMap();
            const sec = document.getElementById('map-section'); if (sec) sec.scrollIntoView({ block: 'start' });
        }, 60);
    }
    function onClick(ev) {
        const t = ev.target.closest('[data-ev-open],[data-ev-map],[data-ev-fam],[data-ev-item],[data-ev-pt],[data-ev-boss]'); if (!t) return;
        if (t.dataset.evFam) { evFam = t.dataset.evFam; renderGrid(); return; }
        if (t.dataset.evOpen) { open(t.dataset.evOpen); return; }
        if (t.dataset.evMap) { const e = EVENTS.find(x => x.id === t.dataset.evMap); if (e) showOnMap(e); return; }
        if (t.dataset.evItem) { close(); if (typeof goFindItem === 'function') goFindItem(t.dataset.evItem); return; }
        if (t.dataset.evPt) { close(); if (typeof goMapPoint === 'function') goMapPoint(t.dataset.evPt); return; }
        if (t.dataset.evBoss) {
            close(); const b = BOSS_DATA.find(x => x.id === t.dataset.evBoss); if (!b) return;
            toolGoTab('boss');
            setTimeout(() => { try { bossQ = b.name; bossType = 'Tous'; } catch (e) {} const i = document.getElementById('boss-search'); if (i) i.value = b.name; if (typeof bossRender === 'function') bossRender(); window.scrollTo({ top: 0 }); }, 30);
        }
    }

    // Fiche de point sur la carte : image + chance + bouton vers la fiche complète
    function mapExtra(typeLabel, part) {
        const e = EVENTS.find(x => x.t.includes(typeLabel)); if (!e) return '';
        if (part === 'top') return e.img[0] ? `<img src="${IMG}${e.img[0]}.webp" alt="${esc(e.fr)}" loading="lazy" class="w-full aspect-[16/9] object-cover rounded-xl border border-tactical-border mb-3">` : '';
        const s = stats(e);
        return `<div class="mt-3 grid grid-cols-3 gap-2 text-center"><div class="ev-stat"><i>Fréquence</i><b style="color:${s.f.color}">${s.f.label}</b></div><div class="ev-stat"><i>Emplacements</i><b>${s.n}</b></div><div class="ev-stat"><i>Chance ici</i><b class="text-tactical-accent">${pct(s.visit)}</b></div></div>
            <button type="button" data-ev-goto="${e.id}" class="mt-3 w-full text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg bg-tactical-accent text-tactical-bg hover:brightness-110">Fiche complète : loot, infectés, chances</button>`;
    }
    document.addEventListener('click', ev => {
        const t = ev.target.closest('[data-ev-goto]'); if (!t) return;
        currentGroup = 'evenements'; renderMainTabs(); onGroupChange(); window.scrollTo({ top: 0 });
        setTimeout(() => open(t.dataset.evGoto), 30);
    });

    window.AR2Events = { EVENTS, EXTRA, SEASONS, render, open, stats, mapExtra, count: () => EVENTS.length + EXTRA.length + SEASONS.reduce((a, s) => a + s.list.length, 0) };
    window.evRender = render;
    if (typeof currentGroup !== 'undefined' && currentGroup === 'evenements') render();
    if (typeof renderMainTabs === 'function') renderMainTabs();
})();
