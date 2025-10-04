const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'https://createnko-guru-trend.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Claude API proxy endpoint
app.post('/api/claude', async (req, res) => {
  try {
    console.log('Received request to Claude API:', req.body);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API Error:', errorData);
      return res.status(response.status).json({
        error: `Claude API Error: ${errorData.error?.message || response.statusText}`
      });
    }

    const data = await response.json();
    console.log('Claude API Response:', data);
    
    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: 'Failed to fetch from Claude API',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Claude API proxy: http://localhost:${PORT}/api/claude`);
});

module.exports = app;
