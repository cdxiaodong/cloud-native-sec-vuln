const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Function to recursively find all JSON files in component directories
function findVulnerabilityFiles() {
  const components = fs.readdirSync('.', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'node_modules' && dirent.name !== 'public')
    .map(dirent => dirent.name);
  
  const vulnerabilities = [];
  
  components.forEach(component => {
    // Check if component directory exists
    if (!fs.existsSync(component)) return;
    
    const yearsPath = path.join('.', component);
    // Get all year directories
    const years = fs.readdirSync(yearsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && /^\d{4}$/.test(dirent.name))
      .map(dirent => dirent.name);
    
    years.forEach(year => {
      const monthsPath = path.join(yearsPath, year);
      // Get all month directories
      const months = fs.readdirSync(monthsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && /^\d{2}$/.test(dirent.name))
        .map(dirent => dirent.name);
      
      months.forEach(month => {
        const vulnerabilitiesPath = path.join(monthsPath, month);
        // Get all JSON files
        const files = fs.readdirSync(vulnerabilitiesPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile() && path.extname(dirent.name) === '.json')
          .map(dirent => dirent.name);
        
        files.forEach(file => {
          const filePath = path.join(vulnerabilitiesPath, file);
          try {
            const data = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(data);
            
            // Extract relevant information
            const vulnerability = {
              id: path.basename(file, '.json'),
              component,
              year,
              month,
              summary: json.summary || 'No summary available',
              description: json.description || 'No description available',
              severity: json.severity || 'Unknown',
              date: `${year}-${month}`,
              filePath
            };
            
            vulnerabilities.push(vulnerability);
          } catch (error) {
            console.error(`Error processing ${filePath}: ${error.message}`);
          }
        });
      });
    });
  });
  
  return vulnerabilities;
}

// Cache for vulnerability data
let vulnerabilityCache = null;

// API endpoint to get all vulnerabilities
app.get('/api/vulnerabilities', (req, res) => {
  try {
    if (!vulnerabilityCache) {
      console.log('Building vulnerability cache...');
      vulnerabilityCache = findVulnerabilityFiles();
      console.log(`Found ${vulnerabilityCache.length} vulnerabilities`);
    }
    
    // Apply filters if provided
    let filteredData = [...vulnerabilityCache];
    
    // Filter by component
    if (req.query.component) {
      filteredData = filteredData.filter(v => v.component === req.query.component);
    }
    
    // Filter by year
    if (req.query.year) {
      filteredData = filteredData.filter(v => v.year === req.query.year);
    }
    
    // Filter by month
    if (req.query.month) {
      filteredData = filteredData.filter(v => v.month === req.query.month);
    }
    
    // Get unique components and dates for filters
    const components = [...new Set(vulnerabilityCache.map(v => v.component))];
    const years = [...new Set(vulnerabilityCache.map(v => v.year))];
    const months = [...new Set(vulnerabilityCache.map(v => v.month))];
    
    res.json({
      vulnerabilities: filteredData,
      filters: {
        components,
        years,
        months
      }
    });
  } catch (error) {
    console.error('Error retrieving vulnerabilities:', error);
    res.status(500).json({ error: 'Failed to retrieve vulnerabilities' });
  }
});

// API endpoint to get a specific vulnerability
app.get('/api/vulnerabilities/:id', (req, res) => {
  try {
    if (!vulnerabilityCache) {
      vulnerabilityCache = findVulnerabilityFiles();
    }
    
    const vulnerability = vulnerabilityCache.find(v => v.id === req.params.id);
    
    if (!vulnerability) {
      return res.status(404).json({ error: 'Vulnerability not found' });
    }
    
    res.json(vulnerability);
  } catch (error) {
    console.error('Error retrieving vulnerability:', error);
    res.status(500).json({ error: 'Failed to retrieve vulnerability' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Cloud Native Security Vulnerability Knowledge Base running on http://localhost:${PORT}`);
});

