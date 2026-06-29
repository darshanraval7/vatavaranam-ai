import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, CloudLightning, CloudSnow, Disc, Radio, Compass, Gauge, Eye, Sunrise, Sunset, Calendar, Briefcase, ArrowLeftRight, Trophy } from 'lucide-react';
import './App.css';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY; 

function App() {
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
      console.log('Station frequency offline. Try again.');
    } finally {
      // લૉફાઇ ક્લાઉડ લોડર સરસ રીતે દેખાય એટલે સેકન્ડનો હોલ્ડ
      setTimeout(() => setLoading(false), 1200);
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
    if (!weatherData) return { text: 'No Data', color: '#64748b' };
    const isRain = ['Rain', 'Thunderstorm'].includes(weatherData.weather[0].main);
    if (selectedEvent === 'shoot') {
      if (isRain) return { text: 'વરસાદી ટ્રેક ચાલુ છે! આઉટડોર શૂટ ઇન્ડોર્સ શિફ્ટ કરો.', color: '#ef4444' };
      return { text: 'આઉટડોર સિનેમેટિક શૂટ માટે એકદમ પર્ફેક્ટ સોફ્ટ લાઇટિંગ વાઇબ.', color: '#10b981' };
    }
    return { text: 'વાતાવરણ અનુકૂળ છે, ઇવેન્ટ પ્લાન રેડી કરી શકો છો.', color: '#10b981' };
  };

  const hottestCity = [...leaderboard].sort((a, b) => b.temp - a.temp)[0];
  const coldestCity = [...leaderboard].sort((a, b) => a.temp - b.temp)[0];
  const rainiestCity = leaderboard.find(c => ['Rain', 'Thunderstorm'].includes(c.condition)) || [...leaderboard].sort((a, b) => b.humidity - a.humidity)[0];

  return (
    <div className={`full-page-studio ${weatherVibe}`}>
      <div className="pastel-aura-1"></div>
      <div className="pastel-aura-2"></div>

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
            </div>
            
            <form onSubmit={handleSearch} className="nav-center-search">
              <input type="text" placeholder="Search station city..." value={city} onChange={(e) => setCity(e.target.value)} />
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
                <div className="scrub-time-labels">
                  <span className="sun-time-node"><Sunrise size={12} /> {formatTime(weatherData.sys.sunrise)}</span>
                  <span className="scrub-center-tag">DAYTIME SPECTRUM</span>
                  <span className="sun-time-node"><Sunset size={12} /> {formatTime(weatherData.sys.sunset)}</span>
                </div>
                <div className="scrub-track-bg">
                  <div className="scrub-progress-fill" style={{ width: `${dayProgress}%` }}></div>
                  <div className="scrub-handle-knob" style={{ left: `${dayProgress}%` }}></div>
                </div>
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
                  <label>Select Event Track:</label>
                  <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                    <option value="shoot">Cinematic Outdoor Shoot</option>
                    <option value="party">Terrace Vibe Party</option>
                  </select>
                </div>
                <div className="planner-result-alert" style={{ borderLeftColor: getEventFeasibility().color }}>
                  <p style={{ color: getEventFeasibility().color }}>{getEventFeasibility().text}</p>
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
          </div>

          {/* BOTTOM FOOTER BUTTON TABS */}
          <footer className="widescreen-bottom-tabs-bar">
            <button className={`footer-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}><Calendar size={14} /> Weather Calendar</button>
            <button className={`footer-tab-btn ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}><Briefcase size={14} /> Event Planner</button>
            <button className={`footer-tab-btn ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}><ArrowLeftRight size={14} /> Compare Cities</button>
            <button className={`footer-tab-btn ${activeTab === 'ranking' ? 'active' : ''}`} onClick={() => setActiveTab('ranking')}><Trophy size={14} /> Station Rankings</button>
          </footer>

        </div>
      )}
    </div>
  );
}

export default App;