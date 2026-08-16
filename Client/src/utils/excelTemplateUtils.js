import * as XLSX from 'xlsx';

/**
 * Downloads a structured Excel (.xlsx) template for Short Gyaan Questions
 */
export const downloadShortsGyaanTemplate = () => {
  const sampleShorts = [
    {
      Question: 'In Java, what is the key difference between == and .equals() when comparing String objects?',
      'Code Snippet': 'String s1 = new String("Java");\nString s2 = new String("Java");\nSystem.out.println(s1 == s2);\nSystem.out.println(s1.equals(s2));',
      'Option A': '== compares memory references/addresses, while .equals() compares character content.',
      'Option B': '== compares character content, while .equals() compares memory addresses.',
      'Option C': 'Both compare memory addresses only.',
      'Option D': 'Both compare string lengths only.',
      'Correct Answer': 'A',
      Explanation: 'In Java, the == operator checks reference equality in memory, while .equals() is overridden in String to compare the actual character sequence.',
      Category: 'Java',
      Timer: 30
    },
    {
      Question: 'What is the primary difference between Compile-time and Runtime Polymorphism?',
      'Code Snippet': '// Overloading: int add(int a, int b) vs double add(double a, double b)\n// Overriding: @Override void draw() in Circle',
      'Option A': 'Compile-time polymorphism is achieved via Method Overloading, while Runtime polymorphism is achieved via Method Overriding.',
      'Option B': 'Compile-time polymorphism only works with abstract classes.',
      'Option C': 'Runtime polymorphism does not allow inheritance hierarchies.',
      'Option D': 'There is no difference in execution timing.',
      'Correct Answer': 'A',
      Explanation: 'Compile-time (static) polymorphism resolves method calls at compile time via method signatures, while runtime (dynamic) polymorphism resolves overridden methods at runtime.',
      Category: 'Polymorphism',
      Timer: 30
    },
    {
      Question: 'What is the fundamental difference between an interface and an abstract class in Java 8+?',
      'Code Snippet': 'abstract class Shape { int x; abstract void draw(); }\ninterface Drawable { void draw(); default void log() { ... } }',
      'Option A': 'A class can implement multiple interfaces but only extend one abstract class, and abstract classes can maintain mutable instance state.',
      'Option B': 'Interfaces can hold mutable instance variables while abstract classes cannot.',
      'Option C': 'Abstract classes cannot declare constructor methods.',
      'Option D': 'Interfaces cannot have default method implementations in Java 8+.',
      'Correct Answer': 'A',
      Explanation: 'Java allows multiple inheritance of type (multiple interfaces) but only single inheritance of state/class. Abstract classes can maintain instance fields.',
      Category: 'Abstraction',
      Timer: 45
    },
    {
      Question: 'What will typeof NaN evaluate to in JavaScript?',
      'Code Snippet': 'console.log(typeof NaN);',
      'Option A': '"number"',
      'Option B': '"nan"',
      'Option C': '"undefined"',
      'Option D': '"object"',
      'Correct Answer': 'A',
      Explanation: 'NaN stands for Not-a-Number, but its official JavaScript data type is numeric according to IEEE-754 floating point specification.',
      Category: 'JavaScript',
      Timer: 30
    },
    {
      Question: 'What are the four core pillars of Object-Oriented Programming (OOP)?',
      'Code Snippet': '// 4 Pillars of OOP',
      'Option A': 'Encapsulation, Abstraction, Inheritance, and Polymorphism.',
      'Option B': 'Compilation, Execution, Debugging, and Testing.',
      'Option C': 'Functions, Loops, Arrays, and Pointers.',
      'Option D': 'Immutability, Pure Functions, Recursion, and Monads.',
      'Correct Answer': 'A',
      Explanation: 'The 4 fundamental pillars of OOP are Encapsulation (data hiding), Abstraction (simplifying complexity), Inheritance (reusability), and Polymorphism (many forms).',
      Category: 'OOPs',
      Timer: 30
    },
    {
      Question: 'What is the average time complexity of key lookup in a balanced Hash Map?',
      'Code Snippet': 'const map = new Map();\nmap.get("user_id_42");',
      'Option A': 'O(1)',
      'Option B': 'O(log n)',
      'Option C': 'O(n)',
      'Option D': 'O(n^2)',
      'Correct Answer': 'A',
      Explanation: 'Hash Maps calculate hash codes to directly index bucket arrays, providing O(1) constant average lookup time.',
      Category: 'DSA / Algo',
      Timer: 30
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleShorts);
  ws['!cols'] = [
    { wch: 55 }, // Question
    { wch: 45 }, // Code Snippet
    { wch: 35 }, // Option A
    { wch: 35 }, // Option B
    { wch: 35 }, // Option C
    { wch: 35 }, // Option D
    { wch: 15 }, // Correct Answer
    { wch: 60 }, // Explanation
    { wch: 18 }, // Category
    { wch: 10 }  // Timer
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Short_Gyaan_Questions');
  XLSX.writeFile(wb, 'Short_Gyaan_Questions_Template.xlsx');
};

/**
 * Downloads a structured Excel (.xlsx) template for Quiz Questions (MCQ & Code Pattern)
 */
export const downloadQuizQuestionsTemplate = () => {
  const sampleQuizQuestions = [
    {
      Question: 'What is the primary difference between let and const in modern JavaScript ES6?',
      'Question Type': 'mcq',
      Language: 'javascript',
      'Code Snippet': '',
      'Option A': 'const creates block-scoped immutable bindings, while let allows variable reassignment.',
      'Option B': 'const is function-scoped while let is global.',
      'Option C': 'let cannot be modified once declared.',
      'Option D': 'There is no difference in modern V8 engines.',
      'Correct Answer': 'A',
      Explanation: 'const prevents reassignment of the variable identifier, whereas let declares a reassignable block-scoped variable.',
      'Timer Seconds': 15
    },
    {
      Question: 'Find and fix the off-by-one boundary bug in this array total calculation function:',
      'Question Type': 'pattern',
      Language: 'javascript',
      'Code Snippet': 'function calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i <= items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}',
      'Option A': 'Change the loop condition from i <= items.length to i < items.length.',
      'Option B': 'Initialize total with 1 instead of 0.',
      'Option C': 'Change items[i].price to items.price[i].',
      'Option D': 'Replace the for loop with a while loop starting from i = 1.',
      'Correct Answer': 'A',
      Explanation: 'Array indices in JavaScript range from 0 to length - 1. When i reaches items.length, items[i] is undefined, resulting in a runtime TypeError or NaN addition.',
      'Timer Seconds': 30
    },
    {
      Question: 'In Java, what does the Liskov Substitution Principle (LSP) in SOLID design require?',
      'Question Type': 'mcq',
      Language: 'java',
      'Code Snippet': '// LSP: Objects of a superclass should be replaceable with objects of a subclass',
      'Option A': 'Subclasses must be substitutable for their base classes without altering the correctness of the program.',
      'Option B': 'Classes must have only one public method.',
      'Option C': 'Interfaces must contain exactly one abstract method.',
      'Option D': 'All class fields must be declared as static final.',
      'Correct Answer': 'A',
      Explanation: 'LSP ensures that derived classes extend base class behaviors without changing their expected contracts or introducing breaking preconditions.',
      'Timer Seconds': 30
    },
    {
      Question: 'Identify the concurrency deadlock risk in this Java synchronized transfer method:',
      'Question Type': 'pattern',
      Language: 'java',
      'Code Snippet': 'public void transfer(Account from, Account to, double amount) {\n  synchronized(from) {\n    synchronized(to) {\n      from.debit(amount);\n      to.credit(amount);\n    }\n  }\n}',
      'Option A': 'Acquiring locks in arbitrary order causes a cyclic deadlock if two threads transfer between each other simultaneously; acquire locks in global account ID order.',
      'Option B': 'Debit and credit operations must be in separate try-catch blocks.',
      'Option C': 'Remove the synchronized keyword from the outer block.',
      'Option D': 'Declare the transfer method as private static.',
      'Correct Answer': 'A',
      Explanation: 'If Thread 1 transfers A->B and Thread 2 transfers B->A concurrently, Thread 1 holds lock A waiting for B, while Thread 2 holds lock B waiting for A. Ordering lock acquisition by account ID prevents deadlocks.',
      'Timer Seconds': 45
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleQuizQuestions);
  ws['!cols'] = [
    { wch: 55 }, // Question
    { wch: 16 }, // Question Type
    { wch: 14 }, // Language
    { wch: 45 }, // Code Snippet
    { wch: 40 }, // Option A
    { wch: 40 }, // Option B
    { wch: 40 }, // Option C
    { wch: 40 }, // Option D
    { wch: 15 }, // Correct Answer
    { wch: 60 }, // Explanation
    { wch: 15 }  // Timer Seconds
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Quiz_Questions');
  XLSX.writeFile(wb, 'Quiz_Questions_Template.xlsx');
};

/**
 * Parses an uploaded Excel/CSV file into normalized quiz question objects
 * @param {File} file - Excel or CSV File object
 * @returns {Promise<Array>} Normalized array of question objects
 */
export const parseQuizQuestionsExcel = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet);

          if (!rawRows || rawRows.length === 0) {
            throw new Error('The uploaded Excel file contains no question rows.');
          }

          const parsedQuestions = rawRows.map((row, idx) => {
            // Flexible column resolution
            const questionText = row.Question || row.question || row.questionText || row['Question Statement'] || row.Title || '';
            const questionType = (row['Question Type'] || row.questionType || row.Type || (row['Code Snippet'] ? 'pattern' : 'mcq')).toLowerCase() === 'pattern' ? 'pattern' : 'mcq';
            const language = (row.Language || row.language || 'javascript').toLowerCase();
            const codeSnippet = row['Code Snippet'] || row.codeSnippet || row.Code || row.Snippet || '';

            const optA = String(row['Option A'] || row.OptionA || row.optionA || row.A || row.option1 || row['Option 1'] || 'Option A').trim();
            const optB = String(row['Option B'] || row.OptionB || row.optionB || row.B || row.option2 || row['Option 2'] || 'Option B').trim();
            const optC = String(row['Option C'] || row.OptionC || row.optionC || row.C || row.option3 || row['Option 3'] || 'Option C').trim();
            const optD = String(row['Option D'] || row.OptionD || row.optionD || row.D || row.option4 || row['Option 4'] || 'Option D').trim();

            const options = [optA, optB, optC, optD];

            // Resolve correct answer index (A/B/C/D or 0/1/2/3 or exact option text)
            let correctAnswerIndex = 0;
            const rawAns = String(row['Correct Answer'] || row.correctAnswerIndex || row.Answer || row.Correct || row.ans || 'A').trim().toUpperCase();

            if (rawAns === 'A' || rawAns === '0' || rawAns === 'OPTION A') correctAnswerIndex = 0;
            else if (rawAns === 'B' || rawAns === '1' || rawAns === 'OPTION B') correctAnswerIndex = 1;
            else if (rawAns === 'C' || rawAns === '2' || rawAns === 'OPTION C') correctAnswerIndex = 2;
            else if (rawAns === 'D' || rawAns === '3' || rawAns === 'OPTION D') correctAnswerIndex = 3;
            else {
              const matchedIdx = options.findIndex(o => o.toLowerCase() === rawAns.toLowerCase());
              if (matchedIdx !== -1) correctAnswerIndex = matchedIdx;
            }

            const explanation = row.Explanation || row.explanation || row.Reason || row['Answer Explanation'] || '';
            const timerSeconds = Number(row['Timer Seconds'] || row.timerSeconds || row.Timer || row.timer || 15) || 15;

            return {
              id: Date.now() + idx + Math.random(),
              questionText: questionText || `Question #${idx + 1}`,
              questionType,
              language,
              codeSnippet,
              options,
              correctAnswerIndex,
              explanation,
              timerSeconds
            };
          });

          resolve(parsedQuestions);
        } catch (parseErr) {
          reject(new Error('Failed to parse Excel file: ' + parseErr.message));
        }
      };

      reader.onerror = (err) => {
        reject(new Error('File reader error: ' + err.message));
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      reject(err);
    }
  });
};
