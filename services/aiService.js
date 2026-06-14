// AI Service — Client-side (Proxied through Backend)
// All AI API calls now go through the backend; no API keys on the client.

import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, limit, addDoc } from 'firebase/firestore';
import { DIFFICULTY_LEVELS, QUIZ_CONFIG } from '../constants/Config';
import api from './apiClient';

// ─── Shuffle options so correct answer position varies ────────────────
const shuffleQuestionOptions = (questions) => {
  return questions.map(q => {
    const correctAnswer = q.options[q.correct];
    const shuffled = [...q.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { ...q, options: shuffled, correct: shuffled.indexOf(correctAnswer) };
  });
};

// ─── Generate AI Test via Backend Proxy ───────────────────────────────
/**
 * Generate a test by calling the backend AI proxy.
 * Falls back to local questions if the backend is unreachable.
 */
export const generateAITest = async (subject, config = {}) => {
  const {
    numberOfQuestions = 10,
    difficulty = 'medium',
    timeLimit = 15,
    userAvgScore = null,
  } = config;

  try {
    // Call backend API (authenticated, rate-limited, validated)
    const result = await api.post('/api/tests/generate', {
      subject,
      numberOfQuestions,
      difficulty,
      timeLimit,
      userAvgScore,
    });

    if (result.success) {
      // Backend already shuffles options; re-shuffle on client for extra randomization
      const questions = shuffleQuestionOptions(result.data.questions);
      return {
        success: true,
        data: {
          ...result.data,
          questions,
        },
      };
    }

    // If backend returned an error but we got a response, fallback locally
    console.warn('Backend test generation failed:', result.error);
    return generateLocalFallbackTest(subject, numberOfQuestions, difficulty, timeLimit);
  } catch (error) {
    // Network error or backend unreachable — use local fallback
    console.warn('Backend unreachable, using local fallback:', error.message);
    return generateLocalFallbackTest(subject, numberOfQuestions, difficulty, timeLimit);
  }
};

// ─── Local Fallback (when backend is unavailable) ─────────────────────
const generateLocalFallbackTest = (subject, count, difficulty, timeLimit) => {
  const fallbackQuestions = getLocalFallbackQuestions(subject);
  const shuffled = fallbackQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
  const randomized = shuffleQuestionOptions(shuffled);

  return {
    success: true,
    data: {
      questions: randomized,
      subject,
      difficulty,
      timeLimit: timeLimit || 15,
      totalQuestions: randomized.length,
      generatedAt: new Date().toISOString(),
      isFallback: true,
    },
  };
};

// Local fallback questions (used when backend is completely unreachable)
const getLocalFallbackQuestions = (subject) => {
  const fallbacks = {
    'Programming in C': [
      { id: 1, question: 'Which keyword is used to prevent modification of a variable in C?', options: ['const', 'static', 'volatile', 'register'], correct: 0, explanation: 'const declares a read-only variable' },
      { id: 2, question: 'What is the size of int on a 32-bit system?', options: ['2 bytes', '4 bytes', '8 bytes', '1 byte'], correct: 1, explanation: 'int is typically 4 bytes on 32-bit systems' },
      { id: 3, question: 'What does malloc() return on failure?', options: ['0', '-1', 'NULL', 'undefined'], correct: 2, explanation: 'malloc returns NULL when memory allocation fails' },
      { id: 4, question: 'Which operator accesses a structure member through a pointer?', options: ['.', '*', '->', '&'], correct: 2, explanation: 'Arrow operator (->) dereferences and accesses structure members' },
      { id: 5, question: 'What is a dangling pointer?', options: ['Null pointer', 'Pointer to freed memory', 'Wild pointer', 'Void pointer'], correct: 1, explanation: 'A dangling pointer refers to memory that has been freed' },
      { id: 6, question: 'Which function concatenates two strings in C?', options: ['strcmp()', 'strcat()', 'strcpy()', 'strlen()'], correct: 1, explanation: 'strcat appends one string to another' },
      { id: 7, question: 'What does the static keyword do for a local variable?', options: ['Makes it global', 'Preserves value between calls', 'Makes it constant', 'Allocates on heap'], correct: 1, explanation: 'Static local variables retain their value between function calls' },
      { id: 8, question: 'What is a void pointer?', options: ['Null pointer', 'Generic pointer that can point to any type', 'Invalid pointer', 'Pointer to function'], correct: 1, explanation: 'void* is a generic pointer type' },
      { id: 9, question: 'What is a segmentation fault?', options: ['Syntax error', 'Accessing memory you do not own', 'Division by zero', 'Stack overflow'], correct: 1, explanation: 'Segfault occurs when program tries to access restricted memory' },
      { id: 10, question: 'Which loop is guaranteed to execute at least once?', options: ['for', 'while', 'do-while', 'None'], correct: 2, explanation: 'do-while checks condition after executing the body' },
      { id: 11, question: 'What is the use of typedef in C?', options: ['Define constant', 'Create alias for data type', 'Define function', 'Declare variable'], correct: 1, explanation: 'typedef creates an alias name for an existing data type' },
      { id: 12, question: 'What does calloc() do differently from malloc()?', options: ['Faster allocation', 'Initializes memory to zero', 'Allocates less memory', 'Returns void'], correct: 1, explanation: 'calloc allocates and initializes all bytes to zero' },
      { id: 13, question: 'What is recursion?', options: ['Loop iteration', 'Function calling itself', 'Pointer arithmetic', 'Memory allocation'], correct: 1, explanation: 'Recursion is when a function calls itself' },
      { id: 14, question: 'What is the null character in C strings?', options: ['\\n', '\\0', '\\t', '\\r'], correct: 1, explanation: '\\0 marks the end of a string in C' },
      { id: 15, question: 'What is the return type of main() in C?', options: ['void', 'int', 'float', 'char'], correct: 1, explanation: 'main() returns int to indicate success (0) or failure to the OS' },
      { id: 16, question: 'What is an enum in C?', options: ['Float type', 'Set of named integer constants', 'String type', 'Pointer type'], correct: 1, explanation: 'enum defines a set of named integer constants' },
      { id: 17, question: 'What is a memory leak?', options: ['Freed memory', 'Allocated memory not freed', 'Null pointer', 'Buffer overflow'], correct: 1, explanation: 'Memory leak occurs when dynamically allocated memory is never freed' },
      { id: 18, question: 'What is the ternary operator in C?', options: ['&&', '||', '?:', '::'], correct: 2, explanation: '?: is the conditional ternary operator' },
      { id: 19, question: 'What is a macro in C?', options: ['Function pointer', 'Preprocessor text substitution', 'Data type', 'Variable type'], correct: 1, explanation: 'Macros defined with #define are text replacements done by preprocessor' },
      { id: 20, question: 'What is a structure in C?', options: ['Array type', 'Collection of different data types', 'Pointer type', 'Function type'], correct: 1, explanation: 'struct groups variables of different types under one name' },
      { id: 21, question: 'What is the difference between ++i and i++?', options: ['Same thing', '++i increments before use, i++ after use', 'i++ is faster', '++i is deprecated'], correct: 1, explanation: 'Pre-increment changes value before expression evaluation; post-increment after' },
      { id: 22, question: 'What is a union in C?', options: ['Same as struct', 'Members share same memory location', 'Array type', 'Pointer type'], correct: 1, explanation: 'Union members share the same memory, only one can hold a value at a time' },
      { id: 23, question: 'What does the volatile keyword do?', options: ['Makes constant', 'Prevents compiler optimization of variable', 'Allocates memory', 'Frees memory'], correct: 1, explanation: 'volatile tells compiler the variable may change unexpectedly (e.g., hardware registers)' },
      { id: 24, question: 'What is the scope of a global variable?', options: ['Inside function', 'Entire program file', 'Inside loop', 'Inside block'], correct: 1, explanation: 'Global variables are accessible throughout the file from declaration to end' },
      { id: 25, question: 'What is a function pointer?', options: ['Pointer to variable', 'Variable storing address of a function', 'Return value', 'Parameter'], correct: 1, explanation: 'Function pointers store the address of functions for dynamic calling' },
      { id: 26, question: 'What does sizeof() return?', options: ['Value of variable', 'Size in bytes of type or variable', 'Address', 'Array length'], correct: 1, explanation: 'sizeof returns the size in bytes of a data type or variable' },
      { id: 27, question: 'What is a buffer overflow?', options: ['Empty buffer', 'Writing beyond allocated memory', 'Null pointer', 'Memory leak'], correct: 1, explanation: 'Buffer overflow writes data past the end of allocated buffer, causing undefined behavior' },
      { id: 28, question: 'What does the break statement do?', options: ['Pauses program', 'Exits the innermost loop or switch', 'Continues loop', 'Returns value'], correct: 1, explanation: 'break immediately exits the current loop or switch statement' },
      { id: 29, question: 'What is a header file in C?', options: ['Main code', 'File with declarations and macros (.h)', 'Object file', 'Library file'], correct: 1, explanation: 'Header files contain function declarations, macros, and type definitions' },
      { id: 30, question: 'What is the difference between array and pointer?', options: ['Same thing', 'Array is fixed memory block, pointer stores address', 'Pointer is fixed', 'Array stores address'], correct: 1, explanation: 'Arrays are contiguous memory blocks; pointers hold memory addresses' },
      { id: 31, question: 'What is a linked list in C?', options: ['Array', 'Dynamic data structure using pointers', 'Stack', 'Queue'], correct: 1, explanation: 'Linked lists use nodes with data and pointers to create dynamic sequences' },
      { id: 32, question: 'What does fopen() do?', options: ['Creates directory', 'Opens a file and returns FILE pointer', 'Closes file', 'Deletes file'], correct: 1, explanation: 'fopen opens a file in specified mode and returns a FILE pointer' },
      { id: 33, question: 'What is the purpose of the continue statement?', options: ['Exit loop', 'Skip to next iteration of loop', 'Break program', 'Return value'], correct: 1, explanation: 'continue skips remaining loop body and jumps to next iteration' },
      { id: 34, question: 'What are command line arguments?', options: ['GUI inputs', 'Arguments passed to main via argc/argv', 'Function parameters', 'Global variables'], correct: 1, explanation: 'argc counts arguments and argv is array of argument strings passed at program launch' },
      { id: 35, question: 'What is bitwise AND operator in C?', options: ['&&', '&', '||', '|'], correct: 1, explanation: '& performs bitwise AND; && is logical AND' },
      { id: 36, question: 'What is dynamic memory allocation?', options: ['Static allocation', 'Allocating memory at runtime using malloc/calloc', 'Stack allocation', 'Register allocation'], correct: 1, explanation: 'Dynamic allocation lets you request memory at runtime from the heap' },
      { id: 37, question: 'What is the extern keyword?', options: ['Creates variable', 'Declares variable defined in another file', 'Deletes variable', 'Makes constant'], correct: 1, explanation: 'extern declares that a variable is defined in another source file' },
      { id: 38, question: 'What is a two-dimensional array in C?', options: ['Single array', 'Array of arrays (matrix)', 'Pointer array', 'Linked list'], correct: 1, explanation: '2D arrays are arrays of arrays, representing rows and columns like a matrix' },
      { id: 39, question: 'What is the difference between scanf and gets?', options: ['Same function', 'scanf reads formatted input, gets reads entire line', 'gets is safer', 'scanf reads lines'], correct: 1, explanation: 'scanf reads formatted input stopping at whitespace; gets reads whole line (unsafe)' },
      { id: 40, question: 'What does the register keyword suggest?', options: ['Memory allocation', 'Store variable in CPU register for speed', 'Global scope', 'Constant value'], correct: 1, explanation: 'register suggests the compiler store the variable in a CPU register' },
      { id: 41, question: 'What is a multi-file program in C?', options: ['Single file', 'Program split across multiple .c and .h files', 'Binary file', 'Text file'], correct: 1, explanation: 'Large C programs are split into multiple source and header files' },
      { id: 42, question: 'What is the difference between printf and sprintf?', options: ['Same thing', 'printf outputs to screen, sprintf to string', 'sprintf is faster', 'printf writes to file'], correct: 1, explanation: 'printf writes to stdout; sprintf writes formatted output to a string buffer' },
      { id: 43, question: 'What is type casting in C?', options: ['Error handling', 'Converting one data type to another', 'Variable declaration', 'Function call'], correct: 1, explanation: 'Type casting explicitly converts a value from one type to another' },
      { id: 44, question: 'What is the preprocessor in C?', options: ['Compiler', 'Tool processing directives (#include, #define) before compilation', 'Linker', 'Debugger'], correct: 1, explanation: 'Preprocessor handles directives like #include and #define before actual compilation' },
      { id: 45, question: 'What is a constant pointer vs pointer to constant?', options: ['Same thing', 'Const pointer: fixed address; ptr to const: fixed value', 'No difference', 'Both are errors'], correct: 1, explanation: 'const int* = value cant change; int* const = address cant change' },
      { id: 46, question: 'What does free() do?', options: ['Allocates memory', 'Deallocates dynamically allocated memory', 'Clears screen', 'Closes file'], correct: 1, explanation: 'free releases memory previously allocated by malloc/calloc/realloc' },
      { id: 47, question: 'What is an array of pointers?', options: ['Single pointer', 'Array where each element is a pointer', 'Pointer to array', 'String'], correct: 1, explanation: 'Array of pointers stores multiple addresses, useful for string arrays' },
      { id: 48, question: 'What is the switch statement used for?', options: ['Loop', 'Multi-way branching based on value', 'Function call', 'Error handling'], correct: 1, explanation: 'switch selects one of many code blocks based on a variable value' },
      { id: 49, question: 'What is an infinite loop?', options: ['Fast loop', 'Loop that never terminates', 'Empty loop', 'Nested loop'], correct: 1, explanation: 'An infinite loop runs forever because its condition never becomes false' },
      { id: 50, question: 'What is the difference between stack and heap memory?', options: ['Same thing', 'Stack is auto/local, heap is dynamically allocated', 'Heap is faster', 'Stack is larger'], correct: 1, explanation: 'Stack stores local variables automatically; heap stores dynamically allocated memory' },
    ],
    'Data Structures': [
      { id: 1, question: 'What is the time complexity of searching in a balanced BST?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correct: 1, explanation: 'Balanced BST halves search space each step' },
      { id: 2, question: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, explanation: 'Stack uses Last In, First Out' },
      { id: 3, question: 'Which traversal of BST gives sorted output?', options: ['Preorder', 'Inorder', 'Postorder', 'Level order'], correct: 1, explanation: 'Inorder traversal visits left-root-right giving sorted order' },
      { id: 4, question: 'What data structure is used for BFS?', options: ['Stack', 'Array', 'Queue', 'Heap'], correct: 2, explanation: 'BFS uses a queue for level-by-level traversal' },
      { id: 5, question: 'What is the average time complexity of hash table lookup?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 3, explanation: 'Hash tables provide constant-time average lookup' },
      { id: 6, question: 'Which data structure is best for a priority queue?', options: ['Stack', 'Heap', 'Queue', 'Linked List'], correct: 1, explanation: 'Heaps efficiently support priority queue operations' },
      { id: 7, question: 'What is a complete binary tree?', options: ['All leaves same level', 'Every node has 2 children', 'All levels filled except possibly last', 'Height is log n'], correct: 2, explanation: 'Complete tree fills levels left to right' },
      { id: 8, question: 'What is the time complexity of merge sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correct: 1, explanation: 'Merge sort divides and merges in O(n log n)' },
      { id: 9, question: 'Which data structure is used for DFS?', options: ['Queue', 'Stack', 'Heap', 'Hash Table'], correct: 1, explanation: 'DFS uses a stack for depth-first exploration' },
      { id: 10, question: 'What is a trie used for?', options: ['Sorting numbers', 'String/prefix matching', 'Graph traversal', 'Memory management'], correct: 1, explanation: 'Trie is optimized for prefix-based string operations' },
      { id: 11, question: 'What is an AVL tree?', options: ['Any binary tree', 'Self-balancing BST', 'B-tree variant', 'Trie variant'], correct: 1, explanation: 'AVL tree maintains balance at every node' },
      { id: 12, question: 'What is the worst case for hash table operations?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correct: 2, explanation: 'When all keys hash to same bucket, degrades to O(n)' },
      { id: 13, question: 'What is topological sorting?', options: ['Sorting numbers', 'Linear ordering of DAG vertices', 'Sorting strings', 'Heap sort'], correct: 1, explanation: 'Topological sort orders DAG vertices respecting edge direction' },
      { id: 14, question: 'What is a doubly linked list?', options: ['Two linked lists', 'Each node has prev and next pointers', 'Circular list', 'Array-based list'], correct: 1, explanation: 'Doubly linked list nodes point to both previous and next' },
      { id: 15, question: 'What algorithm finds shortest path in weighted graph?', options: ['BFS', 'DFS', 'Dijkstra', 'Topological sort'], correct: 2, explanation: 'Dijkstra finds shortest path from source to all vertices' },
      { id: 16, question: 'What is the worst case of quicksort?', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correct: 2, explanation: 'Quicksort degrades to O(n²) with poor pivot selection' },
      { id: 17, question: 'What is a spanning tree?', options: ['Any subgraph', 'Subgraph connecting all vertices with no cycles', 'Shortest path tree', 'Complete graph'], correct: 1, explanation: 'Spanning tree connects all vertices with minimum edges' },
      { id: 18, question: 'What is a min-heap?', options: ['Max at root', 'Min element at root', 'Sorted array', 'Balanced BST'], correct: 1, explanation: 'In a min-heap, root contains the minimum element' },
      { id: 19, question: 'What is a DAG?', options: ['Directed Acyclic Graph', 'Dynamic Array Graph', 'Dense Adjacency Graph', 'Double Array Graph'], correct: 0, explanation: 'DAG is a directed graph with no cycles' },
      { id: 20, question: 'What is Kruskal\'s algorithm used for?', options: ['Shortest path', 'Minimum spanning tree', 'Topological sort', 'Graph coloring'], correct: 1, explanation: 'Kruskal finds minimum spanning tree by adding smallest edges' },
      { id: 21, question: 'What is a circular linked list?', options: ['Broken list', 'Last node points back to first', 'Array variant', 'Tree type'], correct: 1, explanation: 'Circular list has the last node pointing to the first, forming a loop' },
      { id: 22, question: 'What is a B-tree?', options: ['Binary tree', 'Self-balancing tree for disk-based storage', 'BST variant', 'Trie'], correct: 1, explanation: 'B-trees maintain balance and are optimized for disk I/O in databases' },
      { id: 23, question: 'What is a deque?', options: ['Queue variant', 'Double-ended queue allowing insert/remove at both ends', 'Stack variant', 'Linked list'], correct: 1, explanation: 'Deque supports insertion and deletion at both front and rear' },
      { id: 24, question: 'What is the time complexity of accessing an array element by index?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correct: 2, explanation: 'Array access by index is O(1) through direct memory addressing' },
      { id: 25, question: 'What is a red-black tree?', options: ['Colored tree', 'Self-balancing BST with color properties', 'B-tree variant', 'Trie variant'], correct: 1, explanation: 'Red-black trees use node colors to maintain approximate balance' },
      { id: 26, question: 'What is a graph adjacency matrix?', options: ['Node list', '2D array where entry (i,j) indicates edge between i and j', 'Edge list', 'Linked list'], correct: 1, explanation: 'Adjacency matrix uses a 2D array for O(1) edge lookup' },
      { id: 27, question: 'What is a graph adjacency list?', options: ['Matrix', 'Array of lists where each list stores neighbors', 'Edge array', 'Node array'], correct: 1, explanation: 'Adjacency lists store neighbors for each vertex, saving space for sparse graphs' },
      { id: 28, question: 'What is the difference between stack and queue?', options: ['Same thing', 'Stack is LIFO, queue is FIFO', 'Queue is LIFO', 'Stack is FIFO'], correct: 1, explanation: 'Stack removes most recent element; queue removes oldest element' },
      { id: 29, question: 'What is a segment tree?', options: ['File tree', 'Tree for efficient range queries and updates', 'BST variant', 'B-tree'], correct: 1, explanation: 'Segment trees answer range queries (sum, min, max) in O(log n)' },
      { id: 30, question: 'What is hashing?', options: ['Encryption', 'Mapping data to fixed-size values for fast lookup', 'Sorting', 'Compression'], correct: 1, explanation: 'Hashing converts keys to array indices for O(1) average-case lookups' },
      { id: 31, question: 'What is a binary search tree property?', options: ['All nodes equal', 'Left child < parent < right child', 'Random order', 'Sorted array'], correct: 1, explanation: 'BST property: left subtree values < node < right subtree values' },
      { id: 32, question: 'What is the height of a balanced BST with n nodes?', options: ['n', 'n/2', 'log n', 'n²'], correct: 2, explanation: 'A balanced BST has height O(log n)' },
      { id: 33, question: 'What is a suffix tree?', options: ['Prefix tree', 'Tree of all suffixes of a string', 'BST', 'Heap'], correct: 1, explanation: 'Suffix trees store all suffixes for fast pattern matching' },
      { id: 34, question: 'What is a disjoint set (Union-Find)?', options: ['Sorted set', 'Data structure tracking elements in non-overlapping sets', 'Hash set', 'Tree set'], correct: 1, explanation: 'Union-Find efficiently tracks partitions with union and find operations' },
      { id: 35, question: 'What is Prim\'s algorithm?', options: ['Shortest path', 'Greedy MST algorithm growing from a vertex', 'Sorting', 'Searching'], correct: 1, explanation: 'Prim builds MST by always adding the cheapest edge from the tree' },
      { id: 36, question: 'What is level order traversal?', options: ['DFS', 'BFS traversal visiting nodes level by level', 'Inorder', 'Postorder'], correct: 1, explanation: 'Level order uses a queue to visit nodes level by level (BFS)' },
      { id: 37, question: 'What is a skip list?', options: ['Linked list', 'Layered linked list with express lanes for O(log n) search', 'Array', 'Tree'], correct: 1, explanation: 'Skip lists add probabilistic layers for faster search than plain linked lists' },
      { id: 38, question: 'What is an expression tree?', options: ['Parse tree', 'Binary tree representing arithmetic expression', 'BST', 'Trie'], correct: 1, explanation: 'Expression trees have operators at internal nodes and operands at leaves' },
      { id: 39, question: 'What is the time complexity of inserting into a heap?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correct: 1, explanation: 'Heap insertion adds at bottom and bubbles up in O(log n)' },
      { id: 40, question: 'What is a weighted graph?', options: ['Heavy graph', 'Graph where edges have associated costs/weights', 'Complete graph', 'Simple graph'], correct: 1, explanation: 'Weighted graphs assign numeric values (weights) to edges' },
      { id: 41, question: 'What is a Fenwick tree (BIT)?', options: ['Binary tree', 'Tree for efficient prefix sum queries and updates', 'BST', 'B-tree'], correct: 1, explanation: 'Binary Indexed Tree supports prefix sum queries and point updates in O(log n)' },
      { id: 42, question: 'What is an Euler path?', options: ['Shortest path', 'Path visiting every edge exactly once', 'Hamiltonian path', 'BFS path'], correct: 1, explanation: 'Euler path traverses every edge of a graph exactly once' },
      { id: 43, question: 'What is a Hamiltonian path?', options: ['Euler path', 'Path visiting every vertex exactly once', 'Shortest path', 'DFS path'], correct: 1, explanation: 'Hamiltonian path visits each vertex exactly once' },
      { id: 44, question: 'What is the difference between BFS and DFS?', options: ['Same algorithm', 'BFS uses queue (breadth-first), DFS uses stack (depth-first)', 'DFS uses queue', 'BFS uses stack'], correct: 1, explanation: 'BFS explores level by level with a queue; DFS explores depth-first with a stack' },
      { id: 45, question: 'What is a max-heap?', options: ['Min at root', 'Maximum element at root', 'Sorted array', 'BST'], correct: 1, explanation: 'Max-heap ensures the root always contains the maximum element' },
      { id: 46, question: 'What is a sparse graph?', options: ['Dense graph', 'Graph with far fewer edges than maximum possible', 'Complete graph', 'Weighted graph'], correct: 1, explanation: 'Sparse graphs have edges much fewer than V*(V-1)/2' },
      { id: 47, question: 'What is a strongly connected component?', options: ['Connected graph', 'Maximal subgraph where every vertex is reachable from every other', 'Tree', 'Cycle'], correct: 1, explanation: 'SCC is a maximal set of vertices with paths between all pairs' },
      { id: 48, question: 'What is a bloom filter?', options: ['Image filter', 'Probabilistic data structure for set membership', 'Hash table', 'Queue'], correct: 1, explanation: 'Bloom filters test membership with possible false positives but no false negatives' },
      { id: 49, question: 'What is the time complexity of deleting from a BST?', options: ['O(1)', 'O(n)', 'O(log n) average', 'O(n²)'], correct: 2, explanation: 'BST deletion is O(log n) on average, O(n) worst case if unbalanced' },
      { id: 50, question: 'What is a graph cycle?', options: ['Linear path', 'Path that starts and ends at the same vertex', 'Tree', 'Forest'], correct: 1, explanation: 'A cycle is a path where the first and last vertices are the same' },
    ],
    'Database Management': [
      { id: 1, question: 'What does SQL stand for?', options: ['Simple Query Language', 'Structured Query Language', 'Standard Query Logic', 'System Query Language'], correct: 1, explanation: 'SQL is Structured Query Language' },
      { id: 2, question: 'Which normal form eliminates partial dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correct: 1, explanation: '2NF removes partial dependencies on primary key' },
      { id: 3, question: 'What is normalization?', options: ['Adding indexes', 'Reducing data redundancy', 'Creating backups', 'Encrypting data'], correct: 1, explanation: 'Normalization organizes data to reduce redundancy' },
      { id: 4, question: 'Which SQL clause filters grouped results?', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'], correct: 2, explanation: 'HAVING filters after GROUP BY' },
      { id: 5, question: 'What does ACID stand for?', options: ['Access, Control, Integrity, Data', 'Atomicity, Consistency, Isolation, Durability', 'Atomicity, Control, Isolation, Data', 'Access, Consistency, Integrity, Durability'], correct: 1, explanation: 'ACID properties ensure reliable transactions' },
      { id: 6, question: 'What is a foreign key?', options: ['Primary key of current table', 'Reference to primary key in another table', 'Unique key', 'Candidate key'], correct: 1, explanation: 'Foreign key establishes relationships between tables' },
      { id: 7, question: 'What is a deadlock?', options: ['Database crash', 'Circular wait between transactions', 'Query timeout', 'Lock timeout'], correct: 1, explanation: 'Deadlock occurs when transactions wait circularly' },
      { id: 8, question: 'What is a view in SQL?', options: ['Physical table', 'Virtual table based on query result', 'Index', 'Stored procedure'], correct: 1, explanation: 'A view is a stored query acting like a virtual table' },
      { id: 9, question: 'What is the difference between DELETE and TRUNCATE?', options: ['No difference', 'DELETE logs rows, TRUNCATE removes all without logging', 'DELETE is faster', 'TRUNCATE keeps data'], correct: 1, explanation: 'DELETE removes rows individually; TRUNCATE removes all at once' },
      { id: 10, question: 'What is a stored procedure?', options: ['Table type', 'Precompiled SQL code stored in database', 'Index type', 'View type'], correct: 1, explanation: 'Stored procedures are reusable precompiled SQL programs' },
      { id: 11, question: 'What is referential integrity?', options: ['Data encryption', 'Foreign key values must match primary key', 'Data backup', 'Query optimization'], correct: 1, explanation: 'Referential integrity ensures FK values exist in referenced table' },
      { id: 12, question: 'What is an index in SQL?', options: ['Primary key', 'Data structure for faster query lookup', 'Table copy', 'View'], correct: 1, explanation: 'Indexes speed up data retrieval' },
      { id: 13, question: 'What does COMMIT do?', options: ['Deletes data', 'Permanently saves transaction changes', 'Undoes changes', 'Locks table'], correct: 1, explanation: 'COMMIT makes transaction changes permanent' },
      { id: 14, question: 'What is the LIKE operator used for?', options: ['Exact match', 'Pattern matching in strings', 'Numeric comparison', 'Date comparison'], correct: 1, explanation: 'LIKE uses wildcards for pattern matching' },
      { id: 15, question: 'What is the difference between UNION and UNION ALL?', options: ['No difference', 'UNION removes duplicates, UNION ALL keeps them', 'UNION ALL is slower', 'UNION adds columns'], correct: 1, explanation: 'UNION removes duplicates; UNION ALL includes all' },
      { id: 16, question: 'What is a trigger in SQL?', options: ['Button', 'Automatic action on table event', 'Query type', 'Index type'], correct: 1, explanation: 'Triggers execute automatically on INSERT, UPDATE, DELETE' },
      { id: 17, question: 'What is sharding?', options: ['Data encryption', 'Splitting database across multiple servers', 'Backup strategy', 'Index type'], correct: 1, explanation: 'Sharding distributes data across multiple instances' },
      { id: 18, question: 'What is denormalization?', options: ['Removing tables', 'Adding redundancy for read performance', 'Deleting data', 'Creating indexes'], correct: 1, explanation: 'Denormalization adds redundancy to improve read performance' },
      { id: 19, question: 'What is an ER diagram?', options: ['Error report', 'Entity-Relationship diagram for database design', 'Execution report', 'Event record'], correct: 1, explanation: 'ER diagrams visually represent entities and relationships' },
      { id: 20, question: 'What type of database is MongoDB?', options: ['Relational database', 'Graph database', 'NoSQL document database', 'Time-series database'], correct: 2, explanation: 'MongoDB stores data as JSON-like documents' },
      { id: 21, question: 'What is a candidate key?', options: ['Foreign key', 'Minimal set of attributes uniquely identifying a row', 'Primary key only', 'Index'], correct: 1, explanation: 'Candidate key is a minimal superkey that can uniquely identify each row' },
      { id: 22, question: 'What is ROLLBACK?', options: ['Commit changes', 'Undo all changes in current transaction', 'Delete table', 'Create backup'], correct: 1, explanation: 'ROLLBACK undoes all changes made in the current transaction' },
      { id: 23, question: 'What is a composite key?', options: ['Single column key', 'Primary key made of multiple columns', 'Foreign key', 'Unique key'], correct: 1, explanation: 'Composite key uses two or more columns together as the primary key' },
      { id: 24, question: 'What is a cursor in SQL?', options: ['Mouse pointer', 'Mechanism for row-by-row processing of query results', 'Index type', 'View type'], correct: 1, explanation: 'Cursors allow iterating through query results one row at a time' },
      { id: 25, question: 'What is data warehousing?', options: ['Storage room', 'Central repository for integrated data from multiple sources', 'Database backup', 'Cloud storage'], correct: 1, explanation: 'Data warehouses store large volumes of historical data for analysis' },
      { id: 26, question: 'What is a subquery?', options: ['Main query', 'Query nested inside another query', 'Join', 'View'], correct: 1, explanation: 'Subqueries are queries within queries used for complex filtering' },
      { id: 27, question: 'What is the difference between INNER JOIN and OUTER JOIN?', options: ['Same thing', 'INNER returns only matches, OUTER includes non-matches', 'OUTER is faster', 'INNER includes nulls'], correct: 1, explanation: 'INNER JOIN returns only matching rows; OUTER JOIN includes unmatched rows too' },
      { id: 28, question: 'What is a transaction?', options: ['Purchase', 'Sequence of operations treated as a single unit', 'Query', 'Table'], correct: 1, explanation: 'Transactions group operations so they all succeed or all fail together' },
      { id: 29, question: 'What is BCNF?', options: ['Before Normal Form', 'Boyce-Codd Normal Form stricter than 3NF', '4th normal form', '5th normal form'], correct: 1, explanation: 'BCNF is stricter than 3NF: every determinant must be a candidate key' },
      { id: 30, question: 'What is a materialized view?', options: ['Regular view', 'Stored result of a view query for faster access', 'Index', 'Table copy'], correct: 1, explanation: 'Materialized views physically store query results and refresh periodically' },
      { id: 31, question: 'What is SQL injection?', options: ['Database update', 'Security attack inserting malicious SQL through input', 'Stored procedure', 'Query optimization'], correct: 1, explanation: 'SQL injection exploits unsanitized input to execute malicious queries' },
      { id: 32, question: 'What is a self join?', options: ['Auto join', 'Table joined with itself', 'Cross join', 'Natural join'], correct: 1, explanation: 'Self joins compare rows within the same table using aliases' },
      { id: 33, question: 'What is the GROUP BY clause?', options: ['Sorting', 'Groups rows with same values for aggregate functions', 'Filtering', 'Joining'], correct: 1, explanation: 'GROUP BY groups rows to apply aggregate functions like COUNT, SUM, AVG' },
      { id: 34, question: 'What is a superkey?', options: ['Best key', 'Set of attributes that uniquely identifies each row', 'Foreign key', 'Primary key'], correct: 1, explanation: 'A superkey is any set of columns that can uniquely identify rows' },
      { id: 35, question: 'What is a schema?', options: ['Data', 'Logical structure defining database organization', 'Query', 'Table'], correct: 1, explanation: 'Schema defines tables, columns, types, relationships and constraints' },
      { id: 36, question: 'What is the DISTINCT keyword?', options: ['Sorts results', 'Removes duplicate rows from query results', 'Filters nulls', 'Groups data'], correct: 1, explanation: 'DISTINCT returns only unique values in the result set' },
      { id: 37, question: 'What is a clustered index?', options: ['Multiple indexes', 'Index that physically reorders table data', 'Non-clustered index', 'Unique index'], correct: 1, explanation: 'Clustered index sorts the actual table data; only one per table' },
      { id: 38, question: 'What is the purpose of the WHERE clause?', options: ['Sorting', 'Filtering rows based on a condition', 'Grouping', 'Joining'], correct: 1, explanation: 'WHERE filters rows that meet specified conditions before grouping' },
      { id: 39, question: 'What is a natural join?', options: ['Cross join', 'Join on columns with same name and type automatically', 'Self join', 'Outer join'], correct: 1, explanation: 'Natural join automatically joins on columns with matching names' },
      { id: 40, question: 'What is concurrency control?', options: ['Speed control', 'Managing simultaneous database access by multiple users', 'Backup control', 'Query control'], correct: 1, explanation: 'Concurrency control ensures data consistency when multiple users access data simultaneously' },
      { id: 41, question: 'What is a data dictionary?', options: ['English dictionary', 'Repository of metadata about database objects', 'Data backup', 'Query log'], correct: 1, explanation: 'Data dictionary stores information about tables, columns, types, and constraints' },
      { id: 42, question: 'What is the CAP theorem?', options: ['Math theorem', 'Distributed systems can have at most 2 of: Consistency, Availability, Partition tolerance', 'Database design', 'Query optimization'], correct: 1, explanation: 'CAP theorem states distributed systems must sacrifice one of C, A, or P' },
      { id: 43, question: 'What is an aggregate function?', options: ['String function', 'Function performing calculation on set of values (SUM, AVG, COUNT)', 'Date function', 'Join function'], correct: 1, explanation: 'Aggregate functions compute a single result from multiple rows' },
      { id: 44, question: 'What is two-phase locking?', options: ['Lock types', 'Protocol where transactions acquire then release locks', 'Deadlock prevention', 'Query optimization'], correct: 1, explanation: '2PL has growing phase (acquiring locks) and shrinking phase (releasing locks)' },
      { id: 45, question: 'What is a cross join?', options: ['Inner join', 'Cartesian product of two tables', 'Self join', 'Natural join'], correct: 1, explanation: 'Cross join produces every combination of rows from both tables' },
      { id: 46, question: 'What does DROP TABLE do?', options: ['Empties table', 'Permanently removes table and its data', 'Renames table', 'Copies table'], correct: 1, explanation: 'DROP TABLE permanently deletes the table structure and all data' },
      { id: 47, question: 'What is the difference between CHAR and VARCHAR?', options: ['Same thing', 'CHAR is fixed-length, VARCHAR is variable-length', 'VARCHAR is fixed', 'CHAR is faster always'], correct: 1, explanation: 'CHAR pads to fixed length; VARCHAR stores only actual characters used' },
      { id: 48, question: 'What is an OLTP system?', options: ['Analysis system', 'Online Transaction Processing for day-to-day operations', 'Backup system', 'Data warehouse'], correct: 1, explanation: 'OLTP handles high volumes of short, fast transactions' },
      { id: 49, question: 'What is the ORDER BY clause?', options: ['Groups data', 'Sorts query results in ascending or descending order', 'Filters data', 'Joins tables'], correct: 1, explanation: 'ORDER BY sorts result set by specified columns' },
      { id: 50, question: 'What is a savepoint?', options: ['Auto-save', 'Point within transaction to partially rollback to', 'Backup', 'Commit'], correct: 1, explanation: 'Savepoints allow rolling back part of a transaction without undoing everything' },
    ],
    'OOP (Java/Python/C++)': [
      { id: 1, question: 'What is encapsulation?', options: ['Inheriting from parent', 'Bundling data and methods together', 'Method overriding', 'Using interfaces'], correct: 1, explanation: 'Encapsulation wraps data and methods into a single unit' },
      { id: 2, question: 'What is polymorphism?', options: ['Multiple inheritance', 'Data hiding', 'Same interface, different implementations', 'Object creation'], correct: 2, explanation: 'Polymorphism allows objects to take many forms' },
      { id: 3, question: 'Which OOP principle is achieved through inheritance?', options: ['Data hiding', 'Abstraction', 'Code reusability', 'Polymorphism'], correct: 2, explanation: 'Inheritance allows reuse of parent class code' },
      { id: 4, question: 'What is an abstract class?', options: ['Class with no methods', 'Private class', 'Class that cannot be instantiated', 'Final class'], correct: 2, explanation: 'Abstract classes cannot be instantiated directly' },
      { id: 5, question: 'What is method overloading?', options: ['Same name, same parameters', 'Same name, different parameters', 'Overriding parent method', 'Static method'], correct: 1, explanation: 'Overloading uses same method name with different signatures' },
      { id: 6, question: 'Which design pattern ensures only one instance?', options: ['Factory', 'Observer', 'Singleton', 'Strategy'], correct: 2, explanation: 'Singleton restricts class to one object' },
      { id: 7, question: 'What is an interface?', options: ['Concrete class', 'Type of variable', 'Contract with abstract methods', 'Design pattern'], correct: 2, explanation: 'Interfaces define method signatures without implementation' },
      { id: 8, question: 'What is the diamond problem?', options: ['Memory leak', 'Ambiguity in multiple inheritance', 'Null pointer issue', 'Stack overflow'], correct: 1, explanation: 'Diamond problem arises from multiple inheritance with common ancestor' },
      { id: 9, question: 'What is the Liskov Substitution Principle?', options: ['Use interfaces', 'Subtypes must be substitutable for base types', 'Single responsibility', 'Open/closed principle'], correct: 1, explanation: 'LSP: superclass objects should be replaceable with subclass objects' },
      { id: 10, question: 'What is composition in OOP?', options: ['Inheritance type', 'Building complex objects from simpler ones', 'Interface implementation', 'Method chaining'], correct: 1, explanation: 'Composition creates complex objects by combining simpler objects' },
      { id: 11, question: 'What is the Factory pattern?', options: ['Creating objects directly', 'Delegating object creation to a factory method', 'Singleton variant', 'Observer pattern'], correct: 1, explanation: 'Factory pattern creates objects without exposing creation logic' },
      { id: 12, question: 'What is dependency injection?', options: ['Creating dependencies inside class', 'Providing dependencies from outside', 'Deleting dependencies', 'Static dependencies'], correct: 1, explanation: 'DI provides objects with their dependencies externally' },
      { id: 13, question: 'What is the Observer pattern?', options: ['Watching variables', 'One-to-many notification of state changes', 'Singleton variant', 'Factory variant'], correct: 1, explanation: 'Observer notifies multiple objects when subject state changes' },
      { id: 14, question: 'What is a virtual function?', options: ['Non-existent function', 'Function that can be overridden in derived class', 'Static function', 'Private function'], correct: 1, explanation: 'Virtual functions enable runtime polymorphism' },
      { id: 15, question: 'What is garbage collection?', options: ['Deleting files', 'Automatic memory management', 'Manual deallocation', 'Disk cleanup'], correct: 1, explanation: 'GC automatically reclaims unused object memory' },
      { id: 16, question: 'What does the SOLID S stand for?', options: ['Simple', 'Structured', 'Single Responsibility', 'Serializable'], correct: 2, explanation: 'A class should have only one reason to change' },
      { id: 17, question: 'What is the purpose of a constructor?', options: ['Destroy object', 'Copy object', 'Initialize object state', 'Compare objects'], correct: 2, explanation: 'Constructors initialize object attributes when created' },
      { id: 18, question: 'What is the MVC pattern?', options: ['Database pattern', 'Model-View-Controller separation', 'Memory-Variable-Class', 'Method-Value-Constructor'], correct: 1, explanation: 'MVC separates data, presentation, and logic' },
      { id: 19, question: 'What is an immutable object?', options: ['Large object', 'Object whose state cannot change after creation', 'Private object', 'Static object'], correct: 1, explanation: 'Immutable objects cannot be modified after construction' },
      { id: 20, question: 'What is the difference between shallow and deep copy?', options: ['Same thing', 'Shallow copies references, deep copies actual objects', 'Deep is faster', 'Shallow is deeper'], correct: 1, explanation: 'Shallow copy shares nested objects; deep copy duplicates everything' },
      { id: 21, question: 'What is method overriding?', options: ['Same name, different params', 'Subclass redefining parent method with same signature', 'Creating new method', 'Deleting method'], correct: 1, explanation: 'Overriding replaces parent implementation with subclass version' },
      { id: 22, question: 'What is the Open/Closed Principle?', options: ['Open source', 'Classes should be open for extension, closed for modification', 'File handling', 'Database access'], correct: 1, explanation: 'O/C: extend behavior without modifying existing code' },
      { id: 23, question: 'What is aggregation in OOP?', options: ['Inheritance', 'Has-a relationship where parts can exist independently', 'Composition', 'Interface'], correct: 1, explanation: 'Aggregation is a weak has-a relationship; parts can exist without the whole' },
      { id: 24, question: 'What is the Strategy pattern?', options: ['Game strategy', 'Encapsulating interchangeable algorithms', 'Singleton', 'Factory'], correct: 1, explanation: 'Strategy pattern allows selecting algorithms at runtime' },
      { id: 25, question: 'What is a destructor?', options: ['Constructor', 'Method called when object is destroyed', 'Static method', 'Abstract method'], correct: 1, explanation: 'Destructors clean up resources when objects are destroyed' },
      { id: 26, question: 'What is the difference between association and composition?', options: ['Same thing', 'Association is loose coupling, composition is strong ownership', 'Composition is loose', 'No relationship'], correct: 1, explanation: 'Association is general relationship; composition means part cannot exist without whole' },
      { id: 27, question: 'What is the Adapter pattern?', options: ['Charger', 'Converts interface of one class to another expected interface', 'Observer', 'Singleton'], correct: 1, explanation: 'Adapter makes incompatible interfaces work together' },
      { id: 28, question: 'What is the Interface Segregation Principle?', options: ['One large interface', 'Many specific interfaces better than one general-purpose', 'No interfaces', 'Abstract classes only'], correct: 1, explanation: 'ISP: clients should not depend on interfaces they do not use' },
      { id: 29, question: 'What is a static method?', options: ['Instance method', 'Method belonging to class rather than instance', 'Abstract method', 'Virtual method'], correct: 1, explanation: 'Static methods belong to the class and can be called without creating an object' },
      { id: 30, question: 'What is the Decorator pattern?', options: ['Interior design', 'Dynamically adding behavior to objects', 'Inheritance', 'Factory'], correct: 1, explanation: 'Decorator wraps objects to add new behavior without modifying original class' },
      { id: 31, question: 'What is multiple inheritance?', options: ['Single parent', 'Class inheriting from more than one parent class', 'Interface implementation', 'Composition'], correct: 1, explanation: 'Multiple inheritance allows a class to extend more than one base class' },
      { id: 32, question: 'What is the Template Method pattern?', options: ['HTML template', 'Defining algorithm skeleton with subclass-customizable steps', 'Factory', 'Observer'], correct: 1, explanation: 'Template Method defines overall algorithm, letting subclasses override specific steps' },
      { id: 33, question: 'What is access control in OOP?', options: ['Network security', 'Restricting access to class members via public/private/protected', 'File permissions', 'Database security'], correct: 1, explanation: 'Access modifiers control which code can access class members' },
      { id: 34, question: 'What is the Command pattern?', options: ['CLI command', 'Encapsulating a request as an object', 'Observer', 'Strategy'], correct: 1, explanation: 'Command pattern turns requests into standalone objects for queuing, logging, undo' },
      { id: 35, question: 'What is a mixin?', options: ['Cocktail', 'Class providing methods to other classes without being a parent', 'Abstract class', 'Interface'], correct: 1, explanation: 'Mixins add reusable methods to classes without traditional inheritance hierarchy' },
      { id: 36, question: 'What is the Dependency Inversion Principle?', options: ['Inverting code', 'High-level modules should not depend on low-level modules', 'Circular dependency', 'No dependencies'], correct: 1, explanation: 'DIP: both high and low level modules should depend on abstractions' },
      { id: 37, question: 'What is the Proxy pattern?', options: ['Network proxy', 'Providing a surrogate for another object to control access', 'Factory', 'Observer'], correct: 1, explanation: 'Proxy controls access to another object, adding a level of indirection' },
      { id: 38, question: 'What is covariance in OOP?', options: ['Statistics', 'Allowing subtype in place of supertype in return types', 'Inheritance', 'Composition'], correct: 1, explanation: 'Covariance allows a method to return a more specific type than its parent declares' },
      { id: 39, question: 'What is the Facade pattern?', options: ['Building front', 'Simplified interface to a complex subsystem', 'Decorator', 'Adapter'], correct: 1, explanation: 'Facade provides a unified, simple interface to complex subsystem components' },
      { id: 40, question: 'What is late binding?', options: ['Delayed compilation', 'Determining method to call at runtime', 'Early binding', 'Static binding'], correct: 1, explanation: 'Late (dynamic) binding resolves method calls at runtime for polymorphism' },
      { id: 41, question: 'What is the Iterator pattern?', options: ['For loop', 'Provides a way to access collection elements sequentially', 'Observer', 'Command'], correct: 1, explanation: 'Iterator abstracts traversal of a collection without exposing internals' },
      { id: 42, question: 'What is a final class?', options: ['Last class', 'Class that cannot be inherited', 'Abstract class', 'Static class'], correct: 1, explanation: 'Final classes cannot be subclassed, ensuring their implementation is not altered' },
      { id: 43, question: 'What is the State pattern?', options: ['US state', 'Allowing object behavior to change with internal state', 'Strategy', 'Observer'], correct: 1, explanation: 'State pattern lets an object alter behavior when its internal state changes' },
      { id: 44, question: 'What is operator overloading?', options: ['Using many operators', 'Defining custom behavior for operators on objects', 'Method overloading', 'Function overloading'], correct: 1, explanation: 'Operator overloading redefines how operators work with user-defined types' },
      { id: 45, question: 'What is the Builder pattern?', options: ['Construction tool', 'Separating construction of complex object from its representation', 'Factory', 'Singleton'], correct: 1, explanation: 'Builder creates complex objects step by step with optional parameters' },
      { id: 46, question: 'What is downcasting?', options: ['Upcasting', 'Casting parent type reference to child type', 'Type conversion', 'Data loss'], correct: 1, explanation: 'Downcasting converts a base class reference to a derived class reference' },
      { id: 47, question: 'What is a sealed class?', options: ['Encrypted class', 'Class with a fixed set of subclasses', 'Abstract class', 'Final class'], correct: 1, explanation: 'Sealed classes restrict which classes can extend them' },
      { id: 48, question: 'What is the Flyweight pattern?', options: ['Light class', 'Sharing objects to reduce memory for many similar instances', 'Singleton', 'Prototype'], correct: 1, explanation: 'Flyweight minimizes memory by sharing common parts of objects' },
      { id: 49, question: 'What is object serialization?', options: ['Object creation', 'Converting object to storable/transmittable format', 'Object destruction', 'Object cloning'], correct: 1, explanation: 'Serialization converts objects to bytes for storage or network transmission' },
      { id: 50, question: 'What is the Prototype pattern?', options: ['Rough draft', 'Creating new objects by cloning existing ones', 'Factory', 'Builder'], correct: 1, explanation: 'Prototype creates new objects by copying an existing prototype instance' },
    ],
    'Operating Systems': [
      { id: 1, question: 'What is a process?', options: ['Code on disk', 'Thread', 'Program in execution', 'File'], correct: 2, explanation: 'A process is a running program instance' },
      { id: 2, question: 'Which scheduling algorithm is non-preemptive?', options: ['Round Robin', 'SRTF', 'FCFS', 'Priority (preemptive)'], correct: 2, explanation: 'First Come First Served runs to completion' },
      { id: 3, question: 'What is thrashing?', options: ['CPU overheating', 'Excessive page swapping', 'Disk failure', 'Network congestion'], correct: 1, explanation: 'Thrashing: system spends more time paging than executing' },
      { id: 4, question: 'What is a semaphore?', options: ['Memory segment', 'Synchronization mechanism', 'Process type', 'File descriptor'], correct: 1, explanation: 'Semaphores control access to shared resources' },
      { id: 5, question: 'What does virtual memory provide?', options: ['Faster CPU', 'Better graphics', 'Illusion of large memory', 'Network speed'], correct: 2, explanation: 'Virtual memory uses disk to extend available RAM' },
      { id: 6, question: 'What is a context switch?', options: ['Changing user', 'Saving/restoring process state when switching', 'Changing OS', 'Changing CPU'], correct: 1, explanation: 'Context switch saves current process state and loads the next' },
      { id: 7, question: 'What is the difference between process and thread?', options: ['Same thing', 'Process has own memory, threads share memory', 'Thread is larger', 'Process is faster'], correct: 1, explanation: 'Threads share process memory; processes have separate spaces' },
      { id: 8, question: 'What is a page fault?', options: ['Memory error', 'Accessing a page not in physical memory', 'CPU error', 'Disk error'], correct: 1, explanation: 'Page fault occurs when accessing a page not currently in RAM' },
      { id: 9, question: 'What is a mutex?', options: ['Multiple access lock', 'Mutual exclusion lock for single access', 'Memory type', 'Thread type'], correct: 1, explanation: 'Mutex ensures only one thread accesses a critical section' },
      { id: 10, question: 'What is the Banker\'s algorithm?', options: ['Banking software', 'Deadlock avoidance algorithm', 'Scheduling algorithm', 'Memory algorithm'], correct: 1, explanation: 'Banker\'s algorithm avoids deadlocks by checking safe state' },
      { id: 11, question: 'What is the kernel?', options: ['Shell', 'Core of OS managing hardware and resources', 'User interface', 'File system'], correct: 1, explanation: 'The kernel is the core component managing resources' },
      { id: 12, question: 'What is Round Robin scheduling?', options: ['Priority-based', 'Each process gets fixed time quantum', 'Shortest job first', 'FCFS variant'], correct: 1, explanation: 'Round Robin gives each process a fixed time slice' },
      { id: 13, question: 'What is a race condition?', options: ['Fast execution', 'Output depends on timing of uncontrolled events', 'CPU benchmark', 'Thread priority'], correct: 1, explanation: 'Race condition: output depends on unpredictable timing' },
      { id: 14, question: 'What is demand paging?', options: ['Loading all pages', 'Loading pages only when needed', 'Paging at startup', 'Sequential paging'], correct: 1, explanation: 'Demand paging loads pages into memory only when accessed' },
      { id: 15, question: 'What is a zombie process?', options: ['Malware', 'Terminated process whose entry remains in process table', 'Sleeping process', 'Blocked process'], correct: 1, explanation: 'Zombie: finished but parent hasn\'t read exit status' },
      { id: 16, question: 'What is a critical section?', options: ['Important code', 'Code segment accessing shared resources', 'Error handling', 'Main function'], correct: 1, explanation: 'Critical section accesses shared resources needing mutual exclusion' },
      { id: 17, question: 'What is the LRU page replacement algorithm?', options: ['Replaces newest page', 'Replaces least recently used page', 'Random replacement', 'FIFO replacement'], correct: 1, explanation: 'LRU replaces the page not used for the longest time' },
      { id: 18, question: 'What is starvation?', options: ['No food', 'Process indefinitely denied resources', 'Memory shortage', 'CPU idle'], correct: 1, explanation: 'Starvation: process waits indefinitely for resources' },
      { id: 19, question: 'What is RAID?', options: ['Insecticide', 'Redundant Array of Independent Disks', 'RAM type', 'Cache type'], correct: 1, explanation: 'RAID combines multiple disks for performance/redundancy' },
      { id: 20, question: 'What is inter-process communication (IPC)?', options: ['Network communication', 'Mechanisms for processes to exchange data', 'Thread communication', 'File sharing'], correct: 1, explanation: 'IPC allows processes to communicate via pipes, shared memory, etc.' },
      { id: 21, question: 'What is a system call?', options: ['Phone call', 'Interface between user program and OS kernel', 'Function call', 'API call'], correct: 1, explanation: 'System calls are the interface for user programs to request OS services' },
      { id: 22, question: 'What is paging?', options: ['Scrolling', 'Dividing memory into fixed-size frames', 'Sorting', 'Caching'], correct: 1, explanation: 'Paging divides virtual memory into pages mapped to physical frames' },
      { id: 23, question: 'What is segmentation?', options: ['Paging', 'Dividing memory into variable-size logical segments', 'Fragmentation', 'Partitioning'], correct: 1, explanation: 'Segmentation divides memory based on logical divisions like code, data, stack' },
      { id: 24, question: 'What is the FIFO page replacement?', options: ['LRU', 'Replaces oldest page in memory', 'Optimal', 'Random'], correct: 1, explanation: 'FIFO replaces the page that has been in memory the longest' },
      { id: 25, question: 'What is a deadlock condition?', options: ['Single condition', 'Mutual exclusion, hold and wait, no preemption, circular wait', 'Only circular wait', 'Only mutual exclusion'], correct: 1, explanation: 'All four conditions must hold simultaneously for deadlock to occur' },
      { id: 26, question: 'What is the difference between internal and external fragmentation?', options: ['Same thing', 'Internal: wasted space within allocated blocks; External: wasted space between blocks', 'External is worse', 'Internal is rare'], correct: 1, explanation: 'Internal fragmentation wastes space inside allocated blocks; external between them' },
      { id: 27, question: 'What is a file system?', options: ['File cabinet', 'OS component organizing and managing files on storage', 'Database', 'Network protocol'], correct: 1, explanation: 'File system manages how data is stored and retrieved on disk' },
      { id: 28, question: 'What is the Shortest Job First algorithm?', options: ['Longest first', 'Schedules process with shortest burst time next', 'Round Robin', 'FCFS'], correct: 1, explanation: 'SJF minimizes average waiting time by running shortest jobs first' },
      { id: 29, question: 'What is a page table?', options: ['HTML table', 'Maps virtual addresses to physical frames', 'Routing table', 'Symbol table'], correct: 1, explanation: 'Page table translates virtual page numbers to physical frame numbers' },
      { id: 30, question: 'What is a monitor in OS?', options: ['Screen', 'High-level synchronization construct', 'Process', 'Thread'], correct: 1, explanation: 'Monitors encapsulate shared resources with mutual exclusion built in' },
      { id: 31, question: 'What is a thread pool?', options: ['Swimming pool', 'Pre-created set of threads for task execution', 'Thread list', 'Process group'], correct: 1, explanation: 'Thread pools reuse a fixed number of threads to handle multiple tasks' },
      { id: 32, question: 'What is spooling?', options: ['Thread spinning', 'Buffering I/O to allow concurrent processing', 'Paging', 'Caching'], correct: 1, explanation: 'Spooling buffers data (e.g., print jobs) for sequential processing' },
      { id: 33, question: 'What is the working set model?', options: ['Office model', 'Set of pages a process actively uses', 'Thread model', 'Memory model'], correct: 1, explanation: 'Working set is the set of pages referenced in a recent time window' },
      { id: 34, question: 'What is a bootloader?', options: ['Shoe device', 'Program that loads the OS into memory at startup', 'Application', 'Driver'], correct: 1, explanation: 'Bootloader initializes hardware and loads the operating system kernel' },
      { id: 35, question: 'What is the difference between preemptive and non-preemptive scheduling?', options: ['Same thing', 'Preemptive can interrupt running process; non-preemptive cannot', 'Non-preemptive is faster', 'Preemptive is simpler'], correct: 1, explanation: 'Preemptive can force process off CPU; non-preemptive waits for voluntary release' },
      { id: 36, question: 'What is the priority inversion problem?', options: ['Priority sorting', 'Low-priority task blocking high-priority task', 'Priority scheduling', 'Priority queue'], correct: 1, explanation: 'Priority inversion occurs when a high-priority task waits for a low-priority one holding a lock' },
      { id: 37, question: 'What is a device driver?', options: ['Car driver', 'Software enabling OS to communicate with hardware', 'Application', 'Utility'], correct: 1, explanation: 'Device drivers translate OS commands into hardware-specific operations' },
      { id: 38, question: 'What is the dining philosophers problem?', options: ['Restaurant issue', 'Classic synchronization problem illustrating deadlock', 'Sorting problem', 'Search problem'], correct: 1, explanation: 'Dining philosophers demonstrates concurrency challenges and potential deadlocks' },
      { id: 39, question: 'What is a microkernel?', options: ['Small OS', 'Kernel with minimal functionality, running services in user space', 'Monolithic kernel', 'Hybrid kernel'], correct: 1, explanation: 'Microkernel keeps only essential functions in kernel; services run in user space' },
      { id: 40, question: 'What is the producer-consumer problem?', options: ['Economics', 'Synchronization problem with shared bounded buffer', 'Scheduling problem', 'Memory problem'], correct: 1, explanation: 'Producer-consumer coordinates processes sharing a fixed-size buffer' },
      { id: 41, question: 'What is a swap space?', options: ['Hard drive', 'Disk area used as virtual memory extension', 'Cache', 'RAM partition'], correct: 1, explanation: 'Swap space stores pages moved out of RAM to free physical memory' },
      { id: 42, question: 'What is the optimal page replacement algorithm?', options: ['LRU', 'Replaces page that will not be used for longest time', 'FIFO', 'Random'], correct: 1, explanation: 'Optimal replaces the page with the longest time until next use (theoretical)' },
      { id: 43, question: 'What is the difference between user mode and kernel mode?', options: ['Same mode', 'User has limited access; kernel has full hardware access', 'Kernel is slower', 'User is privileged'], correct: 1, explanation: 'User mode restricts instructions; kernel mode allows direct hardware access' },
      { id: 44, question: 'What is a TLB?', options: ['Table Lock Buffer', 'Translation Lookaside Buffer for fast address translation', 'Thread Lock Block', 'Task List Buffer'], correct: 1, explanation: 'TLB caches recent virtual-to-physical address translations for speed' },
      { id: 45, question: 'What is the readers-writers problem?', options: ['Book club', 'Multiple readers or single writer access to shared resource', 'File system', 'Network problem'], correct: 1, explanation: 'Readers-writers allows concurrent reads but exclusive writes' },
      { id: 46, question: 'What is a shell?', options: ['Animal shell', 'Command-line interface to interact with OS', 'Kernel', 'Hardware'], correct: 1, explanation: 'Shell provides a user interface to interact with the operating system via commands' },
      { id: 47, question: 'What is the Belady anomaly?', options: ['Network anomaly', 'More frames can cause more page faults in FIFO', 'Memory leak', 'CPU bug'], correct: 1, explanation: 'Belady anomaly: increasing page frames can increase page faults with FIFO' },
      { id: 48, question: 'What is a process control block (PCB)?', options: ['Circuit board', 'Data structure storing process information', 'Program counter', 'Memory block'], correct: 1, explanation: 'PCB stores process state, ID, registers, memory info for OS management' },
      { id: 49, question: 'What is the fork system call?', options: ['Utensil', 'Creates a new child process as copy of parent', 'File operation', 'Memory allocation'], correct: 1, explanation: 'fork creates a new process that is a copy of the calling process' },
      { id: 50, question: 'What is disk scheduling?', options: ['Calendar scheduling', 'Ordering disk I/O requests for efficiency', 'CPU scheduling', 'Memory scheduling'], correct: 1, explanation: 'Disk scheduling algorithms (FCFS, SSTF, SCAN) optimize head movement' },
    ],
    'Computer Networks': [
      { id: 1, question: 'How many layers does the OSI model have?', options: ['5', '7', '4', '6'], correct: 1, explanation: 'OSI has 7 layers' },
      { id: 2, question: 'Which protocol is used for reliable data transfer?', options: ['UDP', 'TCP', 'IP', 'ICMP'], correct: 1, explanation: 'TCP provides reliable, ordered delivery' },
      { id: 3, question: 'What is the default port for HTTP?', options: ['443', '80', '21', '25'], correct: 1, explanation: 'HTTP uses port 80' },
      { id: 4, question: 'What does DNS do?', options: ['Encrypts data', 'Resolves domain names to IPs', 'Routes packets', 'Manages emails'], correct: 1, explanation: 'DNS translates domain names to IP addresses' },
      { id: 5, question: 'Which layer is responsible for routing?', options: ['Transport layer', 'Network layer', 'Data link layer', 'Application layer'], correct: 1, explanation: 'Network layer handles routing' },
      { id: 6, question: 'What is a subnet mask?', options: ['Security feature', 'Divides IP into network and host portions', 'MAC address', 'Port number'], correct: 1, explanation: 'Subnet mask separates network and host parts of an IP' },
      { id: 7, question: 'What is the difference between TCP and UDP?', options: ['Same protocol', 'TCP is reliable/ordered, UDP is fast/unreliable', 'UDP is slower', 'TCP is connectionless'], correct: 1, explanation: 'TCP guarantees delivery; UDP is best-effort but faster' },
      { id: 8, question: 'What is ARP?', options: ['Application protocol', 'Maps IP to MAC addresses', 'Routing protocol', 'Encryption protocol'], correct: 1, explanation: 'ARP resolves IP to physical MAC addresses' },
      { id: 9, question: 'What is DHCP?', options: ['Security protocol', 'Automatically assigns IP addresses', 'Routing protocol', 'Email protocol'], correct: 1, explanation: 'DHCP dynamically assigns IP addresses' },
      { id: 10, question: 'What is NAT?', options: ['Network Access Token', 'Network Address Translation', 'Node Authentication', 'Network Adapter Type'], correct: 1, explanation: 'NAT translates private IPs to public for internet access' },
      { id: 11, question: 'What is the three-way handshake?', options: ['Three packet exchange', 'SYN, SYN-ACK, ACK to establish TCP connection', 'Three retries', 'Three ports'], correct: 1, explanation: 'TCP uses SYN, SYN-ACK, ACK to establish connection' },
      { id: 12, question: 'What is a firewall?', options: ['Physical wall', 'Network security system filtering traffic', 'Router type', 'Cable type'], correct: 1, explanation: 'Firewalls monitor and filter network traffic' },
      { id: 13, question: 'What is the default port for HTTPS?', options: ['80', '443', '21', '8080'], correct: 1, explanation: 'HTTPS uses port 443' },
      { id: 14, question: 'What is a VPN?', options: ['Virtual Private Network', 'Very Public Network', 'Virtual Protocol Network', 'Verified Private Node'], correct: 0, explanation: 'VPN creates encrypted tunnel over public networks' },
      { id: 15, question: 'What is latency?', options: ['Bandwidth', 'Time delay for data to travel source to destination', 'Packet loss', 'Throughput'], correct: 1, explanation: 'Latency is the time for data to travel from sender to receiver' },
      { id: 16, question: 'What is ICMP used for?', options: ['File transfer', 'Error reporting and diagnostics (ping)', 'Email', 'Web browsing'], correct: 1, explanation: 'ICMP reports network errors; used by ping and traceroute' },
      { id: 17, question: 'What is a socket?', options: ['Hardware port', 'Endpoint for network communication (IP + port)', 'Cable connector', 'Protocol'], correct: 1, explanation: 'Socket = IP address + port number' },
      { id: 18, question: 'What is a CDN?', options: ['Central Data Node', 'Content Delivery Network', 'Customer Data Network', 'Cached DNS'], correct: 1, explanation: 'CDN distributes content globally for faster delivery' },
      { id: 19, question: 'What is packet switching?', options: ['Physical switch', 'Data broken into packets routed independently', 'Circuit switching', 'Message switching'], correct: 1, explanation: 'Packet switching breaks data into independently routed packets' },
      { id: 20, question: 'What is congestion control?', options: ['Traffic management on roads', 'Preventing network overload', 'Routing optimization', 'Error correction'], correct: 1, explanation: 'Congestion control prevents senders from overwhelming the network' },
      { id: 21, question: 'What is a MAC address?', options: ['IP address', 'Unique hardware identifier for network interfaces', 'Port number', 'Subnet mask'], correct: 1, explanation: 'MAC address is a unique 48-bit hardware address assigned to network interfaces' },
      { id: 22, question: 'What is SMTP used for?', options: ['Web browsing', 'Sending email', 'File transfer', 'Remote login'], correct: 1, explanation: 'SMTP (Simple Mail Transfer Protocol) is used for sending emails' },
      { id: 23, question: 'What is a router?', options: ['Switch', 'Device forwarding packets between different networks', 'Hub', 'Bridge'], correct: 1, explanation: 'Routers forward packets between networks using routing tables' },
      { id: 24, question: 'What is the difference between a hub and a switch?', options: ['Same device', 'Hub broadcasts to all ports, switch sends to specific port', 'Switch is slower', 'Hub is smarter'], correct: 1, explanation: 'Hubs broadcast; switches learn MAC addresses and forward selectively' },
      { id: 25, question: 'What is FTP?', options: ['Fast Transfer Protocol', 'File Transfer Protocol', 'Frame Transfer Protocol', 'Fiber Transfer Protocol'], correct: 1, explanation: 'FTP transfers files between client and server over TCP' },
      { id: 26, question: 'What is the TCP/IP model?', options: ['7-layer model', '4-layer model: Application, Transport, Internet, Network Access', 'OSI model', '5-layer model'], correct: 1, explanation: 'TCP/IP has 4 layers compared to OSI 7 layers' },
      { id: 27, question: 'What is a proxy server?', options: ['Web server', 'Intermediary server between client and destination', 'DNS server', 'Mail server'], correct: 1, explanation: 'Proxy servers forward requests and can provide caching, filtering, anonymity' },
      { id: 28, question: 'What is SSL/TLS?', options: ['Network layer protocol', 'Protocols for encrypting network communications', 'Routing protocol', 'Application protocol'], correct: 1, explanation: 'SSL/TLS encrypts data in transit between client and server' },
      { id: 29, question: 'What is a VLAN?', options: ['Physical network', 'Virtual LAN logically grouping devices regardless of location', 'VPN variant', 'WAN type'], correct: 1, explanation: 'VLAN creates logical network segments independent of physical location' },
      { id: 30, question: 'What is the purpose of the session layer?', options: ['Routing', 'Managing sessions between applications', 'Encryption', 'Physical transmission'], correct: 1, explanation: 'Session layer establishes, manages, and terminates application sessions' },
      { id: 31, question: 'What is multicast?', options: ['Broadcast', 'Sending data to a specific group of recipients', 'Unicast', 'Anycast'], correct: 1, explanation: 'Multicast sends data to a group of interested hosts simultaneously' },
      { id: 32, question: 'What is the difference between IPv4 and IPv6?', options: ['Same protocol', 'IPv4 is 32-bit, IPv6 is 128-bit addresses', 'IPv6 is slower', 'IPv4 is newer'], correct: 1, explanation: 'IPv6 uses 128-bit addresses for vastly more addresses than IPv4 32-bit' },
      { id: 33, question: 'What is a load balancer?', options: ['Weight scale', 'Distributes network traffic across multiple servers', 'Firewall', 'Router'], correct: 1, explanation: 'Load balancers distribute incoming traffic to prevent server overload' },
      { id: 34, question: 'What is OSPF?', options: ['File protocol', 'Open Shortest Path First routing protocol', 'Security protocol', 'Application protocol'], correct: 1, explanation: 'OSPF is a link-state routing protocol using Dijkstra for shortest paths' },
      { id: 35, question: 'What is a bridge in networking?', options: ['Physical bridge', 'Device connecting two LAN segments at data link layer', 'Router', 'Gateway'], correct: 1, explanation: 'Bridges connect network segments and filter traffic by MAC address' },
      { id: 36, question: 'What is the sliding window protocol?', options: ['GUI feature', 'Flow control allowing multiple unacknowledged packets', 'Encryption', 'Routing'], correct: 1, explanation: 'Sliding window allows sending multiple packets before needing ACKs' },
      { id: 37, question: 'What is a broadcast domain?', options: ['TV network', 'Set of devices receiving each other\'s broadcasts', 'Internet', 'WAN'], correct: 1, explanation: 'Broadcast domain is where broadcast frames reach all devices' },
      { id: 38, question: 'What is BGP?', options: ['Big Protocol', 'Border Gateway Protocol for inter-AS routing', 'Basic Gateway Protocol', 'Binary Gateway Protocol'], correct: 1, explanation: 'BGP is the protocol routing between autonomous systems on the internet' },
      { id: 39, question: 'What is a gateway?', options: ['Gate', 'Device connecting networks using different protocols', 'Router', 'Switch'], correct: 1, explanation: 'Gateways connect networks that use different protocols or architectures' },
      { id: 40, question: 'What is flow control?', options: ['Water control', 'Regulating data transmission rate between sender and receiver', 'Error correction', 'Routing'], correct: 1, explanation: 'Flow control prevents sender from overwhelming a slower receiver' },
      { id: 41, question: 'What is a collision domain?', options: ['Crash zone', 'Network segment where simultaneous transmissions can collide', 'Broadcast domain', 'VLAN'], correct: 1, explanation: 'Collision domain is where packet collisions can occur on shared media' },
      { id: 42, question: 'What is HTTP/2?', options: ['HTTP variant', 'Improved HTTP with multiplexing and header compression', 'HTTPS', 'FTP'], correct: 1, explanation: 'HTTP/2 improves performance with multiplexing, server push, and header compression' },
      { id: 43, question: 'What is the purpose of the presentation layer?', options: ['UI display', 'Data translation, encryption, and compression', 'Routing', 'Session management'], correct: 1, explanation: 'Presentation layer handles data format translation, encryption, and compression' },
      { id: 44, question: 'What is CSMA/CD?', options: ['Security protocol', 'Collision detection protocol for Ethernet', 'Routing protocol', 'Encryption'], correct: 1, explanation: 'CSMA/CD detects collisions on shared Ethernet and retransmits' },
      { id: 45, question: 'What is traceroute used for?', options: ['File tracking', 'Showing the path packets take to destination', 'Virus scanning', 'Speed testing'], correct: 1, explanation: 'Traceroute displays each hop on the path to the destination' },
      { id: 46, question: 'What is the TCP window size?', options: ['GUI window', 'Amount of data that can be sent before ACK', 'Packet size', 'Frame size'], correct: 1, explanation: 'Window size determines how much data can be in-flight before acknowledgment' },
      { id: 47, question: 'What is port forwarding?', options: ['Moving ports', 'Redirecting traffic from one port to another', 'Closing ports', 'Opening ports'], correct: 1, explanation: 'Port forwarding redirects incoming traffic to a specific internal device' },
      { id: 48, question: 'What is QoS?', options: ['Question of Service', 'Quality of Service for prioritizing network traffic', 'Query on Server', 'Queue of Services'], correct: 1, explanation: 'QoS manages network resources to prioritize certain traffic types' },
      { id: 49, question: 'What is DNS caching?', options: ['Storing web pages', 'Storing DNS query results locally for faster lookup', 'Caching routes', 'Caching MAC addresses'], correct: 1, explanation: 'DNS caching stores recent lookups to speed up future queries' },
      { id: 50, question: 'What is the purpose of the data link layer?', options: ['Routing', 'Node-to-node data transfer and error detection', 'Encryption', 'Session management'], correct: 1, explanation: 'Data link layer handles frame delivery between adjacent nodes' },
    ],
    'Software Engineering': [
      { id: 1, question: 'What is the Agile methodology?', options: ['Waterfall variant', 'Iterative, incremental development approach', 'Testing method', 'Design pattern'], correct: 1, explanation: 'Agile emphasizes iterative development and collaboration' },
      { id: 2, question: 'What is a use case diagram?', options: ['Code diagram', 'Visual representation of system interactions with actors', 'Database schema', 'Network diagram'], correct: 1, explanation: 'Use case diagrams show actors and system interactions' },
      { id: 3, question: 'What is the waterfall model?', options: ['Iterative model', 'Sequential linear development phases', 'Spiral model', 'Agile variant'], correct: 1, explanation: 'Waterfall follows sequential phases' },
      { id: 4, question: 'What is code refactoring?', options: ['Rewriting from scratch', 'Restructuring code without changing behavior', 'Adding features', 'Bug fixing'], correct: 1, explanation: 'Refactoring improves structure without altering functionality' },
      { id: 5, question: 'What is version control?', options: ['Code backup', 'Tracking and managing changes to code', 'Compilation', 'Deployment'], correct: 1, explanation: 'Version control tracks changes and enables collaboration' },
      { id: 6, question: 'What is CI/CD?', options: ['Code Investigation', 'Continuous Integration/Continuous Deployment', 'Complete Integration', 'Code Inspection'], correct: 1, explanation: 'CI/CD automates building, testing, and deploying' },
      { id: 7, question: 'What is a sprint in Scrum?', options: ['Running fast', 'Time-boxed iteration (2-4 weeks)', 'Final release', 'Testing phase'], correct: 1, explanation: 'Sprint is a fixed-duration development iteration' },
      { id: 8, question: 'What is unit testing?', options: ['Testing entire system', 'Testing individual functions/methods', 'User testing', 'Performance testing'], correct: 1, explanation: 'Unit tests verify individual functions work correctly' },
      { id: 9, question: 'What is the DRY principle?', options: ['Keep code dry', 'Don\'t Repeat Yourself', 'Delete Redundant YAML', 'Debug, Refactor, Yield'], correct: 1, explanation: 'DRY eliminates code duplication' },
      { id: 10, question: 'What is technical debt?', options: ['Money owed', 'Cost of rework from quick solutions', 'Hardware cost', 'License fees'], correct: 1, explanation: 'Technical debt from shortcuts requires future rework' },
      { id: 11, question: 'What is the spiral model?', options: ['Linear model', 'Risk-driven iterative model', 'Agile variant', 'V-model'], correct: 1, explanation: 'Spiral model emphasizes risk analysis in each iteration' },
      { id: 12, question: 'What is an SRS?', options: ['Code file', 'Software Requirement Specification document', 'Test report', 'Design diagram'], correct: 1, explanation: 'SRS documents functional and non-functional requirements' },
      { id: 13, question: 'What is pair programming?', options: ['Solo coding', 'Two developers at one workstation', 'Code review', 'Team meeting'], correct: 1, explanation: 'One writes code while another reviews in real time' },
      { id: 14, question: 'What is the V-model?', options: ['Agile method', 'Waterfall extension with testing at each phase', 'Spiral variant', 'Prototype model'], correct: 1, explanation: 'V-model maps each development phase to a testing phase' },
      { id: 15, question: 'What is a user story?', options: ['Novel', 'Feature description from user perspective', 'Bug report', 'Test case'], correct: 1, explanation: 'User stories: As a [user], I want [goal], so that [benefit]' },
      { id: 16, question: 'What is integration testing?', options: ['Unit testing', 'Testing interactions between combined modules', 'User testing', 'Load testing'], correct: 1, explanation: 'Integration testing verifies modules work together' },
      { id: 17, question: 'What is regression testing?', options: ['New feature testing', 'Re-testing to ensure nothing broke', 'Performance testing', 'Security testing'], correct: 1, explanation: 'Regression testing verifies new changes didn\'t break existing functionality' },
      { id: 18, question: 'What is DevOps?', options: ['Development only', 'Combining development and operations', 'Operations only', 'Testing methodology'], correct: 1, explanation: 'DevOps bridges development and operations for faster delivery' },
      { id: 19, question: 'What is a design pattern?', options: ['UI theme', 'Reusable solution to common design problems', 'Code syntax', 'File format'], correct: 1, explanation: 'Design patterns are proven solutions to recurring challenges' },
      { id: 20, question: 'What is the KISS principle?', options: ['Kiss the code', 'Keep It Simple, Stupid', 'Know Internal System State', 'Key Integration System Standard'], correct: 1, explanation: 'KISS advocates simplicity in design' },
      { id: 21, question: 'What is the Scrum Master role?', options: ['Project manager', 'Facilitator removing team impediments', 'Lead developer', 'Product owner'], correct: 1, explanation: 'Scrum Master serves the team by removing obstacles' },
      { id: 22, question: 'What is a product backlog?', options: ['Bug list', 'Prioritized list of features and requirements', 'Sprint plan', 'Test results'], correct: 1, explanation: 'Product backlog is an ordered list of everything needed' },
      { id: 23, question: 'What is acceptance testing?', options: ['Unit testing', 'Testing if system meets business requirements', 'Code review', 'Regression testing'], correct: 1, explanation: 'Acceptance testing validates against business requirements' },
      { id: 24, question: 'What is a microservice architecture?', options: ['Monolithic app', 'Small independent services via APIs', 'Client-server', 'Peer-to-peer'], correct: 1, explanation: 'Microservices decompose apps into independently deployable services' },
      { id: 25, question: 'What is black-box testing?', options: ['Testing internals', 'Testing without knowledge of internal code', 'Hardware testing', 'Network testing'], correct: 1, explanation: 'Black-box testing evaluates functionality without examining code' },
      { id: 26, question: 'What is white-box testing?', options: ['Testing UI only', 'Testing with knowledge of internal structure', 'User testing', 'Random testing'], correct: 1, explanation: 'White-box testing examines internal logic and paths' },
      { id: 27, question: 'What is the YAGNI principle?', options: ['Yet Another Idea', 'You Aren\'t Gonna Need It', 'Your Algorithm Gets New Input', 'Yield All Generated Numbers'], correct: 1, explanation: 'YAGNI: don\'t implement features until actually needed' },
      { id: 28, question: 'What is TDD?', options: ['Testing after coding', 'Test-Driven Development: write tests first', 'Manual testing', 'No testing'], correct: 1, explanation: 'TDD: write failing test, write code to pass, refactor' },
      { id: 29, question: 'What is continuous integration?', options: ['One-time merge', 'Frequently merging code into shared repository', 'Manual deployment', 'Code freeze'], correct: 1, explanation: 'CI automatically builds and tests on each commit' },
      { id: 30, question: 'What is coupling in software design?', options: ['Good practice', 'Degree of interdependence between modules', 'Code formatting', 'Testing method'], correct: 1, explanation: 'Low coupling makes software easier to maintain' },
      { id: 31, question: 'What is cohesion?', options: ['Module dependency', 'How closely related module responsibilities are', 'Code duplication', 'Test coverage'], correct: 1, explanation: 'High cohesion means a module has focused purpose' },
      { id: 32, question: 'What is a kanban board?', options: ['Whiteboard', 'Visual workflow management tool', 'Spreadsheet', 'Code editor'], correct: 1, explanation: 'Kanban boards visualize work flowing through stages' },
      { id: 33, question: 'What is load testing?', options: ['Unit testing', 'Testing system under expected load', 'Security testing', 'Code review'], correct: 1, explanation: 'Load testing evaluates performance under anticipated volumes' },
      { id: 34, question: 'What is the prototype model?', options: ['Final product', 'Building working model for user feedback', 'Testing model', 'Deployment model'], correct: 1, explanation: 'Prototyping creates early models to validate requirements' },
      { id: 35, question: 'What is a burndown chart?', options: ['Financial chart', 'Graph showing remaining work vs time', 'Network diagram', 'Code metrics'], correct: 1, explanation: 'Burndown charts track remaining work in a sprint' },
      { id: 36, question: 'What is a deployment pipeline?', options: ['Physical pipe', 'Automated process from commit to production', 'Network cable', 'Data pipeline'], correct: 1, explanation: 'Deployment pipeline automates build, test, deploy stages' },
      { id: 37, question: 'What is stress testing?', options: ['Developer stress', 'Testing system beyond normal capacity', 'Unit testing', 'Code review'], correct: 1, explanation: 'Stress testing pushes past normal limits to find breaking points' },
      { id: 38, question: 'What is the SOLID principle?', options: ['Rigid code', 'Five design principles for maintainable OOP', 'Testing framework', 'Database design'], correct: 1, explanation: 'SOLID: Single responsibility, Open/closed, Liskov, Interface segregation, Dependency inversion' },
      { id: 39, question: 'What is a sprint retrospective?', options: ['Sprint planning', 'Team meeting reflecting on what went well/poorly', 'Code review', 'Deployment'], correct: 1, explanation: 'Retrospectives help teams continuously improve' },
      { id: 40, question: 'What is a standup meeting?', options: ['Long meeting', 'Brief daily team sync', 'Annual review', 'Client meeting'], correct: 1, explanation: 'Daily standups share progress and blockers briefly' },
      { id: 41, question: 'What is configuration management?', options: ['Server setup', 'Tracking changes to software artifacts', 'Code formatting', 'Database management'], correct: 1, explanation: 'Configuration management tracks versions of all project artifacts' },
      { id: 42, question: 'What is a code smell?', options: ['Bad odor', 'Indicator of potential design problem', 'Syntax error', 'Bug'], correct: 1, explanation: 'Code smells are surface indicators of deeper problems' },
      { id: 43, question: 'What is a UML class diagram?', options: ['Flow chart', 'Visual representation of classes and relationships', 'Network diagram', 'Database schema'], correct: 1, explanation: 'Class diagrams show classes, attributes, methods, and relationships' },
      { id: 44, question: 'What is a feasibility study?', options: ['Code study', 'Analysis of project viability', 'User study', 'Market study'], correct: 1, explanation: 'Feasibility study evaluates technical, economic, operational viability' },
      { id: 45, question: 'What is risk management in SE?', options: ['Avoiding risks', 'Identifying and mitigating project risks', 'Insurance', 'Testing'], correct: 1, explanation: 'Risk management proactively plans for potential problems' },
      { id: 46, question: 'What is a monolithic architecture?', options: ['Microservices', 'Single unified codebase for entire app', 'Distributed system', 'Serverless'], correct: 1, explanation: 'Monolithic bundles all components into a single deployable unit' },
      { id: 47, question: 'What is a sequence diagram?', options: ['Flowchart', 'Shows object interactions in time sequence', 'Database schema', 'Class diagram'], correct: 1, explanation: 'Sequence diagrams show chronological object interactions' },
      { id: 48, question: 'What is a software metric?', options: ['Physical measurement', 'Quantitative measure of software quality', 'Code comment', 'Variable name'], correct: 1, explanation: 'Metrics like code coverage and cyclomatic complexity measure quality' },
      { id: 49, question: 'What is the RAD model?', options: ['Slow development', 'Rapid Application Development with quick prototyping', 'Testing model', 'Security model'], correct: 1, explanation: 'RAD emphasizes rapid prototyping over rigid planning' },
      { id: 50, question: 'What is a sprint retrospective?', options: ['Planning meeting', 'Team review of what worked and what didn\'t', 'Code review', 'Demo'], correct: 1, explanation: 'Retrospectives drive continuous improvement in the team process' },
    ],
    'Web Technologies': [
      { id: 1, question: 'What does CSS stand for?', options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], correct: 1, explanation: 'CSS styles HTML elements' },
      { id: 2, question: 'Which HTTP method is used to submit form data?', options: ['GET', 'POST', 'PUT', 'DELETE'], correct: 1, explanation: 'POST sends data to server in request body' },
      { id: 3, question: 'What is the virtual DOM?', options: ['Server-side DOM', 'In-memory representation of real DOM', 'Database', 'CSS framework'], correct: 1, explanation: 'Virtual DOM optimizes rendering by diffing changes' },
      { id: 4, question: 'What is REST?', options: ['Remote Execution Standard', 'Representational State Transfer', 'Real-time Event System', 'Resource Exchange Service'], correct: 1, explanation: 'REST is an architectural style for web APIs' },
      { id: 5, question: 'What is a closure in JavaScript?', options: ['Closing a browser tab', 'Function with access to outer scope', 'End of function', 'Try-catch block'], correct: 1, explanation: 'Closures retain access to variables from enclosing scope' },
      { id: 6, question: 'What is CORS?', options: ['CSS variant', 'Cross-Origin Resource Sharing', 'Code Optimization', 'Component Rendering'], correct: 1, explanation: 'CORS allows servers to specify which origins can access their resources' },
      { id: 7, question: 'What is a Promise in JavaScript?', options: ['Variable type', 'Object representing eventual async result', 'Loop type', 'Error handler'], correct: 1, explanation: 'Promise represents a value that may be available now, later, or never' },
      { id: 8, question: 'What is the event loop in JavaScript?', options: ['Loop statement', 'Mechanism handling async operations in single thread', 'Event listener', 'Callback function'], correct: 1, explanation: 'Event loop enables non-blocking async in single-threaded JavaScript' },
      { id: 9, question: 'What is the DOM?', options: ['Database Object Model', 'Document Object Model', 'Data Output Module', 'Display Object Manager'], correct: 1, explanation: 'DOM is a tree representation of HTML that JavaScript can manipulate' },
      { id: 10, question: 'What is async/await?', options: ['Loop construct', 'Syntax for writing async code synchronously', 'Error handling', 'Variable declaration'], correct: 1, explanation: 'async/await makes Promise-based code look synchronous' },
      { id: 11, question: 'What is responsive web design?', options: ['Fast website', 'Design adapting to different screen sizes', 'Server rendering', 'Database design'], correct: 1, explanation: 'Responsive design uses media queries to adapt layouts' },
      { id: 12, question: 'What is a SPA?', options: ['One-page site', 'Web app dynamically rewriting page instead of loading new pages', 'Static site', 'Landing page'], correct: 1, explanation: 'SPAs update content dynamically without full page reloads' },
      { id: 13, question: 'What is the box model in CSS?', options: ['3D model', 'Content + padding + border + margin', 'Flexbox', 'Grid'], correct: 1, explanation: 'CSS box model: content, padding, border, margin' },
      { id: 14, question: 'What is WebSocket?', options: ['HTTP variant', 'Full-duplex communication protocol', 'Socket.io', 'TCP wrapper'], correct: 1, explanation: 'WebSocket enables persistent two-way client-server communication' },
      { id: 15, question: 'What is Node.js?', options: ['Browser', 'JavaScript runtime on Chrome V8 engine', 'Database', 'CSS framework'], correct: 1, explanation: 'Node.js runs JavaScript on the server side' },
      { id: 16, question: 'What is CSS Flexbox?', options: ['Animation', 'One-dimensional layout model', 'Grid system', 'Position property'], correct: 1, explanation: 'Flexbox provides efficient alignment and space distribution' },
      { id: 17, question: 'What is CSS Grid?', options: ['Table layout', 'Two-dimensional layout system', 'Flexbox variant', 'Bootstrap grid'], correct: 1, explanation: 'CSS Grid creates complex two-dimensional layouts' },
      { id: 18, question: 'What is XSS?', options: ['CSS framework', 'Cross-Site Scripting attack', 'JavaScript library', 'XML parser'], correct: 1, explanation: 'XSS allows attackers to inject malicious scripts' },
      { id: 19, question: 'What is React?', options: ['Backend framework', 'JavaScript library for building UIs', 'Database', 'CSS framework'], correct: 1, explanation: 'React is a declarative, component-based UI library' },
      { id: 20, question: 'What is JWT?', options: ['JavaScript Web Tool', 'JSON Web Token for authentication', 'Java Web Template', 'jQuery Widget'], correct: 1, explanation: 'JWT is a compact token format for auth information' },
      { id: 21, question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correct: 0, explanation: 'HTML structures web content' },
      { id: 22, question: 'What is npm?', options: ['Network Protocol Manager', 'Node Package Manager', 'New Project Module', 'Node Process Manager'], correct: 1, explanation: 'npm manages Node.js packages and dependencies' },
      { id: 23, question: 'What is TypeScript?', options: ['CSS variant', 'Typed superset of JavaScript', 'Database language', 'Template engine'], correct: 1, explanation: 'TypeScript adds static typing to JavaScript' },
      { id: 24, question: 'What is GraphQL?', options: ['Graph database', 'Query language for APIs', 'JavaScript framework', 'CSS preprocessor'], correct: 1, explanation: 'GraphQL lets clients request exactly the data they need' },
      { id: 25, question: 'What is SSR?', options: ['Client rendering', 'Server-Side Rendering', 'Database rendering', 'CSS rendering'], correct: 1, explanation: 'SSR generates HTML on server for faster initial load and SEO' },
      { id: 26, question: 'What is the difference between GET and POST?', options: ['Same thing', 'GET retrieves data, POST sends data', 'POST is faster', 'GET sends data'], correct: 1, explanation: 'GET requests data; POST submits data in request body' },
      { id: 27, question: 'What is a service worker?', options: ['Backend server', 'Background script for offline/caching', 'Web worker', 'API server'], correct: 1, explanation: 'Service workers intercept requests and enable offline functionality' },
      { id: 28, question: 'What is the fetch API?', options: ['Database API', 'Modern interface for HTTP requests', 'File system API', 'DOM API'], correct: 1, explanation: 'Fetch provides Promise-based network requests' },
      { id: 29, question: 'What is hoisting in JavaScript?', options: ['Error type', 'Moving declarations to top of scope', 'Array method', 'DOM manipulation'], correct: 1, explanation: 'Hoisting moves function and var declarations to scope top' },
      { id: 30, question: 'What is the difference between var, let, and const?', options: ['Same thing', 'var is function-scoped, let/const are block-scoped', 'let is fastest', 'const is oldest'], correct: 1, explanation: 'var has function scope; let/const have block scope; const cannot be reassigned' },
      { id: 31, question: 'What is AJAX?', options: ['Framework', 'Asynchronous JavaScript and XML', 'CSS library', 'Database'], correct: 1, explanation: 'AJAX allows async data exchange without page reload' },
      { id: 32, question: 'What is a cookie?', options: ['Image file', 'Small data stored by browser', 'CSS property', 'JavaScript function'], correct: 1, explanation: 'Cookies store small data between server and browser' },
      { id: 33, question: 'What is a PWA?', options: ['Desktop app', 'Progressive Web App with native features', 'Mobile app', 'Browser extension'], correct: 1, explanation: 'PWAs combine web and native app features' },
      { id: 34, question: 'What is JSX?', options: ['JSON variant', 'JavaScript XML syntax for React', 'Java extension', 'CSS preprocessor'], correct: 1, explanation: 'JSX lets you write HTML-like syntax in JavaScript' },
      { id: 35, question: 'What is middleware in Express?', options: ['Hardware', 'Functions with access to req, res, next', 'Database layer', 'Frontend component'], correct: 1, explanation: 'Middleware processes requests before route handlers' },
      { id: 36, question: 'What is SEO?', options: ['Server Engine Optimization', 'Search Engine Optimization', 'Style Element Object', 'System Error Output'], correct: 1, explanation: 'SEO improves website visibility in search results' },
      { id: 37, question: 'What is the difference between null and undefined?', options: ['Same thing', 'null is intentional absence, undefined is not assigned', 'undefined is an error', 'null is faster'], correct: 1, explanation: 'null is explicitly set; undefined means not assigned' },
      { id: 38, question: 'What is a CDN?', options: ['Code Network', 'Content Delivery Network', 'Central Data Node', 'Client Network'], correct: 1, explanation: 'CDN distributes content globally for faster delivery' },
      { id: 39, question: 'What is Webpack?', options: ['Web server', 'Module bundler for JavaScript', 'CSS framework', 'Database'], correct: 1, explanation: 'Webpack bundles JavaScript modules and dependencies' },
      { id: 40, question: 'What is CSRF?', options: ['CSS Framework', 'Cross-Site Request Forgery attack', 'Client Rendering', 'Cookie Storage'], correct: 1, explanation: 'CSRF tricks users into unwanted authenticated requests' },
      { id: 41, question: 'What is a callback function?', options: ['Recursive function', 'Function passed as argument', 'Constructor', 'Static method'], correct: 1, explanation: 'Callbacks are functions passed to be executed later' },
      { id: 42, question: 'What is a REST API endpoint?', options: ['Hardware', 'URL where API receives requests', 'Database table', 'HTML element'], correct: 1, explanation: 'Endpoint is a URL path accepting requests and returning responses' },
      { id: 43, question: 'What is localStorage?', options: ['Server storage', 'Browser storage persisting across sessions', 'Cookie', 'Session storage'], correct: 1, explanation: 'localStorage persists data in the browser until explicitly cleared' },
      { id: 44, question: 'What is a media query?', options: ['Database query', 'CSS rule based on device characteristics', 'JavaScript query', 'Server query'], correct: 1, explanation: 'Media queries apply CSS based on screen size, resolution, etc.' },
      { id: 45, question: 'What is the purpose of DOCTYPE?', options: ['CSS styling', 'Tells browser which HTML version', 'JavaScript import', 'Server config'], correct: 1, explanation: 'DOCTYPE tells the browser to render in standards mode' },
      { id: 46, question: 'What is a web worker?', options: ['Server process', 'Script running in background thread', 'Service worker', 'API handler'], correct: 1, explanation: 'Web workers run JavaScript in background without blocking UI' },
      { id: 47, question: 'What is the == vs === difference?', options: ['Same thing', '== coerces types, === is strict comparison', '=== is slower', '== checks types'], correct: 1, explanation: '== allows type coercion; === requires value and type match' },
      { id: 48, question: 'What is the purpose of the head tag?', options: ['Display header', 'Contains metadata, title, links to CSS', 'Shows navigation', 'Main content'], correct: 1, explanation: 'head contains metadata, title, CSS links not displayed on page' },
      { id: 49, question: 'What is SSR vs CSR?', options: ['Same rendering', 'SSR renders on server, CSR on client', 'CSR is always better', 'SSR is obsolete'], correct: 1, explanation: 'SSR generates HTML on server; CSR in browser via JavaScript' },
      { id: 50, question: 'What is the difference between localStorage and sessionStorage?', options: ['Same thing', 'localStorage persists, sessionStorage clears on tab close', 'sessionStorage is faster', 'localStorage is smaller'], correct: 1, explanation: 'localStorage persists until cleared; sessionStorage clears with tab' },
    ],
    'Design & Analysis of Algorithms': [
      { id: 1, question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1, explanation: 'Binary search halves the search space each iteration' },
      { id: 2, question: 'What technique does dynamic programming use?', options: ['Divide and conquer', 'Optimal substructure + overlapping subproblems', 'Random selection', 'Brute force'], correct: 1, explanation: 'DP breaks problems into overlapping subproblems' },
      { id: 3, question: 'What is Big-O notation?', options: ['Exact running time', 'Upper bound on growth rate', 'Lower bound', 'Average time'], correct: 1, explanation: 'Big-O describes the worst-case upper bound' },
      { id: 4, question: 'What is memoization?', options: ['Memorizing code', 'Memory optimization', 'Caching computed results', 'Variable naming'], correct: 2, explanation: 'Memoization stores results of expensive function calls' },
      { id: 5, question: 'What is the greedy approach?', options: ['Taking everything', 'Making locally optimal choice at each step', 'Random choice', 'Exhaustive search'], correct: 1, explanation: 'Greedy chooses best option at each step' },
      { id: 6, question: 'What is backtracking?', options: ['Going backwards', 'Trying all possibilities and undoing bad choices', 'Greedy method', 'DP'], correct: 1, explanation: 'Backtracking explores options and backtracks on failure' },
      { id: 7, question: 'What is the time complexity of bubble sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correct: 2, explanation: 'Bubble sort has O(n²) from nested loops' },
      { id: 8, question: 'What is an NP-complete problem?', options: ['Easy problem', 'Verifiable in polynomial time, no known polynomial solution', 'Unsolvable', 'Linear'], correct: 1, explanation: 'NP-complete: can be verified quickly but no efficient solution known' },
      { id: 9, question: 'What is divide and conquer?', options: ['Team management', 'Breaking problem into subproblems, solving, combining', 'Greedy approach', 'DP'], correct: 1, explanation: 'Divide and conquer splits, solves recursively, then merges' },
      { id: 10, question: 'What is the master theorem?', options: ['Database design', 'Solving divide-and-conquer recurrences', 'Sorting', 'Graph problems'], correct: 1, explanation: 'Master theorem solves recurrences T(n) = aT(n/b) + f(n)' },
      { id: 11, question: 'What is the knapsack problem?', options: ['Packing clothes', 'Maximizing value within weight capacity', 'Sorting items', 'Finding shortest path'], correct: 1, explanation: 'Knapsack selects items to maximize value within weight limit' },
      { id: 12, question: 'What is the time complexity of heap sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correct: 1, explanation: 'Heap sort builds heap and extracts in O(n log n)' },
      { id: 13, question: 'What is the traveling salesman problem?', options: ['Delivery optimization', 'Shortest route visiting all cities once', 'Sorting cities', 'Graph coloring'], correct: 1, explanation: 'TSP is NP-hard: find shortest Hamiltonian cycle' },
      { id: 14, question: 'What is Big-Theta notation?', options: ['Upper bound', 'Tight bound on growth rate', 'Lower bound', 'Average case'], correct: 1, explanation: 'Big-Theta gives both upper and lower bounds' },
      { id: 15, question: 'What is the LCS problem?', options: ['String matching', 'Finding longest common subsequence', 'Sorting', 'Graph problem'], correct: 1, explanation: 'LCS finds the longest subsequence common to two sequences' },
      { id: 16, question: 'What is a stable sorting algorithm?', options: ['Fast algorithm', 'Preserves relative order of equal elements', 'In-place', 'Comparison-based'], correct: 1, explanation: 'Stable sorts maintain original order of equal elements' },
      { id: 17, question: 'What is the Floyd-Warshall algorithm?', options: ['Single-source shortest path', 'All-pairs shortest path', 'Sorting', 'Searching'], correct: 1, explanation: 'Floyd-Warshall finds shortest paths between all pairs' },
      { id: 18, question: 'What is the Huffman coding algorithm?', options: ['Encryption', 'Greedy optimal prefix-free encoding', 'Sorting', 'Searching'], correct: 1, explanation: 'Huffman creates optimal variable-length codes by frequency' },
      { id: 19, question: 'What is the activity selection problem?', options: ['Scheduling', 'Selecting maximum non-overlapping activities', 'Sorting', 'Resource allocation'], correct: 1, explanation: 'Activity selection greedily picks non-overlapping activities' },
      { id: 20, question: 'What is the Bellman-Ford algorithm?', options: ['Shortest path with negative weights', 'MST algorithm', 'Sorting', 'BFS variant'], correct: 0, explanation: 'Bellman-Ford finds shortest paths even with negative edges' },
      { id: 21, question: 'What is the difference between P and NP?', options: ['Same class', 'P solvable in poly time, NP verifiable in poly time', 'NP is faster', 'P is harder'], correct: 1, explanation: 'P: solvable quickly; NP: verifiable quickly' },
      { id: 22, question: 'What is the time complexity of counting sort?', options: ['O(n log n)', 'O(n + k)', 'O(n²)', 'O(log n)'], correct: 1, explanation: 'Counting sort is O(n + k) where k is value range' },
      { id: 23, question: 'What is branch and bound?', options: ['Tree pruning', 'Optimization eliminating suboptimal solutions', 'Greedy', 'DP variant'], correct: 1, explanation: 'Branch and bound prunes branches that can\'t improve best known' },
      { id: 24, question: 'What is the coin change problem?', options: ['Making change', 'Finding minimum coins for a given amount', 'Sorting coins', 'Counting'], correct: 1, explanation: 'Coin change uses DP for minimum coins summing to target' },
      { id: 25, question: 'What is topological sort used for?', options: ['Number sorting', 'Ordering tasks with dependencies', 'Binary search', 'Load balancing'], correct: 1, explanation: 'Topological sort orders DAG vertices by dependencies' },
      { id: 26, question: 'What is a randomized algorithm?', options: ['Incorrect algorithm', 'Algorithm using random numbers', 'Sorting algorithm', 'Deterministic'], correct: 1, explanation: 'Randomized algorithms use randomness for good average performance' },
      { id: 27, question: 'What is the time complexity of Dijkstra with min-heap?', options: ['O(V²)', 'O((V + E) log V)', 'O(VE)', 'O(V log V)'], correct: 1, explanation: 'Dijkstra with binary heap: O((V + E) log V)' },
      { id: 28, question: 'What is the matrix chain multiplication problem?', options: ['Matrix arithmetic', 'Finding optimal multiplication order', 'Graph problem', 'Sorting'], correct: 1, explanation: 'DP finds parenthesization minimizing scalar operations' },
      { id: 29, question: 'What is amortized analysis?', options: ['Financial analysis', 'Average cost over worst-case sequence', 'Best case', 'Space analysis'], correct: 1, explanation: 'Amortized analysis averages cost over sequence of operations' },
      { id: 30, question: 'What is the rod cutting problem?', options: ['Physical cutting', 'Maximizing revenue by cutting rod', 'Graph cutting', 'String cutting'], correct: 1, explanation: 'Rod cutting uses DP for optimal revenue from cuts' },
      { id: 31, question: 'What is the edit distance problem?', options: ['Text editing', 'Minimum operations to convert one string to another', 'Sorting', 'Pattern matching'], correct: 1, explanation: 'Edit distance finds minimum insertions, deletions, substitutions' },
      { id: 32, question: 'What is the time complexity of BFS?', options: ['O(V)', 'O(V + E)', 'O(V²)', 'O(E log V)'], correct: 1, explanation: 'BFS visits every vertex and edge: O(V + E)' },
      { id: 33, question: 'What is the quickselect algorithm?', options: ['Sorting', 'Finding kth smallest in O(n) average', 'Searching', 'Graph algorithm'], correct: 1, explanation: 'Quickselect uses partitioning for expected O(n) kth element' },
      { id: 34, question: 'What is an in-place sorting algorithm?', options: ['External sort', 'Sorts using O(1) extra space', 'Stable sort', 'Comparison sort'], correct: 1, explanation: 'In-place algorithms sort with constant additional memory' },
      { id: 35, question: 'What is the time complexity of radix sort?', options: ['O(n log n)', 'O(n²)', 'O(d * (n + k))', 'O(n)'], correct: 2, explanation: 'Radix sort: O(d*(n+k)) where d is digits, k is base' },
      { id: 36, question: 'What is the graph coloring problem?', options: ['Drawing graphs', 'Assigning colors so adjacent vertices differ', 'Sorting colors', 'Finding paths'], correct: 1, explanation: 'Graph coloring assigns colors so no adjacent vertices share a color' },
      { id: 37, question: 'What is the subset sum problem?', options: ['Array sum', 'Determining if subset sums to target', 'Sorting subsets', 'Counting'], correct: 1, explanation: 'Subset sum is NP-complete: find subset summing to target' },
      { id: 38, question: 'What is asymptotic analysis?', options: ['Exact timing', 'Describing behavior as input grows large', 'Debugging', 'Testing'], correct: 1, explanation: 'Asymptotic analysis describes growth rate for large inputs' },
      { id: 39, question: 'What is Big-Omega notation?', options: ['Upper bound', 'Tight bound', 'Lower bound on growth rate', 'Exact time'], correct: 2, explanation: 'Big-Omega describes the best-case lower bound' },
      { id: 40, question: 'What is the fractional knapsack approach?', options: ['0/1 Knapsack', 'Greedy allowing partial items', 'DP', 'Brute force'], correct: 1, explanation: 'Fractional knapsack takes fractions by value/weight ratio' },
      { id: 41, question: 'What is a recurrence relation?', options: ['Recursion bug', 'Equation defining sequence by previous terms', 'Loop condition', 'Base case'], correct: 1, explanation: 'Recurrence relations express T(n) in terms of smaller T' },
      { id: 42, question: 'What is the time complexity of Kruskal\'s algorithm?', options: ['O(V²)', 'O(E log E)', 'O(VE)', 'O(V + E)'], correct: 1, explanation: 'Kruskal sorts edges O(E log E) then uses union-find' },
      { id: 43, question: 'What is a comparison-based sorting lower bound?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correct: 1, explanation: 'No comparison sort can do better than Omega(n log n)' },
      { id: 44, question: 'What is a decision problem?', options: ['Management decision', 'Problem with yes/no answer', 'Optimization', 'Search problem'], correct: 1, explanation: 'Decision problems have binary outputs; basis of complexity theory' },
      { id: 45, question: 'What is a reduction in complexity theory?', options: ['Simplification', 'Transforming one problem to another to prove hardness', 'Refactoring', 'Compression'], correct: 1, explanation: 'Reduction shows problem A is at least as hard as B' },
      { id: 46, question: 'What is the time complexity of insertion sort best case?', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], correct: 2, explanation: 'Insertion sort is O(n) on already sorted input' },
      { id: 47, question: 'What is the space complexity of merge sort?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correct: 1, explanation: 'Merge sort requires O(n) additional space' },
      { id: 48, question: 'What is the time complexity of selection sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correct: 2, explanation: 'Selection sort: O(n²) from repeated minimum finding' },
      { id: 49, question: 'Which sorting has best average case?', options: ['Bubble Sort O(n²)', 'Merge Sort O(n log n)', 'Insertion Sort O(n²)', 'Selection Sort O(n²)'], correct: 1, explanation: 'Merge sort guarantees O(n log n) in all cases' },
      { id: 50, question: 'What is a spanning tree?', options: ['Full graph', 'Subgraph connecting all vertices with minimum edges', 'Shortest path', 'Cycle'], correct: 1, explanation: 'Spanning tree uses V-1 edges to connect all V vertices' },
    ],
    'Artificial Intelligence': [
      { id: 1, question: 'What is the Turing Test?', options: ['CPU benchmark', 'Test if machine exhibits intelligent behavior', 'Memory test', 'Network test'], correct: 1, explanation: 'Turing test evaluates machine intelligence' },
      { id: 2, question: 'Which search algorithm uses a heuristic?', options: ['BFS', 'DFS', 'A*', 'Dijkstra'], correct: 2, explanation: 'A* uses heuristic to estimate cost to goal' },
      { id: 3, question: 'What is NLP?', options: ['Network Layer Protocol', 'Natural Language Processing', 'Numerical Logic', 'Node Link Processing'], correct: 1, explanation: 'NLP enables computers to understand human language' },
      { id: 4, question: 'What is supervised learning?', options: ['No data', 'Self-directed', 'Learning from labeled data', 'Clustering'], correct: 2, explanation: 'Supervised learning trains on labeled input-output pairs' },
      { id: 5, question: 'What is reinforcement learning?', options: ['Labeled data', 'Learning through rewards and penalties', 'Clustering', 'Feature extraction'], correct: 1, explanation: 'RL agents learn by receiving rewards' },
      { id: 6, question: 'What is a neural network?', options: ['Brain scan', 'Computing system inspired by biological neurons', 'Network protocol', 'Database'], correct: 1, explanation: 'Neural networks use layers of interconnected nodes' },
      { id: 7, question: 'What is computer vision?', options: ['Monitor', 'AI interpreting images', 'Camera tech', 'Graphics'], correct: 1, explanation: 'Computer vision enables machines to understand visual data' },
      { id: 8, question: 'What is the minimax algorithm?', options: ['Sorting', 'Decision-making for two-player games', 'Searching', 'Clustering'], correct: 1, explanation: 'Minimax minimizes maximum possible loss in games' },
      { id: 9, question: 'What is transfer learning?', options: ['Moving files', 'Using pre-trained model for new task', 'Network transfer', 'Data migration'], correct: 1, explanation: 'Transfer learning adapts pre-trained models to new tasks' },
      { id: 10, question: 'What is an expert system?', options: ['Skilled programmer', 'AI emulating human expert decisions', 'OS', 'Database'], correct: 1, explanation: 'Expert systems use knowledge bases and inference rules' },
      { id: 11, question: 'What is alpha-beta pruning?', options: ['Tree cutting', 'Minimax optimization eliminating unnecessary branches', 'Data cleaning', 'Sorting'], correct: 1, explanation: 'Alpha-beta pruning reduces minimax search space' },
      { id: 12, question: 'What is a Bayesian network?', options: ['Neural network', 'Probabilistic graphical model', 'Computer network', 'Social network'], correct: 1, explanation: 'Bayesian networks model probabilistic relationships' },
      { id: 13, question: 'What is fuzzy logic?', options: ['Unclear thinking', 'Logic with degrees of truth', 'Boolean logic', 'Formal logic'], correct: 1, explanation: 'Fuzzy logic handles partial truth between 0 and 1' },
      { id: 14, question: 'What is a genetic algorithm?', options: ['DNA sequencing', 'Optimization using evolution-inspired methods', 'Database algorithm', 'Sorting'], correct: 1, explanation: 'Genetic algorithms evolve solutions via selection, crossover, mutation' },
      { id: 15, question: 'What is uninformed search?', options: ['Smart search', 'Search without domain knowledge (BFS, DFS)', 'Google search', 'Database search'], correct: 1, explanation: 'Uninformed search explores without heuristics' },
      { id: 16, question: 'What is a perceptron?', options: ['Sensor', 'Simplest single-layer neural network', 'Camera', 'Display'], correct: 1, explanation: 'Perceptron classifies linearly separable data' },
      { id: 17, question: 'What is constraint satisfaction?', options: ['Removal', 'Finding values satisfying all constraints', 'Optimization', 'Relaxation'], correct: 1, explanation: 'CSP finds assignments satisfying all constraints' },
      { id: 18, question: 'What is the difference between strong and weak AI?', options: ['Speed', 'Strong has consciousness, weak does specific tasks', 'Memory', 'Cost'], correct: 1, explanation: 'Strong AI would have general intelligence; weak AI is narrow' },
      { id: 19, question: 'What is the A* evaluation function?', options: ['f(n) = g(n)', 'f(n) = g(n) + h(n)', 'f(n) = h(n)', 'f(n) = max(g,h)'], correct: 1, explanation: 'A*: f(n) = g(n) cost so far + h(n) heuristic estimate' },
      { id: 20, question: 'What is a heuristic function?', options: ['Exact solution', 'Estimate of cost to goal', 'Random function', 'Sorting function'], correct: 1, explanation: 'Heuristics provide educated guesses about cost to reach goal' },
      { id: 21, question: 'What is an intelligent agent?', options: ['Secret agent', 'Entity perceiving environment and taking actions', 'Software bug', 'Hardware'], correct: 1, explanation: 'Intelligent agents sense and act to maximize goals' },
      { id: 22, question: 'What is the Markov Decision Process?', options: ['Random process', 'Sequential decision-making under uncertainty', 'Sorting', 'Searching'], correct: 1, explanation: 'MDP models decisions with partly random, partly controlled outcomes' },
      { id: 23, question: 'What is sentiment analysis?', options: ['Emotion detection', 'Determining opinion from text', 'Grammar checking', 'Translation'], correct: 1, explanation: 'Sentiment analysis classifies text as positive, negative, or neutral' },
      { id: 24, question: 'What is a knowledge graph?', options: ['Bar chart', 'Network of entities and relationships', 'Line graph', 'Pie chart'], correct: 1, explanation: 'Knowledge graphs represent information as connected entities' },
      { id: 25, question: 'What is adversarial search?', options: ['Friendly search', 'Search in competitive environments', 'Web search', 'File search'], correct: 1, explanation: 'Adversarial search handles competitive scenarios like chess' },
      { id: 26, question: 'What is the halting problem?', options: ['Debugging', 'Undecidable: whether a program will terminate', 'Performance issue', 'Memory leak'], correct: 1, explanation: 'No algorithm can determine if any program will halt' },
      { id: 27, question: 'What is an ontology in AI?', options: ['Philosophy', 'Formal knowledge representation', 'Database schema', 'Algorithm'], correct: 1, explanation: 'Ontologies define concepts and rules in a domain' },
      { id: 28, question: 'What is beam search?', options: ['Light search', 'Heuristic search keeping top-k nodes', 'Binary search', 'Linear search'], correct: 1, explanation: 'Beam search limits BFS to k most promising nodes per level' },
      { id: 29, question: 'What is the difference between AI and ML?', options: ['Same thing', 'AI is broader; ML is a data-driven subset', 'ML is broader', 'No relationship'], correct: 1, explanation: 'AI encompasses all intelligent behavior; ML learns from data' },
      { id: 30, question: 'What is iterative deepening search?', options: ['Deep learning', 'DFS with increasing depth limits', 'BFS variant', 'Binary search'], correct: 1, explanation: 'Iterative deepening combines DFS space efficiency with BFS completeness' },
      { id: 31, question: 'What is the Chinese Room argument?', options: ['Chinese computing', 'Computers don\'t truly understand', 'AI benchmark', 'NLP test'], correct: 1, explanation: 'Searle argues symbol manipulation doesn\'t equal understanding' },
      { id: 32, question: 'What is a multi-agent system?', options: ['Single agent', 'Multiple interacting intelligent agents', 'Multi-user', 'Distributed database'], correct: 1, explanation: 'Multi-agent systems have agents collaborating or competing' },
      { id: 33, question: 'What is automated planning?', options: ['Calendar app', 'AI creating action sequences for goals', 'Project management', 'Scheduling'], correct: 1, explanation: 'Automated planning generates action sequences to reach goals' },
      { id: 34, question: 'What is a semantic network?', options: ['Internet', 'Graph of concepts and relationships', 'Social network', 'Neural network'], correct: 1, explanation: 'Semantic networks use nodes and edges for knowledge' },
      { id: 35, question: 'What is propositional logic?', options: ['English grammar', 'Logic with true/false propositions', 'Programming language', 'Mathematics'], correct: 1, explanation: 'Propositional logic uses AND, OR, NOT for reasoning' },
      { id: 36, question: 'What is first-order logic?', options: ['Basic logic', 'Logic with quantifiers and predicates', 'Boolean logic', 'Fuzzy logic'], correct: 1, explanation: 'First-order logic extends propositional with quantifiers' },
      { id: 37, question: 'What is simulated annealing?', options: ['Heating metal', 'Probabilistic optimization inspired by metallurgy', 'Cooling system', 'Sensor'], correct: 1, explanation: 'Simulated annealing uses temperature to escape local optima' },
      { id: 38, question: 'What is a utility function?', options: ['Electricity bill', 'Function measuring state desirability', 'Helper function', 'Math function'], correct: 1, explanation: 'Utility functions assign numeric values to states' },
      { id: 39, question: 'What is the Wumpus World?', options: ['Video game', 'Classic AI test for reasoning', 'Real world', 'Database'], correct: 1, explanation: 'Wumpus World tests logical reasoning and planning' },
      { id: 40, question: 'What is means-ends analysis?', options: ['Financial analysis', 'Reducing difference between current and goal state', 'Data analysis', 'Performance analysis'], correct: 1, explanation: 'Means-ends analysis identifies and reduces state differences' },
      { id: 41, question: 'What is a production system?', options: ['Factory', 'Rule-based system using if-then rules', 'Database', 'OS'], correct: 1, explanation: 'Production systems use condition-action rules for reasoning' },
      { id: 42, question: 'What is natural language understanding?', options: ['Translation', 'AI comprehending language meaning', 'Speech synthesis', 'Text formatting'], correct: 1, explanation: 'NLU focuses on machine comprehension of meaning and intent' },
      { id: 43, question: 'What is a chatbot?', options: ['Robot', 'Software simulating human conversation', 'Hardware', 'Database'], correct: 1, explanation: 'Chatbots use NLP to simulate conversations' },
      { id: 44, question: 'What is machine perception?', options: ['Human vision', 'AI interpreting sensory data', 'Data storage', 'Network monitoring'], correct: 1, explanation: 'Machine perception includes vision, speech recognition, etc.' },
      { id: 45, question: 'What is the frame problem?', options: ['Video frames', 'Representing what doesn\'t change in transitions', 'Picture framing', 'Data framing'], correct: 1, explanation: 'Frame problem: efficiently representing unchanged world aspects' },
      { id: 46, question: 'What is a decision tree in AI?', options: ['Forest', 'Tree model using feature tests', 'Binary tree', 'File tree'], correct: 1, explanation: 'Decision trees classify data by testing features at nodes' },
      { id: 47, question: 'What is the singularity in AI?', options: ['Math concept', 'AI surpassing human intelligence', 'Black hole', 'Bug'], correct: 1, explanation: 'Singularity is hypothetical point when AI exceeds human capabilities' },
      { id: 48, question: 'What is the symbol grounding problem?', options: ['Electrical grounding', 'How symbols get real-world meaning', 'Programming error', 'Hardware'], correct: 1, explanation: 'Symbol grounding: how abstract symbols connect to meaning' },
      { id: 49, question: 'What is robotics in AI?', options: ['Building robots', 'Designing intelligent physical agents', 'Mechanical engineering', 'Electronics'], correct: 1, explanation: 'AI robotics creates machines that perceive, reason, and act' },
      { id: 50, question: 'What is the frame of discernment?', options: ['Picture frame', 'Set of all possible hypotheses', 'Data frame', 'Time frame'], correct: 1, explanation: 'Frame of discernment: mutually exclusive possibilities in reasoning' },
    ],
    'Machine Learning': [
      { id: 1, question: 'What is overfitting?', options: ['Too simple', 'Model performs well on training but poorly on new data', 'Crashes', 'Slow'], correct: 1, explanation: 'Overfitting memorizes training data instead of learning patterns' },
      { id: 2, question: 'What is gradient descent?', options: ['Data preprocessing', 'Feature selection', 'Optimization to minimize loss', 'Visualization'], correct: 2, explanation: 'Gradient descent iteratively adjusts parameters to minimize loss' },
      { id: 3, question: 'What is k-means clustering?', options: ['Sorting', 'Partitioning data into k groups', 'Search', 'Neural network'], correct: 1, explanation: 'K-means groups data points into k clusters by proximity' },
      { id: 4, question: 'What is a CNN?', options: ['Text processing', 'Convolutional Neural Network for images', 'Audio only', 'Database'], correct: 1, explanation: 'CNNs excel at image processing with convolutional layers' },
      { id: 5, question: 'What is feature engineering?', options: ['Software features', 'Creating input features from raw data', 'Bug fixing', 'UI design'], correct: 1, explanation: 'Feature engineering transforms raw data into useful model inputs' },
      { id: 6, question: 'What is cross-validation?', options: ['Data cleaning', 'Evaluating model on different data splits', 'Feature selection', 'Augmentation'], correct: 1, explanation: 'Cross-validation tests model generalization across data folds' },
      { id: 7, question: 'What is a decision tree?', options: ['File structure', 'Model using branching decisions', 'Network topology', 'Database'], correct: 1, explanation: 'Decision trees split data by feature values for predictions' },
      { id: 8, question: 'What is regularization?', options: ['Normalization', 'Preventing overfitting by penalizing complexity', 'Feature scaling', 'Augmentation'], correct: 1, explanation: 'Regularization adds penalty to reduce overfitting' },
      { id: 9, question: 'What is a random forest?', options: ['Tree collection', 'Ensemble of decision trees', 'Single tree', 'Neural network'], correct: 1, explanation: 'Random forest combines multiple trees for better predictions' },
      { id: 10, question: 'What is the bias-variance tradeoff?', options: ['Speed vs accuracy', 'Balancing underfitting and overfitting', 'Cost vs quality', 'Size vs speed'], correct: 1, explanation: 'High bias = underfitting, high variance = overfitting' },
      { id: 11, question: 'What is logistic regression?', options: ['Linear regression', 'Classification using sigmoid function', 'Clustering', 'Dimensionality reduction'], correct: 1, explanation: 'Logistic regression predicts class probability via sigmoid' },
      { id: 12, question: 'What is an RNN?', options: ['Random Neural Network', 'Recurrent Neural Network for sequences', 'Recursive Network', 'Reinforcement Network'], correct: 1, explanation: 'RNNs maintain hidden state across time steps for sequences' },
      { id: 13, question: 'What is a support vector machine?', options: ['Hardware', 'Classifier finding optimal hyperplane', 'Clustering', 'Regression'], correct: 1, explanation: 'SVM finds hyperplane maximizing margin between classes' },
      { id: 14, question: 'What is the confusion matrix?', options: ['Confusing table', 'Table showing TP, TN, FP, FN', 'Error matrix', 'Weight matrix'], correct: 1, explanation: 'Confusion matrix summarizes classification predictions' },
      { id: 15, question: 'What is precision?', options: ['Accuracy', 'TP / (TP + FP)', 'Recall', 'F1 score'], correct: 1, explanation: 'Precision: fraction of positive predictions that were correct' },
      { id: 16, question: 'What is recall?', options: ['Memory', 'TP / (TP + FN)', 'Precision', 'Accuracy'], correct: 1, explanation: 'Recall: fraction of actual positives correctly identified' },
      { id: 17, question: 'What is the F1 score?', options: ['Racing metric', 'Harmonic mean of precision and recall', 'Accuracy', 'Loss function'], correct: 1, explanation: 'F1 balances precision and recall into one metric' },
      { id: 18, question: 'What is a GAN?', options: ['Network protocol', 'Generative Adversarial Network', 'Graph Network', 'General AI Network'], correct: 1, explanation: 'GANs use generator and discriminator to create realistic data' },
      { id: 19, question: 'What is dropout?', options: ['Network failure', 'Randomly disabling neurons to prevent overfitting', 'Data removal', 'Layer removal'], correct: 1, explanation: 'Dropout randomly deactivates neurons during training' },
      { id: 20, question: 'What is an activation function?', options: ['Login function', 'Non-linear function on neuron output', 'Initialization', 'Loss function'], correct: 1, explanation: 'Activation functions add non-linearity (ReLU, sigmoid, tanh)' },
      { id: 21, question: 'What is the vanishing gradient problem?', options: ['Missing data', 'Gradients becoming too small for deep networks', 'Overfitting', 'Underfitting'], correct: 1, explanation: 'Vanishing gradients shrink exponentially through many layers' },
      { id: 22, question: 'What is batch normalization?', options: ['Data cleaning', 'Normalizing layer inputs for stable training', 'Batching data', 'Sorting'], correct: 1, explanation: 'Batch norm normalizes inputs at each layer for faster training' },
      { id: 23, question: 'What is PCA?', options: ['Data collection', 'Dimensionality reduction preserving variance', 'Clustering', 'Classification'], correct: 1, explanation: 'PCA projects data onto principal components' },
      { id: 24, question: 'What is a learning rate?', options: ['Study speed', 'Step size for gradient descent updates', 'Data rate', 'Accuracy rate'], correct: 1, explanation: 'Learning rate controls parameter change per gradient step' },
      { id: 25, question: 'What is an epoch?', options: ['Time period', 'One pass through entire training dataset', 'Single step', 'Batch'], correct: 1, explanation: 'An epoch is one full iteration through all training data' },
      { id: 26, question: 'What is L1 vs L2 regularization?', options: ['Same thing', 'L1 promotes sparsity, L2 shrinks weights', 'L2 creates sparsity', 'L1 is always better'], correct: 1, explanation: 'L1 (Lasso) promotes sparsity; L2 (Ridge) shrinks uniformly' },
      { id: 27, question: 'What is an autoencoder?', options: ['Encryption', 'Neural network learning compressed representations', 'Code generator', 'Compiler'], correct: 1, explanation: 'Autoencoders compress and reconstruct data through a bottleneck' },
      { id: 28, question: 'What is a hyperparameter?', options: ['Model weight', 'Configuration set before training', 'Training data', 'Output value'], correct: 1, explanation: 'Hyperparameters control the learning process' },
      { id: 29, question: 'What is LSTM?', options: ['Learning System', 'Long Short-Term Memory network', 'Linear Model', 'Layer Stacking'], correct: 1, explanation: 'LSTM handles long-range dependencies via gating mechanisms' },
      { id: 30, question: 'What is the softmax function?', options: ['Soft fabric', 'Converts logits to probability distribution', 'Activation', 'Loss function'], correct: 1, explanation: 'Softmax outputs probability distribution summing to 1' },
      { id: 31, question: 'What is data augmentation?', options: ['Collecting more data', 'Creating modified copies to expand training set', 'Deletion', 'Compression'], correct: 1, explanation: 'Augmentation creates varied examples (rotations, flips, etc.)' },
      { id: 32, question: 'What is a loss function?', options: ['Financial loss', 'Function measuring prediction error', 'Activation', 'Regularization'], correct: 1, explanation: 'Loss function quantifies how wrong predictions are' },
      { id: 33, question: 'What is mini-batch gradient descent?', options: ['Small model', 'Updating weights using data subsets', 'Full batch', 'Single sample'], correct: 1, explanation: 'Mini-batch uses small subsets balancing speed and stability' },
      { id: 34, question: 'What is the ROC curve?', options: ['Graph type', 'Plot of TPR vs FPR', 'Loss curve', 'Learning curve'], correct: 1, explanation: 'ROC visualizes classifier performance across thresholds' },
      { id: 35, question: 'What is a transformer model?', options: ['Electrical device', 'Self-attention architecture for sequences', 'CNN variant', 'RNN variant'], correct: 1, explanation: 'Transformers use self-attention for parallel sequence processing' },
      { id: 36, question: 'What is the curse of dimensionality?', options: ['Spelling curse', 'Data becoming sparse as dimensions increase', 'Too few features', 'Overfitting'], correct: 1, explanation: 'More dimensions make data sparse and distances less meaningful' },
      { id: 37, question: 'What is ensemble learning?', options: ['Single model', 'Combining multiple models for better predictions', 'Transfer learning', 'Online learning'], correct: 1, explanation: 'Ensemble methods combine predictions (bagging, boosting, stacking)' },
      { id: 38, question: 'What is KNN?', options: ['Clustering', 'Classifying by majority of k nearest neighbors', 'Neural network', 'Regression'], correct: 1, explanation: 'KNN classifies by majority vote of k closest data points' },
      { id: 39, question: 'What is the attention mechanism?', options: ['Focus tool', 'Dynamically weighing input importance', 'Activation', 'Pooling'], correct: 1, explanation: 'Attention lets models focus on relevant input parts' },
      { id: 40, question: 'What is backpropagation?', options: ['Moving backwards', 'Computing gradients for weight updates', 'Forward pass', 'Preprocessing'], correct: 1, explanation: 'Backprop calculates gradients by propagating error backwards' },
      { id: 41, question: 'What is a convolutional layer?', options: ['Dense layer', 'Layer applying filters for spatial features', 'Output layer', 'Input layer'], correct: 1, explanation: 'Conv layers scan input with learnable filters to detect patterns' },
      { id: 42, question: 'Classification vs regression?', options: ['Same task', 'Classification predicts categories, regression continuous values', 'Regression is faster', 'Classification uses more data'], correct: 1, explanation: 'Classification: discrete labels; Regression: continuous numbers' },
      { id: 43, question: 'What is XGBoost?', options: ['Game tool', 'Optimized gradient boosting algorithm', 'Neural network', 'Clustering'], correct: 1, explanation: 'XGBoost is fast, scalable gradient boosting' },
      { id: 44, question: 'What is word2vec?', options: ['Word counter', 'Algorithm converting words to dense vectors', 'Dictionary', 'Spell checker'], correct: 1, explanation: 'Word2vec creates word embeddings capturing semantic relationships' },
      { id: 45, question: 'What is the pooling layer?', options: ['Swimming pool', 'Downsampling to reduce spatial dimensions', 'Dense layer', 'Input layer'], correct: 1, explanation: 'Pooling reduces spatial size while retaining important features' },
      { id: 46, question: 'What is online learning?', options: ['Internet courses', 'Updating model with each new data point', 'Batch learning', 'Offline'], correct: 1, explanation: 'Online learning updates continuously as new data arrives' },
      { id: 47, question: 'What is semi-supervised learning?', options: ['Half training', 'Using both labeled and unlabeled data', 'Supervised only', 'Unsupervised only'], correct: 1, explanation: 'Semi-supervised leverages small labeled set with large unlabeled' },
      { id: 48, question: 'What is the AUC metric?', options: ['Audio codec', 'Area Under ROC Curve', 'Accuracy', 'Loss metric'], correct: 1, explanation: 'AUC measures overall classifier discrimination ability' },
      { id: 49, question: 'What is early stopping?', options: ['Quitting', 'Stopping when validation performance plateaus', 'Fast training', 'Batch stopping'], correct: 1, explanation: 'Early stopping prevents overfitting by halting when validation loss increases' },
      { id: 50, question: 'What is a generative model?', options: ['Power generator', 'Model learning to generate data similar to training data', 'Discriminative', 'Classification'], correct: 1, explanation: 'Generative models learn data distribution to create new samples' },
    ],
  };

  // Try exact match first, then partial match, then default
  if (fallbacks[subject]) return fallbacks[subject];
  const key = Object.keys(fallbacks).find(k => subject.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(subject.toLowerCase()));
  return fallbacks[key] || fallbacks['Data Structures'];
};


export const calculateAdaptiveDifficulty = (performance) => {
  if (!performance || !performance.recentScores || performance.recentScores.length === 0) {
    return DIFFICULTY_LEVELS.MEDIUM;
  }

  const averageScore = performance.recentScores.reduce((a, b) => a + b, 0) / performance.recentScores.length;

  if (averageScore >= 90) {
    return Math.min(performance.currentDifficulty + 1, DIFFICULTY_LEVELS.EXPERT);
  } else if (averageScore >= 75) {
    return performance.currentDifficulty;
  } else if (averageScore >= 60) {
    return Math.max(performance.currentDifficulty - 0.5, DIFFICULTY_LEVELS.BEGINNER);
  } else {
    return Math.max(performance.currentDifficulty - 1, DIFFICULTY_LEVELS.BEGINNER);
  }
};

// ─── Recommended Difficulty (queries Firestore) ───────────────────────
export const getRecommendedDifficulty = async (userId, subjectId, topicId) => {
  try {
    const quizResultsRef = collection(db, 'quizResults');
    const q = query(
      quizResultsRef,
      where('userId', '==', userId),
      where('subjectId', '==', subjectId),
      where('topicId', '==', topicId),
      limit(5)
    );
    const snapshot = await getDocs(q);

    const scores = [];
    snapshot.forEach((doc) => {
      scores.push(doc.data().score);
    });

    if (scores.length === 0) {
      return { success: true, data: { difficulty: DIFFICULTY_LEVELS.EASY, reason: 'New topic - starting easy' } };
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = calculateScoreTrend(scores);

    let recommendedDifficulty;
    let reason;

    if (avgScore >= 85 && trend === 'improving') {
      recommendedDifficulty = DIFFICULTY_LEVELS.HARD;
      reason = 'Great progress! Ready for a challenge';
    } else if (avgScore >= 70) {
      recommendedDifficulty = DIFFICULTY_LEVELS.MEDIUM;
      reason = 'Good understanding - continuing at medium level';
    } else {
      recommendedDifficulty = DIFFICULTY_LEVELS.EASY;
      reason = 'Building foundation - simplified content';
    }

    return {
      success: true,
      data: { difficulty: recommendedDifficulty, reason, averageScore: avgScore, trend },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────
const calculateScoreTrend = (scores) => {
  if (scores.length < 2) return 'stable';
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (secondAvg > firstAvg + 5) return 'improving';
  if (secondAvg < firstAvg - 5) return 'declining';
  return 'stable';
};

export default {
  generateAITest,
  calculateAdaptiveDifficulty,
  getRecommendedDifficulty,
};
