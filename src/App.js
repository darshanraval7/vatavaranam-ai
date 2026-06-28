import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, CloudLightning, CloudSnow, Disc, Sliders, Radio, Compass, Gauge, Activity, Eye, Sunrise, Sunset, Calendar, Briefcase, TramFront, Sprout } from 'lucide-react';
import './App.css';

const API_KEY = "1d30e0668b384c4d133dc45fe617b03b"; 

function App() {
  const [city, setCity] = useState('Visnagar');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dayProgress, setDayProgress] = useState(50);
  const [weatherVibe, setWeatherVibe] = useState('vibe-clear');
  
  // સ્માર્ટ ટૂલ્સ માટે સ્ટેટ મિકેનિઝમ
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedEvent, setSelectedEvent] = useState('shoot');

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const fetchWeather = async (searchCity) => {
    setLoading(true);
    setError('');
    try {
      const currentRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&units=metric&appid=${API_KEY}`
      );
      setWeatherData(currentRes.data);

      const mainState = currentRes.data.weather[0].main;
      if (mainState === 'Clear') setWeatherVibe('vibe-clear');
      else if (mainState === 'Clouds') setWeatherVibe('vibe-clouds');
      else if (['Rain', 'Drizzle', 'Thunderstorm'].includes(mainState)) setWeatherVibe('vibe-rain');
      else setWeatherVibe('vibe-mist');

      if (currentRes.data.sys.sunrise && currentRes.data.sys.sunset) {
        const total = currentRes.data.sys.sunset - currentRes.data.sys.sunrise;
        const current = (Math.floor(Date.now() / 1000)) - currentRes.data.sys.sunrise;
        const pct = Math.min(Math.max(Math.round((current / total) * 100), 0), 100);
        setDayProgress(pct);
      }

      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${searchCity}&units=metric&appid=${API_KEY}`
      );
      
      const dailyData = forecastRes.data.list.filter(item => item.dt_txt.includes("12:00:00"));
      setForecastData(dailyData);
      
    } catch (err) {
      setError('Frequency offline. Double check city name.');
    } finally {
      setTimeout(() => setLoading(false), 1200);
    }
  };

  useEffect(() => {
    fetchWeather(city);
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

  // 1. EVENT PLANNER ENGINE LOGIC
  const getEventFeasibility = () => {
    if (!weatherData) return { text: 'No Data', color: '#64748b' };
    const temp = weatherData.main.temp;
    const isRain = weatherData.weather[0].main === 'Rain' || weatherData.weather[0].main === 'Thunderstorm';
    const wind = weatherData.wind.speed;

    if (selectedEvent === 'shoot') {
      if (isRain) return { text: 'વરસાદ છે! આઉટડોર શૂટ કેન્સલ કરો અથવા ઇન્ડોર્સ સેટ કરો.', color: '#ef4444' };
      if (temp > 38) return { text: 'ભારે ગરમી છે! બપોરે શૂટિંગ કરવાનું ટાળો.', color: '#f59e0b' };
      return { text: 'સિનેમેટિક શૂટ માટે એકદમ પર્ફેક્ટ સોફ્ટ એટમોસ્ફિયર!', color: '#10b981' };
    }
    if (selectedEvent === 'party') {
      if (isRain || wind > 10) return { text: 'પવન કે વરસાદ વધુ છે, ટેરેસ પાર્ટી ઇન્ડોર હોલમાં શિફ્ટ કરો.', color: '#ef4444' };
      return { text: 'જોરદાર વાતાવરણ! ટેરેસ અથવા ઓપન-ગ્રાઉન્ડ ઇવેન્ટ કરી શકો છો.', color: '#10b981' };
    }
    if (selectedEvent === 'sports') {
      if (isRain) return { text: 'મેદાન ભીનું હોઈ શકે છે, રમત મોકૂફ રાખવી હિતાવહ છે.', color: '#f59e0b' };
      return { text: 'ખેલો દિલથી! સ્પોર્ટ્સ મેચ માટે મસ્ત સુહાનુ વાતાવરણ.', color: '#10b981' };
    }
  };

  // 2. TRAVEL SCORE LOGIC
  const getTravelScore = (dayData) => {
    let score = 10;
    const main = dayData.weather[0].main;
    if (main === 'Rain' || main === 'Drizzle') score -= 3;
    if (main === 'Thunderstorm') score -= 6;
    if (main === 'Snow') score -= 5;
    if (dayData.main.temp > 38 || dayData.main.temp < 5) score -= 2;
    return score;
  };

  return (
    <div className={`bright-lofi-station ${weatherVibe}`}>
      <div className="pastel-aura-1"></div>
      <div className="pastel-aura-2"></div>

      {loading && (
        <div className="cloud-loader-container">
          <div className="cloud-studio-art">
            <div className="cloud-element main-cloud"></div>
            <div className="cloud-element back-cloud"></div>
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
          <p className="cloud-loading-text">Syncing Atmospheric Waves...</p>
        </div>
      )}

      {!loading && (
        <div className="studio-deck-card animate-slide-up">
          
          <header className="deck-header">
            <div className="deck-brand">
              <Disc className="vinyl-animation text-cyan" size={18} />
              <h2>Atmosphere<span>.studio</span></h2>
            </div>
            
            <form onSubmit={handleSearch} className="deck-search-bar">
              <input 
                type="text" 
                placeholder="Track city station..." 
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <button type="submit"><Search size={14} /></button>
            </form>
          </header>

          {error && <div className="deck-status error-vibe">{error}</div>}

          {weatherData && !error && (
            <div className="deck-workspace">
              
              {/* CURRENT TRACK BANNER */}
              <div className="current-track-banner">
                <div className="track-album-art floating-animation">
                  {getWeatherIcon(weatherData.weather[0].main, 64)}
                </div>
                <div className="track-metadata">
                  <div className="live-pill"><Radio size={11} /> LIVE FEED</div>
                  <h1 className="track-title">{weatherData.name}</h1>
                  <p className="track-subtitle">{weatherData.weather[0].description.toUpperCase()}</p>
                </div>
                <div className="track-metric-value">
                  <h2>{Math.round(weatherData.main.temp)}°<span>C</span></h2>
                </div>
                
                <div className="waveform-container">
                  <span className="wave-bar bar-1"></span>
                  <span className="wave-bar bar-2"></span>
                  <span className="wave-bar bar-3"></span>
                  <span className="wave-bar bar-4"></span>
                  <span className="wave-bar bar-5"></span>
                </div>
              </div>

              {/* TIMELINE PROGRESS SCRUB BAR */}
              <div className="audio-scrub-container">
                <div className="scrub-time-labels">
                  <span className="sun-time-node"><Sunrise size={12} /> {formatTime(weatherData.sys.sunrise)}</span>
                  <span className="scrub-center-tag">DAYTIME PROGRESS</span>
                  <span className="sun-time-node"><Sunset size={12} /> {formatTime(weatherData.sys.sunset)}</span>
                </div>
                <div className="scrub-track-bg">
                  <div className="scrub-progress-fill" style={{ width: `${dayProgress}%` }}></div>
                  <div className="scrub-handle-knob" style={{ left: `${dayProgress}%` }}></div>
                </div>
              </div>

              {/* MIXER ANALYTICS MATRIX */}
              <div className="mixer-analytics-dashboard">
                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">FEELS LIKE</span>
                  <div className="channel-value-row">
                    <Thermometer size={14} className="text-cyan" />
                    <h3>{Math.round(weatherData.main.feels_like)}°C</h3>
                  </div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-cyan" style={{width: '75%'}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">HUMIDITY</span>
                  <div className="channel-value-row">
                    <Droplets size={14} className="text-purple" />
                    <h3>{weatherData.main.humidity}%</h3>
                  </div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-purple" style={{width: `${weatherData.main.humidity}%`}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">WIND VELOCITY</span>
                  <div className="channel-value-row">
                    <Wind size={14} className="text-amber" />
                    <h3>{weatherData.wind.speed} <small>m/s</small></h3>
                  </div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-amber" style={{width: '45%'}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">WIND DIRECTION</span>
                  <div className="channel-value-row">
                    <Compass size={14} className="text-blue" />
                    <h3>{weatherData.wind.deg}°</h3>
                  </div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-blue" style={{width: `${(weatherData.wind.deg / 360) * 100}%`}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">VISIBILITY</span>
                  <div className="channel-value-row">
                    <Eye size={14} className="text-teal" />
                    <h3>{(weatherData.visibility / 1000).toFixed(1)} <small>km</small></h3>
                  </div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-teal" style={{width: `${(weatherData.visibility / 10000) * 100}%`}}></div></div>
                </div>

                <div className="mixer-channel-node card-glow-hover">
                  <span className="channel-label">BAROMETRIC PRESSURE</span>
                  <div className="channel-value-row">
                    <Gauge size={14} className="text-slate" />
                    <h3>{weatherData.main.pressure} <small>hPa</small></h3>
                    <Activity size={14} className="pulse-heartbeat text-cyan ms-auto" />
                  </div>
                  <div className="fader-track-bg"><div className="fader-fill-bar bar-slate" style={{width: '65%'}}></div></div>
                </div>
              </div>

              {/* ================= ULTRA-ADVANCE TABS UTILITY NAV ================= */}
              <div className="smart-tabs-navigation">
                <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}><Calendar size={14} /> Weather Calendar</button>
                <button className={`tab-btn ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}><Briefcase size={14} /> Event Planner</button>
                <button className={`tab-btn ${activeTab === 'travel' ? 'active' : ''}`} onClick={() => setActiveTab('travel')}><TramFront size={14} /> Best Travel Days</button>
                <button className={`tab-btn ${activeTab === 'farming' ? 'active' : ''}`} onClick={() => setActiveTab('farming')}><Sprout size={14} /> Farming Matrix</button>
              </div>

              {/* TAB CONTENTS WORKSPACE */}
              <div className="smart-tab-content-panel">
                
                {/* 1. WEATHER CALENDAR VIEW */}
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

                {/* 2. EVENT WEATHER PLANNER VIEW */}
                {activeTab === 'planner' && (
                  <div className="planner-view-card animate-render">
                    <div className="planner-select-row">
                      <label>Select Your Event Track:</label>
                      <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                        <option value="shoot">Cinematic Outdoor Shoot</option>
                        <option value="party">Terrace Vibe Party</option>
                        <option value="sports">Outdoor Cricket/Sports Match</option>
                      </select>
                    </div>
                    <div className="planner-result-alert" style={{ borderLeftColor: getEventFeasibility().color }}>
                      <p style={{ color: getEventFeasibility().color }}>{getEventFeasibility().text}</p>
                    </div>
                  </div>
                )}

                {/* 3. BEST TRAVEL DAYS VIEW */}
                {activeTab === 'travel' && (
                  <div className="travel-list-scroller animate-render">
                    {forecastData.map((day, idx) => {
                      const score = getTravelScore(day);
                      return (
                        <div key={idx} className="travel-row-node">
                          <span className="t-day">{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                          <div className="t-score-indicator">
                            <div className="t-score-fill" style={{ width: `${score * 10}%`, backgroundColor: score > 7 ? '#10b981' : score > 4 ? '#f59e0b' : '#ef4444' }}></div>
                          </div>
                          <span className="t-badge" style={{ color: score > 7 ? '#10b981' : score > 4 ? '#f59e0b' : '#ef4444' }}>Vibe Score: {score}/10</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. FARMING CALENDAR MATRIX VIEW */}
                {activeTab === 'farming' && (
                  <div className="farming-matrix-panel animate-render">
                    <div className="farm-stat-card">
                      <h5>🌾 દવાનો છંટકાવ (Pesticide Spray)</h5>
                      <p>{weatherData.wind.speed > 6 ? '❌ પવનની ગતિ વધુ છે, અત્યારે ખેતરમાં દવાનો કે ખાતરનો છંટકાવ ના કરવો.' : '✅ પવન શાંત છે, દવાનો છંટકાવ કરવા માટે અનુકૂળ સમય છે.'}</p>
                    </div>
                    <div className="farm-stat-card">
                      <h5>💧 પાક સિંચાઈ (Crop Irrigation)</h5>
                      <p>{weatherData.main.humidity > 80 ? '🌧️ હવામાં ભેજ ખૂબ વધારે છે અથવા વરસાદી માહોલ છે, કૂવામાંથી પાણી પાવાનું મોકૂફ રાખી શકો છો.' : '☀️ જમીન સૂકી થવાની સંભાવના છે, પાકને જરૂરિયાત મુજબ પાણી આપવું.'}</p>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;