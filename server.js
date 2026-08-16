import dotenv from 'dotenv';
import dns from 'dns';
import app from './app.js';
import database from './db/db.js';
import { verifyEmailService } from './controller/contact.js';

dotenv.config();

// Force IPv4 first to prevent Render IPv6 ENETUNREACH error
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const port = process.env.PORT || 5001;

app.listen(port, async () => {
  await database();
  console.log(`Server is running on http://localhost:${port}`);
  await verifyEmailService();
});
