#!/usr/bin/env bun
/**
 * Neptu CLI - Balinese Calendar Calculator
 * "Your Balinese Soul, On-Chain"
 *
 * Usage:
 *   bun run cli              # Interactive mode
 *   bun run cli 1990-05-10   # Calculate for specific birth date
 *   bun run cli 1990-05-10 2026-02-03  # With specific target date
 */

import { NeptuCalculator, formatFullReading } from "@neptu/wariga";

const LOGO = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███╗   ██╗███████╗██████╗ ████████╗██╗   ██╗               ║
║   ████╗  ██║██╔════╝██╔══██╗╚══██╔══╝██║   ██║               ║
║   ██╔██╗ ██║█████╗  ██████╔╝   ██║   ██║   ██║               ║
║   ██║╚██╗██║██╔══╝  ██╔═══╝    ██║   ██║   ██║               ║
║   ██║ ╚████║███████╗██║        ██║   ╚██████╔╝               ║
║   ╚═╝  ╚═══╝╚══════╝╚═╝        ╚═╝    ╚═════╝                ║
║                                                               ║
║          🌴 Your Balinese Soul, On-Chain 🌴                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

function parseDate(input: string): Date | null {
  // Try various formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
  ];

  for (let i = 0; i < formats.length; i++) {
    const match = input.match(formats[i]);
    if (match) {
      if (i === 0) {
        // YYYY-MM-DD
        return new Date(
          parseInt(match[1]),
          parseInt(match[2]) - 1,
          parseInt(match[3])
        );
      } else {
        // DD/MM/YYYY or DD-MM-YYYY
        return new Date(
          parseInt(match[3]),
          parseInt(match[2]) - 1,
          parseInt(match[1])
        );
      }
    }
  }

  return null;
}

async function prompt(message: string): Promise<string> {
  process.stdout.write(message);

  return new Promise((resolve) => {
    let input = "";
    process.stdin.setRawMode?.(false);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    process.stdin.once("data", (data) => {
      input = data.toString().trim();
      process.stdin.pause();
      resolve(input);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const calculator = new NeptuCalculator();

  console.log(LOGO);

  // If arguments provided, use them
  if (args.length >= 1) {
    const birthDate = parseDate(args[0]);
    if (!birthDate) {
      console.error("❌ Invalid birth date format. Use YYYY-MM-DD");
      process.exit(1);
    }

    const targetDate = args[1] ? parseDate(args[1]) : new Date();
    if (!targetDate) {
      console.error("❌ Invalid target date format. Use YYYY-MM-DD");
      process.exit(1);
    }

    const reading = calculator.getFullReading(birthDate, targetDate);
    console.log(formatFullReading(reading));
    return;
  }

  // Interactive mode
  console.log("📅 Enter your birth date to discover your Balinese soul.\n");

  const birthInput = await prompt("🎂 Birth date (DD/MM/YYYY or YYYY-MM-DD): ");
  const birthDate = parseDate(birthInput);

  if (!birthDate) {
    console.error(
      "\n❌ Invalid date format. Please use DD/MM/YYYY or YYYY-MM-DD"
    );
    process.exit(1);
  }

  const targetInput = await prompt("🌅 Target date (press Enter for today): ");
  const targetDate = targetInput ? parseDate(targetInput) : new Date();

  if (!targetDate) {
    console.error("\n❌ Invalid date format.");
    process.exit(1);
  }

  const reading = calculator.getFullReading(birthDate, targetDate);
  console.log(formatFullReading(reading));
}

main().catch(console.error);
