#!/usr/bin/env node
// SJSU CMPE 138 SPRING 2026 TEAM2
// Run: node scripts/hash-password.js
// Generates bcrypt hashes for sample_data.sql seed accounts.

// Run from backend: node ../scripts/hash-password.js
const bcrypt = require('bcrypt');

const adminHash = bcrypt.hashSync('admin123', 10);
const studentHashes = ['student1', 'student2', 'student3', 'student4', 'student5'].map(p => bcrypt.hashSync(p, 10));
const advisorHashes = ['advisor1', 'advisor2', 'advisor3'].map(p => bcrypt.hashSync(p, 10));

console.log('-- Paste these into sample_data.sql:');
console.log('-- Admin (admin123):', adminHash);
studentHashes.forEach((h, i) => console.log(`-- Student${i + 1}:`, h));
advisorHashes.forEach((h, i) => console.log(`-- Advisor${i + 1}:`, h));
