import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { createRoom, joinRoom, leaveRoom, startGame, startRound, updateProgress, playerFinished, addBot } from '@/lib/gameService';
import { GamePhase, Player, GameMode, GameSettings, Room } from './types';
import { TRANSLATIONS } from './constants';
import { Lobby } from './components/Lobby';
import { KeyboardRepair } from './components/KeyboardRepair';
import { TypingRace } from './components/TypingRace';
import { Button } from './components/ui/Button';
import { Avatar } from './components/ui/Avatar';
import { Timer, Trophy, Zap, RefreshCw, Lock, Crown, Users, Flag, Target, Play, ArrowLeft, Copy, Check, X, Home, Plus } from 'lucide-react';

function App() {
    // Local User State
    const [myId, setMyId] = useState<string | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [lang, setLang] = useState<'EN' | 'TR'>('TR');
    const [copiedLink, setCopiedLink] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Synced Room State
    const [room, setRoom] = useState<Room | null>(null);
    const [tabWarning, setTabWarning] = useState(false);

    // Multi-Tab Detection
    useEffect(() => {
        const bc = new BroadcastChannel('keysmash_channel');
        bc.postMessage('new-tab');
        bc.onmessage = (event) => {
            if (event.data === 'new-tab') {
                bc.postMessage('dup-detected');
            }
            if (event.data === 'dup-detected') {
                if (roomId) setTabWarning(true);
            }
        };
        return () => bc.close();
    }, [roomId]);

    // Initial URL Check
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomCodeParam = params.get('room');
        if (roomCodeParam) {
            // Pass this to Lobby via a prop or state, or just auto-fill
            // For now, we don't have a direct way to pass to Lobby state without Context
            // But checking Lobby props can work.
            // Let's just store it in session or let user type it?
            // Better: We'll modify Lobby to accept an initialCode.
        }
    }, []);

    // Local Game State (Timer is derived from server start time usually, but simpler to sync roughly)
    const [timeLeft, setTimeLeft] = useState(0);

    const t = TRANSLATIONS[lang];
    const isHost = room && myId ? room.hostId.includes(myId) : false; // hostId stores composite often or just partial
    // Actually createRoom returns "roomId:hostId", but we store "hostId" in DB as the composite or just the ID? 
    // Let's check gameService... 
    // createRoom: returns `${roomId}:${hostId}`. DB stores `hostId: hostId`.
    // So myId should match room.hostId directly.

    // --- Firebase Subscription ---
    useEffect(() => {
        if (!roomId) return;

        const roomRef = ref(db, `rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val() as Room;
                setRoom(data);
            } else {
                console.warn("Room data null, invalid ID?", roomId);
                // setRoom(null);
                // setRoomId(null);
                // setMyId(null);
                setError("Oda bulunamadı veya silindi.");
            }
        }, (error) => {
            console.error("Firebase Read Error:", error);
            alert("Veri okuma hatası: " + error.message);
            setError(error.message);
        });

        return () => {
            off(roomRef);
        };
    }, [roomId]);

    // --- Host Auto-Succession (Client Side) ---
    useEffect(() => {
        if (!room || !roomId || !myId || !room.players) return;

        // Check if current host exists in player list
        if (!room.players[room.hostId]) {
            // Host is missing! Determine heir.
            // Sort IDs to ensure all clients agree on the same heir
            const playerIds = Object.keys(room.players).sort();

            if (playerIds.length > 0) {
                const nextHostId = playerIds[0];
                // If I am the heir, I claim the throne
                if (myId === nextHostId) {
                    console.log("Host left. Auto-assigning new host:", nextHostId);
                    update(ref(db, `rooms/${roomId}`), { hostId: nextHostId });
                }
            }
        }
    }, [room, roomId, myId]);

    // --- Host Only: Game Loop & Timer ---
    useEffect(() => {
        if (!isHost || !room || room.phase !== GamePhase.PLAYING) return;

        // Timer Logic
        const currentRoundConfig = room.rounds[room.currentRound];
        if (!currentRoundConfig) return;

        // We can use a simpler approach: Host decrements timer in DB? NO, too many writes.
        // Better: Host tracks time locally and ends round when done. 
        // Clients just show a countdown based on startTime.
        // For simplicity in this migration: Host updates a 'timeLeft' in DB every second? No.
        // We will just use local timeLeft for display and Host triggers End Round.

        // Actually, to keep it smooth:
        // We set startTime in DB. Everyone calculates timeLeft = duration - (now - startTime).
        // Host checks if timeLeft <= 0 -> End Round.

        // For now, let's stick to the previous "Host sets interval" but ideally triggering DB updates only on phase change.
        // BUT, we need to show the timer to everyone. 
        // Let's rely on everyone calculating remaining time from `room.startTime`.

        if (!room.startTime) return;

        const interval = setInterval(() => {
            const elapsed = (Date.now() - room.startTime!) / 1000;
            const remaining = Math.max(0, Math.ceil(currentRoundConfig.duration - elapsed));

            if (remaining <= 0) {
                handleRoundEnd();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [room, isHost]);

    // --- Local Timer Display Sync ---
    useEffect(() => {
        if (room?.phase === GamePhase.PLAYING && room.startTime) {
            const currentRoundConfig = room.rounds[room.currentRound];
            const tick = setInterval(() => {
                const elapsed = (Date.now() - room.startTime!) / 1000;
                setTimeLeft(Math.max(0, Math.ceil(currentRoundConfig.duration - elapsed)));
            }, 100);
            return () => clearInterval(tick);
        } else if (room?.phase === GamePhase.TRANSITION) {
            setTimeLeft(room.rounds[room.currentRound].duration);
        }
    }, [room?.phase, room?.startTime, room?.currentRound]);


    // --- Bot Logic (Host Only) ---
    useEffect(() => {
        if (!isHost || !room || room.phase !== GamePhase.PLAYING || !room.settings.enableBots) return;

        const interval = setInterval(() => {
            // Loop through players, if (p.isBot) update progress
            // Need to construct updates object
            const updates: any = {};
            let changed = false;

            Object.values(room.players).forEach((p: Player) => {
                if (p.isBot && p.status !== 'FINISHED') {
                    let speed = room.rounds[room.currentRound].mode === GameMode.REPAIR ? 5 : 3;
                    // Randomize
                    speed += Math.random() * 5;

                    const newProgress = Math.min(100, p.progress + speed);
                    if (newProgress >= 100) {
                        updates[`rooms/${room.id}/players/${p.id}/status`] = 'FINISHED';
                        updates[`rooms/${room.id}/players/${p.id}/progress`] = 100;
                        updates[`rooms/${room.id}/players/${p.id}/score`] = p.score + 50; // Simple score
                    } else {
                        updates[`rooms/${room.id}/players/${p.id}/progress`] = newProgress;
                    }
                    changed = true;
                }
            });

            if (changed) {
                update(ref(db), updates);
            }

            // Check if ALL players are finished
            const allFinished = Object.values(room.players).every((p: Player) => p.status === 'FINISHED');
            if (allFinished) {
                handleRoundEnd();
                clearInterval(interval);
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [isHost, room?.phase, room?.players]);


    const handleJoin = async (name: string, avatar: string, selectedLang: 'EN' | 'TR', settings: GameSettings, specificRoomCode?: string) => {
        setError(null);
        setLang(selectedLang);

        try {
            if (specificRoomCode) {
                // Join existing
                const pid = await joinRoom(specificRoomCode, name, avatar);
                setMyId(pid);
                setRoomId(specificRoomCode);
            } else {
                // Create new
                const composite = await createRoom(name, avatar, settings, selectedLang);
                const [rid, hid] = composite.split(':');
                setRoomId(rid);
                setMyId(hid);
            }
        } catch (e: any) {
            console.error("Join/Create Error:", e);
            alert("Hata oluştu: " + (e.message || "Bilinmeyen hata"));
            setError(e.message || "Bir hata oluştu");
        }
    };



    const onStartGame = async () => {
        if (roomId) {
            await startGame(roomId, lang);
        }
    };

    const handleMyProgress = (pct: number) => {
        if (roomId && myId) {
            updateProgress(roomId, myId, pct);
        }
    };

    const handleMyCompletion = (extraScore: number = 0) => {
        if (!roomId || !myId || !room) return;

        const timeBonus = timeLeft * 2;
        const currentScore = room.players[myId]?.score || 0;
        const totalScore = currentScore + 50 + timeBonus + extraScore;

        playerFinished(roomId, myId, totalScore);
    };

    const handleRoundEnd = async () => {
        // Host triggers round end
        if (!roomId || !room) return;

        // Calculate winner or next round
        const targetScore = room.settings.targetScore;
        const winner = (Object.values(room.players) as Player[]).find(p => p.score >= targetScore);

        const updates: any = {};
        updates[`rooms/${roomId}/phase`] = GamePhase.ROUND_RESULT;

        update(ref(db), updates);

        setTimeout(async () => {
            if (winner) {
                await update(ref(db, `rooms/${roomId}`), { phase: GamePhase.GAME_OVER });
                // Auto-return to lobby after 10 seconds
                setTimeout(async () => {
                    // Reset room to waiting state instead of leaving
                    const updates: any = {};
                    updates[`rooms/${roomId}/phase`] = GamePhase.WAITING_ROOM;
                    updates[`rooms/${roomId}/currentRound`] = 0;
                    updates[`rooms/${roomId}/startTime`] = null; // Clear timestamps
                    updates[`rooms/${roomId}/words`] = [];

                    // Reset player scores and progress
                    if (room.players) {
                        Object.keys(room.players).forEach(pid => {
                            updates[`rooms/${roomId}/players/${pid}/score`] = 0;
                            updates[`rooms/${roomId}/players/${pid}/progress`] = 0;
                            updates[`rooms/${roomId}/players/${pid}/status`] = 'IDLE';
                        });
                    }

                    await update(ref(db), updates);
                }, 10000);
            } else if (room.currentRound + 1 < room.rounds.length) {
                // Next round
                await startRound(roomId, lang, room.currentRound + 1);
            } else {
                await update(ref(db, `rooms/${roomId}`), { phase: GamePhase.GAME_OVER });
                // Auto-return to lobby after 10 seconds (Same logic)
                setTimeout(async () => {
                    const updates: any = {};
                    updates[`rooms/${roomId}/phase`] = GamePhase.WAITING_ROOM;
                    updates[`rooms/${roomId}/currentRound`] = 0;
                    updates[`rooms/${roomId}/startTime`] = null;
                    updates[`rooms/${roomId}/words`] = [];

                    if (room.players) {
                        Object.keys(room.players).forEach(pid => {
                            updates[`rooms/${roomId}/players/${pid}/score`] = 0;
                            updates[`rooms/${roomId}/players/${pid}/progress`] = 0;
                            updates[`rooms/${roomId}/players/${pid}/status`] = 'IDLE';
                        });
                    }

                    await update(ref(db), updates);
                }, 10000);
            }
        }, 5000);
    };


    const handleDeleteRoom = () => {
        // Implement delete logic if needed
        handleLeaveRoom();
    };

    const handleKickPlayer = (pid: string) => {
        if (roomId) leaveRoom(roomId, pid);
    };

    const handleLeaveRoom = async () => {
        if (!roomId || !myId) return;
        try {
            await leaveRoom(roomId, myId);
            setRoomId(null);
            setMyId(null);
            setRoom(null);
            // Clear URL param if strictly leaving
            window.history.pushState({}, '', window.location.pathname);
        } catch (e) {
            console.error("Leave error", e);
        }
    };

    const handleAddBot = async () => {
        if (roomId) await addBot(roomId);
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}?room=${roomId}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    // --- RENDER HELPERS ---

    if (!roomId || !room) {
        return (
            <>
                {error && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg font-bold z-50 animate-bounce">
                        {error} <button onClick={() => setError(null)} className="ml-2 bg-white/20 rounded-full p-1"><X size={14} /></button>
                    </div>
                )}
                <Lobby onJoin={handleJoin} initialCode={new URLSearchParams(window.location.search).get('room') || undefined} />
            </>
        );
    }

    const playersList = Object.values(room.players || {}) as Player[];
    const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score);
    const currentRound = room.rounds[room.currentRound];

    const descKey = currentRound.description as keyof typeof t;
    const translatedDesc = t[descKey] || currentRound.description;

    // --- WAITING ROOM ---
    if (room.phase === GamePhase.WAITING_ROOM) {
        return (
            <div className="min-h-screen bg-fun-blue flex items-center justify-center p-4">
                {tabWarning && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="bg-white p-8 rounded-3xl max-w-md text-center shadow-2xl border-4 border-fun-blue relative animate-bounce-in">
                            <h2 className="text-2xl font-black text-fun-blue mb-4">⚠️ BİRDEN FAZLA SEKME!</h2>
                            <p className="mb-6 font-bold text-gray-500">KeySmash zaten başka bir sekmede açık. Veri karışıklığı olmaması için lütfen tek sekmede oynayın.</p>
                            <Button onClick={() => setTabWarning(false)} fullWidth>BURADA DEVAM ET</Button>
                        </div>
                    </div>
                )}
                <div className="bg-white rounded-3xl border-4 border-slate-200 shadow-comic w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-[600px] relative">

                    {/* Back Button */}
                    <button
                        onClick={handleLeaveRoom}
                        className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full border-2 border-gray-200 hover:bg-gray-100 shadow-sm"
                        title={t.back_to_lobby}
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>

                    {/* Left: Room Info */}
                    <div className="w-full md:w-1/3 bg-gray-50 border-b-4 md:border-b-0 md:border-r-4 border-slate-200 p-8 flex flex-col items-center pt-16">
                        <div className="text-center w-full">
                            <div className="mb-6">
                                <h2 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-1">{t.room_settings}</h2>
                                <h1 className="text-3xl font-black text-gray-800 break-words leading-tight">KeySmash Room</h1>
                            </div>

                            <div className="space-y-4 w-full">
                                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                    <span className="flex items-center gap-2 text-gray-600 font-bold"><Flag size={18} /> {t.total_rounds}</span>
                                    <span className="font-black text-fun-blue">{room.settings.totalRounds}</span>
                                </div>
                                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                    <span className="flex items-center gap-2 text-gray-600 font-bold"><Target size={18} /> {t.target_score}</span>
                                    <span className="font-black text-fun-orange">{room.settings.targetScore}</span>
                                </div>
                                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                    <span className="flex items-center gap-2 text-gray-600 font-bold">Dil</span>
                                    <span className="font-black text-fun-green">{lang}</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full mt-auto pt-6">
                            {isHost ? (
                                <Button variant="primary" fullWidth onClick={onStartGame} className="text-xl py-4 animate-pulse">
                                    <Play className="inline mr-2 fill-current" /> {t.start_game}
                                </Button>
                            ) : (
                                <div className="text-center">
                                    <div className="text-xl font-black text-gray-400 animate-pulse">{t.waiting_host}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Player List & Link */}
                    <div className="flex-1 p-8 bg-white flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                                OYUNCULAR <span className="text-gray-400 text-lg">({playersList.length}/{room.settings.maxPlayers})</span>
                            </h2>
                            {room.settings.isPrivate && <div className="bg-slate-800 text-yellow-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2"><Lock size={14} /> GİZLİ ODA</div>}
                        </div>

                        {/* Invite Section */}
                        <div className="mb-6 flex flex-col sm:flex-row gap-4">
                            <div className="bg-gray-100 rounded-xl p-3 border-2 border-gray-200 flex-1 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">{t.room_code}</span>
                                    <span className="text-2xl font-black text-gray-800 tracking-widest">{room.id}</span>
                                </div>
                            </div>
                            <div
                                className="bg-blue-50 hover:bg-blue-100 cursor-pointer rounded-xl p-3 border-2 border-blue-100 flex items-center gap-3 transition-colors"
                                onClick={handleCopyLink}
                            >
                                <div className="bg-white p-2 rounded-lg text-fun-blue">
                                    {copiedLink ? <Check size={20} /> : <Copy size={20} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-black text-blue-400 tracking-wider">DAVET ET</span>
                                    <span className="font-bold text-fun-blue text-sm">{copiedLink ? t.copied : t.copy_link}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {playersList.map((p) => (
                                <div key={p.id} className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 relative group hover:border-fun-blue transition-colors">
                                    {p.id === room.hostId && <Crown size={20} className="absolute top-2 right-2 text-yellow-500 fill-current animate-bounce" />}

                                    {isHost && (p.id !== myId || p.isBot) && (
                                        <button
                                            onClick={() => handleKickPlayer(p.id)}
                                            className={`absolute top-2 right-2 rounded-full p-1 transition-all ${p.isBot ? 'text-gray-400 bg-gray-100 opacity-100 hover:text-red-500 hover:bg-red-100' : 'text-gray-300 hover:text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100'}`}
                                            title={t.kick}
                                        >
                                            <X size={16} strokeWidth={3} />
                                        </button>
                                    )}

                                    <div className="w-20 h-20 mb-3 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center shadow-sm relative">
                                        <Avatar config={p.avatar} className="w-16 h-16" />
                                    </div>
                                    <div className="font-bold text-gray-800 truncate w-full text-center">{p.name}</div>
                                    <div className="text-xs font-bold text-gray-400 uppercase">{p.isBot ? 'BOT' : (p.id === myId ? 'SEN' : 'OYUNCU')}</div>
                                </div>
                            ))}

                            {/* Empty Slots or Add Bot */}
                            {Array.from({ length: (room.settings.maxPlayers || 4) - playersList.length }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 opacity-50 relative">

                                    {isHost && room.settings.enableBots ? (
                                        <button
                                            onClick={handleAddBot}
                                            className="flex flex-col items-center justify-center w-full h-full group hover:text-fun-blue transition-colors"
                                        >
                                            <div className="w-16 h-16 bg-gray-50 group-hover:bg-blue-50 rounded-full flex items-center justify-center mb-2 transition-colors">
                                                <Plus className="text-gray-300 group-hover:text-fun-blue" size={32} />
                                            </div>
                                            <div className="text-xs font-bold text-gray-300 group-hover:text-fun-blue">BOT EKLE</div>
                                        </button>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                                                <Users className="text-gray-300" />
                                            </div>
                                            <div className="text-xs font-bold text-gray-300">BEKLENİYOR...</div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- GAME UI ---
    return (
        <div className="min-h-screen bg-fun-blue flex flex-col font-sans overflow-hidden">
            <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2.5px)', backgroundSize: '20px 20px' }}></div>

            {/* Top Header */}
            <header className="relative z-20 px-4 py-2 bg-white/90 border-b-4 border-black/10 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    {room.settings.isPrivate && (
                        <div className="bg-slate-800 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                            <Lock size={12} /> GİZLİ ODA
                        </div>
                    )}
                    <div>
                        <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t.round} {currentRound.roundNumber} / {room.rounds.length}</h2>
                        <div className="text-lg font-black text-gray-800 flex items-center gap-2">
                            {currentRound.mode === GameMode.REPAIR ? `🧩 ${t.repair_task}` : `⌨️ ${t.typing_task}`}
                        </div>
                    </div>
                </div>

                <div className="absolute left-1/2 transform -translate-x-1/2 bg-white px-6 py-2 rounded-b-xl border-x-4 border-b-4 border-slate-200 shadow-comic">
                    <div className={`flex items-center gap-2 text-3xl font-black ${timeLeft < 10 ? 'text-fun-red animate-pulse' : 'text-gray-700'}`}>
                        <Timer /> {timeLeft}s
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs text-gray-500 font-bold">LİDER</div>
                    <div className="font-bold text-fun-darkblue">{sortedPlayers[0]?.name} ({sortedPlayers[0]?.score})</div>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 relative z-10">
                {/* Players Sidebar */}
                <aside className="w-full md:w-64 flex flex-col gap-2 overflow-y-auto pr-2">
                    {sortedPlayers.map((p, i) => (
                        <div key={p.id} className={`flex items-center gap-3 p-2 rounded-xl border-b-4 transition-all ${p.id === myId ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
                            <div className="w-12 h-12 flex-shrink-0 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 overflow-hidden">
                                <Avatar config={p.avatar} className="w-10 h-10" />
                            </div>
                            <div className="flex-1 min-w-0 z-10">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800 truncate text-sm">{p.name}</span>
                                    <span className="font-black text-fun-blue text-xs">{p.score}</span>
                                </div>
                                {room.phase === GamePhase.PLAYING && p.status !== 'FINISHED' && (
                                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-fun-green transition-all duration-300" style={{ width: `${p.progress}%` }}></div>
                                    </div>
                                )}
                                {p.status === 'FINISHED' && (
                                    <div className="text-xs text-fun-green font-bold flex items-center">
                                        <Zap size={10} className="mr-1 fill-current" /> BİTTİ
                                    </div>
                                )}
                            </div>
                            <div className="absolute right-2 top-2 text-slate-200 font-black text-2xl -z-0 select-none">#{i + 1}</div>
                        </div>
                    ))}
                </aside>

                {/* Game Canvas */}
                <main className="flex-1 bg-white rounded-3xl border-4 border-slate-200 shadow-comic relative overflow-hidden flex flex-col">
                    <div className="flex-1 relative flex items-center justify-center p-4">
                        {room.phase === GamePhase.TRANSITION && (
                            <div className="text-center animate-bounce">
                                <div className="text-8xl mb-4 filter drop-shadow-lg">{currentRound.mode === GameMode.REPAIR ? '🧩' : '⌨️'}</div>
                                <h1 className="text-5xl font-black text-gray-800 mb-2 stroke-white">{t.get_ready}</h1>
                                <p className="text-fun-blue text-2xl font-bold bg-blue-50 px-4 py-2 rounded-full inline-block">{translatedDesc}</p>
                            </div>
                        )}

                        {room.phase === GamePhase.PLAYING && (
                            <div className="w-full h-full flex items-center justify-center">
                                {currentRound.mode === GameMode.REPAIR ? (
                                    <KeyboardRepair
                                        onProgress={handleMyProgress}
                                        onComplete={() => handleMyCompletion(0)}
                                    />
                                ) : (
                                    <TypingRace
                                        words={room.words || []}
                                        lang={lang}
                                        onProgress={handleMyProgress}
                                        onComplete={(wpm) => handleMyCompletion(wpm)}
                                    />
                                )}
                            </div>
                        )}

                        {room.phase === GamePhase.ROUND_RESULT && (
                            <div className="text-center bg-white p-8 rounded-3xl border-4 border-slate-200 shadow-xl max-w-md w-full">
                                <h2 className="text-3xl font-black text-gray-800 mb-2">Süre Doldu!</h2>
                                <p className="text-gray-400 mb-6 font-bold">{t.waiting}...</p>
                                <div className="p-6 bg-fun-yellow/20 rounded-2xl border-2 border-fun-yellow border-dashed">
                                    <div className="text-sm text-gray-600 font-bold uppercase">{t.your_score}</div>
                                    <div className="text-5xl text-fun-orange font-black drop-shadow-sm">
                                        {room.players[myId || '']?.score}
                                    </div>
                                </div>
                            </div>
                        )}

                        {room.phase === GamePhase.GAME_OVER && (
                            <div className="text-center w-full max-w-lg">
                                <Trophy size={100} className="text-fun-yellow mx-auto mb-6 animate-bounce filter drop-shadow-lg" fill="currentColor" />
                                <h1 className="text-6xl font-black text-gray-800 mb-2">{t.game_over}</h1>
                                <p className="text-2xl text-fun-blue font-bold mb-8">Kazanan: {sortedPlayers[0]?.name}!</p>

                                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 mb-8 max-h-60 overflow-y-auto">
                                    {sortedPlayers.map((p, i) => (
                                        <div key={p.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xl font-black ${i === 0 ? 'text-fun-yellow' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-700' : 'text-gray-300'}`}>
                                                    #{i + 1}
                                                </span>
                                                <Avatar config={p.avatar} className="w-10 h-10" />
                                                <span className="font-bold text-gray-700">{p.name}</span>
                                            </div>
                                            <span className="font-black text-fun-blue">{p.score} pts</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <p className="text-sm text-gray-400 font-bold mb-4">10 saniye içinde lobiye dönülecek...</p>
                                    <Button onClick={handleLeaveRoom} variant="danger" className="text-xl px-6 flex-1">
                                        <Home className="inline mr-2" size={24} /> {t.exit_to_lobby}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;