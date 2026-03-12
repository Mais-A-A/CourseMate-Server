import express from 'express'
import { connectDatabase } from './src/config/db.js'; 
import {settings} from './src/config/settings.js'

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running!');
});

connectDatabase()
  .then(() => {
    app.listen(settings.serverPort, () => {
      console.log(`Server running on http://localhost:${settings.serverPort}`);
      console.log(`Environment: ${settings.env}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });

export default app;