import { useState, useEffect, useCallback, useRef } from 'react';
import './crt.css';

interface NewsItem {
  title: string;
  source: string;
}

// Mock news data (since we can't make external API calls)
const generalNews: NewsItem[] = [
  { title: "GLOBAL MARKETS SHOW STEADY GROWTH IN Q4 REPORTS", source: "FINANCIAL WIRE" },
  { title: "NEW RENEWABLE ENERGY INITIATIVE LAUNCHED WORLDWIDE", source: "ENERGY TIMES" },
  { title: "BREAKTHROUGH IN QUANTUM COMPUTING ANNOUNCED", source: "TECH HERALD" },
  { title: "INTERNATIONAL SPACE STATION CELEBRATES 25 YEARS", source: "SPACE NEWS" },
  { title: "CLIMATE SUMMIT REACHES HISTORIC AGREEMENT", source: "WORLD REPORT" },
];

const regionalNewsMap: Record<string, NewsItem[]> = {
  "new york": [
    { title: "MTA ANNOUNCES SUBWAY EXPANSION PROJECT", source: "NY TRANSIT" },
    { title: "CENTRAL PARK RESTORATION COMPLETE", source: "NYC PARKS" },
    { title: "BROADWAY SEASON BREAKS ATTENDANCE RECORDS", source: "ARTS WEEKLY" },
  ],
  "los angeles": [
    { title: "LA METRO PURPLE LINE EXTENSION OPENS", source: "LA TRANSIT" },
    { title: "HOLLYWOOD BOWL SUMMER CONCERT SERIES ANNOUNCED", source: "LA TIMES" },
    { title: "WILDFIRE PREVENTION MEASURES EXPANDED", source: "CAL FIRE" },
  ],
  "chicago": [
    { title: "LAKEFRONT TRAIL IMPROVEMENTS COMPLETED", source: "CHI PARKS" },
    { title: "O'HARE TERMINAL MODERNIZATION BEGINS", source: "CHI TRIBUNE" },
    { title: "WINTER WEATHER ADVISORY IN EFFECT", source: "NWS CHICAGO" },
  ],
  "default": [
    { title: "LOCAL COMMUNITY CENTER OPENS NEW FACILITIES", source: "LOCAL NEWS" },
    { title: "REGIONAL INFRASTRUCTURE UPGRADES APPROVED", source: "COUNTY WIRE" },
    { title: "AREA SCHOOLS RECEIVE TECHNOLOGY GRANTS", source: "EDU REPORT" },
  ],
};

const weatherConditions = [
  "CLEAR SKIES", "PARTLY CLOUDY", "OVERCAST", "LIGHT RAIN",
  "SCATTERED SHOWERS", "SUNNY", "FOGGY", "WINDY"
];

function getWeatherForLocation(location: string) {
  const hash = location.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const temp = 45 + (hash % 40);
  const humidity = 30 + (hash % 50);
  const condition = weatherConditions[hash % weatherConditions.length];
  return { temp, humidity, condition, location: location.toUpperCase() || "YOUR AREA" };
}

function getNewsForLocation(location: string): NewsItem[] {
  const loc = location.toLowerCase();
  for (const key of Object.keys(regionalNewsMap)) {
    if (loc.includes(key) || key.includes(loc)) {
      return regionalNewsMap[key];
    }
  }
  if (location) {
    return regionalNewsMap["default"];
  }
  return generalNews;
}

function useTypewriter(text: string, speed: number = 30, startDelay: number = 0) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);

    const startTimeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1));
          i++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);

  return { displayText, isComplete };
}

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [bootStage, setBootStage] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const weather = getWeatherForLocation(location);
  const news = getNewsForLocation(location);

  const bootMessages = [
    "INITIALIZING SYSTEM...",
    "LOADING KERNEL... OK",
    "MOUNTING FILESYSTEMS... OK",
    "STARTING NETWORK SERVICES... OK",
    "CONNECTING TO NEWS FEED... OK",
    "INITIALIZING WEATHER MODULE... OK",
    "LOADING SPEECH SYNTHESIS... OK",
    "SYSTEM READY",
    "",
    "╔══════════════════════════════════════════════════════════════╗",
    "║  AMBER TERMINAL v3.14  -  NEWS & WEATHER INFORMATION SYSTEM  ║",
    "╚══════════════════════════════════════════════════════════════╝",
    "",
  ];

  // Boot sequence
  useEffect(() => {
    if (!isBooting) return;

    if (bootStage < bootMessages.length) {
      const timeout = setTimeout(() => {
        setTerminalLines(prev => [...prev, bootMessages[bootStage]]);
        setBootStage(prev => prev + 1);
      }, bootStage === 0 ? 500 : 150 + Math.random() * 100);
      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => {
        setIsBooting(false);
        setShowContent(true);
      }, 500);
    }
  }, [bootStage, isBooting]);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.8;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        v.name.includes('Daniel') ||
        v.name.includes('Alex') ||
        v.name.includes('Google US English')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const formatTimeForSpeech = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDateForSpeech = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const speakAll = useCallback(() => {
    const dateTimeText = `The current date is ${formatDateForSpeech(currentTime)}. The time is ${formatTimeForSpeech(currentTime)}.`;
    const weatherText = `Weather for ${weather.location}: ${weather.condition}, temperature ${weather.temp} degrees Fahrenheit, humidity ${weather.humidity} percent.`;
    const newsIntro = location ? `Here are the latest regional headlines for ${weather.location}:` : "Here are the latest headlines:";
    const newsText = news.map((item, i) => `Headline ${i + 1}: ${item.title}`).join('. ');

    const fullText = `${dateTimeText} ${weatherText} ${newsIntro} ${newsText}`;
    speak(fullText);
  }, [currentTime, weather, news, location, speak]);

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(inputValue);
    setTerminalLines(prev => [
      ...prev,
      `> SET LOCATION: ${inputValue.toUpperCase() || "GENERAL"}`,
      "LOCATION UPDATED. FETCHING DATA..."
    ]);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="crt-container">
      <div className="crt-screen">
        <div className="scanlines"></div>
        <div className="crt-glow"></div>
        <div className="crt-content">
          {/* Terminal Output */}
          <div ref={terminalRef} className="terminal-output">
            {terminalLines.map((line, i) => (
              <div key={i} className="terminal-line">{line}</div>
            ))}
          </div>

          {showContent && (
            <div className="main-content">
              {/* Date & Time Section */}
              <section className="section datetime-section">
                <div className="section-header">
                  <span className="bracket">[</span>
                  <span className="header-text">DATE/TIME</span>
                  <span className="bracket">]</span>
                </div>
                <div className="datetime-display">
                  <div className="date">{formatDate(currentTime)}</div>
                  <div className="time">{formatTime(currentTime)}</div>
                </div>
              </section>

              {/* Location Input */}
              <section className="section input-section">
                <div className="section-header">
                  <span className="bracket">[</span>
                  <span className="header-text">LOCATION</span>
                  <span className="bracket">]</span>
                </div>
                <form onSubmit={handleLocationSubmit} className="location-form">
                  <span className="prompt">{">"}</span>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="ENTER ZIP CODE OR CITY"
                    className="location-input"
                  />
                  <button type="submit" className="submit-btn">SET</button>
                </form>
                <div className="location-status">
                  CURRENT: {location.toUpperCase() || "GENERAL (ALL REGIONS)"}
                </div>
              </section>

              {/* Weather Section */}
              <section className="section weather-section">
                <div className="section-header">
                  <span className="bracket">[</span>
                  <span className="header-text">WEATHER</span>
                  <span className="bracket">]</span>
                </div>
                <div className="weather-grid">
                  <div className="weather-item">
                    <span className="weather-label">LOCATION:</span>
                    <span className="weather-value">{weather.location}</span>
                  </div>
                  <div className="weather-item">
                    <span className="weather-label">CONDITION:</span>
                    <span className="weather-value">{weather.condition}</span>
                  </div>
                  <div className="weather-item">
                    <span className="weather-label">TEMP:</span>
                    <span className="weather-value">{weather.temp}°F</span>
                  </div>
                  <div className="weather-item">
                    <span className="weather-label">HUMIDITY:</span>
                    <span className="weather-value">{weather.humidity}%</span>
                  </div>
                </div>
              </section>

              {/* News Section */}
              <section className="section news-section">
                <div className="section-header">
                  <span className="bracket">[</span>
                  <span className="header-text">{location ? "REGIONAL NEWS" : "GENERAL NEWS"}</span>
                  <span className="bracket">]</span>
                </div>
                <div className="news-list">
                  {news.map((item, i) => (
                    <div key={i} className="news-item">
                      <span className="news-bullet">■</span>
                      <div className="news-content">
                        <div className="news-title">{item.title}</div>
                        <div className="news-source">— {item.source}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Speech Controls */}
              <section className="section controls-section">
                <div className="section-header">
                  <span className="bracket">[</span>
                  <span className="header-text">SPEECH CONTROLS</span>
                  <span className="bracket">]</span>
                </div>
                <div className="controls">
                  <button
                    onClick={speakAll}
                    disabled={isSpeaking}
                    className={`control-btn ${isSpeaking ? 'disabled' : ''}`}
                  >
                    {isSpeaking ? '◉ SPEAKING...' : '▶ SPEAK ALL'}
                  </button>
                  <button
                    onClick={stopSpeaking}
                    disabled={!isSpeaking}
                    className={`control-btn stop-btn ${!isSpeaking ? 'disabled' : ''}`}
                  >
                    ■ STOP
                  </button>
                </div>
                {isSpeaking && (
                  <div className="speaking-indicator">
                    <span className="pulse">●</span> AUDIO OUTPUT ACTIVE
                  </div>
                )}
              </section>

              {/* Footer */}
              <footer className="footer">
                <span className="footer-text">Requested by @simplify3 · Built by @clonkbot</span>
              </footer>
            </div>
          )}

          <div className="cursor-blink">_</div>
        </div>
      </div>
    </div>
  );
}
