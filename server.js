import dotenv from 'dotenv';
import app from './app.js';
import database from './db/db.js';

dotenv.config();

const port = process.env.PORT || 5001;

app.listen(port, async () => {
  await database();
  console.log(`Server is running on http://localhost:${port}`);
});
