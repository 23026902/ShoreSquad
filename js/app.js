// ShoreSquad App - Interactive Features & Performance Optimizations
class ShoreSquadApp {
  constructor() {
    this.squadData = {
      members: [],
      cleanups: [],
      stats: {
        cleanupsCompleted: 0,
        trashCollected: 0
      }
    };
    
    this.weatherAPI = 'https://api.openweathermap.org/data/2.5';
    this.apiKey = 'YOUR_API_KEY_HERE'; // Replace with actual API key
    this.currentLocation = null;
    this.map = null;
    this.cleanupMarker = null;
    
    this.init();
  }

  // Initialize app
  init() {
    this.setupEventListeners();
    this.loadSavedData();
    this.hideLoadingScreen();
    this.initializeMap();
    this.getCurrentLocation();
    this.loadSampleData();
  }

  // Event Listeners
  setupEventListeners() {
    // Navigation
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav') && navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
        }
      });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // Close mobile menu if open
          navMenu.classList.remove('active');
        }
      });
    });

    // Intersection Observer for animations
    this.setupScrollAnimations();
    
    // Performance: Debounced window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });
  }

  // Hide loading screen with animation
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingIndicator');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 300);
      }, 1500);
    }
  }

  // Get user's current location
  getCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.loadWeatherData();
          this.updateMapLocation();
        },
        (error) => {
          console.log('Location access denied:', error);
          this.useDefaultLocation();
        }
      );
    } else {
      this.useDefaultLocation();
    }
  }

  useDefaultLocation() {
    // Default to Santa Monica, CA
    this.currentLocation = { lat: 34.0195, lng: -118.4912 };
    this.loadWeatherData();
    this.updateMapLocation();
  }

  // Initialize Leaflet map
  initializeMap() {
    // Pasir Ris Beach coordinates
    const pasirRisLat = 1.381497;
    const pasirRisLng = 103.955574;
    
    // Initialize map centered on Pasir Ris
    this.map = L.map('map').setView([pasirRisLat, pasirRisLng], 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);
    
    // Create custom marker for cleanup location
    const cleanupIcon = L.divIcon({
      html: '<div class="custom-marker">🏖️</div>',
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    
    // Add marker with popup
    this.cleanupMarker = L.marker([pasirRisLat, pasirRisLng], {icon: cleanupIcon})
      .addTo(this.map)
      .bindPopup(`
        <div class="custom-popup">
          <h3>🏖️ Pasir Ris Beach</h3>
          <p><strong>📍 Next Cleanup Location</strong></p>
          <p>📅 Coordinates: ${pasirRisLat}, ${pasirRisLng}</p>
          <p>🌊 Perfect spot for beach cleanup!</p>
          <button class="popup-button" onclick="getDirections()">Get Directions</button>
        </div>
      `, {
        maxWidth: 250,
        className: 'custom-popup-wrapper'
      });
    
    // Open popup by default
    this.cleanupMarker.openPopup();
    
    // Add some styling to map controls
    setTimeout(() => {
      const mapControls = document.querySelectorAll('.leaflet-control');
      mapControls.forEach(control => {
        control.style.borderRadius = 'var(--radius-md)';
        control.style.boxShadow = 'var(--shadow-md)';
      });
    }, 100);
  }

  // Weather functionality
  async loadWeatherData() {
    if (!this.currentLocation) return;

    try {
      const response = await fetch(
        `${this.weatherAPI}/weather?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lng}&appid=${this.apiKey}&units=imperial`
      );
      
      if (response.ok) {
        const data = await response.json();
        this.updateWeatherDisplay(data);
      } else {
        this.showMockWeather();
      }
    } catch (error) {
      console.log('Weather API error:', error);
      this.showMockWeather();
    }
  }

  updateWeatherDisplay(data) {
    const temperature = document.getElementById('temperature');
    const conditions = document.getElementById('conditions');
    const location = document.getElementById('location');

    if (temperature) temperature.textContent = `${Math.round(data.main.temp)}°F`;
    if (conditions) conditions.textContent = data.weather[0].description;
    if (location) location.textContent = data.name || 'Your Location';
  }

  showMockWeather() {
    const temperature = document.getElementById('temperature');
    const conditions = document.getElementById('conditions');
    const location = document.getElementById('location');

    if (temperature) temperature.textContent = '72°F';
    if (conditions) conditions.textContent = 'Perfect for beach cleanup!';
    if (location) location.textContent = 'Santa Monica Beach';
  }

  // Map functionality
  updateMapLocation() {
    if (this.map && this.currentLocation) {
      // Add user location marker if different from cleanup location
      const userIcon = L.divIcon({
        html: '<div class="custom-marker" style="background: var(--ocean-deep);">📍</div>',
        className: 'custom-div-icon',
        iconSize: [25, 25],
        iconAnchor: [12.5, 12.5]
      });
      
      L.marker([this.currentLocation.lat, this.currentLocation.lng], {icon: userIcon})
        .addTo(this.map)
        .bindPopup(`
          <div class="custom-popup">
            <h3>📍 Your Location</h3>
            <p>Lat: ${this.currentLocation.lat.toFixed(4)}</p>
            <p>Lng: ${this.currentLocation.lng.toFixed(4)}</p>
          </div>
        `);
    }
  }

  // Squad management
  loadSampleData() {
    this.squadData = {
      members: [
        { name: 'Alex Chen', role: 'Squad Leader', cleanups: 12 },
        { name: 'Maya Rodriguez', role: 'Eco Warrior', cleanups: 8 },
        { name: 'Jake Thompson', role: 'Beach Scout', cleanups: 15 },
        { name: 'Emma Park', role: 'Social Coordinator', cleanups: 6 }
      ],
      cleanups: [
        {
          id: 1,
          title: 'Santa Monica Pier Cleanup',
          date: '2025-12-15',
          time: '09:00 AM',
          location: 'Santa Monica Pier',
          participants: 24,
          status: 'upcoming'
        },
        {
          id: 2,
          title: 'Malibu Beach Warriors',
          date: '2025-12-22',
          time: '08:00 AM', 
          location: 'Malibu Beach',
          participants: 18,
          status: 'upcoming'
        },
        {
          id: 3,
          title: 'Venice Beach Squad',
          date: '2025-12-08',
          time: '10:00 AM',
          location: 'Venice Beach',
          participants: 32,
          status: 'completed'
        }
      ],
      stats: {
        cleanupsCompleted: 8,
        trashCollected: 342
      }
    };

    this.updateStatsDisplay();
    this.renderCleanups();
    this.renderSquadMembers();
  }

  updateStatsDisplay() {
    const squadMembers = document.getElementById('squadMembers');
    const cleanupsCompleted = document.getElementById('cleanupsCompleted');
    const trashCollected = document.getElementById('trashCollected');

    if (squadMembers) {
      this.animateCounter(squadMembers, this.squadData.members.length);
    }
    if (cleanupsCompleted) {
      this.animateCounter(cleanupsCompleted, this.squadData.stats.cleanupsCompleted);
    }
    if (trashCollected) {
      this.animateCounter(trashCollected, this.squadData.stats.trashCollected);
    }
  }

  animateCounter(element, target, duration = 1000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      element.textContent = Math.floor(start);
      if (start >= target) {
        element.textContent = target;
        clearInterval(timer);
      }
    }, 16);
  }

  renderCleanups() {
    const cleanupGrid = document.getElementById('cleanupGrid');
    if (!cleanupGrid) return;

    const upcomingCleanups = this.squadData.cleanups.filter(c => c.status === 'upcoming');
    
    cleanupGrid.innerHTML = upcomingCleanups.map(cleanup => `
      <div class="cleanup-card" onclick="shoreSquad.joinCleanup(${cleanup.id})">
        <h3>${cleanup.title}</h3>
        <div class="cleanup-details">
          <p>📅 ${cleanup.date}</p>
          <p>⏰ ${cleanup.time}</p>
          <p>📍 ${cleanup.location}</p>
          <p>👥 ${cleanup.participants} participants</p>
        </div>
        <button class="btn btn-primary" style="margin-top: 1rem;">Join Cleanup</button>
      </div>
    `).join('');

    // Add CSS for cleanup cards dynamically
    this.addCleanupCardStyles();
  }

  addCleanupCardStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .cleanup-card {
        background: var(--white);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-md);
        transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        cursor: pointer;
      }
      .cleanup-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-xl);
      }
      .cleanup-card h3 {
        color: var(--ocean-deep);
        margin-bottom: var(--spacing-md);
      }
      .cleanup-details p {
        margin-bottom: var(--spacing-xs);
        color: var(--gray-600);
      }
    `;
    document.head.appendChild(style);
  }

  renderSquadMembers() {
    const squadMembersList = document.getElementById('squadMembersList');
    if (!squadMembersList) return;

    squadMembersList.innerHTML = `
      <h3 style="margin-bottom: 1rem; color: var(--ocean-deep);">Squad Members</h3>
      <div class="members-grid">
        ${this.squadData.members.map(member => `
          <div class="member-card">
            <div class="member-avatar">👤</div>
            <h4>${member.name}</h4>
            <p>${member.role}</p>
            <span class="member-cleanups">${member.cleanups} cleanups</span>
          </div>
        `).join('')}
      </div>
    `;

    this.addMemberCardStyles();
  }

  addMemberCardStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .members-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-md);
      }
      .member-card {
        background: var(--sand-light);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        text-align: center;
        transition: transform var(--transition-fast);
      }
      .member-card:hover {
        transform: translateY(-2px);
      }
      .member-avatar {
        font-size: 2rem;
        margin-bottom: var(--spacing-sm);
      }
      .member-card h4 {
        color: var(--ocean-deep);
        margin-bottom: var(--spacing-xs);
      }
      .member-card p {
        color: var(--gray-600);
        font-size: 0.9rem;
        margin-bottom: var(--spacing-xs);
      }
      .member-cleanups {
        background: var(--coral-bright);
        color: var(--white);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-full);
        font-size: 0.8rem;
        font-weight: var(--font-weight-medium);
      }
    `;
    document.head.appendChild(style);
  }

  // Scroll animations with Intersection Observer
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe sections for animation
    document.querySelectorAll('.section').forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(30px)';
      section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(section);
    });
  }

  // Handle window resize
  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768) {
      const navMenu = document.querySelector('.nav-menu');
      if (navMenu) navMenu.classList.remove('active');
    }
  }

  // Local storage management
  loadSavedData() {
    const savedData = localStorage.getItem('shoreSquadData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        this.squadData = { ...this.squadData, ...parsedData };
      } catch (error) {
        console.log('Error loading saved data:', error);
      }
    }
  }

  saveData() {
    try {
      localStorage.setItem('shoreSquadData', JSON.stringify(this.squadData));
    } catch (error) {
      console.log('Error saving data:', error);
    }
  }

  // Public methods for UI interactions
  joinCleanup(cleanupId) {
    const cleanup = this.squadData.cleanups.find(c => c.id === cleanupId);
    if (cleanup) {
      cleanup.participants += 1;
      this.renderCleanups();
      this.saveData();
      this.showToast(`Joined ${cleanup.title}! 🌊`);
    }
  }

  createCleanup() {
    this.showToast('Create Cleanup feature coming soon! 🚧');
  }

  showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--ocean-deep);
      color: var(--white);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      transform: translateX(100%);
      transition: transform var(--transition-normal);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Global functions for HTML onclick handlers
function startCleanup() {
  shoreSquad.showToast('Starting new cleanup session! 🏖️');
}

function joinSquad() {
  shoreSquad.showToast('Welcome to the squad! 🌊');
}

function createCleanup() {
  shoreSquad.createCleanup();
}

function showLocationDetails() {
  shoreSquad.showToast('📍 Pasir Ris Beach - Perfect for beach cleanup! 🏖️', 4000);
}

function getDirections() {
  const coordinates = '1.381497,103.955574';
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates}`;
  window.open(mapsUrl, '_blank');
  shoreSquad.showToast('Opening directions to Pasir Ris Beach! 🗺️');
}

// Performance optimizations
// Service Worker registration for caching (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(error => console.log('SW registration failed'));
  });
}

// Critical resource hints
const link = document.createElement('link');
link.rel = 'dns-prefetch';
link.href = '//api.openweathermap.org';
document.head.appendChild(link);

// Initialize app when DOM is loaded
let shoreSquad;
document.addEventListener('DOMContentLoaded', () => {
  shoreSquad = new ShoreSquadApp();
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShoreSquadApp;
}