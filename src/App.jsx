import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Volume2, 
  Settings, 
  Home, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  RotateCcw, 
  Upload, 
  Loader2, 
  Shuffle, 
  CheckSquare, 
  BookOpen, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Type,
  List,
  Grid
} from 'lucide-react';

export default function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'setup-random', 'setup-select', 'dictation', 'settings', 'results', 'revision'
  
  // Accumulation Database
  const [accumulationList, setAccumulationList] = useState([
    { id: 1, word: 'apple' },
    { id: 2, word: 'beautiful' },
    { id: 3, word: 'friend' },
    { id: 4, word: 'school' },
    { id: 5, word: 'teacher' },
    { id: 6, word: 'elephant' },
    { id: 7, word: 'adventure' },
    { id: 8, word: 'tomorrow' }
  ]);

  // One-time temporary list
  const [oneTimeList, setOneTimeList] = useState([]);

  // Active playing subset
  const [activePlayList, setActivePlayList] = useState([]);
  
  // Custom Selection tracking state (for setup-select screen)
  const [selectedWordIds, setSelectedWordIds] = useState([]);

  // Random count picker state
  const [randomCount, setRandomCount] = useState(5);

  // Dictation Game Play State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState('');
  const [activeModeLabel, setActiveModeLabel] = useState('');

  // Revision / Study Mode State
  const [showSyllables, setShowSyllables] = useState(true);
  const [fontSize, setFontSize] = useState('text-6xl'); // 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'
  const [revisionIndex, setRevisionIndex] = useState(0);
  const [revisionViewMode, setRevisionViewMode] = useState('card'); // 'card' or 'grid'

  const inputRef = useRef(null);

  // --- AUDIO / TTS FUNCTION ---
  const speakWord = (wordToSpeak = null) => {
    const listToUse = currentView === 'revision' ? activePlayList : activePlayList;
    const indexToUse = currentView === 'revision' ? revisionIndex : currentIndex;
    
    if (listToUse.length === 0) return;
    const word = wordToSpeak || listToUse[indexToUse].word;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.82; // Slightly slower for primary school students
      utterance.pitch = 1.05; // Friendly high pitch
      utterance.lang = 'en-US';
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (inputRef.current && currentView === 'dictation') {
          inputRef.current.focus();
        }
      };
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setTtsError('');
    } else {
      setTtsError('Sorry, your device does not support reading words out loud.');
    }
  };

  // --- GAME LAUNCHERS ---
  const startOneTimeDictation = () => {
    if (oneTimeList.length === 0) return;
    setActivePlayList([...oneTimeList]);
    setActiveModeLabel('⚡ One-Time List');
    initGame(oneTimeList);
  };

  const startRandomDictation = () => {
    if (accumulationList.length === 0) return;
    const shuffled = [...accumulationList].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(randomCount, accumulationList.length));
    setActivePlayList(selected);
    setActiveModeLabel('🎲 Random Mix');
    initGame(selected);
  };

  const startSelectedDictation = () => {
    const selected = accumulationList.filter(w => selectedWordIds.includes(w.id));
    if (selected.length === 0) return;
    setActivePlayList(selected);
    setActiveModeLabel('🎯 Selected Words');
    initGame(selected);
  };

  const initGame = (words) => {
    setCurrentIndex(0);
    setScore(0);
    setUserInput('');
    setFeedback(null);
    setHasAttempted(false);
    setCurrentView('dictation');
  };

  // --- REVISION LAUNCHERS ---
  const startOneTimeRevision = () => {
    if (oneTimeList.length === 0) return;
    setActivePlayList([...oneTimeList]);
    setActiveModeLabel('⚡ One-Time List');
    initRevision();
  };

  const startRandomRevision = () => {
    if (accumulationList.length === 0) return;
    const shuffled = [...accumulationList].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(randomCount, accumulationList.length));
    setActivePlayList(selected);
    setActiveModeLabel('🎲 Random Mix');
    initRevision();
  };

  const startSelectedRevision = () => {
    const selected = accumulationList.filter(w => selectedWordIds.includes(w.id));
    if (selected.length === 0) return;
    setActivePlayList(selected);
    setActiveModeLabel('🎯 Selected Words');
    initRevision();
  };

  const initRevision = () => {
    setRevisionIndex(0);
    setCurrentView('revision');
  };

  // Auto-play word when moving to a next one (in dictation mode)
  useEffect(() => {
    if (currentView === 'dictation' && !feedback && activePlayList.length > 0) {
      const timer = setTimeout(() => {
        speakWord();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentView, feedback, activePlayList]);

  // Auto-play word during card revision
  useEffect(() => {
    if (currentView === 'revision' && revisionViewMode === 'card' && activePlayList.length > 0) {
      const timer = setTimeout(() => {
        speakWord();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [revisionIndex, currentView, revisionViewMode]);

  const checkSpelling = (e) => {
    e.preventDefault();
    if (!userInput.trim() || feedback) return;

    const currentWord = activePlayList[currentIndex].word.toLowerCase().trim();
    const studentWord = userInput.trim().toLowerCase();

    setHasAttempted(true);

    if (studentWord === currentWord) {
      setFeedback('correct');
      setScore(prev => prev + 1);
      const utter = new SpeechSynthesisUtterance("Splendid!");
      utter.rate = 1.2;
      window.speechSynthesis.speak(utter);
    } else {
      setFeedback('incorrect');
    }
  };

  const nextWord = () => {
    if (currentIndex < activePlayList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setFeedback(null);
      setHasAttempted(false);
    } else {
      setCurrentView('results');
    }
  };

  // --- DATABASE ACCUMULATION HELPER ---
  const accumulateWords = (newWordsArray) => {
    setAccumulationList(prevAcc => {
      const updated = [...prevAcc];
      newWordsArray.forEach(newW => {
        const cleanWord = newW.word.toLowerCase().trim();
        const exists = updated.some(acc => acc.word.toLowerCase().trim() === cleanWord);
        if (!exists && cleanWord.length > 0) {
          updated.push({
            id: Date.now() + Math.random(),
            word: cleanWord
          });
        }
      });
      return updated;
    });
  };

  // --- TEACHER SETTINGS LOGIC ---
  const [newManualWord, setNewManualWord] = useState('');
  const [targetListType, setTargetListType] = useState('accumulation'); // 'accumulation' or 'onetime'
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractWordsWithGemini = async (base64String, mimeType) => {
    const apiKey = "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const base64Data = base64String.split(',')[1];

    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: "You are an educational assistant. Extract a clean list of up to 15 spelling and vocabulary words from the provided document or image. Return ONLY a JSON array of strings. Example: [\"elephant\", \"library\", \"sunny\"]. Do not include markdown tags, code block wraps, or any other explanations." },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      }],
      generationConfig: { responseMimeType: "application/json" }
    };

    const fetchWithRetry = async (attempt = 0) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(`AI API error: ${response.status}`);
        
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No text in AI response");
        
        return JSON.parse(text);
      } catch (error) {
        if (attempt < 5) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
          return fetchWithRetry(attempt + 1);
        }
        throw error;
      }
    };

    return fetchWithRetry();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractionError('');

    try {
      const base64Data = await readFileAsBase64(file);
      let mimeToUse = file.type || 'application/octet-stream';

      const extractedWords = await extractWordsWithGemini(base64Data, mimeToUse);

      if (extractedWords && Array.isArray(extractedWords) && extractedWords.length > 0) {
        const cleanExtracted = extractedWords.map((w, idx) => ({ 
          id: Date.now() + idx + Math.random(), 
          word: typeof w === 'string' ? w.trim().toLowerCase() : String(w).trim().toLowerCase() 
        })).filter(w => w.word.length > 0);
        
        if (targetListType === 'onetime') {
          setOneTimeList(cleanExtracted);
          accumulateWords(cleanExtracted);
        } else {
          accumulateWords(cleanExtracted);
        }
      } else {
        setExtractionError("No vocabulary words found in this file. Please try another file.");
      }
    } catch (e) {
      console.error(e);
      setExtractionError("Could not extract words automatically. Try uploading an image/PDF, or write words manually.");
    } finally {
      setIsExtracting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!newManualWord.trim()) return;

    const newWordObj = {
      id: Date.now(),
      word: newManualWord.trim().toLowerCase()
    };

    if (targetListType === 'onetime') {
      setOneTimeList(prev => [...prev, newWordObj]);
      accumulateWords([newWordObj]);
    } else {
      accumulateWords([newWordObj]);
    }
    setNewManualWord('');
  };

  const removeWordFromList = (id, listType) => {
    if (listType === 'onetime') {
      setOneTimeList(oneTimeList.filter(w => w.id !== id));
    } else {
      setAccumulationList(accumulationList.filter(w => w.id !== id));
      setSelectedWordIds(selectedWordIds.filter(selectedId => selectedId !== id));
    }
  };

  const toggleSelectWord = (id) => {
    if (selectedWordIds.includes(id)) {
      setSelectedWordIds(selectedWordIds.filter(item => item !== id));
    } else {
      setSelectedWordIds([...selectedWordIds, id]);
    }
  };

  const selectAllAccumulated = () => {
    setSelectedWordIds(accumulationList.map(w => w.id));
  };

  const deselectAllAccumulated = () => {
    setSelectedWordIds([]);
  };


  // --- REVISION UTILITIES (Syllable Parser & Colorizer) ---

  const getSyllables = (word) => {
    // Dictionary of precise syllable splits for common primary words
    const dict = {
      apple: ['ap', 'ple'],
      beautiful: ['beau', 'ti', 'ful'],
      friend: ['friend'],
      school: ['school'],
      teacher: ['teach', 'er'],
      elephant: ['el', 'e', 'phant'],
      adventure: ['ad', 'ven', 'ture'],
      tomorrow: ['to', 'mor', 'row'],
      alligator: ['al', 'li', 'ga', 'tor'],
      dinosaur: ['di', 'no', 'saur'],
      mountain: ['moun', 'tain'],
      computer: ['com', 'pu', 'ter'],
      spelling: ['spel', 'ling'],
      vocabulary: ['vo', 'cab', 'u', 'lar', 'y'],
      reading: ['read', 'ing'],
      writing: ['writ', 'ing']
    };

    const w = word.toLowerCase().trim();
    if (dict[w]) return dict[w];

    // Simple heuristic-based division fallback
    const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*(?=$|[^aeiouy][aeiouy]))?/gi;
    const matches = w.match(syllableRegex);
    return matches || [w];
  };

  const colorizeWord = (word, sizeClass) => {
    // Process syllable separator first if active
    let formattedText = word;
    if (showSyllables) {
      formattedText = getSyllables(word).join('/');
    }

    const digraphs = ['ay', 'ey', 'oy', 'aw', 'ew', 'ow'];
    const singleVowels = ['a', 'e', 'i', 'o', 'u'];
    const elements = [];
    let i = 0;

    while (i < formattedText.length) {
      const twoChars = formattedText.substring(i, i + 2).toLowerCase();
      const oneChar = formattedText[i].toLowerCase();

      if (digraphs.includes(twoChars)) {
        elements.push(
          <span 
            key={i} 
            className="text-pink-500 font-black underline decoration-pink-300 decoration-wavy px-0.5" 
            title="Vowel Team"
          >
            {formattedText.substring(i, i + 2)}
          </span>
        );
        i += 2;
      } else if (singleVowels.includes(oneChar)) {
        elements.push(
          <span 
            key={i} 
            className="text-blue-500 font-extrabold px-0.5" 
            title="Single Vowel"
          >
            {formattedText[i]}
          </span>
        );
        i += 1;
      } else {
        if (formattedText[i] === '/') {
          elements.push(
            <span 
              key={i} 
              className="text-purple-400 font-light mx-1 select-none text-opacity-80 scale-110 inline-block"
            >
              /
            </span>
          );
        } else {
          elements.push(
            <span key={i} className="text-slate-700">
              {formattedText[i]}
            </span>
          );
        }
        i += 1;
      }
    }

    return (
      <span className={`${sizeClass} tracking-wide font-sans select-none break-all`}>
        {elements}
      </span>
    );
  };


  // --- RENDERING VIEWS ---

  // MAIN MENU
  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in w-full max-w-4xl">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-wide shadow-sm">
          <Sparkles className="w-4 h-4 fill-current animate-pulse text-yellow-600" /> Super Vocab Trainer
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-blue-600 drop-shadow-sm tracking-tight">Spell & Play!</h1>
        <p className="text-xl text-gray-600 font-medium">Choose your spelling practice challenge below.</p>
      </div>

      {/* Main Mode Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6">
        
        {/* ONE-TIME UPLOAD MODE */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-purple-100 shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
          <div className="space-y-4">
            <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl">⚡</div>
            <h3 className="text-2xl font-black text-gray-800">One-Time Test</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Upload a sheet or image of list words. Practice them instantly! Words automatically join your database.
            </p>
            {oneTimeList.length > 0 ? (
              <div className="inline-block bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-md">
                {oneTimeList.length} words loaded
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic">No one-time words loaded yet</div>
            )}
          </div>
          <div className="mt-8 pt-4 space-y-3">
            <button 
              onClick={startOneTimeDictation}
              disabled={oneTimeList.length === 0}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-3 px-6 rounded-2xl shadow-[0_5px_0_0_#7e22ce] hover:shadow-[0_2px_0_0_#7e22ce] hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              Practice Words
            </button>
            <button 
              onClick={startOneTimeRevision}
              disabled={oneTimeList.length === 0}
              className="w-full bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed text-purple-800 text-base font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Study & Vowels
            </button>
            <button 
              onClick={() => { setTargetListType('onetime'); setCurrentView('settings'); }}
              className="w-full text-center text-purple-600 hover:text-purple-700 font-bold text-sm pt-1"
            >
              {oneTimeList.length > 0 ? 'Change File / Edit Words' : 'Upload File to Start'}
            </button>
          </div>
        </div>

        {/* ACCUMULATION MODE - RANDOM */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-blue-100 shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
          <div className="space-y-4">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl">
              <Shuffle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">Random Mix</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Let the computer pick a random mix of spelling words from your accumulated spelling vault!
            </p>
            <div className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-md">
              Total vault: {accumulationList.length} words
            </div>
          </div>
          <div className="mt-8 pt-4 space-y-3">
            <button 
              onClick={() => {
                if (accumulationList.length > 0) {
                  setCurrentView('setup-random');
                }
              }}
              disabled={accumulationList.length === 0}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-3.5 px-6 rounded-2xl shadow-[0_5px_0_0_#1d4ed8] hover:shadow-[0_2px_0_0_#1d4ed8] hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Shuffle className="w-5 h-5" />
              Configure & Play
            </button>
          </div>
        </div>

        {/* ACCUMULATION MODE - CUSTOM SELECT */}
        <div className="bg-white p-6 rounded-[2rem] border-4 border-yellow-100 shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
          <div className="space-y-4">
            <div className="bg-yellow-100 text-yellow-600 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">Pick & Play</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Open your vocabulary database and tick specific words you want to revise today. Great for targeting tricky words!
            </p>
            <div className="inline-block bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1 rounded-md">
              Custom selection practice
            </div>
          </div>
          <div className="mt-8 pt-4 space-y-3">
            <button 
              onClick={() => {
                if (accumulationList.length > 0) {
                  setCurrentView('setup-select');
                }
              }}
              disabled={accumulationList.length === 0}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-900 text-lg font-bold py-3.5 px-6 rounded-2xl shadow-[0_5px_0_0_#ca8a04] hover:shadow-[0_2px_0_0_#ca8a04] hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <CheckSquare className="w-5 h-5" />
              Pick Words
            </button>
          </div>
        </div>

      </div>

      {/* Teacher Dashboard access */}
      <div className="flex gap-4 mt-8">
        <button 
          onClick={() => {
            setTargetListType('accumulation');
            setCurrentView('settings');
          }}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2 font-bold transition-colors bg-white hover:bg-gray-50 py-3.5 px-8 rounded-full shadow-sm border border-gray-200"
        >
          <Settings className="w-5 h-5" />
          Manage spelling databases
        </button>
      </div>
    </div>
  );

  // SETUP: RANDOM COUNT SELECTION SCREEN
  const renderSetupRandom = () => (
    <div className="max-w-md mx-auto w-full bg-white rounded-[2rem] p-8 shadow-xl border-4 border-blue-100 animate-fade-in text-center space-y-6">
      <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
        <Shuffle className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-gray-800">Random Mix Size</h2>
        <p className="text-gray-500">How many words would you like to practice from your accumulated vault?</p>
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
        {[5, 10, 15, 20].map((num) => (
          <button
            key={num}
            onClick={() => setRandomCount(num)}
            className={`w-14 h-14 rounded-2xl font-black text-xl flex items-center justify-center transition-all ${
              randomCount === num 
                ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="pt-4 space-y-3">
        <div className="flex gap-4">
          <button
            onClick={startRandomRevision}
            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-lg font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Study First
          </button>
          <button
            onClick={startRandomDictation}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-lg font-bold py-4 px-6 rounded-2xl shadow-[0_5px_0_0_#1d4ed8] hover:shadow-[0_2px_0_0_#1d4ed8] hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Test
          </button>
        </div>
        <button
          onClick={() => setCurrentView('menu')}
          className="w-full text-gray-500 hover:text-gray-700 font-bold text-sm block pt-3"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  // SETUP: CUSTOM SELECT CHECKBOXES SCREEN
  const renderSetupSelect = () => (
    <div className="max-w-2xl mx-auto w-full bg-white rounded-[2rem] shadow-xl overflow-hidden animate-fade-in border-4 border-yellow-100">
      <div className="bg-yellow-400 p-8 text-yellow-950 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-2">
            <CheckSquare className="w-8 h-8" /> Pick Your Spelling Words
          </h2>
          <p className="text-yellow-850 font-medium mt-1">Select the words you'd like to include in this dictation</p>
        </div>
        <button 
          onClick={() => setCurrentView('menu')}
          className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 p-3 rounded-full transition-colors"
        >
          <Home className="w-6 h-6" />
        </button>
      </div>

      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="flex gap-2">
            <button 
              onClick={selectAllAccumulated}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg"
            >
              Select All
            </button>
            <button 
              onClick={deselectAllAccumulated}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg"
            >
              Deselect All
            </button>
          </div>
          <span className="text-sm font-bold text-gray-500">
            {selectedWordIds.length} word(s) selected
          </span>
        </div>

        {/* Word Grid / List */}
        <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accumulationList.map((item) => {
              const isSelected = selectedWordIds.includes(item.id);
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleSelectWord(item.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    isSelected 
                      ? 'border-yellow-400 bg-yellow-50/50 text-yellow-950 font-bold' 
                      : 'border-gray-100 hover:border-gray-200 text-gray-700'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => {}} // handled by div click
                    className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400 cursor-pointer"
                  />
                  <span className="text-lg">{item.word}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-150 flex flex-col sm:flex-row gap-4">
          <button
            onClick={startSelectedRevision}
            disabled={selectedWordIds.length === 0}
            className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 text-lg font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Study ({selectedWordIds.length})
          </button>
          <button
            onClick={startSelectedDictation}
            disabled={selectedWordIds.length === 0}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-950 text-lg font-bold py-4 px-6 rounded-2xl shadow-[0_5px_0_0_#ca8a04] hover:shadow-[0_2px_0_0_#ca8a04] hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Dictation
          </button>
        </div>
      </div>
    </div>
  );

  // NEW VIEW: REVISION / FLASHCARD STUDY MODE
  const renderRevision = () => {
    const activeWordObj = activePlayList[revisionIndex];
    
    // Configurable Font sizes
    const fontSizesMap = {
      'text-4xl': 'text-4xl',
      'text-5xl': 'text-5xl',
      'text-6xl': 'text-6xl',
      'text-7xl': 'text-7xl md:text-8xl'
    };

    return (
      <div className="max-w-3xl mx-auto w-full flex flex-col items-center animate-fade-in space-y-6">
        
        {/* Header toolbar */}
        <div className="w-full flex justify-between items-center bg-white py-4 px-6 rounded-3xl shadow-sm border border-gray-100">
          <button 
            onClick={() => {
              window.speechSynthesis.cancel();
              setCurrentView('menu');
            }}
            className="text-gray-400 hover:text-gray-600 p-2 flex items-center gap-1 font-semibold"
            title="Menu"
          >
            <Home className="w-7 h-7" />
          </button>

          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            📖 revision mode
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setRevisionViewMode(prev => prev === 'card' ? 'grid' : 'card')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-xl transition-all"
              title={revisionViewMode === 'card' ? 'Show All Words' : 'Show Single Flashcard'}
            >
              {revisionViewMode === 'card' ? <Grid className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Display Control panel */}
        <div className="w-full bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Vowel & Syllable configuration switches */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-gray-400 text-sm font-bold uppercase tracking-wide">Options:</span>
            <button
              onClick={() => setShowSyllables(!showSyllables)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                showSyllables 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Syllables ( / )
              <span className="text-xs opacity-80">{showSyllables ? "ON" : "OFF"}</span>
            </button>
          </div>

          {/* Font Size adjustable block */}
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 text-sm font-bold uppercase tracking-wide">Font Size:</span>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {[
                { label: 'S', size: 'text-4xl' },
                { label: 'M', size: 'text-5xl' },
                { label: 'L', size: 'text-6xl' },
                { label: 'XL', size: 'text-7xl' }
              ].map((item) => (
                <button
                  key={item.size}
                  onClick={() => setFontSize(item.size)}
                  className={`w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                    fontSize === item.size 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="w-full bg-gradient-to-r from-blue-50 to-pink-50 rounded-2xl p-4 flex flex-wrap justify-center items-center gap-6 border border-blue-100 text-sm font-semibold text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 inline-block"></span>
            <span>Blue = Vowels</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-pink-500 inline-block"></span>
            <span>Pink = Vowel Teams <span className="text-xs text-pink-500 font-mono">(ay, ey, oy, aw, ew, ow)</span></span>
          </div>
          {showSyllables && (
            <div className="flex items-center gap-1.5">
              <span className="text-purple-400 font-black">/</span>
              <span>Slash = Syllables</span>
            </div>
          )}
        </div>

        {/* View Layout 1: Flashcard Spotlight Mode */}
        {revisionViewMode === 'card' && activeWordObj && (
          <div className="w-full bg-white rounded-[2rem] p-10 md:p-16 shadow-xl flex flex-col items-center space-y-10 border-4 border-purple-50">
            
            {/* Pronounce trigger */}
            <button 
              onClick={() => speakWord()}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                isSpeaking 
                  ? 'bg-purple-100 scale-105' 
                  : 'bg-purple-500 hover:bg-purple-600 hover:scale-105'
              }`}
            >
              <Volume2 className={`w-10 h-10 ${isSpeaking ? 'text-purple-600 animate-pulse' : 'text-white'}`} />
            </button>

            {/* Main spotlight word block */}
            <div className="min-h-[12rem] flex items-center justify-center w-full text-center">
              {colorizeWord(activeWordObj.word, fontSizesMap[fontSize])}
            </div>

            {/* Slider navigation controls */}
            <div className="w-full flex justify-between items-center max-w-sm pt-4 border-t border-gray-100">
              <button
                onClick={() => setRevisionIndex(prev => Math.max(0, prev - 1))}
                disabled={revisionIndex === 0}
                className="bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 text-gray-700 p-4 rounded-2xl font-bold transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-6 h-6" /> Back
              </button>

              <span className="text-gray-500 font-bold text-lg">
                {revisionIndex + 1} / {activePlayList.length}
              </span>

              <button
                onClick={() => setRevisionIndex(prev => Math.min(activePlayList.length - 1, prev + 1))}
                disabled={revisionIndex === activePlayList.length - 1}
                className="bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 text-gray-700 p-4 rounded-2xl font-bold transition-all flex items-center gap-1"
              >
                Next <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* View Layout 2: Scrollable All Words Overview */}
        {revisionViewMode === 'grid' && (
          <div className="w-full bg-white rounded-[2rem] p-8 shadow-xl border-4 border-purple-50 max-h-[55vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activePlayList.map((item, index) => (
                <div 
                  key={item.id}
                  className="bg-slate-50 border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 rounded-2xl p-5 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-gray-400 font-mono text-xs">{index + 1}.</span>
                    <div className="truncate">
                      {colorizeWord(item.word, 'text-2xl md:text-3xl')}
                    </div>
                  </div>
                  <button
                    onClick={() => speakWord(item.word)}
                    className="bg-white hover:bg-purple-50 text-purple-600 p-2.5 rounded-xl border border-purple-100 shadow-sm transition-all shrink-0 ml-3"
                    title="Speak word"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revision exit / Go to dictation test */}
        <div className="w-full flex gap-4 pt-4">
          <button 
            onClick={() => setCurrentView('menu')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 px-6 rounded-2xl transition-all"
          >
            Go Back
          </button>
          <button 
            onClick={() => initGame(activePlayList)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_5px_0_0_#16a34a] hover:shadow-[0_2px_0_0_#16a34a] hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" /> Start Dictation Now!
          </button>
        </div>

      </div>
    );
  };

  // GAME: DICTATION PLAY SCREEN
  const renderDictation = () => {
    const isCorrect = feedback === 'correct';
    const isIncorrect = feedback === 'incorrect';

    return (
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center animate-fade-in">
        {/* Header / Progress */}
        <div className="w-full flex justify-between items-center mb-6 bg-white py-4 px-6 rounded-3xl shadow-sm border border-gray-150">
          <button 
            onClick={() => {
              window.speechSynthesis.cancel();
              setCurrentView('menu');
            }}
            className="text-gray-400 hover:text-gray-600 p-2"
            title="Back to Menu"
          >
            <Home className="w-8 h-8" />
          </button>
          
          <div className="text-center">
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider block mb-1">
              {activeModeLabel}
            </span>
            <div className="text-lg font-bold text-gray-500">
              Word <span className="text-blue-600 text-2xl">{currentIndex + 1}</span> of {activePlayList.length}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-yellow-500 font-bold text-2xl">
            <Star className="w-8 h-8 fill-current" />
            {score}
          </div>
        </div>

        {ttsError && (
          <div className="w-full bg-red-100 text-red-700 p-4 rounded-2xl mb-6 font-medium text-center">
            {ttsError}
          </div>
        )}

        {/* Main Play Area */}
        <div className="w-full bg-white rounded-[2rem] p-8 md:p-12 shadow-xl flex flex-col items-center space-y-8 border-4 border-blue-50">
          
          {/* Big Listen Button */}
          <button 
            onClick={() => speakWord()}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isSpeaking 
                ? 'bg-blue-100 scale-110 shadow-blue-200/50' 
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-blue-500/30'
            }`}
          >
            <Volume2 className={`w-16 h-16 ${isSpeaking ? 'text-blue-500 animate-pulse' : 'text-white'}`} />
          </button>
          <p className="text-gray-400 font-medium tracking-wide uppercase text-sm">Click to hear again</p>

          {/* Input Area */}
          <form onSubmit={checkSpelling} className="w-full max-w-sm space-y-6">
            <div className="relative">
              <input 
                ref={inputRef}
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={feedback !== null}
                placeholder="Type the word here..."
                className={`w-full text-center text-4xl font-bold p-6 rounded-2xl border-4 outline-none transition-all ${
                  feedback === null 
                    ? 'border-gray-200 focus:border-blue-400 text-gray-800' 
                    : isCorrect 
                      ? 'border-green-400 bg-green-50 text-green-700' 
                      : 'border-red-400 bg-red-50 text-red-700'
                }`}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {isCorrect && <CheckCircle2 className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 text-green-500" />}
              {isIncorrect && <XCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 text-red-500" />}
            </div>

            {/* Feedback & Actions */}
            <div className="h-24 flex items-center justify-center w-full">
              {!feedback ? (
                <button 
                  type="submit"
                  disabled={!userInput.trim()}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-4 px-8 rounded-2xl shadow-[0_6px_0_0_#16a34a] hover:shadow-[0_2px_0_0_#16a34a] hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check spelling!
                </button>
              ) : (
                <div className="w-full flex flex-col items-center animate-fade-in gap-4">
                  {isIncorrect && (
                    <div className="text-xl font-bold text-gray-600 bg-gray-100 py-3 px-8 rounded-2xl w-full text-center">
                      Correct spelling: <span className="text-blue-600 select-all font-mono">{activePlayList[currentIndex].word}</span>
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={nextWord}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-4 px-8 rounded-2xl shadow-[0_6px_0_0_#2563eb] hover:shadow-[0_2px_0_0_#2563eb] hover:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    {currentIndex < activePlayList.length - 1 ? 'Next Word' : 'See Results'}
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </form>

        </div>
      </div>
    );
  };

  // RESULTS: GAME SCORE VIEW
  const renderResults = () => {
    const percentage = Math.round((score / activePlayList.length) * 100);
    let message = "Good Job!";
    let emoji = "🎉";
    
    if (percentage === 100) {
      message = "Perfect Score!";
      emoji = "🏆";
    } else if (percentage < 50) {
      message = "Keep Practicing!";
      emoji = "💪";
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in bg-white p-12 rounded-[3rem] shadow-xl max-w-lg w-full text-center border-4 border-yellow-100">
        <div className="text-8xl">{emoji}</div>
        
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-gray-800">{message}</h2>
          <p className="text-2xl text-gray-500 font-medium">
            You got <span className="text-blue-600 font-bold">{score}</span> out of <span className="text-gray-800 font-bold">{activePlayList.length}</span> right!
          </p>
        </div>

        <div className="w-full bg-gray-100 h-6 rounded-full overflow-hidden mt-6">
          <div 
            className="h-full bg-green-500 transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="pt-8 flex flex-col sm:flex-row gap-4 w-full">
          <button 
            onClick={() => initGame(activePlayList)}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xl font-bold py-5 px-6 rounded-2xl shadow-[0_6px_0_0_#ca8a04] hover:shadow-[0_2px_0_0_#ca8a04] hover:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-6 h-6" />
            Try Again
          </button>
          <button 
            onClick={() => setCurrentView('menu')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xl font-bold py-5 px-6 rounded-2xl shadow-[0_6px_0_0_#9ca3af] hover:shadow-[0_2px_0_0_#9ca3af] hover:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-6 h-6" />
            Menu
          </button>
        </div>
      </div>
    );
  };

  // DASHBOARD / MANAGE DATABASES VIEW
  const renderSettings = () => {
    const isOneTimeTab = targetListType === 'onetime';

    return (
      <div className="max-w-3xl mx-auto w-full bg-white rounded-[2rem] shadow-xl overflow-hidden animate-fade-in border-4 border-gray-150">
        <div className="bg-gray-800 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black">Spelling Word Center</h2>
            <p className="text-gray-400 mt-2">Manage temporary dictation files or the permanent database</p>
          </div>
          <button 
            onClick={() => setCurrentView('menu')}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors"
            title="Back to Menu"
          >
            <Home className="w-6 h-6" />
          </button>
        </div>

        {/* List type selection tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTargetListType('onetime')}
            className={`flex-1 py-4 text-center font-bold text-lg border-b-4 transition-all ${
              isOneTimeTab 
                ? 'border-purple-500 text-purple-600 bg-purple-50/20' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            ⚡ One-Time List ({oneTimeList.length})
          </button>
          <button
            onClick={() => setTargetListType('accumulation')}
            className={`flex-1 py-4 text-center font-bold text-lg border-b-4 transition-all ${
              !isOneTimeTab 
                ? 'border-blue-500 text-blue-600 bg-blue-50/20' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            📚 Accumulation Database ({accumulationList.length})
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* AI Extraction Card */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-slate-600" /> 
              Upload PDF, Word, TXT, or Image List
            </h3>
            <p className="text-slate-500 text-sm">
              {isOneTimeTab 
                ? "Upload lists for immediate practice. These words will ALSO automatically back up to your accumulation database!" 
                : "Import lists straight into your long-term database."
              }
            </p>

            <div className="relative group border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition-all p-6 text-center cursor-pointer">
              <input 
                type="file" 
                accept=".pdf, image/*, .doc, .docx, .txt" 
                onChange={handleFileUpload}
                disabled={isExtracting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              {isExtracting ? (
                <div className="flex items-center justify-center gap-3 py-2 text-slate-700 font-bold">
                  <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
                  Extracting words with AI...
                </div>
              ) : (
                <span className="text-slate-600 font-bold">Click or drop a file to upload</span>
              )}
            </div>

            {extractionError && (
              <p className="text-red-500 font-bold text-sm bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {extractionError}
              </p>
            )}
          </div>

          {/* Quick Manual Entry */}
          <form onSubmit={handleManualAdd} className="flex gap-4">
            <input 
              type="text" 
              value={newManualWord}
              onChange={(e) => setNewManualWord(e.target.value)}
              placeholder={`Add manual word to ${isOneTimeTab ? 'One-Time List' : 'Accumulation'}...`}
              className="flex-1 text-base p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 animate-none"
            />
            <button 
              type="submit"
              disabled={!newManualWord.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </form>

          {/* Word List Display */}
          <div className="bg-gray-50 rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wide">
                {isOneTimeTab ? 'One-Time Practice Session Word List' : 'Your Cumulative Spelling Vault'}
              </h3>
              {isOneTimeTab && oneTimeList.length > 0 && (
                <button
                  onClick={() => setOneTimeList([])}
                  className="text-red-500 hover:text-red-600 text-sm font-bold"
                >
                  Clear Session List
                </button>
              )}
            </div>
            
            {(isOneTimeTab ? oneTimeList : accumulationList).length === 0 ? (
              <p className="text-gray-400 p-4 text-center italic bg-white rounded-xl border border-gray-150">
                This list is empty. Try typing or uploading a file above!
              </p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                {(isOneTimeTab ? oneTimeList : accumulationList).map((item, index) => (
                  <li key={item.id} className="flex justify-between items-center bg-white p-3.5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-bold text-sm w-5">{index + 1}.</span>
                      <span className="text-xl font-bold text-gray-800">{item.word}</span>
                    </div>
                    <button 
                      onClick={() => removeWordFromList(item.id, targetListType)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Remove word"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action Trigger in Teacher View */}
          {isOneTimeTab && oneTimeList.length > 0 && (
            <div className="pt-4 flex justify-end gap-3">
              <button
                onClick={startOneTimeRevision}
                className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-base font-bold py-3.5 px-6 rounded-2xl flex items-center gap-2 transition-all"
              >
                <BookOpen className="w-5 h-5" /> Study List
              </button>
              <button
                onClick={startOneTimeDictation}
                className="bg-purple-500 hover:bg-purple-600 text-white text-lg font-bold py-3.5 px-8 rounded-2xl shadow-[0_5px_0_0_#7e22ce] hover:shadow-[0_2px_0_0_#7e22ce] hover:translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> Play this One-Time List!
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MAIN LAYOUT ---
  return (
    <div className="min-h-screen bg-blue-50 font-sans selection:bg-blue-200 selection:text-blue-900 flex items-center justify-center p-4 sm:p-8">
      
      {/* Global CSS for custom animations/scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />

      <main className="w-full max-w-4xl flex justify-center items-center">
        {currentView === 'menu' && renderMenu()}
        {currentView === 'setup-random' && renderSetupRandom()}
        {currentView === 'setup-select' && renderSetupSelect()}
        {currentView === 'dictation' && renderDictation()}
        {currentView === 'results' && renderResults()}
        {currentView === 'settings' && renderSettings()}
        {currentView === 'revision' && renderRevision()}
      </main>

    </div>
  );
}