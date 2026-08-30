import { useMemo } from 'react';

// Comprehensive Code Syntax, Language & OOPS Concept Pool
const SYNTAX_ITEMS = [
  { text: '<Python 3.12>', type: 'lang' },
  { text: 'class Animal { virtual void speak() = 0; }; // OOPS Abstraction', type: 'code' },
  { text: 'const [score, setScore] = useState(100);', type: 'code' },
  { text: '/* OOPS: Inheritance & Polymorphism */', type: 'concept' },
  { text: 'fn main() -> Result<(), Box<dyn Error>> // Rust', type: 'code' },
  { text: 'def binary_search(arr, target): return mid # O(log n)', type: 'code' },
  { text: '<JavaScript (ES2024)>', type: 'lang' },
  { text: 'SELECT u.name, COUNT(q.id) FROM users u JOIN quiz q;', type: 'code' },
  { text: '⚡ Encapsulation & Data Hiding', type: 'concept' },
  { text: 'async function fetchLeaderboard(id) { await api.get(); }', type: 'code' },
  { text: '<C++20 std::vector>', type: 'lang' },
  { text: 'template <typename T> class LinkedList { Node<T>* head; };', type: 'code' },
  { text: 'interface Polymorphism { void execute(); default void log(); }', type: 'code' },
  { text: '#include <iostream> using namespace std;', type: 'code' },
  { text: '<TypeScript 5.4>', type: 'lang' },
  { text: 'System.out.println("Java Object Oriented Programming");', type: 'code' },
  { text: 'docker run -d -p 5000:5000 quiz-platform:latest', type: 'code' },
  { text: '⚡ Virtual Method Table & Dynamic Binding', type: 'concept' },
  { text: 'type QuizResponse = { success: boolean; data: Quiz[]; };', type: 'code' },
  { text: 'git commit -m "feat: real-time live assessment runner"', type: 'code' },
  { text: '<Rust 1.77 (Cargo)>', type: 'lang' },
  { text: 'lambda x, y: x + y if x > y else y - x', type: 'code' },
  { text: 'struct CandidateNode { int id; string name; CandidateNode* next; };', type: 'code' },
  { text: 'try { processData(); } catch (const std::exception& e) {}', type: 'code' },
  { text: '<Go (Golang 1.22)>', type: 'lang' },
  { text: '⚡ Abstract Class vs Interface', type: 'concept' },
  { text: 'HTTP/1.1 200 OK Content-Type: application/json', type: 'code' },
  { text: 'import { useEffect, useCallback, useMemo } from "react";', type: 'code' },
  { text: '<SQL / PostgreSQL>', type: 'lang' },
  { text: 'export default class Encapsulation { private _secret: string; }', type: 'code' },
  { text: '⚡ O(n log n) Merge Sort & Quick Sort', type: 'concept' },
  { text: '<HTML5 & CSS3 Flexbox>', type: 'lang' },
  { text: 'const memoizedValue = useMemo(() => compute(), [deps]);', type: 'code' },
  { text: '⚡ Recursion & Dynamic Programming', type: 'concept' },
  { text: '<Node.js / Express>', type: 'lang' },
  { text: 'std::unique_ptr<Candidate> candidate = std::make_unique();', type: 'code' }
];

// Pre-computed deterministic scatter coordinates to ensure zero flickering across re-renders
const SCATTER_COORDS = [
  { top: '3%', left: '2%', rotate: '-14deg', scale: '1.05' },
  { top: '6%', left: '38%', rotate: '12deg', scale: '0.95' },
  { top: '4%', left: '72%', rotate: '-8deg', scale: '1.1' },
  { top: '12%', left: '15%', rotate: '18deg', scale: '0.9' },
  { top: '15%', left: '54%', rotate: '-22deg', scale: '1.0' },
  { top: '10%', left: '84%', rotate: '15deg', scale: '0.95' },
  { top: '22%', left: '5%', rotate: '-10deg', scale: '1.05' },
  { top: '25%', left: '32%', rotate: '8deg', scale: '0.9' },
  { top: '21%', left: '68%', rotate: '-16deg', scale: '1.15' },
  { top: '31%', left: '18%', rotate: '24deg', scale: '0.95' },
  { top: '33%', left: '48%', rotate: '-12deg', scale: '1.0' },
  { top: '30%', left: '82%', rotate: '6deg', scale: '1.05' },
  { top: '41%', left: '3%', rotate: '-26deg', scale: '0.9' },
  { top: '44%', left: '28%', rotate: '14deg', scale: '1.1' },
  { top: '42%', left: '62%', rotate: '-7deg', scale: '0.95' },
  { top: '39%', left: '88%', rotate: '19deg', scale: '1.0' },
  { top: '52%', left: '12%', rotate: '11deg', scale: '1.05' },
  { top: '55%', left: '42%', rotate: '-19deg', scale: '0.95' },
  { top: '50%', left: '75%', rotate: '13deg', scale: '1.1' },
  { top: '62%', left: '4%', rotate: '-15deg', scale: '0.9' },
  { top: '64%', left: '35%', rotate: '21deg', scale: '1.0' },
  { top: '61%', left: '65%', rotate: '-11deg', scale: '1.05' },
  { top: '65%', left: '87%', rotate: '9deg', scale: '0.95' },
  { top: '73%', left: '16%', rotate: '-23deg', scale: '1.1' },
  { top: '75%', left: '50%', rotate: '17deg', scale: '0.9' },
  { top: '72%', left: '79%', rotate: '-14deg', scale: '1.05' },
  { top: '83%', left: '6%', rotate: '10deg', scale: '0.95' },
  { top: '85%', left: '30%', rotate: '-18deg', scale: '1.0' },
  { top: '82%', left: '58%', rotate: '25deg', scale: '1.1' },
  { top: '86%', left: '83%', rotate: '-9deg', scale: '0.9' },
  { top: '92%', left: '22%', rotate: '-12deg', scale: '1.05' },
  { top: '94%', left: '66%', rotate: '16deg', scale: '0.95' }
];

export const CodeSyntaxBackgroundTexture = () => {
  const elements = useMemo(() => {
    return SYNTAX_ITEMS.map((item, idx) => {
      const coord = SCATTER_COORDS[idx % SCATTER_COORDS.length];
      return {
        ...item,
        ...coord,
        id: `syntax-scatter-${idx}`
      };
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden font-mono text-[9.5px] sm:text-[11px] leading-relaxed tracking-wider transition-opacity duration-700 opacity-[0.07] dark:opacity-[0.09] text-slate-800 dark:text-indigo-200"
    >
      {/* SCATTERED PROGRAMMING CODE WATERMARK LAYER */}
      <div className="relative w-full h-full">
        {elements.map((el) => (
          <div
            key={el.id}
            className="absolute whitespace-nowrap transition-transform duration-300 transform-gpu"
            style={{
              top: el.top,
              left: el.left,
              transform: `rotate(${el.rotate}) scale(${el.scale})`,
            }}
          >
            {el.type === 'lang' && (
              <span className="font-extrabold text-[11px] sm:text-[12.5px] uppercase tracking-widest text-indigo-900/90 dark:text-indigo-300/90 bg-indigo-500/10 dark:bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {el.text}
              </span>
            )}
            {el.type === 'concept' && (
              <span className="font-bold text-[10px] sm:text-[11.5px] text-amber-800/90 dark:text-amber-300/90 bg-amber-500/10 dark:bg-amber-400/10 px-2 py-0.5 rounded border border-amber-500/20">
                {el.text}
              </span>
            )}
            {el.type === 'code' && (
              <span className="font-semibold text-[9.5px] sm:text-[11px] text-slate-700/85 dark:text-slate-300/85">
                {el.text}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeSyntaxBackgroundTexture;
