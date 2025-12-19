import { RoundConfig, GameMode } from './types';

export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export const WORDS_POOL = {
  EN: [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "I", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"
  ],
  TR: [
    "ve", "bir", "bu", "da", "de", "için", "çok", "o", "en", "ne", "kadar", "olan", "ile", "var", "gibi", "sonra", "daha", "ama", "diye", "büyük", "yeni", "kendi", "her", "zaman", "yer", "yıl", "gün", "kendi", "sadece", "veya", "tüm", "şimdi", "yok", "geldi", "dedi", "iş", "ki", "son", "iyi", "oldu", "bunu", "şey", "ben", "zaten", "insan", "devlet", "zaman", "kendi", "biz", "iki", "fakat", "önce", "yok", "daha", "kendi", "bile", "için", "tarafından", "mi", "nasıl", "başka", "böyle", "yüzden", "aynı", "hiç", "kadar", "sadece", "biri", "diğer", "çünkü", "hemen", "söyle", "yapma", "olma", "bana", "seni", "bizi", "onlar", "bütün", "olmak", "taraf", "hayat", "ancak", "işte", "kendi", "bile", "yine", "göre", "tek", "dünya", "durum", "uzun", "gelmek", "el", "yol", "çocuk", "etmek", "söz", "onun", "yoksa", "konu", "hangi", "olur", "bugün", "adam", "önemli", "ara", "üzerine", "ses", "hep", "kabul", "yüz", "geri", "neden", "kadın", "üzerinde", "ülke", "almak", "yan", "kullanmak", "el", "hak", "dışında", "şekil", "baba", "vermek", "ilk", "göz", "gerek", "genç", "kitap", "dönem", "arkadaş", "ürün", "aile", "sistem", "bugün", "su", "türkiye", "birlikte", "saat", "gerçek", "ses", "kan", "sabah", "olay", "bölüm", "yazmak", "dönmek", "akşam", "hafta", "ay", "gece", "zor", "bulunmak", "ad", "sayı", "grup", "oda", "kısa", "an", "alt", "üst", "sorun", "kişi", "sıra"
  ]
};

// Generates a random list of 100 words for the typing race
export const generateWordList = (lang: 'TR' | 'EN', count: number = 100): string[] => {
  const pool = WORDS_POOL[lang];
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    list.push(pool[randomIndex]);
  }
  return list;
};

// Not used anymore in new logic, but kept for compatibility types
export const TYPING_SENTENCES = {
  EN: [],
  TR: []
};

export const TRANSLATIONS = {
  TR: {
    wpm: "DB/DK",
    progress: "İLERLEME",
    name_required: "Lütfen bir isim girin!",
    quick_start: "HIZLI BAŞLA",
    play_vs_ai: "Botlara Karşı Oyna",
    enter_code: "ODA KODU GİR",
    join_btn: "KATIL",
    how_to_play: "NASIL OYNANIR?",
    tab_play: "OYNA",
    tab_rooms: "ODALAR",
    tab_create: "KUR",
    start_game: "OYUNU BAŞLAT",
    waiting_host: "Kurucunun başlatması bekleniyor...",
    back_to_lobby: "Lobiye Dön",
    room_settings: "ODA AYARLARI",
    bot_players: "BOT OYUNCULAR",
    total_rounds: "TOPLAM TUR",
    target_score: "HEDEF PUAN",
    room_code: "ODA KODU",
    copied: "KOPYALANDI!",
    copy_link: "BAĞLANTIYI KOPYALA",
    kick: "Oyuncuyu At",
    round: "TUR",
    repair_task: "KLAVYE TAMİRİ",
    typing_task: "YAZMA YARIŞI",
    get_ready: "HAZIR OL!",
    waiting: "Diğerleri bekleniyor",
    your_score: "SENİN PUANIN",
    game_over: "OYUN BİTTİ",
    play_again: "TEKRAR OYNA",
    back_to_room: "ODAYA DÖN",
    exit_to_lobby: "LOBİYE DÖN",
    htp_repair_title: "KLAVYENİ TAMİR ET",
    htp_repair_desc: "Eksik tuşları sürükleyip yerine koyarak klavyeni onar.",
    htp_type_title: "HIZLI YAZ",
    htp_type_desc: "Ekranda çıkan kelimeleri sırasıyla ve hatasız yaz.",
    htp_win_title: "KAZANAN OL",
    htp_win_desc: "Rakiplerinden daha fazla puan toplayarak şampiyon ol.",
    close: "KAPAT"
  },
  EN: {
    wpm: "WPM",
    progress: "PROGRESS",
    name_required: "Please enter a name!",
    quick_start: "QUICK START",
    play_vs_ai: "Play vs Bots",
    enter_code: "ENTER ROOM CODE",
    join_btn: "JOIN",
    how_to_play: "HOW TO PLAY?",
    tab_play: "PLAY",
    tab_rooms: "ROOMS",
    tab_create: "CREATE",
    start_game: "START GAME",
    waiting_host: "Waiting for host to start...",
    back_to_lobby: "Back to Lobby",
    room_settings: "ROOM SETTINGS",
    bot_players: "BOT PLAYERS",
    total_rounds: "TOTAL ROUNDS",
    target_score: "TARGET SCORE",
    room_code: "ROOM CODE",
    copied: "COPIED!",
    copy_link: "COPY LINK",
    kick: "Kick Player",
    round: "ROUND",
    repair_task: "KEYBOARD REPAIR",
    typing_task: "TYPING RACE",
    get_ready: "GET READY!",
    waiting: "Waiting for others",
    your_score: "YOUR SCORE",
    game_over: "GAME OVER",
    play_again: "PLAY AGAIN",
    back_to_room: "BACK TO ROOM",
    exit_to_lobby: "EXIT TO LOBBY",
    htp_repair_title: "REPAIR KEYBOARD",
    htp_repair_desc: "Drag and drop missing keys to fix your keyboard.",
    htp_type_title: "TYPE FAST",
    htp_type_desc: "Type the words as fast and accurately as you can.",
    htp_win_title: "BE THE WINNER",
    htp_win_desc: "Collect more points than your opponents to win.",
    close: "CLOSE"
  }
};

export const generateRounds = (total: number): RoundConfig[] => {
  const rounds: RoundConfig[] = [];
  for (let i = 1; i <= total; i++) {
    const isOdd = i % 2 !== 0;
    rounds.push({
      roundNumber: i,
      mode: isOdd ? GameMode.REPAIR : GameMode.TYPING,
      description: isOdd ? 'htp_repair_desc' : 'htp_type_desc',
      duration: isOdd ? 20 : 35
    });
  }
  return rounds;
};

export const ROUNDS: RoundConfig[] = generateRounds(4);