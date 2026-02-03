// AI Service - Mock Test Generator (Module 5) and Difficulty Adjuster (Module 3)
import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, limit, addDoc } from 'firebase/firestore';
import { DIFFICULTY_LEVELS, QUIZ_CONFIG, AI_CONFIG } from '../constants/Config';

// Generate AI-powered test using Gemini API
export const generateAITest = async (subject, config = {}) => {
  const {
    numberOfQuestions = 10,
    difficulty = 'medium',
    timeLimit = 15
  } = config;

  const difficultyDescription = {
    easy: 'basic and straightforward, suitable for beginners',
    medium: 'moderate complexity, requiring good understanding',
    hard: 'challenging and complex, requiring deep knowledge',
    adaptive: 'mixed difficulty ranging from easy to hard'
  };

  const prompt = `Generate exactly ${numberOfQuestions} multiple choice questions for a ${subject} test.
Difficulty level: ${difficultyDescription[difficulty] || difficultyDescription.medium}

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
- Questions should test knowledge of ${subject}
- Make questions educational and appropriate for students
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
      return generateFallbackTest(subject, numberOfQuestions, difficulty);
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
    const validatedQuestions = questions.map((q, index) => ({
      id: q.id || index + 1,
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation || 'No explanation provided',
      difficulty: difficulty
    }));

    return {
      success: true,
      data: {
        questions: validatedQuestions,
        subject,
        difficulty,
        timeLimit,
        totalQuestions: validatedQuestions.length,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    // Network or parsing error - use fallback questions
    console.log('Using fallback questions due to:', error.message);

    // Fallback to sample questions if API fails
    return generateFallbackTest(subject, numberOfQuestions, difficulty);
  }
};

// Fallback test generation using predefined questions
const generateFallbackTest = (subject, count, difficulty) => {
  const fallbackQuestions = {
    Mathematics: [
      { id: 1, question: 'What is 15 × 8?', options: ['120', '125', '110', '130'], correct: 0, explanation: '15 × 8 = 120' },
      { id: 2, question: 'Solve: x + 7 = 15', options: ['x = 8', 'x = 22', 'x = 7', 'x = 9'], correct: 0, explanation: 'x = 15 - 7 = 8' },
      { id: 3, question: 'What is the square root of 144?', options: ['12', '14', '11', '13'], correct: 0, explanation: '√144 = 12' },
      { id: 4, question: 'What is 25% of 200?', options: ['50', '40', '25', '75'], correct: 0, explanation: '25% of 200 = 0.25 × 200 = 50' },
      { id: 5, question: 'What is the value of π (pi) approximately?', options: ['3.14', '2.14', '4.14', '3.41'], correct: 0, explanation: 'π ≈ 3.14159...' },
      { id: 6, question: 'What is 7² + 3²?', options: ['58', '49', '52', '40'], correct: 0, explanation: '49 + 9 = 58' },
      { id: 7, question: 'If a triangle has angles 60° and 80°, what is the third angle?', options: ['40°', '50°', '60°', '30°'], correct: 0, explanation: '180° - 60° - 80° = 40°' },
      { id: 8, question: 'What is the area of a rectangle with length 8 and width 5?', options: ['40', '26', '35', '45'], correct: 0, explanation: 'Area = 8 × 5 = 40' },
      { id: 9, question: 'Simplify: 3(x + 4)', options: ['3x + 12', '3x + 4', 'x + 12', '3x + 7'], correct: 0, explanation: '3(x + 4) = 3x + 12' },
      { id: 10, question: 'What is 1000 ÷ 25?', options: ['40', '45', '35', '50'], correct: 0, explanation: '1000 ÷ 25 = 40' },
    ],
    Science: [
      { id: 1, question: 'What is the chemical symbol for water?', options: ['H₂O', 'CO₂', 'NaCl', 'O₂'], correct: 0, explanation: 'Water is H₂O (2 hydrogen, 1 oxygen)' },
      { id: 2, question: 'What planet is known as the Red Planet?', options: ['Mars', 'Venus', 'Jupiter', 'Saturn'], correct: 0, explanation: 'Mars appears red due to iron oxide on its surface' },
      { id: 3, question: 'What is the powerhouse of the cell?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Chloroplast'], correct: 0, explanation: 'Mitochondria produce ATP energy' },
      { id: 4, question: 'What gas do plants absorb from the atmosphere?', options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'], correct: 0, explanation: 'Plants use CO₂ for photosynthesis' },
      { id: 5, question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '200,000 km/s'], correct: 0, explanation: 'Light travels at ~300,000 km/s' },
      { id: 6, question: 'How many bones are in the adult human body?', options: ['206', '186', '226', '256'], correct: 0, explanation: 'Adults have 206 bones' },
      { id: 7, question: 'What is the largest organ in the human body?', options: ['Skin', 'Liver', 'Heart', 'Brain'], correct: 0, explanation: 'Skin is the largest organ' },
      { id: 8, question: 'What force keeps planets orbiting the sun?', options: ['Gravity', 'Magnetism', 'Friction', 'Inertia'], correct: 0, explanation: 'Gravity pulls planets toward the sun' },
      { id: 9, question: 'What is the pH of pure water?', options: ['7', '0', '14', '1'], correct: 0, explanation: 'Pure water is neutral with pH 7' },
      { id: 10, question: 'What type of energy does the sun produce?', options: ['Nuclear', 'Chemical', 'Mechanical', 'Electrical'], correct: 0, explanation: 'The sun produces nuclear fusion energy' },
    ],
    English: [
      { id: 1, question: 'What is a noun?', options: ['A naming word', 'An action word', 'A describing word', 'A joining word'], correct: 0, explanation: 'A noun is a word that names a person, place, thing, or idea' },
      { id: 2, question: 'Which is the correct spelling?', options: ['Necessary', 'Neccessary', 'Necesary', 'Neccesary'], correct: 0, explanation: 'Necessary has one C and two Ss' },
      { id: 3, question: 'What is the past tense of "go"?', options: ['Went', 'Goed', 'Gone', 'Going'], correct: 0, explanation: 'Go is an irregular verb; its past tense is "went"' },
      { id: 4, question: 'What is a synonym for "happy"?', options: ['Joyful', 'Sad', 'Angry', 'Tired'], correct: 0, explanation: 'Joyful means the same as happy' },
      { id: 5, question: 'Which sentence is grammatically correct?', options: ['She and I went to the store', 'Me and her went to the store', 'Her and me went to the store', 'Me and she went to the store'], correct: 0, explanation: 'Use subject pronouns (She, I) as subjects of a sentence' },
      { id: 6, question: 'What is an antonym for "ancient"?', options: ['Modern', 'Old', 'Historic', 'Traditional'], correct: 0, explanation: 'Modern is the opposite of ancient' },
      { id: 7, question: 'What type of word is "quickly"?', options: ['Adverb', 'Adjective', 'Noun', 'Verb'], correct: 0, explanation: 'Quickly describes how an action is done (adverb)' },
      { id: 8, question: 'What is a metaphor?', options: ['A direct comparison without like/as', 'A comparison using like/as', 'An exaggeration', 'A sound word'], correct: 0, explanation: 'A metaphor directly states one thing IS another' },
      { id: 9, question: 'Which is correct?', options: ['Their going to the park', 'There going to the park', 'They\'re going to the park', 'Theyre going to the park'], correct: 2, explanation: 'They\'re = They are' },
      { id: 10, question: 'What is alliteration?', options: ['Repetition of consonant sounds', 'Repetition of vowel sounds', 'Rhyming words', 'Opposite meanings'], correct: 0, explanation: 'Alliteration is the repetition of initial consonant sounds' },
    ],
    History: [
      { id: 1, question: 'In which year did World War II end?', options: ['1945', '1944', '1946', '1943'], correct: 0, explanation: 'WWII ended in 1945 after Japan surrendered' },
      { id: 2, question: 'Who was the first President of the United States?', options: ['George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'John Adams'], correct: 0, explanation: 'George Washington served from 1789-1797' },
      { id: 3, question: 'The Great Wall of China was primarily built to protect against whom?', options: ['Mongol invaders', 'Japanese invaders', 'Korean invaders', 'Indian invaders'], correct: 0, explanation: 'The wall was built to protect against northern invasions' },
      { id: 4, question: 'Who discovered America in 1492?', options: ['Christopher Columbus', 'Amerigo Vespucci', 'Leif Erikson', 'Marco Polo'], correct: 0, explanation: 'Columbus reached the Americas in 1492' },
      { id: 5, question: 'The French Revolution began in which year?', options: ['1789', '1776', '1799', '1812'], correct: 0, explanation: 'The French Revolution started in 1789' },
      { id: 6, question: 'Who was known as the "Iron Lady"?', options: ['Margaret Thatcher', 'Queen Victoria', 'Indira Gandhi', 'Golda Meir'], correct: 0, explanation: 'Margaret Thatcher, UK PM, was called the Iron Lady' },
      { id: 7, question: 'The Renaissance period began in which country?', options: ['Italy', 'France', 'Germany', 'England'], correct: 0, explanation: 'The Renaissance began in Italy around the 14th century' },
      { id: 8, question: 'Who wrote the Declaration of Independence?', options: ['Thomas Jefferson', 'George Washington', 'Benjamin Franklin', 'John Adams'], correct: 0, explanation: 'Jefferson was the primary author' },
      { id: 9, question: 'The Berlin Wall fell in which year?', options: ['1989', '1991', '1985', '1987'], correct: 0, explanation: 'The Berlin Wall fell on November 9, 1989' },
      { id: 10, question: 'Who was the first woman to fly solo across the Atlantic?', options: ['Amelia Earhart', 'Harriet Quimby', 'Bessie Coleman', 'Jacqueline Cochran'], correct: 0, explanation: 'Amelia Earhart completed this flight in 1932' },
    ],
    Geography: [
      { id: 1, question: 'What is the largest continent by area?', options: ['Asia', 'Africa', 'North America', 'Europe'], correct: 0, explanation: 'Asia is about 44.58 million km²' },
      { id: 2, question: 'Which river is the longest in the world?', options: ['Nile', 'Amazon', 'Yangtze', 'Mississippi'], correct: 0, explanation: 'The Nile is approximately 6,650 km long' },
      { id: 3, question: 'What is the capital of Australia?', options: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane'], correct: 0, explanation: 'Canberra is the capital, not Sydney' },
      { id: 4, question: 'Which is the smallest country in the world?', options: ['Vatican City', 'Monaco', 'San Marino', 'Liechtenstein'], correct: 0, explanation: 'Vatican City is only 0.44 km²' },
      { id: 5, question: 'Mount Everest is located in which mountain range?', options: ['Himalayas', 'Andes', 'Alps', 'Rockies'], correct: 0, explanation: 'Everest is in the Himalayas on the Nepal-Tibet border' },
      { id: 6, question: 'What is the largest ocean?', options: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'], correct: 0, explanation: 'The Pacific covers about 165 million km²' },
      { id: 7, question: 'Which country has the largest population?', options: ['India', 'China', 'USA', 'Indonesia'], correct: 0, explanation: 'India surpassed China as most populous in 2023' },
      { id: 8, question: 'The Sahara Desert is located in which continent?', options: ['Africa', 'Asia', 'Australia', 'South America'], correct: 0, explanation: 'The Sahara covers much of North Africa' },
      { id: 9, question: 'What is the capital of Japan?', options: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama'], correct: 0, explanation: 'Tokyo has been Japan\'s capital since 1868' },
      { id: 10, question: 'Which country is known as the Land of the Rising Sun?', options: ['Japan', 'China', 'South Korea', 'Thailand'], correct: 0, explanation: 'Japan\'s name means "origin of the sun"' },
    ],
    Physics: [
      { id: 1, question: 'What is the SI unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], correct: 0, explanation: 'Force is measured in Newtons (N)' },
      { id: 2, question: 'What is Newton\'s First Law also known as?', options: ['Law of Inertia', 'Law of Gravity', 'Law of Motion', 'Law of Energy'], correct: 0, explanation: 'Objects at rest stay at rest (inertia)' },
      { id: 3, question: 'What is the formula for kinetic energy?', options: ['½mv²', 'mgh', 'F×d', 'ma'], correct: 0, explanation: 'KE = ½ × mass × velocity²' },
      { id: 4, question: 'What is the acceleration due to gravity on Earth?', options: ['9.8 m/s²', '10.8 m/s²', '8.8 m/s²', '11.8 m/s²'], correct: 0, explanation: 'g ≈ 9.8 m/s² on Earth' },
      { id: 5, question: 'What type of wave is sound?', options: ['Longitudinal', 'Transverse', 'Electromagnetic', 'Standing'], correct: 0, explanation: 'Sound is a longitudinal mechanical wave' },
      { id: 6, question: 'What is the SI unit of electric current?', options: ['Ampere', 'Volt', 'Ohm', 'Watt'], correct: 0, explanation: 'Current is measured in Amperes (A)' },
      { id: 7, question: 'What is Ohm\'s Law?', options: ['V = IR', 'P = VI', 'F = ma', 'E = mc²'], correct: 0, explanation: 'Voltage = Current × Resistance' },
      { id: 8, question: 'What is the speed of sound in air at room temperature?', options: ['343 m/s', '300 m/s', '400 m/s', '500 m/s'], correct: 0, explanation: 'Sound travels at ~343 m/s in air' },
      { id: 9, question: 'What happens to resistance when temperature increases in a conductor?', options: ['Increases', 'Decreases', 'Stays same', 'Becomes zero'], correct: 0, explanation: 'Higher temperature means more resistance in conductors' },
      { id: 10, question: 'What is the unit of frequency?', options: ['Hertz', 'Newton', 'Joule', 'Watt'], correct: 0, explanation: 'Frequency is measured in Hertz (Hz)' },
    ],
    Chemistry: [
      { id: 1, question: 'What is the atomic number of Carbon?', options: ['6', '12', '8', '14'], correct: 0, explanation: 'Carbon has 6 protons' },
      { id: 2, question: 'What is the chemical formula for table salt?', options: ['NaCl', 'KCl', 'CaCl₂', 'MgCl₂'], correct: 0, explanation: 'Table salt is sodium chloride (NaCl)' },
      { id: 3, question: 'What is the pH of a neutral solution?', options: ['7', '0', '14', '1'], correct: 0, explanation: 'pH 7 is neutral (neither acidic nor basic)' },
      { id: 4, question: 'Which gas is released during photosynthesis?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], correct: 0, explanation: 'Plants release O₂ during photosynthesis' },
      { id: 5, question: 'What is the chemical symbol for Gold?', options: ['Au', 'Ag', 'Fe', 'Cu'], correct: 0, explanation: 'Au comes from the Latin "aurum"' },
      { id: 6, question: 'What type of bond is formed when electrons are shared?', options: ['Covalent bond', 'Ionic bond', 'Metallic bond', 'Hydrogen bond'], correct: 0, explanation: 'Covalent bonds involve electron sharing' },
      { id: 7, question: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon'], correct: 0, explanation: 'Nitrogen makes up about 78% of air' },
      { id: 8, question: 'What is the chemical formula for glucose?', options: ['C₆H₁₂O₆', 'C₁₂H₂₂O₁₁', 'CH₄', 'C₂H₅OH'], correct: 0, explanation: 'Glucose is a simple sugar with formula C₆H₁₂O₆' },
      { id: 9, question: 'Which element has the symbol Fe?', options: ['Iron', 'Fluorine', 'Francium', 'Fermium'], correct: 0, explanation: 'Fe comes from the Latin "ferrum"' },
      { id: 10, question: 'What is an exothermic reaction?', options: ['Releases heat', 'Absorbs heat', 'Produces light', 'Produces sound'], correct: 0, explanation: 'Exothermic reactions release energy as heat' },
    ],
    Biology: [
      { id: 1, question: 'What is the basic unit of life?', options: ['Cell', 'Tissue', 'Organ', 'Molecule'], correct: 0, explanation: 'The cell is the fundamental unit of all living organisms' },
      { id: 2, question: 'What is DNA?', options: ['Deoxyribonucleic acid', 'Dinitrogen acid', 'Dioxygen nucleic acid', 'Dual nucleotide acid'], correct: 0, explanation: 'DNA carries genetic information' },
      { id: 3, question: 'Which organelle is responsible for photosynthesis?', options: ['Chloroplast', 'Mitochondria', 'Nucleus', 'Ribosome'], correct: 0, explanation: 'Chloroplasts contain chlorophyll for photosynthesis' },
      { id: 4, question: 'How many chromosomes do humans have?', options: ['46', '23', '48', '44'], correct: 0, explanation: 'Humans have 23 pairs = 46 chromosomes' },
      { id: 5, question: 'What is the function of red blood cells?', options: ['Carry oxygen', 'Fight infection', 'Clot blood', 'Produce hormones'], correct: 0, explanation: 'RBCs carry oxygen using hemoglobin' },
      { id: 6, question: 'What is the largest organ in the human body?', options: ['Skin', 'Liver', 'Heart', 'Lungs'], correct: 0, explanation: 'Skin covers about 20 square feet' },
      { id: 7, question: 'What type of organism is yeast?', options: ['Fungus', 'Bacteria', 'Virus', 'Plant'], correct: 0, explanation: 'Yeast is a single-celled fungus' },
      { id: 8, question: 'What is the process of cell division called?', options: ['Mitosis', 'Meiosis', 'Osmosis', 'Diffusion'], correct: 0, explanation: 'Mitosis produces two identical daughter cells' },
      { id: 9, question: 'Which vitamin is produced when skin is exposed to sunlight?', options: ['Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin B12'], correct: 0, explanation: 'UV rays help synthesize Vitamin D' },
      { id: 10, question: 'What is the study of heredity called?', options: ['Genetics', 'Ecology', 'Anatomy', 'Physiology'], correct: 0, explanation: 'Genetics studies how traits are inherited' },
    ],
    'Computer Science': [
      { id: 1, question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Unit', 'Computer Processing Unit'], correct: 0, explanation: 'CPU is the brain of the computer' },
      { id: 2, question: 'Which language is known as the mother of all languages?', options: ['C', 'Java', 'Python', 'FORTRAN'], correct: 0, explanation: 'C influenced many modern programming languages' },
      { id: 3, question: 'What is 1024 bytes called?', options: ['Kilobyte', 'Megabyte', 'Gigabyte', 'Bit'], correct: 0, explanation: '1 KB = 1024 bytes' },
      { id: 4, question: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correct: 0, explanation: 'HTML is used to structure web pages' },
      { id: 5, question: 'Which of these is an operating system?', options: ['Linux', 'Python', 'Chrome', 'Photoshop'], correct: 0, explanation: 'Linux is a free, open-source OS' },
      { id: 6, question: 'What is the binary representation of 5?', options: ['101', '110', '100', '111'], correct: 0, explanation: '5 in binary is 101 (4+0+1)' },
      { id: 7, question: 'What does RAM stand for?', options: ['Random Access Memory', 'Read Access Memory', 'Run Access Memory', 'Real Access Memory'], correct: 0, explanation: 'RAM is temporary, volatile memory' },
      { id: 8, question: 'Which data structure uses FIFO?', options: ['Queue', 'Stack', 'Array', 'Tree'], correct: 0, explanation: 'Queue uses First In, First Out' },
      { id: 9, question: 'What is an algorithm?', options: ['Step-by-step instructions', 'A programming language', 'A type of hardware', 'An operating system'], correct: 0, explanation: 'An algorithm is a set of instructions to solve a problem' },
      { id: 10, question: 'What does URL stand for?', options: ['Uniform Resource Locator', 'Universal Resource Link', 'Uniform Resource Link', 'Universal Resource Locator'], correct: 0, explanation: 'URL is the address of a web page' },
    ],
    Arts: [
      { id: 1, question: 'Who painted the Mona Lisa?', options: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Botticelli'], correct: 0, explanation: 'Da Vinci painted it between 1503-1519' },
      { id: 2, question: 'What are the three primary colors?', options: ['Red, Blue, Yellow', 'Red, Green, Blue', 'Red, Orange, Yellow', 'Blue, Green, Yellow'], correct: 0, explanation: 'Primary colors cannot be made by mixing other colors' },
      { id: 3, question: 'What is the art of paper folding called?', options: ['Origami', 'Calligraphy', 'Sculpture', 'Mosaic'], correct: 0, explanation: 'Origami is the Japanese art of paper folding' },
      { id: 4, question: 'Who sculpted the statue of David?', options: ['Michelangelo', 'Donatello', 'Bernini', 'Rodin'], correct: 0, explanation: 'Michelangelo created it between 1501-1504' },
      { id: 5, question: 'What is the term for painting on wet plaster?', options: ['Fresco', 'Oil painting', 'Watercolor', 'Acrylic'], correct: 0, explanation: 'Fresco painting uses water-based pigments on fresh plaster' },
      { id: 6, question: 'Which art movement is Salvador Dalí associated with?', options: ['Surrealism', 'Impressionism', 'Cubism', 'Pop Art'], correct: 0, explanation: 'Dalí was a leading surrealist artist' },
      { id: 7, question: 'What does "Renaissance" mean?', options: ['Rebirth', 'Revolution', 'Revival', 'Reform'], correct: 0, explanation: 'Renaissance means "rebirth" in French' },
      { id: 8, question: 'Who painted "The Starry Night"?', options: ['Vincent van Gogh', 'Claude Monet', 'Pablo Picasso', 'Rembrandt'], correct: 0, explanation: 'Van Gogh painted it in 1889' },
      { id: 9, question: 'What is a self-portrait?', options: ['A portrait of the artist by themselves', 'A landscape painting', 'A still life', 'An abstract work'], correct: 0, explanation: 'Artists create self-portraits of themselves' },
      { id: 10, question: 'Which color is created by mixing blue and yellow?', options: ['Green', 'Orange', 'Purple', 'Brown'], correct: 0, explanation: 'Blue + Yellow = Green' },
    ],
  };

  // Get questions for the subject or use default
  let questions = fallbackQuestions[subject] || fallbackQuestions.Mathematics;

  // Shuffle and limit to requested count
  questions = questions.sort(() => Math.random() - 0.5).slice(0, count);

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
  math: {
    algebra: [
      { id: 1, question: 'Solve for x: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 4'], correct: 0, difficulty: 2 },
      { id: 2, question: 'Factor: x² - 9', options: ['(x-3)(x+3)', '(x-9)(x+1)', '(x-3)²', 'Cannot factor'], correct: 0, difficulty: 3 },
      { id: 3, question: 'Solve: 3x² - 12 = 0', options: ['x = ±2', 'x = ±4', 'x = ±3', 'x = ±6'], correct: 0, difficulty: 4 },
    ],
    geometry: [
      { id: 4, question: 'Area of circle with radius 5?', options: ['25π', '10π', '5π', '50π'], correct: 0, difficulty: 2 },
      { id: 5, question: 'Sum of angles in a triangle?', options: ['180°', '360°', '90°', '270°'], correct: 0, difficulty: 1 },
    ],
  },
  science: {
    physics: [
      { id: 6, question: 'Unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], correct: 0, difficulty: 1 },
      { id: 7, question: 'F = ma is known as?', options: ["Newton's 2nd Law", "Newton's 1st Law", 'Law of Gravity', 'Law of Motion'], correct: 0, difficulty: 2 },
    ],
    chemistry: [
      { id: 8, question: 'Atomic number of Carbon?', options: ['6', '12', '8', '14'], correct: 0, difficulty: 1 },
      { id: 9, question: 'Chemical formula for water?', options: ['H₂O', 'CO₂', 'O₂', 'H₂O₂'], correct: 0, difficulty: 1 },
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
  return shuffled.slice(0, Math.min(count, shuffled.length));
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
