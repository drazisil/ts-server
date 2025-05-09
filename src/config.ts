import * as dotenv from 'dotenv';
dotenv.config();

export const HOST = process.env.HOST || '127.0.0.1';
export const PORT = parseInt(process.env.PORT || '3001', 10);
export const CLI_PORT = parseInt(process.env.CLI_PORT || '3002', 10);