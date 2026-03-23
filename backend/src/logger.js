// Application event log (login, student team actions) -> Log/events.log

const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "..", "..", "Log");
const logFile = path.join(logDir, "events.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function line(level, category, message, meta) {
  const ts = new Date().toISOString();
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${ts} [${level}] [${category}] ${message}${suffix}\n`;
}

function append(text) {
  fs.appendFile(logFile, text, () => {});
}

function logEvent(category, message, meta) {
  append(line("INFO", category, message, meta));
}

function logWarn(category, message, meta) {
  append(line("WARN", category, message, meta));
}

module.exports = { logEvent, logWarn, logFile };
