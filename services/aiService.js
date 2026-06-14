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
      { id: 11, question: 'What is the three-way handshake?', options: ['Three packet exchange', 'SYN, SYN-ACK, ACK to establish TCP connection', 'Three retries', 'Three ports'], correct: 1, explanation: 'TCP uses SYN → SYN-ACK → ACK to establish connection' },
      { id: 12, question: 'What is a firewall?', options: ['Physical wall', 'Network security system filtering traffic', 'Router type', 'Cable type'], correct: 1, explanation: 'Firewalls monitor and filter network traffic' },
      { id: 13, question: 'What is the default port for HTTPS?', options: ['80', '443', '21', '8080'], correct: 1, explanation: 'HTTPS uses port 443' },
      { id: 14, question: 'What is a VPN?', options: ['Virtual Private Network', 'Very Public Network', 'Virtual Protocol Network', 'Verified Private Node'], correct: 0, explanation: 'VPN creates encrypted tunnel over public networks' },
      { id: 15, question: 'What is latency?', options: ['Bandwidth', 'Time delay for data to travel source to destination', 'Packet loss', 'Throughput'], correct: 1, explanation: 'Latency is the time for data to travel from sender to receiver' },
      { id: 16, question: 'What is ICMP used for?', options: ['File transfer', 'Error reporting and diagnostics (ping)', 'Email', 'Web browsing'], correct: 1, explanation: 'ICMP reports network errors; used by ping and traceroute' },
      { id: 17, question: 'What is a socket?', options: ['Hardware port', 'Endpoint for network communication (IP + port)', 'Cable connector', 'Protocol'], correct: 1, explanation: 'Socket = IP address + port number' },
      { id: 18, question: 'What is a CDN?', options: ['Central Data Node', 'Content Delivery Network', 'Customer Data Network', 'Cached DNS'], correct: 1, explanation: 'CDN distributes content globally for faster delivery' },
      { id: 19, question: 'What is packet switching?', options: ['Physical switch', 'Data broken into packets routed independently', 'Circuit switching', 'Message switching'], correct: 1, explanation: 'Packet switching breaks data into independently routed packets' },
      { id: 20, question: 'What is congestion control?', options: ['Traffic management on roads', 'Preventing network overload', 'Routing optimization', 'Error correction'], correct: 1, explanation: 'Congestion control prevents senders from overwhelming the network' },
    ],
  };

  // Try exact match first, then partial match, then default
  if (fallbacks[subject]) return fallbacks[subject];
  const key = Object.keys(fallbacks).find(k => subject.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(subject.toLowerCase()));
  return fallbacks[key] || fallbacks['Data Structures'];
};

// ─── Adaptive Difficulty (retained for local use) ─────────────────────
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
