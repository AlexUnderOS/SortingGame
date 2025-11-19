class RecyclingGame {
    constructor() {

        this.assetsLoaded = false;
        this.loadAssets().then(() => {
            this.assetsLoaded = true;
        });

        // =========================
        //  CORE REFERENCES
        // =========================
        this.canvas = document.getElementById('gameCanvas');
        this.uiManager = new UIManager('gameCanvas');
        this.audioManager = new AudioManager();
        this.itemManager = new ItemManager(this.canvas, this.audioManager);

        this.uiManager.game = this;
        this.uiManager.itemManager = this.itemManager;

        // =========================
        //  GAME STATE
        // =========================
        this.score = 0;
        this.timeLeft = 60;
        this.startTime = 0;

        this.gameState = 'mainMenu';  // 'mainMenu' | 'difficultyMenu' | 'customSettings' | 'playing' | 'dialog' | 'consequence' | 'pauseMenu' | 'gameover'

        this.isDragging = false;
        this.draggedItem = null;
        this.dragOffset = { x: 0, y: 0 };

        this.gameInterval = null;
        this.spawnInterval = null;
        this.animationFrame = null;

        this.activeDialog = null;
        this.consequenceItem = null;
        this.correctBin = null;
        this.prePauseState = null;
        this.savedGameState = null;

        this.audioStarted = false;

        this.carouselLeftArea = null;
        this.carouselRightArea = null;

        this.gameOverRestartButton = null;

        this.totalSpawnAttempts = 0;
        this.successfulSorts = 0;
        this.missedSpawns = 0;

        this.starSystem = {
            threeStarEfficiency: 0.8,
            twoStarEfficiency: 0.6,
            oneStarEfficiency: 0.4
        };

        // time progress bar
        this.currentProgressWidth = 1.0;
        this.startGameTime = 0;
        this.lastUpdateTime = 0;
        this.currentColor = '#2ecc71';
        this.targetColor = '#2ecc71';
        this.colorTransitionSpeed = 0.1;

        // =========================
        //  IMAGES
        // =========================
        this.tapeImg = new Image();
        this.tapeImg.src = 'images/playzone/tape.png';

        this.infoPaperImg = new Image();
        this.infoPaperImg.src = 'images/playzone/info-paper.png';

        this.btnStartImg = new Image();
        this.btnStartImg.src = 'images/components/sakt-btn.png';

        this.btnContinueImg = new Image();
        this.btnContinueImg.src = 'images/components/turpinat-btn.png';

        this.btnResetImg = new Image();
        this.btnResetImg.src = 'images/components/reset-btn.png';

        this.playzoneBg = new Image();
        this.playzoneBg.src = 'images/playzone/playzone.png';

        this.paperImg = new Image();
        this.paperImg.src = 'images/components/paper.png';

        this.dialogPanelImg = new Image();
        this.dialogPanelImg.src = 'images/playzone/dialogue-panel.png';

        this.branchesTopImg = new Image();
        this.branchesTopImg.src = 'images/playzone/branches_top.png';

        this.branchesBottomImg = new Image();
        this.branchesBottomImg.src = 'images/playzone/branches_bottom.png';

        this.cupImg = new Image();
        this.cupImg.src = 'images/components/victory-cup.png';

        this.carouselArrowImg = new Image();
        this.carouselArrowImg.src = 'images/components/arrow.png';

        this.pauseButtonImg = new Image();
        this.pauseButtonImg.src = 'images/components/pause-btn.png';

        // GUIDE IMAGES
        this.guideImg0 = new Image();
        this.guideImg0.src = 'images/components/guide-0.png';

        this.guideImg1 = new Image();
        this.guideImg1.src = 'images/components/guide-1.png';

        this.guideImg2 = new Image();
        this.guideImg2.src = 'images/components/guide-2.png';

        this.guideImg3 = new Image();
        this.guideImg3.src = 'images/components/guide-3.png';

        this.guideCheckedImg = new Image();
        this.guideCheckedImg.src = 'images/components/guide-checked.png';

        this.gameOverPanelImg = new Image();
        this.gameOverPanelImg.src = 'images/components/gameover-panel.png';

        this.pausePanelImg = new Image();
        this.pausePanelImg.src = 'images/components/pause-panel.png';

        this.guideButtonImg = new Image();
        this.guideButtonImg.src = 'images/components/guide-btn.png';

        // =========================
        //  ANIMATIONS
        // =========================
        this.dialogAnim = {
            startTime: 0,
            duration: 600,
            state: 'idle' // 'idle' | 'in'
        };

        this.difficultyPanelAnim = {
            startTime: 0,
            duration: 600
        };

        this.branchesAnim = {
            startTime: performance.now(),
            duration: 700,
            bottomDelay: 120
        };

        this.pauseMenuAnim = {
            startTime: 0,
            duration: 500,
            progress: 0,
            state: 'hidden' // 'hidden' | 'in' | 'shown' | 'out'
        };
        this._pauseMenuFinalAction = null;

        this.gameOverAnim = {
            startTime: 0,
            duration: 600,
            progress: 0,
            state: 'hidden'
        };
        this._gameOverFinalAction = null;

        this.guideSlides = [
            {
                img: this.guideImg0,
                text: 'Hmmm... šeit ir sakrājies vesels atkritumu kalns.'
            },
            {
                img: this.guideImg1,
                text: 'Laiks visu sakārtot!'
            },
            {
                img: this.guideImg2,
                text: 'Katram atkritumam ir sava vieta. Ir seši konteineru veidi - jāatrod īstais sodas bundžai.'
            },
            {
                img: this.guideImg3,
                text: 'Lieliski! Vieglie iepakojumi ir pareizā izvēle. Šķirojot pareizi, es palīdzēju dabai - super!'
            }
        ];

        this.guideOverlay = {
            isOpen: false,
            animState: 'hidden',   // 'hidden' | 'in' | 'shown' | 'out'
            animStartTime: 0,
            fade: 0,
            step: 0,
            lastSlideStartTime: 0,
            showChecked: false,
            slideChangeTime: 0
        };

        this.guideButton = {
            img: this.guideButtonImg,
            width: 56,
            height: null,
            x: 0,
            y: 0,
            hasShadow: true,
            action: () => this.openGuideOverlay()
        };

        // =========================
        //  DIFFICULTY SETTINGS
        // =========================
        this.difficultySettings = {
            easy: {
                spawnInterval: 4000,
                maxItems: 10,
                name: 'Viegli',
                durationSec: 60
            },
            medium: {
                spawnInterval: 2000,
                maxItems: 15,
                name: 'Vidēji',
                durationSec: 36
            },
            hard: {
                spawnInterval: 1000,
                maxItems: 20,
                name: 'Grūti',
                durationSec: 24
            },
            custom: {
                spawnInterval: 2000,
                maxItems: 15,
                name: 'Sava',
                durationSec: 60
            }
        };

        this.mainMenuButtons = [
            {
                img: this.btnStartImg,
                width: 230,
                height: null,
                action: () => this.showDifficultyMenu(),
                visible: () => true
            },
            {
                img: this.btnContinueImg,
                width: 230,
                height: null,
                action: () => this.continueGame(),
                visible: () => this.hasSavedGame()
            },
            {
                img: this.btnResetImg,
                width: 230,
                height: null,
                action: () => this.resetHighScores(),
                visible: () => this.hasAnyBestScore()
            }
        ];

        this.difficultyMenuButtons = [
            {
                text: 'Viegli (' + this.difficultySettings.easy.durationSec + ' sek.)',
                x: 400, y: 200,
                width: 200, height: 50,
                action: () => this.startGameWithDifficulty('easy')
            },
            {
                text: 'Vidēji (' + this.difficultySettings.medium.durationSec + ' sek.)',
                x: 400, y: 270,
                width: 200, height: 50,
                action: () => this.startGameWithDifficulty('medium')
            },
            {
                text: 'Grūti (' + this.difficultySettings.hard.durationSec + ' sek.)',
                x: 400, y: 340,
                width: 200, height: 50,
                action: () => this.startGameWithDifficulty('hard')
            },
            {
                text: 'Sava',
                x: 400, y: 410,
                width: 200, height: 50,
                action: () => this.showCustomSettingsMenu()
            },
            {
                text: 'Atpakaļ',
                x: 400, y: 480,
                width: 200, height: 50,
                action: () => this.backToMainMenuFromDifficulty()
            }
        ];

        this.customSettingsMenuButtons = [
            {
                text: 'Sākt',
                x: 400, y: 450,
                width: 200, height: 50,
                action: () => this.startGameWithDifficulty('custom')
            },
            {
                text: 'Atpakaļ',
                x: 400, y: 520,
                width: 200, height: 50,
                action: () => this.showDifficultyMenu()
            }
        ];

        this.customTimeSlider = {
            x: 400, y: 180,
            width: 300, height: 30,
            min: 5,
            max: 150,
            value: this.difficultySettings.custom.durationSec,
            dragging: false
        };

        this.spawnIntervalSlider = {
            x: 400, y: 260,
            width: 300, height: 30,
            min: 500,
            max: 5000,
            value: this.difficultySettings.custom.spawnInterval,
            dragging: false
        };

        this.maxItemsSlider = {
            x: 400, y: 340,
            width: 300, height: 30,
            min: 5,
            max: 30,
            value: this.difficultySettings.custom.maxItems,
            dragging: false
        };

        // =========================
        //  PAUSE UI
        // =========================
        this.pauseMenuButtons = [
            {
                text: 'Turpināt',
                x: 400, y: 250,
                width: 200, height: 50,
                action: () => this.closePauseMenuWithAnimation(() => this.resumeGame())
            },
            {
                text: 'Jauna spēle',
                x: 400, y: 320,
                width: 200, height: 50,
                action: () => this.closePauseMenuWithAnimation(() => this.showDifficultyMenu())
            },
            {
                text: 'Atpakaļ',
                x: 400, y: 390,
                width: 200, height: 50,
                action: () => this.closePauseMenuWithAnimation(() => this.showMainMenu())
            }
        ];

        this.pauseButton = {
            x: 750,
            y: 30,
            width: 48,
            height: 48,
            img: this.pauseButtonImg,
            action: () => this.showPauseMenu()
        };
        // =========================
        //  SCORE / STATS MANAGER
        // =========================
        this.scoreManager = new ScoreManager();

        // =========================
        //  MAIN MENU DECOR (SUN, GRASS, TITLE)
        // =========================
        const canvas = this.uiManager.canvas;

        this.sun = {
            x: canvas.width / 2,
            baseY: canvas.height / 2 + 200,
            y: canvas.height + 400,
            innerRadius: 55 * 3,
            outerRadius: 170 * 3,
            angle: 0,
            speed: 0.0008,
            alpha: 0,
            delay: 1000,
            appearDuration: 4000,
            startTime: 0
        };

        this.mainMenuGrassImage = document.getElementById('main-menu-grass');
        this.mainMenuGrassAnim = {
            startTime: 0,
            duration: 800,
            progress: 1
        };

        this.titleLeftImg = document.getElementById('main-menu-title-left');
        this.titleRightImg = document.getElementById('main-menu-title-right');

        this.titleAnim = {
            startTime: 0,
            duration: 900,
            progress: 1,
            tNorm: 1
        };

        this.mainMenuButtonsAnim = {
            startTime: performance.now(),
            duration: 700,
            progress: 1
        };

        // =========================
        //  SFX TIMEOUTS
        // =========================
        this.sfxTimeouts = [];

    }

    // =========================
    //  INIT / SETUP
    // =========================
    init() {
        this.setupEventListeners();
        this.startGameLoop();
        this.loadGameState();
        this.loadDifficulty();
        this.loadCustomSettings();
        this.initAudio();
        this.assetsLoaded = true;
    }

    setupEventListeners() {
        const canvas = this.uiManager.canvas;

        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e), true);
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e), true);
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e), true);

        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.gameState === 'playing' || this.gameState === 'dialog' || this.gameState === 'consequence') {
                    closeGameModal();
                }
            }
        });
    }

    initAudio() {
        const startAudio = () => {
            if (!this.audioStarted) {
                this.audioManager.playBackgroundMusic();
                this.audioManager.playAmbientSFX('ambient-nature');
                this.audioStarted = true;

                document.removeEventListener('click', startAudio);
                document.removeEventListener('touchstart', startAudio);
            }
        };

        document.addEventListener('click', startAudio);
        document.addEventListener('touchstart', startAudio);
    }

    startGameLoop() {
        const gameLoop = () => {
            this.update();
            this.draw();
            this.animationFrame = requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    // =========================
    //  DIFFICULTY & CUSTOM SETTINGS
    // =========================
    loadDifficulty() {
        const savedDifficulty = localStorage.getItem('recyclingGame_difficulty');
        if (savedDifficulty && this.difficultySettings[savedDifficulty]) {
            this.difficulty = savedDifficulty;
        }
    }

    saveDifficulty() {
        localStorage.setItem('recyclingGame_difficulty', this.difficulty);
    }

    startGameWithDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.saveDifficulty();

        const settings = this.difficultySettings[difficulty];
        this.gameDuration = settings.durationSec;
        this.actualGameDuration = settings.durationSec;

        this.startGame();
    }

    showCustomSettingsMenu() {
        this.gameState = 'customSettings';
        this.audioManager.playUIClick();

        if (this.difficultyPanelAnim) {
            this.difficultyPanelAnim.startTime = performance.now();
        }
    }

    saveCustomSettings() {
        const settings = {
            spawnInterval: this.difficultySettings.custom.spawnInterval,
            maxItems: this.difficultySettings.custom.maxItems,
            durationSec: this.difficultySettings.custom.durationSec
        };
        localStorage.setItem('recyclingGame_customSettings', JSON.stringify(settings));
    }

    loadCustomSettings() {
        const saved = localStorage.getItem('recyclingGame_customSettings');
        if (!saved) return;

        try {
            const settings = JSON.parse(saved);

            if (typeof settings.spawnInterval === 'number') {
                this.difficultySettings.custom.spawnInterval = settings.spawnInterval;
            }
            if (typeof settings.maxItems === 'number') {
                this.difficultySettings.custom.maxItems = settings.maxItems;
            }
            if (typeof settings.durationSec === 'number') {
                this.difficultySettings.custom.durationSec = settings.durationSec;
            }

            if (this.spawnIntervalSlider) {
                this.spawnIntervalSlider.value = this.difficultySettings.custom.spawnInterval;
            }
            if (this.maxItemsSlider) {
                this.maxItemsSlider.value = this.difficultySettings.custom.maxItems;
            }
            if (this.customTimeSlider) {
                this.customTimeSlider.value = this.difficultySettings.custom.durationSec;
            }
        } catch (e) {
            console.log('Error loading custom settings:', e);
        }
    }

    updateCustomDuration(value) {
        this.difficultySettings.custom.durationSec = value;
        this.saveCustomSettings();
    }

    updateCustomSpawnInterval(value) {
        this.difficultySettings.custom.spawnInterval = value;
        this.saveCustomSettings();
    }

    updateCustomMaxItems(value) {
        this.difficultySettings.custom.maxItems = value;
        this.saveCustomSettings();
    }

    updateSliderValue(slider, mouseX) {
        const sliderStart = slider.x - slider.width / 2;
        const relativeX = Math.max(0, Math.min(slider.width, mouseX - sliderStart));
        const percentage = relativeX / slider.width;
        const newValue = slider.min + percentage * (slider.max - slider.min);

        if (slider === this.spawnIntervalSlider) {
            slider.value = Math.round(newValue / 100) * 100;
            this.updateCustomSpawnInterval(slider.value);
        } else if (slider === this.maxItemsSlider) {
            slider.value = Math.round(newValue);
            this.updateCustomMaxItems(slider.value);
        } else if (slider === this.customTimeSlider) {
            slider.value = Math.round(newValue);
            this.updateCustomDuration(slider.value);
        }
    }

    getCurrentDifficultySettings() {
        const settings = this.difficultySettings[this.difficulty];

        if (this.difficulty === 'custom') {
            return {
                ...settings,
                spawnInterval: this.spawnIntervalSlider.value,
                maxItems: this.maxItemsSlider.value,
                durationSec: Math.round(this.customTimeSlider.value)
            };
        }

        return settings;
    }

    showDifficultyMenu() {
        this.gameState = 'difficultyMenu';
        this.pauseGameTimers();
        this.audioManager.playUIClick();

        if (this.difficultyPanelAnim) {
            this.difficultyPanelAnim.startTime = performance.now();
        }
    }

    backToMainMenuFromDifficulty() {
        this.gameState = 'mainMenu';
        this.audioManager.playUIClick();

        if (this.difficultyPanelAnim) {
            this.difficultyPanelAnim.startTime = 0;
        }
    }

    // =========================
    //  GAME STATE SAVE / LOAD
    // =========================
    saveGameState() {
        if (this.gameState === 'playing' || this.gameState === 'dialog' || this.gameState === 'consequence') {
            this.savedGameState = {
                score: this.score,
                timeLeft: this.timeLeft,
                gameState: this.gameState,
                timestamp: Date.now(),
                difficulty: this.difficulty,
                gameDuration: this.gameDuration,
                actualGameDuration: this.actualGameDuration
            };
            localStorage.setItem('recyclingGame_savedState', JSON.stringify(this.savedGameState));
        }
    }

    loadGameState() {
        const saved = localStorage.getItem('recyclingGame_savedState');
        if (!saved) return false;

        try {
            this.savedGameState = JSON.parse(saved);
            const now = Date.now();
            const savedTime = this.savedGameState.timestamp;

            // Old saves (>24h) are considered expired
            if (now - savedTime > 24 * 60 * 60 * 1000) {
                this.clearSavedGameState();
                return false;
            }
            return true;
        } catch (e) {
            this.clearSavedGameState();
            return false;
        }
    }

    hasSavedGame() {
        return this.savedGameState !== null;
    }

    clearSavedGameState() {
        localStorage.removeItem('recyclingGame_savedState');
        this.savedGameState = null;
    }

    // =========================
    //  MAIN MENU / CONTINUE
    // =========================
    showMainMenu() {
        this.gameState = 'mainMenu';
        this.pauseGameTimers();
        this.resetDragState();

        this.audioManager.playAmbientSFX('ambient-nature');
        this.audioManager.playUIClick();

        if (this.mainMenuGrassAnim) {
            this.mainMenuGrassAnim.startTime = performance.now();
            this.mainMenuGrassAnim.progress = 0;
        }

        this.titleAnim.startTime = performance.now();
        this.titleAnim.progress = 0;
        this.titleAnim.tNorm = 0;

        const canvas = this.uiManager.canvas;
        this.sun.startTime = performance.now();
        this.sun.alpha = 0;
        this.sun.y = canvas.height + 400;
        this.sun.angle = 0;

        this.mainMenuButtonsAnim.startTime = performance.now();
        this.mainMenuButtonsAnim.progress = 0;
    }

    continueGame() {
        if (!this.savedGameState) {
            this.showDifficultyMenu();
            return;
        }

        if (this.savedGameState.timeLeft <= 0) {
            this.clearSavedGameState();
            this.showDifficultyMenu();
            return;
        }

        this.score = this.savedGameState.score;
        this.timeLeft = this.savedGameState.timeLeft;
        this.gameState = 'playing';

        if (this.savedGameState.difficulty) {
            this.difficulty = this.savedGameState.difficulty;
            const settings = this.difficultySettings[this.difficulty];
            this.itemManager.maxItems = settings.maxItems;

            if (this.savedGameState.actualGameDuration) {
                this.actualGameDuration = this.savedGameState.actualGameDuration;
            } else if (this.savedGameState.gameDuration) {
                this.actualGameDuration = this.savedGameState.gameDuration;
            } else {
                this.actualGameDuration = settings.durationSec;
            }
        }

        if (this.savedGameState.gameDuration) {
            this.gameDuration = this.savedGameState.gameDuration;
        } else {
            this.gameDuration = this.actualGameDuration;
        }

        this.uiManager.updateScore(this.score);

        this.audioManager.stopAmbientSFX();
        this.audioManager.playAmbientSFX('ambient-nature');
        this.audioManager.playGameStart();

        this.startItemSpawning();
    }

    startItemSpawning() {
        const settings = this.getCurrentDifficultySettings();

        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }

        this.spawnInterval = setInterval(() => {
            if (this.gameState !== 'playing') return;

            this.totalSpawnAttempts++;

            if (this.itemManager.activeItems.length < this.itemManager.maxItems) {
                this.audioManager.playItemLand();

                if (this.gameState === 'playing' &&
                    this.itemManager.activeItems.length < this.itemManager.maxItems) {
                    this.itemManager.spawnNewItem();
                }
            } else {
                this.missedSpawns++;
            }
        }, settings.spawnInterval);
    }

    showPauseMenu() {
        if (this.gameState === 'playing' || this.gameState === 'dialog' || this.gameState === 'consequence') {
            this.saveGameState();
            this.prePauseState = this.gameState;
            this.gameState = 'pauseMenu';
            this.pauseGameTimers();

            this.audioManager.pauseAmbientSFX();
            this.audioManager.playUIClick();

            if (this.pauseMenuAnim) {
                this.pauseMenuAnim.startTime = performance.now();
                this.pauseMenuAnim.state = 'in';
                this.pauseMenuAnim.progress = 0;
            }
        }
    }

    closePauseMenuWithAnimation(finalAction) {
        if (!this.pauseMenuAnim) return;

        this._pauseMenuFinalAction = finalAction;
        this.pauseMenuAnim.startTime = performance.now();
        this.pauseMenuAnim.state = 'out';
    }

    // =========================
    //  UPDATE LOOP
    // =========================
    update() {
        if (this.gameState === 'mainMenu') {
            this.updateCarouselAnimation();
            this.updateMainMenuGrassAnimation();
            this.updateTitleAnimation();
            this.updateMainMenuButtonsAnimation();
            this.updateGuideOverlay();
        }

        this.updateSunAnimation();

        if (this.gameState === 'difficultyMenu') {
            this.updateDifficultyPanelAnimation();
        }

        if (this.gameState === 'pauseMenu') {
            this.updatePauseMenuAnimation();
        }

        if (this.gameState === 'gameover') {
            this.updateGameOverAnimation();
        }

        if (this.gameState === 'playing' || this.gameState === 'dialog' || this.gameState === 'consequence') {
            this.itemManager.updateItems();
            this.itemManager.updateBins();
            this.handleItemSounds();
            this.updateProgressBarAnimation();
        }
    }

    updateGuideOverlay() {
        const o = this.guideOverlay;
        if (!o) return;

        const duration = 400;
        const now = performance.now();

        if (o.animState === 'in') {
            let t = (now - o.animStartTime) / duration;
            if (t >= 1) {
                t = 1;
                o.animState = 'shown';
            }
            o.fade = this.easeOutCubic(t);
        } else if (o.animState === 'shown') {
            o.fade = 1;
        } else if (o.animState === 'out') {
            let t = (now - o.animStartTime) / duration;
            if (t >= 1) {
                t = 1;
                o.animState = 'hidden';
                o.isOpen = false;
            }
            o.fade = 1 - this.easeOutCubic(t);
        } else if (o.animState === 'hidden') {
            o.fade = 0;
        }

        if (o.step === 3 && !o.showChecked && o.lastSlideStartTime > 0) {
            o.showChecked = true;
        }
    }

    updateDifficultyPanelAnimation() {
        if (!this.difficultyPanelAnim) return;

        const now = performance.now();
        const elapsed = now - this.difficultyPanelAnim.startTime;
        const raw = Math.max(0, Math.min(1, elapsed / this.difficultyPanelAnim.duration));

        this.difficultyPanelAnim.progress = this.easeOutCubic(raw);
    }

    updateSunAnimation() {
        if (!this.sun) return;

        const s = this.sun;
        const now = performance.now();
        const elapsed = now - s.startTime;

        s.angle += s.speed;

        if (elapsed < s.delay) return;

        const tRaw = Math.min(1, (elapsed - s.delay) / s.appearDuration);
        const t = 1 - (1 - tRaw) * (1 - tRaw);

        s.alpha = t;

        const canvas = this.uiManager.canvas;
        const startY = canvas.height + 400;
        const targetY = s.baseY;

        s.y = startY + (targetY - startY) * t;
    }

    updateCarouselAnimation() {
        const c = this.bestScoreCarousel;
        if (!c || c.animDirection === 0) return;

        const duration = 300;
        const now = Date.now();
        let p = (now - c.animStartTime) / duration;
        if (p >= 1) {
            p = 1;
            c.currentIndex = c.toIndex;
            c.animDirection = 0;
        }
        c.animProgress = p;
    }

    updateMainMenuGrassAnimation() {
        if (!this.mainMenuGrassAnim) return;

        const a = this.mainMenuGrassAnim;
        if (a.progress >= 1) return;

        const now = performance.now();
        let t = (now - a.startTime) / a.duration;
        if (t > 1) t = 1;

        a.progress = this.easeOutCubic(t);
    }

    updateMainMenuButtonsAnimation() {
        const a = this.mainMenuButtonsAnim;
        if (!a || a.progress >= 1) return;

        const now = performance.now();
        let t = (now - a.startTime) / a.duration;
        if (t > 1) t = 1;

        a.progress = this.easeOutCubic(t);
    }

    updateTitleAnimation() {
        const a = this.titleAnim;
        if (!a) return;

        const now = performance.now();
        let t = (now - a.startTime) / a.duration;
        if (t > 1) t = 1;

        a.tNorm = this.easeOutCubic(t);

        const c1 = 1.70158;
        const c3 = c1 + 1;
        a.progress = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    updatePauseMenuAnimation() {
        const a = this.pauseMenuAnim;
        if (!a || a.state === 'hidden') return;

        const now = performance.now();
        let t = (now - a.startTime) / a.duration;
        if (t > 1) t = 1;
        if (t < 0) t = 0;

        const eased = this.easeOutCubic(t);

        if (a.state === 'in') {
            a.progress = eased;
            if (t >= 1) {
                a.state = 'shown';
            }
        } else if (a.state === 'out') {
            a.progress = 1 - eased;
            if (t >= 1) {
                a.state = 'hidden';
                const fn = this._pauseMenuFinalAction;
                this._pauseMenuFinalAction = null;
                if (fn) fn();
            }
        }
    }

    updateGameOverAnimation() {
        const a = this.gameOverAnim;
        if (!a || a.state === 'hidden') return;

        const now = performance.now();
        let t = (now - a.startTime) / a.duration;
        if (t > 1) t = 1;
        if (t < 0) t = 0;

        const eased = this.easeOutCubic(t);

        if (a.state === 'in') {
            a.progress = eased;
            if (t >= 1) {
                a.state = 'shown';
            }
        } else if (a.state === 'out') {
            a.progress = 1 - eased;
            if (t >= 1) {
                a.state = 'hidden';
                const fn = this._gameOverFinalAction;
                this._gameOverFinalAction = null;
                if (fn) fn();
            }
        }
    }

    updateProgressBarAnimation() {
        if (this.gameState !== 'playing') return;

        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.endGame();
            return;
        }

        const currentTime = Date.now();

        if (this.lastUpdateTime === 0) {
            this.lastUpdateTime = currentTime;
            return;
        }

        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        if (this.timeLeft > 0) {
            this.timeLeft = Math.max(0, this.timeLeft - deltaTime);
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.endGame();
                return;
            }
        }

        const totalTime = this.actualGameDuration || this.gameDuration;
        const targetProgress = this.timeLeft / totalTime;

        const widthDiff = targetProgress - this.currentProgressWidth;
        this.currentProgressWidth += widthDiff * 0.3;

        const targetColor = this.getColorForProgress(targetProgress);
        if (this.currentColor !== targetColor) {
            this.currentColor = this.lerpColor(this.currentColor, targetColor, this.colorTransitionSpeed);
        }
    }

    getColorForProgress(progress) {
        if (progress > 0.6) {
            return '#2ecc71';
        } else if (progress > 0.3) {
            return '#f39c12';
        } else {
            return '#e74c3c';
        }
    }

    lerpColor(color1, color2, factor) {
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ] : [0, 0, 0];
        };

        const rgbToHex = (r, g, b) => {
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b)
                .toString(16)
                .slice(1);
        };

        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);

        const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * factor);
        const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * factor);
        const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * factor);

        return rgbToHex(r, g, b);
    }

    // =========================
    //  SFX FOR ITEMS
    // =========================
    handleItemSounds() {
        const itemsForDropSound = this.itemManager.getItemsForDropSound();
        itemsForDropSound.forEach(item => {
            this.audioManager.playItemDrop();
            this.itemManager.markDropSoundProcessed(item);
        });

        const itemsForBounceSound = this.itemManager.getItemsForBounceSound();
        itemsForBounceSound.forEach(item => {
            this.audioManager.playGrassRustlingFirst();

            const timeoutId = setTimeout(() => {
                if (this.gameState === 'playing') {
                    this.audioManager.playGrassRustlingLast();
                }
            }, 400);

            this.registerSfxTimeout(timeoutId);
            this.itemManager.markBounceSoundProcessed(item);
        });

        const itemsForBounceDropSound = this.itemManager.getItemsForBounceDropSound();
        itemsForBounceDropSound.forEach(item => {
            this.audioManager.playSFX('item-drop', { volume: 0.4 });
            this.itemManager.markBounceDropSoundProcessed(item);
        });
    }

    registerSfxTimeout(timeoutId) {
        this.sfxTimeouts.push(timeoutId);
    }

    clearSfxTimeouts() {
        this.sfxTimeouts.forEach(id => clearTimeout(id));
        this.sfxTimeouts = [];
    }

    // =========================
    //  DRAW LOOP
    // =========================
    draw() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (this.gameState) {
            case 'mainMenu':
                this.drawMainMenu();
                break;
            case 'difficultyMenu':
                this.drawDifficultyMenu();
                break;
            case 'customSettings':
                this.drawCustomSettingsMenu();
                break;
            case 'playing':
            case 'dialog':
            case 'consequence':
                this.drawGameScene();

                if (this.gameState === 'dialog' && this.activeDialog) {
                    this.uiManager.drawDialog(
                        this.activeDialog.message,
                        this.activeDialog.isError,
                        () => this.showConsequenceDialog()
                    );
                }

                if (this.gameState === 'consequence' && this.consequenceItem && this.correctBin) {
                    this.uiManager.drawConsequenceDialog(
                        this.consequenceItem,
                        this.correctBin,
                        () => this.hideConsequenceDialog()
                    );
                }
                break;
            case 'pauseMenu':
                this.drawGameScene();
                this.drawPauseMenu();
                break;
            case 'gameover':
                this.drawGameScene();
                this.drawGameOver();
                break;
        }
    }

    // ---------- Main background / menu ----------

    drawMainMenu() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        const anim = this.mainMenuButtonsAnim || { progress: 1 };
        const btnAlpha = anim.progress !== undefined ? anim.progress : 1;

        this.drawMainMenuBackgroundOnly();

        const hasAnyBest = this.hasAnyBestScore();
        const visibleButtons = this.mainMenuButtons.filter(
            b => !b.visible || b.visible()
        );

        if (hasAnyBest) {
            const gap = 20;
            const totalWidth = visibleButtons.reduce(
                (sum, btn) => sum + btn.width,
                0
            ) + gap * (visibleButtons.length - 1);

            let startX = canvas.width / 2 - totalWidth / 2;
            const y = canvas.height - 80;

            visibleButtons.forEach(btn => {
                btn.x = startX + btn.width / 2;
                btn.y = y;
                this.drawImageButton(btn, btnAlpha);
                startX += btn.width + gap;
            });
        } else {
            const gap = 16;

            const totalHeight = visibleButtons.reduce(
                (sum, btn) => sum + (btn.height || 0),
                0
            ) + gap * (visibleButtons.length - 1);

            let currentY = canvas.height / 2 - totalHeight / 2;

            visibleButtons.forEach(btn => {
                btn.x = canvas.width / 2;
                btn.y = currentY + (btn.height || 0) * 1.5;
                this.drawImageButton(btn, btnAlpha);
                currentY += (btn.height || 0) + gap;
            });
        }

        if (this.guideButton && this.guideButton.img && this.guideButton.img.complete) {
            const button = this.guideButton;
            const img = button.img;

            if (!button.height) {
                const scale = button.width / img.width;
                button.height = img.height * scale;
            }

            const margin = 20;
            button.x = canvas.width - margin - button.width / 2;
            button.y = margin + button.height / 2;

            this.drawImageButton(button, 1);
        }

        this.drawGuideOverlay();
    }

    drawMainMenuBackgroundOnly() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        ctx.fillStyle = '#97DAFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.drawSunBackground();
        this.drawMainMenuGrass();
        this.drawMainMenuTitle();

        if (this.hasAnyBestScore()) {
            this.drawBestScoreCarousel();
        }
    }

    drawSunBackground() {
        if (!this.sun) return;

        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;
        const s = this.sun;

        if (s.alpha <= 0) return;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.globalAlpha = s.alpha * 0.9;

        const rays = 32;
        const step = (Math.PI * 2) / rays;
        const maxRadius = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
        const outerR = maxRadius * 1.1;

        for (let i = 0; i < rays; i++) {
            const isOrange = i % 2 === 0;
            const a1 = i * step;
            const a2 = (i + 1) * step;

            ctx.beginPath();
            ctx.moveTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
            ctx.lineTo(0, 0);
            ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
            ctx.closePath();

            ctx.fillStyle = isOrange
                ? '#b2e4ffff'
                : 'rgba(255, 255, 255, 0)';

            ctx.fill();
        }

        ctx.restore();
    }

    drawMainMenuGrass() {
        const img = this.mainMenuGrassImage;
        if (!img || !img.complete) return;

        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        const a = this.mainMenuGrassAnim || { progress: 1 };
        const p = a.progress !== undefined ? a.progress : 1;

        const scale = canvas.width / img.width;
        const grassHeight = img.height * scale;

        const targetY = canvas.height - grassHeight;
        const startY = canvas.height;
        const y = startY + (targetY - startY) * p;

        ctx.save();
        ctx.globalAlpha = p;
        ctx.drawImage(img, 0, y, canvas.width, grassHeight);
        ctx.restore();
    }

    drawMainMenuTitle() {
        const imgL = this.titleLeftImg;
        const imgR = this.titleRightImg;
        if (!imgL || !imgR) return;

        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        const p = this.titleAnim.progress;
        const t = this.titleAnim.tNorm || 1;
        const alpha = this.easeOutCubic(t);

        const allDiffs = ['easy', 'medium', 'hard'];
        const hasAnyBest = allDiffs.some(
            key => this.getBestScoreForDifficulty(key) !== null
        );

        const baseWidth = 300;
        const smallWidth = 180;
        const targetWidth = hasAnyBest ? smallWidth : baseWidth;

        const leftScale = targetWidth / imgL.width;
        const rightScale = targetWidth / imgR.width;

        const leftW = targetWidth;
        const leftH = imgL.height * leftScale;

        const rightW = targetWidth;
        const rightH = imgR.height * rightScale;

        const topY = 40;
        const gap = 8;
        const bottomY = topY + leftH + gap;

        const centerX = canvas.width / 2;
        const targetXLeft = centerX - leftW / 2;
        const targetXRight = centerX - rightW / 2;

        const leftStartX = -leftW - 80;
        const rightStartX = canvas.width + 80;

        const leftX = leftStartX + (targetXLeft - leftStartX) * p;
        const rightX = rightStartX + (targetXRight - rightStartX) * p;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(imgL, leftX, topY, leftW, leftH);
        ctx.drawImage(imgR, rightX, bottomY, rightW, rightH);
        ctx.restore();
    }

    // ---------- Carousel of Records ----------

    drawImageButton(button, alpha = 1) {
        const ctx = this.uiManager.ctx;
        const img = button.img;

        if (!img || !img.complete) return;

        if (!button.height) {
            const scale = button.width / img.width;
            button.height = img.height * scale;
        }

        const hovered = this.isMouseOverButton(button);
        button.isHovered = hovered;

        const x = button.x - button.width / 2;
        const y = button.y - button.height / 2;

        ctx.save();

        const scale = hovered ? 1.05 : 1.0;
        ctx.translate(button.x, button.y);
        ctx.scale(scale, scale);
        ctx.translate(-button.x, -button.y);

        if (button.hasShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;
        }

        ctx.globalAlpha = (hovered ? 0.95 : 1.0) * alpha;
        ctx.drawImage(img, x, y, button.width, button.height);

        ctx.restore();
    }


    drawBestScoreCard(difficultyKey, title, centerX, centerY, color, hovered = false) {
        const ctx = this.uiManager.ctx;
        const best = this.getBestScoreForDifficulty(difficultyKey);

        const cardWidth = 260;
        const cardHeight = 300;
        const radius = 18;
        const floatOffset = 0;

        if (!this.cardHoverState) this.cardHoverState = {};
        if (typeof this.cardHoverState[difficultyKey] !== 'number') {
            this.cardHoverState[difficultyKey] = 0;
        }

        const target = hovered ? 1 : 0;
        const speed = 0.18;
        let h = this.cardHoverState[difficultyKey];

        h += (target - h) * speed;
        h = Math.max(0, Math.min(1, h));

        this.cardHoverState[difficultyKey] = h;

        const scale = 1 + h * 0.06;

        ctx.save();
        ctx.translate(centerX, centerY + floatOffset);
        ctx.scale(scale, scale);

        const x = -cardWidth / 2;
        const y = -cardHeight / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;

        this.roundRectPath(ctx, x, y, cardWidth, cardHeight, radius);

        const maxRadius = Math.max(cardWidth, cardHeight) * 0.3;
        const gradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, maxRadius
        );

        gradient.addColorStop(0.0, this.hexToRGBA(color, 0.6));
        gradient.addColorStop(0.5, this.hexToRGBA(color, 0.2));
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.fillStyle = '#0F362A';
        ctx.font = 'bold 25px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(title, 0, y + 16);

        const cupCenterY = y + 95;
        const cupImg = this.cupImg;
        if (cupImg && cupImg.complete) {
            const ratio = cupImg.naturalWidth / cupImg.naturalHeight;
            const targetHeight = 90;
            const targetWidth = targetHeight * ratio;

            ctx.drawImage(
                cupImg,
                -targetWidth / 2,
                cupCenterY - targetHeight / 2,
                targetWidth,
                targetHeight
            );
        }

        const starY = y + 160;
        if (best && best.stars > 0) {
            const starImage = document.getElementById('star');
            if (starImage && starImage.complete) {
                const starSize = 25;
                const spacing = 10;
                const totalWidth = best.stars * starSize + (best.stars - 1) * spacing;
                let sx = -totalWidth / 2;

                for (let i = 0; i < best.stars; i++) {
                    ctx.drawImage(starImage, sx, starY - starSize / 2, starSize, starSize);
                    sx += starSize + spacing;
                }
            }
        } else {
            ctx.fillStyle = '#000000ff';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Nav zvaigznes', 0, starY - 5);
        }

        ctx.fillStyle = '#000000ff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';

        if (best) {
            const lineY = y + 185;
            ctx.fillText(`Rezultāts: ${best.score}`, 0, lineY);
        }

        ctx.restore();
    }

    hexToRGBA(hex, alpha) {
        const bigint = parseInt(hex.replace('#', ''), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    nextCarouselDifficulty() {
        const c = this.bestScoreCarousel;
        if (c.animDirection !== 0) return;

        const len = c.difficulties.length;
        c.fromIndex = c.currentIndex;
        c.toIndex = (c.currentIndex + 1) % len;
        c.animDirection = 1;
        c.animStartTime = Date.now();
        c.animProgress = 0;

        this.audioManager.playUIClick();
    }

    prevCarouselDifficulty() {
        const c = this.bestScoreCarousel;
        if (c.animDirection !== 0) return;

        const len = c.difficulties.length;
        c.fromIndex = c.currentIndex;
        c.toIndex = (c.currentIndex - 1 + len) % len;
        c.animDirection = -1;
        c.animStartTime = Date.now();
        c.animProgress = 0;

        this.audioManager.playUIClick();
    }

    drawBestScoreCarousel() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        if (this.gameState !== 'mainMenu') {
            this.carouselLeftArea = null;
            this.carouselRightArea = null;
            return;
        }

        if (!this.bestScoreCarousel) {
            this.bestScoreCarousel = {
                difficulties: ['easy', 'medium', 'hard'],
                currentIndex: 0,
                animProgress: 0,
                animDirection: 0,
                animStartTime: 0,
                fromIndex: 0,
                toIndex: 0
            };
        }

        const c = this.bestScoreCarousel;

        const allDiffs = ['easy', 'medium', 'hard'];
        const diffsWithScores = allDiffs.filter(
            key => this.getBestScoreForDifficulty(key) !== null
        );

        if (diffsWithScores.length === 0) {
            this.carouselLeftArea = null;
            this.carouselRightArea = null;
            this.bestScoreCardArea = null;
            return;
        }

        c.difficulties = diffsWithScores;

        if (c.currentIndex >= c.difficulties.length) c.currentIndex = 0;
        if (c.fromIndex >= c.difficulties.length) c.fromIndex = c.currentIndex;
        if (c.toIndex >= c.difficulties.length) c.toIndex = c.currentIndex;

        const diffs = c.difficulties;

        const centerX = canvas.width / 2;
        const centerY = 320;
        const offset = 320;

        const difficultyMeta = {
            easy: { title: 'Viegla', color: '#00ff08' },
            medium: { title: 'Vidēja', color: '#ffff00' },
            hard: { title: 'Grūta', color: '#ff0000' }
        };

        const getMeta = (key) =>
            difficultyMeta[key] || { title: key, color: '#3498db' };

        const cardWidth = 260;
        const cardHeight = 200;
        this.bestScoreCardArea = {
            x: centerX - cardWidth / 2,
            y: centerY - cardHeight / 2,
            width: cardWidth,
            height: cardHeight
        };

        let isCardHovered = false;
        if (this.mousePos) {
            const mx = this.mousePos.x;
            const my = this.mousePos.y;
            const area = this.bestScoreCardArea;
            if (
                mx >= area.x && mx <= area.x + area.width &&
                my >= area.y && my <= area.y + area.height
            ) {
                isCardHovered = true;
            }
        }

        const arrowHeight = 48;
        const arrowY = centerY;

        if (diffs.length > 1 && this.carouselArrowImg && this.carouselArrowImg.complete) {
            const img = this.carouselArrowImg;
            const ratio = img.naturalWidth / img.naturalHeight;
            const arrowWidth = arrowHeight * ratio;

            const leftCenterX = centerX - 220;
            const rightCenterX = centerX + 220;

            ctx.save();
            ctx.translate(leftCenterX, arrowY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                img,
                -arrowWidth / 2,
                -arrowHeight / 2,
                arrowWidth,
                arrowHeight
            );
            ctx.restore();

            ctx.save();
            ctx.translate(rightCenterX, arrowY);
            ctx.drawImage(
                img,
                -arrowWidth / 2,
                -arrowHeight / 2,
                arrowWidth,
                arrowHeight
            );
            ctx.restore();

            this.carouselLeftArea = {
                x: leftCenterX - arrowWidth / 2,
                y: arrowY - arrowHeight / 2,
                width: arrowWidth,
                height: arrowHeight
            };
            this.carouselRightArea = {
                x: rightCenterX - arrowWidth / 2,
                y: arrowY - arrowHeight / 2,
                width: arrowWidth,
                height: arrowHeight
            };
        } else {
            this.carouselLeftArea = null;
            this.carouselRightArea = null;
        }

        const dir = c.animDirection;
        const rawProgress = c.animProgress || 0;
        const p = rawProgress <= 0
            ? 0
            : rawProgress >= 1
                ? 1
                : (rawProgress * rawProgress * (3 - 2 * rawProgress));

        if (dir === 0) {
            const key = diffs[c.currentIndex];
            const meta = getMeta(key);
            this.drawBestScoreCard(key, meta.title, centerX, centerY, meta.color, isCardHovered);
        } else {
            const offsetSign = dir > 0 ? 1 : -1;
            const fromIndex = c.fromIndex ?? c.currentIndex;
            const toIndex = c.toIndex ?? c.currentIndex;

            const oldKey = diffs[fromIndex];
            const newKey = diffs[toIndex];
            const oldMeta = getMeta(oldKey);
            const newMeta = getMeta(newKey);

            const oldX = centerX - p * offset * offsetSign;
            ctx.save();
            ctx.globalAlpha = 1 - p;
            this.drawBestScoreCard(oldKey, oldMeta.title, oldX, centerY, oldMeta.color, false);
            ctx.restore();

            const newX = centerX + (1 - p) * offset * offsetSign;
            ctx.save();
            ctx.globalAlpha = p;
            this.drawBestScoreCard(newKey, newMeta.title, newX, centerY, newMeta.color, false);
            ctx.restore();
        }
    }

    // ---------- Difficulty menu / custom ----------

    getDifficultyPanelProgress() {
        if (!this.difficultyPanelAnim) return 1;
        const a = this.difficultyPanelAnim;
        if (!a.startTime) return 1;

        const now = performance.now();
        let t = (now - a.startTime) / a.duration;
        if (t < 0) t = 0;
        if (t > 1) t = 1;

        return this.easeOutCubic(t);
    }

    drawDifficultyPaperBackground() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        const p = this.getDifficultyPanelProgress();
        const slideX = canvas.width - canvas.width * p;
        const fullW = canvas.width;
        const fullH = canvas.height;

        if (this.paperImg && this.paperImg.complete) {
            ctx.drawImage(this.paperImg, slideX, 0, fullW, fullH);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.96)';
            ctx.fillRect(slideX, 0, fullW, fullH);
        }

        return { slideX, fullW, fullH, p };
    }

    drawDifficultyMenu() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        this.drawMainMenuBackgroundOnly();

        const { slideX, fullW, fullH } = this.drawDifficultyPaperBackground();

        const controlsWidth = 300;
        const paddingRight = 120;
        const rightEdge = slideX + fullW;
        const centerX = rightEdge - paddingRight - controlsWidth / 2;
        const titleY = fullH * 0.22;

        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sarežģītības izvēle', centerX, titleY);

        const startY = fullH * 0.34;
        const stepY = 48;

        this.difficultyMenuButtons.forEach((button, index) => {
            button.x = centerX;
            button.y = startY + index * stepY;
            this.drawTextMenuButton(button);
        });
    }

    drawCustomSettingsMenu() {
        const ctx = this.uiManager.ctx;

        this.drawMainMenuBackgroundOnly();

        const { slideX, fullW, fullH } = this.drawDifficultyPaperBackground();

        const controlsWidth = 200;
        const paddingRight = 120;
        const rightEdge = slideX + fullW;
        const centerX = rightEdge - paddingRight - controlsWidth / 2;
        const titleY = fullH * 0.18;

        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sava sarežģītība', centerX, titleY);

        this.customTimeSlider.x = centerX;
        this.spawnIntervalSlider.x = centerX;
        this.maxItemsSlider.x = centerX;

        this.customTimeSlider.y = fullH * 0.30;
        this.spawnIntervalSlider.y = fullH * 0.40;
        this.maxItemsSlider.y = fullH * 0.50;

        this.drawSlider(
            this.customTimeSlider,
            `Spēles laiks: ${Math.round(this.customTimeSlider.value)} sek.`
        );

        this.drawSlider(
            this.spawnIntervalSlider,
            `Parādīšanās intervāls: ${this.spawnIntervalSlider.value} ms.`
        );

        this.drawSlider(
            this.maxItemsSlider,
            `Maks. priekšmetu skaits: ${this.maxItemsSlider.value}`
        );

        const btnStartY = fullH * 0.62;
        const btnBackY = fullH * 0.72;

        if (this.customSettingsMenuButtons[0]) {
            this.customSettingsMenuButtons[0].x = centerX;
            this.customSettingsMenuButtons[0].y = btnStartY;
            this.drawTextMenuButton(this.customSettingsMenuButtons[0]);
        }

        if (this.customSettingsMenuButtons[1]) {
            this.customSettingsMenuButtons[1].x = centerX;
            this.customSettingsMenuButtons[1].y = btnBackY;
            this.drawTextMenuButton(this.customSettingsMenuButtons[1]);
        }
    }

    drawTextMenuButton(button) {
        const ctx = this.uiManager.ctx;

        ctx.font = '23px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(button.text);
        const textWidth = metrics.width;
        const textHeight = 24;

        button.width = textWidth + 24;
        button.height = textHeight + 6;

        const isHovered = this.isMouseOverButton(button);
        button.isHovered = isHovered;

        const scale = isHovered ? 1.06 : 1.0;

        ctx.save();
        ctx.translate(button.x, button.y);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#2c3e50';
        ctx.fillText(button.text, 0, 0);

        ctx.restore();
    }

    drawSlider(slider, label) {
        const ctx = this.uiManager.ctx;

        ctx.fillStyle = '#2c3e50';
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(label, slider.x + slider.width / 2 - 10, slider.y - 20);

        ctx.fillStyle = '#B3A99C';
        const barX = slider.x - slider.width / 2;
        const barY = slider.y - 5;
        ctx.fillRect(barX, barY, slider.width, 10);

        const percentage = (slider.value - slider.min) / (slider.max - slider.min);
        const handleX = barX + percentage * slider.width;

        ctx.fillStyle = slider.dragging ? '#4f4c47ff' : '#383531';
        ctx.beginPath();
        ctx.arc(handleX, slider.y, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---------- Game scene ----------

    drawGameScene() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        ctx.fillStyle = '#97DAFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawSunBackground();
        this.uiManager.drawGame(
            this.itemManager.bins,
            this.itemManager.activeItems,
            this.draggedItem,
            this.itemManager.spawnArea
        );

        // FOR DEBUG
        // this.itemManager.drawSpawnAreaDebug(this.uiManager.ctx); 
        this.drawTimeProgressBar();
        this.drawPauseButton();
        this.drawDifficultyIndicator();
    }



    drawTimeProgressBar() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        const barHeight = 20;
        const barY = 10;
        const padding = 20;
        const barWidth = canvas.width - (padding * 2);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(padding, barY, barWidth, barHeight);

        const filledWidth = barWidth * this.currentProgressWidth;
        ctx.fillStyle = this.currentColor;
        ctx.fillRect(padding, barY, filledWidth, barHeight);

        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, barY, barWidth, barHeight);

        const displayTime = Math.ceil(this.timeLeft);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${displayTime}sek.`, canvas.width / 2, barY + barHeight / 2);
    }

    drawDifficultyIndicator() {
        const ctx = this.uiManager.ctx;
        const settings = this.getCurrentDifficultySettings();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 40, 120, 30);

        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Pakāpe: ${settings.name}`, 20, 55);
    }

    drawPauseButton() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;
        const button = this.pauseButton;
        const img = button.img;

        if (!img || !img.complete) return;

        const margin = 20;

        button.x = canvas.width - margin - button.width / 2;
        button.y = margin + button.height / 2;

        const isHovered = this.isMouseOverButton(button);
        button.isHovered = isHovered;

        const x = button.x - button.width / 2;
        const y = button.y - button.height / 2;

        ctx.save();

        const scale = isHovered ? 1.05 : 1.0;
        ctx.translate(button.x, button.y);
        ctx.scale(scale, scale);
        ctx.translate(-button.x, -button.y);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.drawImage(img, x, y, button.width + 5, button.height + 5);

        ctx.restore();
    }


    // ---------- PAUSE MENU ----------

    drawPauseMenu() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        const p = this.pauseMenuAnim ? (this.pauseMenuAnim.progress || 0) : 1;

        ctx.save();
        ctx.globalAlpha = 0.7 * p;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        const dialogWidth = 500;
        const dialogHeight = 500;
        const dialogX = canvas.width / 2 - dialogWidth / 2;

        const targetY = 10;
        const startY = canvas.height;
        const dialogY = startY + (targetY - startY) * p;

        ctx.save();
        ctx.globalAlpha = p;

        if (this.pausePanelImg && this.pausePanelImg.complete) {
            ctx.drawImage(this.pausePanelImg, dialogX, dialogY, dialogWidth, dialogHeight);
        }

        const centerX = canvas.width / 2;
        const firstButtonY = dialogY + 215;
        const stepY = 60;

        this.pauseMenuButtons.forEach((button, index) => {
            button.x = centerX;
            button.y = firstButtonY + index * stepY;
            this.drawButton(button);
        });

        ctx.restore();
    }

    drawButton(button) {
        const ctx = this.uiManager.ctx;
        const isHovered = this.isMouseOverButton(button);

        const x = button.x - button.width / 2;
        const y = button.y - button.height / 2;
        const w = button.width;
        const h = button.height;
        const radius = 18;

        ctx.save();

        const scale = isHovered ? 1.05 : 1.0;
        ctx.translate(button.x, button.y);
        ctx.scale(scale, scale);
        ctx.translate(-button.x, -button.y);

        this.roundRectPath(ctx, x, y, w, h, radius);

        const grad = ctx.createLinearGradient(x, 0, x + w, 0);
        grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(button.text, button.x, button.y);

        ctx.restore();

        button.isHovered = isHovered;
    }

    roundRectPath(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ---------- GAME OVER ----------

    drawGameOver() {
        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        const p = this.gameOverAnim ? (this.gameOverAnim.progress || 0) : 1;

        ctx.save();
        ctx.globalAlpha = 0.7 * p;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        const dialogWidth = 500;
        const dialogHeight = 500;
        const dialogX = canvas.width / 2 - dialogWidth / 2;

        const targetY = 10;
        const startY = canvas.height;
        const dialogY = startY + (targetY - startY) * p;

        ctx.save();
        ctx.globalAlpha = p;

        if (this.gameOverPanelImg && this.gameOverPanelImg.complete) {
            ctx.drawImage(this.gameOverPanelImg, dialogX, dialogY, dialogWidth, dialogHeight);
        }

        const starsEarned = this.calculateStars();

        let titleText;
        switch (starsEarned) {
            case 0: titleText = 'Šausmas!'; break;
            case 1: titleText = 'Nākamreiz izdosies'; break;
            case 2: titleText = 'Tu esi lielisks!'; break;
            case 3:
            default: titleText = 'Lieliski strādāts!'; break;
        }

        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.lineWidth = 5;
        ctx.strokeStyle = 'black';
        ctx.strokeText(titleText, canvas.width / 2, dialogY + 195);

        ctx.fillStyle = 'white';
        ctx.fillText(titleText, canvas.width / 2, dialogY + 195);


        const scoreText = `Jūsu rezultāts: ${this.score}`;
        ctx.font = '24px Arial';

        ctx.lineWidth = 4;
        ctx.strokeStyle = 'black';
        ctx.strokeText(scoreText, canvas.width / 2, dialogY + 250);

        ctx.fillStyle = 'white';
        ctx.fillText(scoreText, canvas.width / 2, dialogY + 250);


        const elapsedTime = this.actualGameDuration - this.timeLeft;
        const timeText = `Laiks: ${elapsedTime} sek.`;

        ctx.lineWidth = 4;
        ctx.strokeStyle = 'black';
        ctx.strokeText(timeText, canvas.width / 2, dialogY + 280);

        ctx.fillStyle = 'white';
        ctx.fillText(timeText, canvas.width / 2, dialogY + 280);


        this.drawStars(canvas.width / 2, dialogY + dialogHeight - 165, starsEarned);

        const restartButton = {
            text: 'Spēlēt vēlreiz',
            x: canvas.width / 2,
            y: dialogY + dialogHeight - 115,
            width: 200,
            height: 50,
            action: () => this.closeGameOverWithAnimation(() => this.showDifficultyMenu())
        };

        this.gameOverRestartButton = restartButton;
        this.drawButton(restartButton);

        ctx.restore();
    }

    drawStars(centerX, y, starsCount) {
        const ctx = this.uiManager.ctx;
        const starSize = 45;
        const spacing = 50;
        const totalWidth = 3 * spacing;
        const startX = centerX - totalWidth / 2 + spacing / 2;

        const starImage = document.getElementById('star');

        for (let i = 0; i < 3; i++) {
            const x = startX + i * spacing;

            if (starImage && starImage.complete && i < starsCount) {
                ctx.globalAlpha = 1.0;
                ctx.drawImage(starImage, x - starSize / 2, y - starSize / 2, starSize, starSize);
            }
        }
    }

    closeGameOverWithAnimation(finalAction) {
        if (!this.gameOverAnim) return;

        this._gameOverFinalAction = finalAction;
        this.gameOverAnim.startTime = performance.now();
        this.gameOverAnim.state = 'out';
    }

    clampItemInsideCanvas(item) {
        const canvas = this.uiManager.canvas;
        if (!canvas || !item) return;

        const r = item.radius || Math.max(item.width || 0, item.height || 0) / 2 || 20;

        if (item.x < r) item.x = r;
        if (item.x > canvas.width - r) item.x = canvas.width - r;

        if (item.y < r) item.y = r;
        if (item.y > canvas.height - r) item.y = canvas.height - r;
    }

    // =========================
    //  SCORES
    // =========================
    getBestScoreForDifficulty(difficulty) {
        const scores = this.scoreManager.getScores();
        const difficultyScores = scores[difficulty]?.durations || {};

        let best = null;

        Object.keys(difficultyScores).forEach(duration => {
            const s = difficultyScores[duration];
            if (!s) return;

            const candidate = {
                score: s.score,
                time: s.time,
                stars: s.stars || 0,
                duration: parseInt(duration, 10),
                timestamp: s.timestamp
            };

            if (!best) {
                best = candidate;
            } else {
                if (candidate.score > best.score ||
                    (candidate.score === best.score && candidate.time < best.time)) {
                    best = candidate;
                }
            }
        });

        return best;
    }

    hasAnyBestScore() {
        const allDiffs = ['easy', 'medium', 'hard'];
        return allDiffs.some(
            key => this.getBestScoreForDifficulty(key) !== null
        );
    }

    getSortedScoresForDifficulty(difficulty) {
        const scores = this.scoreManager.getScores();
        const difficultyScores = scores[difficulty]?.durations || {};
        const allScores = [];

        Object.keys(difficultyScores).forEach(duration => {
            const scoreData = difficultyScores[duration];
            if (scoreData && scoreData.score > 0) {
                allScores.push({
                    score: scoreData.score,
                    time: scoreData.time,
                    stars: scoreData.stars || 0,
                    duration: parseInt(duration, 10),
                    timestamp: scoreData.timestamp
                });
            }
        });

        return allScores.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });
    }

    // =========================
    //  INPUT HANDLERS
    // =========================
    isMouseOverSlider(slider) {
        if (!this.mousePos) return false;
        return (
            this.mousePos.x >= slider.x - slider.width / 2 &&
            this.mousePos.x <= slider.x + slider.width / 2 &&
            this.mousePos.y >= slider.y - slider.height / 2 &&
            this.mousePos.y <= slider.y + slider.height / 2
        );
    }

    isMouseOverButton(button) {
        if (!this.mousePos) return false;
        return this.mousePos.x >= button.x - button.width / 2 &&
            this.mousePos.x <= button.x + button.width / 2 &&
            this.mousePos.y >= button.y - button.height / 2 &&
            this.mousePos.y <= button.y + button.height / 2;
    }

    onTouchStart(e) {
        e.preventDefault();

        const touch = e.touches[0];
        if (!touch) return;

        const fakeMouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };

        this.handleMouseDown(fakeMouseEvent);
    }

    onTouchMove(e) {
        e.preventDefault();

        const touch = e.touches[0];
        if (!touch) return;

        const fakeMouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };

        this.handleMouseMove(fakeMouseEvent);
    }

    onTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp({});
    }

    handleMouseDown(e) {
        const pos = this.uiManager.getMousePos(e);
        this.mousePos = pos;

        switch (this.gameState) {
            case 'mainMenu':
                if (this.guideOverlay &&
                    this.guideOverlay.isOpen &&
                    this.guideOverlay.animState !== 'hidden') {

                    this.handleGuideClick();
                    return;
                }

                if (this.guideButton && this.isMouseOverButton(this.guideButton)) {
                    this.audioManager.playUIClick();
                    this.guideButton.action();
                    return;
                }

                if (this.carouselLeftArea &&
                    pos.x >= this.carouselLeftArea.x &&
                    pos.x <= this.carouselLeftArea.x + this.carouselLeftArea.width &&
                    pos.y >= this.carouselLeftArea.y &&
                    pos.y <= this.carouselLeftArea.y + this.carouselLeftArea.height) {
                    this.prevCarouselDifficulty();
                    return;
                }

                if (this.carouselRightArea &&
                    pos.x >= this.carouselRightArea.x &&
                    pos.x <= this.carouselRightArea.x + this.carouselRightArea.width &&
                    pos.y >= this.carouselRightArea.y &&
                    pos.y <= this.carouselRightArea.y + this.carouselRightArea.height) {
                    this.nextCarouselDifficulty();
                    return;
                }

                this.mainMenuButtons.forEach(button => {
                    if ((!button.visible || button.visible()) && this.isMouseOverButton(button)) {
                        this.audioManager.playUIClick();
                        button.action();
                    }
                });
                break;

            case 'difficultyMenu':
                this.difficultyMenuButtons.forEach(button => {
                    if (this.isMouseOverButton(button)) {
                        this.audioManager.playUIClick();
                        button.action();
                    }
                });
                break;

            case 'customSettings':
                if (this.isMouseOverSlider(this.customTimeSlider)) {
                    this.customTimeSlider.dragging = true;
                    this.updateSliderValue(this.customTimeSlider, this.mousePos.x);
                } else if (this.isMouseOverSlider(this.spawnIntervalSlider)) {
                    this.spawnIntervalSlider.dragging = true;
                    this.updateSliderValue(this.spawnIntervalSlider, this.mousePos.x);
                } else if (this.isMouseOverSlider(this.maxItemsSlider)) {
                    this.maxItemsSlider.dragging = true;
                    this.updateSliderValue(this.maxItemsSlider, this.mousePos.x);
                } else {
                    this.customSettingsMenuButtons.forEach(button => {
                        if (this.isMouseOverButton(button)) {
                            this.audioManager.playUIClick();
                            button.action();
                        }
                    });
                }
                break;

            case 'pauseMenu':
                this.pauseMenuButtons.forEach(button => {
                    if (this.isMouseOverButton(button)) {
                        this.audioManager.playUIClick();
                        button.action();
                    }
                });
                break;

            case 'gameover':
                if (this.gameOverRestartButton &&
                    this.isMouseOverButton(this.gameOverRestartButton)) {

                    this.audioManager.playUIClick();
                    const btn = this.gameOverRestartButton;
                    if (btn.action) {
                        btn.action();
                    }
                }
                break;

            case 'playing':
            case 'dialog':
            case 'consequence':
                if (this.isMouseOverButton(this.pauseButton)) {
                    this.audioManager.playUIClick();
                    this.pauseButton.action();
                    return;
                }

                if (this.gameState === 'dialog') {
                    if (this.uiManager.isClickOnInfoButton(pos.x, pos.y)) {
                        this.audioManager.playUIClick();
                        this.showConsequenceDialog();
                    } else {
                        this.hideDialog();
                    }
                } else if (this.gameState === 'consequence') {
                    if (this.uiManager.isClickOnCloseButton(pos.x, pos.y)) {
                        this.audioManager.playUIClick();
                        this.hideConsequenceDialog();
                    } else {
                        this.hideConsequenceDialog();
                    }
                } else if (this.gameState === 'playing') {
                    const item = this.itemManager.getItemAtPosition(pos.x, pos.y);
                    if (item) {
                        this.isDragging = true;
                        this.draggedItem = item;
                        this.dragOffset.x = pos.x - item.x;
                        this.dragOffset.y = pos.y - item.y;
                        item.isFalling = false;
                        this.itemManager.bringToFront(item);
                        this.audioManager.playItemPickup();
                    }
                }
                break;
        }
    }

    handleMouseMove(e) {
        const pos = this.uiManager.getMousePos(e);
        this.mousePos = pos;

        if (this.gameState === 'playing') {
            this.itemManager.setBinHoverState(pos.x, pos.y, this.isDragging);

            if (this.isDragging && this.draggedItem) {
                this.draggedItem.x = pos.x - this.dragOffset.x;
                this.draggedItem.y = pos.y - this.dragOffset.y;

                this.clampItemInsideCanvas(this.draggedItem);
            }
        }


        if (this.gameState === 'customSettings') {
            if (this.customTimeSlider.dragging) {
                this.updateSliderValue(this.customTimeSlider, this.mousePos.x);
            }
            if (this.spawnIntervalSlider.dragging) {
                this.updateSliderValue(this.spawnIntervalSlider, this.mousePos.x);
            }
            if (this.maxItemsSlider.dragging) {
                this.updateSliderValue(this.maxItemsSlider, this.mousePos.x);
            }
        }
    }

    handleMouseUp(e) {
        if (this.gameState === 'playing' && this.isDragging && this.draggedItem) {
            const targetBin = this.itemManager.getBinAtPosition(
                this.draggedItem.x,
                this.draggedItem.y
            );

            if (targetBin) {
                if (this.itemManager.checkSorting(this.draggedItem, targetBin)) {
                    this.score += 1;
                    this.successfulSorts++;
                    this.uiManager.updateScore(this.score);
                    this.audioManager.playCorrectSort();
                } else {
                    const correctBin = this.itemManager.getBinByType(this.draggedItem.type);
                    const place = correctBin && (correctBin.dialogTargetLv || correctBin.name || 'pareizajā konteinerā');
                    const message = `Nepareizi! Atkritumu gabalu (${this.draggedItem.name}) jāizmet ${place}.`;

                    this.showDialog(message, true);
                    this.audioManager.playWrongSort();

                    this.consequenceItem = this.draggedItem;
                    this.correctBin = correctBin;
                }

                this.itemManager.removeItem(this.draggedItem.id);
            }

            this.resetDragState();
        }

        if (this.gameState === 'customSettings') {
            this.customTimeSlider.dragging = false;
            this.spawnIntervalSlider.dragging = false;
            this.maxItemsSlider.dragging = false;
        }
    }

    resetDragState() {
        this.isDragging = false;
        this.draggedItem = null;
        this.itemManager.setBinHoverState(0, 0, false);
    }

    // =========================
    //  DIALOG / CONSEQUENCE
    // =========================
    showDialog(message, isError = false) {
        if (this.gameState === 'gameover') return;

        this.activeDialog = { message, isError };
        this.gameState = 'dialog';
        this.pauseGameTimers();

        if (this.dialogAnim) {
            this.dialogAnim.startTime = performance.now();
            this.dialogAnim.state = 'in';
        }
    }

    hideDialog() {
        this.activeDialog = null;

        if (this.gameState === 'dialog') {
            if (this.timeLeft <= 0) {
                this.gameState = 'gameover';
                return;
            }

            this.gameState = 'playing';
            this.resumeGameTimers();
        }
    }

    showConsequenceDialog() {
        if (this.consequenceItem && this.correctBin) {
            this.gameState = 'consequence';
            this.audioManager.playShowDialog();
        }
    }

    hideConsequenceDialog() {
        if (this.gameState === 'consequence') {
            this.gameState = 'dialog';
        }
    }

    // =========================
    //  GAME FLOW
    // =========================
    pauseGameTimers() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }

        this.clearSfxTimeouts();
        this.lastUpdateTime = 0;
    }

    resumeGameTimers() {
        if (this.gameState === 'playing') {
            this.startItemSpawning();
            this.lastUpdateTime = 0;
        }
    }

    startGame() {
        this.clearSavedGameState();
        this.gameState = 'playing';
        this.score = 0;

        if (this.branchesAnim) {
            this.branchesAnim.startTime = performance.now();
            setTimeout(() => {
                this.audioManager.playGrassRustlingFirst();
            }, 120);
        }

        this.totalSpawnAttempts = 0;
        this.successfulSorts = 0;
        this.missedSpawns = 0;

        const settings = this.getCurrentDifficultySettings();
        this.actualGameDuration = settings.durationSec || this.gameDuration;
        this.gameDuration = this.actualGameDuration;
        this.timeLeft = this.actualGameDuration;

        this.currentProgressWidth = 1.0;
        this.lastUpdateTime = 0;
        this.currentColor = this.getColorForProgress(1.0);
        this.targetColor = this.currentColor;

        this.startTime = Date.now();
        this.activeDialog = null;
        this.consequenceItem = null;
        this.correctBin = null;
        this.prePauseState = null;

        this.itemManager.maxItems = settings.maxItems;

        this.resetDragState();
        this.itemManager.resetBins();
        this.itemManager.activeItems = [];

        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }

        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }

        this.uiManager.updateScore(this.score);

        this.audioManager.playGameStart();
        this.startItemSpawning();
    }

    restartGame() {
        this.pauseGameTimers();
        this.startGame();
    }

    resumeGame() {
        if (this.timeLeft <= 0) {
            if (this.gameState !== 'gameover') {
                this.endGame();
            }
            return;
        }

        if (this.gameState === 'pauseMenu' && this.prePauseState) {
            this.gameState = this.prePauseState;
            this.prePauseState = null;
        }

        this.resumeGameTimers();
        this.audioManager.resumeAmbientSFX();
        this.audioManager.playUIClick();
    }

    pauseGameAudio() {
        this.audioManager.pauseAmbientSFX();
    }

    resumeGameAudio() {
        if (this.audioManager.isMuted) return;
        this.audioManager.resumeAmbientSFX();
    }

    endGame() {
        this.gameState = 'gameover';

        if (this.gameOverAnim) {
            this.gameOverAnim.startTime = performance.now();
            this.gameOverAnim.state = 'in';
            this.gameOverAnim.progress = 0;
        }

        this.pauseGameTimers();
        this.clearSavedGameState();
        this.resetDragState();
        this.itemManager.resetBins();

        const totalTime = this.actualGameDuration || this.gameDuration;
        const starsEarned = this.difficulty === 'custom' ? 0 : this.calculateStars();

        this.scoreManager.updateScore(
            this.difficulty,
            this.score,
            this.timeLeft,
            totalTime,
            starsEarned
        );

        this.audioManager.stopAmbientSFX();
        this.audioManager.playAmbientSFX('ambient-nature');
        this.audioManager.playGameOver();
    }

    calculateStars() {
        if (this.totalSpawnAttempts === 0) {
            return 0;
        }

        const efficiency = this.successfulSorts / this.totalSpawnAttempts;
        const missedPenalty = this.missedSpawns / this.totalSpawnAttempts;
        const finalEfficiency = Math.max(0, efficiency - (missedPenalty * 0.2));

        if (finalEfficiency >= this.starSystem.threeStarEfficiency) {
            return 3;
        } else if (finalEfficiency >= this.starSystem.twoStarEfficiency) {
            return 2;
        } else if (finalEfficiency >= this.starSystem.oneStarEfficiency) {
            return 1;
        } else {
            return 0;
        }
    }

    resetHighScores() {
        if (confirm('Vai esat pārliecināts, ka vēlaties dzēst visus rekordus?')) {
            this.scoreManager.clearScores();
            this.audioManager.playUIClick();
        }
    }

    // =========================
    //  GUIDE OVERLAY
    // =========================
    openGuideOverlay() {
        const o = this.guideOverlay;
        o.isOpen = true;
        o.animState = 'in';
        o.animStartTime = performance.now();

        o.fade = 0;
        o.step = 0;
        o.lastSlideStartTime = 0;
        o.showChecked = false;
    }

    closeGuideOverlay() {
        const o = this.guideOverlay;
        if (!o.isOpen || o.animState === 'out' || o.animState === 'hidden') return;
        o.animState = 'out';
        o.animStartTime = performance.now();
    }

    handleGuideClick() {
        const o = this.guideOverlay;
        if (!o || !o.isOpen) return;
        if (o.animState !== 'shown') return;

        if (o.step < 3) {
            o.step++;
            if (o.step === 3) {
                o.lastSlideStartTime = performance.now();
                o.showChecked = false;
            }
        } else if (o.step === 3) {
            if (o.showChecked) {
                this.closeGuideOverlay();
            }
        }
    }

    drawGuideOverlay() {
        const o = this.guideOverlay;
        if (!o) return;

        const ctx = this.uiManager.ctx;
        const canvas = this.uiManager.canvas;

        if (o.animState === 'hidden' && !o.isOpen) return;

        const alpha = (typeof o.fade === 'number') ? o.fade : 1;

        ctx.save();
        ctx.globalAlpha = 0.7 * alpha;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = alpha;

        const centerY = canvas.height * 0.40;
        const leftX = canvas.width * 0.28;
        const rightX = canvas.width * 0.72;

        const maxImgHeight = canvas.height * 0.55;
        const maxImgWidth = canvas.width * 0.32;

        const drawSlideImage = (index, cx) => {
            const slide = this.guideSlides[index];
            if (!slide || !slide.img || !slide.img.complete) return null;

            const img = slide.img;
            const ratio = img.naturalWidth / img.naturalHeight || 1;
            let drawW = maxImgWidth;
            let drawH = drawW / ratio;

            if (drawH > maxImgHeight) {
                drawH = maxImgHeight;
                drawW = drawH * ratio;
            }

            const x = cx - drawW / 2;
            const y = centerY - drawH / 2;

            ctx.drawImage(img, x, y, drawW, drawH);
            return { x, y, w: drawW, h: drawH };
        };

        let lastImageRect = null;
        let currentText = '';

        switch (o.step) {
            case 0:
                drawSlideImage(0, leftX);
                currentText = this.guideSlides[0].text;
                break;
            case 1:
                drawSlideImage(0, leftX);
                lastImageRect = drawSlideImage(1, rightX);
                currentText = this.guideSlides[1].text;
                break;
            case 2:
                drawSlideImage(2, leftX);
                currentText = this.guideSlides[2].text;
                break;
            case 3:
            default:
                drawSlideImage(2, leftX);
                lastImageRect = drawSlideImage(3, rightX);
                currentText = this.guideSlides[3].text;
                break;
        }

        if (currentText) {
            const textWidth = canvas.width * 0.8;
            const textX = canvas.width / 2;
            const textY = canvas.height * 0.75;

            ctx.fillStyle = 'white';
            ctx.font = '26px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const lines = this.wrapTextForGuide(ctx, currentText, textWidth);
            const lineHeight = 30;

            lines.forEach((line, i) => {
                ctx.fillText(line, textX, textY + i * lineHeight);
            });
        }

        if (
            o.step === 3 &&
            o.showChecked &&
            lastImageRect &&
            this.guideCheckedImg &&
            this.guideCheckedImg.complete
        ) {
            const img = this.guideCheckedImg;
            const size = Math.min(lastImageRect.w, lastImageRect.h) * 0.22;
            const x = lastImageRect.x + lastImageRect.w - size * 0.9;
            const y = lastImageRect.y - size * 0.1;

            ctx.drawImage(img, x, y, size, size);
        }

        ctx.restore();
    }

    wrapTextForGuide(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let current = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const testLine = current + ' ' + words[i];
            const w = ctx.measureText(testLine).width;
            if (w < maxWidth) {
                current = testLine;
            } else {
                lines.push(current);
                current = words[i];
            }
        }
        lines.push(current);
        return lines;
    }

    // =========================
    //  MODAL OPEN/CLOSE
    // =========================
    onModalClose() {
        if (this.gameState === 'playing' || this.gameState === 'dialog' || this.gameState === 'consequence') {
            this.saveGameState();
            this.pauseGameTimers();

            this.prePauseState = this.gameState;
            this.gameState = 'pauseMenu';
        }

        this.audioManager.pauseForModalClose();

        if (this.guideOverlay && this.guideOverlay.isOpen) {
            this.guideOverlay.isOpen = false;
            this.guideOverlay.animState = 'hidden';
            this.guideOverlay.step = 0;
            this.guideOverlay.fade = 0;
            this.guideOverlay.showChecked = false;
            this.guideOverlay.lastSlideStartTime = 0;
        }
    }

    onModalOpen() {
        this.audioManager.resumeAfterModalOpen();

        if (this.guideOverlay && this.guideOverlay.isOpen) {
            this.guideOverlay.isOpen = false;
            this.guideOverlay.animState = 'hidden';
            this.guideOverlay.step = 0;
            this.guideOverlay.fade = 0;
            this.guideOverlay.showChecked = false;
            this.guideOverlay.lastSlideStartTime = 0;
        }
    }

    // =========================
    //  EASING
    // =========================
    easeOutCubic(t) {
        t = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - t, 3);
    }

    getAllImagesForPreload() {
        const imgs = [];

        imgs.push(
            this.tapeImg,
            this.infoPaperImg,
            this.btnStartImg,
            this.btnContinueImg,
            this.btnResetImg,
            this.playzoneBg,
            this.paperImg,
            this.dialogPanelImg,
            this.branchesTopImg,
            this.branchesBottomImg,
            this.cupImg,
            this.carouselArrowImg,
            this.guideImg0,
            this.guideImg1,
            this.guideImg2,
            this.guideImg3,
            this.guideCheckedImg,
            this.gameOverPanelImg,
            this.pausePanelImg,
            this.guideButtonImg
        );

        const domImgIds = [
            'playzone-black-bin',
            'playzone-black-bin-open',
            'playzone-brown-bin',
            'playzone-brown-bin-open',
            'playzone-green-bin',
            'playzone-green-bin-open',
            'playzone-yellow-bin',
            'playzone-yellow-bin-open',
            'playzone-blue-bin',
            'playzone-blue-bin-open',
            'playzone-hazard-box',

            'mini-black-bin',
            'mini-yellow-bin',
            'mini-green-bin',
            'mini-brown-bin',
            'mini-blue-bin',
            'mini-orange-bin',

            'item-plastic-bottle',
            'item-brokkoli',
            'item-cigarette',
            'item-perfume',
            'item-cansoda',
            'item-bananapeel',
            'item-applecore',
            'item-brokenbottle',
            'item-thermometer',
            'item-plasticbag',
            'item-bulb',
            'item-eggshell',
            'item-papercup',
            'item-bottle',
            'item-battery',
            'item-leaves',
            'item-bottlealcohol',
            'item-medicinebottle',
            'item-spray',
            'item-brokendishes',
            'item-cartonmilk',
            'item-toyairplane',
            'item-candle',
            'item-bone',
            'item-diaper',
            'item-paper',
            'item-smartphone',
            'item-dirtypaper',
            'item-towel',
            'item-badmushroom',
            'item-book',
            'item-chips',
            'item-cucumber',
            'item-goodmushroom',

            'star',
            'main-menu-grass',
            'main-menu-title-left',
            'main-menu-title-right'
        ];
        domImgIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) imgs.push(el);
        });

        return imgs;
    }

    loadAssets() {
        const images = this.getAllImagesForPreload();
        if (!images.length) {
            this.init();
            return;
        }

        let remaining = images.length;

        return new Promise(resolve => {
            const done = () => {
                remaining--;
                if (remaining <= 0) {
                    resolve();
                }
            };

            images.forEach(img => {
                if (!img) {
                    done();
                    return;
                }

                // уже загружена
                if (img.complete) {
                    done();
                } else {
                    img.addEventListener('load', done, { once: true });
                    img.addEventListener('error', done, { once: true });
                }
            });
        }).then(() => {
            this.init();
        });
    }
}

// =========================
//  SCORE MANAGER
// =========================
class ScoreManager {
    constructor() {
        this.storageKey = 'recyclingGame_highScores';
        this.maxScoresPerDifficulty = 50;
        this.loadScores();
    }

    loadScores() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                this.scores = JSON.parse(saved);
                Object.keys(this.scores).forEach(difficulty => {
                    if (!this.scores[difficulty].durations) {
                        this.scores[difficulty].durations = {};
                    }
                });
            } catch (e) {
                this.scores = this.getDefaultScores();
            }
        } else {
            this.scores = this.getDefaultScores();
        }
    }

    getDefaultScores() {
        return {
            easy: { durations: {} },
            medium: { durations: {} },
            hard: { durations: {} },
            custom: { durations: {} }
        };
    }

    saveScores() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
    }

    updateScore(difficulty, newScore, timeLeft, gameDuration, starsEarned = 0) {
        const currentScores = this.scores[difficulty].durations;
        const durationKey = gameDuration.toString();
        const elapsedTime = gameDuration - timeLeft;

        const newRecord = {
            score: newScore,
            time: elapsedTime,
            stars: starsEarned,
            timestamp: Date.now()
        };

        const existing = currentScores[durationKey];
        let isNewRecord = false;

        if (!existing ||
            newRecord.score > existing.score ||
            (newRecord.score === existing.score && newRecord.time < existing.time)
        ) {
            currentScores[durationKey] = newRecord;
            isNewRecord = true;
            this.saveScores();
        }

        return isNewRecord;
    }

    getScores() {
        return this.scores;
    }

    clearScores() {
        this.scores = this.getDefaultScores();
        this.saveScores();
    }
}
