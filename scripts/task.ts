/**
 * Usage:
 * ```sh
 * bun scripts/task.ts clean
 * ```
 */

import { tasks, type Task } from './tasks';

const [taskName, ...args] = process.argv.slice(2);

if (taskName in tasks) {
	(tasks[taskName as keyof typeof tasks] as Task)(...args);
} else {
	const taskNameList = Object.keys(tasks)
		.map((task) => `- ${task}`)
		.join('\n');
	console.error(`Unknown task ${taskName} - did you mean to use one of the following:\n${taskNameList}`);
}
