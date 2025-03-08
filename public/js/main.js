/**
 * Kubernetes Vulnerability Browser
 * Client-side JavaScript for dynamic content loading and virtual scrolling
 */

// Global state
const state = {
  years: [],
  selectedYear: null,
  months: [],
  selectedMonth: null,
  vulnerabilities: [],
  searchQuery: '',
  loading: false,
  error: null,
  virtualScroll: {
    itemHeight: 120, // Estimated height of each vulnerability card in pixels
    visibleItems: 10, // Number of items visible at once
    startIndex: 0,
    endIndex: 9
  }
};

// DOM elements
const elements = {
  yearList: document.getElementById('year-list'),
  monthList: document.getElementById('month-list'),
  vulnerabilityList: document.getElementById('vulnerability-list'),
  searchInput: document.getElementById('search-input'),
  searchButton: document.getElementById('search-button'),
  loadingIndicator: document.getElementById('loading-indicator'),
  errorToast: document.getElementById('error-toast'),
  errorMessage: document.getElementById('error-message'),
  closeToast: document.getElementById('close-toast')
};

/**
 * API Functions
 */
const api = {
  // Fetch list of available years
  async getYears() {
    showLoading(true);
    try {
      const response = await fetch('/api/years');
      if (!response.ok) throw new Error('Failed to fetch years');
      const data = await response.json();
      showLoading(false);
      return data;
    } catch (error) {
      showError(error.message);
      showLoading(false);
      return [];
    }
  },

  // Fetch months for a specific year
  async getMonths(year) {
    showLoading(true);
    try {
      const response = await fetch(`/api/months/${year}`);
      if (!response.ok) throw new Error(`Failed to fetch months for ${year}`);
      const data = await response.json();
      showLoading(false);
      return data;
    } catch (error) {
      showError(error.message);
      showLoading(false);
      return [];
    }
  },

  // Fetch vulnerabilities for a specific year and month
  async getVulnerabilities(year, month) {
    showLoading(true);
    try {
      const response = await fetch(`/api/vulnerabilities/${year}/${month}`);
      if (!response.ok) throw new Error(`Failed to fetch vulnerabilities for ${year}/${month}`);
      const data = await response.json();
      showLoading(false);
      return data;
    } catch (error) {
      showError(error.message);
      showLoading(false);
      return [];
    }
  },

  // Search vulnerabilities
  async searchVulnerabilities(query) {
    showLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      showLoading(false);
      return data;
    } catch (error) {
      showError(error.message);
      showLoading(false);
      return [];
    }
  }
};

/**
 * UI Rendering Functions
 */

// Render the year list
function renderYears() {
  if (!elements.yearList) return;
  
  elements.yearList.innerHTML = '';
  state.years.forEach(year => {
    const yearItem = document.createElement('li');
    yearItem.classList.add('year-item');
    if (state.selectedYear === year) {
      yearItem.classList.add('selected');
    }
    yearItem.textContent = year;
    yearItem.addEventListener('click', () => selectYear(year));
    elements.yearList.appendChild(yearItem);
  });
}

// Render the month list for a selected year
function renderMonths() {
  if (!elements.monthList) return;
  
  elements.monthList.innerHTML = '';
  state.months.forEach(month => {
    const monthItem = document.createElement('li');
    monthItem.classList.add('month-item');
    if (state.selectedMonth === month) {
      monthItem.classList.add('selected');
    }
    
    // Format the month name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNum = parseInt(month, 10);
    const monthName = monthNames[monthNum - 1] || month;
    
    monthItem.textContent = monthName;
    monthItem.dataset.month = month;
    monthItem.addEventListener('click', () => selectMonth(month));
    elements.monthList.appendChild(monthItem);
  });
}

// Render the vulnerability list with virtual scrolling
function renderVulnerabilities() {
  if (!elements.vulnerabilityList) return;
  
  // Calculate the total height of the container based on all items
  const totalHeight = state.vulnerabilities.length * state.virtualScroll.itemHeight;
  
  // Update the container height to enable scrolling
  elements.vulnerabilityList.style.height = `${state.virtualScroll.visibleItems * state.virtualScroll.itemHeight}px`;
  elements.vulnerabilityList.innerHTML = '';
  
  // Create a spacer div to represent the total content height
  const spacer = document.createElement('div');
  spacer.classList.add('virtual-scroll-spacer');
  spacer.style.height = `${totalHeight}px`;
  elements.vulnerabilityList.appendChild(spacer);
  
  // Render only the visible items
  const { startIndex, endIndex } = state.virtualScroll;
  const visibleVulnerabilities = state.vulnerabilities.slice(startIndex, endIndex + 1);
  
  visibleVulnerabilities.forEach((vuln, index) => {
    const card = createVulnerabilityCard(vuln);
    card.style.position = 'absolute';
    card.style.top = `${(startIndex + index) * state.virtualScroll.itemHeight}px`;
    card.style.width = 'calc(100% - 20px)'; // Account for padding
    elements.vulnerabilityList.appendChild(card);
  });
}

// Create a vulnerability card element
function createVulnerabilityCard(vulnerability) {
  const card = document.createElement('div');
  card.classList.add('vulnerability-card');
  
  const title = document.createElement('h3');
  title.textContent = vulnerability.id || 'Unknown CVE';
  
  const summary = document.createElement('p');
  summary.classList.add('summary');
  summary.textContent = vulnerability.summary || 'No summary available';
  
  const details = document.createElement('div');
  details.classList.add('details');
  
  if (vulnerability.score) {
    const score = document.createElement('span');
    score.classList.add('score');
    score.textContent = `CVSS Score: ${vulnerability.score}`;
    
    // Add severity class based on score
    if (vulnerability.score >= 7) {
      score.classList.add('high');
    } else if (vulnerability.score >= 4) {
      score.classList.add('medium');
    } else {
      score.classList.add('low');
    }
    
    details.appendChild(score);
  }
  
  if (vulnerability.published) {
    const published = document.createElement('span');
    published.classList.add('published');
    const date = new Date(vulnerability.published);
    published.textContent = `Published: ${date.toLocaleDateString()}`;
    details.appendChild(published);
  }
  
  card.appendChild(title);
  card.appendChild(summary);
  card.appendChild(details);
  
  // Highlight search terms if search query exists
  if (state.searchQuery) {
    highlightSearchTerms(card, state.searchQuery);
  }
  
  return card;
}

// Highlight search terms in the content
function highlightSearchTerms(element, query) {
  const terms = query.split(' ').filter(term => term.length > 2);
  if (terms.length === 0) return;
  
  const textNodes = getTextNodes(element);
  textNodes.forEach(node => {
    let text = node.nodeValue;
    terms.forEach(term => {
      const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
      if (regex.test(text)) {
        const span = document.createElement('span');
        const highlighted = text.replace(regex, '<mark>$1</mark>');
        span.innerHTML = highlighted;
        node.parentNode.replaceChild(span, node);
      }
    });
  });
}

// Get all text nodes under an element
function getTextNodes(element) {
  const nodes = [];
  const walk = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walk.nextNode()) {
    nodes.push(node);
  }
  
  return nodes;
}

// Escape special characters for RegExp
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Event Handlers
 */

// Handle year selection
async function selectYear(year) {
  state.selectedYear = year;
  state.selectedMonth = null;
  renderYears();
  
  // Fetch months for the selected year
  const months = await api.getMonths(year);
  state.months = months;
  renderMonths();
  
  // Clear vulnerabilities when only year is selected
  state.vulnerabilities = [];
  renderVulnerabilities();
}

// Handle month selection
async function selectMonth(month) {
  state.selectedMonth = month;
  renderMonths();
  
  // Fetch vulnerabilities for the selected year and month
  if (state.selectedYear && state.selectedMonth) {
    const vulnerabilities = await api.getVulnerabilities(state.selectedYear, state.selectedMonth);
    state.vulnerabilities = vulnerabilities;
    
    // Reset virtual scroll to the top
    state.virtualScroll.startIndex = 0;
    state.virtualScroll.endIndex = Math.min(state.virtualScroll.visibleItems - 1, vulnerabilities.length - 1);
    
    renderVulnerabilities();
  }
}

// Handle search
async function handleSearch() {
  const query = elements.searchInput.value.trim();
  if (query.length < 2) {
    showError('Search query must be at least 2 characters long');
    return;
  }
  
  state.searchQuery = query;
  const results = await api.searchVulnerabilities(query);
  state.vulnerabilities = results;
  
  // Reset selection state as we're now in search mode
  state.selectedYear = null;
  state.selectedMonth = null;
  renderYears();
  renderMonths();
  
  // Reset virtual scroll to the top
  state.virtualScroll.startIndex = 0;
  state.virtualScroll.endIndex = Math.min(state.virtualScroll.visibleItems - 1, results.length - 1);
  
  renderVulnerabilities();
}

// Handle virtual scrolling
function handleScroll() {
  if (!elements.vulnerabilityList || state.vulnerabilities.length === 0) return;
  
  const scrollTop = elements.vulnerabilityList.scrollTop;
  const startIndex = Math.floor(scrollTop / state.virtualScroll.itemHeight);
  const endIndex = Math.min(
    startIndex + state.virtualScroll.visibleItems - 1, 
    state.vulnerabilities.length - 1
  );
  
  if (startIndex !== state.virtualScroll.startIndex || endIndex !== state.virtualScroll.endIndex) {
    state.virtualScroll.startIndex = startIndex;
    state.virtualScroll.endIndex = endIndex;
    renderVulnerabilities();
  }
}

// Handle window resize for responsive virtual scrolling
function handleResize() {
  if (!elements.vulnerabilityList) return;
  
  // Recalculate visible items based on container height
  const containerHeight = elements.vulnerabilityList.clientHeight;
  state.virtualScroll.visibleItems = Math.ceil(containerHeight / state.virtualScroll.itemHeight) + 2; // Add buffer
  
  // Update the visible range
  state.virtualScroll.endIndex = Math.min(
    state.virtualScroll.startIndex + state.virtualScroll.visibleItems - 1, 
    state.vulnerabilities.length - 1
  );
  
  renderVulnerabilities();
}

/**
 * UI Feedback Functions
 */

// Show/hide loading indicator
function showLoading(isLoading) {
  state.loading = isLoading;
  if (elements.loadingIndicator) {
    elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
  }
}

// Show error toast
function showError(message) {
  state.error = message;
  if (elements.errorToast && elements.errorMessage) {
    elements.errorMessage.textContent = message;
    elements.errorToast.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideError();
    }, 5000);
  }
}

// Hide error toast
function hideError() {
  state.error = null;
  if (elements.errorToast) {
    elements.errorToast.classList.remove('show');
  }
}

/**
 * Initialization
 */

// Debounce function for search input
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Initialize the application
async function init() {
  // Fetch the list of years to populate the sidebar
  const years = await api.getYears();
  state.years = years;
  renderYears();
  
  // Set up event listeners
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', debounce(() => {
      if (elements.searchInput.value.trim().length >= 2) {
        handleSearch();
      }
    }, 500));
  }
  
  if (elements.searchButton) {
    elements.searchButton.addEventListener('click', handleSearch);
  }
  
  if (elements.vulnerabilityList) {
    elements.vulnerabilityList.addEventListener('scroll', debounce(handleScroll, 100));
  }
  
  if (elements.closeToast) {
    elements.closeToast.addEventListener('click', hideError);
  }
  
  // Handle window resize for responsive design
  window.addEventListener('resize', debounce(handleResize, 200));
  
  // Initial calculation of visible items
  handleResize();
}

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
