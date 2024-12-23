const text = document.getElementById('text');
const input = document.getElementById('input');
const result = document.getElementById('result');
const cursor = document.querySelector('.cursor');

const parameters = new URLSearchParams(window.location.search)




let startTime;
let endTime;
let errors = 0;
let currentText = '';
let n_typed_chars = 0;
let lines = [];
let currentLineIndex = 0;

let isPaused = true;

function updateCursorPosition() {
    const upcomingChar = text.querySelector('.upcoming');
    if (!upcomingChar) {
        cursor.style.display = 'none';
        return;
    }
    
    const textRect = text.getBoundingClientRect();
    const charRect = upcomingChar.getBoundingClientRect();
    

    const x = charRect.left - textRect.left + text.getBoundingClientRect().left;
    const y = charRect.top - textRect.top  + text.getBoundingClientRect().top;
        
    cursor.style.display = 'block';
    cursor.style.transform = `translate(${x}px, ${y}px)`;
}

function createSpanForChar(char, className) {
    const span = document.createElement('span');
    span.textContent = char;
    if (className) span.className = className;
    return span;
}

function updateText() {
    text.innerHTML = '';
    const chars = currentText.split('');
    const inputChars = input.value.split('');
    
    chars.forEach((char, index) => {
        if (index < inputChars.length) {
            // Character has been typed
            if (inputChars[index] === char) {
                text.appendChild(createSpanForChar(char, 'correct'));
            } else {
                text.appendChild(createSpanForChar(char, 'incorrect'));
                if (inputChars[index] !== '') errors++;
            }
        } else {
            // Upcoming character
            text.appendChild(createSpanForChar(char, 'upcoming'));
        }
    });
    
    updateCursorPosition();
}

function startTest() {
    if (currentLineIndex >= lines.length) {
        currentLineIndex = 0;
    }
    
    currentText = lines[currentLineIndex];
    text.innerHTML = '';
    cursor.style.display = 'none';
    currentText.split('').forEach(char => {
        text.appendChild(createSpanForChar(char, 'upcoming'));
    });
    updateCursorPosition();
    input.value = '';
    input.focus();
    startTime = new Date().getTime();
    errors = 0;
    isPaused = false;
    document.querySelector('.left span').textContent = 'TYPING';

}

function pauseTest() {
    isPaused = true;
    document.querySelector('.left span').textContent = 'PAUSED';
}

function finish_line() {
    endTime = new Date().getTime();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const words = currentText.split(' ').length;
    const wpm = Math.round((words / timeTaken) * 60);
    const accuracy = Math.round(((currentText.length - errors) / currentText.length) * 100);
    result.innerHTML = `
        <span>${timeTaken}s</span> 
        <span>${wpm} wpm</span> 
        <span>${accuracy}% acc</span>
    `;

    currentLineIndex = currentLineIndex + 1;
    startTest();
}

input.addEventListener('input', () => {
    if (isPaused) return;
    updateText();


    // count the number of <span class=upcoming>. if the count is zero, call finish_line()
    const n_chars_left = text.querySelectorAll('.upcoming').length;
    if (n_chars_left === 0) {
        finish_line();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        pauseTest();
        return;
    }
    
    if (isPaused && e.key !== 'Escape') {
        startTest();
    }
    
    input.focus();
});


fetch("/books?book_name=" + parameters.get("book"))
    .then(response => response.text())
    .then(text => {
        lines = text.split('\n').filter(line => line.trim().length > 0);
        startTest();
    })
    .catch(error => {
        console.error('Error fetching text:', error);
        text.textContent = 'Error loading text. Please try again.';
    });
