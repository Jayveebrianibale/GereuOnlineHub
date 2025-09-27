const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Test notification endpoint
app.post('/api/send-notification', (req, res) => {
  const { tokens, title, body, data } = req.body;
  
  console.log('Received notification request:', { tokens, title, body, data });
  
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({ error: 'No tokens provided' });
  }
  
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  // For now, just return success without actually sending
  res.json({
    success: true,
    successCount: tokens.length,
    failureCount: 0,
    messageId: 'test-message-id',
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log('📱 Endpoints available:');
  console.log('  GET /test - Test endpoint');
  console.log('  POST /api/send-notification - Test notification endpoint');
});

module.exports = app;
