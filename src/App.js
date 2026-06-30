import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, CloudLightning, CloudSnow, Disc, Radio, Compass, Gauge, Eye, Sunrise, Sunset, Calendar, Briefcase, ArrowLeftRight, Trophy } from 'lucide-react';
import './App.css';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY; 

function App() {

  // Chatbot State Hooks
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Yo! I am your Atmospheric AI Assistant. Ask me anything about today\'s studio environment or event planning.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !weatherData) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    try {
      // ૧. તમારી સાચી AQ કી પ્રોપર્ટી સેટ કરો
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      
      // ૨. URL માંથી ?key= વાળો ભાગ હટાવીને બિલકુલ ક્લીન ઓફિશિયલ રૂટ રાખ્યો
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

      // લૉફાઇ સ્ટુડિયો થીમ કોન્ટેક્સ્ટ પ્રોમ્પ્ટ
      const systemPrompt = `You are the AI Weather Assistant for "Vatavaranam.ai", a premium music-console themed weather app. 
      Current Location: ${weatherData.name}. 
      Current Weather: ${Math.round(weatherData.main.temp)}°C, ${weatherData.weather[0].description}. 
      Humidity: ${weatherData.main.humidity}%, Wind: ${weatherData.wind.speed} m/s.
      Air Quality (AQI): ${weatherData.aqiData?.text || 'Good Spectrum'}.
      Answer the user's question directly based on this atmospheric data. Keep your professional tone concise, cool, and use a slight lo-fi studio/audio terminology (like tracks, frequencies, beats, balance). Provide answers strictly in English only. Do not use markdown bullet lists, keep text in paragraph form.`;

      const payload = {
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }]
        }]
      };

      // ૩. કીને 'X-goog-api-key' હેડર તરીકે પાસ કરો (બિલકુલ curl કમાન્ડની જેમ)
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (!response.ok) {
        console.error("Google Server Error:", resData);
        throw new Error(resData.error?.message || `HTTP Error ${response.status}`);
      }
      
      // 🚀 SAFE EXTRACTION: જો ડેટા ક્યાંય પણ મિસિંગ હોય તો સેફ ટેક્સ્ટ પકડી લેશે
      const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text 
        || "Transmission frequencies matched nicely, but text decoding had a minor flutter. Ask me again, bro!";
      
      setChatMessages(prev => [...prev, { role: 'bot', text: responseText }]);
      
    } catch (err) {
      console.error("Gemini uplink offline:", err);
      setChatMessages(prev => [...prev, { role: 'bot', text: 'Transmission gap detected. Please verify your system console network frequencies.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const [city, setCity] = useState('Visnagar');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dayProgress, setDayProgress] = useState(50);
  const [weatherVibe, setWeatherVibe] = useState('vibe-clear');
  
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedEvent, setSelectedEvent] = useState('shoot');
  const [compareCity, setCompareCity] = useState('');
  const [compareData, setCompareData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const fetchWeather = async (searchCity) => {
    setLoading(true);
    try {

      // જો ઇનપુટ નંબર (પિનકોડ) હોય તો zip API વાપરવી, નહીંતર q (નામ) API
      const isPincode = !isNaN(searchCity.trim());

      const url = isPincode 
        ? `https://api.openweathermap.org/data/2.5/weather?zip=${searchCity.trim()},IN&units=metric&appid=${API_KEY}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&units=metric&appid=${API_KEY}`;

      const currentRes = await axios.get(url);

      // ૧. AQI માટે અક્ષાંશ-રેખાંશ (lat, lon) મેળવો
      const { lat, lon } = currentRes.data.coord;

      // ૨. Air Pollution Free API કોલ કરો
      const pollutionRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );

      const aiMetrics = generateAIFeatures(currentRes.data);
      
      // એસ્ટ્રોનોમી ડેટા ગણતરી કનેક્ટ કરો
      const astroMetrics = calculateAstronomyData(currentRes.data);

      // ૩. પોલ્યુશન ડેટા અને કમ્પોનન્ટ્સ એક્સ્ટ્રેક્ટ કરો
      const pList = pollutionRes.data.list[0];
      const aqiValue = pList.main.aqi; // 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
      const components = pList.components; // pm2_5, pm10, co, no2, o3, so2

      // ૪. સાયન્ટિફિક હેલ્થ એડવાઇઝ ગણતરી
      let aqiText = "Good Spectrum";
      let aqiHealth = "Air quality is ideal for outdoor studio recording and cardio workout sessions.";
      if (aqiValue === 2) { aqiText = "Fair Spectrum"; aqiHealth = "Acceptable air quality; sensitive individuals should monitor outdoor exposure."; }
      else if (aqiValue === 3) { aqiText = "Moderate Noise"; aqiHealth = "Moderate pollution detected. Wear a standard filter mask if commuting long hours."; }
      else if (aqiValue >= 4) { aqiText = "Heavy Distortion"; aqiHealth = "High pollution levels. Highly recommended to shift all activities indoors and use air purifiers."; }

      // સ્ટેટ મેનેજમેન્ટમાં બધો જ ડેટા એકસાથે સેવ કરો
      setWeatherData({ 
        ...currentRes.data, 
        ai: aiMetrics, 
        astro: astroMetrics,
        aqiData: {
          value: aqiValue,
          text: aqiText,
          health: aqiHealth,
          gases: components
        }
      });

      // Recent Searches માં સિટી એડ કરવાની ટ્રિક
      saveToRecent(currentRes.data.name);

      const mainState = currentRes.data.weather[0].main;
      if (mainState === 'Clear') setWeatherVibe('vibe-clear');
      else if (mainState === 'Clouds') setWeatherVibe('vibe-clouds');
      else if (['Rain', 'Drizzle', 'Thunderstorm'].includes(mainState)) setWeatherVibe('vibe-rain');
      else setWeatherVibe('vibe-mist');

      // --- ડાયનેમિક ડે/નાઇટ પ્રોગ્રેસ એન્જિન ---
      if (currentRes.data.sys.sunrise && currentRes.data.sys.sunset) {
        const now = Math.floor(Date.now() / 1000);
        const sunrise = currentRes.data.sys.sunrise;
        const sunset = currentRes.data.sys.sunset;
        
        const isNight = now > sunset || now < sunrise;

        if (!isNight) {
          // દિવસનો પ્રોગ્રેસ (Sunrise થી Sunset)
          const totalDay = sunset - sunrise;
          const currentDay = now - sunrise;
          const pct = Math.min(Math.max(Math.round((currentDay / totalDay) * 100), 0), 100);
          setDayProgress(pct);
        } else {
          // રાતનો પ્રોગ્રેસ (Sunset થી Sunrise)
          // જો અડધી રાત પછીનો સમય હોય તો સૂર્યાસ્ત ગઈકાલનો ગણાય એટલે ઓફસેટ સેટ કરવો
          const adjustedSunset = now < sunrise ? sunset - 86400 : sunset; 
          const totalNight = sunrise - adjustedSunset;
          const currentNight = now - adjustedSunset;
          const pct = Math.min(Math.max(Math.round((currentNight / totalNight) * 100), 0), 100);
          setDayProgress(pct);
        }
      }

      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${searchCity}&units=metric&appid=${API_KEY}`
      );
      
      const dailyData = forecastRes.data.list.filter(item => item.dt_txt.includes("12:00:00"));
      setForecastData(dailyData);
      
    } catch (err) {
      if (!navigator.onLine) {
        alert("You are offline, you will see last saved data.");
      } else {
        console.log('Station frequency offline. Try again.');
      }
    } finally {
      setTimeout(() => setLoading(false), 1200);
    }
  };

  // ૩. LocalStorage માં રીસેન્ટ સર્ચ સેવ કરવા માટે
  const saveToRecent = (cityName) => {
    let recent = JSON.parse(localStorage.getItem('recent_stations')) || [];
    if (!recent.includes(cityName)) {
      recent = [cityName, ...recent].slice(0, 4); // ફક્ત છેલ્લા ૪ સર્ચ રાખશે
      localStorage.setItem('recent_stations', JSON.stringify(recent));
    }
  };

  const handleCompareSearch = async (e) => {
    e.preventDefault();
    if (!compareCity.trim()) return;
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${compareCity}&units=metric&appid=${API_KEY}`
      );
      setCompareData(res.data);
    } catch (err) {
      alert('સરખામણી માટેનું આ शहर જડ્યું નહીં!');
    }
  };

  const fetchLeaderboard = async () => {
    const defaultCities = ['Ahmedabad', 'Pune', 'Mumbai', 'Delhi', 'Visnagar'];
    try {
      const promises = defaultCities.map(c =>
        axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${c}&units=metric&appid=${API_KEY}`)
      );
      const results = await Promise.all(promises);
      const formatted = results.map(r => ({
        name: r.data.name,
        temp: r.data.main.temp,
        humidity: r.data.main.humidity,
        condition: r.data.weather[0].main
      }));
      setLeaderboard(formatted);
    } catch (e) {
      console.log('Leaderboard sync issues.');
    }
  };

  useEffect(() => {
    fetchWeather(city);
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearch = (e) => {
    e.preventDefault();
    if (city.trim()) fetchWeather(city);
  };

  const getWeatherIcon = (main, size = 24) => {
    switch (main) {
      case 'Clear': return <Sun className="bright-vibe-icon text-amber" size={size} />;
      case 'Clouds': return <Cloud className="bright-vibe-icon text-slate" size={size} />;
      case 'Rain': case 'Drizzle': return <CloudRain className="bright-vibe-icon text-cyan" size={size} />;
      case 'Thunderstorm': return <CloudLightning className="bright-vibe-icon text-purple" size={size} />;
      case 'Snow': return <CloudSnow className="bright-vibe-icon text-blue" size={size} />;
      default: return <Sun className="bright-vibe-icon text-amber" size={size} />;
    }
  };

  const getEventFeasibility = () => {
    if (!weatherData) return { text: 'No atmospheric data synced.', color: '#64748b' };
    
    const temp = Math.round(weatherData.main.temp);
    const condition = weatherData.weather[0].main;
    const wind = weatherData.wind.speed;
    const isRain = ['Rain', 'Drizzle', 'Thunderstorm'].includes(condition);

    switch (selectedEvent) {
      case 'shoot':
        if (isRain) return { text: 'Rain frequency active! Relocate your outdoor cinematic shoot indoors immediately.', color: '#ef4444' };
        if (temp > 35) return { text: 'Harsh sunlight detected. Lighting might be too overexposed for scenic tracking.', color: '#f59e0b' };
        return { text: 'Perfect atmospheric balance. Soft diffusion lighting is ideal for cinematic outdoor captures.', color: '#10b981' };

      case 'party':
        if (isRain) return { text: 'Storm alert on the radar. Shift your rooftop setup to an indoor studio stage.', color: '#ef4444' };
        if (wind > 12) return { text: 'High wind velocity detected. Secure your audio gear and outdoor decor panels.', color: '#f59e0b' };
        return { text: 'Excellent open-air conditions. Clear frequencies for a perfect terrace studio party.', color: '#10b981' };

      case 'cricket':
        if (isRain) return { text: 'Match canceled or delayed. High dampness on the pitch track.', color: '#ef4444' };
        if (temp > 38) return { text: 'Extreme heat warning active. High exhaustion index for outdoor sports.', color: '#f59e0b' };
        return { text: 'Flawless outfield conditions. Perfect weather track to play or stream a cricket match.', color: '#10b981' };

      case 'garden':
        if (isRain) return { text: 'Natural precipitation is high. Postpone any fertilizer or chemical spraying.', color: '#f59e0b' };
        if (temp > 36) return { text: 'High soil moisture evaporation. Increase root hydration early in the morning.', color: '#3b82f6' };
        return { text: 'Optimal climate window. Perfect state for standard watering, potting, or trimming plants.', color: '#10b981' };

      case 'travel':
        if (isRain) return { text: 'Poor visibility and wet tarmac tracks. Postpone long-distance highway commutes.', color: '#ef4444' };
        return { text: 'Clear path visibility status. Safe atmospheric track for transit or inter-city travel.', color: '#10b981' };

      default:
        return { text: 'Atmosphere is stable for general tasks.', color: '#10b981' };
    }
  };

  const generateAIFeatures = (data) => {
    if (!data) return null;

    const temp = Math.round(data.main.temp);
    const condition = data.weather[0].main;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const isRain = ['Rain', 'Drizzle', 'Thunderstorm'].includes(condition);

    // ૧. AI Weather Summary
    let summary = `Currently ${temp}°C with ${data.weather[0].description}. `;
    if (isRain) summary += "Expect light showers to continue; perfect track for lofi beats.";
    else if (temp > 32) summary += "Warm atmospheric frequencies detected. Stay hydrated inside the studio.";
    else summary += "Clear soundstage vibes outside. Great day to explore.";

    // ૨. AI Travel & Outfit Recommendations
    const travel = isRain ? "Not recommended for long drives or hill stations. Local cafes are a better vibe." : "High feasibility for commuting or short inter-city travel.";
    const outfit = temp > 30 ? "Light linen, oversized tees, and shades." : isRain ? "Waterproof windcheater, dark cargos, and extra layers." : "Comfortable cotton layers or a light studio jacket.";

    // ૩. AI Health & Farming Advice
    const health = humidity > 80 ? "High moisture levels. Drink clean water and maintain indoor ventilation." : "Perfect environment. Good for breathing and quick outdoor cardio.";
    const farming = isRain ? "Excellent natural irrigation track active. Postpone heavy pesticide spraying." : temp > 35 ? "High evaporation rates. Schedule root-level watering early morning." : "Optimal soil moisture state. Safe time for fertilizer inputs.";

    // ૪. AI Workout & Lifestyle Scores (Calculated Matrices)
    const picnicScore = isRain ? 20 : temp > 35 ? 45 : Math.max(100 - (wind * 3), 75);
    const beachScore = isRain || wind > 12 ? 15 : temp < 22 ? 50 : Math.min(100 - (humidity / 2), 95);
    const drivingScore = isRain ? 55 : wind > 15 ? 70 : 98;
    const workout = isRain || temp > 35 ? "Indoor Gym / Core Stability Session recommended." : "Outdoor Running Spectrum / Cycling tracks are perfect right now.";

    return {
      summary, travel, outfit, health, farming, workout,
      picnicScore, beachScore, drivingScore
    };
  };

  const calculateAstronomyData = (data) => {
    if (!data || !data.sys) return null;

    const sunriseTS = data.sys.sunrise;
    const sunsetTS = data.sys.sunset;

    // ૧. Day Length (કુલ દિવસ કેટલો લાંબો છે)
    const totalSeconds = sunsetTS - sunriseTS;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const dayLength = `${hours}h ${minutes}m`;

    // ૨. Solar Noon (મધ્યહ્ન - જ્યારે સૂર્ય બરાબર મધ્યમાં હોય)
    const solarNoonTS = sunriseTS + (totalSeconds / 2);
    const solarNoon = new Date(solarNoonTS * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // ૩. Golden Hour & Blue Hour (સિનેમેટિક શૂટ માટે મોસ્ટ ઈમ્પોર્ટન્ટ)
    // સૂર્યોદય પછીની અને સૂર્યાસ્ત પહેલાની ૪0 મિનિટ
    const formatTimeOffset = (timestamp, offsetMinutes) => {
      return new Date((timestamp + (offsetMinutes * 60)) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const morningGoldenHour = `${formatTimeOffset(sunriseTS, 0)} - ${formatTimeOffset(sunriseTS, 45)}`;
    const eveningGoldenHour = `${formatTimeOffset(sunsetTS, -45)} - ${formatTimeOffset(sunsetTS, 0)}`;
    const eveningBlueHour = `${formatTimeOffset(sunsetTS, 0)} - ${formatTimeOffset(sunsetTS, 30)}`;

    // ૪. Moonrise/Moonset (ફ્રી API ટ્રીક: સૂર્યાસ્ત અને સૂર્યોદયના અંદાજિત ઓફસેટ પરથી લોફાઇ ટ્રેકિંગ)
    const moonrise = new Date((sunsetTS + 3600) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const moonset = new Date((sunriseTS + 7200) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return {
      dayLength,
      solarNoon,
      morningGoldenHour,
      eveningGoldenHour,
      eveningBlueHour,
      moonrise,
      moonset
    };
  };

  // ૧. GPS લોકેશન મેળવવાનું નવું ફંક્શન
  const fetchWeatherByGPS = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
          );
          setWeatherData(res.data);
          setCity(res.data.name);
          // બાકીનું ફોરકાસ્ટ લોજિક અહીં એડ કરવું...
        } catch (err) {
          console.log("GPS station offline.");
        } finally {
          setTimeout(() => setLoading(false), 1200);
        }
      }, () => {
        alert("લોકેશન પરમિશન ડિનાઇડ!");
        setLoading(false);
      });
    }
  };

  const hottestCity = [...leaderboard].sort((a, b) => b.temp - a.temp)[0];
  const coldestCity = [...leaderboard].sort((a, b) => a.temp - b.temp)[0];
  const rainiestCity = leaderboard.find(c => ['Rain', 'Thunderstorm'].includes(c.condition)) || [...leaderboard].sort((a, b) => b.humidity - a.humidity)[0];

  // કરંટ વેધર કન્ડિશન ચેક કરો
  let currentCondition = weatherData ? weatherData.weather[0].main : 'Clear';
  currentCondition = (city === 'varasad') ? 'Rain' : (city === 'tofan') ? 'Thunderstorm' : (city === 'baraf') ? 'Snow' : (city === 'vadal') ? 'Clouds' : currentCondition;
  return (
    <div className={`full-page-studio ${weatherVibe}`}>
      
      {/* 🔮 GLASSMORPHISM DYNAMIC BACKGROUND SPECTRUM */}
      <div className="pastel-aura-1"></div>
      <div className="pastel-aura-2"></div>

      {/* 🌧️ ANIMATED RAIN ENGINE (More Drops Added) */}
      {['Rain', 'Drizzle'].includes(currentCondition) && (
        <div className="ambient-rain-visualizer">
          <span className="rain-drop-line"></span>
          <span className="rain-drop-line"></span>
          <span className="rain-drop-line"></span>
          <span className="rain-drop-line"></span>
          <span className="rain-drop-line"></span>
          <span className="rain-drop-line"></span>
          <span className="rain-drop-line"></span>
          <span className="rain-drop-line"></span>
        </div>
      )}

      {/* ⚡ THUNDER EFFECT LAYER */}
      {currentCondition === 'Thunderstorm' && (
        <>
          <div className="ambient-thunder-flash"></div>
          <div className="ambient-rain-visualizer">
            <span className="rain-drop-line"></span>
            <span className="rain-drop-line"></span>
            <span className="rain-drop-line"></span>
            <span className="rain-drop-line"></span>
            <span className="rain-drop-line"></span>
          </div>
        </>
      )}

      {/* ❄️ ANIMATED SNOW ENGINE (More Flakes Added) */}
      {currentCondition === 'Snow' && (
        <div className="ambient-snow-visualizer">
          <div className="snowflake-node"></div>
          <div className="snowflake-node"></div>
          <div className="snowflake-node"></div>
          <div className="snowflake-node"></div>
          <div className="snowflake-node"></div>
        </div>
      )}

      {/* ☁️ ANIMATED BACKGROUND CLOUDS */}
      {currentCondition === 'Clouds' && (
        <div className="ambient-cloud-drift">
          <div className="drift-cloud-1"></div>
          <div className="drift-cloud-2"></div>
        </div>
      )}

      {/* CLOUD LOADER ENGINE STRUCTURE */}
      {loading && (
        <div className="cloud-loader-container">
          <div className="cloud-studio-art">
            <div className="cloud-element main-cloud"></div>
            <div className="cloud-element back-cloud"></div>
            <div className="cloud-element left-cloud"></div> {/* નવું વાદળનું બબલ */}
            <div className="cloud-base"></div>              {/* નવો વેધર બેઝ */}
            
            <div className="cloud-drops">
              <span className="drop"></span>
              <span className="drop"></span>
              <span className="drop"></span>
            </div>
          </div>
          <div className="studio-pulse-bars">
            <span className="p-bar"></span>
            <span className="p-bar"></span>
            <span className="p-bar"></span>
            <span className="p-bar"></span>
          </div>
          <p className="cloud-loading-text">Syncing Atmospheric Frequencies...</p>
        </div>
      )}

      {!loading && weatherData && (
        <div className="widescreen-dashboard-frame animate-slide-up">
          
          {/* TOP NAV BAR */}
          <header className="widescreen-top-nav">
            <div className="nav-brand">
              <Disc className="vinyl-animation text-cyan" size={22} />
              <h2>Vatavaranam<span>.ai</span></h2>
                <img 
                  src={`https://flagsapi.com/IN/flat/24.png`} 
                  alt="Country Flag" 
                  style={{ marginLeft: '8px' }}
                />
            </div>
            
            <form onSubmit={handleSearch} className="nav-center-search">
              <input type="text" placeholder="Search city or Pincode..." value={city} onChange={(e) => setCity(e.target.value)} />
              {/* લોકેશન ટ્રેક કરવા માટેનું નવું GPS બટન */}
              <button type="button" onClick={fetchWeatherByGPS} style={{ paddingRight: '10px' }}>📍</button>
              
              <button type="submit"><Search size={14} /></button>
            </form>

            <div className="nav-right-status">
              <div className="live-pill"><Radio size={11} /> LIVE FEED</div>
            </div>
          </header>

          {/* TWO MAIN COLUMN WORKSPACE */}
          <div className="widescreen-workspace-grid">
            
            {/* LEFT MODULE GRID: HERO CARD + SUN TIME */}
            <div className="workspace-left-panel">
              <div className="current-track-banner">
                <div className="track-album-art floating-animation">
                  {getWeatherIcon(weatherData.weather[0].main, 64)}
                </div>
                <div className="track-metadata">
                  <span className="now-playing-tag">NOW REPLAYING</span>
                  <h1 className="track-title">{weatherData.name}</h1>
                  <p className="track-subtitle">{weatherData.weather[0].description.toUpperCase()}</p>
                </div>
                <div className="track-metric-value">
                  <h2>{Math.round(weatherData.main.temp)}°<span>C</span></h2>
                </div>
              </div>

              {/* TIMELINE PROGRESS SCRUB BAR */}
              <div className="audio-scrub-container">
                {(() => {
                  const now = Math.floor(Date.now() / 1000);
                  const isNight = now > weatherData.sys.sunset || now < weatherData.sys.sunrise;

                  return (
                    <>
                      <div className="scrub-time-labels">
                        {/* ડાબી બાજુનું લેબલ: દિવસે સૂર્યોદય, રાત્રે સૂર્યાસ્ત */}
                        <span className="sun-time-node">
                          {isNight ? <Sunset size={12} /> : <Sunrise size={12} />} 
                          {isNight ? formatTime(weatherData.sys.sunset) : formatTime(weatherData.sys.sunrise)}
                        </span>
                        
                        {/* સેન્ટર ટ્રેક સ્ટેટસ */}
                        <span className={`scrub-center-tag ${isNight ? 'night-track' : ''}`}>
                          {isNight ? 'NIGHTTIME FREQUENCY' : 'DAYTIME SPECTRUM'}
                        </span>
                        
                        {/* જમણી બાજુનું લેબલ: દિવસે સૂર્યાસ્ત, રાત્રે સૂર્યોદય */}
                        <span className="sun-time-node">
                          {isNight ? <Sunrise size={12} /> : <Sunset size={12} />} 
                          {isNight ? formatTime(weatherData.sys.sunrise) : formatTime(weatherData.sys.sunset)}
                        </span>
                      </div>
                      
                      <div className="scrub-track-bg">
                        <div className="scrub-progress-fill" style={{ width: `${dayProgress}%` }}></div>
                        <div className="scrub-handle-knob" style={{ left: `${dayProgress}%` }}></div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* RIGHT MODULE GRID: 6 CLEAN VISUAL WIDGETS */}
            <div className="workspace-right-panel">
              <div className="mixer-analytics-dashboard">
                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">FEELS LIKE</span>
                  <div className="channel-value-row"><Thermometer size={14} className="text-cyan" /><h3>{Math.round(weatherData.main.feels_like)}°C</h3></div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-cyan" style={{width: `${Math.min(Math.max(weatherData.main.feels_like * 2, 0), 100)}%`}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">HUMIDITY</span>
                  <div className="channel-value-row"><Droplets size={14} className="text-purple" /><h3>{weatherData.main.humidity}%</h3></div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-purple" style={{width: `${weatherData.main.humidity}%`}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">WIND VELOCITY</span>
                  <div className="channel-value-row"><Wind size={14} className="text-amber" /><h3>{weatherData.wind.speed} <small>m/s</small></h3></div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-amber" style={{width: `${Math.min(weatherData.wind.speed * 5, 100)}%`}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">WIND DIRECTION</span>
                  <div className="channel-value-row"><Compass size={14} className="text-blue" /><h3>{weatherData.wind.deg}°</h3></div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-blue" style={{width: `${(weatherData.wind.deg / 360) * 100}%`}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">VISIBILITY</span>
                  <div className="channel-value-row"><Eye size={14} className="text-teal" /><h3>{(weatherData.visibility / 1000).toFixed(1)} <small>km</small></h3></div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-teal" style={{width: `${(weatherData.visibility / 10000) * 100}%`}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">BAROMETRIC PRESSURE</span>
                  <div className="channel-value-row"><Gauge size={14} className="text-slate" /><h3>{weatherData.main.pressure} <small>hPa</small></h3></div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-slate" style={{width: `${((weatherData.main.pressure - 950) / 100) * 100}%`}}></div></div>
                </div>
              </div>
            </div>

            {/* BOTTOM FULL-WIDTH MODULE: AI CELESTIAL TRACKER */}
                <div className="astro-matrix-card">
                  <h4 className="astro-matrix-title">🌎 AI CELESTIAL & ASTRONOMY TRACK</h4>
                  <div className="astro-matrix-grid">
                    <div className="astro-node">
                      <span className="astro-label">DAY LENGTH SPECTRUM</span>
                      <h3>{weatherData.astro?.dayLength || '--:--'}</h3>
                    </div>
                    <div className="astro-node">
                      <span className="astro-label">SOLAR NOON TIMELINE</span>
                      <h3>{weatherData.astro?.solarNoon || '--:--'}</h3>
                    </div>
                    <div className="astro-node">
                      <span className="astro-label">🌅 MORNING GOLDEN HOUR</span>
                      <h3 className="text-amber">{weatherData.astro?.morningGoldenHour || '--:--'}</h3>
                    </div>
                    <div className="astro-node">
                      <span className="astro-label">🌇 EVENING GOLDEN HOUR</span>
                      <h3 className="text-amber">{weatherData.astro?.eveningGoldenHour || '--:--'}</h3>
                    </div>
                    <div className="astro-node">
                      <span className="astro-label">🌌 CINEMATIC BLUE HOUR</span>
                      <h3 className="text-blue">{weatherData.astro?.eveningBlueHour || '--:--'}</h3>
                    </div>
                    <div className="astro-node">
                      <span className="astro-label">🌙 ESTIMATED MOONRISE / SET</span>
                      <h3>{weatherData.astro?.moonrise || '--:--'} / {weatherData.astro?.moonset || '--:--'}</h3>
                    </div>
                  </div>
                </div>

            {/* BOTTOM FULL-WIDTH MODULE 2: AI ATMOSPHERIC NOISE & AQI */}
            {weatherData?.aqiData && (
              <div className="aqi-matrix-card">
                <div className="aqi-header-row">
                  <h4 className="aqi-matrix-title">🌬️ AI ATMOSPHERIC NOISE & AQI MONITOR</h4>
                  <span className={`aqi-badge status-val-${weatherData.aqiData.value}`}>
                    STATUS: {weatherData.aqiData.text} ({weatherData.aqiData.value}/5)
                  </span>
                </div>

                <div className="aqi-report-alert">
                  <h5 className="aqi-health-title">HEALTH RECOMMENDATION REPORT</h5>
                  <p className="aqi-health-text">"{weatherData.aqiData.health}"</p>
                </div>

                <div className="aqi-gases-grid">
                  <div className="gas-node">
                    <span className="gas-label">PM2.5 <small>(Fine Dust)</small></span>
                    <h3>{weatherData.aqiData.gases.pm2_5} <small>µg/m³</small></h3>
                  </div>
                  <div className="gas-node">
                    <span className="gas-label">PM10 <small>(Coarse Dust)</small></span>
                    <h3>{weatherData.aqiData.gases.pm10} <small>µg/m³</small></h3>
                  </div>
                  <div className="gas-node">
                    <span className="gas-label">CO <small>(Carbon Monoxide)</small></span>
                    <h3>{weatherData.aqiData.gases.co} <small>µg/m³</small></h3>
                  </div>
                  <div className="gas-node">
                    <span className="gas-label">NO₂ <small>(Nitrogen Dioxide)</small></span>
                    <h3>{weatherData.aqiData.gases.no2} <small>µg/m³</small></h3>
                  </div>
                  <div className="gas-node">
                    <span className="gas-label">O₃ <small>(Ozone Core)</small></span>
                    <h3>{weatherData.aqiData.gases.o3} <small>µg/m³</small></h3>
                  </div>
                  <div className="gas-node">
                    <span className="gas-label">SO₂ <small>(Sulfur Dioxide)</small></span>
                    <h3>{weatherData.aqiData.gases.so2} <small>µg/m³</small></h3>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* CENTRAL DYNAMIC FORECAST VIEWPORT */}
          <div className="utility-dynamic-viewport-card">
            {activeTab === 'calendar' && (
              <div className="calendar-grid-vibe animate-render">
                {forecastData.map((day, idx) => (
                  <div key={idx} className="cal-day-box">
                    <span className="cal-date">{new Date(day.dt * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                    <div className="cal-icon-wrap">{getWeatherIcon(day.weather[0].main, 24)}</div>
                    <span className="cal-temp">{Math.round(day.main.temp)}°C</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'planner' && (
              <div className="planner-view-card animate-render">
                <div className="planner-select-row">
                  <label className="planner-label">
                    SELECT EVENT TRACK:
                  </label>
                  <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                    <option value="shoot">🎥 Cinematic Outdoor Shoot</option>
                    <option value="party">🎵 Terrace Studio Vibe Party</option>
                    <option value="cricket">🏏 Outdoor Sports & Cricket</option>
                    <option value="garden">🌱 Botanical & Home Gardening</option>
                    <option value="travel">🚗 Transit & Highway Travel</option>
                  </select>
                </div>
                
                <div className="planner-result-alert" style={{ borderLeftColor: getEventFeasibility().color }}>
                  <h5 className="feasibility-title" style={{ color: getEventFeasibility().color }}>
                    FEASIBILITY REPORT
                  </h5>
                  <p className="feasibility-text">
                    {getEventFeasibility().text}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'compare' && (
              <div className="compare-workspace-deck animate-render">
                <form onSubmit={handleCompareSearch} className="mini-compare-search">
                  <input type="text" placeholder="સરખામણી કરવા માટે બીજું શહેર લખો..." value={compareCity} onChange={(e) => setCompareCity(e.target.value)} />
                  <button type="submit">Compare</button>
                </form>
                <div className="comparison-columns-grid">
                  <div className="compare-card-node">
                    <h4>{weatherData.name} <small>(Current)</small></h4>
                    <h2>{Math.round(weatherData.main.temp)}°C</h2>
                    <p>Humidity: {weatherData.main.humidity}% | Wind: {weatherData.wind.speed} m/s</p>
                  </div>
                  {compareData && (
                    <div className="compare-card-node target-node animate-render">
                      <h4>{compareData.name}</h4>
                      <h2>{Math.round(compareData.main.temp)}°C</h2>
                      <p>Humidity: {compareData.main.humidity}% | Wind: {compareData.wind.speed} m/s</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ranking' && leaderboard.length > 0 && (
              <div className="ranking-matrix-deck animate-render">
                <div className="leader-widget-row">
                  <div className="leader-mini-box text-amber"><h5>🔥 HIGHEST TEMP</h5><h4>{hottestCity?.name}</h4><h3>{Math.round(hottestCity?.temp)}°C</h3></div>
                  <div className="leader-mini-box text-blue"><h5>❄️ COLD PLACE</h5><h4>{coldestCity?.name}</h4><h3>{Math.round(coldestCity?.temp)}°C</h3></div>
                  <div className="leader-mini-box text-cyan"><h5>🌧️ RAINIEST VIBE</h5><h4>{rainiestCity?.name}</h4><h3>{rainiestCity?.humidity}% Hum</h3></div>
                </div>
              </div>
            )}

            {activeTab === 'aistudio' && weatherData?.ai && (
              <div className="ai-studio-grid animate-render" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* LEFT SIDE: AI SUMMARIES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="planner-view-card" style={{ borderLeft: '4px solid #a855f7' }}>
                    <h4 style={{ color: '#a855f7', fontSize: '11px', letterSpacing: '1px' }}>✨ AI ATMOSPHERIC SUMMARY</h4>
                    <p style={{ fontSize: '13px', marginTop: '6px', fontWeight: '600', color: '#1e293b' }}>"{weatherData.ai.summary}"</p>
                  </div>

                  <div className="planner-view-card">
                    <h5 style={{ fontSize: '11px', color: '#0891b2' }}>✈️ AI Travel Recommendation</h5>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{weatherData.ai.travel}</p>
                  </div>

                  <div className="planner-view-card">
                    <h5 style={{ fontSize: '11px', color: '#14b8a6' }}>👕 AI Outfit Suggestion</h5>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{weatherData.ai.outfit}</p>
                  </div>

                  <div className="planner-view-card">
                    <h5 style={{ fontSize: '11px', color: '#ef4444' }}>🩺 AI Health & Workout</h5>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}><strong>Status:</strong> {weatherData.ai.health} <br/><strong>Routine:</strong> {weatherData.ai.workout}</p>
                  </div>

                  <div className="planner-view-card">
                    <h5 style={{ fontSize: '11px', color: '#f59e0b' }}>🌾 AI Farming Advice</h5>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{weatherData.ai.farming}</p>
                  </div>
                </div>

                {/* RIGHT SIDE: AI SPECTRAL SCORES (FADERS) */}
                <div className="mixer-analytics-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#fff', padding: '20px', borderRadius: '18px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>📊 LIVE LIFESTYLE SPECTROGRAM</h4>
                  
                  <div className="mixer-channel-node" style={{ padding: '5px 0' }}>
                    <span className="channel-label">🧺 PICNIC SCORE MATRIX</span>
                    <div className="channel-value-row"><h3>{weatherData.ai.picnicScore}%</h3></div>
                    <div className="fader-track-bg"><div className="fader-fill-bar bar-cyan" style={{ width: `${weatherData.ai.picnicScore}%` }}></div></div>
                  </div>

                  <div className="mixer-channel-node" style={{ padding: '5px 0' }}>
                    <span className="channel-label">🏖️ BEACH VIBE RATIO</span>
                    <div className="channel-value-row"><h3>{weatherData.ai.beachScore}%</h3></div>
                    <div className="fader-track-bg"><div className="fader-fill-bar bar-purple" style={{ width: `${weatherData.ai.beachScore}%` }}></div></div>
                  </div>

                  <div className="mixer-channel-node" style={{ padding: '5px 0' }}>
                    <span className="channel-label">🚗 DRIVING SAFETY COEFFICIENT</span>
                    <div className="channel-value-row"><h3>{weatherData.ai.drivingScore}%</h3></div>
                    <div className="fader-track-bg"><div className="fader-fill-bar bar-amber" style={{ width: `${weatherData.ai.drivingScore}%` }}></div></div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'aichat' && (
              <div className="planner-view-card animate-render">
                <h4 className="astro-matrix-title" style={{ marginBottom: '15px' }}>💬 ATMOSPHERIC AI CHAT STATION</h4>
                
                {/* CHAT DISPLAY SCREEN */}
                <div className="chat-display-box">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble-row ${msg.role === 'user' ? 'user-end' : 'bot-end'}`}>
                      <div className="chat-bubble">
                        <span className="chat-meta">{msg.role === 'user' ? '📦 YOU' : '✨ AI FREQUENCY'}</span>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-bubble-row bot-end">
                      <div className="chat-bubble loading-bubble">
                        <p>Decoding satellite frequencies...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* INPUT MESSAGE FORM */}
                <form onSubmit={handleSendMessage} className="chat-input-form">
                  <input 
                    type="text" 
                    placeholder="Ask something about today's environment..." 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                  />
                  <button type="submit" disabled={chatLoading || !chatInput.trim()}>SEND</button>
                </form>
              </div>
            )}

          </div>

          {/* BOTTOM FOOTER BUTTON TABS */}
          <footer className="widescreen-bottom-tabs-bar">
            <button className={`footer-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}><Calendar size={14} /> Weather Calendar</button>
            <button className={`footer-tab-btn ${activeTab === 'aistudio' ? 'active' : ''}`} onClick={() => setActiveTab('aistudio')}><Disc className="vinyl-animation" size={14} /> Vatavaranam AI Anlysis</button>
            <button className={`footer-tab-btn ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}><Briefcase size={14} /> Event Planner</button>
            <button className={`footer-tab-btn ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}><ArrowLeftRight size={14} /> Compare Cities</button>
            <button className={`footer-tab-btn ${activeTab === 'ranking' ? 'active' : ''}`} onClick={() => setActiveTab('ranking')}><Trophy size={14} /> Station Rankings</button>
            {/* આ લાઇન ફૂટર બારમાં ગમે ત્યાં બટનની લિસ્ટમાં જોડી દો */}
            <button className={`footer-tab-btn ${activeTab === 'aichat' ? 'active' : ''}`} onClick={() => setActiveTab('aichat')}><Radio className="pulse-heartbeat" size={14} /> Vatavaranam AI Chat</button>
          </footer>

        </div>
      )}
    </div>
  );
}

export default App;