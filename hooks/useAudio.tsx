import { useState, useEffect, useRef } from 'react';

type SoundType = 'click' | 'type' | 'error' | 'win' | 'lose';

export const useAudio = () => {
    const [isMuted, setIsMuted] = useState(false);
    const bgmRef = useRef<HTMLAudioElement | null>(null);

    // Initialize BGM
    useEffect(() => {
        bgmRef.current = new Audio('/sounds/bgm.mp3');
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.3; // Low background volume
        return () => {
            bgmRef.current?.pause();
            bgmRef.current = null;
        };
    }, []);

    // Handle Mute Toggle
    useEffect(() => {
        if (bgmRef.current) {
            if (isMuted) {
                bgmRef.current.pause();
            } else {
                // Try to play (requires interaction usually)
                bgmRef.current.play().catch(() => {
                    // Autoplay might block this, waiting for interaction
                });
            }
        }
    }, [isMuted]);

    const playSound = (type: SoundType) => {
        if (isMuted) return;

        const fileMap: Record<SoundType, string> = {
            click: '/sounds/click.mp3',
            type: '/sounds/type.mp3',
            error: '/sounds/error.mp3',
            win: '/sounds/win.mp3',
            lose: '/sounds/lose.mp3'
        };

        const audio = new Audio(fileMap[type]);
        audio.volume = type === 'type' ? 0.3 : 0.5; // Type less loud
        audio.play().catch(() => {});
    };

    const toggleMute = () => setIsMuted(prev => !prev);

    // Helper to start BGM on first user interaction if needed
    const startBgm = () => {
        if (!isMuted && bgmRef.current?.paused) {
            bgmRef.current.play().catch(() => {});
        }
    };

    return { isMuted, toggleMute, playSound, startBgm };
};
