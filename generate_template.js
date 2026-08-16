const xlsx = require('./backend/node_modules/xlsx');
const fs = require('fs');
const path = require('path');

const sampleQuestions = [
  {
    Question: 'What will typeof NaN evaluate to in JavaScript?',
    'Option A': '"number"',
    'Option B': '"nan"',
    'Option C': '"undefined"',
    'Option D': '"object"',
    'Correct Answer': 'A',
    Explanation: 'NaN stands for Not-a-Number, but the IEEE-754 floating point standard defines it as a numeric data type (typeof NaN === "number").',
    Category: 'JavaScript',
    Timer: 30
  },
  {
    Question: 'Which React 19 hook allows optimistic UI updates during async mutations?',
    'Option A': 'useOptimistic',
    'Option B': 'useActionState',
    'Option C': 'useTransition',
    'Option D': 'useFormStatus',
    'Correct Answer': 'A',
    Explanation: 'useOptimistic lets you display temporary optimistic state while server background operations are pending, rolling back if an error occurs.',
    Category: 'React',
    Timer: 30
  },
  {
    Question: 'What is the average time complexity of key lookup in a Hash Map?',
    'Option A': 'O(1)',
    'Option B': 'O(log n)',
    'Option C': 'O(n)',
    'Option D': 'O(n^2)',
    'Correct Answer': 'A',
    Explanation: 'Hash Maps use hash functions to calculate array bucket indices directly, providing constant time O(1) average lookups.',
    Category: 'DSA / Algo',
    Timer: 30
  },
  {
    Question: 'What does the CSS property box-sizing: border-box do?',
    'Option A': 'Includes padding and border within the element total width and height.',
    'Option B': 'Adds a 3D shadow around the element container.',
    'Option C': 'Hides all overflowing text inside child boxes.',
    'Option D': 'Removes all default browser margins.',
    'Correct Answer': 'A',
    Explanation: 'border-box includes padding and border within the element total width and height, preventing layout breakage and container overflow.',
    Category: 'CSS & UI',
    Timer: 30
  },
  {
    Question: 'In Python, what is the output of: print([x * 2 for x in range(3)])?',
    'Option A': '[0, 2, 4]',
    'Option B': '[2, 4, 6]',
    'Option C': '[0, 1, 2]',
    'Option D': '[2, 2, 2]',
    'Correct Answer': 'A',
    Explanation: 'range(3) produces 0, 1, and 2. The list comprehension doubles each number to create [0, 2, 4].',
    Category: 'Python',
    Timer: 30
  },
  {
    Question: 'What is the primary advantage of an SQL B-Tree index over a full table scan?',
    'Option A': 'Reduces query lookup time complexity from O(N) to O(log N).',
    'Option B': 'Encrypts user passwords in AES-256.',
    'Option C': 'Compresses table image files.',
    'Option D': 'Prevents network DDoS attacks.',
    'Correct Answer': 'A',
    Explanation: 'A B-Tree index maintains a self-balancing sorted tree structure that finds matching records in logarithmic time O(log N).',
    Category: 'System Design',
    Timer: 60
  },
  {
    Question: 'How does the JavaScript Event Loop prioritize Microtasks versus Macrotasks (setTimeout)?',
    'Option A': 'The microtask queue empties completely before the next macrotask is processed.',
    'Option B': 'Macrotasks are executed with higher priority than microtasks.',
    'Option C': 'Both queues run in parallel multi-threaded workers.',
    'Option D': 'Microtasks are processed only once per minute.',
    'Correct Answer': 'A',
    Explanation: 'Microtasks (Promises, queueMicrotask) have strict priority and drain completely after every synchronous turn before the next macrotask executes.',
    Category: 'JavaScript',
    Timer: 30
  },
  {
    Question: 'In TypeScript, why is unknown preferred over any for untyped values?',
    'Option A': 'unknown enforces type checking and narrowing before operations, ensuring type safety.',
    'Option B': 'unknown executes faster at runtime.',
    'Option C': 'any is deprecated in modern TypeScript.',
    'Option D': 'unknown only allows string values.',
    'Correct Answer': 'A',
    Explanation: 'unknown represents an unverified type that requires type guards or narrowing before properties can be accessed, whereas any disables all compiler checks.',
    Category: 'JavaScript',
    Timer: 30
  }
];

// 1. Generate Excel Workbook (.xlsx)
const ws = xlsx.utils.json_to_sheet(sampleQuestions);
ws['!cols'] = [
  { wch: 50 }, // Question
  { wch: 25 }, // Option A
  { wch: 25 }, // Option B
  { wch: 25 }, // Option C
  { wch: 25 }, // Option D
  { wch: 16 }, // Correct Answer
  { wch: 60 }, // Explanation
  { wch: 20 }, // Category
  { wch: 10 }  // Timer
];
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Questions');

// Save files
const publicDir = path.join(__dirname, 'Client', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

xlsx.writeFile(wb, path.join(publicDir, 'Short_Gyaan_Questions_Template.xlsx'));
xlsx.writeFile(wb, path.join(__dirname, 'Short_Gyaan_Questions_Template.xlsx'));

// 2. Generate CSV (.csv)
const csvContent = xlsx.utils.sheet_to_csv(ws);
fs.writeFileSync(path.join(publicDir, 'Short_Gyaan_Questions_Template.csv'), csvContent, 'utf-8');
fs.writeFileSync(path.join(__dirname, 'Short_Gyaan_Questions_Template.csv'), csvContent, 'utf-8');

console.log('✅ Generated Short_Gyaan_Questions_Template.xlsx and .csv in Client/public/ and project root successfully!');
