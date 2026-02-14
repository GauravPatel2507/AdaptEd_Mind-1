// AI Service - Mock Test Generator (Module 5) and Difficulty Adjuster (Module 3)
import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, limit, addDoc } from 'firebase/firestore';
import { DIFFICULTY_LEVELS, QUIZ_CONFIG, AI_CONFIG } from '../constants/Config';

// Shuffle the options within each question so the correct answer isn't always at index 0
const shuffleQuestionOptions = (questions) => {
  return questions.map(q => {
    const correctAnswer = q.options[q.correct];
    // Fisher-Yates shuffle
    const shuffled = [...q.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { ...q, options: shuffled, correct: shuffled.indexOf(correctAnswer) };
  });
};

// Compute difficulty level from user's average score
const computeAdaptiveDifficulty = (avgScore) => {
  if (avgScore === null || avgScore === undefined) return 'medium';
  if (avgScore >= 80) return 'hard';
  if (avgScore >= 60) return 'medium';
  return 'easy';
};

// Generate AI-powered test using Gemini API
export const generateAITest = async (subject, config = {}) => {
  const {
    numberOfQuestions = 10,
    difficulty = 'medium',
    timeLimit = 15,
    userAvgScore = null
  } = config;

  // If adaptive, compute difficulty from the user's average score
  const effectiveDifficulty = difficulty === 'adaptive'
    ? computeAdaptiveDifficulty(userAvgScore)
    : difficulty;

  const difficultyDescription = {
    easy: 'basic and straightforward, suitable for beginners',
    medium: 'moderate complexity, requiring good understanding',
    hard: 'challenging and complex, requiring deep knowledge',
    adaptive: 'mixed difficulty ranging from easy to hard'
  };

  const prompt = `Generate exactly ${numberOfQuestions} multiple choice questions for a ${subject} test.
Difficulty level: ${difficultyDescription[effectiveDifficulty] || difficultyDescription.medium}

Return ONLY a valid JSON array with this exact structure, no other text:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]

Requirements:
- Each question MUST have exactly 4 options
- "correct" is the 0-based index of the correct answer (0, 1, 2, or 3)
- IMPORTANT: Vary the position of the correct answer randomly across questions (don't always put it at index 0)
- Questions should test knowledge of ${subject}
- Make questions educational and appropriate for students aged 16+
- Vary the topics within ${subject}
- Include practical application questions where applicable`;

  try {
    const response = await fetch(`${AI_CONFIG.GEMINI_API_URL}?key=${AI_CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      // Rate limit or other API error - silently fall back to predefined questions
      if (response.status === 429) {
        console.log('API rate limit reached, using fallback questions');
      }
      return generateFallbackTest(subject, numberOfQuestions, effectiveDifficulty);
    }

    const data = await response.json();

    // Extract the generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from AI');
    }

    // Parse the JSON from the response
    // Clean up the response - remove markdown code blocks if present
    let cleanedText = generatedText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    const questions = JSON.parse(cleanedText);

    // Validate the questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid question format received');
    }

    // Ensure each question has required fields
    const validatedQuestions = shuffleQuestionOptions(questions.map((q, index) => ({
      id: q.id || index + 1,
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation || 'No explanation provided',
      difficulty: effectiveDifficulty
    })));

    return {
      success: true,
      data: {
        questions: validatedQuestions,
        subject,
        difficulty: effectiveDifficulty,
        timeLimit,
        totalQuestions: validatedQuestions.length,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    // Network or parsing error - use fallback questions
    console.log('Using fallback questions due to:', error.message);

    // Fallback to sample questions if API fails
    return generateFallbackTest(subject, numberOfQuestions, effectiveDifficulty);
  }
};

// Fallback test generation using predefined questions
const generateFallbackTest = (subject, count, difficulty) => {
  const fallbackQuestions = {
    'Programming in C': [
      { id: 1, question: 'Which keyword is used to prevent modification of a variable in C?', options: ['const', 'static', 'volatile', 'register'], correct: 0, explanation: 'const declares a read-only variable' },
      { id: 2, question: 'What is the size of int on a 32-bit system?', options: ['4 bytes', '2 bytes', '8 bytes', '1 byte'], correct: 0, explanation: 'int is typically 4 bytes on 32-bit systems' },
      { id: 3, question: 'What does malloc() return on failure?', options: ['NULL', '0', '-1', 'undefined'], correct: 0, explanation: 'malloc returns NULL when memory allocation fails' },
      { id: 4, question: 'Which operator is used to access a member of a structure through a pointer?', options: ['->', '.', '*', '&'], correct: 0, explanation: 'Arrow operator (->) dereferences and accesses structure members' },
      { id: 5, question: 'What is the output of printf("%d", sizeof(char))?', options: ['1', '2', '4', '8'], correct: 0, explanation: 'char is always 1 byte by definition' },
      { id: 6, question: 'Which function is used to concatenate two strings in C?', options: ['strcat()', 'strcmp()', 'strcpy()', 'strlen()'], correct: 0, explanation: 'strcat appends one string to another' },
      { id: 7, question: 'What is a dangling pointer?', options: ['Pointer to freed memory', 'Null pointer', 'Wild pointer', 'Void pointer'], correct: 0, explanation: 'A dangling pointer refers to memory that has been freed' },
      { id: 8, question: 'Which header file is needed for dynamic memory allocation?', options: ['stdlib.h', 'stdio.h', 'string.h', 'math.h'], correct: 0, explanation: 'stdlib.h provides malloc, calloc, realloc, free' },
      { id: 9, question: 'What does the static keyword do for a local variable?', options: ['Preserves value between calls', 'Makes it global', 'Makes it constant', 'Allocates on heap'], correct: 0, explanation: 'Static local variables retain their value between function calls' },
      { id: 10, question: 'What is the difference between ++i and i++?', options: ['Pre vs post increment', 'No difference', 'Speed difference', 'Type difference'], correct: 0, explanation: '++i increments before use, i++ increments after use' },
    ],
    'Data Structures': [
      { id: 1, question: 'What is the time complexity of searching in a balanced BST?', options: ['O(log n)', 'O(n)', 'O(1)', 'O(n²)'], correct: 0, explanation: 'Balanced BST halves search space each step' },
      { id: 2, question: 'Which data structure uses LIFO principle?', options: ['Stack', 'Queue', 'Array', 'Linked List'], correct: 0, explanation: 'Stack uses Last In, First Out' },
      { id: 3, question: 'What is the worst-case time complexity of insertion in an unsorted array?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correct: 0, explanation: 'Inserting at end of unsorted array is O(1)' },
      { id: 4, question: 'Which traversal of BST gives sorted output?', options: ['Inorder', 'Preorder', 'Postorder', 'Level order'], correct: 0, explanation: 'Inorder traversal visits left-root-right giving sorted order' },
      { id: 5, question: 'What is the maximum number of nodes in a binary tree of height h?', options: ['2^(h+1) - 1', '2h', 'h²', '2^h'], correct: 0, explanation: 'A full binary tree of height h has 2^(h+1)-1 nodes' },
      { id: 6, question: 'Which data structure is used for BFS?', options: ['Queue', 'Stack', 'Array', 'Heap'], correct: 0, explanation: 'BFS uses a queue for level-by-level traversal' },
      { id: 7, question: 'What is the time complexity of accessing an element in a hash table (average)?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correct: 0, explanation: 'Hash tables provide constant-time average lookup' },
      { id: 8, question: 'Which data structure is best for implementing a priority queue?', options: ['Heap', 'Stack', 'Queue', 'Linked List'], correct: 0, explanation: 'Heaps efficiently support priority queue operations' },
      { id: 9, question: 'What is a complete binary tree?', options: ['All levels filled except possibly last', 'All leaves at same level', 'Every node has 2 children', 'Height is log n'], correct: 0, explanation: 'Complete tree fills levels left to right, last level may be partial' },
      { id: 10, question: 'What is the space complexity of an adjacency matrix for a graph with V vertices?', options: ['O(V²)', 'O(V)', 'O(V+E)', 'O(E)'], correct: 0, explanation: 'Adjacency matrix requires V×V space' },
    ],
    'Database Management': [
      { id: 1, question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'System Query Language'], correct: 0, explanation: 'SQL is Structured Query Language for managing databases' },
      { id: 2, question: 'Which normal form eliminates partial dependencies?', options: ['2NF', '1NF', '3NF', 'BCNF'], correct: 0, explanation: '2NF removes partial dependencies on primary key' },
      { id: 3, question: 'What is a foreign key?', options: ['Reference to primary key in another table', 'Primary key of current table', 'Unique key', 'Candidate key'], correct: 0, explanation: 'Foreign key establishes relationships between tables' },
      { id: 4, question: 'Which SQL command is used to remove a table?', options: ['DROP', 'DELETE', 'REMOVE', 'TRUNCATE'], correct: 0, explanation: 'DROP TABLE removes the entire table structure' },
      { id: 5, question: 'What does ACID stand for in database transactions?', options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Integrity, Data', 'Atomicity, Control, Isolation, Data', 'Access, Consistency, Integrity, Durability'], correct: 0, explanation: 'ACID properties ensure reliable transaction processing' },
      { id: 6, question: 'Which join returns all rows from both tables?', options: ['FULL OUTER JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN'], correct: 0, explanation: 'Full outer join returns all matching and non-matching rows' },
      { id: 7, question: 'What is normalization?', options: ['Reducing data redundancy', 'Adding indexes', 'Creating backups', 'Encrypting data'], correct: 0, explanation: 'Normalization organizes data to reduce redundancy' },
      { id: 8, question: 'Which SQL clause is used to filter grouped results?', options: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'], correct: 0, explanation: 'HAVING filters after GROUP BY, WHERE filters before' },
      { id: 9, question: 'What is a deadlock?', options: ['Circular wait between transactions', 'Database crash', 'Query timeout', 'Lock timeout'], correct: 0, explanation: 'Deadlock occurs when transactions wait circularly for each other' },
      { id: 10, question: 'What type of database is MongoDB?', options: ['NoSQL document database', 'Relational database', 'Graph database', 'Time-series database'], correct: 0, explanation: 'MongoDB stores data as JSON-like documents' },
    ],
    'OOP (Java/Python/C++)': [
      { id: 1, question: 'What is encapsulation?', options: ['Bundling data and methods together', 'Inheriting from parent', 'Method overriding', 'Using interfaces'], correct: 0, explanation: 'Encapsulation wraps data and methods into a single unit' },
      { id: 2, question: 'What is polymorphism?', options: ['Same interface, different implementations', 'Multiple inheritance', 'Data hiding', 'Object creation'], correct: 0, explanation: 'Polymorphism allows objects to take many forms' },
      { id: 3, question: 'Which OOP principle is achieved through inheritance?', options: ['Code reusability', 'Data hiding', 'Abstraction', 'Polymorphism'], correct: 0, explanation: 'Inheritance allows reuse of parent class code' },
      { id: 4, question: 'What is an abstract class?', options: ['Class that cannot be instantiated', 'Class with no methods', 'Private class', 'Final class'], correct: 0, explanation: 'Abstract classes cannot be instantiated directly' },
      { id: 5, question: 'What does the SOLID S stand for?', options: ['Single Responsibility', 'Simple', 'Structured', 'Serializable'], correct: 0, explanation: 'A class should have only one reason to change' },
      { id: 6, question: 'What is method overloading?', options: ['Same name, different parameters', 'Same name, same parameters', 'Overriding parent method', 'Static method'], correct: 0, explanation: 'Overloading uses same method name with different signatures' },
      { id: 7, question: 'What is the purpose of a constructor?', options: ['Initialize object state', 'Destroy object', 'Copy object', 'Compare objects'], correct: 0, explanation: 'Constructors initialize object attributes when created' },
      { id: 8, question: 'Which design pattern ensures only one instance?', options: ['Singleton', 'Factory', 'Observer', 'Strategy'], correct: 0, explanation: 'Singleton restricts class instantiation to one object' },
      { id: 9, question: 'What is an interface?', options: ['Contract with abstract methods', 'Concrete class', 'Type of variable', 'Design pattern'], correct: 0, explanation: 'Interfaces define method signatures without implementation' },
      { id: 10, question: 'What is the diamond problem?', options: ['Ambiguity in multiple inheritance', 'Memory leak', 'Null pointer issue', 'Stack overflow'], correct: 0, explanation: 'Diamond problem arises when a class inherits from two classes with common ancestor' },
    ],
    'Operating Systems': [
      { id: 1, question: 'What is a process?', options: ['Program in execution', 'Code on disk', 'Thread', 'File'], correct: 0, explanation: 'A process is an instance of a running program' },
      { id: 2, question: 'Which scheduling algorithm is non-preemptive?', options: ['FCFS', 'Round Robin', 'SRTF', 'Priority (preemptive)'], correct: 0, explanation: 'First Come First Served runs to completion' },
      { id: 3, question: 'What is thrashing?', options: ['Excessive page swapping', 'CPU overheating', 'Disk failure', 'Network congestion'], correct: 0, explanation: 'Thrashing occurs when system spends more time paging than executing' },
      { id: 4, question: 'What is a semaphore?', options: ['Synchronization mechanism', 'Memory segment', 'Process type', 'File descriptor'], correct: 0, explanation: 'Semaphores control access to shared resources' },
      { id: 5, question: 'What does virtual memory provide?', options: ['Illusion of large memory', 'Faster CPU', 'Better graphics', 'Network speed'], correct: 0, explanation: 'Virtual memory uses disk to extend available RAM' },
      { id: 6, question: 'Which condition is NOT required for deadlock?', options: ['Preemption', 'Mutual exclusion', 'Hold and wait', 'Circular wait'], correct: 0, explanation: 'No preemption (not preemption) is required — preemption prevents deadlock' },
      { id: 7, question: 'What is context switching?', options: ['Saving/restoring process state', 'Switching users', 'Changing OS', 'Disk swapping'], correct: 0, explanation: 'Context switch saves one process state and loads another' },
      { id: 8, question: 'What is paging?', options: ['Dividing memory into fixed-size blocks', 'Sorting memory', 'Compressing memory', 'Encrypting memory'], correct: 0, explanation: 'Paging divides memory into equal-sized pages' },
      { id: 9, question: 'What is the purpose of a page table?', options: ['Map virtual to physical addresses', 'Store file names', 'Schedule processes', 'Manage devices'], correct: 0, explanation: 'Page table translates virtual addresses to physical' },
      { id: 10, question: 'What is a zombie process?', options: ['Terminated but not reaped', 'Sleeping process', 'Background process', 'Root process'], correct: 0, explanation: 'Zombie process finished but parent hasn\'t collected its exit status' },
    ],
    'Computer Networks': [
      { id: 1, question: 'How many layers does the OSI model have?', options: ['7', '5', '4', '6'], correct: 0, explanation: 'OSI has 7 layers from Physical to Application' },
      { id: 2, question: 'Which protocol is used for reliable data transfer?', options: ['TCP', 'UDP', 'IP', 'ICMP'], correct: 0, explanation: 'TCP provides reliable, ordered delivery' },
      { id: 3, question: 'What is the default port for HTTP?', options: ['80', '443', '21', '25'], correct: 0, explanation: 'HTTP uses port 80 by default' },
      { id: 4, question: 'What does DNS do?', options: ['Resolves domain names to IPs', 'Encrypts data', 'Routes packets', 'Manages emails'], correct: 0, explanation: 'DNS translates domain names to IP addresses' },
      { id: 5, question: 'Which layer is responsible for routing?', options: ['Network layer', 'Transport layer', 'Data link layer', 'Application layer'], correct: 0, explanation: 'Network layer (Layer 3) handles routing' },
      { id: 6, question: 'What is CIDR notation?', options: ['IP addressing with prefix length', 'Encryption standard', 'Routing protocol', 'DNS format'], correct: 0, explanation: 'CIDR uses IP/prefix (e.g., 192.168.1.0/24) for subnetting' },
      { id: 7, question: 'What is the purpose of ARP?', options: ['Map IP to MAC address', 'Map URL to IP', 'Encrypt packets', 'Route data'], correct: 0, explanation: 'ARP resolves IP addresses to hardware MAC addresses' },
      { id: 8, question: 'Which topology has a single point of failure?', options: ['Star', 'Mesh', 'Ring', 'Bus'], correct: 0, explanation: 'Star topology fails if the central hub/switch fails' },
      { id: 9, question: 'What is NAT?', options: ['Network Address Translation', 'Network Access Terminal', 'Node Address Table', 'Network Authentication Token'], correct: 0, explanation: 'NAT translates private IPs to public IPs' },
      { id: 10, question: 'What is the difference between hub and switch?', options: ['Switch forwards to specific port', 'Hub is smarter', 'No difference', 'Switch broadcasts to all'], correct: 0, explanation: 'Switches learn MAC addresses and forward selectively' },
    ],
    'Design & Analysis of Algorithms': [
      { id: 1, question: 'What is the time complexity of binary search?', options: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'], correct: 0, explanation: 'Binary search halves the search space each iteration' },
      { id: 2, question: 'Which sorting algorithm has the best average case?', options: ['Merge Sort - O(n log n)', 'Bubble Sort - O(n²)', 'Insertion Sort - O(n²)', 'Selection Sort - O(n²)'], correct: 0, explanation: 'Merge sort guarantees O(n log n) in all cases' },
      { id: 3, question: 'What technique does dynamic programming use?', options: ['Optimal substructure + overlapping subproblems', 'Divide and conquer', 'Random selection', 'Brute force'], correct: 0, explanation: 'DP breaks problems into overlapping subproblems' },
      { id: 4, question: 'What is the greedy approach?', options: ['Choose locally optimal at each step', 'Try all possibilities', 'Use recursion', 'Random selection'], correct: 0, explanation: 'Greedy algorithms make the best local choice at each step' },
      { id: 5, question: 'What is Big-O notation?', options: ['Upper bound on growth rate', 'Exact running time', 'Lower bound', 'Average time'], correct: 0, explanation: 'Big-O describes the worst-case upper bound' },
      { id: 6, question: 'Which problem is solved by Dijkstra\'s algorithm?', options: ['Shortest path', 'Minimum spanning tree', 'Maximum flow', 'Topological sort'], correct: 0, explanation: 'Dijkstra finds shortest path from source to all vertices' },
      { id: 7, question: 'What is the time complexity of quicksort (average)?', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], correct: 0, explanation: 'Quicksort averages O(n log n) with good pivot selection' },
      { id: 8, question: 'What is memoization?', options: ['Caching computed results', 'Memorizing code', 'Memory optimization', 'Variable naming'], correct: 0, explanation: 'Memoization stores results of expensive function calls' },
      { id: 9, question: 'Which is a divide and conquer algorithm?', options: ['Merge Sort', 'Bubble Sort', 'Insertion Sort', 'Selection Sort'], correct: 0, explanation: 'Merge sort divides array, sorts halves, then merges' },
      { id: 10, question: 'What is the Master Theorem used for?', options: ['Solving recurrence relations', 'Graph theory', 'String matching', 'Sorting'], correct: 0, explanation: 'Master theorem solves recurrences of form T(n)=aT(n/b)+f(n)' },
    ],
    'Web Technologies': [
      { id: 1, question: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], correct: 0, explanation: 'CSS styles HTML elements' },
      { id: 2, question: 'Which HTTP method is used to submit form data?', options: ['POST', 'GET', 'PUT', 'DELETE'], correct: 0, explanation: 'POST sends data to server in request body' },
      { id: 3, question: 'What is the virtual DOM?', options: ['In-memory representation of real DOM', 'Server-side DOM', 'Database', 'CSS framework'], correct: 0, explanation: 'Virtual DOM optimizes rendering by diffing changes' },
      { id: 4, question: 'What is REST?', options: ['Representational State Transfer', 'Remote Execution Standard', 'Real-time Event System', 'Resource Exchange Service'], correct: 0, explanation: 'REST is an architectural style for web APIs' },
      { id: 5, question: 'What does npm stand for?', options: ['Node Package Manager', 'New Program Manager', 'Network Protocol Manager', 'Node Process Monitor'], correct: 0, explanation: 'npm manages JavaScript packages and dependencies' },
      { id: 6, question: 'What is a closure in JavaScript?', options: ['Function with access to outer scope', 'Closing a browser tab', 'End of function', 'Try-catch block'], correct: 0, explanation: 'Closures retain access to variables from enclosing scope' },
      { id: 7, question: 'What is CORS?', options: ['Cross-Origin Resource Sharing', 'Central Object Resource System', 'Client Origin Request Standard', 'Cross-Object Rendering Service'], correct: 0, explanation: 'CORS allows restricted resources to be requested cross-origin' },
      { id: 8, question: 'What is the purpose of a JWT?', options: ['Securely transmit info as JSON token', 'Style web pages', 'Query databases', 'Manage packages'], correct: 0, explanation: 'JWTs are used for authentication and info exchange' },
      { id: 9, question: 'Which React hook manages state?', options: ['useState', 'useEffect', 'useRef', 'useMemo'], correct: 0, explanation: 'useState lets functional components manage state' },
      { id: 10, question: 'What is middleware in Express.js?', options: ['Functions that process requests', 'Database connector', 'Frontend framework', 'CSS preprocessor'], correct: 0, explanation: 'Middleware functions have access to req, res, and next' },
    ],
    'Artificial Intelligence': [
      { id: 1, question: 'What is the Turing Test?', options: ['Test if machine exhibits intelligent behavior', 'CPU benchmark', 'Memory test', 'Network speed test'], correct: 0, explanation: 'Turing test evaluates if a machine can mimic human intelligence' },
      { id: 2, question: 'Which search algorithm uses a heuristic?', options: ['A*', 'BFS', 'DFS', 'Dijkstra'], correct: 0, explanation: 'A* uses heuristic function to estimate cost to goal' },
      { id: 3, question: 'What is a neural network inspired by?', options: ['Human brain', 'Computer CPU', 'Internet', 'Databases'], correct: 0, explanation: 'Neural networks mimic biological neuron connections' },
      { id: 4, question: 'What is NLP?', options: ['Natural Language Processing', 'Network Layer Protocol', 'Numerical Logic Program', 'Node Link Processing'], correct: 0, explanation: 'NLP enables computers to understand human language' },
      { id: 5, question: 'What is an intelligent agent?', options: ['Entity that perceives and acts on environment', 'Programming language', 'Database system', 'Operating system'], correct: 0, explanation: 'Agents perceive through sensors and act through actuators' },
      { id: 6, question: 'What is supervised learning?', options: ['Learning from labeled data', 'Learning without data', 'Self-directed learning', 'Unsupervised clustering'], correct: 0, explanation: 'Supervised learning trains on input-output pairs' },
      { id: 7, question: 'What is the purpose of activation functions in neural networks?', options: ['Introduce non-linearity', 'Store data', 'Connect layers', 'Initialize weights'], correct: 0, explanation: 'Activation functions allow networks to learn complex patterns' },
      { id: 8, question: 'What is reinforcement learning?', options: ['Learning through rewards and penalties', 'Learning from labeled data', 'Clustering data', 'Feature extraction'], correct: 0, explanation: 'RL agents learn by receiving rewards for actions' },
      { id: 9, question: 'What is a decision tree?', options: ['Tree-like model of decisions', 'Binary tree', 'File system', 'Network topology'], correct: 0, explanation: 'Decision trees split data based on features for classification' },
      { id: 10, question: 'What is computer vision?', options: ['AI that interprets visual data', 'Monitor resolution', 'Graphics rendering', 'Video streaming'], correct: 0, explanation: 'Computer vision enables machines to interpret images/video' },
    ],
    'Machine Learning': [
      { id: 1, question: 'What is overfitting?', options: ['Model performs well on training but poorly on new data', 'Model is too simple', 'Model crashes', 'Model is slow'], correct: 0, explanation: 'Overfitting means the model memorizes training data instead of learning patterns' },
      { id: 2, question: 'What is the purpose of a validation set?', options: ['Tune model hyperparameters', 'Train the model', 'Deploy the model', 'Store data'], correct: 0, explanation: 'Validation set helps tune parameters without touching test data' },
      { id: 3, question: 'What is gradient descent?', options: ['Optimization algorithm to minimize loss', 'Data preprocessing step', 'Feature selection method', 'Visualization tool'], correct: 0, explanation: 'Gradient descent iteratively adjusts parameters to minimize the loss function' },
      { id: 4, question: 'What is a confusion matrix?', options: ['Table showing prediction results', 'Random matrix', 'Weight matrix', 'Input matrix'], correct: 0, explanation: 'Confusion matrix shows true/false positives and negatives' },
      { id: 5, question: 'What is k-means clustering?', options: ['Partitioning data into k groups', 'Sorting algorithm', 'Search algorithm', 'Neural network type'], correct: 0, explanation: 'K-means groups data points into k clusters by proximity' },
      { id: 6, question: 'What is the bias-variance tradeoff?', options: ['Balancing underfitting and overfitting', 'Speed vs accuracy', 'Memory vs CPU', 'Training vs testing'], correct: 0, explanation: 'High bias = underfitting, high variance = overfitting' },
      { id: 7, question: 'What is a CNN used for?', options: ['Image recognition', 'Text processing', 'Audio only', 'Database queries'], correct: 0, explanation: 'Convolutional Neural Networks excel at image processing' },
      { id: 8, question: 'What is cross-validation?', options: ['Splitting data into folds for robust evaluation', 'Crossing out bad data', 'Validating credentials', 'Network validation'], correct: 0, explanation: 'Cross-validation tests model performance across different data splits' },
      { id: 9, question: 'What is feature engineering?', options: ['Creating new input features from raw data', 'Building software features', 'Bug fixing', 'UI design'], correct: 0, explanation: 'Feature engineering transforms raw data into useful model inputs' },
      { id: 10, question: 'What is an RNN used for?', options: ['Sequential data like text and time series', 'Image classification', 'Static data', 'Database operations'], correct: 0, explanation: 'Recurrent Neural Networks process sequential data with memory' },
    ],
  };

  // Get questions for the subject or use default (try name match, then first available)
  let questions = fallbackQuestions[subject] || fallbackQuestions['Data Structures'];

  // Shuffle question order, limit to requested count, then randomize option positions
  questions = questions.sort(() => Math.random() - 0.5).slice(0, count);
  questions = shuffleQuestionOptions(questions);

  return {
    success: true,
    data: {
      questions,
      subject,
      difficulty,
      timeLimit: 15,
      totalQuestions: questions.length,
      generatedAt: new Date().toISOString(),
      isFallback: true
    }
  };
};

// Question bank structure (in production, this would come from Firebase)
const sampleQuestions = {
  data_structures: {
    arrays: [
      { id: 1, question: 'What is the time complexity of accessing an array element by index?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correct: 0, difficulty: 1 },
      { id: 2, question: 'What is the worst-case time complexity of searching an unsorted array?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'], correct: 0, difficulty: 2 },
      { id: 3, question: 'What is the time complexity of inserting at the beginning of an array?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'], correct: 0, difficulty: 3 },
    ],
    trees: [
      { id: 4, question: 'What is the height of a balanced BST with n nodes?', options: ['O(log n)', 'O(n)', 'O(1)', 'O(n²)'], correct: 0, difficulty: 3 },
      { id: 5, question: 'Which traversal gives sorted output in a BST?', options: ['Inorder', 'Preorder', 'Postorder', 'Level-order'], correct: 0, difficulty: 2 },
    ],
  },
  algorithms: {
    sorting: [
      { id: 6, question: 'What is merge sort\'s time complexity?', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], correct: 0, difficulty: 2 },
      { id: 7, question: 'Which sorting algorithm is in-place?', options: ['Quick Sort', 'Merge Sort', 'Counting Sort', 'Radix Sort'], correct: 0, difficulty: 3 },
    ],
    dp: [
      { id: 8, question: 'What is the key property of dynamic programming?', options: ['Overlapping subproblems', 'Random access', 'Sorted data', 'Constant space'], correct: 0, difficulty: 2 },
      { id: 9, question: 'What technique stores previously computed results?', options: ['Memoization', 'Recursion', 'Iteration', 'Backtracking'], correct: 0, difficulty: 2 },
    ],
  },
  dbms: {
    sql: [
      { id: 10, question: 'Which SQL clause filters grouped results?', options: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'], correct: 0, difficulty: 2 },
      { id: 11, question: 'Which normal form removes transitive dependencies?', options: ['3NF', '1NF', '2NF', 'BCNF'], correct: 0, difficulty: 3 },
    ],
  },
  networks: {
    protocols: [
      { id: 12, question: 'Which protocol provides reliable delivery?', options: ['TCP', 'UDP', 'IP', 'ICMP'], correct: 0, difficulty: 1 },
      { id: 13, question: 'How many layers does the OSI model have?', options: ['7', '5', '4', '6'], correct: 0, difficulty: 1 },
    ],
  },
};

// Generate personalized mock test (Module 5)
export const generateMockTest = async (userId, subject, config = {}) => {
  const {
    numberOfQuestions = QUIZ_CONFIG.minQuestionsPerQuiz,
    difficulty = 'adaptive',
    topics = []
  } = config;

  try {
    // Get user's performance history to personalize
    const userPerformance = await getUserPerformanceBySubject(userId, subject);

    // Determine target difficulty based on performance or config
    let targetDifficulty;
    if (difficulty === 'adaptive') {
      targetDifficulty = calculateAdaptiveDifficulty(userPerformance);
    } else {
      targetDifficulty = DIFFICULTY_LEVELS[difficulty.toUpperCase()] || DIFFICULTY_LEVELS.MEDIUM;
    }

    // Get questions from database (using sample data here)
    const questions = await getQuestionsForTest(subject, targetDifficulty, numberOfQuestions, topics, userPerformance.weakTopics);

    // Create test document
    const testData = {
      userId,
      subject,
      questions,
      difficulty: targetDifficulty,
      timeLimit: config.timeLimit || QUIZ_CONFIG.defaultTimePerQuestion * numberOfQuestions,
      createdAt: new Date().toISOString(),
      status: 'pending',
      personalizedReason: getPersonalizationReason(userPerformance, targetDifficulty)
    };

    // Save to Firebase
    const testRef = await addDoc(collection(db, 'tests'), testData);

    return {
      success: true,
      data: {
        testId: testRef.id,
        ...testData
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get adaptive difficulty based on performance (Module 3)
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

// Get recommended next lesson difficulty (Module 3)
export const getRecommendedDifficulty = async (userId, subjectId, topicId) => {
  try {
    // Get recent performance on this topic
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
      data: {
        difficulty: recommendedDifficulty,
        reason,
        averageScore: avgScore,
        trend
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper: Get user performance by subject
const getUserPerformanceBySubject = async (userId, subject) => {
  try {
    const quizResultsRef = collection(db, 'quizResults');
    const q = query(
      quizResultsRef,
      where('userId', '==', userId),
      where('subject', '==', subject),
      limit(10)
    );
    const snapshot = await getDocs(q);

    const scores = [];
    const topicScores = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      scores.push(data.score);

      if (data.topicScores) {
        Object.entries(data.topicScores).forEach(([topic, score]) => {
          if (!topicScores[topic]) topicScores[topic] = [];
          topicScores[topic].push(score);
        });
      }
    });

    // Find weak topics
    const weakTopics = Object.entries(topicScores)
      .map(([topic, scores]) => ({
        topic,
        average: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .filter(t => t.average < 60)
      .map(t => t.topic);

    return {
      recentScores: scores,
      currentDifficulty: scores.length > 0
        ? (scores.reduce((a, b) => a + b, 0) / scores.length >= 75 ? DIFFICULTY_LEVELS.MEDIUM : DIFFICULTY_LEVELS.EASY)
        : DIFFICULTY_LEVELS.MEDIUM,
      weakTopics
    };
  } catch (error) {
    return { recentScores: [], currentDifficulty: DIFFICULTY_LEVELS.MEDIUM, weakTopics: [] };
  }
};

// Helper: Get questions for test
const getQuestionsForTest = async (subject, targetDifficulty, count, topics, weakTopics) => {
  // In production, this would query Firebase
  // For now, using sample data with difficulty-based filtering
  const subjectQuestions = sampleQuestions[subject.toLowerCase()] || {};
  let allQuestions = [];

  Object.entries(subjectQuestions).forEach(([topic, questions]) => {
    // Prioritize weak topics
    const weight = weakTopics.includes(topic) ? 2 : 1;
    for (let i = 0; i < weight; i++) {
      allQuestions = allQuestions.concat(questions);
    }
  });

  // Filter by difficulty range (±1 from target)
  const filteredQuestions = allQuestions.filter(q =>
    Math.abs(q.difficulty - targetDifficulty) <= 1
  );

  // Shuffle and select
  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
  return shuffleQuestionOptions(shuffled.slice(0, Math.min(count, shuffled.length)));
};

// Helper: Calculate score trend
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

// Helper: Get personalization reason
const getPersonalizationReason = (performance, targetDifficulty) => {
  if (performance.weakTopics.length > 0) {
    return `Focused on areas that need improvement: ${performance.weakTopics.join(', ')}`;
  }
  if (targetDifficulty >= DIFFICULTY_LEVELS.HARD) {
    return 'Advanced level based on your excellent performance';
  }
  return 'Personalized based on your learning history';
};

export default {
  generateMockTest,
  calculateAdaptiveDifficulty,
  getRecommendedDifficulty,
  generateAITest
};
