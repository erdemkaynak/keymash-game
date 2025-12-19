import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { TRANSLATIONS } from '../constants';
import { Avatar, generateRandomAvatar } from './ui/Avatar';
import { User, Users, Play, Plus, Search, ChevronLeft, ChevronRight, Lock, Globe, Pencil, X, Dice5, Bot, Target, Flag, Hash, Zap, Gamepad2, List, HelpCircle, Trophy, Keyboard, Languages } from 'lucide-react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../lib/firebase';
import { GameSettings, Room } from '../types';

interface LobbyProps {
    onJoin: (name: string, avatar: string, lang: 'EN' | 'TR', settings: GameSettings, roomCode?: string) => void;
    initialCode?: string;
}



const BODY_NAMES = ['İNSAN', 'YILAN', 'UZAYLI', 'HAYALET', 'ROBOT', 'BULUT'];

export const Lobby: React.FC<LobbyProps> = ({ onJoin, initialCode }) => {
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState(false);
    const [roomCodeInput, setRoomCodeInput] = useState(initialCode || '');

    const [lang, setLang] = useState<'EN' | 'TR'>('TR');
    const [tab, setTab] = useState<'HOME' | 'BROWSE' | 'CREATE'>('HOME');
    const [showAvatarEditor, setShowAvatarEditor] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);

    // Room Settings
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [isPrivate, setIsPrivate] = useState(false);
    const [enableBots, setEnableBots] = useState(true);
    const [totalRounds, setTotalRounds] = useState(4);
    const [targetScore, setTargetScore] = useState(1000);
    const [roomLang, setRoomLang] = useState<'EN' | 'TR'>('TR'); // New setting for room creation

    // Avatar Config State
    const [type, setType] = useState(0);
    const [skin, setSkin] = useState(0);
    const [eyes, setEyes] = useState(0);
    const [mouth, setMouth] = useState(0);
    const [acc, setAcc] = useState(0);

    const [rooms, setRooms] = useState<any[]>([]);

    useEffect(() => {
        const roomsRef = ref(db, 'rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Convert object to array and filter
                const roomList = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    ...val,
                    // Host name might need to be resolved if not in room object directly
                    // Assuming room object has hostName or we just use 'Oda'
                    hostName: val.players?.[val.hostId]?.name || 'Oyuncu'
                })).filter((r: any) =>
                    !r.isPrivate &&
                    r.phase === 'WAITING_ROOM' &&
                    r.players &&
                    Object.keys(r.players || {}).length > 0 &&
                    r.players[r.hostId] // Host must exist 
                );
                setRooms(roomList);
            } else {
                setRooms([]);
            }
        });

        return () => off(roomsRef);
    }, []);

    const t = TRANSLATIONS[lang];

    const getAvatarConfig = () => `${type}-${skin}-${eyes}-${mouth}-${acc}`;

    const randomizeAvatar = () => {
        setType(Math.floor(Math.random() * 6));
        setSkin(Math.floor(Math.random() * 12));
        setEyes(Math.floor(Math.random() * 8));
        setMouth(Math.floor(Math.random() * 8));
        setAcc(Math.floor(Math.random() * 17));
    };

    const cycle = (setter: React.Dispatch<React.SetStateAction<number>>, current: number, max: number, dir: 1 | -1) => {
        setter((prev) => {
            let next = prev + dir;
            if (next < 0) next = max - 1;
            if (next >= max) next = 0;
            return next;
        });
    };

    const validateAndJoin = (settings: GameSettings, specificRoomCode?: string) => {
        if (!name.trim()) {
            setNameError(true);
            return;
        }
        // If creating a room, use roomLang. If joining via quick start, use user lang preference.
        const selectedLang = tab === 'CREATE' ? roomLang : lang;

        onJoin(name, getAvatarConfig(), selectedLang, settings, specificRoomCode);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        if (nameError && e.target.value.trim()) {
            setNameError(false);
        }
    };

    const handleQuickStart = () => {
        validateAndJoin({
            maxPlayers: 4,
            isPrivate: true,
            enableBots: true, // Force Bots for quick start
            totalRounds: 4,
            targetScore: 1000
        });
    };

    const handleStartCreate = () => {
        console.log("Create Room Clicked", { maxPlayers, isPrivate, enableBots, totalRounds, targetScore, name });
        validateAndJoin({
            maxPlayers,
            isPrivate,
            enableBots,
            totalRounds,
            targetScore
        });
    };

    const handleJoinByCode = () => {
        if (!roomCodeInput.trim()) return;
        validateAndJoin({
            maxPlayers: 8,
            isPrivate: false,
            enableBots: false,
            totalRounds: 4,
            targetScore: 1000
        }, roomCodeInput);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">

            {/* Logo with clean Text Shadow fix */}
            <div className="mb-6 text-center transform hover:scale-105 transition-transform duration-300">
                <h1
                    className="text-5xl md:text-7xl font-black text-white"
                    style={{
                        textShadow: '4px 4px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
                    }}
                >
                    KEYSMASH!
                </h1>
            </div>

            {/* Main Card */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl items-stretch">

                {/* Left: Compact Profile */}
                <div className="w-full md:w-1/3 bg-white border-4 border-slate-200 rounded-3xl p-6 shadow-comic flex flex-col items-center">
                    {/* Avatar Display */}
                    <div className="relative group">
                        <div className="w-48 h-48 bg-blue-50 rounded-full border-4 border-blue-100 flex items-center justify-center shadow-inner overflow-hidden mb-6 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setShowAvatarEditor(true)}>
                            <Avatar config={getAvatarConfig()} className="w-40 h-40" />
                        </div>
                        <button
                            onClick={() => setShowAvatarEditor(true)}
                            className="absolute bottom-4 right-2 bg-fun-yellow text-black p-3 rounded-full border-2 border-black shadow-comic hover:scale-110 transition-transform"
                        >
                            <Pencil size={20} />
                        </button>
                    </div>

                    <div className="w-full relative mb-4">
                        <User className={`absolute left-3 top-3.5 transition-colors ${nameError ? 'text-red-500' : 'text-gray-400'}`} size={20} />
                        <input
                            type="text"
                            className={`w-full bg-gray-100 border-2 rounded-xl py-3 pl-10 pr-4 font-bold text-lg focus:outline-none focus:ring-0 transition-all text-center ${nameError ? 'border-red-500 text-red-900 placeholder-red-300 animate-pulse' : 'border-gray-300 text-gray-700 focus:border-fun-blue'}`}
                            placeholder={nameError ? t.name_required : "İsminiz..."}
                            value={name}
                            onChange={handleNameChange}
                            maxLength={12}
                        />
                    </div>

                    <div className="flex gap-2 w-full mt-auto">
                        {(['TR', 'EN'] as const).map(l => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={`flex-1 py-3 font-black rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all ${lang === l ? 'bg-fun-blue text-white border-blue-700' : 'bg-gray-100 text-gray-400 border-gray-300'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Room Management */}
                <div className="w-full md:w-2/3 bg-white border-4 border-slate-200 rounded-3xl p-6 shadow-comic min-h-[500px] flex flex-col">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b-4 border-gray-100 pb-4">
                        <button
                            onClick={() => setTab('HOME')}
                            className={`flex-1 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${tab === 'HOME' ? 'bg-fun-yellow text-black shadow-comic border-2 border-black' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <Gamepad2 size={22} /> {t.tab_play}
                        </button>
                        <button
                            onClick={() => setTab('BROWSE')}
                            className={`flex-1 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${tab === 'BROWSE' ? 'bg-fun-blue text-white shadow-comic border-2 border-blue-900' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <List size={22} /> {t.tab_rooms}
                        </button>
                        <button
                            onClick={() => setTab('CREATE')}
                            className={`flex-1 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${tab === 'CREATE' ? 'bg-fun-green text-white shadow-comic border-2 border-green-800' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <Plus size={22} /> {t.tab_create}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
                        {/* --- HOME TAB (Quick Start & Code) --- */}
                        {tab === 'HOME' && (
                            <div className="flex flex-col h-full gap-5 justify-center px-4">

                                {/* Quick Start Button */}
                                <div className="relative group">
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={handleQuickStart}
                                        className="py-6 text-2xl flex items-center justify-center gap-3 animate-pulse-slow border-b-8 active:border-b-0"
                                    >
                                        <Zap size={32} fill="currentColor" className="text-yellow-300" />
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="font-black tracking-wider">{t.quick_start}</span>
                                            <span className="text-sm font-bold opacity-80 text-blue-100">{t.play_vs_ai}</span>
                                        </div>
                                    </Button>
                                    {nameError && (
                                        <div className="absolute top-full left-0 right-0 text-center mt-2 text-red-500 font-bold text-sm animate-bounce">
                                            {t.name_required}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-gray-300 font-black text-sm">
                                    <div className="h-1 bg-gray-200 flex-1 rounded-full"></div>
                                    VEYA
                                    <div className="h-1 bg-gray-200 flex-1 rounded-full"></div>
                                </div>

                                {/* Code Input */}
                                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200 flex flex-col gap-3">
                                    <label className="text-gray-500 font-bold text-sm uppercase flex items-center gap-2">
                                        <Hash size={16} /> {t.enter_code}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="KOD"
                                            value={roomCodeInput}
                                            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                                            className="flex-1 bg-white border-2 border-gray-300 rounded-xl px-4 py-3 font-black text-gray-700 text-xl uppercase focus:outline-none focus:border-fun-blue placeholder-gray-300 text-center tracking-widest"
                                            maxLength={6}
                                        />
                                        <Button
                                            variant="success"
                                            className="py-3 px-6 text-lg"
                                            onClick={handleJoinByCode}
                                            disabled={!roomCodeInput}
                                        >
                                            {t.join_btn}
                                        </Button>
                                    </div>
                                </div>

                                {/* How to Play Button */}
                                <button
                                    onClick={() => setShowHowToPlay(true)}
                                    className="mt-2 py-3 px-4 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-400 font-bold hover:bg-gray-50 hover:text-fun-blue hover:border-fun-blue transition-all"
                                >
                                    <HelpCircle size={20} />
                                    {t.how_to_play}
                                </button>
                            </div>
                        )}

                        {/* --- BROWSE TAB --- */}
                        {tab === 'BROWSE' && (
                            <div className="space-y-3">
                                {rooms.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 font-bold">
                                        <div className="text-4xl mb-2">📭</div>
                                        Henüz hiç oda yok.<br />İlk odayı sen kur!
                                    </div>
                                ) : (
                                    rooms.map(room => (
                                        <div key={room.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 hover:border-fun-blue transition-all group cursor-pointer hover:shadow-md">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-100 font-black text-gray-400">
                                                    {room.lang}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-800 text-lg group-hover:text-fun-blue">{room.hostName}'in Odası</div>
                                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                                        <span>#{room.id.slice(-4)}</span>
                                                        <span className="bg-gray-200 px-1.5 rounded text-[10px] text-gray-600">
                                                            {room.lang === 'TR' ? '🇹🇷 TR Words' : '🇬🇧 EN Words'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg border">
                                                    {Object.keys(room.players || {}).length}/{room.settings.maxPlayers}
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => validateAndJoin({
                                                        maxPlayers: 8,
                                                        isPrivate: false,
                                                        enableBots: false,
                                                        totalRounds: 4,
                                                        targetScore: 1000
                                                    }, room.id)}
                                                    className="py-2 px-5 text-sm"
                                                    disabled={Object.keys(room.players || {}).length >= room.settings.maxPlayers || room.phase !== 'WAITING_ROOM'}
                                                >
                                                    {room.phase === 'WAITING_ROOM' ? t.join_btn : 'BAŞLADI'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* --- CREATE TAB --- */}
                        {tab === 'CREATE' && (
                            <div className="flex flex-col h-full justify-start px-2 gap-4 overflow-y-auto">

                                {/* Players */}
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                                        <span className="flex items-center gap-2"><Users size={16} className="text-fun-blue" /> Kişi Sayısı</span>
                                        <span className="bg-fun-blue text-white px-2 py-0.5 rounded text-xs">{maxPlayers}</span>
                                    </label>
                                    <input
                                        type="range" min="2" max="8" value={maxPlayers}
                                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                        className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-fun-blue"
                                    />
                                </div>

                                {/* Language Selection for Room */}
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                                        <span className="flex items-center gap-2"><Languages size={16} className="text-purple-500" /> Oda Dili</span>
                                    </label>
                                    <div className="flex gap-2">
                                        {(['TR', 'EN'] as const).map(l => (
                                            <button
                                                key={l}
                                                onClick={() => setRoomLang(l)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${roomLang === l ? 'bg-purple-500 text-white border-purple-700 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                            >
                                                {l === 'TR' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Total Rounds */}
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                                        <span className="flex items-center gap-2"><Flag size={16} className="text-fun-orange" /> Toplam Tur</span>
                                        <span className="bg-fun-orange text-white px-2 py-0.5 rounded text-xs">{totalRounds}</span>
                                    </label>
                                    <input
                                        type="range" min="2" max="10" step="2" value={totalRounds}
                                        onChange={(e) => setTotalRounds(Number(e.target.value))}
                                        className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-fun-orange"
                                    />
                                </div>

                                {/* Target Score */}
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                                        <span className="flex items-center gap-2"><Target size={16} className="text-fun-green" /> Hedef Puan</span>
                                        <span className="bg-fun-green text-white px-2 py-0.5 rounded text-xs">{targetScore}</span>
                                    </label>
                                    <div className="flex gap-2">
                                        {[500, 1000, 1500, 2000].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setTargetScore(s)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${targetScore === s ? 'bg-fun-green text-white border-green-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Privacy Toggle */}
                                    <div
                                        className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${isPrivate ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        onClick={() => setIsPrivate(!isPrivate)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isPrivate ? <Lock size={16} /> : <Globe size={16} />}
                                            <span className="font-bold text-xs">{isPrivate ? 'GİZLİ' : 'AÇIK'}</span>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isPrivate ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${isPrivate ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>

                                    {/* Bot Toggle */}
                                    <div
                                        className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${enableBots ? 'bg-blue-50 border-fun-blue text-fun-blue' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                        onClick={() => setEnableBots(!enableBots)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Bot size={16} />
                                            <span className="font-bold text-xs">Y. ZEKA</span>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${enableBots ? 'bg-fun-blue' : 'bg-gray-300'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${enableBots ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative mt-2">
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        className="text-lg py-4"
                                        onClick={handleStartCreate}
                                    >
                                        <Play className="inline mr-2 fill-current" /> ODA KUR
                                    </Button>
                                    {nameError && (
                                        <div className="absolute bottom-full mb-2 left-0 right-0 text-center text-red-500 font-bold text-sm animate-bounce">
                                            {t.name_required}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* HOW TO PLAY MODAL */}
            {showHowToPlay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl border-4 border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                        <div className="bg-gray-100 border-b-2 border-gray-200 p-4 flex justify-between items-center">
                            <h3 className="font-black text-xl text-gray-700 flex items-center gap-2"><HelpCircle /> {t.how_to_play}</h3>
                            <button onClick={() => setShowHowToPlay(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X size={28} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Step 1 */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 border-4 border-blue-100 shadow-sm">
                                        <Keyboard size={48} className="text-fun-blue" />
                                    </div>
                                    <h4 className="font-black text-lg text-gray-800 mb-2">{t.htp_repair_title}</h4>
                                    <p className="text-sm text-gray-500 font-bold leading-relaxed">{t.htp_repair_desc}</p>
                                </div>

                                {/* Step 2 */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-4 border-4 border-yellow-100 shadow-sm">
                                        <Zap size={48} className="text-fun-yellow" fill="currentColor" />
                                    </div>
                                    <h4 className="font-black text-lg text-gray-800 mb-2">{t.htp_type_title}</h4>
                                    <p className="text-sm text-gray-500 font-bold leading-relaxed">{t.htp_type_desc}</p>
                                </div>

                                {/* Step 3 */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4 border-4 border-green-100 shadow-sm">
                                        <Trophy size={48} className="text-fun-green" />
                                    </div>
                                    <h4 className="font-black text-lg text-gray-800 mb-2">{t.htp_win_title}</h4>
                                    <p className="text-sm text-gray-500 font-bold leading-relaxed">{t.htp_win_desc}</p>
                                </div>
                            </div>
                            <div className="mt-8">
                                <Button fullWidth onClick={() => setShowHowToPlay(false)}>
                                    {t.close}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AVATAR EDITOR MODAL */}
            {showAvatarEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl border-4 border-slate-200 shadow-2xl w-full max-w-md relative overflow-hidden animate-[scaleIn_0.2s_ease-out]">

                        {/* Header */}
                        <div className="bg-gray-100 border-b-2 border-gray-200 p-4 flex justify-between items-center">
                            <h3 className="font-black text-xl text-gray-700">KARAKTERİNİ DÜZENLE</h3>
                            <button onClick={() => setShowAvatarEditor(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X size={28} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col items-center">
                            {/* Preview */}
                            <div className="relative mb-6">
                                <div className="w-48 h-48 bg-blue-50 rounded-full border-4 border-blue-100 flex items-center justify-center shadow-inner">
                                    <Avatar config={getAvatarConfig()} className="w-40 h-40" />
                                </div>
                                <button
                                    onClick={randomizeAvatar}
                                    className="absolute bottom-0 right-0 bg-fun-green text-white p-3 rounded-full border-2 border-green-700 shadow-comic hover:scale-110 transition-transform"
                                    title="Randomize"
                                >
                                    <Dice5 size={24} />
                                </button>
                            </div>

                            {/* Controls */}
                            <div className="w-full space-y-3 mb-6">
                                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 border-2 border-gray-200">
                                    <button onClick={() => cycle(setType, type, 6, -1)} className="p-2 hover:bg-gray-200 rounded-lg"><ChevronLeft /></button>
                                    <span className="font-bold text-gray-700 text-sm uppercase flex-1 text-center">
                                        TİP: {BODY_NAMES[type]}
                                    </span>
                                    <button onClick={() => cycle(setType, type, 6, 1)} className="p-2 hover:bg-gray-200 rounded-lg"><ChevronRight /></button>
                                </div>

                                {[
                                    { label: 'Renk', val: skin, set: setSkin, max: 12 },
                                    { label: 'Gözler', val: eyes, set: setEyes, max: 8 },
                                    { label: 'Ağız', val: mouth, set: setMouth, max: 8 },
                                    { label: 'Aksesuar', val: acc, set: setAcc, max: 17 },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-2 border-2 border-gray-200">
                                        <button onClick={() => cycle(item.set, item.val, item.max, -1)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={20} /></button>
                                        <span className="font-bold text-gray-500 text-xs uppercase">{item.label}</span>
                                        <button onClick={() => cycle(item.set, item.val, item.max, 1)} className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={20} /></button>
                                    </div>
                                ))}
                            </div>

                            <Button fullWidth onClick={() => setShowAvatarEditor(false)}>
                                KAYDET
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};