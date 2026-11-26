# Quiz Master — Timed Trivia Quiz

A responsive quiz application built with HTML, CSS and vanilla JavaScript. It fetches multiple-choice questions from [Open Trivia DB](https://opentdb.com/).

## How to run

1. Download and extract the `quiz-master-project.zip` file.
2. Open the extracted `quiz-master` folder.
3. Open `index.html` in a modern web browser.
4. Choose a category and difficulty, then click **Start Quiz**.
5. Keep an internet connection active so the app can fetch questions.

You can also open the folder in Visual Studio Code and use a local development server if you prefer.

## Features

- Fetches 10 questions in one API request per game.
- Category and difficulty selection.
- Shuffled multiple-choice answers.
- 15-second countdown for every question.
- Correct and incorrect answer feedback.
- Running score and question progress.
- Results screen with percentage and performance message.
- Best score saved using browser `localStorage`.
- Responsive design for desktop and mobile.
- Loading state and friendly error messages.

## One improvement with more time

I would add a question review page showing the player's answer beside the correct answer for every question.

## Technologies

HTML5, CSS3, vanilla JavaScript (classes, Fetch API, async/await, DOM events, timers and localStorage), and Open Trivia DB.
