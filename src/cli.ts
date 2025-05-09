#!/usr/bin/env node
import { Socket } from 'node:net';
import readline from 'node:readline';
import { config } from './config.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const socket = new Socket();

socket.connect(config.cliPort, config.host, () => {
  console.log(`Connected to CLI server at ${config.host}:${config.cliPort}. Type your commands below:`);
});

socket.on('data', (data) => {
  console.log(data.toString());
});

socket.on('close', () => {
  console.log('Connection closed.');
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

rl.on('line', (line) => {
  const command = line.trim().toLowerCase();

  if (command === 'exit') {
    socket.end();
    rl.close();
  } else if (command === 'help') {
    console.log('Available commands:');
    console.log('  stats - Show server statistics');
    console.log('  exit  - Close the CLI');
    console.log('  help  - Show this help message');
  } else {
    socket.write(line + '\n');
  }
});
