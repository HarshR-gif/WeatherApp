// API Configuration
const API_KEY = "a490a283e1a42624809aaa64e4c7c5a0";
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";
const AIR_QUALITY_API_URL = "https://api.openweathermap.org/data/2.5/air_pollution?";

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loading = document.getElementById('loading');
const weatherGrid = document.getElementById('weather-grid');
const errorMessage = document.getElementById('error-message');

// State management
let currentCity = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadDefaultCity();
});

function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    locationBtn.addEventListener('click', getCurrentLocation);
}

function loadDefaultCity() {
    const defaultCity = localStorage.getItem('lastCity') || 'London';
    fetchWeatherData(defaultCity);
}

async function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
}

async function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherByCoords(latitude, longitude);
        }, showError);
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

async function fetchWeatherData(city) {
    showLoading();
    try {
        const weatherData = await fetchWeather(city);
        const forecastData = await fetchForecast(city);
        const airQualityData = await fetchAirQuality(weatherData.coord.lat, weatherData.coord.lon);
        
        displayWeatherData(weatherData);
        displayForecast(forecastData);
        displayAirQuality(airQualityData);
        
        currentCity = city;
        localStorage.setItem('lastCity', city);
        
        hideLoading();
    } catch (error) {
        showError('Failed to fetch weather data. Please try again.');
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const weatherResponse = await fetch(`${WEATHER_API_URL}&lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        const weatherData = await weatherResponse.json();
        
        const forecastResponse = await fetch(`${FORECAST_API_URL}&lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        const airQualityResponse = await fetch(`${AIR_QUALITY_API_URL}lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        const airQualityData = await airQualityResponse.json();
        
        displayWeatherData(weatherData);
        displayForecast(forecastData);
        displayAirQuality(airQualityData);
        
        currentCity = weatherData.name;
        localStorage.setItem('lastCity', currentCity);
        
        hideLoading();
    } catch (error) {
        showError('Failed to fetch weather data. Please try again.');
    }
}

async function fetchWeather(city) {
    const response = await fetch(`${WEATHER_API_URL}${city}&appid=${API_KEY}`);
    if (!response.ok) throw new Error('City not found');
    return response.json();
}

async function fetchForecast(city) {
    const response = await fetch(`${FORECAST_API_URL}${city}&appid=${API_KEY}`);
    if (!response.ok) throw new Error('Forecast not available');
    return response.json();
}

async function fetchAirQuality(lat, lon) {
    const response = await fetch(`${AIR_QUALITY_API_URL}lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (!response.ok) throw new Error('Air quality data not available');
    return response.json();
}

function displayWeatherData(data) {
    // Update main weather display
    document.getElementById('city-name').textContent = data.name;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('feels-like').textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    
    // Add precipitation data (rain and snow volume from last 3 hours)
    const rainVolume = data.rain ? (data.rain['3h'] || 0) : 0;
    const snowVolume = data.snow ? (data.snow['3h'] || 0) : 0;
    const totalPrecipitation = rainVolume + snowVolume;
    
    let precipitationText = totalPrecipitation.toFixed(1) + " mm";
    if (snowVolume > 0 && rainVolume > 0) {
        precipitationText = `${totalPrecipitation.toFixed(1)} mm`;
    } else if (snowVolume > 0) {
        precipitationText = `${snowVolume.toFixed(1)} mm (Snow)`;
    } else if (rainVolume > 0) {
        precipitationText = `${rainVolume.toFixed(1)} mm (Rain)`;
    }
    
    document.getElementById('precipitation').textContent = precipitationText;
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    // Update date and time
    const now = new Date();
    document.getElementById('date-time').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function displayAirQuality(data) {
    const aqi = data.list[0].main.aqi;
    const components = data.list[0].components;
    
    // Update AQI display
    document.getElementById('aqi-value').textContent = aqi;
    
    const aqiCircle = document.getElementById('aqi-circle');
    const aqiStatus = document.getElementById('aqi-status');
    const aqiDescription = document.getElementById('aqi-description');
    
    // Set AQI status and color
    const aqiLevels = {
        1: { status: 'Good', color: 'good', description: 'Air quality is satisfactory' },
        2: { status: 'Fair', color: 'good', description: 'Air quality is acceptable' },
        3: { status: 'Moderate', color: 'moderate', description: 'Unhealthy for sensitive groups' },
        4: { status: 'Poor', color: 'unhealthy', description: 'Unhealthy air quality' },
        5: { status: 'Very Poor', color: 'hazardous', description: 'Hazardous air quality' }
    };
    
    const level = aqiLevels[aqi];
    aqiCircle.className = `aqi-circle ${level.color}`;
    aqiStatus.textContent = level.status;
    aqiDescription.textContent = level.description;
    
    // Update pollutant levels
    document.getElementById('pm25').textContent = Math.round(components.pm2_5);
    document.getElementById('pm10').textContent = Math.round(components.pm10);
    document.getElementById('o3').textContent = Math.round(components.o3);
}

function displayForecast(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';
    
    // Get 5-day forecast (one entry per day)
    const dailyForecasts = data.list.filter((item, index) => index % 8 === 0).slice(0, 5);
    
    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(forecast.main.temp);
        const icon = forecast.weather[0].icon;
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="day">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather">
            <div class="temp">${temp}°C</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

function showLoading() {
    loading.style.display = 'block';
    weatherGrid.style.display = 'none';
    errorMessage.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
    weatherGrid.style.display = 'grid';
}

function showError(message) {
    hideLoading();
    weatherGrid.style.display = 'none';
    errorMessage.style.display = 'block';
    document.getElementById('error-text').textContent = message || 'An error occurred. Please try again.';
}

function hideError() {
    errorMessage.style.display = 'none';
    weatherGrid.style.display = 'grid';
}

// Utility functions
function formatTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Add CSS animations when content loads
function addAnimations() {
    const cards = document.querySelectorAll('.weather-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

// Initialize animations
document.addEventListener('DOMContentLoaded', addAnimations);
