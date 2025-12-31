const express = require('express');
const runSnackBot = require('./snack');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    await runSnackBot();
    res.send('Snack bot executed successfully!');
  } catch (err) {
    res.status(500).send('Error running snack bot: ' + err.message);
  }
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
