import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { hashPassword } from '../api/_auth.js';

const rl = createInterface({ input, output });
try {
  const password = await rl.question('Admin password: ');
  if (!password || password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exitCode = 1;
  } else {
    console.log('\nADMIN_PASSWORD_HASH=');
    console.log(hashPassword(password));
  }
} finally {
  rl.close();
}
