#!/usr/bin/env node
/**
 * Test script to verify error class names are preserved after minification.
 * 
 * Run: node scripts/test-error-names.mjs
 * 
 * Note: error.name is explicitly set in constructors, so it always works.
 * The --keep-names flag affects error.constructor.name and stack traces.
 */

import { 
  MonimeApiError, 
  MonimeValidationError, 
  MonimeTimeoutError, 
  MonimeNetworkError,
  MonimeError 
} from '../dist/index.js';

console.log('='.repeat(60));
console.log('Testing Error Class Names After Minification');
console.log('='.repeat(60));
console.log();

// Test all error types
const errors = [
  { error: new MonimeError('Base error'), expected: 'MonimeError' },
  { error: new MonimeApiError('API error', 400, 'bad_request', []), expected: 'MonimeApiError' },
  { error: new MonimeValidationError('Validation failed', []), expected: 'MonimeValidationError' },
  { error: new MonimeTimeoutError(5000, 'https://api.monime.io'), expected: 'MonimeTimeoutError' },
  { error: new MonimeNetworkError('Connection refused'), expected: 'MonimeNetworkError' },
];

console.log('Error Names (explicit this.name - always works):');
console.log('-'.repeat(50));
for (const { error, expected } of errors) {
  const passed = error.name === expected;
  console.log(`${passed ? 'yes' : 'no'} error.name: ${error.name}`);
}

console.log();
console.log('Constructor Names (affected by --keep-names):');
console.log('-'.repeat(50));
let constructorNamesOk = true;
for (const { error, expected } of errors) {
  const actual = error.constructor.name;
  const passed = actual === expected;
  if (!passed) constructorNamesOk = false;
  console.log(`${passed ? 'yes' : 'no'} constructor.name: ${actual} (expected: ${expected})`);
}

console.log();
console.log('Stack Trace (first 5 lines):');
console.log('-'.repeat(50));
const apiError = new MonimeApiError('Payment failed', 400, 'validation_error', []);
apiError.stack?.split('\n').slice(0, 5).forEach(line => console.log(line));

console.log();
console.log('='.repeat(60));
if (constructorNamesOk) {
  console.log('constructor.name preserved - --keep-names is working!');
} else {
  console.log('constructor.name mangled - --keep-names may be missing');
}
console.log('='.repeat(60));

process.exit(constructorNamesOk ? 0 : 1);
