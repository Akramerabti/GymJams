// Test webhook endpoint
import express from 'express';
import fetch from 'node-fetch';

const app = express();

// Test endpoint to verify webhook is accessible
app.get('/test-webhook', async (req, res) => {
  try {
    const response = await fetch('https://gymjams.onrender.com/api/subscription/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });
    
    console.log('Response status:', response.status);
    console.log('Response text:', await response.text());
    
    res.json({
      status: response.status,
      accessible: response.status !== 404
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3002, () => {
  console.log('Test server running on port 3002');
  console.log('Visit http://localhost:3002/test-webhook to test');
});
