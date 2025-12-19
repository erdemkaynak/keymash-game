import { ref, set, get, update, onValue, push, child, remove, runTransaction, onDisconnect } from 'firebase/database';
import { db } from './firebase';
import { GamePhase, GameSettings, Player, Room, GameMode } from '../types';
import { generateRounds, generateWordList } from '../constants';

// Generate a random 6-character code
const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0 for clarity
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Create a new room
export const createRoom = async (
    hostName: string,
    hostAvatar: string,
    settings: GameSettings,
    lang: 'EN' | 'TR'
): Promise<string> => {
    const roomsRef = ref(db, 'rooms');
    let roomId = generateRoomCode();
    let newRoomRef = child(roomsRef, roomId);

    // Check collision (rare but possible)
    let snapshot = await get(newRoomRef);
    while (snapshot.exists()) {
        roomId = generateRoomCode();
        newRoomRef = child(roomsRef, roomId);
        snapshot = await get(newRoomRef);
    }

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

    return `${roomId}:${hostId}`;
};

// Join an existing room
export const joinRoom = async (roomId: string, playerName: string, avatar: string): Promise<string> => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Oda bulunamadı! Kod hatalı olabilir.");
    }

    const room = snapshot.val() as Room;

    if (room.phase !== GamePhase.WAITING_ROOM) {
        throw new Error("Oyun çoktan başladı!");
    }

    const currentPlayers = Object.values(room.players || {});
    if (currentPlayers.length >= room.settings.maxPlayers) {
        throw new Error("Oda tamamen dolu!");
    }

    // Check for duplicate name
    const nameExists = currentPlayers.some(p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase());
    if (nameExists) {
        throw new Error("Bu isimde bir oyuncu zaten var. Lütfen başka bir isim seç.");
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

    const playerRef = child(ref(db, `rooms/${roomId}/players`), playerId);
    await update(playerRef, newPlayer);

    // Setup Disconnect Cleanup (Auto-remove player on tab close)
    onDisconnect(playerRef).remove();

    return playerId;

    return playerId;
};

// Leave room with Host Migration & Auto Cleanup
export const leaveRoom = async (roomId: string, playerId: string) => {
    const roomRef = ref(db, `rooms/${roomId}`);

    // We need transaction-like safety or just sequential reads/writes
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = snapshot.val() as Room;

    // 1. Remove player
    await remove(ref(db, `rooms/${roomId}/players/${playerId}`));

    // 2. Refresh state to check remaining players
    const updatedSnapshot = await get(roomRef);
    if (!updatedSnapshot.exists()) return;

    const updatedRoom = updatedSnapshot.val() as Room;
    const remainingPlayers = updatedRoom.players || {};
    const playerIds = Object.keys(remainingPlayers);

    // 3. Auto Cleanup: If empty, delete room
    if (playerIds.length === 0) {
        await remove(roomRef);
        return;
    }

    // 4. Host Migration: If host left, assign new host
    if (room.hostId === playerId) {
        const newHostId = playerIds[0]; // Pick first available player
        await update(roomRef, { hostId: newHostId });
    }
};

export const addBot = async (roomId: string) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = snapshot.val() as Room;
    const currentPlayers = Object.values(room.players || {});

    if (currentPlayers.length >= room.settings.maxPlayers) {
        throw new Error("Oda dolu!");
    }

    const botId = 'bot-' + Math.random().toString(36).substr(2, 9);
    const botName = 'Bot ' + Math.floor(Math.random() * 1000);

    // Random Avatar
    const avatar = JSON.stringify({
        type: Math.floor(Math.random() * 6),
        skin: Math.floor(Math.random() * 3), // assuming limits
        eyes: Math.floor(Math.random() * 5),
        mouth: Math.floor(Math.random() * 5),
        acc: Math.floor(Math.random() * 3)
    });

    const botPlayer: Player = {
        id: botId,
        name: botName,
        avatar: avatar,
        score: 0,
        isBot: true,
        progress: 0,
        status: 'IDLE'
    };

    const playerRef = child(ref(db, `rooms/${roomId}/players`), botId);
    await update(playerRef, botPlayer);
};

// Start Game (Host Only)
// Start a specific round
export const startRound = async (roomId: string, lang: 'EN' | 'TR', roundIndex: number) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val() as Room;

    // Reset all players to playing
    const updates: any = {};
    updates[`rooms/${roomId}/phase`] = GamePhase.TRANSITION;
    updates[`rooms/${roomId}/currentRound`] = roundIndex;
    updates[`rooms/${roomId}/startTime`] = Date.now() + 4000; // 3s countdown + buffer

    // Generate words for round
    const roundConfig = room.rounds[roundIndex];
    if (roundConfig.mode === GameMode.TYPING) {
        updates[`rooms/${roomId}/words`] = generateWordList(lang, 300);
    } else {
        updates[`rooms/${roomId}/words`] = [];
    }

    // Reset players
    Object.keys(room.players || {}).forEach(pid => {
        updates[`rooms/${roomId}/players/${pid}/status`] = 'PLAYING';
        updates[`rooms/${roomId}/players/${pid}/progress`] = 0;
        // Don't reset score
    });

    await update(ref(db), updates);

    // Switch to playing after transition
    setTimeout(async () => {
        await update(ref(db, `rooms/${roomId}`), { phase: GamePhase.PLAYING });
    }, 3000);
};

// Start Game (Host Only)
export const startGame = async (roomId: string, lang: 'EN' | 'TR') => {
    await startRound(roomId, lang, 0);
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
