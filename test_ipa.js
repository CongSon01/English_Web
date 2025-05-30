// Test the word-by-word IPA functionality
function generateIPA(englishText) {
    const ipaDict = {
        'my': '/maɪ/',
        'name': '/neɪm/',
        'is': '/ɪz/',
        'son': '/sʌn/',
        'hello': '/həˈloʊ/',
        'world': '/wɜːrld/',
        'the': '/ðə/',
        'quick': '/kwɪk/',
        'brown': '/braʊn/',
        'fox': '/fɑːks/'
    };
    const lowerText = englishText.toLowerCase().trim();
    return ipaDict[lowerText] || '/' + lowerText + '/';
}

function generateWordByWordIPA(englishText) {
    const words = englishText.split(/\s+/).filter(word => word.length > 0);
    const wordIpaPairs = words.map(word => {
        const cleanWord = word.replace(/[.,!?;:"'()[\]{}]/g, '');
        const ipaText = generateIPA(cleanWord);
        const cleanIPA = ipaText.replace(/^\/|\/$/g, '');
        return word + ' (' + cleanIPA + ')';
    });
    return wordIpaPairs.join(' ');
}

// Test cases
console.log('Test 1:', generateWordByWordIPA('My name is Son'));
console.log('Test 2:', generateWordByWordIPA('Hello world'));
console.log('Test 3:', generateWordByWordIPA('The quick brown fox'));
