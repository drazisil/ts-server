#!/usr/bin/env node
import { Socket } from 'node:net';
import readline from 'node:readline';
import { config } from './config.ts';

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
    console.log('  banned - View all banned IPs');
    console.log('  unban <ip> - Remove an IP from the banned list');
    console.log('  exit  - Close the CLI');
    console.log('  help  - Show this help message');
  } else if (command === 'banned') {
    socket.write('banned\n');
  } else if (command.startsWith('unban ')) {
    const ip = command.split(' ')[1];
    if (ip) {
      socket.write(`unban ${ip}\n`);
    } else {
      console.log('Usage: unban <ip>');
    }
  } else {
    socket.write(line + '\n');
  }
});
