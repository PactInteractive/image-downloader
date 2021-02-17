/**
 * Usage:
 * ```sh
 * node scripts/task.js clean
 * ```
 */

const tasks = require('./tasks');
const [taskName, ...args] = process.argv.slice(2);
if (!tasks[taskName]) {
  const taskNameList = Object.keys(tasks).map((t) => `- ${t}\n`);
  throw new Error(
    `Unknown task ${taskName} - did you mean to use one of the following:\n${taskNameList}`
  );
}
tasks[taskName](...args);
