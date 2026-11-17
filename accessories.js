/* AR2 – Guide des accessoires d'armes
 * Données : wiki Apocalypse Rising (Fandom), page « Attachments (Apocalypse Rising 2) » et carte interactive
 * « AR2 BETA MAP: Attachment Spawns » (Foundation Project, JinsoTanaka) : 120 spawns documentés avec leur grade.
 * Images : img/attachments/*.webp (photos des spawns et réticules, wiki Apocalypse Rising, licence CC BY-SA).
 * Probabilités : le jeu ne publie aucun taux officiel. Les pourcentages sont des estimations :
 * on considère qu'un spawn tire au hasard, à chances égales, un accessoire de sa liste (son « grade »).
 */
(function () {
    'use strict';
    const IMG = 'img/attachments/';
    const WIKI = 'https://roblox-apocalypse-rising.fandom.com/wiki/';
    const W = 1045, H = 947;

    // Grades de loot (même couleurs que la carte du wiki, éclaircies pour le thème sombre)
    const GRADES = {
        militaire:  { label: 'Militaire',     color: '#4ade80', desc: "Bases militaires, Naval Air Station, docks OTAN de Magnolia, hélicos. Le meilleur pool : silencieux militaires et toutes les lunettes." },
        sovietique: { label: 'Soviétique',    color: '#f87171', desc: "Camps et tables soviétiques, Coastal Bunkers, relais soviétique, Mansion. Viseurs soviétiques et silencieux PBS." },
        civil:      { label: 'Civil',         color: '#5fe1c2', desc: "Commissariats, armureries, maisons, coffres à cadenas. Lunette de fusil, poignée droite, laser et silencieux standard." },
        artisanal:  { label: 'Artisanal',     color: '#60a5fa', desc: "Étagères, garages et boîtes à outils. Uniquement le silencieux filtre à huile." },
        unique:     { label: 'Unique',        color: '#a3e635', desc: "Spawns avec une liste spéciale (souvent une seule lunette, ou des accessoires de forces spéciales)." },
        perso:      { label: 'Lâché par un infecté', color: '#f472b6', desc: "Accessoires lâchés par des infectés uniques : Hitman, Technolord magenta, Navy SEAL, Snake…" },
        casino:     { label: 'Casino',        color: '#facc15', desc: "Le jackpot de la machine à sous du casino peut donner des accessoires de forces spéciales." },
        mixte:      { label: 'Mixte',         color: '#c4b5fd', desc: "Spawns qui mélangent plusieurs grades." },
        inconnu:    { label: 'Pas encore documenté', color: '#cbd5e1', desc: "Spawns repérés par les joueurs, mais le contenu exact n'est pas encore confirmé." }
    };
    const SLOTS = { Optique: { label: 'Optiques', color: '#22d3ee' }, Canon: { label: 'Canon (silencieux)', color: '#38bdf8' }, 'Sous-canon': { label: 'Sous-canon (poignées, lasers)', color: '#67e8f9' } };

    // Infos en plus pour chaque accessoire (modèle réel, comment l'avoir, astuce)
    const INFO = {
        'cqr':           { model: 'Aimpoint CompM2 (M68 CCO)', page: 'Attachments_(Apocalypse_Rising_2)', how: "Mallettes de grade militaire (Naval Air Station, docks OTAN de Magnolia, hélicos). Aussi sur certains spawns mixtes du casino et de la centrale.", tip: "Point rouge très lisible : parfait pour les combats rapprochés et moyens." },
        'holo':          { model: 'EOTECH XPS3-1', how: "Grade militaire. Spawn unique sur une étagère de la Naval Air Station et à la tour de la caserne de pompiers d'Ashland.", tip: "Même bonus que le CQR, mais réticule plus large : le plus simple pour viser vite." },
        'kobra':         { model: 'Axion Kobra EKP-1S-03', how: "Grade soviétique : tentes et tables soviétiques, Coastal Bunkers, relais soviétique, Mansion. Aussi dans le Camp soviétique de milice.", tip: "Réticule en T, idéal sur les AK." },
        'soviet-reflex': { model: 'OKP-7', how: "Grade soviétique, comme le Kobra.", tip: "Zoome un tout petit peu plus que les autres viseurs 1x." },
        'reflex':        { model: 'Walther MRS', how: "Grade militaire et quelques spawns mixtes (centrale géothermique).", tip: "Réticule rond avec croix : bon pour le tir au jugé rapide." },
        'ocr':           { model: 'Trijicon ACOG 4x32', how: "Grade militaire, spawns uniques (épave du Destroyer, table de la Naval Air Station) et jackpot du casino.", tip: "La meilleure lunette moyenne portée sur les fusils OTAN." },
        'pelican':       { model: 'Elcan C79 (Specter)', how: "Grade militaire uniquement.", tip: "Zoom 3.4x : un peu moins fort que l'OCR, champ de vision plus large." },
        'prism':         { model: 'SUSAT', how: "Grade militaire, spawn unique de l'épave du Destroyer et jackpot du casino.", tip: "Lunette 4x britannique, aussi bonne que l'OCR." },
        'rifle-scope':   { model: 'Lunette de chasse 6x', how: "L'accessoire le plus facile à trouver : grade civil (commissariats, armureries, maisons) et beaucoup de spawns uniques (garages, centrale, Destroyer). Aussi lâchée par l'infanterie WW2 d'Eden.", tip: "Zoom 6x pour le sniper. La visée est un peu plus lente." },
        'oil-filter':    { model: 'Silencieux artisanal (filtre à huile)', how: "Grade artisanal : étagères de garage, boîtes à outils, cabanes, centrale géothermique.", tip: "Facile à trouver, mais il réduit beaucoup la portée et la vitesse de visée. À remplacer dès que possible." },
        'std-sup':       { model: 'Silencieux standard', how: "Grade civil (commissariats, armureries). Lâché aussi par le Hitman et par Snake (Saint-Valentin).", tip: "Bon silencieux de départ : discret, visée moyennement ralentie." },
        'mil-sup':       { model: 'Silencieux militaire', how: "Grade militaire : Naval Air Station, docks OTAN, Radio Station, bunker de Halsey. Peut aussi être lâché par l'infecté Rogue.", tip: "Le meilleur compromis discrétion / maniabilité facile à trouver." },
        'heavy-sup':     { model: 'Silencieux lourd', how: "Rare : certaines mallettes à accessoires seulement (hélico des docks OTAN, magasin de surplus de Beaufort, maison kimono de Salem).", tip: "Réduit un peu le recul, mais ralentit beaucoup la visée." },
        'soviet-mil-sup':{ model: 'PBS-1', how: "Grade soviétique : tentes, tables et caisses soviétiques, salle du braquage de Beaufort.", tip: "L'équivalent soviétique du silencieux militaire." },
        'pro-sup':       { model: 'SilencerCo Osprey', how: "Uniquement avec le M1911 F/A, lâché par l'infecté Hitman (maison de luxe de Fairview, Obsidian Club, toit du casino).", tip: "Réduit le recul. Il ne se monte que sur le M1911 F/A." },
        'nato-sup':      { model: 'KAC QDSS-NT4', how: "Avec l'Operator M4A1, dans les mallettes militaires, au casino (jackpot) et sur les spawns uniques de la Naval Air Station et du Destroyer.", tip: "Un des meilleurs silencieux : recul réduit, visée peu ralentie." },
        'spetsnaz-sup':  { model: 'PBS-4', how: "Avec les OTs-14 Groza du Camp de bandits Spetsnaz (événement aléatoire), dans la chambre de la Mansion, sur les sacs de sable soviétiques et dans la salle du braquage de Beaufort.", tip: "La version soviétique du silencieux OTAN." },
        'laser':         { model: 'Laser sous le canon', how: "Grade civil : commissariats, coffres à cadenas, mallettes jaunes. Très courant.", tip: "Donne de la précision au jugé et de la vitesse de visée. Top pour les pistolets." },
        'green-laser':   { model: 'Laser vert haute technologie', how: "Lâché uniquement par un infecté Navy SEAL unique aux docks de Magnolia (la variante blonde, d'après le wiki).", tip: "Le meilleur accessoire sous-canon du jeu." },
        'pink-laser':    { model: 'Laser rose', how: "Lâché par le Technolord magenta, qui apparaît à l'événement Party Trailer ou à l'Obsidian Room de Salem.", tip: "Presque aussi bon que le laser vert, et plus stylé." },
        'folding-grip':  { model: 'Poignée repliable', how: "Spawns mixtes et militaires (centrale géothermique, tente de Beaufort, tour du Lumber Yard), table de la Naval Air Station et jackpot du casino.", tip: "Visée beaucoup plus rapide : idéale pour les SMG." },
        'short-grip':    { model: 'Poignée courte (forces spéciales)', how: "Uniquement sur les spawns d'accessoires de forces spéciales : table de la Naval Air Station, coffre-fort du Destroyer, jackpot du casino.", tip: "La meilleure poignée contre le recul." },
        'straight-grip': { model: 'Poignée droite', how: "Grade civil : très courante (mallettes jaunes, coffres à cadenas, docks).", tip: "Réduit le recul. Facile à trouver, bonne en début de partie." },
        'angled-grip':   { model: 'Poignée inclinée', how: "Ajoutée le 5 novembre 2026 : les spawns ne sont pas encore documentés sur le wiki.", tip: "Les bonus affichés sont des estimations en attendant les valeurs officielles." }
    };

    // Contenants où l'on trouve des accessoires
    const CONTAINERS = [
        ['sp-12', 'Mallette jaune (Equipment Case)', "Contient toujours un accessoire. C'est le contenant le plus courant."],
        ['sp-42', 'Coffre à cadenas (Lock Box)', "Souvent caché derrière ou sous un coffre-fort."],
        ['sp-47', 'Petite boîte à outils', "Peut contenir un silencieux filtre à huile ou une lunette."],
        ['sp-9',  'Sur ou dans un coffre-fort', "Regarde toujours sur le dessus des coffres-forts."],
        ['sp-86', "Sur une caisse d'armes verte", "Les Military Shipping Crates ont parfois un accessoire posé dessus."],
        ['sp-87', 'Lâché par un infecté', "Certains infectés uniques lâchent un accessoire en mourant."]
    ];

    // 120 spawns documentés (carte du wiki). Coordonnées converties dans le repère de la carte du site.
    // g = grade, t = description, n = lieu le plus proche, i = accessoires possibles, img = photo du spawn
    const SPAWNS = [{"id":"1","g":"civil","x":540.5,"y":632.8,"t":"Mallette jaune du sous-sol du commissariat","en":"Civilian Grade: PD Basement","n":"Ashland","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-1"},{"id":"2","g":"sovietique","x":745.6,"y":198.2,"t":"Dans les tentes","en":"Soviet Grade: In the tents","n":"Magnolia","i":["soviet-mil-sup","soviet-reflex","kobra"],"img":"sp-2"},{"id":"4","g":"militaire","x":743.9,"y":142.0,"t":"Dans la tente","en":"Military Grade: In the tent","n":"Magnolia (dock OTAN)","i":["mil-sup","nato-sup","reflex","cqr","holo","ocr","prism","pelican"],"img":""},{"id":"5","g":"sovietique","x":274.0,"y":286.4,"t":"Tente, sur les sacs de sable","en":"Soviet Grade: In the tent, on the sandbags","n":"Water Treatment Plant","i":["soviet-mil-sup","spetsnaz-sup","soviet-reflex","kobra"],"img":"sp-5"},{"id":"6","g":"perso","x":748.0,"y":393.2,"t":"Obsidian Club : lâché par le Technolord magenta","en":"Personalized Grade: Obsidian Club","n":"Obsidian Room","i":["pink-laser"],"img":"sp-6"},{"id":"7","g":"civil","x":38.5,"y":412.3,"t":"Mallette jaune cachée du camp de pêche","en":"Civilian Grade: Hidden Yellow Case","n":"Fishing Camp","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-7"},{"id":"8","g":"militaire","x":623.9,"y":351.1,"t":"Mallette jaune du petit hangar","en":"Military Grade: Small Hangar's yellow case","n":"Naval Air Station","i":["mil-sup","nato-sup","reflex","cqr","holo","ocr","prism","pelican"],"img":"sp-8"},{"id":"9","g":"civil","x":519.8,"y":310.5,"t":"Mallette jaune sur un coffre-fort","en":"Civilian Grade: Yellow Case on top of safe","n":"Veteran Memorabilia House","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-9"},{"id":"10","g":"unique","x":848.8,"y":261.7,"t":"Caisse dans la chambre principale","en":"Unique Grade: In top of the crate of the bedroom","n":"Mansion","i":["soviet-mil-sup","spetsnaz-sup","soviet-reflex","kobra"],"img":"sp-10"},{"id":"11","g":"perso","x":336.0,"y":356.4,"t":"Maison de luxe : lâché par l'infecté Hitman","en":"Personalized grade: Luxury House","n":"Fairview","i":["pro-sup"],"img":"sp-11"},{"id":"12","g":"militaire","x":623.1,"y":365.9,"t":"Mallette jaune","en":"Military Grade: Yellow Case","n":"Naval Air Station","i":["mil-sup","nato-sup","reflex","cqr","holo","ocr","prism","pelican"],"img":"sp-12"},{"id":"13","g":"militaire","x":599,"y":333.2,"t":"Placard secret de la tour de contrôle","en":"Military Grade: ATC Secret Spawn","n":"Naval Air Station","i":["mil-sup","nato-sup","reflex","cqr","holo","ocr","prism","pelican"],"img":"sp-13"},{"id":"14","g":"perso","x":744.8,"y":391.7,"t":"Obsidian Night Club : lâché par l'infecté Hitman","en":"Customized Grade: Obsidian Night Club","n":"Obsidian Room","i":["std-sup","pro-sup"],"img":"sp-14"},{"id":"15","g":"civil","x":565,"y":617,"t":"Mallette jaune (immeuble)","en":"Civilian Grade: Yellow Case","n":"Ashland","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-15"},{"id":"16","g":"civil","x":565.2,"y":605,"t":"Mallette jaune de l'armurerie","en":"Civilian Grade: Yellow Case in Gunstore","n":"Ashland","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-16"},{"id":"17","g":"militaire","x":606.5,"y":365.5,"t":"Mallette jaune du bâtiment médical","en":"Military Grade: Yellow Case in Medical Building","n":"Naval Air Station","i":["mil-sup","nato-sup","reflex","cqr","holo","ocr","prism","pelican"],"img":"sp-17"},{"id":"18","g":"militaire","x":611.2,"y":348,"t":"Mallette jaune près de l'hélico","en":"Military Grade: Yellow case at Helicopter","n":"Naval Air Station","i":["mil-sup","nato-sup","reflex","cqr","holo","ocr","prism","pelican"],"img":"sp-18"},{"id":"19","g":"mixte","x":614.8,"y":351.2,"t":"Mallette du grand hangar","en":"Mixed Grade: Yellow Case","n":"Naval Air Station","i":["rifle-scope"],"img":"sp-19"},{"id":"20","g":"civil","x":728.3,"y":240.4,"t":"Mallette jaune de l'armurerie du commissariat","en":"Civilian Grade: Yellow case at PD Armory","n":"Magnolia","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-20"},{"id":"21","g":"civil","x":732.2,"y":239.9,"t":"Mallette jaune du sous-sol du commissariat (contrebande)","en":"Civilian Grade: Yellow Case at PD Basement","n":"Magnolia","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-21"},{"id":"22","g":"militaire","x":745.2,"y":146.7,"t":"Mallette jaune dans l'hélico (dock OTAN)","en":"Military Grade: Yellow case in helicopter.","n":"Magnolia (dock OTAN)","i":["heavy-sup","mil-sup","nato-sup","reflex","cqr","holo","ocr","prism","pelican"],"img":"sp-22"},{"id":"23","g":"inconnu","x":735.4,"y":189.9,"t":"Mallette secrète","en":"Unknown Grade: Secret Case","n":"Magnolia","i":["std-sup"],"img":"sp-23"},{"id":"24","g":"sovietique","x":735,"y":186.9,"t":"Comptoir de la pièce cachée (1er étage)","en":"Soviet Grade: Second Floor Hidden Room's Counter","n":"Magnolia","i":["soviet-mil-sup","soviet-reflex","kobra"],"img":"sp-24"},{"id":"25","g":"artisanal","x":510.7,"y":323.5,"t":"Sur l'étagère","en":"Makeshift Grade: On the shelf.","n":"Veteran Memorabilia House","i":["oil-filter"],"img":"sp-25"},{"id":"26","g":"civil","x":548.4,"y":722.8,"t":"Mallette jaune sous l'escalier","en":"Civilian Grade: Yellow Case under the stairs","n":"Lighthouse","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-26"},{"id":"27","g":"civil","x":733.8,"y":320.8,"t":"Bureau du gérant du diner","en":"Civilian Grade: On the Manager's table.","n":"Salem","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-27"},{"id":"28","g":"civil","x":764.2,"y":599.5,"t":"Boîte noire sur les bottes de foin","en":"Civilian Grade: Black box on top of haybales","n":"Eden","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-28"},{"id":"29","g":"sovietique","x":555.8,"y":635.7,"t":"Table basse de la bibliothèque","en":"Soviet Grade: Coffee table in the library","n":"Ashland","i":["soviet-mil-sup","soviet-reflex","kobra"],"img":"sp-29"},{"id":"30","g":"casino","x":634.8,"y":181.5,"t":"Machine à sous du casino (jackpot)","en":"Casino: JACKPOT!!!","n":"Casino","i":["nato-sup","ocr","prism","folding-grip","short-grip"],"img":"sp-30"},{"id":"31","g":"perso","x":629.1,"y":176,"t":"Hitman sur le toit","en":"Customized Grade: Hitman on the roof.","n":"Casino","i":["std-sup","pro-sup"],"img":"sp-31"},{"id":"32","g":"sovietique","x":588,"y":162.5,"t":"Table de la grotte « The Boss »","en":"Soviet Grade: On the table in \"The Boss\" Cave.","n":"Casino","i":["soviet-mil-sup","soviet-reflex","kobra"],"img":"sp-32"},{"id":"33","g":"civil","x":111.0,"y":407.1,"t":"Grotte des cultistes","en":"Civilian Grade: Cultist Cave","n":"Observatory","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-33"},{"id":"35","g":"artisanal","x":827.5,"y":314,"t":"Cabane du marais","en":"Makeshift Grade: Cabin","n":"Swamp","i":["oil-filter"],"img":"sp-35"},{"id":"36","g":"sovietique","x":490.2,"y":442,"t":"Armurerie cachée de l'entrepôt","en":"Soviet Grade: Hidden armory in Storage Facility.","n":"Junkyard","i":["soviet-mil-sup","soviet-reflex","kobra"],"img":"sp-36"},{"id":"37","g":"civil","x":449.0,"y":491.6,"t":"Mallette jaune (maison de musique)","en":"Civilian Grade: Yellow case","n":"Junkyard","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-37"},{"id":"38","g":"sovietique","x":775.2,"y":307.8,"t":"Caisse d'armes de la vieille chapelle","en":"Soviet Grade: Old Chapel's Weapon Crate","n":"Old Chapel","i":["soviet-mil-sup","soviet-reflex","kobra"],"img":"sp-38"},{"id":"39","g":"militaire","x":737.5,"y":191.0,"t":"Mallette jaune sur le toit","en":"Military Grade: Yellow Case on the roof","n":"Magnolia","i":["mil-sup","nato-sup","reflex","cqr","holo","ocr","prism","pelican"],"img":"sp-39"},{"id":"41","g":"civil","x":130.8,"y":520.8,"t":"Caisse sur un coffre-fort","en":"Civilian Grade: Crate on top of safe.","n":"Ranger Station","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-41"},{"id":"42","g":"civil","x":118.8,"y":587.8,"t":"Coffre à cadenas derrière un coffre-fort","en":"Civilian Grade: Lock Box behind safe","n":"Military Relay","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-42"},{"id":"43","g":"unique","x":414.7,"y":265.3,"t":"Coffre-fort sous la caisse d'armes","en":"Unique Grade: Safe under the weapon crate","n":"Destroyer Shipwreck","i":["nato-sup","ocr","prism","short-grip"],"img":"sp-43"},{"id":"44","g":"artisanal","x":128.9,"y":566.0,"t":"Boîte en métal cachée dans le foin","en":"Makeshift Grade: Metal Box hidden in the hay","n":"Ranger Station","i":["oil-filter"],"img":"sp-44"},{"id":"45","g":"militaire","x":404.8,"y":248.0,"t":"Mallette de l'armurerie","en":"Military Grade: Yellow case in armory","n":"Destroyer Shipwreck","i":["mil-sup","nato-sup","holo","reflex","cqr","ocr","prism","pelican"],"img":"sp-45"},{"id":"46","g":"unique","x":615,"y":329.5,"t":"Sur la table","en":"Unique Grade: On the table","n":"Naval Air Station","i":["nato-sup","ocr","folding-grip","short-grip"],"img":"sp-46"},{"id":"47","g":"artisanal","x":131.5,"y":389.1,"t":"Boîte à outils de la salle électrique (tunnel)","en":"Makeshift Grade: Toolbox in the electric room","n":"Trapper's Shack","i":["oil-filter"],"img":"sp-47"},{"id":"48","g":"unique","x":847.1,"y":263.9,"t":"Lunette posée sur une boîte","en":"Unique Grade: Rifle Scope on top of a box.","n":"Mansion","i":["rifle-scope"],"img":"sp-48"},{"id":"49","g":"civil","x":691.5,"y":193.5,"t":"Armurerie de Magnolia","en":"Civilian grade","n":"Magnolia","i":["rifle-scope","straight-grip","laser","std-sup"],"img":""},{"id":"50","g":"civil","x":455.8,"y":437,"t":"Coffre à cadenas derrière un coffre-fort","en":"Civilian Grade: Lock Box behind safe","n":"Junkyard","i":["laser","std-sup","rifle-scope","straight-grip"],"img":"sp-50"},{"id":"51","g":"militaire","x":631.5,"y":650.9,"t":"Coffre à cadenas secret de Lockport","en":"Military Grade: Secret Lockbox at Lockport","n":"Lockport","i":["laser","mil-sup","cqr","straight-grip"],"img":"sp-51"},{"id":"52","g":"sovietique","x":986.5,"y":561.5,"t":"Sur la table","en":"Soviet Spawn: Spawns on top of table.","n":"Coastal Bunkers","i":["soviet-mil-sup","soviet-reflex","kobra"],"img":"sp-52"},{"id":"53","g":"civil","x":737.5,"y":187.0,"t":"Mallette sur un casier en métal (pièce secrète)","en":"Civilian Grade: Case on top of metal locker.","n":"Magnolia","i":["rifle-scope"],"img":"sp-53"},{"id":"54","g":"sovietique","x":663.9,"y":205.2,"t":"Table du relais soviétique","en":"Soviet Grade: On top of the table in Soviet Relay.","n":"Relais radio soviétique","i":["soviet-mil-sup","soviet-reflex","kobra"],"img":"sp-54"},{"id":"55","g":"inconnu","x":425.2,"y":164.8,"t":"Coffre à cadenas du yacht","en":"Unknown Grade: Lock Box in Yacht","n":"Killer's Cabin","i":["laser"],"img":"sp-55"},{"id":"56","g":"unique","x":568.5,"y":640.2,"t":"Lunette sur l'étagère du garage","en":"Unique Grade: Rifle Scope on the shelf","n":"Ashland","i":["rifle-scope"],"img":"sp-56"},{"id":"57","g":"civil","x":437.5,"y":194.5,"t":"Étagère du sous-sol (cabane du tueur)","en":"Civilian Grade: On the shelf in the basement.","n":"Killer's Cabin","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-57"},{"id":"58","g":"civil","x":756.8,"y":388.2,"t":"Mallette jaune sous la table","en":"Civilian Grade: Yellow Case under the table.","n":"Salem","i":["rifle-scope","straight-grip","laser","std-sup"],"img":""},{"id":"59","g":"inconnu","x":773.9,"y":435.8,"t":"Coffre à cadenas sur l'étagère (maison kimono)","en":"Unknown Grade: Lockbox on the shelf","n":"Salem","i":["heavy-sup","straight-grip"],"img":"sp-59"},{"id":"60","g":"inconnu","x":750.6,"y":390.7,"t":"Mallette jaune près de la table de DJ","en":"Unknown Grade: Yellow Case at DJ system.","n":"Obsidian Room","i":[],"img":"sp-60"},{"id":"61","g":"civil","x":543.8,"y":726.8,"t":"Mallette jaune du sous-sol (maison du gardien du phare)","en":"Civilian Grade: Yellow case in the basement","n":"Lighthouse","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-61"},{"id":"62","g":"militaire","x":325.2,"y":481.8,"t":"Mallette de la salle d'enregistrement","en":"Military Grade","n":"Radio Station","i":["mil-sup","nato-sup"],"img":"sp-62"},{"id":"63","g":"militaire","x":322.5,"y":488.8,"t":"Mallette jaune en haut de l'antenne radio","en":"Military Grade: Yellow Case on top of radio tower","n":"Radio Station","i":["mil-sup"],"img":"sp-63"},{"id":"64","g":"civil","x":406.5,"y":253.2,"t":"Mallette jaune dehors","en":"Civilian Grade: Yellow case outside","n":"Destroyer Shipwreck","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-64"},{"id":"65","g":"civil","x":831.5,"y":416.8,"t":"Spawn secret","en":"Civilian Grade: Secret attachment spawn","n":"Bunker (Swamp)","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-65"},{"id":"66","g":"civil","x":363.5,"y":355.2,"t":"Mallette jaune de la pièce secrète (arcade)","en":"Civilian Grade: Yellow case in hidden room","n":"Fairview","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-66"},{"id":"67","g":"civil","x":360.4,"y":338.2,"t":"Mallette jaune difficile à voir","en":"Civilian Grade: Obstructed yellow case","n":"Fairview","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-67"},{"id":"68","g":"civil","x":370.4,"y":330.3,"t":"Mallette jaune derrière la caisse du magasin","en":"Civilian Grade: Yellow case behind register","n":"Fairview","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-68"},{"id":"69","g":"civil","x":692.8,"y":415.2,"t":"Mallette jaune cachée","en":"Civilian Grade: Hidden yellow case","n":"Salem","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-69"},{"id":"70","g":"civil","x":945,"y":458,"t":"Mallette de l'épave du cargo","en":"Civilian Grade: Yellow case at Cargo Shipwreck","n":"Cargo Shipwreck","i":["laser"],"img":"sp-70"},{"id":"71","g":"mixte","x":863.9,"y":510,"t":"Mallette de la centrale","en":"Mixed: Yellow case in powerplant","n":"Geothermal Power Plant","i":["rifle-scope","oil-filter"],"img":"sp-71"},{"id":"72","g":"civil","x":665.7,"y":690.3,"t":"Cabine de la grue","en":"Civilian Grade: In the operating room at the crane","n":"Lockport","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-72"},{"id":"73","g":"civil","x":889.0,"y":721.8,"t":"Mallette jaune de la tour de guet","en":"Civilian Grade: Yellow case at watch tower","n":"Smuggler Port","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-73"},{"id":"74","g":"civil","x":639.4,"y":676.7,"t":"Mallette jaune sous la table","en":"Civilian Grade: Yellow case under the table","n":"Lockport","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-74"},{"id":"75","g":"civil","x":968.2,"y":736.8,"t":"Spawn secret (sur le jeu de cartes)","en":"Civilian Grade: Hidden attachment spawn","n":"Smuggler Airstrip","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-75"},{"id":"76","g":"civil","x":627.0,"y":184.5,"t":"Mallette jaune cachée (pièce secrète du casino)","en":"Civilian Grade: Hidden yellow case","n":"Casino","i":["rifle-scope","straight-grip","laser","std-sup"],"img":"sp-76"},{"id":"77","g":"inconnu","x":863.4,"y":692.8,"t":"Mallette au fond des mines","en":"Unknown Grade: Yellow case at the deepest part","n":"Mines","i":[],"img":"sp-77"},{"id":"78","g":"inconnu","x":909.2,"y":588.8,"t":"Mallette des anciens labos","en":"Unknown Grade: Yellow case in old labs.","n":"Death Pits","i":[],"img":"sp-78"},{"id":"79","g":"perso","x":749.2,"y":146.5,"t":"Infecté Navy SEAL des docks","en":"Customized Grade: Navy Seal Infected","n":"Magnolia (dock OTAN)","i":["green-laser"],"img":"sp-79"},{"id":"80","g":"civil","x":799.5,"y":361.5,"t":"Planque sous la cabane, à côté du lit","en":"Civilian Grade: Hidden beside the bed","n":"Bunker (Swamp)","i":["laser","rifle-scope"],"img":"sp-80"},{"id":"81","g":"civil","x":783.6,"y":435.1,"t":"Coffre à cadenas du bureau","en":"Civilian Grade: Another Lockbox in the office","n":"Salem","i":["laser"],"img":"sp-81"},{"id":"82","g":"civil","x":521.6,"y":580,"t":"Mallette de la réserve","en":"Civilian Grade: Yellow case in storage room","n":"Ashland","i":["straight-grip"],"img":"sp-82"},{"id":"83","g":"mixte","x":872.2,"y":494.1,"t":"Sur caisse d'armes","en":"Mixed Grade: On top of the weapon crate","n":"Geothermal Power Plant","i":["reflex","cqr","folding-grip","straight-grip"],"img":""},{"id":"84","g":"unique","x":870.6,"y":501.2,"t":"Lunette de fusil","en":"Unique Spawn: Rifle Scope","n":"Geothermal Power Plant","i":["rifle-scope"],"img":""},{"id":"85","g":"unique","x":874.5,"y":494.8,"t":"Lunette sur une boîte en métal","en":"Unique Spawn: Rifle scope on top of metal box","n":"Geothermal Power Plant","i":["rifle-scope"],"img":"sp-85"},{"id":"86","g":"unique","x":394.6,"y":254.2,"t":"Sur la caisse d'armes","en":"Unique Grade: On top of weapon case","n":"Destroyer Shipwreck","i":["rifle-scope"],"img":"sp-86"},{"id":"87","g":"perso","x":782.2,"y":591.3,"t":"Infecté d'infanterie d'Eden","en":"Customized Grade: Rifle Scope dropped by infected","n":"Eden","i":["rifle-scope"],"img":"sp-87"},{"id":"88","g":"civil","x":803.1,"y":202.5,"t":"Mallette jaune des docks en bois","en":"Civilian Grade: Attachment case at the docks","n":"Magnolia","i":["laser","straight-grip"],"img":"sp-88"},{"id":"89","g":"militaire","x":358.9,"y":559.9,"t":"Mallette du bunker","en":"Military Grade: Yellow case in bunker","n":"Fanatic Hideout","i":["mil-sup"],"img":"sp-89"},{"id":"90","g":"mixte","x":643.6,"y":681.5,"t":"Coffre à cadenas secret","en":"Mixed Grade: Secret lock box","n":"Lockport","i":["laser"],"img":""},{"id":"91","g":"civil","x":397.8,"y":568.2,"t":"Mallette jaune dans la remise du garage","en":"Civilian Grade: Yellow case in garage shed","n":"Fanatic Hideout","i":["laser"],"img":"sp-91"},{"id":"92","g":"militaire","x":556.9,"y":591.9,"t":"Tour de la caserne de pompiers","en":"Military Grade: Yellow case at F.S Tower","n":"Ashland","i":["holo"],"img":"sp-92"},{"id":"93","g":"civil","x":564.9,"y":635.3,"t":"Coffre-fort mural de la bijouterie","en":"Civilian Grade: Safe in the wall","n":"Ashland","i":["laser"],"img":"sp-93"},{"id":"94","g":"militaire","x":361.5,"y":558.1,"t":"Bureau du chef du bunker","en":"Military Grade: Chief's Desk","n":"Fanatic Hideout","i":["mil-sup"],"img":"sp-94"},{"id":"95","g":"civil","x":749.1,"y":392.1,"t":"Grand coffre-fort de l'Obsidian Club","en":"Civilian Grade: Big Safe in Obsidian Club","n":"Obsidian Room","i":["straight-grip"],"img":""},{"id":"96","g":"artisanal","x":868.5,"y":508.5,"t":"Silencieux sur les étagères métalliques","en":"Makeshift Grade: Oil Filter on the shelves.","n":"Geothermal Power Plant","i":["oil-filter"],"img":"sp-96"},{"id":"97","g":"sovietique","x":983.9,"y":565.6,"t":"Table près de la caisse d'armes","en":"Soviet Grade: Table close to weapon crate","n":"Coastal Bunkers","i":["soviet-reflex","kobra","soviet-mil-sup"],"img":""},{"id":"98","g":"sovietique","x":977.8,"y":552.3,"t":"Table de la caserne","en":"Soviet Grade: on table in the barracks","n":"Coastal Bunkers","i":["soviet-reflex","kobra","soviet-mil-sup"],"img":""},{"id":"99","g":"civil","x":135.6,"y":713.6,"t":"Coffre à cadenas sous le lit","en":"Civilian Grade: Lockbox under the bed","n":"Huron","i":["straight-grip"],"img":""},{"id":"100","g":"inconnu","x":651.9,"y":664.2,"t":"Mallette jaune cachée","en":"Unknown Grade: Hidden yellow case","n":"Lockport","i":[],"img":"sp-100"},{"id":"101","g":"civil","x":907.9,"y":378.0,"t":"Sous la pile de pneus (planque du FBI)","en":"Civilian Grade: Hidden below the stack of tires","n":"Cargo Shipwreck","i":["laser","holo"],"img":"sp-101"},{"id":"102","g":"civil","x":870,"y":351,"t":"Sous le pont","en":"Civilian Grade: Under the bridge.","n":"Swamp","i":["rifle-scope","straight-grip"],"img":""},{"id":"103","g":"inconnu","x":781.5,"y":400.7,"t":"Clocher de l'église","en":"Unknown Grade: Salem Church Tower","n":"Salem","i":[],"img":"sp-103"},{"id":"104","g":"inconnu","x":767.5,"y":420.9,"t":"Pièce secrète de la grande maison","en":"Unknwn Grade: Secret Room","n":"Salem","i":[],"img":"sp-104"},{"id":"105","g":"inconnu","x":382.1,"y":680.3,"t":"Coffre à cadenas du sous-sol","en":"Unknown Grade: Basement Lockbox","n":"","i":["straight-grip"],"img":"sp-105"},{"id":"106","g":"inconnu","x":239.8,"y":554.3,"t":"Mallette jaune de la pièce secrète","en":"Unknown Grade: Secret Room Attachment Box","n":"Lumber Yard","i":[],"img":"sp-106"},{"id":"107","g":"inconnu","x":191.5,"y":426.9,"t":"Mallette du magasin de surplus","en":"Unknown Grade: Attachment Box in Surplus Store","n":"Beaufort","i":["heavy-sup"],"img":""},{"id":"108","g":"perso","x":585.2,"y":517.9,"t":"Snake (Saint-Valentin) : M1911 modifié","en":"Customized Grade: Standard Suppressor by Snake","n":"Boat Ramp","i":["std-sup"],"img":""},{"id":"109","g":"unique","x":617.9,"y":329.5,"t":"Sur l'étagère","en":"Unique Grade: On the shelf","n":"Naval Air Station","i":["holo"],"img":""},{"id":"110","g":"militaire","x":175,"y":430.5,"t":"Mallette dans la tente","en":"Military Grade: Attachment Case in tent","n":"Beaufort","i":["folding-grip","straight-grip"],"img":""},{"id":"111","g":"militaire","x":183.8,"y":417.4,"t":"Coffre de Beaufort","en":"Military Grade: Beaufort Vault","n":"Beaufort","i":["laser","straight-grip"],"img":""},{"id":"112","g":"sovietique","x":185.0,"y":415.0,"t":"Salle du braquage de banque","en":"Soviet Grade: Bank robbery room, on weapon crates","n":"Beaufort","i":["soviet-mil-sup","spetsnaz-sup"],"img":"sp-112"},{"id":"113","g":"artisanal","x":860.2,"y":263.8,"t":"Étagère du garage","en":"Makeshift Grade: Garage shelf","n":"Mansion","i":["oil-filter"],"img":"sp-113"},{"id":"114","g":"civil","x":463,"y":732.8,"t":"Boîte à outils du garage","en":"Civilian Grade: Small toolbox in garage","n":"Lighthouse","i":["rifle-scope"],"img":"sp-114"},{"id":"115","g":"artisanal","x":702.2,"y":530.2,"t":"Bibliothèque du 1er étage","en":"Makeshift Grade: Bookshelf in 2nd floor","n":"Grain Elevator","i":["oil-filter"],"img":"sp-115"},{"id":"116","g":"militaire","x":438.1,"y":600.9,"t":"Caisse d'armes dans la tente","en":"Military Grade: Weapon case in tent","n":"Ashland Suburbs","i":["cqr"],"img":""},{"id":"117","g":"inconnu","x":743.5,"y":501,"t":"Caisse d'armes sur les bottes de foin","en":"Unknown Grade: Weapon case on haybales","n":"Grain Elevator","i":[],"img":"sp-117"},{"id":"118","g":"inconnu","x":124,"y":451.4,"t":"Mallette à côté du coffre-fort","en":"Unknown Grade: Case next to safe","n":"Observatory","i":[],"img":"sp-118"},{"id":"119","g":"mixte","x":634.3,"y":181.3,"t":"Sur un tabouret","en":"Mixed Grade: On top of a stool","n":"Casino","i":["laser","cqr"],"img":""},{"id":"120","g":"militaire","x":251.2,"y":565,"t":"Caisse d'armes de la tour","en":"Military Grade: Tower Weapons Case","n":"Lumber Yard","i":["folding-grip"],"img":"sp-120"},{"id":"121","g":"civil","x":968.0,"y":756.8,"t":"Chaise suspendue de la piste","en":"Unknown Grade: Smuggler Airstrip Hanging Chair","n":"Smuggler Airstrip","i":["straight-grip"],"img":"sp-121"},{"id":"122","g":"inconnu","x":726.3,"y":398.7,"t":"Garage de la caserne de pompiers de Salem","en":"Unknown Grade: Salem Fire Station Garage","n":"Salem","i":[],"img":"sp-122"},{"id":"123","g":"civil","x":483.7,"y":488.6,"t":"Chaise de salle à manger (maison bleue)","en":"Civilian Grade: Dining Chair","n":"Junkyard","i":["rifle-scope"],"img":""}];
    const RET = new Set(["cqr", "holo", "kobra", "soviet-reflex", "reflex", "ocr", "pelican", "prism", "rifle-scope"]);

    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pct = v => v >= .995 ? '100 %' : v <= 0 ? '0 %' : v < .01 ? '< 1 %' : (v < .1 ? (Math.round(v * 1000) / 10).toString().replace('.', ',') : Math.round(v * 100)) + ' %';
    const atts = () => (typeof ALL_ITEMS !== 'undefined' ? ALL_ITEMS.filter(i => i.type === 'attachment') : []);
    const att = id => atts().find(a => a.id === id);
    const nm = a => String(a.name).replace(/<[^>]+>/g, '');
    const pic = (id, cls) => typeof itemImgInfo === 'function' && itemImgInfo(id) && typeof itemPic === 'function' ? itemPic(id, cls) : '';
    const imgOk = k => SPAWN_IMGS.has(k);
    const SPAWN_IMGS = new Set(SPAWNS.filter(s => s.img).map(s => s.img));

    // ---------- Probabilités (estimations) ----------
    const KNOWN = SPAWNS.filter(s => s.i.length);
    // Un infecté ne lâche pas toujours son accessoire et le jackpot du casino est rare : ces spawns comptent moins
    const WEIGHT = { perso: .25, casino: .2 };
    const pOf = s => (WEIGHT[s.g] || 1) / s.i.length;
    let _st = null;
    function allStats() {
        if (_st) return _st;
        const m = {};
        atts().forEach(a => { m[a.id] = { spots: [], share: 0, perBox: 0, grades: {} }; });
        KNOWN.forEach(s => s.i.forEach(id => { const o = m[id]; if (!o) return; o.spots.push(s); o.share += pOf(s); o.grades[s.g] = (o.grades[s.g] || 0) + 1; }));
        const tot = KNOWN.length;
        Object.values(m).forEach(o => {
            o.perBox = o.spots.length ? o.spots.reduce((a, s) => a + pOf(s), 0) / o.spots.length : 0; // chance qu'une caisse où il peut apparaître te le donne
            o.global = tot ? o.share / tot : 0;                                                                  // part de tous les accessoires du jeu
            o.cover = tot ? o.spots.length / tot : 0;                                                            // part des spawns où il peut apparaître
        });
        const rank = Object.entries(m).sort((a, b) => b[1].global - a[1].global);
        rank.forEach(([id, o], i) => { o.rank = o.global > 0 ? i + 1 : null; o.tier = tierOf(o.global); });
        _st = { m, tot, rank };
        return _st;
    }
    function tierOf(g) {
        if (g >= .06) return { label: 'Commun', color: '#4ade80', n: 1 };
        if (g >= .03) return { label: 'Peu commun', color: '#a3e635', n: 2 };
        if (g >= .012) return { label: 'Rare', color: '#facc15', n: 3 };
        if (g > 0) return { label: 'Très rare', color: '#fb923c', n: 4 };
        return { label: 'Inconnu', color: '#94a3b8', n: 5 };
    }
    const RAR_COL = { 'Commun': '#4ade80', 'Peu commun': '#a3e635', 'Rare': '#facc15', 'Très rare': '#fb923c' };

    // Armes compatibles
    function compat(a) {
        const w = typeof ALL_ITEMS !== 'undefined' ? ALL_ITEMS.filter(i => i.type === 'weapon' && i.attach && i.attach !== 'Aucun') : [];
        if (a.id === 'pro-sup') return w.filter(x => x.id === 'm1911-f-a');
        const isLaser = /laser/.test(a.id);
        return w.filter(x => {
            const t = x.attach;
            if (a.slot === 'Optique') return /Viseur/.test(t);
            if (a.slot === 'Canon') return /Silencieux/.test(t);
            return isLaser ? /Laser|Poignée/.test(t) : /Poignée/.test(t);
        });
    }
    // Infectés qui lâchent l'accessoire (lu dans la fiche des boss)
    function droppers(a) {
        if (typeof BOSS_DATA === 'undefined') return [];
        const n = nm(a).toLowerCase();
        return BOSS_DATA.filter(b => [...(b.g || []), ...(b.r || []), ...(b.c || [])].some(x => String(x).toLowerCase().includes(n)));
    }
    // Événements aléatoires où il apparaît
    function events(a) {
        if (!window.AR2Events) return [];
        return AR2Events.EVENTS.filter(e => e.lootList.some(x => x[0] === '@' + a.id));
    }

    // ---------- Mini-carte ----------
    function miniMap(list, opts = {}) {
        if (typeof MAP_DATA === 'undefined') return '';
        const P = MAP_DATA.paths, hl = opts.hl;
        const dots = list.map(s => {
            const c = (GRADES[s.g] || GRADES.inconnu).color, on = hl === s.id;
            return `<g data-acc-sp="${s.id}" class="cursor-pointer" transform="translate(${s.x} ${s.y})"><title>${esc(s.t)}${s.n ? ' – ' + esc(s.n) : ''}</title>
                <circle r="${on ? 17 : 11}" fill="${c}" opacity="${on ? .35 : .18}"/><circle r="${on ? 8 : 5.5}" fill="${c}" stroke="#0b0f14" stroke-width="2"/></g>`;
        }).join('');
        const labels = (MAP_DATA.locations || []).filter(l => l.cat === 'ville').map(l => `<text x="${l.x}" y="${l.y}" text-anchor="middle" font-size="17" font-weight="800" fill="#ffffff" opacity=".5" font-family="Inter,sans-serif" pointer-events="none">${esc(String(l.name).replace(/<[^>]+>/g, ''))}</text>`).join('');
        return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto block rounded-xl bg-[#0b1620] border border-tactical-border" role="img" aria-label="Carte des spawns">
            <path d="${P.land}" fill="#1c2a22" stroke="#3b5244" stroke-width="2"/><path d="${P.sand}" fill="#2a2a1e"/><path d="${P.forest}" fill="#17251c"/><path d="${P.lakes}" fill="#0b1620"/>
            <path d="${P.roads}" fill="none" stroke="#3a4048" stroke-width="2.2"/>${labels}${dots}</svg>`;
    }

    // ---------- Rendu ----------
    let aSlot = 'tous', aQ = '', aSort = 'global', aOpen = null, aMapG = 'tous', aSel = null;
    function statBar(label, v, max = 3) {
        const pos = v > 0, w = Math.round(Math.abs(v) / max * 50);
        const c = v === 0 ? '#64748b' : pos ? '#4ade80' : '#f87171';
        return `<div class="flex items-center gap-2 text-[11px]"><span class="w-[92px] shrink-0 text-white/70">${label}</span>
            <div class="relative flex-1 h-2 rounded-full bg-tactical-bg border border-tactical-border overflow-hidden"><span class="absolute top-0 bottom-0 left-1/2 w-px bg-white/25"></span>
            <span class="absolute top-0 bottom-0 rounded-full" style="background:${c};${pos ? 'left:50%' : 'right:50%'};width:${w}%"></span></div>
            <b class="w-6 text-right font-mono" style="color:${c}">${v > 0 ? '+' : ''}${v}</b></div>`;
    }
    function stats4(a) {
        return statBar('Vitesse de visée', a.aimSpeed || 0) + statBar('Contrôle recul', a.recoilCtrl || 0) + statBar('Précision hanche', a.hipfire || 0) + statBar('Précision visée', a.aimAcc || 0);
    }
    function gradeChips(o, small) {
        return Object.entries(o.grades).sort((x, y) => y[1] - x[1]).map(([g, n]) => { const G = GRADES[g] || GRADES.inconnu; return `<span class="ev-badge" style="color:${G.color};border-color:${G.color}66;background:${G.color}12" title="${esc(G.desc)}">${esc(G.label)}${small ? '' : ' · ' + n}</span>`; }).join('');
    }
    function filtered() {
        const q = aQ.toLowerCase(), S = allStats().m;
        let l = atts().filter(a => (aSlot === 'tous' || a.slot === aSlot) && (!q || (nm(a) + ' ' + (INFO[a.id] || {}).model + ' ' + a.description + ' ' + (INFO[a.id] || {}).how + ' ' + (S[a.id] ? S[a.id].spots.map(s => s.n + ' ' + s.t).join(' ') : '')).toLowerCase().includes(q)));
        const f = {
            global: (x, y) => (S[y.id].global - S[x.id].global),
            rare: (x, y) => (S[x.id].global || 9) - (S[y.id].global || 9),
            spots: (x, y) => S[y.id].spots.length - S[x.id].spots.length,
            aim: (x, y) => (y.aimSpeed - x.aimSpeed),
            recoil: (x, y) => (y.recoilCtrl - x.recoilCtrl),
            name: (x, y) => nm(x).localeCompare(nm(y))
        }[aSort];
        return l.sort(f);
    }
    function card(a) {
        const o = allStats().m[a.id], I = INFO[a.id] || {}, sl = SLOTS[a.slot] || SLOTS.Optique, rc = RAR_COL[a.rarity] || '#94a3b8';
        return `<article class="ev-card bg-tactical-card border border-tactical-border rounded-2xl overflow-hidden flex flex-col" style="border-top:3px solid ${sl.color}">
            <button type="button" data-acc-open="${a.id}" class="ev-hero relative block w-full aspect-[16/9] bg-gradient-to-b from-tactical-bg to-tactical-card overflow-hidden" title="Tout savoir">
                <span class="absolute inset-0 flex items-center justify-center acc-cover">${pic(a.id) || '<span class="text-tactical-muted text-xs">Pas d\'image</span>'}</span>
                <span class="absolute left-2 top-2 ev-badge" style="color:${sl.color};border-color:${sl.color}66;background:#000a">${esc(a.slot === 'Sous-canon' ? 'Sous-canon' : a.slot)}${a.zoom && a.zoom !== '—' ? ' · ' + esc(a.zoom) : ''}</span>
                ${a.silent ? '<span class="absolute right-2 top-2 ev-badge" style="color:#cbd5e1;border-color:#cbd5e166;background:#000a">Silencieux</span>' : ''}
                ${o.rank ? `<span class="absolute right-2 bottom-2 ev-badge" style="color:#fde68a;border-color:#fde68a66;background:#000a" title="Classement : de l'accessoire le plus courant (1) au plus rare">#${o.rank} / ${allStats().rank.filter(r => r[1].rank).length}</span>` : ''}
            </button>
            <div class="p-4 flex flex-col gap-3 flex-1">
                <div><h3 class="text-white text-lg font-extrabold leading-tight">${esc(nm(a))}</h3><div class="text-[11px] font-mono text-tactical-muted">${esc(I.model || '')}</div></div>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="ev-stat" title="Rareté indiquée sur la fiche de l'objet"><i>Rareté</i><b style="color:${rc}">${esc(a.rarity)}</b></div>
                    <div class="ev-stat" title="Nombre de spawns documentés sur la carte du wiki"><i>Spawns</i><b>${o.spots.length || '?'}</b></div>
                    <div class="ev-stat" title="Part estimée de tous les accessoires qui apparaissent dans le jeu"><i>Part du loot</i><b class="text-tactical-accent">${o.global ? pct(o.global) : '?'}</b></div>
                </div>
                <div class="flex flex-col gap-1.5">${stats4(a)}</div>
                <p class="text-xs text-white/80 leading-relaxed">${esc(a.description)}</p>
                ${Object.keys(o.grades).length ? `<div class="flex flex-wrap gap-1">${gradeChips(o, true)}</div>` : ''}
                <div class="mt-auto flex flex-wrap gap-2 pt-1">
                    <button type="button" data-acc-open="${a.id}" class="xh-btn !py-1.5 !px-3 !text-[11px]">Tout savoir</button>
                    ${o.spots.length ? `<button type="button" data-acc-open="${a.id}" data-acc-tomap="1" class="xh-btn !py-1.5 !px-3 !text-[11px]">Voir les ${o.spots.length} spawns</button>` : ''}
                </div>
            </div>
        </article>`;
    }
    function bar(label, v, c, hint) {
        return `<div class="mt-2" ${hint ? `title="${esc(hint)}"` : ''}><div class="flex justify-between gap-2 text-[11px]"><span class="text-white/80">${esc(label)}</span><b class="font-mono shrink-0" style="color:${c}">${pct(v)}</b></div><div class="h-2 rounded-full bg-tactical-bg border border-tactical-border overflow-hidden"><div class="h-full rounded-full" style="width:${Math.max(2, Math.min(100, Math.round(v * 100)))}%;background:${c}"></div></div></div>`;
    }
    function spotRow(s, aId) {
        const G = GRADES[s.g] || GRADES.inconnu, on = aSel === s.id;
        const chance = aId && s.i.length ? pct(pOf(s)) : '';
        return `<button type="button" data-acc-sp="${s.id}" class="w-full text-left flex gap-2 items-center p-1.5 rounded-lg border ${on ? 'border-tactical-accent bg-tactical-accent/10' : 'border-tactical-border bg-tactical-bg/60 hover:border-tactical-muted'}">
            ${s.img ? `<img src="${IMG}${s.img}.webp" alt="" loading="lazy" class="w-16 h-11 object-cover rounded-md shrink-0">` : `<span class="w-16 h-11 rounded-md shrink-0 bg-tactical-card border border-tactical-border flex items-center justify-center text-[9px] text-tactical-muted">pas de photo</span>`}
            <span class="min-w-0 flex-1"><b class="block text-[12px] text-white truncate">${esc(s.t)}</b><span class="block text-[10px] text-tactical-muted truncate">${esc(s.n || 'Lieu isolé')}${typeof gridSquare === 'function' ? ' · case ' + gridSquare(s.x, s.y) : ''}</span>
            <span class="text-[10px] font-bold" style="color:${G.color}">${esc(G.label)}</span></span>
            ${chance ? `<span class="text-right shrink-0"><b class="block font-mono text-xs text-tactical-accent">${chance}</b><span class="text-[9px] text-tactical-muted">${s.i.length} possible${s.i.length > 1 ? 's' : ''}</span></span>` : ''}
        </button>`;
    }
    function spotDetail(s) {
        if (!s) return `<div class="text-xs text-tactical-muted p-3 rounded-xl border border-dashed border-tactical-border">Clique sur un point de la carte ou sur un spawn de la liste pour voir sa photo et ce qu'il peut donner.</div>`;
        const G = GRADES[s.g] || GRADES.inconnu;
        return `<div class="rounded-xl border border-tactical-border bg-tactical-bg/70 overflow-hidden">
            ${s.img ? `<img src="${IMG}${s.img}.webp" alt="${esc(s.t)}" class="w-full max-h-64 object-cover">` : ''}
            <div class="p-3"><div class="flex flex-wrap items-center gap-1.5 mb-1"><span class="ev-badge" style="color:${G.color};border-color:${G.color}66">${esc(G.label)}</span>${typeof gridSquare === 'function' ? `<span class="ev-badge" style="color:#cbd5e1;border-color:#cbd5e155">Case ${gridSquare(s.x, s.y)}</span>` : ''}</div>
            <b class="text-white text-sm">${esc(s.t)}</b><div class="text-[11px] text-tactical-muted">${esc(s.n ? 'Près de ' + s.n : 'Lieu isolé')} · <span class="font-mono">${esc(s.en)}</span></div>
            <div class="ev-sec">Peut donner ${s.i.length ? `<span class="normal-case tracking-normal font-normal">(${WEIGHT[s.g] ? 'drop non garanti, ' : ''}environ ${pct(pOf(s))} pour chacun, estimation)</span>` : ''}</div>
            <div class="flex flex-wrap gap-1.5">${s.i.length ? s.i.map(id => { const a = att(id); return a ? `<button type="button" data-acc-open="${id}" class="ev-loot"><span class="ev-lpic">${pic(id)}</span><span class="truncate">${esc(nm(a))}</span></button>` : ''; }).join('') : '<span class="text-xs text-tactical-muted">Contenu pas encore confirmé par les joueurs.</span>'}</div>
            <button type="button" data-acc-goto="${s.id}" class="mt-3 xh-btn !py-1 !px-2 !text-[10px]">Voir ce lieu sur la grande carte</button></div></div>`;
    }
    function detail(a) {
        const o = allStats().m[a.id], I = INFO[a.id] || {}, sl = SLOTS[a.slot] || SLOTS.Optique, rc = RAR_COL[a.rarity] || '#94a3b8';
        const cw = compat(a), dr = droppers(a), ev = events(a), ret = imgOk('ret-' + a.id) || RET.has(a.id);
        const sel = o.spots.find(s => s.id === aSel) || null;
        const nbG = Object.keys(o.grades).length;
        return `<div class="flex flex-col lg:flex-row gap-5">
            <div class="lg:w-[44%] flex flex-col gap-3 min-w-0">
                <div class="rounded-xl border border-tactical-border overflow-hidden aspect-[16/9] acc-cover">${pic(a.id)}</div>
                ${ret ? `<div class="rounded-xl border border-tactical-border overflow-hidden"><img src="${IMG}ret-${a.id}.webp" alt="Réticule ${esc(nm(a))}" loading="lazy" class="w-full max-h-60 object-cover"><div class="px-3 py-1.5 text-[10px] font-mono text-tactical-muted bg-tactical-bg">Vue dans le viseur (réticule)</div></div>` : ''}
                <div class="ev-prob">
                    <div class="ev-sec !mt-0">Probabilités (estimation)</div>
                    ${o.spots.length ? `
                    ${bar('Part de tous les accessoires du jeu', o.global, 'rgb(var(--t-acc,0 255 136))', 'Sur 100 accessoires trouvés au hasard, combien seraient celui-ci')}
                    ${bar(`Spawns où il peut apparaître (${o.spots.length} sur ${allStats().tot})`, o.cover, '#38bdf8')}
                    ${bar("Chance qu'une de ces caisses te le donne", o.perBox, '#facc15', 'Moyenne : 1 chance sur le nombre d\'accessoires possibles dans la caisse')}
                    ${bar(`En fouillant ses ${o.spots.length} spawns`, 1 - o.spots.reduce((p, s) => p * (1 - pOf(s)), 1), '#a78bfa', 'Chance de le trouver au moins une fois en fouillant tous ses spawns (si chaque spawn contient un accessoire)')}
                    <p class="text-[10px] text-tactical-muted mt-2">Le jeu ne donne aucun taux officiel. Calcul : chaque spawn tire un accessoire de sa liste, à chances égales, d'après les ${allStats().tot} spawns documentés sur la carte du wiki. Les drops d'infectés comptent pour 25 % et le jackpot du casino pour 20 %, car ils ne tombent pas à chaque fois. Un spawn peut aussi être vide.</p>` : `<p class="text-xs text-tactical-muted">Pas assez de données : aucun spawn documenté pour l'instant.</p>`}
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-1.5 mb-1"><span class="ev-badge" style="color:${sl.color};border-color:${sl.color}66">${esc(sl.label)}</span>${a.zoom && a.zoom !== '—' ? `<span class="ev-badge" style="color:#fde68a;border-color:#fde68a66">Zoom ${esc(a.zoom)}</span>` : ''}${a.silent ? '<span class="ev-badge" style="color:#cbd5e1;border-color:#cbd5e166">Pas de traceur, n\'attire pas les infectés</span>' : ''}${a.estimated ? '<span class="ev-badge" style="color:#fb923c;border-color:#fb923c66">Valeurs estimées</span>' : ''}</div>
                <h3 class="text-2xl font-extrabold text-white leading-tight">${esc(nm(a))}</h3>
                <div class="text-xs font-mono text-tactical-muted mb-3">${esc(I.model || '')} • <a href="${WIKI}Attachments_(Apocalypse_Rising_2)" target="_blank" rel="noopener" class="underline hover:text-tactical-accent">page du wiki</a></div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-3">
                    <div class="ev-stat"><i>Rareté</i><b style="color:${rc}">${esc(a.rarity)}</b></div>
                    <div class="ev-stat" title="Rareté calculée à partir des spawns"><i>Rareté réelle</i><b style="color:${o.tier.color}">${o.tier.label}</b></div>
                    <div class="ev-stat"><i>Classement</i><b>${o.rank ? '#' + o.rank : '?'}</b></div>
                    <div class="ev-stat"><i>Armes</i><b>${cw.length}</b></div>
                </div>
                <p class="text-sm text-white/85 leading-relaxed">${esc(a.description)}</p>
                <div class="ev-sec">Effets</div><div class="flex flex-col gap-1.5 max-w-md">${stats4(a)}</div>
                <div class="ev-sec">Où le trouver</div><p class="text-xs text-white/85 leading-relaxed">${esc(I.how || a.loot || '')}</p>
                ${nbG ? `<div class="flex flex-wrap gap-1 mt-2">${gradeChips(o)}</div>` : ''}
                ${dr.length ? `<div class="ev-sec">Lâché par</div><div class="flex flex-wrap gap-1.5">${dr.map(b => `<button type="button" data-acc-boss="${esc(b.id)}" class="xh-btn !py-1 !px-2 !text-[10px]">${esc(b.fr || b.name)}</button>`).join('')}</div>` : ''}
                ${ev.length ? `<div class="ev-sec">Dans les événements aléatoires</div><div class="flex flex-wrap gap-1.5">${ev.map(e => `<button type="button" data-acc-ev="${e.id}" class="xh-btn !py-1 !px-2 !text-[10px]">${esc(e.fr)}</button>`).join('')}</div>` : ''}
                ${I.tip ? `<div class="mt-4 rounded-xl border border-tactical-accent/40 bg-tactical-accent/10 px-3 py-2 text-xs text-white"><b class="text-tactical-accent">Astuce : </b>${esc(I.tip)}</div>` : ''}
                <div class="ev-sec">Armes compatibles <span class="normal-case tracking-normal font-normal">(${cw.length}, clique pour voir l'arme)</span></div>
                <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">${cw.map(w => `<button type="button" data-acc-item="${esc(w.id)}" class="ev-loot"><span class="ev-lpic">${pic(w.id)}</span><span class="truncate">${esc(nm(w))}</span></button>`).join('') || '<span class="text-xs text-tactical-muted">Aucune.</span>'}</div>
            </div>
        </div>
        ${o.spots.length ? `<div class="mt-5"><div class="ev-sec !mt-0">Les ${o.spots.length} spawns documentés <span class="normal-case tracking-normal font-normal">(clique sur un point ou une ligne)</span></div>
            <div class="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-3">
                <div class="flex flex-col gap-3 min-w-0" id="acc-dmap">${miniMap(o.spots, { hl: aSel })}<div id="acc-dsel">${spotDetail(sel)}</div></div>
                <div class="flex flex-col gap-1.5 max-h-[640px] overflow-y-auto pr-1">${o.spots.slice().sort((x, y) => x.i.length - y.i.length || (x.n || '').localeCompare(y.n || '')).map(s => spotRow(s, a.id)).join('')}</div>
            </div></div>` : ''}`;
    }

    function rankTable() {
        const S = allStats(), l = S.rank.filter(r => r[1].global > 0), mx = l[0] ? l[0][1].global : 1;
        return `<div class="bg-tactical-card border border-tactical-border rounded-2xl p-4">
            <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2"><h3 class="text-sm font-extrabold text-white uppercase tracking-wider">Du plus courant au plus rare</h3><span class="text-[10px] text-tactical-muted">part estimée de tous les accessoires trouvés dans le jeu</span></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">${l.map(([id, o]) => { const a = att(id); if (!a) return ''; return `<button type="button" data-acc-open="${id}" class="flex items-center gap-2 text-left py-1 group">
                <span class="w-6 text-right font-mono text-[11px] text-tactical-muted">${o.rank}</span><span class="ev-lpic">${pic(id)}</span>
                <span class="w-36 sm:w-44 shrink-0 truncate text-[12px] text-white group-hover:text-tactical-accent">${esc(nm(a))}</span>
                <span class="flex-1 h-2 rounded-full bg-tactical-bg border border-tactical-border overflow-hidden"><span class="block h-full rounded-full" style="width:${Math.max(3, o.global / mx * 100)}%;background:${o.tier.color}"></span></span>
                <b class="w-12 text-right font-mono text-[11px]" style="color:${o.tier.color}">${pct(o.global)}</b></button>`; }).join('')}</div>
            <p class="text-[10px] text-tactical-muted mt-3">Couleurs : <span style="color:#4ade80">commun</span> (≥ 6 %), <span style="color:#a3e635">peu commun</span> (3 à 6 %), <span style="color:#facc15">rare</span> (1,2 à 3 %), <span style="color:#fb923c">très rare</span> (moins de 1,2 %). ${atts().filter(a => !S.m[a.id].global).map(a => esc(nm(a))).join(', ')} : pas encore de spawn documenté.</p>
        </div>`;
    }
    function gradesBlock() {
        const S = allStats();
        return `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">${Object.entries(GRADES).map(([g, G]) => {
            const sp = SPAWNS.filter(s => s.g === g), pool = [...new Set(sp.flatMap(s => s.i))];
            return `<div class="bg-tactical-card border border-tactical-border rounded-2xl p-4" style="border-left:4px solid ${G.color}">
                <div class="flex items-baseline justify-between gap-2"><b class="text-white">${esc(G.label)}</b><span class="text-[11px] font-mono text-tactical-muted">${sp.length} spawn${sp.length > 1 ? 's' : ''}</span></div>
                <p class="text-xs text-white/70 mt-1">${esc(G.desc)}</p>
                ${pool.length ? `<div class="flex flex-wrap gap-1 mt-2">${pool.map(id => { const a = att(id); return a ? `<button type="button" data-acc-open="${id}" class="ev-loot !text-[10px]"><span class="ev-lpic">${pic(id)}</span><span class="truncate">${esc(nm(a))}</span></button>` : ''; }).join('')}</div>` : ''}
                <button type="button" data-acc-mapg="${g}" class="mt-3 xh-btn !py-1 !px-2 !text-[10px]">Voir sur la carte des spawns</button>
            </div>`; }).join('')}</div>`;
    }
    function containersBlock() {
        return `<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">${CONTAINERS.map(([img, t, d]) => `<div class="bg-tactical-card border border-tactical-border rounded-2xl overflow-hidden">
            ${imgOk(img) ? `<img src="${IMG}${img}.webp" alt="${esc(t)}" loading="lazy" class="w-full aspect-[4/3] object-cover">` : ''}
            <div class="p-3"><b class="text-white text-[13px] leading-tight block">${esc(t)}</b><p class="text-[11px] text-white/70 mt-1">${esc(d)}</p></div></div>`).join('')}</div>`;
    }
    function bigMap() {
        const list = SPAWNS.filter(s => aMapG === 'tous' || s.g === aMapG);
        const sel = SPAWNS.find(s => s.id === aSel && list.includes(s)) || null;
        const chips = [['tous', 'Tous', 'rgb(var(--t-acc,0 255 136))', SPAWNS.length], ...Object.entries(GRADES).map(([k, G]) => [k, G.label, G.color, SPAWNS.filter(s => s.g === k).length])]
            .map(([k, l, c, n]) => { const on = aMapG === k; return `<button type="button" data-acc-mapg="${k}" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${on ? 'text-tactical-bg' : 'text-white/80 hover:text-white'}" style="border-color:${c}${on ? '' : '66'};${on ? 'background:' + c : ''}">${esc(l)} <span class="opacity-60 font-mono">${n}</span></button>`; }).join('');
        return `<div class="flex flex-wrap gap-1.5 mb-3">${chips}</div>
            <div class="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
                <div class="min-w-0">${miniMap(list, { hl: aSel })}</div>
                <div class="flex flex-col gap-3 min-w-0">${spotDetail(sel)}
                    <div class="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">${list.slice().sort((x, y) => (x.n || 'zz').localeCompare(y.n || 'zz')).map(s => spotRow(s)).join('')}</div></div>
            </div>`;
    }

    function render() {
        const root = document.getElementById('acc-root'); if (!root) return;
        if (!root.dataset.ready) {
            root.dataset.ready = '1';
            root.addEventListener('click', onClick);
            root.addEventListener('input', ev => { if (ev.target.id === 'acc-search') { aQ = ev.target.value.trim(); renderGrid(); } });
            root.addEventListener('change', ev => { if (ev.target.id === 'acc-sort') { aSort = ev.target.value; renderGrid(); } });
            const modal = document.getElementById('acc-modal');
            modal.addEventListener('click', ev => { if (ev.target === modal || ev.target.closest('[data-acc-close]')) close(); else onClick(ev); });
            document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && aOpen) close(); });
            const S = allStats();
            root.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                ${[['1', 'Les mallettes jaunes', "La plupart des accessoires sont dans des petites mallettes jaunes (Equipment Cases), des coffres à cadenas, sur les coffres-forts ou sur les caisses vertes."],
                   ['2', 'Chaque spawn a un grade', "Un spawn civil donne des accessoires civils, un spawn militaire des accessoires militaires… Plus le grade est bon, plus la zone est dangereuse."],
                   ['3', 'Clique pour tout savoir', "Chaque fiche montre les effets, le réticule, les armes compatibles, les chances et une carte de tous les spawns avec leurs photos."]]
                    .map(([n, t, d]) => `<div class="bg-tactical-card border border-tactical-border rounded-2xl p-4 flex gap-3"><span class="w-8 h-8 rounded-full bg-tactical-accent text-tactical-bg font-extrabold flex items-center justify-center shrink-0">${n}</span><div><b class="text-white text-sm">${t}</b><p class="text-xs text-white/70 mt-1">${d}</p></div></div>`).join('')}
            </div>
            <div class="flex flex-col md:flex-row gap-2 mb-3">
                <input id="acc-search" type="search" placeholder="Chercher un accessoire ou un lieu (ex : laser, OCR, Magnolia, casino)…" class="flex-1 bg-tactical-card border border-tactical-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-tactical-muted focus:outline-none focus:border-tactical-accent">
                <select id="acc-sort" class="bg-tactical-card border border-tactical-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-tactical-accent">
                    <option value="global">Trier : le plus courant</option><option value="rare">Trier : le plus rare</option><option value="spots">Trier : nombre de spawns</option><option value="aim">Trier : vitesse de visée</option><option value="recoil">Trier : contrôle du recul</option><option value="name">Trier : A → Z</option>
                </select>
            </div>
            <div id="acc-slots" class="flex flex-wrap gap-1.5 mb-4"></div>
            <div id="acc-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mb-8"></div>
            <h3 class="text-lg font-extrabold text-white mb-2">Rareté globale</h3>
            <div class="mb-8">${rankTable()}</div>
            <h3 id="acc-map-title" class="text-lg font-extrabold text-white mb-1">Carte de tous les spawns d'accessoires</h3>
            <p class="text-xs text-tactical-muted mb-3">${SPAWNS.length} spawns documentés par les joueurs sur le wiki. Chaque couleur est un grade. Clique sur un point pour voir sa photo.</p>
            <div id="acc-bigmap" class="mb-8">${bigMap()}</div>
            <h3 class="text-lg font-extrabold text-white mb-2">Les grades de loot</h3>
            <div class="mb-8">${gradesBlock()}</div>
            <h3 class="text-lg font-extrabold text-white mb-2">Où regarder</h3>
            <div class="mb-6">${containersBlock()}</div>
            <p class="text-[11px] text-tactical-muted">Infos et photos : <a href="${WIKI}Attachments_(Apocalypse_Rising_2)" target="_blank" rel="noopener" class="underline hover:text-tactical-accent">page Attachments du wiki Apocalypse Rising</a> et sa carte interactive des spawns (Foundation Project, JinsoTanaka), licence CC BY-SA. Les pourcentages sont des estimations : le jeu ne publie aucun taux officiel.</p>`;
        }
        renderGrid();
    }
    function renderGrid() {
        const list = [['tous', 'Tous', 'rgb(var(--t-acc,0 255 136))'], ...Object.entries(SLOTS).map(([k, s]) => [k, s.label, s.color])];
        document.getElementById('acc-slots').innerHTML = list.map(([k, l, c]) => {
            const n = k === 'tous' ? atts().length : atts().filter(a => a.slot === k).length, on = aSlot === k;
            return `<button type="button" data-acc-slot="${k}" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${on ? 'text-tactical-bg' : 'text-white/80 hover:text-white'}" style="border-color:${c}${on ? '' : '66'};${on ? `background:${c}` : ''}">${esc(l)} <span class="opacity-60 font-mono">${n}</span></button>`;
        }).join('');
        const l = filtered();
        document.getElementById('acc-grid').innerHTML = l.length ? l.map(card).join('') : `<div class="col-span-full text-sm text-tactical-muted bg-tactical-card border border-tactical-border rounded-xl p-4">Aucun accessoire pour « ${esc(aQ)} ».</div>`;
    }
    function open(id, toMap) {
        const a = att(id); if (!a) return;
        if (aOpen !== id) aSel = null;
        aOpen = id;
        const m = document.getElementById('acc-modal');
        document.getElementById('acc-modal-body').innerHTML = detail(a);
        m.classList.remove('hidden'); m.classList.add('flex');
        const box = m.querySelector('.ev-modal-box');
        box.scrollTop = 0;
        if (toMap) { const d = document.getElementById('acc-dmap'); if (d) setTimeout(() => box.scrollTo({ top: d.offsetTop - 60, behavior: 'smooth' }), 30); }
    }
    function close() { aOpen = null; const m = document.getElementById('acc-modal'); m.classList.add('hidden'); m.classList.remove('flex'); }
    function goSpot(s) {
        close();
        if (typeof currentGroup === 'undefined') return;
        currentGroup = 'carte'; renderMainTabs(); onGroupChange();
        setTimeout(() => {
            if (typeof zoomTo === 'function') zoomTo(s.x, s.y, 200);
            const sec = document.getElementById('map-section'); if (sec) sec.scrollIntoView({ block: 'start' });
        }, 80);
    }
    function onClick(ev) {
        const t = ev.target.closest('[data-acc-open],[data-acc-slot],[data-acc-sp],[data-acc-mapg],[data-acc-item],[data-acc-boss],[data-acc-ev],[data-acc-goto]'); if (!t) return;
        const d = t.dataset;
        if (d.accSlot) { aSlot = d.accSlot; renderGrid(); return; }
        if (d.accOpen) { open(d.accOpen, !!d.accTomap); return; }
        if (d.accSp) {
            aSel = aSel === d.accSp && !aOpen ? null : d.accSp;
            if (aOpen) { const box = document.querySelector('#acc-modal .ev-modal-box'), y = box.scrollTop; document.getElementById('acc-modal-body').innerHTML = detail(att(aOpen)); box.scrollTop = y; }
            else { document.getElementById('acc-bigmap').innerHTML = bigMap(); }
            return;
        }
        if (d.accMapg) { aMapG = d.accMapg; aSel = null; document.getElementById('acc-bigmap').innerHTML = bigMap(); const h = document.getElementById('acc-map-title'); if (h && !t.closest('#acc-bigmap')) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        if (d.accItem) { close(); if (typeof goFindItem === 'function') goFindItem(d.accItem); return; }
        if (d.accGoto) { const s = SPAWNS.find(x => x.id === d.accGoto); if (s) goSpot(s); return; }
        if (d.accEv) {
            close(); currentGroup = 'evenements'; renderMainTabs(); onGroupChange(); window.scrollTo({ top: 0 });
            setTimeout(() => window.AR2Events && AR2Events.open(d.accEv), 40); return;
        }
        if (d.accBoss) {
            close(); const b = BOSS_DATA.find(x => x.id === d.accBoss); if (!b) return;
            toolGoTab('boss');
            setTimeout(() => { try { bossQ = b.name; bossType = 'Tous'; } catch (e) {} const i = document.getElementById('boss-search'); if (i) i.value = b.name; if (typeof bossRender === 'function') bossRender(); window.scrollTo({ top: 0 }); }, 30);
        }
    }

    window.AR2Acc = { SPAWNS, GRADES, INFO, render, open, stats: allStats, count: () => atts().length };
    window.accRender = render;
    if (typeof currentGroup !== 'undefined' && currentGroup === 'accguide') render();
    if (typeof renderMainTabs === 'function') renderMainTabs();
})();
