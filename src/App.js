import React, { useState, useEffect, useRef } from 'react';
import { Play, Rocket, Terminal, Trophy, AlertTriangle, Flame, Star, Crown, FileText, PlusCircle, ArrowLeft, Settings, Printer } from 'lucide-react';

// --- AUDIO EFFECTS ---
const playTone = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.15; // Volume (niet te hard)

    if (type === 'success') {
      // Vrolijk ping-ping geluid (Duolingo stijl)
      const playNote = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; // Heldere toon
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(masterGain);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(1, startTime + 0.02); // Snelle 'attack'
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Langzame 'decay'
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      playNote(783.99, ctx.currentTime, 0.2); // G5 (Eerste ping)
      playNote(1046.50, ctx.currentTime + 0.15, 0.5); // C6 (Tweede ping, iets hoger)
    } else if (type === 'error') {
      // Foutmelding geluidje (doffe 'bonk')
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle'; // Doffere toon
      
      // Pitch gaat omlaag
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      // Kort geluidje
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.log("Audio API niet ondersteund door deze browser", e);
  }
};

// De uitgebreide database met voorgemaakte missies
const PREMADE_MISSIONS = {
  'fr-FR': [
    {
      title: "Le Petit Chat",
      length: "short",
      story: [
        "Le petit chat boit du lait.",
        "Il dort sur le canapé doux.",
        "Il aime jouer avec une balle."
      ]
    },
    {
      title: "Le Beau Jardin",
      length: "short",
      story: [
        "Le soleil brille fort aujourd'hui.",
        "Les oiseaux chantent dans les arbres.",
        "Les enfants jouent dans le parc."
      ]
    },
    {
      title: "Mon Ami Paul",
      length: "short",
      story: [
        "Paul a un nouveau vélo.",
        "Il est bleu et très rapide.",
        "Il fait la course avec ses amis."
      ]
    },
    {
      title: "Le Café de Paris",
      length: "medium",
      story: [
        "Marie entre dans le petit café.",
        "Elle s'assoit près de la fenêtre.",
        "Le serveur arrive avec la carte.",
        "Elle commande un café noir et un croissant.",
        "Il fait très beau dehors aujourd'hui.",
        "La journée commence vraiment bien."
      ]
    },
    {
      title: "La Visite au Musée",
      length: "medium",
      story: [
        "Aujourd'hui, nous allons au musée d'art.",
        "Il y a beaucoup de tableaux célèbres.",
        "Le guide explique l'histoire de chaque œuvre.",
        "J'aime beaucoup les couleurs vives.",
        "Nous achetons des cartes postales à la fin.",
        "C'est une visite très intéressante."
      ]
    },
    {
      title: "Une Journée à la Plage",
      length: "medium",
      story: [
        "Nous passons la journée à la plage.",
        "L'eau de la mer est très claire.",
        "Je construis un grand château de sable.",
        "Mon frère nage dans les vagues.",
        "Nous mangeons une glace au chocolat.",
        "C'est les meilleures vacances d'été."
      ]
    },
    {
      title: "L'Aventure Numérique",
      length: "long",
      story: [
        "Aujourd'hui, Lucas allume son ordinateur portable.",
        "Il veut envoyer un message important à son amie Lucie.",
        "Soudain, l'écran devient noir.",
        "Une musique étrange commence à jouer.",
        "C'est un défi !",
        "Lucas doit résoudre une énigme pour débloquer son accès.",
        "Il tape vite sur le clavier.",
        "Heureusement, il connaît la réponse.",
        "La technologie est parfois surprenante, n'est-ce pas ?"
      ]
    },
    {
      title: "Le Mystère du Château",
      length: "long",
      story: [
        "Pendant les vacances, Sophie visite un vieux château.",
        "Les murs sont faits de grosses pierres grises.",
        "Le guide raconte des histoires de rois et de reines.",
        "Soudain, Sophie remarque une petite porte cachée.",
        "Elle pousse la porte doucement et entre dans une pièce sombre.",
        "Il y a un vieux coffre au milieu de la salle.",
        "Le cœur de Sophie bat très fort.",
        "Qu'est-ce qui se cache à l'intérieur ?",
        "C'est le début d'une grande aventure."
      ]
    },
    {
      title: "Le Voyage en Train",
      length: "long",
      story: [
        "Marc prend le train pour aller chez sa grand-mère.",
        "Il regarde par la fenêtre avec curiosité.",
        "Le paysage défile très vite devant ses yeux.",
        "Il voit des vaches, des arbres et des petits villages.",
        "Le contrôleur passe pour vérifier les billets.",
        "Marc lui montre son billet avec un grand sourire.",
        "Le voyage dure presque trois heures.",
        "Enfin, le train arrive à la gare.",
        "Sa grand-mère l'attend sur le quai avec un gâteau."
      ]
    }
  ],
  'nl-NL': [
    {
      title: "De Hond Max",
      length: "short",
      story: [
        "Max is een grote bruine hond.",
        "Hij rent heel snel in het park.",
        "Ik gooi een bal en hij vangt hem."
      ]
    },
    {
      title: "De Rode Auto",
      length: "short",
      story: [
        "De auto is heel mooi en rood.",
        "Hij rijdt ontzettend snel op de weg.",
        "We gaan samen naar de grote winkel."
      ]
    },
    {
      title: "Een Mooie Boom",
      length: "short",
      story: [
        "In de tuin staat een grote boom.",
        "In de lente groeien er groene blaadjes.",
        "In de herfst vallen ze op de grond."
      ]
    },
    {
      title: "De Nieuwe Fiets",
      length: "medium",
      story: [
        "Tim heeft een nieuwe fiets gekregen.",
        "Hij is knalrood met zwarte banden.",
        "Hij fietst er snel mee naar school.",
        "Zijn vrienden vinden de fiets heel mooi.",
        "Na school fietst hij door het park.",
        "Hij is er erg blij mee."
      ]
    },
    {
      title: "Spelen in de Tuin",
      length: "medium",
      story: [
        "Het is weekend en de zon schijnt.",
        "Lisa en Tom spelen in de tuin.",
        "Ze bouwen een grote tent met dekens.",
        "Binnen in de tent vertellen ze geheimen.",
        "Mama brengt limonade en lekkere koekjes.",
        "Het is een perfecte zaterdagmiddag."
      ]
    },
    {
      title: "Boodschappen Doen",
      length: "medium",
      story: [
        "Papa en ik gaan samen boodschappen doen.",
        "We pakken een grote winkelkar bij de ingang.",
        "Eerst zoeken we vers fruit en groenten.",
        "Daarna halen we vers brood bij de bakkerij.",
        "We wachten geduldig in de rij voor de kassa.",
        "Thuis ruimen we alles netjes op in de kast."
      ]
    },
    {
      title: "Het Pannenkoekenhuis",
      length: "long",
      story: [
        "Op zondag eten we altijd pannenkoeken.",
        "We gaan naar ons favoriete restaurant.",
        "Ik kies er een met kaas en spek.",
        "Mijn zusje wil liever stroop en suiker.",
        "De kok bakt ze in de open keuken.",
        "Het ruikt daar altijd zo heerlijk.",
        "We eten onszelf helemaal vol.",
        "Daarna krijgen we nog een bolletje ijs.",
        "Wat een fantastische dag."
      ]
    },
    {
      title: "Dagje Dierentuin",
      length: "long",
      story: [
        "Vandaag gaat de hele klas naar de dierentuin.",
        "Iedereen heeft een rugzak met lekker eten mee.",
        "We kijken eerst naar de grote grijze olifanten.",
        "Daarna lopen we naar het verblijf van de apen.",
        "De apen slingeren heel grappig door de dikke touwen.",
        "De meester maakt veel foto's van de wilde dieren.",
        "Rond de middag eten we samen onze boterhammen op.",
        "Als laatste bezoeken we de gevaarlijke en brullende leeuwen.",
        "Wat een fantastisch en leerzaam schoolreisje was dit!"
      ]
    },
    {
      title: "Het Spannende Boek",
      length: "long",
      story: [
        "Sanne heeft een heel spannend nieuw boek gekregen.",
        "Ze leest het elke avond voor het slapengaan.",
        "Het verhaal gaat over een magisch eiland in de oceaan.",
        "De hoofdpersoon moet een oude verborgen schat vinden.",
        "Er zijn veel gevaarlijke piraten en wilde dieren.",
        "Sanne kan bijna niet stoppen met het lezen.",
        "Ze wil zo graag weten hoe het avontuur afloopt.",
        "Uiteindelijk wint de held en wordt de schat veilig gevonden.",
        "Daarna valt ze met een grote glimlach in slaap."
      ]
    }
  ],
  'en-US': [
    {
      title: "The Red Ball",
      length: "short",
      story: [
        "The boy has a big red ball.",
        "He throws it high in the air.",
        "The ball bounces on the street."
      ]
    },
    {
      title: "The Little Bird",
      length: "short",
      story: [
        "A little bird sits on the branch.",
        "It sings a very sweet song.",
        "Then it flies up into the sky."
      ]
    },
    {
      title: "A Sunny Day",
      length: "short",
      story: [
        "Today is a very beautiful sunny day.",
        "The clear sky is bright and blue.",
        "We can play outside until it gets dark."
      ]
    },
    {
      title: "The Coffee Shop",
      length: "medium",
      story: [
        "Sarah walks into the local shop.",
        "She orders a strong black coffee.",
        "The barista smiles warmly at her.",
        "She sits at a small wooden table.",
        "She takes a sip of her hot drink.",
        "She is ready to start her day."
      ]
    },
    {
      title: "Walk in the Park",
      length: "medium",
      story: [
        "Emma is walking in the beautiful park.",
        "The trees have colorful leaves in autumn.",
        "She hears the sound of crunching leaves.",
        "A squirrel runs quickly across the path.",
        "Emma sits on a bench to rest.",
        "She takes a picture with her phone."
      ]
    },
    {
      title: "The School Trip",
      length: "medium",
      story: [
        "Our class is going on a school trip.",
        "We ride a big yellow school bus.",
        "We visit the natural history museum.",
        "There are huge dinosaur bones inside the hall.",
        "The teacher gives us a fun quiz to solve.",
        "Everyone learns a lot of new things today."
      ]
    },
    {
      title: "My Wonderful Family",
      length: "long",
      story: [
        "I live in a house near the mountains.",
        "I have two brothers and one sister, and I was born last.",
        "My father teaches mathematics, and my mother is a nurse at a big hospital.",
        "My brothers are very smart and work hard in school.",
        "My sister is a nervous girl, but she is very kind.",
        "My grandmother also lives with us.",
        "She came from Italy when I was two years old.",
        "She has grown old, but she is still very strong.",
        "She cooks the best food!"
      ]
    },
    {
      title: "The Space Adventure",
      length: "long",
      story: [
        "Max loves reading books about space and stars.",
        "He dreams of becoming a famous astronaut one day.",
        "He builds a spaceship out of empty cardboard boxes.",
        "He puts on his helmet and prepares for launch.",
        "The long countdown begins from ten all the way to zero.",
        "He imagines flying past the moon and the red planet Mars.",
        "He sees bright stars out of his small round window.",
        "Suddenly, a strange alien spaceship appears in the distance.",
        "His wild imagination takes him on the greatest adventures."
      ]
    },
    {
      title: "The Mystery House",
      length: "long",
      story: [
        "The old house at the end of the street is empty.",
        "People say it is full of dark and spooky secrets.",
        "One rainy night, three curious friends decide to explore it.",
        "They bring a strong flashlight and walk very carefully.",
        "The wooden floor makes a loud creaking sound under their feet.",
        "A cold wind blows through the broken glass window.",
        "Suddenly, they hear a loud noise coming from upstairs.",
        "They look at each other with wide open scared eyes.",
        "They turn around and run away as fast as possible."
      ]
    }
  ]
};

export default function App() {
  // --- APP STATE (Menu vs Play) ---
  const [mode, setMode] = useState('menu'); // 'menu' of 'play'
  const [activeStory, setActiveStory] = useState(PREMADE_MISSIONS['fr-FR'][0].story);
  const [missionName, setMissionName] = useState(PREMADE_MISSIONS['fr-FR'][0].title);
  const [language, setLanguage] = useState('fr-FR');
  const [defaultLang, setDefaultLang] = useState('fr-FR'); // Trackt de dropdown in het linker menu
  const [missionLengthFilter, setMissionLengthFilter] = useState('all'); // Trackt de lengte filter
  
  // --- CUSTOM MISSION STATE ---
  const [customText, setCustomText] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  // --- GAMEPLAY STATE ---
  const [level, setLevel] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  
  // --- STUDENT REPORT STATE ---
  const [totalErrors, setTotalErrors] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [hasErrorOnCurrentLevel, setHasErrorOnCurrentLevel] = useState(false);
  const [showPrintHint, setShowPrintHint] = useState(false);

  const inputRef = useRef(null);

  const currentSecretText = activeStory[level] || "";

  // Zorg dat de browser op de achtergrond alvast de stemmenlijst ophaalt
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const playAudio = (textOverride = null) => {
    window.speechSynthesis.cancel(); 
    const textToPlay = textOverride || currentSecretText;
    
    if (!textToPlay) return;

    const utterance = new SpeechSynthesisUtterance(textToPlay);
    utterance.lang = language;
    utterance.rate = 0.85; 
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const langPrefix = language.split('-')[0];
      const langVoices = voices.filter(v => v.lang.startsWith(langPrefix));

      if (langVoices.length > 0) {
        const bestVoice = langVoices.find(v => 
          v.name.includes('Google') || 
          v.name.includes('Premium') || 
          v.name.includes('Natural') ||
          v.name.includes('Online')
        ) || langVoices[0];

        utterance.voice = bestVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
    
    setResult(null);
    setIsSubmitted(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const cleanText = (str) => str.replace(/[.,!?]/g, '').trim();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isTransitioning && result?.status !== 'victory') {
      e.preventDefault();
      checkScore();
    }
  };

  const checkScore = () => {
    if (!input.trim() || isTransitioning) return;
    
    setIsSubmitted(true);

    const isPerfect = cleanText(input) === cleanText(currentSecretText);

    if (isPerfect) {
      playTone('success'); // Speel het succes geluidje af
      
      let gainedXp = 0;
      let newStreak = streak;

      if (hasErrorOnCurrentLevel) {
        // Wel juist verbeterd, maar eerder een fout gemaakt -> Geen streak!
        gainedXp = 50; // Alleen basis XP voor het alsnog correct typen
        setXp(xp + gainedXp);
        setIsTransitioning(true);
        
        setResult({
          status: 'legend', 
          message: `GEFIKST! +${gainedXp} XP (Geen streak bonus door eerdere fout)`
        });
      } else {
        // Flawless (in 1 keer goed)
        newStreak = streak + 1;
        gainedXp = 100 + (streak * 50); 
        
        setStreak(newStreak);
        setXp(xp + gainedXp);
        setIsTransitioning(true); 
        
        setResult({
          status: 'legend',
          message: `FLAWLESS! +${gainedXp} XP (Combo x${newStreak} 🔥)`
        });
      }

      setTimeout(() => {
        if (level < activeStory.length - 1) {
          setLevel(l => l + 1);
          setInput('');
          setIsSubmitted(false);
          setIsTransitioning(false);
          setHasErrorOnCurrentLevel(false); // Reset de flag voor de nieuwe zin
          setResult(null);
          playAudio(activeStory[level + 1]);
        } else {
          setResult({
            status: 'victory',
            message: '🏆 MISSIE VOLTOOID! JE BENT EEN LETTERBOSS!'
          });
          setIsTransitioning(false);
        }
      }, 2000);

    } else {
      playTone('error'); // Speel het fout geluidje af
      
      setStreak(0); 
      setTotalErrors(prev => prev + 1); // Verhoog de foutenteller voor het rapport
      setHasErrorOnCurrentLevel(true); // Registreer dat deze zin fout ging
      
      // Strafpunten toevoegen (minpunten)
      const lostXp = 50;
      setXp(prevXp => Math.max(0, prevXp - lostXp)); // Zorg dat de score niet onder de 0 zakt

      setResult({
        status: 'newbie',
        message: `Glitch in je code! ❌ -${lostXp} XP. Fix de errors en druk weer op Enter.`
      });
    }
  };

  const focusInput = () => {
    if (inputRef.current && !isTransitioning && result?.status !== 'victory') {
      inputRef.current.focus();
    }
  };

  const startGame = (storyArray, title, lang) => {
    setActiveStory(storyArray);
    setMissionName(title);
    setLanguage(lang);
    setLevel(0);
    setStreak(0);
    setXp(0);
    setTotalErrors(0); // Reset fouten
    setStudentName(''); // Reset naam
    setHasErrorOnCurrentLevel(false);
    setShowPrintHint(false);
    setInput('');
    setResult(null);
    setIsSubmitted(false);
    setIsTransitioning(false);
    setMode('play');
  };

  const handleCustomStart = () => {
    let formattedText = customText.replace(/([.!?]+)\s+/g, (match, p1, offset, string) => {
      const textBefore = string.slice(0, offset);
      const wordsBefore = textBefore.trim().split(/\s+/);
      const lastWord = wordsBefore[wordsBefore.length - 1] || "";

      if (/^\d+$/.test(lastWord)) return match;

      const abbreviations = ['mr', 'dr', 'prof', 'nr', 'blz', 'evt', 'etc', 'bijv', 'm', 'p', 'mevr', 'dhr'];
      if (abbreviations.includes(lastWord.toLowerCase())) return match;

      return p1 + '\n';
    });

    const lines = formattedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      alert("Plak eerst wat tekst in het veld!");
      return;
    }
    
    startGame(lines, customTitle || "Custom Hack", language);
  };

  const backToMenu = () => {
    window.speechSynthesis.cancel();
    setMode('menu');
  };

  const handlePrint = () => {
    window.print();
    setShowPrintHint(true); // Laat de hint zien in het geval de browser printen blokkeert
  };

  // --- MENU RENDERER ---
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full flex flex-col gap-6 sm:gap-8">
          
          <div className="text-center space-y-3 sm:space-y-4 mb-4 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-emerald-400 mb-2">
              <Terminal size={40} className="sm:w-12 sm:h-12" />
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Word_Master</h1>
            </div>
            <p className="text-slate-400 text-sm sm:text-xl px-4">Selecteer je missie of creëer je eigen simulatie.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Standard Mission Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col items-start gap-4 hover:border-emerald-500/50 transition-colors">
              <div className="bg-emerald-500/20 p-2 sm:p-3 rounded-xl">
                <FileText className="text-emerald-400 w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Standaard Missies</h2>
              <p className="text-slate-400 text-sm sm:text-base">Kies een taal en train met een van onze voorgeprogrammeerde hacks.</p>
              
              <div className="flex gap-2 mt-2 w-full">
                <select 
                  value={defaultLang}
                  onChange={(e) => setDefaultLang(e.target.value)}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none text-sm sm:text-base"
                >
                  <option value="fr-FR">Frans 🇫🇷</option>
                  <option value="nl-NL">Nederlands 🇳🇱</option>
                  <option value="en-US">Engels 🇬🇧</option>
                </select>

                <select 
                  value={missionLengthFilter}
                  onChange={(e) => setMissionLengthFilter(e.target.value)}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none text-sm sm:text-base"
                >
                  <option value="all">Alle Lengtes</option>
                  <option value="short">Kort (±3 zinnen)</option>
                  <option value="medium">Normaal (±6 zinnen)</option>
                  <option value="long">Lang (±9 zinnen)</option>
                </select>
              </div>

              <div className="w-full space-y-2 sm:space-y-3 mt-2 flex-grow overflow-y-auto pr-1">
                {PREMADE_MISSIONS[defaultLang]
                  .filter(m => missionLengthFilter === 'all' || m.length === missionLengthFilter)
                  .map((mission, index) => (
                  <button 
                    key={index}
                    onClick={() => startGame(mission.story, mission.title, defaultLang)}
                    className="w-full flex justify-between items-center bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/50 border border-transparent text-white px-3 sm:px-4 py-3 rounded-xl font-bold transition-all text-left group text-sm sm:text-base"
                  >
                    <div className="flex flex-col truncate pr-4">
                      <span className="truncate">{mission.title}</span>
                      <span className="text-[11px] sm:text-xs text-slate-400 font-normal mt-0.5 flex items-center gap-1.5">
                        {mission.length === 'short' && <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>}
                        {mission.length === 'medium' && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>}
                        {mission.length === 'long' && <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"></span>}
                        {mission.length === 'short' ? 'Kort' : mission.length === 'medium' ? 'Normaal' : 'Lang'} ({mission.story.length} zinnen)
                      </span>
                    </div>
                    <Play size={16} className="text-emerald-500 group-hover:text-emerald-400 shrink-0 sm:w-[18px] sm:h-[18px]" fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Mission Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col gap-4 hover:border-cyan-500/50 transition-colors">
              <div className="bg-cyan-500/20 p-2 sm:p-3 rounded-xl w-fit">
                <PlusCircle className="text-cyan-400 w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Custom Missie</h2>
              
              <div className="space-y-2 sm:space-y-3 w-full">
                <input 
                  type="text" 
                  placeholder="Missie Naam (bijv. Engelse Toets)" 
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm sm:text-base"
                />
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 appearance-none text-sm sm:text-base"
                >
                  <option value="fr-FR">Frans 🇫🇷</option>
                  <option value="nl-NL">Nederlands 🇳🇱</option>
                  <option value="en-US">Engels 🇬🇧</option>
                </select>
                <textarea 
                  placeholder="Plak hier je tekst. Elke nieuwe regel ('Enter') wordt een nieuw level!"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows="4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 resize-none text-sm sm:text-base"
                ></textarea>
              </div>

              <button 
                onClick={handleCustomStart}
                className="w-full flex justify-center items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 sm:px-6 py-3 rounded-xl font-bold transition-transform hover:-translate-y-1 shadow-lg shadow-cyan-500/20 text-sm sm:text-base mt-auto"
              >
                <Rocket size={18} className="sm:w-[20px] sm:h-[20px]" /> Hack deze tekst
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAY RENDERER ---
  return (
    <>
      {/* Normale Scherm Weergave (Verborgen tijdens printen) */}
      <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-8 font-sans flex flex-col items-center justify-center print:hidden">
        <div className="max-w-4xl w-full flex flex-col gap-4 sm:gap-6 mt-6 sm:mt-0">
          
          {/* Top Gamification Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 sm:p-4 rounded-2xl shadow-lg relative gap-4 md:gap-0">
            {/* Back Button */}
            <button 
              onClick={backToMenu}
              className="absolute -top-8 sm:-top-10 left-1 sm:left-0 flex items-center gap-1 sm:gap-2 text-slate-400 hover:text-white transition-colors text-sm sm:text-base"
            >
              <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" /> Menu
            </button>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-emerald-500/20 p-2 rounded-lg shrink-0">
                <Terminal className="text-emerald-400 sm:w-6 sm:h-6" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold tracking-wider">Mission File</p>
                <h2 className="text-base sm:text-xl font-bold truncate">{missionName}</h2>
              </div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6 border-t border-slate-800 md:border-0 pt-3 md:pt-0">
              <div className="text-center flex-1 md:flex-none">
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold">Level</p>
                <p className="text-base sm:text-xl font-mono text-cyan-400">{level + 1} <span className="text-slate-600 text-sm sm:text-base">/ {activeStory.length}</span></p>
              </div>
              <div className="text-center flex-1 md:flex-none">
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold">Streak</p>
                <div className="flex items-center justify-center gap-1 text-base sm:text-xl font-mono text-orange-400">
                  <Flame size={16} className={`sm:w-[20px] sm:h-[20px] ${streak > 2 ? 'animate-pulse text-rose-500' : ''}`} /> {streak}
                </div>
              </div>
              <div className="text-center flex-1 md:flex-none">
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold">XP</p>
                <div className="flex items-center justify-center gap-1 text-base sm:text-xl font-mono text-amber-400">
                  <Star size={16} className="sm:w-[20px] sm:h-[20px]" /> {xp}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          {result?.status !== 'victory' && (
            <div className="flex justify-center mt-2 sm:mt-0">
              <button 
                onClick={() => playAudio(currentSecretText)} 
                disabled={isTransitioning}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:hover:scale-100 text-white px-6 sm:px-8 py-3 rounded-full font-bold text-sm sm:text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/30 w-full sm:w-auto justify-center"
              >
                <Play fill="currentColor" size={18} className="sm:w-[20px] sm:h-[20px]" />
                Luister Zin {level + 1}
              </button>
            </div>
          )}

          {/* De Dojo (Interactieve Terminal Area) */}
          {result?.status !== 'victory' && (
            <div className="w-full relative group mt-2 sm:mt-4">
              <div className={`absolute -inset-1 bg-gradient-to-r rounded-xl blur opacity-30 transition duration-500 ${isTransitioning ? 'from-emerald-400 to-emerald-600 opacity-60' : 'from-cyan-500 to-emerald-500 group-hover:opacity-50'}`}></div>
              
              <div className="relative bg-slate-900 ring-1 ring-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                {/* Window Controls Decoratie */}
                <div className="bg-slate-800/80 px-3 sm:px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80"></div>
                    <span className="ml-2 text-[10px] sm:text-xs text-slate-500 font-mono truncate max-w-[150px] sm:max-w-none">dictation_engine.exe - [{language}]</span>
                  </div>
                </div>

                {/* Tekst Veld */}
                <div className="p-4 sm:p-6 min-h-[150px] sm:min-h-[200px] flex flex-col">
                  <div className="flex items-start flex-grow cursor-text" onClick={focusInput}>
                    <span className="text-emerald-500 font-mono text-lg sm:text-2xl leading-[28px] sm:leading-[35px] mr-2 sm:mr-3 mt-[2px]">{">"}</span>
                    <textarea 
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        if (isTransitioning) return;
                        setInput(e.target.value);
                        setIsSubmitted(false);
                        setResult(null);
                      }}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent text-slate-100 font-mono text-lg sm:text-2xl leading-[28px] sm:leading-[35px] outline-none resize-none caret-emerald-400"
                      autoComplete="off"
                      spellCheck="false"
                      disabled={isTransitioning}
                      rows={4}
                    />
                  </div>

                  {/* Feedback Diff Weergave */}
                  {isSubmitted && !isTransitioning && cleanText(input) !== cleanText(currentSecretText) && (
                    <div className="mt-4 border-t border-slate-800 pt-4 sm:pt-6 animate-in slide-in-from-top-2 fade-in">
                      <div className="font-mono text-sm sm:text-lg leading-relaxed space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
                          <span className="text-slate-500 sm:mr-4 sm:w-20 shrink-0">Output:</span>
                          <div className="flex-1 flex flex-wrap gap-x-2 gap-y-1">
                            {input.split(' ').map((word, i) => {
                              const safeSecretWord = currentSecretText.split(' ')[i] || '';
                              const isCorrect = cleanText(word) === cleanText(safeSecretWord);
                              return (
                                <span key={i} className={isCorrect ? 'text-emerald-400' : 'text-rose-400 underline decoration-rose-500/50 underline-offset-4'}>
                                  {word}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
                          <span className="text-cyan-500 sm:mr-4 sm:w-20 shrink-0">Target:</span>
                          <div className="flex-1 flex flex-wrap gap-x-2 gap-y-1 text-cyan-400">
                            {currentSecretText.split(' ').map((word, i) => (
                              <span key={i}>{word}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resultaat Feedback & Afdruk Menu (Bij Victory) */}
          <div className="flex flex-col items-center mt-2 sm:mt-4 mb-8 sm:mb-0 w-full gap-4">
            {result && (
              <div className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-lg transition-all animate-in fade-in slide-in-from-bottom-4 text-center w-full sm:w-auto justify-center
                ${result.status === 'legend' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' : 
                  result.status === 'victory' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 scale-105 sm:scale-110 w-full max-w-2xl shadow-2xl shadow-amber-500/20' : 
                  'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50'}`}
              >
                {result.status === 'legend' && <Flame size={20} className="sm:w-[28px] sm:h-[28px] text-orange-400 animate-pulse shrink-0" />}
                {result.status === 'victory' && <Crown size={24} className="sm:w-[32px] sm:h-[32px] text-amber-400 shrink-0" />}
                {result.status === 'newbie' && <AlertTriangle size={20} className="sm:w-[28px] sm:h-[28px] shrink-0" />}
                <span className={result.status === 'victory' ? 'text-xl sm:text-2xl py-2' : ''}>{result.message}</span>
              </div>
            )}

            {/* Genereer Rapport Module */}
            {result?.status === 'victory' && (
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl w-full max-w-2xl flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-8 delay-300">
                <div className="text-center space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Genereer Rapport voor Leerkracht</h3>
                  <p className="text-slate-400">Vul je naam in om een certificaat af te drukken als bewijs van je oefensessie.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <input 
                    type="text" 
                    placeholder="Jouw Naam (bijv. Jan Peeters)" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full sm:w-auto flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-center sm:text-left"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <button 
                      onClick={handlePrint}
                      disabled={!studentName.trim()}
                      className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full sm:w-auto"
                    >
                      <Printer size={20} />
                      Afdrukken
                    </button>
                    {showPrintHint && (
                      <span className="text-[11px] text-amber-400 max-w-[150px] text-center absolute mt-14">
                        Druk op <b>Ctrl+P</b> (of Cmd+P) als er niets gebeurt.
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mt-2">
                  <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Verdiende XP</p>
                    <p className="text-xl font-mono text-amber-400">{xp}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Aantal Fouten</p>
                    <p className={`text-xl font-mono ${totalErrors === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{totalErrors}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- PRINT ONLY CERTIFICATE (Zichtbaar bij Afdrukken) --- */}
      <div className="hidden print:flex print:absolute print:inset-0 print:bg-white print:text-black print:z-50 print:p-8 flex-col items-center justify-start print:min-h-screen">
        <div className="w-full max-w-4xl h-full border-8 border-slate-800 p-12 rounded-[2rem] flex flex-col items-center justify-between relative overflow-hidden">
          
          {/* Watermerk Icon */}
          <Terminal size={400} className="absolute text-slate-100 -z-10 opacity-50 rotate-[-10deg] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />

          {/* Header */}
          <div className="text-center space-y-4 w-full">
            <h1 className="text-5xl font-black uppercase tracking-widest text-slate-900 border-b-4 border-slate-900 pb-6">Dictee Dojo</h1>
            <h2 className="text-3xl font-bold text-slate-600 mt-4">Officieel Oefencertificaat</h2>
          </div>

          {/* Body */}
          <div className="text-center w-full space-y-8 my-12">
            <p className="text-xl text-slate-600 italic">Dit certificaat wordt uitgereikt aan:</p>
            <p className="text-4xl font-bold underline decoration-slate-300 underline-offset-8">{studentName || "..................................................."}</p>
            
            <p className="text-xl text-slate-600 italic pt-4">Voor het succesvol afronden van de missie:</p>
            <p className="text-3xl font-bold text-emerald-700">"{missionName}"</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-8 w-full max-w-2xl bg-slate-50 p-8 rounded-2xl border-2 border-slate-200">
            <div className="flex flex-col border-b-2 border-slate-200 pb-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-sm">Datum Oefensessie</span>
              <span className="text-2xl font-mono font-bold">{new Date().toLocaleDateString('nl-BE')}</span>
            </div>
            <div className="flex flex-col border-b-2 border-slate-200 pb-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-sm">Oefentaal</span>
              <span className="text-2xl font-mono font-bold">
                {language === 'nl-NL' ? 'Nederlands' : language === 'fr-FR' ? 'Frans' : 'Engels'}
              </span>
            </div>
            <div className="flex flex-col border-b-2 border-slate-200 pb-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-sm">Behaalde Score (XP)</span>
              <span className="text-2xl font-mono font-bold text-amber-600">{xp} XP</span>
            </div>
            <div className="flex flex-col border-b-2 border-slate-200 pb-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-sm">Gemaakte Fouten</span>
              <span className="text-2xl font-mono font-bold text-rose-600">{totalErrors}</span>
            </div>
          </div>

          {/* Footer & Handtekening */}
          <div className="w-full mt-16 pt-8 flex justify-between items-end px-12">
            <div className="text-left w-64">
              <p className="font-bold text-slate-500 uppercase text-sm mb-12">Gezien door Leerkracht / Ouder</p>
              <div className="border-b-4 border-slate-800 w-full"></div>
            </div>
            <div className="text-right flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-slate-800">Dictee Dojo Systeem</p>
                <p className="text-sm text-slate-500 font-mono">Geautomatiseerde Validatie</p>
              </div>
              <Crown size={64} className="text-emerald-600" />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
