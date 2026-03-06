/**
 * 音效管理器
 * 处理应用中的音效和背景音乐
 */

class AudioManager {
    constructor(config) {
        this.config = config;
        this.sounds = new Map();
        this.backgroundMusic = null;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.3;
        this.isMuted = false;
        this.isInitialized = false;
        this.audioContext = null;
    }

    /**
     * 初始化音频系统
     */
    init() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isInitialized = true;
            console.log('音频系统初始化成功');
        } catch (error) {
            console.warn('音频系统初始化失败:', error);
        }
    }

    /**
     * 加载音频文件
     */
    async loadSound(id, url) {
        if (!this.isInitialized) {
            console.warn('音频系统未初始化');
            return null;
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.sounds.set(id, {
                buffer: audioBuffer,
                url: url,
            });

            console.log(`音效加载成功: ${id}`);
            return audioBuffer;
        } catch (error) {
            console.error(`音效加载失败: ${id}`, error);
            return null;
        }
    }

    /**
     * 播放音效
     */
    playSound(id, volume = null) {
        if (!this.isInitialized || this.isMuted) {
            return null;
        }

        const sound = this.sounds.get(id);
        if (!sound) {
            console.warn(`音效不存在: ${id}`);
            return null;
        }

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = sound.buffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            const finalVolume = volume !== null ? volume : this.sfxVolume;
            gainNode.gain.value = finalVolume * this.masterVolume;

            source.start(0);
            return source;
        } catch (error) {
            console.error(`播放音效失败: ${id}`, error);
            return null;
        }
    }

    /**
     * 播放背景音乐
     */
    async playBackgroundMusic(url, loop = true) {
        if (!this.isInitialized) {
            console.warn('音频系统未初始化');
            return null;
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            if (this.backgroundMusic) {
                this.stopBackgroundMusic();
            }

            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = audioBuffer;
            source.loop = loop;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            gainNode.gain.value = this.musicVolume * this.masterVolume;

            source.start(0);
            this.backgroundMusic = {
                source: source,
                gainNode: gainNode,
                buffer: audioBuffer,
            };

            console.log('背景音乐开始播放');
            return source;
        } catch (error) {
            console.error('播放背景音乐失败', error);
            return null;
        }
    }

    /**
     * 停止背景音乐
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            try {
                this.backgroundMusic.source.stop();
                this.backgroundMusic = null;
                console.log('背景音乐已停止');
            } catch (error) {
                console.warn('停止背景音乐失败', error);
            }
        }
    }

    /**
     * 暂停背景音乐
     */
    pauseBackgroundMusic() {
        if (this.backgroundMusic && this.audioContext.state === 'running') {
            this.audioContext.suspend();
            console.log('背景音乐已暂停');
        }
    }

    /**
     * 恢复背景音乐
     */
    resumeBackgroundMusic() {
        if (this.backgroundMusic && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
            console.log('背景音乐已恢复');
        }
    }

    /**
     * 设置主音量
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    /**
     * 设置音效音量
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 设置音乐音量
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.gainNode.gain.value =
                this.musicVolume * this.masterVolume;
        }
    }

    /**
     * 更新所有音量
     */
    updateVolumes() {
        if (this.backgroundMusic) {
            this.backgroundMusic.gainNode.gain.value =
                this.musicVolume * this.masterVolume;
        }
    }

    /**
     * 静音/取消静音
     */
    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            // 记录当前音量
            this.previousVolumes = {
                master: this.masterVolume,
                sfx: this.sfxVolume,
                music: this.musicVolume,
            };

            // 设置为0
            this.masterVolume = 0;
            this.sfxVolume = 0;
            this.musicVolume = 0;
        } else {
            // 恢复音量
            if (this.previousVolumes) {
                this.masterVolume = this.previousVolumes.master;
                this.sfxVolume = this.previousVolumes.sfx;
                this.musicVolume = this.previousVolumes.music;
            }
        }

        this.updateVolumes();
        return this.isMuted;
    }

    /**
     * 创建音效（合成）
     */
    createSynthesizedSound(type) {
        if (!this.isInitialized || this.isMuted) {
            return null;
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // 不同类型的音效
            switch (type) {
                case 'click':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(
                        300,
                        this.audioContext.currentTime + 0.1
                    );
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        this.audioContext.currentTime + 0.1
                    );
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.1);
                    break;

                case 'hover':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        this.audioContext.currentTime + 0.05
                    );
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.05);
                    break;

                case 'success':
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
                    oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
                    oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        this.audioContext.currentTime + 0.4
                    );
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;

                case 'error':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                    oscillator.frequency.linearRampToValueAtTime(
                        100,
                        this.audioContext.currentTime + 0.3
                    );
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        this.audioContext.currentTime + 0.3
                    );
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                    break;

                default:
                    console.warn(`未知音效类型: ${type}`);
                    return null;
            }

            return oscillator;
        } catch (error) {
            console.error(`创建合成音效失败: ${type}`, error);
            return null;
        }
    }

    /**
     * 播放UI交互音效
     */
    playUI音效(type) {
        this.createSynthesizedSound(type);
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.backgroundMusic) {
            this.stopBackgroundMusic();
        }

        this.sounds.clear();

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.isInitialized = false;
        console.log('音频系统已清理');
    }

    /**
     * 获取音频系统状态
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            muted: this.isMuted,
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume,
            isPlaying: this.backgroundMusic !== null,
            contextState: this.audioContext ? this.audioContext.state : 'unavailable',
        };
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
}
