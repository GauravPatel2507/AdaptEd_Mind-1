// Fallback question bank — used when Gemini API is unavailable
// Questions moved from client-side aiService.js and restructured

const questionBanks = {
  'Programming in C': [
    { id: 1, question: 'Which keyword is used to prevent modification of a variable in C?', options: ['const', 'static', 'volatile', 'register'], correct: 0, explanation: 'const declares a read-only variable' },
    { id: 2, question: 'What is the size of int on a 32-bit system?', options: ['2 bytes', '4 bytes', '8 bytes', '1 byte'], correct: 1, explanation: 'int is typically 4 bytes on 32-bit systems' },
    { id: 3, question: 'What does malloc() return on failure?', options: ['0', '-1', 'NULL', 'undefined'], correct: 2, explanation: 'malloc returns NULL when memory allocation fails' },
    { id: 4, question: 'Which operator accesses a structure member through a pointer?', options: ['.', '*', '->', '&'], correct: 2, explanation: 'Arrow operator (->) dereferences and accesses structure members' },
    { id: 5, question: 'What is the output of printf("%d", sizeof(char))?', options: ['2', '1', '4', '8'], correct: 1, explanation: 'char is always 1 byte by definition' },
    { id: 6, question: 'Which function concatenates two strings in C?', options: ['strcmp()', 'strcat()', 'strcpy()', 'strlen()'], correct: 1, explanation: 'strcat appends one string to another' },
    { id: 7, question: 'What is a dangling pointer?', options: ['Null pointer', 'Pointer to freed memory', 'Wild pointer', 'Void pointer'], correct: 1, explanation: 'A dangling pointer refers to memory that has been freed' },
    { id: 8, question: 'Which header file is needed for dynamic memory allocation?', options: ['stdio.h', 'string.h', 'stdlib.h', 'math.h'], correct: 2, explanation: 'stdlib.h provides malloc, calloc, realloc, free' },
    { id: 9, question: 'What does the static keyword do for a local variable?', options: ['Makes it global', 'Preserves value between calls', 'Makes it constant', 'Allocates on heap'], correct: 1, explanation: 'Static local variables retain their value between function calls' },
    { id: 10, question: 'What is the difference between ++i and i++?', options: ['No difference', 'Pre vs post increment', 'Speed difference', 'Type difference'], correct: 1, explanation: '++i increments before use, i++ increments after use' },
  ],
  'Data Structures': [
    { id: 1, question: 'What is the time complexity of searching in a balanced BST?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correct: 1, explanation: 'Balanced BST halves search space each step' },
    { id: 2, question: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, explanation: 'Stack uses Last In, First Out' },
    { id: 3, question: 'What is the worst-case time complexity of insertion in an unsorted array?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'], correct: 1, explanation: 'Inserting at end of unsorted array is O(1)' },
    { id: 4, question: 'Which traversal of BST gives sorted output?', options: ['Preorder', 'Inorder', 'Postorder', 'Level order'], correct: 1, explanation: 'Inorder traversal visits left-root-right giving sorted order' },
    { id: 5, question: 'What data structure is used for BFS?', options: ['Stack', 'Array', 'Queue', 'Heap'], correct: 2, explanation: 'BFS uses a queue for level-by-level traversal' },
    { id: 6, question: 'What is the average time complexity of hash table lookup?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 3, explanation: 'Hash tables provide constant-time average lookup' },
    { id: 7, question: 'Which data structure is best for implementing a priority queue?', options: ['Stack', 'Heap', 'Queue', 'Linked List'], correct: 1, explanation: 'Heaps efficiently support priority queue operations' },
    { id: 8, question: 'What is a complete binary tree?', options: ['All leaves at same level', 'Every node has 2 children', 'All levels filled except possibly last', 'Height is log n'], correct: 2, explanation: 'Complete tree fills levels left to right, last level may be partial' },
    { id: 9, question: 'What is the space complexity of an adjacency matrix for V vertices?', options: ['O(V)', 'O(V+E)', 'O(V²)', 'O(E)'], correct: 2, explanation: 'Adjacency matrix requires V×V space' },
    { id: 10, question: 'What is max nodes in a binary tree of height h?', options: ['2h', '2^(h+1) - 1', 'h²', '2^h'], correct: 1, explanation: 'A full binary tree of height h has 2^(h+1)-1 nodes' },
  ],
  'Database Management': [
    { id: 1, question: 'What does SQL stand for?', options: ['Simple Query Language', 'Structured Query Language', 'Standard Query Logic', 'System Query Language'], correct: 1, explanation: 'SQL is Structured Query Language for managing databases' },
    { id: 2, question: 'Which normal form eliminates partial dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correct: 1, explanation: '2NF removes partial dependencies on primary key' },
    { id: 3, question: 'What is a foreign key?', options: ['Primary key of current table', 'Reference to primary key in another table', 'Unique key', 'Candidate key'], correct: 1, explanation: 'Foreign key establishes relationships between tables' },
    { id: 4, question: 'Which SQL command removes a table?', options: ['DELETE', 'REMOVE', 'DROP', 'TRUNCATE'], correct: 2, explanation: 'DROP TABLE removes the entire table structure' },
    { id: 5, question: 'What does ACID stand for?', options: ['Access, Control, Integrity, Data', 'Atomicity, Consistency, Isolation, Durability', 'Atomicity, Control, Isolation, Data', 'Access, Consistency, Integrity, Durability'], correct: 1, explanation: 'ACID properties ensure reliable transaction processing' },
    { id: 6, question: 'Which join returns all rows from both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'RIGHT JOIN'], correct: 2, explanation: 'Full outer join returns all matching and non-matching rows' },
    { id: 7, question: 'What is normalization?', options: ['Adding indexes', 'Reducing data redundancy', 'Creating backups', 'Encrypting data'], correct: 1, explanation: 'Normalization organizes data to reduce redundancy' },
    { id: 8, question: 'Which SQL clause filters grouped results?', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'], correct: 2, explanation: 'HAVING filters after GROUP BY, WHERE filters before' },
    { id: 9, question: 'What is a deadlock?', options: ['Database crash', 'Circular wait between transactions', 'Query timeout', 'Lock timeout'], correct: 1, explanation: 'Deadlock occurs when transactions wait circularly for each other' },
    { id: 10, question: 'What type of database is MongoDB?', options: ['Relational database', 'Graph database', 'NoSQL document database', 'Time-series database'], correct: 2, explanation: 'MongoDB stores data as JSON-like documents' },
  ],
  'OOP (Java/Python/C++)': [
    { id: 1, question: 'What is encapsulation?', options: ['Inheriting from parent', 'Bundling data and methods together', 'Method overriding', 'Using interfaces'], correct: 1, explanation: 'Encapsulation wraps data and methods into a single unit' },
    { id: 2, question: 'What is polymorphism?', options: ['Multiple inheritance', 'Data hiding', 'Same interface, different implementations', 'Object creation'], correct: 2, explanation: 'Polymorphism allows objects to take many forms' },
    { id: 3, question: 'Which OOP principle is achieved through inheritance?', options: ['Data hiding', 'Abstraction', 'Code reusability', 'Polymorphism'], correct: 2, explanation: 'Inheritance allows reuse of parent class code' },
    { id: 4, question: 'What is an abstract class?', options: ['Class with no methods', 'Private class', 'Class that cannot be instantiated', 'Final class'], correct: 2, explanation: 'Abstract classes cannot be instantiated directly' },
    { id: 5, question: 'What does the SOLID S stand for?', options: ['Simple', 'Structured', 'Single Responsibility', 'Serializable'], correct: 2, explanation: 'A class should have only one reason to change' },
    { id: 6, question: 'What is method overloading?', options: ['Same name, same parameters', 'Same name, different parameters', 'Overriding parent method', 'Static method'], correct: 1, explanation: 'Overloading uses same method name with different signatures' },
    { id: 7, question: 'What is the purpose of a constructor?', options: ['Destroy object', 'Copy object', 'Initialize object state', 'Compare objects'], correct: 2, explanation: 'Constructors initialize object attributes when created' },
    { id: 8, question: 'Which design pattern ensures only one instance?', options: ['Factory', 'Observer', 'Singleton', 'Strategy'], correct: 2, explanation: 'Singleton restricts class instantiation to one object' },
    { id: 9, question: 'What is an interface?', options: ['Concrete class', 'Type of variable', 'Contract with abstract methods', 'Design pattern'], correct: 2, explanation: 'Interfaces define method signatures without implementation' },
    { id: 10, question: 'What is the diamond problem?', options: ['Memory leak', 'Ambiguity in multiple inheritance', 'Null pointer issue', 'Stack overflow'], correct: 1, explanation: 'Diamond problem arises when a class inherits from two classes with common ancestor' },
  ],
  'Operating Systems': [
    { id: 1, question: 'What is a process?', options: ['Code on disk', 'Thread', 'Program in execution', 'File'], correct: 2, explanation: 'A process is an instance of a running program' },
    { id: 2, question: 'Which scheduling algorithm is non-preemptive?', options: ['Round Robin', 'SRTF', 'FCFS', 'Priority (preemptive)'], correct: 2, explanation: 'First Come First Served runs to completion' },
    { id: 3, question: 'What is thrashing?', options: ['CPU overheating', 'Excessive page swapping', 'Disk failure', 'Network congestion'], correct: 1, explanation: 'Thrashing occurs when system spends more time paging than executing' },
    { id: 4, question: 'What is a semaphore?', options: ['Memory segment', 'Synchronization mechanism', 'Process type', 'File descriptor'], correct: 1, explanation: 'Semaphores control access to shared resources' },
    { id: 5, question: 'What does virtual memory provide?', options: ['Faster CPU', 'Better graphics', 'Illusion of large memory', 'Network speed'], correct: 2, explanation: 'Virtual memory uses disk to extend available RAM' },
  ],
  'Computer Networks': [
    { id: 1, question: 'How many layers does the OSI model have?', options: ['5', '7', '4', '6'], correct: 1, explanation: 'OSI has 7 layers from Physical to Application' },
    { id: 2, question: 'Which protocol is used for reliable data transfer?', options: ['UDP', 'TCP', 'IP', 'ICMP'], correct: 1, explanation: 'TCP provides reliable, ordered delivery' },
    { id: 3, question: 'What is the default port for HTTP?', options: ['443', '80', '21', '25'], correct: 1, explanation: 'HTTP uses port 80 by default' },
    { id: 4, question: 'What does DNS do?', options: ['Encrypts data', 'Resolves domain names to IPs', 'Routes packets', 'Manages emails'], correct: 1, explanation: 'DNS translates domain names to IP addresses' },
    { id: 5, question: 'Which layer is responsible for routing?', options: ['Transport layer', 'Network layer', 'Data link layer', 'Application layer'], correct: 1, explanation: 'Network layer (Layer 3) handles routing' },
  ],
  'Design & Analysis of Algorithms': [
    { id: 1, question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1, explanation: 'Binary search halves the search space each iteration' },
    { id: 2, question: 'Which sorting algorithm has the best average case?', options: ['Bubble Sort - O(n²)', 'Merge Sort - O(n log n)', 'Insertion Sort - O(n²)', 'Selection Sort - O(n²)'], correct: 1, explanation: 'Merge sort guarantees O(n log n) in all cases' },
    { id: 3, question: 'What technique does dynamic programming use?', options: ['Divide and conquer', 'Optimal substructure + overlapping subproblems', 'Random selection', 'Brute force'], correct: 1, explanation: 'DP breaks problems into overlapping subproblems' },
    { id: 4, question: 'What is Big-O notation?', options: ['Exact running time', 'Upper bound on growth rate', 'Lower bound', 'Average time'], correct: 1, explanation: 'Big-O describes the worst-case upper bound' },
    { id: 5, question: 'What is memoization?', options: ['Memorizing code', 'Memory optimization', 'Caching computed results', 'Variable naming'], correct: 2, explanation: 'Memoization stores results of expensive function calls' },
  ],
  'Web Technologies': [
    { id: 1, question: 'What does CSS stand for?', options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], correct: 1, explanation: 'CSS styles HTML elements' },
    { id: 2, question: 'Which HTTP method is used to submit form data?', options: ['GET', 'POST', 'PUT', 'DELETE'], correct: 1, explanation: 'POST sends data to server in request body' },
    { id: 3, question: 'What is the virtual DOM?', options: ['Server-side DOM', 'In-memory representation of real DOM', 'Database', 'CSS framework'], correct: 1, explanation: 'Virtual DOM optimizes rendering by diffing changes' },
    { id: 4, question: 'What is REST?', options: ['Remote Execution Standard', 'Representational State Transfer', 'Real-time Event System', 'Resource Exchange Service'], correct: 1, explanation: 'REST is an architectural style for web APIs' },
    { id: 5, question: 'What is a closure in JavaScript?', options: ['Closing a browser tab', 'Function with access to outer scope', 'End of function', 'Try-catch block'], correct: 1, explanation: 'Closures retain access to variables from enclosing scope' },
  ],
  'Artificial Intelligence': [
    { id: 1, question: 'What is the Turing Test?', options: ['CPU benchmark', 'Test if machine exhibits intelligent behavior', 'Memory test', 'Network speed test'], correct: 1, explanation: 'Turing test evaluates if a machine can mimic human intelligence' },
    { id: 2, question: 'Which search algorithm uses a heuristic?', options: ['BFS', 'DFS', 'A*', 'Dijkstra'], correct: 2, explanation: 'A* uses heuristic function to estimate cost to goal' },
    { id: 3, question: 'What is NLP?', options: ['Network Layer Protocol', 'Natural Language Processing', 'Numerical Logic Program', 'Node Link Processing'], correct: 1, explanation: 'NLP enables computers to understand human language' },
    { id: 4, question: 'What is supervised learning?', options: ['Learning without data', 'Self-directed learning', 'Learning from labeled data', 'Unsupervised clustering'], correct: 2, explanation: 'Supervised learning trains on input-output pairs' },
    { id: 5, question: 'What is reinforcement learning?', options: ['Learning from labeled data', 'Learning through rewards and penalties', 'Clustering data', 'Feature extraction'], correct: 1, explanation: 'RL agents learn by receiving rewards for actions' },
  ],
  'Machine Learning': [
    { id: 1, question: 'What is overfitting?', options: ['Model is too simple', 'Model performs well on training but poorly on new data', 'Model crashes', 'Model is slow'], correct: 1, explanation: 'Overfitting means the model memorizes training data instead of learning patterns' },
    { id: 2, question: 'What is gradient descent?', options: ['Data preprocessing step', 'Feature selection method', 'Optimization algorithm to minimize loss', 'Visualization tool'], correct: 2, explanation: 'Gradient descent iteratively adjusts parameters to minimize the loss function' },
    { id: 3, question: 'What is k-means clustering?', options: ['Sorting algorithm', 'Partitioning data into k groups', 'Search algorithm', 'Neural network type'], correct: 1, explanation: 'K-means groups data points into k clusters by proximity' },
    { id: 4, question: 'What is a CNN used for?', options: ['Text processing', 'Image recognition', 'Audio only', 'Database queries'], correct: 1, explanation: 'Convolutional Neural Networks excel at image processing' },
    { id: 5, question: 'What is feature engineering?', options: ['Building software features', 'Creating new input features from raw data', 'Bug fixing', 'UI design'], correct: 1, explanation: 'Feature engineering transforms raw data into useful model inputs' },
  ],
};

/**
 * Get questions for a subject. Shuffles order and limits to count.
 * IMPORTANT: Correct answer positions are now properly distributed
 * (unlike the original where all were at index 0).
 */
const getQuestions = (subject, count = 10) => {
  const questions = questionBanks[subject] || questionBanks['Data Structures'];
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

module.exports = { getQuestions, questionBanks };
