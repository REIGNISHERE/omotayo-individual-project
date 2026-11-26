// Select the HTML elements used by the application.
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");
const categorySelect = document.getElementById("category");
const difficultySelect = document.getElementById("difficulty");
const startButton = document.getElementById("start-button");
const retryButton = document.getElementById("retry-button");
const startError = document.getElementById("start-error");
const questionCount = document.getElementById("question-count");
const currentScore = document.getElementById("current-score");
const progressBar = document.getElementById("progress-bar");
const timerText = document.getElementById("timer");
const timerBar = document.getElementById("timer-bar");
const questionCategory = document.getElementById("question-category");
const questionText = document.getElementById("question-text");
const answerButtons = document.getElementById("answer-buttons");
const feedback = document.getElementById("feedback");
const answerHint = document.getElementById("answer-hint");
const nextButton = document.getElementById("next-button");
const bestScoreText = document.getElementById("best-score");
const resultMessage = document.getElementById("result-message");
const finalScore = document.getElementById("final-score");
const finalPercentage = document.getElementById("final-percentage");
const resultDetail = document.getElementById("result-detail");

// Decode the URL-encoded text returned by Open Trivia DB.
function decodeText(value) {
  try {
    return decodeURIComponent(value.replace(/\\+/g, "%20"));
  } catch {
    return value;
  }
}

// Represents one question and its shuffled answer choices.
class Question {
  constructor(data) {
    this.text = decodeText(data.question);
    this.correctAnswer = decodeText(data.correct_answer);
    this.category = decodeText(data.category);
    this.options = [
      this.correctAnswer,
      ...data.incorrect_answers.map(answer => decodeText(answer))
    ];

    // Fisher-Yates shuffle: randomly rearrange all answer choices.
    for (let i = this.options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.options[i], this.options[j]] = [this.options[j], this.options[i]];
    }
  }
}

// Controls the question list, current position and score.
class Quiz {
  constructor(questions) {
    this.questions = questions;
    this.currentIndex = 0;
    this.score = 0;
  }

  getCurrentQuestion() {
    return this.questions[this.currentIndex];
  }

  checkAnswer(answer) {
    const correct = answer === this.getCurrentQuestion().correctAnswer;
    if (correct) this.score++;
    return correct;
  }

  nextQuestion() {
    this.currentIndex++;
  }

  isFinished() {
    return this.currentIndex >= this.questions.length;
  }
}

let quiz = null;
let timerInterval = null;
let timeLeft = 15;
let hasAnswered = false;
let selectedCategory = "0";
let selectedDifficulty = "";

function showScreen(screenToShow) {
  startScreen.hidden = screenToShow !== startScreen;
  quizScreen.hidden = screenToShow !== quizScreen;
  resultsScreen.hidden = screenToShow !== resultsScreen;
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateBestScoreDisplay() {
  const best = Number(localStorage.getItem("quizMasterBestScore")) || 0;
  bestScoreText.textContent = `${best} / 10`;
}

// Make one API request for all ten questions in the selected game.
async function fetchQuestions() {
  const params = new URLSearchParams({
    amount: "10",
    type: "multiple",
    encode: "url3986"
  });

  if (selectedCategory !== "0") params.set("category", selectedCategory);
  if (selectedDifficulty) params.set("difficulty", selectedDifficulty);

  const response = await fetch(`https://opentdb.com/api.php?${params.toString()}`);

  if (!response.ok) {
    throw new Error("We couldn't reach the question service. Check your internet connection and try again.");
  }

  const data = await response.json();

  if (data.response_code !== 0) {
    if (data.response_code === 1) {
      throw new Error("There aren't enough questions for that selection. Try another category or difficulty.");
    }
    if (data.response_code === 5) {
      throw new Error("The question service is busy. Wait a few seconds before trying again.");
    }
    throw new Error("The question service returned an unexpected response. Please try again.");
  }

  return data.results.map(item => new Question(item));
}

async function startGame() {
  if (startButton.disabled) return;

  startButton.disabled = true;
  retryButton.hidden = true;
  startError.hidden = true;
  startError.textContent = "";
  startButton.textContent = "Loading questions...";

  selectedCategory = categorySelect.value;
  selectedDifficulty = difficultySelect.value;

  try {
    const questions = await fetchQuestions();
    quiz = new Quiz(questions);
    showScreen(quizScreen);
    displayQuestion();
  } catch (error) {
    startError.textContent = error.message;
    startError.hidden = false;
    retryButton.hidden = false;
  } finally {
    startButton.disabled = false;
    startButton.innerHTML = 'Start Quiz <span>→</span>';
  }
}

function displayQuestion() {
  stopTimer();
  hasAnswered = false;
  timeLeft = 15;

  const question = quiz.getCurrentQuestion();
  const number = quiz.currentIndex + 1;

  questionCount.textContent = `QUESTION ${number} OF ${quiz.questions.length}`;
  currentScore.textContent = quiz.score;
  progressBar.style.width = `${(number / quiz.questions.length) * 100}%`;
  questionCategory.textContent = question.category;
  questionText.textContent = question.text;
  feedback.textContent = "";
  feedback.className = "feedback";
  answerHint.textContent = "Choose one answer.";
  nextButton.disabled = true;
  nextButton.textContent = number === quiz.questions.length ? "See results →" : "Next question →";

  // Build the answer buttons with JavaScript.
  answerButtons.innerHTML = "";
  question.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => selectAnswer(option, button));
    answerButtons.appendChild(button);
  });

  updateTimerDisplay();
  startTimer();
}

function updateTimerDisplay() {
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = `${(timeLeft / 15) * 100}%`;
  timerBar.classList.toggle("warning", timeLeft <= 5);
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      stopTimer();
      revealAnswer(true);
    }
  }, 1000);
}

function selectAnswer(answer, clickedButton) {
  if (hasAnswered) return;

  hasAnswered = true;
  stopTimer();
  const correct = quiz.checkAnswer(answer);
  const correctAnswer = quiz.getCurrentQuestion().correctAnswer;

  answerButtons.querySelectorAll("button").forEach(button => {
    button.disabled = true;
    if (button.textContent === correctAnswer) button.classList.add("correct");
  });

  if (correct) {
    feedback.textContent = "Correct! Well done. ✓";
    feedback.classList.add("correct-text");
  } else {
    clickedButton.classList.add("wrong");
    feedback.textContent = "Not quite! The green answer is correct.";
    feedback.classList.add("wrong-text");
  }

  currentScore.textContent = quiz.score;
  answerHint.textContent = "Answer locked in.";
  nextButton.disabled = false;
}

function revealAnswer(timeExpired) {
  if (hasAnswered) return;
  hasAnswered = true;

  const correctAnswer = quiz.getCurrentQuestion().correctAnswer;
  answerButtons.querySelectorAll("button").forEach(button => {
    button.disabled = true;
    if (button.textContent === correctAnswer) button.classList.add("correct");
  });

  feedback.textContent = timeExpired
    ? "Time's up! The correct answer is shown in green."
    : "The correct answer is shown in green.";
  feedback.classList.add("wrong-text");
  answerHint.textContent = "No point this time.";
  nextButton.disabled = false;
}

function goToNextQuestion() {
  if (!hasAnswered) return;
  stopTimer();
  quiz.nextQuestion();

  if (quiz.isFinished()) {
    showResults();
  } else {
    displayQuestion();
  }
}

function showResults() {
  stopTimer();
  showScreen(resultsScreen);

  const total = quiz.questions.length;
  const percentage = Math.round((quiz.score / total) * 100);
  const previousBest = Number(localStorage.getItem("quizMasterBestScore")) || 0;

  finalScore.textContent = `${quiz.score} / ${total}`;
  finalPercentage.textContent = `${percentage}%`;

  if (percentage >= 80) {
    resultMessage.textContent = "Great job!";
    resultDetail.textContent = "Excellent work. You really know your stuff!";
  } else if (percentage >= 50) {
    resultMessage.textContent = "Good effort!";
    resultDetail.textContent = "You're getting there. A little more practice will help.";
  } else {
    resultMessage.textContent = "Keep practising!";
    resultDetail.textContent = "Every expert starts somewhere. Give it another try!";
  }

  if (quiz.score > previousBest) {
    localStorage.setItem("quizMasterBestScore", String(quiz.score));
    resultDetail.textContent += " You have a new best score!";
  }
  updateBestScoreDisplay();
}

function returnToStart() {
  stopTimer();
  quiz = null;
  hasAnswered = false;
  startError.hidden = true;
  retryButton.hidden = true;
  startButton.disabled = false;
  startButton.innerHTML = 'Start Quiz <span>→</span>';
  updateBestScoreDisplay();
  showScreen(startScreen);
}

startButton.addEventListener("click", startGame);
retryButton.addEventListener("click", startGame);
nextButton.addEventListener("click", goToNextQuestion);
document.getElementById("play-again-button").addEventListener("click", returnToStart);
document.getElementById("home-button").addEventListener("click", returnToStart);

updateBestScoreDisplay();
