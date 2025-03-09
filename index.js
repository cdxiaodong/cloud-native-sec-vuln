const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Serve static files from root (optional, if needed)
app.use(express.static('.'));

// Function to recursively find all JSON files in component directories
function findVulnerabilityFiles() {
  const rootPath = __dirname; // Use __dirname instead of '.'
  console.log('Root path:', rootPath);
  console.log('Root dir contents:', fs.readdirSync(rootPath));
  
  const components = fs.readdirSync(rootPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'node_modules' && dirent.name !== 'public')
    .map(dirent => dirent.name);
  
  const vulnerabilities = [];
  
  components.forEach(component => {
    const componentPath = path.join(rootPath, component);
    if (!fs.existsSync(componentPath)) return;
    
    const years = fs.readdirSync(componentPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && /^\d{4}$/.test(dirent.name))
      .map(dirent => dirent.name);
    
    years.forEach(year => {
      const yearPath = path.join(componentPath, year);
      const months = fs.readdirSync(yearPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && /^\d{2}$/.test(dirent.name))
        .map(dirent => dirent.name);
      
      months.forEach(month => {
        const monthPath = path.join(yearPath, month);
        const files = fs.readdirSync(monthPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile() && path.extname(dirent.name) === '.json')
          .map(dirent => dirent.name);
        
        files.forEach(file => {
          const filePath = path.join(monthPath, file);
          try {
            const data = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(data);
            
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
    
    let filteredData = [...vulnerabilityCache];
    
    if (req.query.component) {
      filteredData = filteredData.filter(v => v.component === req.query.component);
    }
    
    if (req.query.year) {
      filteredData = filteredData.filter(v => v.year === req.query.year);
    }
    
    if (req.query.month) {
      filteredData = filteredData.filter(v => v.month === req.query.month);
    }
    
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

module.exports = app;
