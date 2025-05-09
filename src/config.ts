import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.TCP_PORTS || !process.env.CLI_PORT) {
  console.error('Error: Required environment variables TCP_PORTS or CLI_PORT are missing.');
  process.exit(1);
}

export const config = {
  host: process.env.HOST!,
  ports: process.env.TCP_PORTS!.split(',').map(Number),
  cliPort: parseInt(process.env.CLI_PORT!, 10),
};

if (config.ports.includes(config.cliPort)) {
  console.error('Error: CLI_PORT cannot be one of the TCP_PORTS. Please use distinct ports.');
  process.exit(1);
}