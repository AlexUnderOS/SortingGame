class ItemManager {
    constructor(canvas, audioManager) {
        this.canvas = canvas;
        this.audioManager = audioManager;

        this.activeItems = [];
        this.maxItems = 10;
        this.spawnArea = {
            x: (this.canvas.width - 650) / 2, // auto center
            y: 390,
            width: 650,
            height: 120
        };

        this.particleSystem = new ParticleSystem();
        this.bins = this.createBins();
        this.trashItems = this.createTrashItems();

        this.lastHoveredBinIdForOpenSound = null;

        this.hoverStartBinId = null;
        this.hoverStartTime = 0;

        setTimeout(() => {
            this.calculateBinDimensions();
            this.calculateItemDimensions();
        }, 500);
    }

    // =====================
    // Item spawn
    // =====================

    spawnNewItem() {
        if (this.activeItems.length >= this.maxItems) return null;

        const itemTemplate = this.trashItems[Math.floor(Math.random() * this.trashItems.length)];

        const startX = this.spawnArea.x + Math.random() * (this.spawnArea.width - itemTemplate.width);
        const startY = -50;

        const targetX = this.spawnArea.x + Math.random() * (this.spawnArea.width - itemTemplate.width);
        const targetY = this.spawnArea.y + Math.random() * (this.spawnArea.height - itemTemplate.height);

        const velocityX = (Math.random() - 0.5) * 4;
        const velocityY = 2 + Math.random() * 2;
        const gravity = 0.1;

        const newItem = {
            ...itemTemplate,
            x: startX,
            y: startY,
            targetX: targetX + itemTemplate.width / 2,
            targetY: targetY + itemTemplate.height / 2,
            velocityX,
            velocityY,
            gravity,
            radius: Math.max(itemTemplate.width, itemTemplate.height) / 2,
            id: Date.now() + Math.random(),
            zIndex: this.activeItems.length,
            isFalling: true,
            hasBounced: false,
            dropSoundPlayed: false,
            dropSoundProcessed: false,
            bounceSoundPlayed: false,
            bounceSoundProcessed: false,
            bounceDropSoundPlayed: false,
            bounceDropSoundProcessed: false
        };

        this.activeItems.push(newItem);
        return newItem;
    }

    // =====================
    // Bins
    // =====================

    createBins() {
        const defaultBinWidth = 170;

        const binConfigs = [
            {
                type: 'black',
                color: '#2C2C2C',
                name: 'Nešķirotie atkritumi',
                x: 65,
                bottomOffset: 165,
                width: 170,
                imageId: 'playzone-black-bin',
                openImageId: 'playzone-black-bin-open',
                hasOpenAnimation: true,
                miniImageId: 'mini-black-bin',
                order: 0
            },
            {
                type: 'yellow',
                color: '#FFD700',
                name: 'Vieglie iepakojumi',
                x: 205,
                bottomOffset: 170,
                width: 170,
                imageId: 'playzone-yellow-bin',
                openImageId: 'playzone-yellow-bin-open',
                hasOpenAnimation: true,
                miniImageId: 'mini-yellow-bin',
                order: 1
            },
            {
                type: 'green',
                color: '#4CAF50',
                name: 'Stikla iepakojums',
                x: 367,
                bottomOffset: 170,
                width: 158,
                imageId: 'playzone-green-bin',
                openImageId: 'playzone-green-bin-open',
                hasOpenAnimation: true,
                miniImageId: 'mini-green-bin',
                order: 3
            },
            {
                type: 'brown',
                color: '#8B4513',
                name: 'Bioloģiskie atkritumi',
                x: 515,
                bottomOffset: 165,
                width: 165,
                imageId: 'playzone-brown-bin',
                openImageId: 'playzone-brown-bin-open',
                hasOpenAnimation: true,
                miniImageId: 'mini-brown-bin',
                order: 2
            },
            {
                type: 'blue',
                color: '#1565C0',
                name: 'Papīrs',
                x: 660,
                bottomOffset: 170,
                width: 168,
                imageId: 'playzone-blue-bin',
                openImageId: 'playzone-blue-bin-open',
                hasOpenAnimation: true,
                miniImageId: 'mini-blue-bin',
                order: 1
            },
            {
                type: 'red',
                color: '#ff9e44ff',
                name: 'Bīstamie atkritumi',
                x: 745,
                bottomOffset: 125,
                width: 200,
                imageId: 'playzone-hazard-box',
                openImageId: null,
                hasOpenAnimation: false,
                miniImageId: 'mini-orange-bin',
                order: 4
            }
        ];

        const bins = binConfigs.map(cfg => ({
            ...cfg,
            fixedWidth: cfg.width ?? defaultBinWidth,
            currentHeight: 120,
            closedHeight: 120,
            openHeight: 150,
            openProgress: 0,
            isHovered: false,
            hoverLostTime: null,
            openSoundPlayedForHover: false
        }));

        bins.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return bins;
    }

    calculateBinDimensions() {
        this.bins.forEach(bin => {
            const closedImg = document.getElementById(bin.imageId);
            const openImg = bin.openImageId ? document.getElementById(bin.openImageId) : null;

            if (closedImg && closedImg.complete && closedImg.naturalWidth > 0) {
                const aspectRatio = closedImg.naturalHeight / closedImg.naturalWidth;
                bin.closedHeight = bin.fixedWidth * aspectRatio;
            } else {
                bin.closedHeight = 120;
            }

            if (openImg && openImg.complete && openImg.naturalWidth > 0) {
                const openAspectRatio = openImg.naturalHeight / openImg.naturalWidth;
                bin.openHeight = bin.fixedWidth * openAspectRatio;
            } else {
                bin.openHeight = bin.closedHeight + 20;
            }

            bin.currentHeight = bin.closedHeight;

            const bottomOffset = bin.bottomOffset ?? 50;
            bin.y = this.canvas.height - bin.currentHeight - bottomOffset;
        });
    }

    resetBins() {
        this.bins.forEach(bin => {
            bin.openProgress = 0;
            bin.isHovered = false;
            bin.currentHeight = bin.closedHeight;

            bin.hoverLostTime = null;
            bin.openSoundPlayedForHover = false;

            const bottomOffset = bin.bottomOffset ?? 50;
            bin.y = this.canvas.height - bin.currentHeight - bottomOffset;
        });
    }

    updateBins() {
        const now = performance.now();

        for (let bin of this.bins) {
            if (bin.hoverLostTime !== null && now - bin.hoverLostTime >= 1000) {
                bin.isHovered = false;
                bin.hoverLostTime = null;
            }

            const prevProgress = bin.openProgress;

            if (bin.isHovered) {
                bin.openProgress = Math.min(1, bin.openProgress + 0.1);
            } else {
                bin.openProgress = Math.max(0, bin.openProgress - 0.1);
            }

            if (bin.hasOpenAnimation) {
                bin.currentHeight =
                    bin.closedHeight +
                    (bin.openHeight - bin.closedHeight) * bin.openProgress;
            } else {
                bin.currentHeight = bin.closedHeight;
            }

            const bottomOffset = bin.bottomOffset ?? 50;
            bin.y = this.canvas.height - bin.currentHeight - bottomOffset;

            if (bin.hasOpenAnimation && bin.isHovered) {
                if (
                    !bin.openSoundPlayedForHover &&
                    prevProgress < 0.5 &&
                    bin.openProgress >= 0.5
                ) {
                    bin.openSoundPlayedForHover = true;

                    if (
                        this.audioManager &&
                        typeof this.audioManager.playOpenBin === 'function'
                    ) {
                        this.audioManager.playOpenBin();
                    }
                }
            }

            if (!bin.isHovered && bin.openProgress === 0) {
                bin.openSoundPlayedForHover = false;
            }
        }
    }

    setBinHoverState(x, y, isDragging) {
        const now = performance.now();
        let hoveredBin = null;

        if (!isDragging) {
            for (let bin of this.bins) {
                if (bin.isHovered && bin.hoverLostTime === null) {
                    bin.hoverLostTime = now;
                }
            }
            this.hoverStartBinId = null;
            this.hoverStartTime = 0;
            return null;
        }

        const binUnderCursor = this.getBinAtPosition(x, y);

        for (let bin of this.bins) {
            if (bin !== binUnderCursor && bin.isHovered && bin.hoverLostTime === null) {
                bin.hoverLostTime = now;
            }
        }

        if (!binUnderCursor) {
            this.hoverStartBinId = null;
            this.hoverStartTime = 0;
            return null;
        }

        const currentId = binUnderCursor.type;

        if (this.hoverStartBinId !== currentId) {
            this.hoverStartBinId = currentId;
            this.hoverStartTime = now;
            return null;
        }

        const elapsed = now - this.hoverStartTime;

        if (elapsed >= 50) {
            binUnderCursor.isHovered = true;
            binUnderCursor.hoverLostTime = null;
            hoveredBin = binUnderCursor;
        }

        return hoveredBin;
    }

    getBinAtPosition(x, y) {
        for (let i = this.bins.length - 1; i >= 0; i--) {
            const bin = this.bins[i];
            if (
                x >= bin.x &&
                x <= bin.x + bin.fixedWidth &&
                y >= bin.y &&
                y <= bin.y + bin.currentHeight
            ) {
                return bin;
            }
        }
        return null;
    }

    getBinByType(type) {
        return this.bins.find(bin => bin.type === type);
    }

    // =====================
    // Trash items
    // =====================

    createTrashItems() {
        return [
            {
                type: 'yellow',
                name: 'Plastmasas pudele',
                imageId: 'item-plastic-bottle',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Plastmasas pudeles sadalās ļoti ilgi un pārvēršas mikroplastmasā.',
                    effect: 'Augsnes un ūdenstilpju piesārņojums ar mikroplastmasu',
                    impact: 'Ļoti augsts',
                }
            },
            {
                type: 'brown',
                name: 'Brokoļi',
                imageId: 'item-brokkoli',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Pārtikas atkritumi izgāztuvē pūst un izdala siltumnīcefekta gāzes.',
                    effect: 'Klimata pārmaiņu pastiprināšanās metāna emisiju dēļ',
                    impact: 'Vidējs',
                }
            },
            {
                type: 'black',
                name: 'Cigarete',
                imageId: 'item-cigarette',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Cigarešu izsmēķi satur toksiskas vielas un plastmasas filtru.',
                    effect: 'Augsnes un ūdens saindēšanās ar toksīniem',
                    impact: 'Augsts',
                }
            },
            {
                type: 'red',
                name: 'Parfīma flakons',
                imageId: 'item-perfume',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Parfīmu atlikumi satur šķīdinātājus un smaržvielas, kas ir kaitīgas ūdens organismiem.',
                    effect: 'Ūdens un gaisa ķīmiskais piesārņojums',
                    impact: 'Augsts',
                }
            },
            {
                type: 'yellow',
                name: 'Sulas vai limonādes bundža',
                imageId: 'item-cansoda',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Alumīnija bundžas ir vērtīgs otrreizējās pārstrādes materiāls, ko var pārstrādāt daudzas reizes.',
                    effect:
                        'Liekas CO₂ emisijas un izejvielu zudums, ja tās izmet kopā ar sadzīves atkritumiem',
                    impact: 'Vidējs',
                }
            },
            {
                type: 'brown',
                name: 'Banāna miza',
                imageId: 'item-bananapeel',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Organiskie atkritumi izgāztuvē rada nepatīkamu smaku un siltumnīcefekta gāzes.',
                    effect: 'Dzīvnieku pievilināšana un metāna emisijas',
                    impact: 'Zems',
                }
            },
            {
                type: 'brown',
                name: 'Apēsts ābols',
                imageId: 'item-applecore',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Pārtikas atkritumi kopējos atkritumos kļūst par emisiju un smakas avotu.',
                    effect: 'Siltumnīcefekta gāzu izdalīšanās sadalīšanās laikā',
                    impact: 'Zems',
                }
            },
            {
                type: 'green',
                name: 'Saplīsusi stikla pudele',
                imageId: 'item-brokenbottle',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Stikls dabā gandrīz nesadalās, un tā šķembas ir bīstamas cilvēkiem un dzīvniekiem.',
                    effect: 'Traumu risks un ilgstošs piesārņojums',
                    impact: 'Augsts',
                }
            },
            {
                type: 'red',
                name: 'Merkura termometrs',
                imageId: 'item-thermometer',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Dzīvsudrabs ir ļoti toksisks metāls, kas bīstams pat nelielos daudzumos.',
                    effect: 'Spēcīgs gaisa, augsnes un ūdens piesārņojums',
                    impact: 'Kritisks',
                }
            },
            {
                type: 'yellow',
                name: 'Plastmasas maisiņš',
                imageId: 'item-plasticbag',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Plastmasas maisiņi viegli nonāk vidē un ļoti ilgi nesadalās.',
                    effect:
                        'Dzīvnieku bojāeja, jo tie iepinās plēvē vai sajauc to ar barību',
                    impact: 'Augsts',
                }
            },
            {
                type: 'red',
                name: 'Spuldzīte',
                imageId: 'item-bulb',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Ekonomiskās spuldzes satur dzīvsudrabu - ļoti bīstamu vielu.',
                    effect: 'Saindēšanās ar dzīvsudraba tvaikiem',
                    impact: 'Ļoti augsts',
                }
            },
            {
                type: 'brown',
                name: 'Vistu olas (čaumalas un atliekas)',
                imageId: 'item-eggshell',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Pārtikas paliekas kopējos atkritumos ātri bojājas un rada nepatīkamu smaku.',
                    effect: 'Antisanitāri apstākļi un papildu izmeši pūšanas laikā',
                    impact: 'Zems',
                }
            },
            {
                type: 'black',
                name: 'Papīra glāzīte',
                imageId: 'item-papercup',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Vienreizlietojamās glāzītes ir pārklātas ar plastmasu un neder parastai papīra pārstrādei.',
                    effect: 'Makulatūras plūsmas piesārņošana un papildu atkritumi',
                    impact: 'Vidējs',
                }
            },
            {
                type: 'green',
                name: 'Stikla pudele',
                imageId: 'item-bottle',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Stiklu var pārstrādāt daudzas reizes, nevis iegūt jaunas izejvielas.',
                    effect:
                        'Liekie atkritumi un enerģijas patēriņš, ja pudeles izmet kopā ar sadzīves atkritumiem',
                    impact: 'Augsts',
                }
            },
            {
                type: 'red',
                name: 'Baterijas',
                imageId: 'item-battery',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Baterijas satur smagos metālus, kas saindē augsni un ūdeni.',
                    effect: 'Vides piesārņojums ar smagajiem metāliem',
                    impact: 'Ļoti augsts',
                }
            },
            {
                type: 'brown',
                name: 'Lapas',
                imageId: 'item-leaves',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Lapas ir vērtīgs komposta materiāls, bet izgāztuvē tās vienkārši pūst.',
                    effect: 'Zaudēts vērtīgs resurss augsnes uzlabošanai',
                    impact: 'Zems',
                }
            },
            {
                type: 'green',
                name: 'Alkohola pudele',
                imageId: 'item-bottlealcohol',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Dzērienu stikla tara arī ir pārstrādājama un nebojājas atkārtotas kausēšanas laikā.',
                    effect:
                        'Lielāks izgāztuvju apjoms, ja pudele nonāk kopā ar sadzīves atkritumiem',
                    impact: 'Augsts',
                }
            },
            {
                type: 'red',
                name: 'Zāļu pudele ar atlikumiem',
                imageId: 'item-medicinebottle',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Zāļu atlikumi var nonākt ūdenī un ietekmēt dzīvniekus un cilvēkus.',
                    effect: 'Ķīmiskais piesārņojums un mikroorganismu rezistence pret zālēm',
                    impact: 'Ļoti augsts',
                }
            },
            {
                type: 'red',
                name: 'Krāsas baloniņš',
                imageId: 'item-spray',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Aerosola baloniņi satur šķīdinātājus un var būt sprādzienbīstami.',
                    effect:
                        'Ķīmiskais piesārņojums un sprādziena risks atkritumu saspiešanas laikā',
                    impact: 'Augsts',
                }
            },
            {
                type: 'black',
                name: 'Saplīsis šķīvis',
                imageId: 'item-brokendishes',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Keramika netiek pārstrādāta tāpat kā parastais stikls.',
                    effect: 'Stikla pārstrādes partijas bojāšana un papildu atkritumi',
                    impact: 'Vidējs',
                }
            },
            {
                type: 'yellow',
                name: 'Piena paka',
                imageId: 'item-cartonmilk',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Dzērienu kartona pakas ir kombinēts iepakojums, ko var pārstrādāt, ja tas tiek savākts atsevišķi.',
                    effect: 'Lielāks izgāztuvju apjoms un izejvielu zudums',
                    impact: 'Vidējs',
                }
            },
            {
                type: 'black',
                name: 'Rotaļu lidmašīna',
                imageId: 'item-toyairplane',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Rotaļlietas bieži ir izgatavotas no dažādu materiālu maisījuma un neder parastai pārstrādei.',
                    effect: 'Nesortējamo atkritumu daudzuma pieaugums',
                }
            },
            {
                type: 'black',
                name: 'Svece',
                imageId: 'item-candle',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Parafīna atlikumi un degli nevar pārstrādāt parastajā sistēmā.',
                    effect: 'Papildu nesortējamo atkritumu apjoms',
                    impact: 'Zems',
                }
            },
            {
                type: 'brown',
                name: 'Kauls',
                imageId: 'item-bone',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Kauli sadalās lēni un kopējos atkritumos pievilina dzīvniekus.',
                    effect: 'Antisanitāri apstākļi un nepatīkama smaka',
                    impact: 'Zems',
                }
            },
            {
                type: 'black',
                name: 'Autiņbiksītes',
                imageId: 'item-diaper',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Autiņbiksītes satur absorbējošus polimērus un bioloģiskos piesārņotājus, un tās netiek pārstrādātas.',
                    effect: 'Liels nesortējamo atkritumu apjoms un infekciju risks',
                    impact: 'Vidējs',
                }
            },
            {
                type: 'blue',
                name: 'Aizpildīta papīra lapa',
                imageId: 'item-paper',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Papīrs ir viens no vienkāršāk pārstrādājamiem un vērtīgākajiem materiāliem.',
                    effect: 'Papildu koku izciršana un izgāztuvju pieaugums',
                    impact: 'Vidējs',
                }
            },
            {
                type: 'red',
                name: 'Mobilais telefons',
                imageId: 'item-smartphone',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Telefonos ir metāli, baterija un elektronika, kas nepareizi izmetot ir bīstami videi.',
                    effect:
                        'Piesārņojums ar smagajiem metāliem un toksiskām vielām',
                    impact: 'Ļoti augsts',
                }
            },
            {
                type: 'black',
                name: 'Netīrs papīrs',
                imageId: 'item-dirtypaper',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Papīrs, kas nosmērēts ar taukiem, ēdienu vai citām vielām, nav piemērots pārstrādei.',
                    effect: 'Makulatūras partijas sabojāšana un papildu atkritumi',
                    impact: 'Vidējs',
                }
            },
            {
                type: 'black',
                name: 'Dvielis',
                imageId: 'item-towel',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Tekstils, kas nav piemērots atkārtotai izmantošanai, parasti nevar tikt pārstrādāts.',
                    effect: 'Palielināts nesortējamo atkritumu apjoms',
                    impact: 'Vidējs'
                }
            },
            {
                type: 'brown',
                name: 'Indīgā sēne',
                imageId: 'item-badmushroom',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Indīgās sēnes dabā sadalās kā parasti organiskie atkritumi.',
                    effect: 'Organisko atkritumu sadalīšanās gāzu izdalīšanās',
                    impact: 'Zems'
                }
            },
            {
                type: 'blue',
                name: 'Grāmata',
                imageId: 'item-book',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Papīra izstrādājumi ir pārstrādājami un var kļūt par jaunu makulatūru.',
                    effect: 'Nepotrebēti papīra resursi un lielāks atkritumu apjoms',
                    impact: 'Vidējs'
                }
            },
            {
                type: 'yellow',
                name: 'Čipsu paka',
                imageId: 'item-chips',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Daudzslāņu iepakojumi ir pārstrādājami, ja tie tiek pareizi nodoti.',
                    effect: 'Papildu iepakojuma piesārņojums, ja tie nonāk nesortējamos atkritumos',
                    impact: 'Vidējs'
                }
            },
            {
                type: 'brown',
                name: 'Gurķis',
                imageId: 'item-cucumber',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Svaigi dārzeņi ātri sadalās un rada metāna emisijas, ja nonāk kopējā atkritumu plūsmā.',
                    effect: 'Siltumnīcefekta gāzu izdalīšanās sadalīšanās laikā',
                    impact: 'Zems'
                }
            },
            {
                type: 'brown',
                name: 'Sēne',
                imageId: 'item-goodmushroom',
                width: 0,
                height: 0,
                consequence: {
                    text: 'Ēdamās sēnes ir bioloģiski sadalošs materiāls.',
                    effect: 'Organisko atkritumu sadalīšanās gāzu izdalīšanās',
                    impact: 'Zems'
                }
            }
        ];
    }

    calculateItemDimensions() {
        this.trashItems.forEach(item => {
            const img = document.getElementById(item.imageId);

            if (img && img.complete && img.naturalWidth > 0) {
                const baseSize = 50;
                const aspectRatio = img.naturalHeight / img.naturalWidth;

                if (aspectRatio > 1) {
                    item.height = baseSize;
                    item.width = baseSize / aspectRatio;
                } else {
                    item.width = baseSize;
                    item.height = baseSize * aspectRatio;
                }
            } else {
                item.width = 40;
                item.height = 40;
            }
        });
    }

    // =====================
    // Item updates / physics
    // =====================

    updateItems() {
        for (let item of this.activeItems) {
            if (!item.isFalling) continue;

            item.velocityY += item.gravity;
            item.x += item.velocityX;
            item.y += item.velocityY;

            if (item.y >= item.targetY) {
                item.y = item.targetY;

                if (item.velocityY > 1) {
                    if (!item.hasBounced) {
                        if (!item.dropSoundPlayed) {
                            item.dropSoundPlayed = true;
                        }
                        if (!item.bounceSoundPlayed) {
                            item.bounceSoundPlayed = true;
                        }
                        this.particleSystem.createLandingParticles(item.x, item.y, 15);
                    } else {
                        if (!item.bounceDropSoundPlayed) {
                            item.bounceDropSoundPlayed = true;
                        }
                        if (!item.bounceSoundPlayed) {
                            item.bounceSoundPlayed = true;
                        }
                    }

                    item.velocityY = -item.velocityY * 0.3;
                    item.hasBounced = true;
                } else {
                    item.velocityY = 0;
                    item.velocityX = 0;
                    item.isFalling = false;
                }
            }

            if (item.x - item.width / 2 < 20) {
                item.x = 20 + item.width / 2;
                item.velocityX = Math.abs(item.velocityX) * 0.5;
            } else if (item.x + item.width / 2 > this.canvas.width - 20) {
                item.x = this.canvas.width - 20 - item.width / 2;
                item.velocityX = -Math.abs(item.velocityX) * 0.5;
            }
        }

        this.particleSystem.update();
    }

    // =====================
    // Particles
    // =====================

    drawParticles(ctx) {
        this.particleSystem.draw(ctx);
    }

    // =====================
    // Sound helpers
    // =====================

    getItemsForBounceDropSound() {
        return this.activeItems.filter(
            item => item.bounceDropSoundPlayed && !item.bounceDropSoundProcessed
        );
    }

    markBounceDropSoundProcessed(item) {
        item.bounceDropSoundProcessed = true;
    }

    getItemsForDropSound() {
        return this.activeItems.filter(
            item => item.dropSoundPlayed && !item.dropSoundProcessed
        );
    }

    markDropSoundProcessed(item) {
        item.dropSoundProcessed = true;
    }

    getItemsForBounceSound() {
        return this.activeItems.filter(
            item => item.bounceSoundPlayed && !item.bounceSoundProcessed
        );
    }

    markBounceSoundProcessed(item) {
        item.bounceSoundProcessed = true;
    }

    getItemsForLandSound() {
        return this.activeItems.filter(
            item => item.landSoundPlayed && !item.landSoundProcessed
        );
    }

    markLandSoundProcessed(item) {
        item.landSoundProcessed = true;
    }

    // =====================
    // Hit tests / Utils
    // =====================

    removeItem(itemId) {
        this.activeItems = this.activeItems.filter(item => item.id !== itemId);
    }

    getItemAtPosition(x, y) {
        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            const item = this.activeItems[i];
            const distance = Math.hypot(x - item.x, y - item.y);
            if (distance <= item.radius) {
                return item;
            }
        }
        return null;
    }

    bringToFront(item) {
        const maxZIndex = Math.max(...this.activeItems.map(i => i.zIndex));
        item.zIndex = maxZIndex + 1;
        this.activeItems.sort((a, b) => a.zIndex - b.zIndex);
    }

    checkSorting(item, bin) {
        return item.type === bin.type;
    }

    getImage(imageId) {
        return document.getElementById(imageId);
    }

    drawSpawnAreaDebug(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);

        ctx.strokeRect(
            this.spawnArea.x,
            this.spawnArea.y,
            this.spawnArea.width,
            this.spawnArea.height
        );

        ctx.restore();
    }

}

// =====================
// Particle System
// =====================

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 15;
    }

    createLandingParticles(x, y, count = 12) {
        const availableSlots = this.maxParticles - this.particles.length;
        if (availableSlots <= 0) return;

        const actualCount = Math.min(count, availableSlots);

        for (let i = 0; i < actualCount; i++) {
            const baseAngle = -Math.PI / 2;
            const angle = baseAngle + (Math.random() - 0.5) * Math.PI;

            const speed = 2 + Math.random() * 4;
            const size = 6 + Math.random() * 18;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                life: 1.0,
                maxLife: 1.0 + Math.random() * 0.5,
                color: this.getRandomGreenColor()
            });
        }
    }

    getRandomGreenColor() {
        const greens = [
            '#2c652eff',
            '#215223ff',
            '#66bb6a56',
            '#005204ff',
            '#2e7d325b',
            '#1b5e1f47',
            '#81c78444',
            '#002201ff'
        ];
        return greens[Math.floor(Math.random() * greens.length)];
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;

            p.vy += 0.25;
            p.rotation += p.rotationSpeed;

            p.vx *= 0.98;
            p.vy *= 0.98;

            p.life -= 0.02;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            const currentSize = p.size * alpha;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = alpha;

            ctx.fillStyle = p.color;
            ctx.fillRect(
                -currentSize / 2,
                -currentSize / 2,
                currentSize,
                currentSize
            );

            ctx.strokeStyle = '#000000ff';
            ctx.lineWidth = 0.4;
            ctx.strokeRect(
                -currentSize / 2,
                -currentSize / 2,
                currentSize,
                currentSize
            );

            ctx.restore();
        });
    }

    clear() {
        this.particles = [];
    }
}
