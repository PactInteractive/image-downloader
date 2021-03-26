/**
 * Usage:
 * ```sh
 * node scripts/task.js clean
 * ```
 */

const tasks = require('./tasks');
const [taskName, ...args] = process.argv.slice(2);
if (!tasks[taskName]) {
  const taskNameList = Object.keys(tasks)
    .map((task) => `- ${task}`)
    .join('\n');
  console.error(
    `Unknown task ${taskName} - did you mean to use one of the following:\n${taskNameList}`
  );
} else {
  tasks[taskName](...args);
}
