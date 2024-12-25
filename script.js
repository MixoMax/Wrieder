const text = document.getElementById('text');
const input = document.getElementById('input');
const result = document.getElementById('result');
const cursor = document.querySelector('.cursor');
const upcomingText = document.getElementById("text-upcoming");

const parameters = new URLSearchParams(window.location.search)




let startTime;
let endTime;
let errors = 0;
let currentText = '';
let n_typed_chars = 0;
let lines = [];
let currentLineIndex = 0;
let chapters = {}

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
    if (currentLineIndex < lines.length) {
        const next_line = lines[currentLineIndex + 1];
        const max_chars = 150;
        upcomingText.innerHTML = next_line.length > max_chars ? next_line.substring(0, max_chars) + "..." : next_line;
    }
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

function updateProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    const progress = (currentLineIndex / lines.length) * 100;
    progressFill.style.width = `${progress}%`;
    const progressText = document.querySelector('.progress-text');
    progressText.textContent = `${Math.round(progress)}%`;
}

function updateChapter() {
    // update the current chapter, if applicable
    // find the highest index in chapters that is less than currentLineIndex
    // and set the <h2 id="Chapter-text"> to the corresponding chapter title
    let chapterIndex = 0;
    for (let i = 0; i < Object.keys(chapters).length; i++) {
        if (Object.keys(chapters)[i] < currentLineIndex) {
            chapterIndex = Object.keys(chapters)[i];
        }
    }

    console.log(chapterIndex);

    document.getElementById("Chapter-text").textContent = chapters[chapterIndex];

    // also update the document title to BOOKNAME - CHAPTERNAME
    document.title = parameters.get("book") + " - " + chapters[chapterIndex];
    
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
    localStorage.setItem(parameters.get("book") + "_LineIndex", currentLineIndex);
    updateProgressBar();
    updateChapter();

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

document.getElementById("btn-reset").addEventListener('click', () => {
    currentLineIndex = 0;
    localStorage.setItem(parameters.get("book") + "_LineIndex", currentLineIndex);
    updateChapter();
    updateProgressBar();
    window.location.reload();
});

document.getElementById("btn-page-fwd").addEventListener('click', () => {
    currentLineIndex = currentLineIndex + 1;
    localStorage.setItem(parameters.get("book") + "_LineIndex", currentLineIndex);
    updateChapter();
    updateProgressBar();
    startTest();
});

document.getElementById("btn-page-back").addEventListener('click', () => {
    currentLineIndex = currentLineIndex - 1;
    localStorage.setItem(parameters.get("book") + "_LineIndex", currentLineIndex);
    updateChapter();
    updateProgressBar();
    startTest();
});


fetch("/books?book_name=" + parameters.get("book"))
    .then(response => response.text())
    .then(text => {
        lines = text.split('\n')
        if (localStorage.getItem(parameters.get("book") + "_LineIndex")) {
            currentLineIndex = parseInt(localStorage.getItem(parameters.get("book") + "_LineIndex"));
        } else {
            currentLineIndex = 0;
        }

        lines_wo_empty_lines = lines.filter(line => line.trim().length > 0);

        // Parse chapters
        let lines_to_remove = []
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().trim().startsWith('chapter')) {
                let chapterTitle = [lines[i]];
                lines_to_remove.push(lines[i]);
                
                // Continue adding lines until we hit an empty line
                let j = i + 1;
                while (j < lines.length && lines[j].trim() !== '') {
                    chapterTitle.push(lines[j].trim().replace("\n", ""));
                    lines_to_remove.push(lines[j]);
                    j++;
                }
                
                // Join all the chapter title lines with spaces
                let fullChapterTitle = chapterTitle.join(' ');
                chapters[lines_wo_empty_lines.indexOf(lines[i])] = fullChapterTitle;
            }
        }


        lines = lines_wo_empty_lines.filter(line => !lines_to_remove.includes(line)).map(line => line.trim());
        lines = lines.map(line => line + " ");
        updateChapter();
        updateProgressBar();
        startTest();
    })
    .catch(error => {
        console.error('Error fetching text:', error);
        text.textContent = 'Error loading text. Please try again.';
    });
