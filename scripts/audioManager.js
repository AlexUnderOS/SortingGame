class AudioManager {
    constructor() {
        this.sounds = new Map();

        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.isMuted = false;

        this.currentBackgroundMusic = null;
        this.currentAmbientSFX = null;

        this.audioContextUnlocked = false;

        this.activeSFX = new Set();

        this.totalSounds = 0;
        this.loadedSounds = 0;
        this.allSoundsLoaded = false;

        this.preloadSounds();
    }

    createEmptySource() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const audioContext = new AudioContext();
                const source = audioContext.createBufferSource();
                source.buffer = audioContext.createBuffer(1, 1, 22050);
                source.connect(audioContext.destination);
                return source;
            }
        } catch (e) {
            console.log('AudioContext not supported:', e);
        }
        return null;
    }

    preloadSounds() {
        const soundConfig = {
            'background-music': {
                url: 'audio/music/background-music.mp3',
                volume: 0.6,
                loop: true,
                type: 'music'
            },

            'ambient-nature': {
                url: 'audio/sfx/ambient-nature.wav',
                volume: 1,
                loop: true,
                type: 'ambient'
            },
            'item-drop': {
                url: 'audio/sfx/item-drop.wav',
                volume: 0.7,
                loop: false,
                type: 'sfx'
            },
            'item-land': {
                url: 'audio/sfx/item-land.wav',
                volume: 0.6,
                loop: false,
                type: 'sfx'
            },
            'item-pickup-1': {
                url: 'audio/sfx/item-pickup-1.wav',
                volume: 0.8,
                loop: false,
                type: 'sfx'
            },
            'item-pickup-2': {
                url: 'audio/sfx/item-pickup-2.wav',
                volume: 0.8,
                loop: false,
                type: 'sfx'
            },

            'ui-click': {
                url: 'audio/sfx/click.wav',
                volume: 0.5,
                loop: false,
                type: 'sfx'
            },
            'game-start': {
                url: 'audio/sfx/click.wav',
                volume: 0.8,
                loop: false,
                type: 'sfx'
            },
            'game-over': {
                url: 'audio/sfx/click.wav',
                volume: 0.8,
                loop: false,
                type: 'sfx'
            },
            'correct-sort': {
                url: 'audio/sfx/item-pickup-1.wav',
                volume: 0.7,
                loop: false,
                type: 'sfx'
            },
            'wrong-sort': {
                url: 'audio/sfx/wrong-sort.wav',
                volume: 1,
                loop: false,
                type: 'sfx'
            },
            'open-bin': {
                url: 'audio/sfx/open-bin.wav',
                volume: 0.9,
                loop: false,
                type: 'sfx'
            },
            'grass-rustling-1': {
                url: 'audio/sfx/grass-rustling-1.wav',
                volume: 1,
                loop: false,
                type: 'sfx'
            },
            'grass-rustling-2': {
                url: 'audio/sfx/grass-rustling-2.wav',
                volume: 0.6,
                loop: false,
                type: 'sfx'
            },
            'show-dialog': {
                url: 'audio/sfx/show-dialog.wav',
                volume: 0.6,
                loop: false,
                type: 'sfx'
            }
        };

        const entries = Object.entries(soundConfig);

        this.totalSounds = entries.length;
        this.loadedSounds = 0;
        this.allSoundsLoaded = (this.totalSounds === 0);

        for (const [key, config] of entries) {
            const audio = new Audio();
            audio.src = config.url;
            audio.volume = config.volume * (config.type === 'music' ? this.musicVolume : this.sfxVolume);
            audio.loop = config.loop;
            audio.preload = 'auto';

            const onLoaded = () => {
                audio.removeEventListener('canplaythrough', onLoaded);
                audio.removeEventListener('loadeddata', onLoaded);
                audio.removeEventListener('error', onError);

                this.loadedSounds++;
                if (this.loadedSounds >= this.totalSounds) {
                    this.allSoundsLoaded = true;
                }
            };

            const onError = (e) => {
                console.error(`Error loading sound ${key}:`, e, `URL: ${config.url}`);
                onLoaded();
            };

            audio.addEventListener('canplaythrough', onLoaded);
            audio.addEventListener('loadeddata', onLoaded);
            audio.addEventListener('error', onError);

            this.sounds.set(key, {
                audio: audio,
                config: config
            });
        }
    }

    // ==============================
    //  MUSIC
    // ==============================

    playBackgroundMusic(trackName = 'background-music') {
        if (this.isMuted) return;

        const sound = this.sounds.get(trackName);
        if (sound && sound.config.type === 'music') {
            if (this.currentBackgroundMusic === trackName && !sound.audio.paused) {
                return;
            }

            if (this.currentBackgroundMusic && this.currentBackgroundMusic !== trackName) {
                this.stopBackgroundMusic();
            }

            sound.audio.currentTime = 0;
            sound.audio.volume = sound.config.volume * this.musicVolume;

            const playPromise = sound.audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log('Background music play failed:', e);
                });
            }

            this.currentBackgroundMusic = trackName;
        } else {
            console.warn(`Background music ${trackName} not found or wrong type`);
        }
    }

    stopBackgroundMusic() {
        if (this.currentBackgroundMusic) {
            const sound = this.sounds.get(this.currentBackgroundMusic);
            if (sound) {
                sound.audio.pause();
                sound.audio.currentTime = 0;
            }
            this.currentBackgroundMusic = null;
        }
    }

    pauseBackgroundMusic() {
        if (this.currentBackgroundMusic) {
            const sound = this.sounds.get(this.currentBackgroundMusic);
            if (sound) {
                sound.audio.pause();
            }
        }
    }

    resumeBackgroundMusic() {
        if (this.currentBackgroundMusic && !this.isMuted) {
            const sound = this.sounds.get(this.currentBackgroundMusic);
            if (sound) {
                const playPromise = sound.audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.log('Resume background music failed:', e);
                    });
                }
            }
        }
    }

    // ==============================
    //  AMBIENT
    // ==============================

    playAmbientSFX(trackName = 'ambient-nature') {
        const sound = this.sounds.get(trackName);
        if (sound && sound.config.type === 'ambient') {
            if (this.currentAmbientSFX === trackName && !sound.audio.paused) {
                return;
            }

            if (this.currentAmbientSFX && this.currentAmbientSFX !== trackName) {
                this.stopAmbientSFX();
            }

            sound.audio.currentTime = 0;
            sound.audio.volume = sound.config.volume * this.sfxVolume;

            const playPromise = sound.audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log('Ambient SFX play failed:', e);
                });
            }

            this.currentAmbientSFX = trackName;
        } else {
            console.warn(`Ambient SFX ${trackName} not found or wrong type`);
        }
    }

    stopAmbientSFX() {
        if (this.currentAmbientSFX) {
            const sound = this.sounds.get(this.currentAmbientSFX);
            if (sound) {
                sound.audio.pause();
                sound.audio.currentTime = 0;
            }
            this.currentAmbientSFX = null;
        }
    }

    pauseAmbientSFX() {
        if (this.currentAmbientSFX) {
            const sound = this.sounds.get(this.currentAmbientSFX);
            if (sound) {
                sound.audio.pause();
            }
        }
    }

    resumeAmbientSFX() {
        if (this.currentAmbientSFX) {
            const sound = this.sounds.get(this.currentAmbientSFX);
            if (sound) {
                const playPromise = sound.audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.log('Resume ambient SFX failed:', e);
                    });
                }
            }
        }
    }

    // ==============================
    //  SFX
    // ==============================

    playSFX(soundName, options = {}) {
        if (!this.sounds.has(soundName)) {
            console.warn(`Sound "${soundName}" not found in audio manager`);
            return null;
        }

        const sound = this.sounds.get(soundName);
        if (sound && sound.config.type === 'sfx') {
            const audio = new Audio();
            audio.src = sound.audio.src;
            audio.volume = (options.volume !== undefined ? options.volume : sound.config.volume) * this.sfxVolume;

            if (options.playbackRate !== undefined) {
                audio.playbackRate = options.playbackRate;
            }

            this.activeSFX.add(audio);

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log(`SFX ${soundName} play failed:`, e);
                });
            }

            audio.addEventListener('ended', () => {
                this.activeSFX.delete(audio);
                audio.remove();
            });

            return audio;
        } else {
            console.warn(`Sound ${soundName} not found or wrong type`);
        }
        return null;
    }

    playShowDialog() {
        return this.playSFX('show-dialog');
    }
    playGrassRustlingFirst() {
        return this.playSFX('grass-rustling-1');
    }
    playGrassRustlingLast() {
        return this.playSFX('grass-rustling-2');
    }
    playItemDrop() {
        return this.playSFX('item-drop');
    }
    playItemLand() {
        return this.playSFX('item-land');
    }
    playItemPickup() {
        const pickupSounds = ['item-pickup-1', 'item-pickup-2'];
        const randomSound = pickupSounds[Math.floor(Math.random() * pickupSounds.length)];
        return this.playSFX(randomSound);
    }
    playUIClick() {
        return this.playSFX('ui-click');
    }
    playGameStart() {
        return this.playSFX('game-start');
    }
    playGameOver() {
        return this.playSFX('game-over');
    }
    playCorrectSort() {
        return this.playSFX('correct-sort');
    }
    playWrongSort() {
        return this.playSFX('wrong-sort');
    }
    playOpenBin() {
        return this.playSFX('open-bin');
    }

    // ==============================
    //  VOLUME / MUTE
    // ==============================

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    updateAllVolumes() {
        for (const [key, sound] of this.sounds) {
            const volumeMultiplier = sound.config.type === 'music' ? this.musicVolume : this.sfxVolume;
            sound.audio.volume = sound.config.volume * volumeMultiplier;
        }
    }

    toggleMusicMute() {
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            this.pauseBackgroundMusic();
        } else {
            this.resumeBackgroundMusic();
        }

        return this.isMuted;
    }

    setMute(muted) {
        this.isMuted = muted;
        if (muted) {
            this.pauseBackgroundMusic();
        } else {
            this.resumeBackgroundMusic();
        }
    }

    pauseAll() {
        this.pauseAmbientSFX();
        this.pauseBackgroundMusic();
    }

    stopAllSFX() {
        for (const audio of this.activeSFX) {
            try {
                audio.pause();
                audio.currentTime = 0;
                audio.remove();
            } catch (e) {
                console.log('Error stopping SFX:', e);
            }
        }
        this.activeSFX.clear();
    }

    resumeAll() {
        this.resumeAmbientSFX();

        if (!this.isMuted) {
            this.resumeBackgroundMusic();
        }
    }

    pauseForModalClose() {
        this.pauseAmbientSFX();
        this.pauseBackgroundMusic();
        this.stopAllSFX();
    }

    resumeAfterModalOpen() {
        this.resumeAmbientSFX();

        if (!this.isMuted) {
            this.resumeBackgroundMusic();
        }
    }

    // ==============================
    //  ADDITIONAL UTILITIES FOR THE LOADER
    // ==============================

    addSound(key, config) {
        const audio = new Audio();
        audio.src = config.url;
        audio.volume = config.volume * (config.type === 'music' ? this.musicVolume : this.sfxVolume);
        audio.loop = config.loop || false;
        audio.preload = 'auto';

        this.sounds.set(key, {
            audio: audio,
            config: config
        });
    }

    isSoundLoaded(soundName) {
        const sound = this.sounds.get(soundName);
        return !!(sound && sound.audio.readyState >= 2);
    }

    getLoadProgress() {
        return this.totalSounds > 0 ? this.loadedSounds / this.totalSounds : 1;
    }

    areAllSoundsLoaded() {
        return this.allSoundsLoaded;
    }
}
