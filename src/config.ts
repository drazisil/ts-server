import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.TCP_PORT || !process.env.CLI_PORT) {
  console.error('Error: Required environment variables PORT or CLI_PORT are missing.');
  process.exit(1);
}

export const config = {
  host: process.env.HOST!,
  port: parseInt(process.env.TCP_PORT!),
  cliPort: parseInt(process.env.CLI_PORT!),
};