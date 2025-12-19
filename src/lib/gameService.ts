import { ref, set, get, update, onValue, push, child, remove, runTransaction } from 'firebase/database';
import { db } from './firebase';
import { GamePhase, GameSettings, Player, Room } from '../types';
import { generateRounds, generateWordList } from '../constants';

// Create a new room
export const createRoom = async (
    hostName: string,
    hostAvatar: string,
    settings: GameSettings,
    lang: 'EN' | 'TR'
): Promise<string> => {
    const roomsRef = ref(db, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key;

    if (!roomId) throw new Error("Failed to generate room ID");

    const rounds = generateRounds(settings.totalRounds);
    const hostId = 'host-' + Math.random().toString(36).substr(2, 9);

    const initialRoomState: Room = {
        id: roomId,
        hostId: hostId,
        settings,
        players: {
            [hostId]: {
                id: hostId,
                name: hostName,
                avatar: hostAvatar,
                score: 0,
                isBot: false,
                progress: 0,
                status: 'IDLE'
            }
        },
        phase: GamePhase.WAITING_ROOM,
        currentRound: 0,
        rounds: rounds,
        words: []
    };

    await set(newRoomRef, initialRoomState);

    // Store host ID locally (in localStorage or return it)
    // For simplicity we'll just return it and let the component handle state
    return `${roomId}:${hostId}`; // Return composite key to identify session
};

// Join an existing room
export const joinRoom = async (roomId: string, playerName: string, avatar: string): Promise<string> => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Room not found");
    }

    const room = snapshot.val() as Room;

    if (room.phase !== GamePhase.WAITING_ROOM) {
        throw new Error("Game already started");
    }

    const currentPlayers = Object.keys(room.players || {}).length;
    if (currentPlayers >= room.settings.maxPlayers) {
        throw new Error("Room is full");
    }

    const playerId = 'p-' + Math.random().toString(36).substr(2, 9);
    const newPlayer: Player = {
        id: playerId,
        name: playerName,
        avatar: avatar,
        score: 0,
        isBot: false,
        progress: 0,
        status: 'IDLE'
    };

    await update(ref(db, `rooms/${roomId}/players/${playerId}`), newPlayer);

    return playerId;
};

// Leave room
export const leaveRoom = async (roomId: string, playerId: string) => {
    await remove(ref(db, `rooms/${roomId}/players/${playerId}`));
};

// Start Game (Host Only)
export const startGame = async (roomId: string, lang: 'EN' | 'TR') => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val() as Room;

    // Reset all players to playing
    const updates: any = {};
    updates[`rooms/${roomId}/phase`] = GamePhase.TRANSITION;
    updates[`rooms/${roomId}/currentRound`] = 0;

    // Generate words for first round if typing
    const firstRound = room.rounds[0];
    if (firstRound.mode === 'TYPING') { // Hardcoded string check to avoid enum import issues if tricky
        updates[`rooms/${roomId}/words`] = generateWordList(lang, 300);
    } else {
        updates[`rooms/${roomId}/words`] = [];
    }

    // Set all players to PLAYING state and 0 progress
    if (room.players) {
        Object.keys(room.players).forEach(pid => {
            updates[`rooms/${roomId}/players/${pid}/status`] = 'PLAYING';
            updates[`rooms/${roomId}/players/${pid}/progress`] = 0;
            // Bot generation logic could go here if we want the HOST to manage bots
        });
    }

    await update(ref(db), updates);

    // Transition to PLAYING after delay (handled by clients listening to phase, 
    // but host enforces the phase change after delay)
    setTimeout(async () => {
        await update(ref(db, `rooms/${roomId}`), { phase: GamePhase.PLAYING, startTime: Date.now() });
    }, 3000);
};

// Update Progress
export const updateProgress = (roomId: string, playerId: string, progress: number, wpm?: number) => {
    // Only update if playing
    update(ref(db, `rooms/${roomId}/players/${playerId}`), {
        progress,
        // Optional: Store WPM if provided
    });
};

// Player Finished Round
export const playerFinished = async (roomId: string, playerId: string, score: number) => {
    const updates: any = {};
    updates[`players/${playerId}/status`] = 'FINISHED';
    updates[`players/${playerId}/progress`] = 100;
    updates[`players/${playerId}/score`] = score;

    await update(ref(db, `rooms/${roomId}`), updates);
};

// Check for Round End (Host should run this or use a trigger - simplifying to Host Client Logic)
export const checkRoundEnd = async (roomId: string) => {
    // Logic to be called by Host client when monitoring players
    // If all players FINISHED, move to next round or End Game
};
