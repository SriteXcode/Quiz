const mongoose = require('mongoose');
const xlsx = require('xlsx');
const ShortGyaan = require('../models/ShortGyaan');

// Comprehensive Default Seed Questions for Infinite Short Gyaan Feed
const DEFAULT_SEED_SHORTS = [
  {
    questionText: 'What will `typeof NaN` evaluate to in JavaScript?',
    codeSnippet: 'console.log(typeof NaN);',
    options: ['"number"', '"nan"', '"undefined"', '"object"'],
    correctAnswerIndex: 0,
    explanation: 'In JavaScript, `NaN` stands for "Not-a-Number", but its data type is officially numeric (`typeof NaN === "number"`). It is defined as a numeric value according to IEEE-754 floating point standard.',
    category: 'JavaScript',
    tags: ['JavaScript', 'Type Coercion', 'Core JS'],
    difficulty: 'Easy',
    timerSeconds: 30,
    likesCount: 242,
    author: 'JS Guru'
  },
  {
    questionText: 'Which React 19 hook allows optimistic UI updates during an async action transition?',
    codeSnippet: 'const [optimisticState, setOptimistic] = useOptimistic(state, updateFn);',
    options: ['useOptimistic', 'useActionState', 'useTransition', 'useFormStatus'],
    correctAnswerIndex: 0,
    explanation: '`useOptimistic` is a new React 19 hook that lets you show an optimistic state while an asynchronous background action is in progress, automatically reverting if the action fails.',
    category: 'React',
    tags: ['React', 'React 19', 'Hooks', 'Frontend'],
    difficulty: 'Medium',
    timerSeconds: 30,
    likesCount: 198,
    author: 'React Architect'
  },
  {
    questionText: 'What is the time complexity of searching a key in an average balanced Hash Map?',
    codeSnippet: 'const map = new Map();\nmap.get("user_id_42");',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswerIndex: 0,
    explanation: 'Hash Maps calculate a hash code for direct index access in a bucket array, giving an average time complexity of O(1) constant time for lookups, insertions, and deletions.',
    category: 'DSA / Algo',
    tags: ['DSA', 'Hash Table', 'Time Complexity', 'CS'],
    difficulty: 'Easy',
    timerSeconds: 30,
    likesCount: 275,
    author: 'Algo Ninja'
  },
  {
    questionText: 'What is the primary difference between SQL (Relational) and NoSQL (Document) databases in CAP Theorem?',
    codeSnippet: '// CAP: Consistency vs Availability vs Partition Tolerance',
    options: [
      'SQL typically prioritizes Strong Consistency (ACID), while NoSQL often prioritizes High Availability & Partition Tolerance (BASE).',
      'NoSQL databases cannot store text strings.',
      'SQL databases do not support indexing.',
      'There is no architectural difference.'
    ],
    correctAnswerIndex: 0,
    explanation: 'Relational databases emphasize strict ACID transactions and immediate consistency, whereas distributed NoSQL databases (like MongoDB, Cassandra) often prioritize horizontal scalability, high availability, and eventual consistency (BASE model).',
    category: 'System Design',
    tags: ['System Design', 'Databases', 'SQL', 'NoSQL', 'CAP'],
    difficulty: 'Medium',
    timerSeconds: 60,
    likesCount: 310,
    author: 'System Designer'
  },
  {
    questionText: 'What does CSS `box-sizing: border-box` do?',
    codeSnippet: '*, *::before, *::after {\n  box-sizing: border-box;\n}',
    options: [
      'Includes padding and border within the element\'s specified total width and height.',
      'Adds a 3D shadow around the element box.',
      'Hides all overflow text inside the border.',
      'Removes all margins from child elements.'
    ],
    correctAnswerIndex: 0,
    explanation: 'With `border-box`, padding and border are included in the element\'s total width and height calculation, preventing unwanted layout shifts and container overflow.',
    category: 'CSS & UI',
    tags: ['CSS', 'Web Dev', 'Box Model', 'Frontend'],
    difficulty: 'Easy',
    timerSeconds: 30,
    likesCount: 189,
    author: 'CSS Wizard'
  },
  {
    questionText: 'In Python, what is the output of `[x * 2 for x in range(3)]`?',
    codeSnippet: 'result = [x * 2 for x in range(3)]\nprint(result)',
    options: ['[0, 2, 4]', '[2, 4, 6]', '[0, 1, 2]', '[2, 2, 2]'],
    correctAnswerIndex: 0,
    explanation: '`range(3)` produces numbers 0, 1, and 2. The list comprehension multiplies each by 2: (0*2=0, 1*2=2, 2*2=4), yielding `[0, 2, 4]`.',
    category: 'Python',
    tags: ['Python', 'List Comprehension', 'Syntax'],
    difficulty: 'Easy',
    timerSeconds: 30,
    likesCount: 154,
    author: 'PyMaster'
  },
  {
    questionText: 'What is the key difference between JavaScript Microtasks (Promises) and Macrotasks (setTimeout)?',
    codeSnippet: 'setTimeout(() => console.log("A"), 0);\nPromise.resolve().then(() => console.log("B"));',
    options: [
      'Microtasks drain completely before the Event Loop picks the next Macrotask.',
      'Macrotasks execute in parallel Web Workers.',
      'Promises always run after setTimeout callbacks.',
      'Microtasks are limited to 1 execution per second.'
    ],
    correctAnswerIndex: 0,
    explanation: 'The Microtask queue has strict higher priority over the Macrotask queue. After every synchronous task completes, the JavaScript runtime completely exhausts all pending microtasks before executing the next macrotask.',
    category: 'JavaScript',
    tags: ['JavaScript', 'Event Loop', 'Microtasks', 'Async'],
    difficulty: 'Medium',
    timerSeconds: 30,
    likesCount: 340,
    author: 'Event Loop Expert'
  },
  {
    questionText: 'In TypeScript, what is the difference between `unknown` and `any`?',
    codeSnippet: 'let a: any;\nlet u: unknown;',
    options: [
      '`unknown` is type-safe: you cannot perform arbitrary operations on it without type narrowing, whereas `any` disables all type checking.',
      '`unknown` only allows primitive numbers and booleans.',
      '`any` is faster at runtime than `unknown`.',
      'There is no difference in compiler behavior.'
    ],
    correctAnswerIndex: 0,
    explanation: '`unknown` represents any value but forces you to perform type checking or narrowing before using it. `any` completely disables the TypeScript compiler type safety checks.',
    category: 'JavaScript',
    tags: ['TypeScript', 'Types', 'Type Safety'],
    difficulty: 'Medium',
    timerSeconds: 30,
    likesCount: 220,
    author: 'TS Master'
  },
  {
    questionText: 'How does Redis achieve sub-millisecond in-memory read and write latency?',
    codeSnippet: '// Redis In-Memory Key-Value Store',
    options: [
      'By storing data entirely in RAM and utilizing a single-threaded non-blocking event-driven I/O multiplexer.',
      'By writing directly to spinning mechanical magnetic disks.',
      'By compiling code to WebAssembly.',
      'By encrypting network packets on GPUs.'
    ],
    correctAnswerIndex: 0,
    explanation: 'Redis operates primarily in RAM (avoiding disk I/O bottlenecks) and employs an efficient single-threaded event loop (epoll/kqueue) that eliminates thread context-switching overhead and locking contention.',
    category: 'System Design',
    tags: ['Redis', 'Caching', 'System Design', 'Memory'],
    difficulty: 'Hard',
    timerSeconds: 60,
    likesCount: 412,
    author: 'Backend Lead'
  },
  {
    questionText: 'What is the purpose of Git `rebase` compared to Git `merge`?',
    codeSnippet: 'git checkout feature\ngit rebase main',
    options: [
      '`rebase` replays your commits on top of the target base branch for a clean, linear commit history without a merge commit.',
      '`rebase` deletes all previous commit history permanently.',
      '`rebase` is only used to push to GitHub.',
      '`merge` cannot handle file conflicts.'
    ],
    correctAnswerIndex: 0,
    explanation: 'Git rebase rewrites project history by moving the base of your branch to a new starting point, producing a straight linear progression of commits without creating an extra merge commit.',
    category: 'DSA / Algo',
    tags: ['Git', 'DevOps', 'Version Control'],
    difficulty: 'Easy',
    timerSeconds: 30,
    likesCount: 195,
    author: 'DevOps Pro'
  },
  {
    questionText: 'In React Server Components (RSC), which statement is true regarding browser bundle size?',
    codeSnippet: '// app/page.jsx (Server Component)',
    options: [
      'Server Components do not send their JavaScript code or heavy dependencies to the client browser bundle.',
      'Server Components double the client JavaScript bundle size.',
      'Server Components require Redux to render.',
      'Server Components only run inside the browser window.'
    ],
    correctAnswerIndex: 0,
    explanation: 'React Server Components execute strictly on the server and stream pre-rendered virtual DOM to the browser, resulting in zero additional JavaScript footprint in the client bundle for server-only dependencies.',
    category: 'React',
    tags: ['React', 'Next.js', 'RSC', 'Performance'],
    difficulty: 'Medium',
    timerSeconds: 30,
    likesCount: 268,
    author: 'Next.js Wizard'
  },
  {
    questionText: 'In Java, what is the key difference between `==` and `.equals()` when comparing two String objects?',
    codeSnippet: 'String s1 = new String("Java");\nString s2 = new String("Java");\nSystem.out.println(s1 == s2);\nSystem.out.println(s1.equals(s2));',
    options: [
      '`==` compares memory references/addresses, while `.equals()` compares the actual character content.',
      '`==` compares content, while `.equals()` compares memory addresses.',
      'Both compare memory addresses.',
      'Both compare string length only.'
    ],
    correctAnswerIndex: 0,
    explanation: 'In Java, the `==` operator tests reference equality (whether both references point to the exact same object in heap memory). The `.equals()` method is overridden in `String` to test value equality (whether both strings contain the identical sequence of characters).',
    category: 'Java',
    tags: ['Java', 'Core Java', 'Strings', 'OOPs'],
    difficulty: 'Easy',
    timerSeconds: 30,
    likesCount: 389,
    author: 'Java Champion'
  },
  {
    questionText: 'What is the primary difference between Compile-time Polymorphism and Runtime Polymorphism in Java?',
    codeSnippet: '// Overloading: int add(int a, int b) vs double add(double a, double b)\n// Overriding: @Override void draw() in Circle extending Shape',
    options: [
      'Compile-time polymorphism is achieved via Method Overloading, while Runtime polymorphism is achieved via Method Overriding (Dynamic Method Dispatch).',
      'Compile-time polymorphism only works with abstract classes.',
      'Runtime polymorphism does not allow inheritance.',
      'There is no difference in execution timing.'
    ],
    correctAnswerIndex: 0,
    explanation: 'Compile-time polymorphism (Static Binding) resolves method calls during compilation using method signatures (Method Overloading). Runtime polymorphism (Dynamic Binding) resolves overridden method calls at runtime based on the actual object type in memory.',
    category: 'Polymorphism',
    tags: ['Polymorphism', 'OOPs', 'Java', 'Method Overriding'],
    difficulty: 'Medium',
    timerSeconds: 30,
    likesCount: 420,
    author: 'OOPs Architect'
  },
  {
    questionText: 'What is the fundamental difference between an `interface` and an `abstract class` in Java 8+?',
    codeSnippet: 'abstract class Shape { int x; abstract void draw(); }\ninterface Drawable { void draw(); default void log() { ... } }',
    options: [
      'A class can implement multiple interfaces but can only extend one abstract class (Multiple vs Single inheritance), and abstract classes can maintain instance state (instance fields).',
      'Interfaces can maintain mutable instance state, while abstract classes cannot.',
      'Abstract classes cannot have constructor methods.',
      'Interfaces cannot have any method bodies even in Java 8+.'
    ],
    correctAnswerIndex: 0,
    explanation: 'A Java class can extend only one abstract class (single inheritance of state and implementation), but can implement multiple interfaces (multiple inheritance of type). Abstract classes can hold non-static, non-final state (instance fields), whereas interface fields are implicitly `public static final`.',
    category: 'Abstraction',
    tags: ['Abstraction', 'OOPs', 'Java', 'Interfaces', 'Architecture'],
    difficulty: 'Medium',
    timerSeconds: 45,
    likesCount: 465,
    author: 'Java Specialist'
  },
  {
    questionText: 'What are the four core pillars of Object-Oriented Programming (OOP)?',
    codeSnippet: '// OOP Pillars: Encapsulation, Abstraction, Inheritance, Polymorphism',
    options: [
      'Encapsulation, Abstraction, Inheritance, and Polymorphism.',
      'Compilation, Execution, Debugging, and Testing.',
      'Functions, Loops, Arrays, and Pointers.',
      'Immutability, Pure Functions, Recursion, and Monads.'
    ],
    correctAnswerIndex: 0,
    explanation: 'The four fundamental pillars of OOP are: 1) Encapsulation (bundling data and methods while restricting direct access), 2) Abstraction (hiding implementation complexity), 3) Inheritance (reusing code across parent-child hierarchies), and 4) Polymorphism (ability to take many forms).',
    category: 'OOPs',
    tags: ['OOPs', 'Object Oriented', 'Java', 'CS Fundamentals'],
    difficulty: 'Easy',
    timerSeconds: 30,
    likesCount: 512,
    author: 'Code Mentor'
  },
  {
    questionText: 'Why does Java not support Multiple Inheritance with classes, and how does it avoid the "Diamond Problem"?',
    codeSnippet: '// Diamond Problem:\n// Class B extends A, Class C extends A\n// If Class D extends B, C -> Ambiguity on which method to inherit!',
    options: [
      'To prevent method resolution ambiguity (Diamond Problem) where two parent classes implement the same method with different logic.',
      'Because JVM cannot execute more than one class at a time.',
      'Because memory allocation fails for multiple classes.',
      'Java allows multiple class inheritance if using the `super` keyword.'
    ],
    correctAnswerIndex: 0,
    explanation: 'If two classes B and C inherit from A and override a method, and class D inherits from both B and C, the compiler would not know which version of the method to call. Java eliminates this ambiguity by disallowing multiple class inheritance, while supporting multiple interface implementations.',
    category: 'Inheritance',
    tags: ['Inheritance', 'OOPs', 'Diamond Problem', 'Java'],
    difficulty: 'Medium',
    timerSeconds: 45,
    likesCount: 378,
    author: 'Java Guru'
  },
  {
    questionText: 'How does Encapsulation improve software security and maintainability in OOP?',
    codeSnippet: 'public class BankAccount {\n  private double balance;\n  public double getBalance() { return balance; }\n  public void deposit(double amount) { if (amount > 0) balance += amount; }\n}',
    options: [
      'By declaring instance variables `private` and providing controlled access via getter/setter methods with validation logic (Data Hiding).',
      'By converting all classes to global singleton functions.',
      'By compiling code directly into machine bytecode.',
      'By eliminating all constructor parameters.'
    ],
    correctAnswerIndex: 0,
    explanation: 'Encapsulation safeguards an object\'s internal state by keeping variables private and forcing external code to interact via public methods. This ensures validation rules are enforced and prevents direct, unauthorized modifications.',
    category: 'Encapsulation',
    tags: ['Encapsulation', 'OOPs', 'Data Hiding', 'Java'],
    difficulty: 'Easy',
    timerSeconds: 30,
    likesCount: 345,
    author: 'OOPs Master'
  }
];

// Helper: Seed or Update Default Short Gyaan
const seedShortGyaanIfEmpty = async () => {
  try {
    for (const item of DEFAULT_SEED_SHORTS) {
      const exists = await ShortGyaan.findOne({ questionText: item.questionText });
      if (!exists) {
        await ShortGyaan.create(item);
      }
    }
    console.log('✅ Seeded / Verified Short Gyaan questions (including Java, OOPs, Polymorphism, Abstraction, etc.)');
  } catch (err) {
    console.warn('[Short Gyaan Seed Warning]:', err.message);
  }
};

seedShortGyaanIfEmpty();

// 1. GET SHORT GYAAN QUESTIONS (Infinite Feed Stream & Pagination)
exports.getShortsGyaan = async (req, res) => {
  try {
    const { category, search, savedOnly, page = 1, limit = 10 } = req.query;
    const userId = req.user ? (req.user._id || req.user.id || req.user.userId) : null;
    const query = {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    if (category && category !== 'All' && category !== 'For You' && category !== 'Saved') {
      const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { category: { $regex: new RegExp(`^${escapedCategory}$`, 'i') } },
        { tags: { $regex: new RegExp(`^${escapedCategory}$`, 'i') } },
        { tags: { $regex: new RegExp(escapedCategory, 'i') } }
      ];
    }

    if (savedOnly === 'true' && userId) {
      query.savedBy = userId;
    }

    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { explanation: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCount = await ShortGyaan.countDocuments(query);
    const skip = (pageNum - 1) * limitNum;

    // Fetch documents sorted by popularity and recency
    let shorts = await ShortGyaan.find(query)
      .sort({ likesCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // If page exceeds total collection count (Infinite Scroll looping for endless reels)
    if (shorts.length === 0 && totalCount > 0 && savedOnly !== 'true') {
      // Loop over and return shuffled recommendations so the stream is truly infinite
      const randomSkip = Math.floor(Math.random() * Math.max(1, totalCount - limitNum));
      shorts = await ShortGyaan.find(query)
        .sort({ likesCount: -1 })
        .skip(randomSkip)
        .limit(limitNum);
    }

    // Attach isLiked & isSaved indicators for current user
    const formattedShorts = shorts.map((item) => {
      const obj = item.toObject();
      obj.isLiked = userId ? Boolean(item.likedBy && item.likedBy.some(id => id.toString() === userId.toString())) : false;
      obj.isSaved = userId ? Boolean(item.savedBy && item.savedBy.some(id => id.toString() === userId.toString())) : false;
      return obj;
    });

    res.json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      hasMore: true, // Infinite feed always provides continuous recommendations
      count: formattedShorts.length,
      shorts: formattedShorts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. TOGGLE LIKE SHORT GYAAN
exports.toggleLikeShort = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user._id || req.user.id || req.user.userId) : new mongoose.Types.ObjectId();

    const short = await ShortGyaan.findById(id);
    if (!short) {
      return res.status(404).json({ success: false, message: 'Short Gyaan question not found' });
    }

    const alreadyLikedIndex = short.likedBy.findIndex(uid => uid.toString() === userId.toString());
    let isLiked = false;

    if (alreadyLikedIndex > -1) {
      short.likedBy.splice(alreadyLikedIndex, 1);
      short.likesCount = Math.max(0, short.likesCount - 1);
      isLiked = false;
    } else {
      short.likedBy.push(userId);
      short.likesCount += 1;
      isLiked = true;
    }

    await short.save();

    res.json({
      success: true,
      isLiked,
      likesCount: short.likesCount,
      message: isLiked ? 'Liked Short Gyaan! ❤️' : 'Unliked Short Gyaan'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. TOGGLE SAVE / BOOKMARK SHORT GYAAN
exports.toggleSaveShort = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user._id || req.user.id || req.user.userId) : new mongoose.Types.ObjectId();

    const short = await ShortGyaan.findById(id);
    if (!short) {
      return res.status(404).json({ success: false, message: 'Short Gyaan question not found' });
    }

    const alreadySavedIndex = short.savedBy.findIndex(uid => uid.toString() === userId.toString());
    let isSaved = false;

    if (alreadySavedIndex > -1) {
      short.savedBy.splice(alreadySavedIndex, 1);
      isSaved = false;
    } else {
      short.savedBy.push(userId);
      isSaved = true;
    }

    await short.save();

    res.json({
      success: true,
      isSaved,
      message: isSaved ? 'Saved to your Bookmarked Gyaan! 🔖' : 'Removed from bookmarks'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. ADMIN BULK EXCEL / CSV UPLOAD
exports.adminUploadExcel = async (req, res) => {
  try {
    let rawRows = [];

    if (req.file) {
      const workbook = req.file.buffer
        ? xlsx.read(req.file.buffer, { type: 'buffer' })
        : xlsx.readFile(req.file.path);

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    } else if (req.body && req.body.questions && Array.isArray(req.body.questions)) {
      rawRows = req.body.questions;
    } else {
      return res.status(400).json({
        success: false,
        message: 'No file or question data received. Please upload an Excel (.xlsx / .csv) file.'
      });
    }

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file contains no rows or data.'
      });
    }

    const getVal = (row, ...keys) => {
      const rowKeys = Object.keys(row);
      for (const k of keys) {
        const found = rowKeys.find(rk => rk.trim().toLowerCase() === k.trim().toLowerCase());
        if (found !== undefined && row[found] !== undefined && row[found] !== '') {
          return String(row[found]).trim();
        }
      }
      return '';
    };

    const parsedQuestions = [];
    const errors = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;

      const questionText = getVal(row, 'Question', 'Question Text', 'question', 'question_text', 'Problem');
      const optA = getVal(row, 'Option A', 'Option 1', 'OptionA', 'optA', 'A');
      const optB = getVal(row, 'Option B', 'Option 2', 'OptionB', 'optB', 'B');
      const optC = getVal(row, 'Option C', 'Option 3', 'OptionC', 'optC', 'C');
      const optD = getVal(row, 'Option D', 'Option 4', 'OptionD', 'optD', 'D');
      const rawAnswer = getVal(row, 'Correct Answer', 'Answer', 'Correct Option', 'Correct', 'correctAnswer', 'correct_answer');
      const explanation = getVal(row, 'Explanation', 'Solution', 'Reason', 'Description', 'explanation') || 'No detailed explanation provided.';
      const category = getVal(row, 'Category', 'Topic', 'Subject', 'category') || 'General Tech';
      const timerStr = getVal(row, 'Timer', 'Time Limit', 'Duration', 'timerSeconds') || '30';
      const timerSeconds = parseInt(timerStr, 10) === 60 ? 60 : 30;

      if (!questionText) {
        errors.push(`Row ${rowNum}: Missing Question text.`);
        return;
      }
      if (!optA || !optB || !optC || !optD) {
        errors.push(`Row ${rowNum}: All 4 options (Option A, B, C, D) are required.`);
        return;
      }

      let correctAnswerIndex = 0;
      const cleanAnswer = rawAnswer.toLowerCase().trim();

      if (cleanAnswer === '0' || cleanAnswer === 'a' || cleanAnswer === 'option a' || cleanAnswer === '1' || cleanAnswer === optA.toLowerCase()) {
        correctAnswerIndex = 0;
      } else if (cleanAnswer === 'b' || cleanAnswer === 'option b' || cleanAnswer === '2' || cleanAnswer === optB.toLowerCase()) {
        correctAnswerIndex = 1;
      } else if (cleanAnswer === 'c' || cleanAnswer === 'option c' || cleanAnswer === '3' || cleanAnswer === optC.toLowerCase()) {
        correctAnswerIndex = 2;
      } else if (cleanAnswer === 'd' || cleanAnswer === 'option d' || cleanAnswer === '4' || cleanAnswer === optD.toLowerCase()) {
        correctAnswerIndex = 3;
      } else {
        correctAnswerIndex = 0;
      }

      parsedQuestions.push({
        questionText,
        options: [optA, optB, optC, optD],
        correctAnswerIndex,
        explanation,
        category,
        tags: [category],
        difficulty: 'Medium',
        timerSeconds,
        author: req.user?.name || 'Admin Excel Upload',
        createdBy: req.user?._id
      });
    });

    if (parsedQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract valid questions from the Excel file.',
        errors
      });
    }

    const inserted = await ShortGyaan.insertMany(parsedQuestions);

    res.status(201).json({
      success: true,
      message: `🎉 Successfully uploaded and added ${inserted.length} Short Gyaan questions!`,
      count: inserted.length,
      errors: errors.length > 0 ? errors : undefined,
      sample: inserted.slice(0, 3)
    });
  } catch (error) {
    console.error('[Excel Upload Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and upload Excel file: ' + error.message
    });
  }
};

// 5. ADMIN CREATE SINGLE SHORT GYAAN
exports.adminCreateShort = async (req, res) => {
  try {
    const {
      questionText,
      codeSnippet,
      options,
      correctAnswerIndex,
      explanation,
      category,
      difficulty,
      timerSeconds
    } = req.body;

    if (!questionText || !options || options.length !== 4 || explanation === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide questionText, exactly 4 options, and explanation.'
      });
    }

    const short = new ShortGyaan({
      questionText,
      codeSnippet: codeSnippet || '',
      options,
      correctAnswerIndex: Number(correctAnswerIndex) || 0,
      explanation,
      category: category || 'General Tech',
      tags: [category || 'General Tech'],
      difficulty: difficulty || 'Medium',
      timerSeconds: Number(timerSeconds) === 60 ? 60 : 30,
      author: req.user?.name || 'Admin',
      createdBy: req.user?._id
    });

    await short.save();

    res.status(201).json({
      success: true,
      message: 'Short Gyaan question created successfully!',
      short
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. ADMIN DELETE SHORT GYAAN
exports.adminDeleteShort = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ShortGyaan.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Short Gyaan question not found.' });
    }

    res.json({
      success: true,
      message: 'Short Gyaan question deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
