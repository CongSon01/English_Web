// English Learning App - Advanced Vocabulary Learning System
// SheetBest API Configuration
const SHEETBEST_API_URL = 'https://api.sheetbest.com/sheets/4e6412d1-956d-4f38-844a-7451bb94faa2';

// Application state
let vocabularyData = [];
let currentWordIndex = 0;
let totalWordsToday = 0;
let completedWordsToday = 0;
let isImageDisplayed = false;
let currentTheme = 'light';
let isCheckingAnswer = false; // Prevent multiple simultaneous answer checks

// ID management
let nextId = 1;

// Generate unique ID for new words
function generateUniqueId() {
    const prefix = 'VW';
    const paddedNumber = String(nextId).padStart(3, '0');
    nextId++;
    return `${prefix}${paddedNumber}`;
}

// Initialize ID counter based on existing data
function initializeIdCounter() {
    if (vocabularyData.length > 0) {
        const maxId = vocabularyData.reduce((max, word) => {
            if (word.Id && word.Id.startsWith('VW')) {
                const num = parseInt(word.Id.substring(2));
                return Math.max(max, num);
            }
            return max;
        }, 0);
        nextId = maxId + 1;
    }
}

// Ensure all words have unique IDs
function ensureWordIds() {
    vocabularyData.forEach((word, index) => {
        if (!word.Id) {
            word.Id = generateUniqueId();
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    // showLoadingModal();
    updateLoadingText('Loading theme preferences...');
    
    // Load theme preference
    loadThemePreference();    try {
        updateLoadingText('Fetching vocabulary data...');
        // Fetch vocabulary data from SheetBest API
        const data = await fetchVocabularyData();
        vocabularyData = data;
        
        updateLoadingText('Initializing ID system...');
        // Initialize ID counter and ensure all words have IDs
        initializeIdCounter();
        ensureWordIds();
        
        updateLoadingText('Initializing word counters...');
        // Initialize Count fields for existing data
        initializeCountFields();
        
        updateLoadingText('Filtering today\'s vocabulary...');
        // Filter today's vocabulary
        filterTodayVocabulary();
        
        updateLoadingText('Preparing first word...');
        // Load first word
        if (vocabularyData.length > 0) {
            loadCurrentWord();
            updateProgress();
        } else {
            showNoWordsMessage();
        }
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showErrorMessage('Failed to load vocabulary data. Please check your internet connection.');
    } finally {
        hideLoadingModal();
    }
}

// Parse CSV data into JSON format
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const values = parseCSVLine(line);
            if (values.length === headers.length) {
                const item = {};
                headers.forEach((header, index) => {
                    item[header] = values[index];
                });
                // Ensure Count is a number
                item.Count = parseInt(item.Count) || 0;
                data.push(item);
            }
        }
    }
    
    return data;
}

// Parse a single CSV line handling quotes and commas
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Double quote escape
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
}

// Fetch vocabulary data from SheetBest API
async function fetchVocabularyData() {
    try {
        // Check localStorage quickly first
        const savedData = loadVocabularyData();
        if (savedData && savedData.length > 0) {
            console.log('Loaded vocabulary data from localStorage');
            return savedData;
        }

        // Fetch data from SheetBest API with timeout for better user experience
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for API
        
        const response = await fetch(SHEETBEST_API_URL, { 
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API error! status: ${response.status}`);
        }
        
        const data = await response.json();
          // Process the data to ensure proper format
        const processedData = data.map(item => ({
            Id: item.Id || '',
            Vietnamese: item.Vietnamese || '',
            Note: item.Note || '',
            English: item.English || '',
            Image_link: item.Image_link || '',
            Created_date: item.Created_date || '',
            Next_date: item.Next_date || '',
            Status: item.Status || 'Easy',
            Count: parseInt(item.Count) || 0
        }));
        
        // Initialize ID counter and ensure all words have IDs
        initializeIdCounter();
        ensureWordIds();
        
        // Save to localStorage for future use (async to not block UI)
        setTimeout(() => {
            try {
                localStorage.setItem('vocabularyData', JSON.stringify(processedData));
                localStorage.setItem('lastSaveDate', new Date().toISOString());
                console.log('Data saved to localStorage');
            } catch (saveError) {
                console.error('Error saving to localStorage:', saveError);
            }
        }, 0);
        
        return processedData;
    } catch (error) {
        console.error('Error fetching data from SheetBest API:', error);
        
        // Try localStorage as fallback even if it's old
        const fallbackData = localStorage.getItem('vocabularyData');
        if (fallbackData) {
            console.log('Using fallback localStorage data');
            return JSON.parse(fallbackData);
        }
          // Last resort: fallback data for demo purposes
        return [
            {
                Id: "VW001",
                Vietnamese: "Xin chào",
                Note: "Informal greeting",
                English: "Hello",
                IPA: "/həˈloʊ/",
                Image_link: "https://via.placeholder.com/300x200?text=Hello",
                Created_date: "29/05/2025",
                Next_date: "30/05/2025",
                Status: "Easy",
                Count: 0
            },
            {
                Id: "VW002",
                Vietnamese: "Cảm ơn",
                Note: "Expression of gratitude",
                English: "Thank you",
                IPA: "/θæŋk juː/",
                Image_link: "https://via.placeholder.com/300x200?text=Thank+You",
                Created_date: "28/05/2025",
                Next_date: "30/05/2025",
                Status: "Medium",
                Count: 0
            },
            {
                Id: "VW003",
                Vietnamese: "Tạm biệt",
                Note: "Farewell greeting",
                English: "Goodbye",
                IPA: "/ɡʊdˈbaɪ/",
                Image_link: "https://via.placeholder.com/300x200?text=Goodbye",
                Created_date: "27/05/2025",
                Next_date: "30/05/2025",
                Status: "Hard",
                Count: 0
            },
            {
                Id: "VW004",
                Vietnamese: "Xin lỗi",
                Note: "Formal apology",
                English: "Sorry",
                IPA: "/ˈsɔːri/",
                Image_link: "https://via.placeholder.com/300x200?text=Sorry",
                Created_date: "26/05/2025",
                Next_date: "30/05/2025",
                Status: "Easy",
                Count: 0
            },
            {
                Id: "VW005",
                Vietnamese: "Không có gì",
                Note: "You're welcome",
                English: "You're welcome",
                IPA: "/jʊr ˈwɛlkəm/",
                Image_link: "https://via.placeholder.com/300x200?text=Welcome",
                Created_date: "25/05/2025",
                Next_date: "30/05/2025",
                Status: "Medium",
                Count: 0
            }
        ];
    }
}

// Filter vocabulary for today's study
function filterTodayVocabulary() {
    const today = new Date();
    const todayString = formatDateToDD_MM_YYYY(today); // Get today's date in DD/MM/YYYY format
    
    const originalLength = vocabularyData.length;
    vocabularyData = vocabularyData.filter(word => {
        const nextDate = word.Next_date;
        const isToday = nextDate === todayString;
        const hasValidStatus = word.Status && ['Easy', 'Medium', 'Hard'].includes(word.Status);
        
        console.log(`Word: ${word.Vietnamese}, Next_date: ${nextDate}, Today: ${todayString}, IsToday: ${isToday}, Status: ${word.Status}, HasValidStatus: ${hasValidStatus}`);
        
        return isToday && hasValidStatus;
    });
    
    totalWordsToday = vocabularyData.length;
    
    console.log(`Filtered vocabulary: ${originalLength} -> ${totalWordsToday} words for today (${todayString})`);
}

// Helper function to format date to DD/MM/YYYY
function formatDateToDD_MM_YYYY(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Helper function to parse DD/MM/YYYY date string to Date object
function parseDateFromDD_MM_YYYY(dateString) {
    if (!dateString) return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in Date
    const year = parseInt(parts[2], 10);
    
    return new Date(year, month, day);
}

// IPA state management
let isIpaDisplayed = false;
let ipaCache = new Map(); // Cache for IPA transcriptions from web service

// Automatic IPA detection using web service
async function fetchIPAFromWebService(text) {
    // Check cache first
    if (ipaCache.has(text.toLowerCase())) {
        return ipaCache.get(text.toLowerCase());
    }
    
    try {
        // Using a free IPA API service (replace with your preferred service)
        // This is a mock implementation - replace with actual API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0 && data[0].phonetics && data[0].phonetics.length > 0) {
                // Find the first phonetic with text
                const phoneticEntry = data[0].phonetics.find(p => p.text && p.text.trim() !== '');
                if (phoneticEntry && phoneticEntry.text) {
                    const ipaText = phoneticEntry.text;
                    // Cache the result
                    ipaCache.set(text.toLowerCase(), ipaText);
                    return ipaText;
                }
            }
        }
    } catch (error) {
        console.log(`Failed to fetch IPA for "${text}" from web service:`, error);
    }
    
    // Fallback to local generation if web service fails
    const fallbackIPA = generateIPA(text);
    ipaCache.set(text.toLowerCase(), fallbackIPA);
    return fallbackIPA;
}

// Generate word-by-word IPA with automatic web service detection
async function generateWordByWordIPAWithWebService(englishText) {
    // Split the text into words and clean them
    const words = englishText.split(/\s+/).filter(word => word.length > 0);
    
    // Generate IPA for each word using web service
    const wordIpaPairs = await Promise.all(words.map(async (word) => {
        // Clean the word of punctuation for IPA generation
        const cleanWord = word.replace(/[.,!?;:"'()[\]{}]/g, '');
        
        // Get IPA from web service (with fallback to local)
        const ipaText = await fetchIPAFromWebService(cleanWord);
        
        // Remove the surrounding slashes from IPA if present
        const cleanIPA = ipaText.replace(/^\/|\/$/g, '');
        
        // Return formatted word with IPA
        return `${word} <span class="ipa-phonetic">(${cleanIPA})</span>`;
    }));
    
    // Join all word-IPA pairs with spaces
    return wordIpaPairs.join(' ');
}

// Simple IPA transcription generator for common English words
function generateIPA(englishText) {
    // This is a basic implementation. For production, you'd want to use 
    // a more comprehensive IPA dictionary or API service
    const ipaDict = {
        // Common greetings
        'hello': '/həˈloʊ/',
        'hi': '/haɪ/',
        'goodbye': '/ɡʊdˈbaɪ/',
        'bye': '/baɪ/',
        
        // Polite expressions
        'thank you': '/θæŋk juː/',
        'thanks': '/θæŋks/',
        'please': '/pliːz/',
        'sorry': '/ˈsɔːri/',
        'excuse me': '/ɪkˈskjuːz miː/',
        'you\'re welcome': '/jʊr ˈwɛlkəm/',
        'welcome': '/ˈwɛlkəm/',
        
        // Common words
        'yes': '/jɛs/',
        'no': '/noʊ/',
        'good': '/ɡʊd/',
        'bad': '/bæd/',
        'nice': '/naɪs/',
        'great': '/ɡreɪt/',
        'wonderful': '/ˈwʌndərfəl/',
        'beautiful': '/ˈbjuːtɪfəl/',
        'love': '/lʌv/',
        'like': '/laɪk/',
        'want': '/wɑːnt/',
        'need': '/niːd/',
        'have': '/hæv/',
        'know': '/noʊ/',
        'think': '/θɪŋk/',
        'see': '/siː/',
        'hear': '/hɪr/',
        'say': '/seɪ/',
        'tell': '/tɛl/',
        'speak': '/spiːk/',
        'understand': '/ˌʌndərˈstænd/',
        
        // Family
        'family': '/ˈfæməli/',
        'mother': '/ˈmʌðər/',
        'father': '/ˈfɑːðər/',
        'sister': '/ˈsɪstər/',
        'brother': '/ˈbrʌðər/',
        'child': '/ʧaɪld/',
        'friend': '/frɛnd/',
        
        // Time
        'today': '/təˈdeɪ/',
        'tomorrow': '/təˈmɔːroʊ/',
        'yesterday': '/ˈjɛstərdeɪ/',
        'time': '/taɪm/',
        'morning': '/ˈmɔːrnɪŋ/',
        'afternoon': '/ˌæftərˈnuːn/',
        'evening': '/ˈiːvnɪŋ/',
        'night': '/naɪt/',
        
        // Basic actions
        'go': '/ɡoʊ/',
        'come': '/kʌm/',
        'eat': '/iːt/',
        'drink': '/drɪŋk/',
        'sleep': '/sliːp/',
        'work': '/wɜːrk/',
        'study': '/ˈstʌdi/',
        'learn': '/lɜːrn/',
        'teach': '/tiːʧ/',
        'help': '/hɛlp/',
        
        // Questions
        'what': '/wʌt/',
        'where': '/wɛr/',
        'when': '/wɛn/',
        'why': '/waɪ/',
        'how': '/haʊ/',
        'who': '/huː/',
        'which': '/wɪʧ/',
        
        // Numbers
        'one': '/wʌn/',
        'two': '/tuː/',
        'three': '/θriː/',
        'four': '/fɔːr/',
        'five': '/faɪv/',
        'six': '/sɪks/',
        'seven': '/ˈsɛvən/',
        'eight': '/eɪt/',
        'nine': '/naɪn/',
        'ten': '/tɛn/',
        
        // Places
        'home': '/hoʊm/',
        'school': '/skuːl/',
        'work': '/wɜːrk/',
        'hospital': '/ˈhɑːspɪtəl/',
        'restaurant': '/ˈrɛstərɑːnt/',
        'store': '/stɔːr/',
        'library': '/ˈlaɪbrɛri/',
        'park': '/pɑːrk/',
        
        // Food
        'food': '/fuːd/',
        'water': '/ˈwɔːtər/',
        'coffee': '/ˈkɔːfi/',
        'tea': '/tiː/',
        'bread': '/brɛd/',
        'rice': '/raɪs/',
        'meat': '/miːt/',
        'fish': '/fɪʃ/',
        'fruit': '/fruːt/',
        'vegetable': '/ˈvɛdʒtəbəl/',
        
        // Colors
        'red': '/rɛd/',
        'blue': '/bluː/',
        'green': '/ɡriːn/',
        'yellow': '/ˈjɛloʊ/',
        'black': '/blæk/',
        'white': '/waɪt/',
        'brown': '/braʊn/',
        'orange': '/ˈɔːrɪndʒ/',
        'purple': '/ˈpɜːrpəl/',
        'pink': '/pɪŋk/'
    };
    
    // Convert to lowercase for lookup
    const lowerText = englishText.toLowerCase().trim();
    
    // Direct lookup first
    if (ipaDict[lowerText]) {
        return ipaDict[lowerText];
    }
    
    // Try to match partial phrases
    for (const [phrase, ipa] of Object.entries(ipaDict)) {
        if (lowerText.includes(phrase) || phrase.includes(lowerText)) {
            return ipa;
        }
    }
    
    // If no match found, return a basic phonetic approximation
    return generateBasicIPA(lowerText);
}

// Generate basic IPA approximation for unknown words
function generateBasicIPA(word) {
    // This is a very simplified phonetic approximation
    // In a real application, you'd want to use a proper phonetic library
    let ipa = '/';
    
    const vowelMap = {
        'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɔ', 'u': 'ʌ',
        'ay': 'eɪ', 'ai': 'eɪ', 'oy': 'ɔɪ', 'oi': 'ɔɪ',
        'ow': 'aʊ', 'ou': 'aʊ', 'ew': 'uː', 'oo': 'uː',
        'ea': 'iː', 'ee': 'iː', 'ie': 'iː'
    };
    
    const consonantMap = {
        'ch': 'ʧ', 'sh': 'ʃ', 'th': 'θ', 'ph': 'f',
        'gh': 'f', 'ck': 'k', 'ng': 'ŋ'
    };
    
    let i = 0;
    while (i < word.length) {
        let found = false;
        
        // Check for two-letter combinations first
        if (i < word.length - 1) {
            const twoChar = word.substr(i, 2).toLowerCase();
            if (vowelMap[twoChar]) {
                ipa += vowelMap[twoChar];
                i += 2;
                found = true;
            } else if (consonantMap[twoChar]) {
                ipa += consonantMap[twoChar];
                i += 2;
                found = true;
            }
        }
        
        // Single character mapping
        if (!found) {
            const char = word[i].toLowerCase();
            if (vowelMap[char]) {
                ipa += vowelMap[char];
            } else if (consonantMap[char]) {
                ipa += consonantMap[char];
            } else {
                // Keep consonants as they are (mostly)
                switch (char) {
                    case 'c':
                        ipa += (i + 1 < word.length && 'eiy'.includes(word[i + 1])) ? 's' : 'k';
                        break;
                    case 'g':
                        ipa += (i + 1 < word.length && 'eiy'.includes(word[i + 1])) ? 'dʒ' : 'ɡ';
                        break;
                    case 'x':
                        ipa += 'ks';
                        break;
                    case 'y':
                        ipa += (i === 0) ? 'j' : 'ɪ';
                        break;
                    default:
                        if (/[bcdfghjklmnpqrstvwz]/.test(char)) {
                            ipa += char;
                        }
                        break;
                }
            }
            i++;
        }
    }
    
    ipa += '/';
    return ipa;
}

// Generate word-by-word IPA display: "My (maɪ) name (neɪm) is (ɪz) Son (sʌn)"
function generateWordByWordIPA(englishText) {
    // Split the text into words and clean them
    const words = englishText.split(/\s+/).filter(word => word.length > 0);
    
    // Generate IPA for each word and format as "word (ipa)"
    const wordIpaPairs = words.map(word => {
        // Clean the word of punctuation for IPA generation
        const cleanWord = word.replace(/[.,!?;:"'()[\]{}]/g, '');
        
        // Generate IPA for the clean word
        const ipaText = generateIPA(cleanWord);
        
        // Remove the surrounding slashes from IPA if present
        const cleanIPA = ipaText.replace(/^\/|\/$/g, '');
        
        // Return formatted word with IPA
        return `${word} <span class="ipa-phonetic">(${cleanIPA})</span>`;
    });
    
    // Join all word-IPA pairs with spaces
    return wordIpaPairs.join(' ');
}

// Toggle IPA display visibility
function toggleIpaDisplay() {
    isIpaDisplayed = !isIpaDisplayed;
    const ipaTranscription = document.getElementById('ipaTranscription');
    const toggleBtn = document.getElementById('ipaToggleBtn');
    const ipaPhoneticElements = ipaTranscription.querySelectorAll('.ipa-phonetic');
    
    if (isIpaDisplayed) {
        ipaTranscription.style.opacity = '1';
        ipaPhoneticElements.forEach(el => el.style.display = 'inline');
        toggleBtn.innerHTML = '<i class="bi bi-eye-slash"></i>';
        toggleBtn.title = 'Hide IPA';
    } else {
        ipaTranscription.style.opacity = '0.7';
        ipaPhoneticElements.forEach(el => el.style.display = 'none');
        toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
        toggleBtn.title = 'Show IPA';
    }
}

// Load current word data
function loadCurrentWord() {
    if (vocabularyData.length === 0) {
        showNoWordsMessage();
        return;
    }
    
    const currentWord = vocabularyData[currentWordIndex];
      // Update UI elements
    document.getElementById('vietnameseText').textContent = currentWord.Vietnamese;
    document.getElementById('noteText').textContent = currentWord.Note || '';
    document.getElementById('createdDate').textContent = `Created: ${formatDate(currentWord.Created_date)}`;
    
    // Update status display
    updateStatusDisplay(currentWord.Status);
      // Update count display
    const countDisplay = document.getElementById('countDisplay');
    const count = currentWord.Count || 0;
    countDisplay.textContent = count;
    
    // Color code the count based on difficulty
    countDisplay.className = 'badge';
    if (count > 5) {
        countDisplay.classList.add('bg-danger');
    } else if (count > 2) {
        countDisplay.classList.add('bg-warning');
    } else {
        countDisplay.classList.add('bg-secondary');
    }    // Update IPA transcription display (hidden initially)
    const ipaSection = document.getElementById('ipaSection');
    const ipaTranscription = document.getElementById('ipaTranscription');
    
    // Hide IPA section initially - will be shown after user input validation
    ipaSection.style.display = 'none';
    ipaTranscription.innerHTML = '';
    
    // Reset IPA display state
    isIpaDisplayed = false;
    
    // Reset image display state
    isImageDisplayed = false;
    updateImageButton();
    document.getElementById('imageContainer').style.display = 'none';
    
    // Clear previous answer and feedback
    document.getElementById('userAnswer').value = '';
    document.getElementById('answerFeedback').innerHTML = '';
    document.getElementById('userAnswer').className = 'form-control form-control-lg';
    
    // Hide review section
    document.getElementById('reviewSection').style.display = 'none';
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Focus on input field
    document.getElementById('userAnswer').focus();
}

// Toggle image display for current word
function toggleImageDisplay() {
    const currentWord = vocabularyData[currentWordIndex];
    if (!currentWord || !currentWord.Image_link) {
        return;
    }
    
    isImageDisplayed = !isImageDisplayed;
    
    if (isImageDisplayed) {
        loadWordImage(currentWord.Image_link);
    } else {
        document.getElementById('imageContainer').style.display = 'none';
    }
    
    updateImageButton();
}

// Update image button text and icon
function updateImageButton() {
    const button = document.getElementById('imageDisplayBtn');
    const icon = document.getElementById('imageToggleIcon');
    
    if (isImageDisplayed) {
        button.innerHTML = '<i class="bi bi-eye-slash" id="imageToggleIcon"></i> Hide Image';
        icon.className = 'bi bi-eye-slash';
    } else {
        button.innerHTML = '<i class="bi bi-image" id="imageToggleIcon"></i> Show Image';
        icon.className = 'bi bi-image';
    }
}

// Load word image
function loadWordImage(imageUrl) {
    const imageContainer = document.getElementById('imageContainer');
    const wordImage = document.getElementById('wordImage');
    
    if (imageUrl) {
        wordImage.src = imageUrl;
        wordImage.onerror = () => {
            imageContainer.style.display = 'none';
            console.log('Failed to load image:', imageUrl);
        };
        wordImage.onload = () => {
            imageContainer.style.display = 'block';
        };
    } else {
        imageContainer.style.display = 'none';
    }
}

// Update status display with color-coded difficulty level
function updateStatusDisplay(status) {
    const statusDisplay = document.getElementById('statusDisplay');
    const validStatuses = ['Easy', 'Medium', 'Hard'];
    
    // Ensure status is valid
    const currentStatus = validStatuses.includes(status) ? status : 'Easy';
    
    // Update status text
    statusDisplay.textContent = currentStatus;
    
    // Remove existing status classes
    statusDisplay.classList.remove('status-easy', 'status-medium', 'status-hard');
    
    // Add appropriate status class
    switch (currentStatus) {
        case 'Easy':
            statusDisplay.classList.add('status-easy');
            break;
        case 'Medium':
            statusDisplay.classList.add('status-medium');
            break;
        case 'Hard':
            statusDisplay.classList.add('status-hard');
            break;
    }
    
    // Hide status selector
    document.getElementById('statusSelector').style.display = 'none';
}

// Toggle status selector visibility
function toggleStatusSelector() {
    const statusSelector = document.getElementById('statusSelector');
    const isVisible = statusSelector.style.display === 'flex';
    
    if (isVisible) {
        statusSelector.style.display = 'none';
    } else {
        statusSelector.style.display = 'flex';
    }
}

// Update the status of the current word
function updateStatus(newStatus) {
    if (vocabularyData.length === 0) return;
    
    const currentWord = vocabularyData[currentWordIndex];
    const validStatuses = ['Easy', 'Medium', 'Hard'];
    
    if (validStatuses.includes(newStatus)) {
        // Update the status in the data
        currentWord.Status = newStatus;
        
        // Update the display
        updateStatusDisplay(newStatus);
          // Save the updated vocabulary data to localStorage
        saveVocabularyData();
        
        // Sync to API using Id-based matching
        syncToSheetBestAPI(currentWord);
        
        console.log(`Status updated to: ${newStatus} for word Id: ${currentWord.Id}, Vietnamese: ${currentWord.Vietnamese}`);
    }
}

// Check user's answer with sophisticated character-by-character comparison
async function checkAnswer() {
    // Prevent multiple simultaneous answer checks
    if (isCheckingAnswer) {
        return;
    }
    isCheckingAnswer = true;

    try {
        const userAnswer = document.getElementById('userAnswer').value.trim();
        const currentWord = vocabularyData[currentWordIndex];
        const correctAnswer = currentWord.English.toLowerCase();
        const userAnswerLower = userAnswer.toLowerCase();
        
        const feedbackElement = document.getElementById('answerFeedback');
        const inputElement = document.getElementById('userAnswer');
        const ipaSection = document.getElementById('ipaSection');
        const ipaTranscription = document.getElementById('ipaTranscription');
    
    // Initialize Count field if it doesn't exist
    if (typeof currentWord.Count === 'undefined') {
        currentWord.Count = 0;
    }
    
    // Calculate similarity and generate color-coded feedback
    const similarity = calculateSimilarity(userAnswerLower, correctAnswer);
    const colorCodedComparison = generateColorCodedComparison(userAnswerLower, correctAnswer);
    
    // Determine if answer is correct (exact match or very high similarity)
    const isCorrect = userAnswerLower === correctAnswer || similarity >= 0.9;
      // Generate and display IPA after user input validation
    try {
        // Show loading indicator for IPA
        ipaTranscription.innerHTML = '<i class="bi bi-hourglass-split"></i> Fetching pronunciation...';
        ipaSection.style.display = 'block';
        
        const formattedIPA = await generateWordByWordIPAWithWebService(currentWord.English);
        ipaTranscription.innerHTML = formattedIPA;
        isIpaDisplayed = true;
        ipaTranscription.style.opacity = '1';
        document.getElementById('ipaToggleBtn').innerHTML = '<i class="bi bi-eye-slash"></i>';
        document.getElementById('ipaToggleBtn').title = 'Hide IPA';
    } catch (error) {
        console.error('Error generating IPA:', error);
        // Fallback to simple IPA generation
        const fallbackIPA = generateWordByWordIPA(currentWord.English);
        ipaTranscription.innerHTML = fallbackIPA;
        ipaSection.style.display = 'block';
    }
    
    if (isCorrect) {
        // Correct answer
        feedbackElement.innerHTML = `
            <div class="answer-correct">
                <i class="bi bi-check-circle"></i> Correct! The answer is: <strong>${currentWord.English}</strong>
            </div>
        `;
        inputElement.classList.add('input-correct');
        inputElement.classList.remove('input-incorrect');
        
        // Mark as completed if not already
        if (!currentWord.completed) {
            currentWord.completed = true;
            completedWordsToday++;
            updateProgress();
        }
        
        // Show review scheduling options
        document.getElementById('reviewSection').style.display = 'block';
        
        // Auto-play pronunciation
        speakEnglish();
        
        // Suggest status adjustment based on performance
        suggestStatusChange(true, similarity);
          // Save progress to localStorage and sync to SheetBest API
        saveVocabularyData();
        syncToSheetBestAPI(currentWord);
        
    } else {
        // Incorrect answer - increment count and require retry
        currentWord.Count = (currentWord.Count || 0) + 1;
        
        // Hide the correct answer and show retry message
        let feedbackHtml = `
            <div class="answer-incorrect">
                <i class="bi bi-x-circle"></i> Incorrect answer. Please try again.
                <br><small>Your answer: "${userAnswer}"</small>
                <br><div class="mt-2 alert alert-warning">
                    <i class="bi bi-arrow-repeat"></i> <strong>Learning Count:</strong> ${currentWord.Count}
                    <br><em>Keep trying! You can do it!</em>
                </div>
        `;
        
        // Add color-coded comparison if answers are similar
        if (similarity > 0.2) {
            feedbackHtml += `
                <br><div class="mt-2">
                    <strong>Hint - Character comparison:</strong><br>
                    <div class="comparison-text">${colorCodedComparison}</div>
                </div>
            `;
        }
        
        feedbackHtml += '</div>';
        feedbackElement.innerHTML = feedbackHtml;
        
        inputElement.classList.add('input-incorrect');
        inputElement.classList.remove('input-correct');
        
        // Clear the input for retry
        inputElement.value = '';
        inputElement.focus();
        
        // Hide review section until correct answer
        document.getElementById('reviewSection').style.display = 'none';
          // Auto-play pronunciation to help user
        speakEnglish();        // Save the updated count
        saveVocabularyData();
        syncToSheetBestAPI(currentWord);
        
        // Suggest status adjustment based on performance
        suggestStatusChange(false, similarity);
    }
    } finally {
        // Reset the checking flag
        isCheckingAnswer = false;
    }
}

// Initialize missing Count fields in vocabulary data
function initializeCountFields() {
    vocabularyData.forEach(word => {
        if (typeof word.Count === 'undefined') {
            word.Count = 0;
        }
    });
}

// Calculate similarity between two strings using Levenshtein distance
function calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
}

// Generate color-coded character comparison
function generateColorCodedComparison(userAnswer, correctAnswer) {
    const similarity = calculateSimilarity(userAnswer, correctAnswer);
    
    // If strings are very different, show them in red
    if (similarity < 0.3) {
        return `<span style="color: #dc3545; font-weight: bold;">${userAnswer}</span> ≠ <span style="color: #dc3545; font-weight: bold;">${correctAnswer}</span>`;
    }
    
    // For exact match
    if (userAnswer === correctAnswer) {
        return `<span style="color: #0d47a1; font-weight: bold;">${correctAnswer}</span>`;
    }
    
    // Character-by-character comparison with alignment
    const result = alignAndCompare(userAnswer, correctAnswer);
    return result;
}

// Align strings and create character-by-character comparison
function alignAndCompare(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    let result = '';
    let userResult = '';
    let correctResult = '';
    
    // Simple character-by-character comparison
    for (let i = 0; i < maxLen; i++) {
        const char1 = i < len1 ? str1[i] : '';
        const char2 = i < len2 ? str2[i] : '';
        
        if (char1 === char2 && char1 !== '') {
            // Exact match - light green
            userResult += `<span style="background-color: #d4edda; color: #155724; padding: 1px 2px; border-radius: 2px;">${char1}</span>`;
            correctResult += `<span style="background-color: #d4edda; color: #155724; padding: 1px 2px; border-radius: 2px;">${char2}</span>`;
        } else {
            // No match - light red for user, light blue for correct
            if (char1 !== '') {
                userResult += `<span style="background-color: #f8d7da; color: #721c24; padding: 1px 2px; border-radius: 2px;">${char1}</span>`;
            }
            if (char2 !== '') {
                correctResult += `<span style="background-color: #cce5ff; color: #0056b3; padding: 1px 2px; border-radius: 2px;">${char2}</span>`;
            }
        }
    }
    
    return `
        <div class="mb-1">Your answer: ${userResult}</div>
        <div>Correct answer: ${correctResult}</div>
    `;
}

// Text-to-speech functionality
function speakEnglish() {
    const currentWord = vocabularyData[currentWordIndex];
    if (!currentWord) return;
    
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentWord.English);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        
        speechSynthesis.speak(utterance);
        
        // Visual feedback
        const speakBtn = document.getElementById('speakBtn');
        speakBtn.classList.add('bounce');
        setTimeout(() => {
            speakBtn.classList.remove('bounce');
        }, 500);
    } else {
        console.warn('Speech synthesis not supported in this browser');
    }
}

// Schedule next review
async function scheduleReview(days) {
    const currentWord = vocabularyData[currentWordIndex];
    
    // Parse the existing Next_date and add the specified days
    const existingDate = parseDateFromDD_MM_YYYY(currentWord.Next_date);
    const nextDate = existingDate ? new Date(existingDate) : new Date();
    nextDate.setDate(nextDate.getDate() + days);
    const nextDateString = formatDateToDD_MM_YYYY(nextDate);
    
    // Update next review date
    currentWord.Next_date = nextDateString;
      // Save to localStorage and sync with SheetBest API
    saveVocabularyData();
    syncToSheetBestAPI(currentWord);
    
    console.log(`Scheduled "${currentWord.Vietnamese}" for review on ${nextDateString}`);
    
    // Show confirmation
    const reviewSection = document.getElementById('reviewSection');
    reviewSection.innerHTML = `
        <div class="card bg-success text-white">
            <div class="card-body">
                <i class="bi bi-check-circle"></i> Scheduled for review in ${days} day${days > 1 ? 's' : ''}!
                <br><small>Next review: ${formatDate(nextDateString)}</small>
            </div>
        </div>
    `;
    
    // Auto advance to next word after 2 seconds
    setTimeout(() => {
        nextWord();
    }, 2000);
}

// Custom review scheduling function
function scheduleCustomReview() {
    const customDaysInput = document.getElementById('customDays');
    const days = parseInt(customDaysInput.value);
    
    if (isNaN(days) || days < 1 || days > 365) {
        // Show Bootstrap alert instead of basic alert
        const alertHtml = `
            <div class="alert alert-warning alert-dismissible fade show mt-2" role="alert">
                <i class="bi bi-exclamation-triangle"></i> Please enter a valid number of days (1-365)
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Insert alert after the custom input
        const inputGroup = customDaysInput.closest('.input-group');
        inputGroup.insertAdjacentHTML('afterend', alertHtml);
        
        // Remove alert after 3 seconds
        setTimeout(() => {
            const alert = inputGroup.nextElementSibling;
            if (alert && alert.classList.contains('alert')) {
                alert.remove();
            }
        }, 3000);
        
        customDaysInput.focus();
        customDaysInput.select();
        return;
    }
    
    scheduleReview(days);
    customDaysInput.value = ''; // Clear the input
}

// Handle Enter key press for custom days input
function handleCustomDaysKeyPress(event) {
    if (event.key === 'Enter') {
        scheduleCustomReview();
    }
}

// Navigate to next word
async function nextWord() {
    if (currentWordIndex < vocabularyData.length - 1) {
        currentWordIndex++;
        loadCurrentWord();
    } else {
        await showCompletionMessage();
    }
}

// Navigate to previous word
function previousWord() {
    if (currentWordIndex > 0) {
        currentWordIndex--;
        loadCurrentWord();
    }
}

// Update progress display
function updateProgress() {
    const progressCounter = document.getElementById('progressCounter');
    const progressBar = document.getElementById('progressBar');
    
    // Use vocabularyData.length as the total since it's already filtered
    const total = vocabularyData.length;
    progressCounter.textContent = `${completedWordsToday}/${total}`;
    
    const progressPercentage = total > 0 ? (completedWordsToday / total) * 100 : 0;
    progressBar.style.width = `${progressPercentage}%`;
    
    console.log(`Progress updated: ${completedWordsToday}/${total} (${progressPercentage.toFixed(1)}%)`);
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentWordIndex === 0;
    nextBtn.disabled = currentWordIndex === vocabularyData.length - 1;
}

// Handle Enter key press
async function handleKeyPress(event) {
    if (event.key === 'Enter') {
        await checkAnswer();
    }
}

// Wrapper function for button click
async function handleCheckAnswer() {
    await checkAnswer();
}

// Wrapper function for next word button
async function handleNextWord() {
    await nextWord();
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        currentTheme = 'light';
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        currentTheme = 'dark';
    }
    
    // Save theme preference
    localStorage.setItem('vocabularyAppTheme', currentTheme);
}

// Load theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('vocabularyAppTheme') || 'light';
    currentTheme = savedTheme;
    
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${currentTheme}-theme`);
}

// Update loading modal text
function updateLoadingText(text, subtext = '') {
    const loadingText = document.getElementById('loadingText');
    const loadingSubtext = document.getElementById('loadingSubtext');
    
    if (loadingText) {
        loadingText.textContent = text;
    }
    if (loadingSubtext) {
        loadingSubtext.textContent = subtext || 'Please wait while we prepare your learning session.';
    }
}

// Show loading modal
function showLoadingModal() {
    const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
    modal.show();
}

// Hide loading modal
function hideLoadingModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
    if (modal) {
        modal.hide();
    }
}

// Show no words message
function showNoWordsMessage() {
    document.getElementById('vietnameseText').textContent = 'No words scheduled for today!';
    document.getElementById('noteText').textContent = 'Great job! You\'ve completed all your vocabulary for today.';
    document.getElementById('createdDate').textContent = '';
    document.getElementById('imageContainer').style.display = 'none';
    document.getElementById('ipaSection').style.display = 'none';
    document.getElementById('userAnswer').style.display = 'none';
    document.querySelector('.input-group button').style.display = 'none';
    document.getElementById('speakBtn').style.display = 'none';
}

// Show completion message with detailed table
async function showCompletionMessage() {
    // Build the completion table
    const tableBody = document.getElementById('completionTableBody');
    tableBody.innerHTML = '';
    
    // Process words sequentially to avoid overwhelming the API
    for (const word of vocabularyData) {
        const row = tableBody.insertRow();
        
        // English Sentence column
        const englishCell = row.insertCell(0);
        englishCell.textContent = word.English;
        
        // IPA Transcription column
        const ipaCell = row.insertCell(1);
        
        try {
            // Try to get IPA from web service, fallback to local generation
            const ipaText = word.IPA || await fetchIPAFromWebService(word.English);
            ipaCell.textContent = ipaText;
        } catch (error) {
            // Fallback to local generation
            const fallbackIPA = generateIPA(word.English);
            ipaCell.textContent = fallbackIPA;
        }
        
        ipaCell.className = 'ipa-transcription-cell';
        ipaCell.style.fontFamily = '"Lucida Sans Unicode", "Arial Unicode MS", "Doulos SIL", "Charis SIL", sans-serif';
        ipaCell.style.fontSize = '0.9em';
        ipaCell.style.color = '#007bff';
        
        // Vietnamese Translation column
        const vietnameseCell = row.insertCell(2);
        vietnameseCell.textContent = word.Vietnamese;
          // Learning Count column
        const countCell = row.insertCell(3);
        countCell.textContent = word.Count || 0;
        countCell.className = 'text-center';
        
        // Color code the count based on difficulty
        if (word.Count > 5) {
            countCell.classList.add('text-danger', 'fw-bold');
        } else if (word.Count > 2) {
            countCell.classList.add('text-warning', 'fw-bold');
        } else {
            countCell.classList.add('text-success');
        }
    }
    
    // Show the completion modal
    const completionModal = new bootstrap.Modal(document.getElementById('completionModal'));
    completionModal.show();
      // Also update the main UI to show completion
    const total = vocabularyData.length;
    document.getElementById('vietnameseText').textContent = 'All Words Completed!';
    document.getElementById('noteText').textContent = 'Check the summary table for your learning progress.';
    document.getElementById('createdDate').textContent = `Completed: ${completedWordsToday}/${total} words`;
    document.getElementById('imageContainer').style.display = 'none';
    document.getElementById('ipaSection').style.display = 'none';
    document.getElementById('answerFeedback').innerHTML = `
        <div class="answer-correct">
            <i class="bi bi-trophy"></i> Excellent work! Check the completion table for details.
            <br><button class="btn btn-success mt-2" onclick="showCompletionTable()">
                <i class="bi bi-table"></i> View Summary Table
            </button>
        </div>
    `;
    document.getElementById('userAnswer').style.display = 'none';
    document.querySelector('.input-group button').style.display = 'none';
    document.getElementById('speakBtn').style.display = 'none';
    document.getElementById('reviewSection').style.display = 'none';
}

// Function to show completion table again
function showCompletionTable() {
    const completionModal = new bootstrap.Modal(document.getElementById('completionModal'));
    completionModal.show();
}

// Show error message
function showErrorMessage(message) {
    document.getElementById('vietnameseText').textContent = 'Error Loading Data';
    document.getElementById('noteText').textContent = message;
    document.getElementById('createdDate').textContent = '';
}

// Format date for display
function formatDate(dateString) {
    // Handle DD/MM/YYYY format
    const date = parseDateFromDD_MM_YYYY(dateString);
    if (!date) {
        return dateString; // Return original string if parsing fails
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Suggest status change based on answer performance
function suggestStatusChange(isCorrect, similarity) {
    const currentWord = vocabularyData[currentWordIndex];
    const currentStatus = currentWord.Status;
    let suggestedStatus = null;
    
    // Track answer history for the word (you could store this in localStorage or the API)
    if (!currentWord.answerHistory) {
        currentWord.answerHistory = [];
    }
    
    // Add current attempt to history
    currentWord.answerHistory.push({
        correct: isCorrect,
        similarity: similarity,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 5 attempts
    if (currentWord.answerHistory.length > 5) {
        currentWord.answerHistory = currentWord.answerHistory.slice(-5);
    }
    
    // Calculate recent performance
    const recentAttempts = currentWord.answerHistory.slice(-3); // Last 3 attempts
    const correctCount = recentAttempts.filter(attempt => attempt.correct).length;
    const averageSimilarity = recentAttempts.reduce((sum, attempt) => sum + attempt.similarity, 0) / recentAttempts.length;
    
    // Suggest status based on performance
    if (recentAttempts.length >= 2) {
        if (correctCount === recentAttempts.length && averageSimilarity > 0.95) {
            // All recent answers correct with high accuracy
            if (currentStatus === 'Hard') {
                suggestedStatus = 'Medium';
            } else if (currentStatus === 'Medium') {
                suggestedStatus = 'Easy';
            }
        } else if (correctCount === 0 && averageSimilarity < 0.5) {
            // All recent answers incorrect with low similarity
            if (currentStatus === 'Easy') {
                suggestedStatus = 'Medium';
            } else if (currentStatus === 'Medium') {
                suggestedStatus = 'Hard';
            }
        }
    }
    
    // Show suggestion if there is one
    if (suggestedStatus && suggestedStatus !== currentStatus) {
        showStatusSuggestion(suggestedStatus, currentStatus);
    }
}

// Show status change suggestion
function showStatusSuggestion(suggestedStatus, currentStatus) {
    const feedbackElement = document.getElementById('answerFeedback');
    const suggestionHtml = `
        <div class="mt-3 p-2 border rounded bg-light">
            <small class="text-muted">
                <i class="bi bi-lightbulb"></i> <strong>Suggestion:</strong> 
                Based on your recent performance, consider changing difficulty from 
                <strong>${currentStatus}</strong> to <strong>${suggestedStatus}</strong>
                <button class="btn btn-sm btn-outline-primary ms-2" onclick="updateStatus('${suggestedStatus}')">
                    Apply Suggestion
                </button>
            </small>
        </div>
    `;
    
    // Append suggestion to existing feedback
    feedbackElement.innerHTML += suggestionHtml;
}

async function syncToSheetBestAPI(wordData) {
    try {
        if (!wordData.Id) {
            console.error('Cannot sync word without an Id');
            return;
        }

        // Handle bulk update case (for deletions or full sync)
        if (wordData.Id === 'BULK_UPDATE') {
            console.log('Performing bulk update to API');
            
            // Save to localStorage for immediate backup
            saveVocabularyData();
            
            // Sync entire vocabularyData to SheetBest API
            try {
                // First delete all existing data
                const deleteResponse = await fetch(SHEETBEST_API_URL, {
                    method: 'DELETE'
                });
                
                // Then post the updated complete dataset
                const response = await fetch(SHEETBEST_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(vocabularyData)
                });
                
                if (!response.ok) {
                    throw new Error(`API bulk sync failed! status: ${response.status}`);
                }
                
                console.log('Bulk data synced to SheetBest API successfully');
                
            } catch (apiError) {
                console.error('Error in bulk sync to SheetBest API:', apiError);
                throw apiError; // Re-throw for caller to handle
            }
            
            return; // Exit early for bulk updates
        }

        // Find the word in vocabularyData by Id
        const wordIndex = vocabularyData.findIndex(word => 
            word.Id === wordData.Id
        );
        console.log('Looking for word with Id:', wordData.Id);
        console.log('Found at index:', wordIndex);

        if (wordIndex === -1) {
            // Word not found - add as new entry
            console.log('Word not found in vocabulary data for sync - Id:', wordData.Id);
            
            // Only add if it has required fields
            if (wordData.Vietnamese && wordData.English) {
                vocabularyData.push({...wordData});
                console.log('Added new word with Id:', wordData.Id);
            } else {
                console.error('Cannot add incomplete word data');
                return;
            }
        } else {
            // Update the existing word in vocabulary data by Id
            console.log('Updating existing word with Id:', wordData.Id);
            
            // Merge existing data with new data, preserving all fields
            vocabularyData[wordIndex] = {
                ...vocabularyData[wordIndex], // Keep existing data
                ...wordData,                  // Override with new data
                Id: wordData.Id              // Ensure Id is preserved
            };
            console.log('Updated existing word with Id:', wordData.Id);
        }
        
        // Save to localStorage for immediate backup
        saveVocabularyData();
        
        // Sync to SheetBest API - Clear and replace entire dataset to ensure consistency
        try {
            // First delete all existing data
            const deleteResponse = await fetch(SHEETBEST_API_URL, {
                method: 'DELETE'
            });
            
            // Then post the updated complete dataset
            const response = await fetch(SHEETBEST_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(vocabularyData)
            });
            
            if (!response.ok) {
                throw new Error(`API sync failed! status: ${response.status}`);
            }
            
            console.log('Data synced to SheetBest API successfully');
            
        } catch (apiError) {
            console.error('Error syncing to SheetBest API:', apiError);
            // Data is still saved in localStorage even if API sync fails
        }
        
    } catch (error) {
        console.error('Error in syncToSheetBestAPI:', error);
        // Even if there's an error, try to save to localStorage
        saveVocabularyData();
    }
}

// Save vocabulary data to localStorage
function saveVocabularyData() {
    try {
        localStorage.setItem('vocabularyData', JSON.stringify(vocabularyData));
        localStorage.setItem('lastSaveDate', new Date().toISOString());
    } catch (error) {
        console.error('Error saving vocabulary data:', error);
    }
}

// Load vocabulary data from localStorage
function loadVocabularyData() {
    try {
        const savedData = localStorage.getItem('vocabularyData');
        const lastSaveDate = localStorage.getItem('lastSaveDate');
        
        if (savedData && lastSaveDate) {
            const parsedData = JSON.parse(savedData);
            const saveDate = new Date(lastSaveDate);
            const daysSinceLastSave = (new Date() - saveDate) / (1000 * 60 * 60 * 24);
            
            // Use saved data if it's from today or yesterday
            if (daysSinceLastSave < 2) {
                return parsedData;
            }
        }
    } catch (error) {
        console.error('Error loading vocabulary data:', error);
    }
    return null;
}

// =================== CSV MANAGEMENT FUNCTIONS ===================

// Global variables for CSV management
let csvManagerData = [];
let pendingFileData = null;

// Open CSV Manager Modal
function openCSVManager() {
    // Clone current vocabulary data for editing
    csvManagerData = JSON.parse(JSON.stringify(vocabularyData));
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('csvManagerModal'));
    modal.show();
    
    // Populate table
    populateCSVTable();
}

// Populate the CSV management table
function populateCSVTable() {
    const tableBody = document.getElementById('csvTableBody');
    const wordCount = document.getElementById('csvWordCount');
    
    tableBody.innerHTML = '';
      csvManagerData.forEach((word, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><span class="badge bg-info">${escapeHtml(word.Id || 'N/A')}</span></td>
            <td class="text-break" style="max-width: 180px;">${escapeHtml(word.Vietnamese)}</td>
            <td class="text-break" style="max-width: 130px;">${escapeHtml(word.Note || '')}</td>
            <td class="text-break" style="max-width: 180px;">${escapeHtml(word.English)}</td>
            <td>${formatDate(word.Created_date)}</td>
            <td>${formatDate(word.Next_date)}</td>
            <td><span class="badge bg-${getStatusColor(word.Status)}">${word.Status}</span></td>
            <td><span class="badge bg-secondary">${word.Count || 0}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm" onclick="editWord(${index})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteWord(${index})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    wordCount.textContent = csvManagerData.length;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to get status badge color
function getStatusColor(status) {
    switch (status) {
        case 'Easy': return 'success';
        case 'Medium': return 'warning';
        case 'Hard': return 'danger';
        default: return 'secondary';
    }
}

// Filter CSV table based on search input
function filterCSVTable() {
    const searchTerm = document.getElementById('csvSearchInput').value.toLowerCase();
    const tableBody = document.getElementById('csvTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();
        
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// Add new word
function addNewWord() {
    // Reset form
    document.getElementById('wordEditorForm').reset();
    document.getElementById('editWordIndex').value = '';
    document.getElementById('wordEditorTitle').innerHTML = '<i class="bi bi-plus-circle"></i> Add New Word';
    
    // Set default values
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('editCreatedDate').value = today;
    document.getElementById('editNextDate').value = today;
    document.getElementById('editStatus').value = 'Easy';
    document.getElementById('editCount').value = '0';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('wordEditorModal'));
    modal.show();
}

// Edit existing word
function editWord(index) {
    const word = csvManagerData[index];
    
    // Populate form
    document.getElementById('editWordIndex').value = index;
    document.getElementById('editWordId').value = word.Id || '';
    document.getElementById('editVietnamese').value = word.Vietnamese || '';
    document.getElementById('editEnglish').value = word.English || '';
    document.getElementById('editNote').value = word.Note || '';
    document.getElementById('editImageLink').value = word.Image_link || '';
    document.getElementById('editStatus').value = word.Status || 'Easy';
    document.getElementById('editCount').value = word.Count || 0;
    
    // Convert dates from DD/MM/YYYY to YYYY-MM-DD for input fields
    document.getElementById('editCreatedDate').value = convertDateForInput(word.Created_date);
    document.getElementById('editNextDate').value = convertDateForInput(word.Next_date);
    
    // Update modal title
    document.getElementById('wordEditorTitle').innerHTML = '<i class="bi bi-pencil-square"></i> Edit Word';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('wordEditorModal'));
    modal.show();
}

// Convert date from DD/MM/YYYY to YYYY-MM-DD format
function convertDateForInput(dateString) {
    if (!dateString) return '';
    
    const parts = dateString.split('/');
    if (parts.length === 3) {
        // Assuming DD/MM/YYYY format
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateString;
}

// Convert date from YYYY-MM-DD to DD/MM/YYYY format
function convertDateForCSV(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// Save word edit
async function saveWordEdit() {
    const form = document.getElementById('wordEditorForm');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const wordData = {
        Id: document.getElementById('editWordId').value.trim(),
        Vietnamese: document.getElementById('editVietnamese').value.trim(),
        Note: document.getElementById('editNote').value.trim(),
        English: document.getElementById('editEnglish').value.trim(),
        Image_link: document.getElementById('editImageLink').value.trim(),
        Created_date: convertDateForCSV(document.getElementById('editCreatedDate').value),
        Next_date: convertDateForCSV(document.getElementById('editNextDate').value),
        Status: document.getElementById('editStatus').value,
        Count: parseInt(document.getElementById('editCount').value) || 0
    };
    
    const index = document.getElementById('editWordIndex').value;
    const existingIdIndex = wordData.Id ? 
        csvManagerData.findIndex(word => word.Id === wordData.Id) : -1;
    
    if (index === '') {
        // Adding new word
        if (wordData.Id && existingIdIndex !== -1) {
            // ID already exists, show confirmation dialog
            if (confirm(`A word with ID "${wordData.Id}" already exists. Do you want to update it instead of creating a new entry?`)) {
                // Update existing word
                csvManagerData[existingIdIndex] = {...csvManagerData[existingIdIndex], ...wordData};
                showAlert(`Updated existing word with ID: ${wordData.Id}`, 'info');
            } else {
                // Generate new ID to avoid duplication
                wordData.Id = generateUniqueId();
                csvManagerData.push(wordData);
                showAlert(`Created new word with generated ID: ${wordData.Id}`, 'success');
            }
        } else {
            // New word with new ID or no ID
            if (!wordData.Id) {
                wordData.Id = generateUniqueId();
            }
            csvManagerData.push(wordData);
        }
    } else {
        // Editing existing word
        const indexToUpdate = parseInt(index);
        
        // Check if ID changed and if new ID already exists elsewhere
        if (wordData.Id && 
            existingIdIndex !== -1 && 
            existingIdIndex !== indexToUpdate) {
            
            if (confirm(`Another word already uses ID "${wordData.Id}". Updating will merge these entries. Continue?`)) {
                // Remove the current word entry
                csvManagerData.splice(indexToUpdate, 1);
                // Update the one with the matching ID
                csvManagerData[existingIdIndex] = {...csvManagerData[existingIdIndex], ...wordData};
                showAlert(`Words merged under ID: ${wordData.Id}`, 'warning');
            } else {
                // Keep the old ID
                wordData.Id = csvManagerData[indexToUpdate].Id;
                csvManagerData[indexToUpdate] = wordData;
            }
        } else {
            // Normal update (ID doesn't exist elsewhere or hasn't changed)
            if (!wordData.Id) {
                // Ensure word has an ID
                wordData.Id = csvManagerData[indexToUpdate].Id || generateUniqueId();
            }
            csvManagerData[indexToUpdate] = wordData;
        }
    }
      // Refresh table
    populateCSVTable();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('wordEditorModal'));
    modal.hide();
    
    // Automatically sync changes to vocabularyData and API
    try {
        // Update main vocabulary data with the changes
        vocabularyData = JSON.parse(JSON.stringify(csvManagerData));
        
        // Save to localStorage immediately
        saveVocabularyData();
        
        // Find the specific word that was changed and sync it to API
        const changedWord = wordData.Id ? 
            vocabularyData.find(word => word.Id === wordData.Id) : 
            vocabularyData[vocabularyData.length - 1]; // For new words, get the last added
        
        if (changedWord) {
            // Sync the specific word to API using existing function
            await syncToSheetBestAPI(changedWord);
            console.log('Word synced to API:', changedWord.Id);
        }
        
        // Show success message
        showAlert('Word saved and synced successfully!', 'success');
        
    } catch (error) {
        console.error('Error syncing word to API:', error);
        showAlert('Word saved locally but sync to API failed. Use "Save to API" to retry.', 'warning');
    }
}

// Wrapper function to handle save word edit with loading state
async function handleSaveWordEdit() {
    const saveButton = document.querySelector('button[onclick="handleSaveWordEdit()"]');
    if (!saveButton) return;
    
    const originalText = saveButton.innerHTML;
    
    try {
        // Show loading state
        saveButton.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Saving...';
        saveButton.disabled = true;
        
        // Call the actual save function
        await saveWordEdit();
        
    } catch (error) {
        console.error('Error saving word edit:', error);
        showAlert('Error saving word. Please try again.', 'error');
    } finally {
        // Restore button state
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
    }
}

// Wrapper function to handle delete word with loading state
async function handleDeleteWord(index) {
    try {
        // Call the actual delete function
        await deleteWord(index);
        
    } catch (error) {
        console.error('Error deleting word:', error);
        showAlert('Error deleting word. Please try again.', 'error');
    }
}

// Download CSV file
function downloadCSV() {
    const dataToExport = csvManagerData.length > 0 ? csvManagerData : vocabularyData;
    
    if (dataToExport.length === 0) {
        showAlert('No data to export!', 'error');
        return;
    }
      // Create CSV content
    const headers = ['Id', 'Vietnamese', 'Note', 'English', 'Image_link', 'Created_date', 'Next_date', 'Status', 'Count'];
    let csvContent = headers.join(',') + '\n';
    
    dataToExport.forEach(word => {
        const row = headers.map(header => {
            let value = word[header] || '';
            // Escape quotes and wrap in quotes if necessary
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csvContent += row.join(',') + '\n';
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `English_DB_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('CSV file downloaded successfully!', 'success');
}

// Upload CSV file
function uploadCSV() {
    const modal = new bootstrap.Modal(document.getElementById('fileUploadModal'));
    modal.show();
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
   
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showAlert('Please select a valid CSV file!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            const parsedData = parseCSV(csvText);
            
            if (parsedData.length === 0) {
                showAlert('The CSV file appears to be empty or invalid!', 'error');
                return;
            }
              // Check if we need to initialize IDs in the imported data
            let needsIds = false;
            parsedData.forEach(item => {
                if (!item.Id) {
                    needsIds = true;
                }
            });
            
            // Show message if IDs are missing
            if (needsIds) {
                showAlert('CSV data is missing ID fields. IDs will be automatically generated during upload.', 'info');
            }
            
            // Store parsed data for later use
            pendingFileData = parsedData;
            
            // Show preview
            showFilePreview(parsedData);
            
            // Enable upload button
            document.getElementById('confirmUploadBtn').disabled = false;
            
        } catch (error) {
            console.error('Error parsing CSV:', error);
            showAlert('Error parsing CSV file. Please check the format!', 'error');
        }
    };
    
    reader.readAsText(file);
}

// Show file preview
function showFilePreview(data) {
    const previewDiv = document.getElementById('filePreview');
    const tableHead = document.getElementById('previewTableHead');
    const tableBody = document.getElementById('previewTableBody');
    
    // Clear previous content
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (data.length === 0) return;
      // Create header
    const headerRow = document.createElement('tr');
    const headers = ['Id', 'Vietnamese', 'Note', 'English', 'Image_link', 'Created_date', 'Next_date', 'Status', 'Count'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);
    
    // Create preview rows (first 5)
    const previewData = data.slice(0, 5);
    previewData.forEach(word => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = word[header] || '';
            td.style.maxWidth = '150px';
            td.style.overflow = 'hidden';
            td.style.textOverflow = 'ellipsis';
            td.style.whiteSpace = 'nowrap';
            row.appendChild(td);
        });
        tableBody.appendChild(row);
    });
    
    previewDiv.style.display = 'block';
}

// Confirm CSV upload
async function confirmCSVUpload() {
    if (!pendingFileData || pendingFileData.length === 0) {
        showAlert('No valid data to upload!', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to update with the uploaded CSV data?\n\nThis will update ${vocabularyData.length} existing entries and may add new entries from ${pendingFileData.length} records in the CSV.`)) {
        try {
            // Show loading indicator
            const uploadButton = document.getElementById('confirmUploadBtn');
            const originalText = uploadButton.innerHTML;
            uploadButton.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Uploading...';
            uploadButton.disabled = true;
            
            // Process and merge data based on IDs
            const mergedData = [];
            const idsProcessed = new Set();
            
            // First, process all incoming CSV data
            pendingFileData.forEach(newWord => {
                if (newWord.Id) {
                    // Find if this ID already exists in current data
                    const existingWordIndex = vocabularyData.findIndex(w => w.Id === newWord.Id);
                    
                    if (existingWordIndex !== -1) {
                        // Merge with existing entry
                        const existingWord = vocabularyData[existingWordIndex];
                        mergedData.push({...existingWord, ...newWord});
                    } else {
                        // New entry with ID
                        mergedData.push(newWord);
                    }
                    
                    idsProcessed.add(newWord.Id);
                } else {
                    // Generate ID for entries without one
                    newWord.Id = generateUniqueId();
                    mergedData.push(newWord);
                }
            });
            
            // Add any existing entries that weren't in the uploaded CSV
            vocabularyData.forEach(existingWord => {
                if (existingWord.Id && !idsProcessed.has(existingWord.Id)) {
                    mergedData.push(existingWord);
                }
            });
            
            // Update CSV manager data
            csvManagerData = JSON.parse(JSON.stringify(mergedData));
            
            // Upload to SheetBest API
            const response = await fetch(SHEETBEST_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(csvManagerData)
            });
            
            if (!response.ok) {
                throw new Error(`API upload failed! status: ${response.status}`);
            }
            
            // Restore button state
            uploadButton.innerHTML = originalText;
            uploadButton.disabled = true; // Keep disabled since upload is complete
            
            // Close upload modal
            const uploadModal = bootstrap.Modal.getInstance(document.getElementById('fileUploadModal'));
            uploadModal.hide();
            
            // Refresh CSV table
            populateCSVTable();
            
            // Reset file input
            document.getElementById('csvFileInput').value = '';
            document.getElementById('filePreview').style.display = 'none';
            pendingFileData = null;
            
            // Update vocabulary data and reinitialize ID counter
            vocabularyData = JSON.parse(JSON.stringify(csvManagerData));
            initializeIdCounter();
            
            showAlert('CSV data merged successfully based on IDs!', 'success');
            
        } catch (error) {
            console.error('Error uploading to SheetBest API:', error);
            
            // Restore button state
            const uploadButton = document.getElementById('confirmUploadBtn');
            uploadButton.innerHTML = '<i class="bi bi-upload"></i> Upload & Merge Data';
            uploadButton.disabled = false;
            
            showAlert('Error uploading to API. Please try again.', 'warning');
        }
    }
}

// Refresh CSV data from SheetBest API
async function refreshCSVData() {
    if (confirm('Are you sure you want to refresh the data? Any unsaved changes will be lost.')) {
        try {
            // Show loading indicator
            const refreshButton = document.querySelector('button[onclick="refreshCSVData()"]');
            const originalText = refreshButton.innerHTML;
            refreshButton.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Refreshing...';
            refreshButton.disabled = true;
            
            // Fetch latest data from SheetBest API
            const response = await fetch(SHEETBEST_API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error! status: ${response.status}`);
            }
            
            const data = await response.json();
              // Process the data to ensure proper format
            const processedData = data.map(item => ({
                Id: item.Id || '',
                Vietnamese: item.Vietnamese || '',
                Note: item.Note || '',
                English: item.English || '',
                Image_link: item.Image_link || '',
                Created_date: item.Created_date || '',
                Next_date: item.Next_date || '',
                Status: item.Status || 'Easy',
                Count: parseInt(item.Count) || 0
            }));
              // Update both vocabularyData and csvManagerData
            vocabularyData = JSON.parse(JSON.stringify(processedData));
            csvManagerData = JSON.parse(JSON.stringify(processedData));
            
            // Initialize ID counter and ensure all words have IDs
            initializeIdCounter();
            ensureWordIds();
            
            // Save to localStorage
            saveVocabularyData();
            
            // Restore button state
            refreshButton.innerHTML = originalText;
            refreshButton.disabled = false;
            
            // Refresh table and clear search
            populateCSVTable();
            document.getElementById('csvSearchInput').value = '';
            
            showAlert('Data refreshed successfully from SheetBest API!', 'success');
            
        } catch (error) {
            console.error('Error refreshing from SheetBest API:', error);
            
            // Fallback to existing vocabularyData
            csvManagerData = JSON.parse(JSON.stringify(vocabularyData));
            
            // Restore button state
            const refreshButton = document.querySelector('button[onclick="refreshCSVData()"]');
            refreshButton.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
            refreshButton.disabled = false;
            
            // Refresh table and clear search
            populateCSVTable();
            document.getElementById('csvSearchInput').value = '';
            
            showAlert('Error refreshing from API. Using local data.', 'warning');
        }
    }
}

// Helper function to show alerts
function showAlert(message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
