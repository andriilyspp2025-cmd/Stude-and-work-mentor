#  AI Career Mentor | Powered by Gemini API

![Project Banner](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

An intelligent career development platform built with **React** and **Google Gemini AI**.
This application acts as a personal mentor, conducting technical mock interviews, analyzing CVs, and generating personalized learning roadmaps for developers.

---

##  Tech Stack

### Core
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

### AI & Integration
![Gemini API](https://img.shields.io/badge/Google%20Gemini%20API-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Markdown](https://img.shields.io/badge/markdown-%23000000.svg?style=for-the-badge&logo=markdown&logoColor=white)

---

##  Key Features

###  1. AI Mock Interviewer
* Real-time technical interviews tailored to your stack (e.g., Python, React, Java).
* **Gemini Pro** evaluates answers and provides instant feedback with a score (0-100).
* Context-aware follow-up questions.

###  2. Smart Roadmap Generator
* Generates step-by-step learning paths based on your current level and goals.
* Provides curated resources (documentation, courses) for each topic.

###  3. CV & Resume Analysis
* Parses user resume text.
* Suggests improvements for ATS (Applicant Tracking Systems).
* Highlights weak spots and formatting errors.


##  How to Run Locally

Clone the project and start the development server:

```bash
# 1. Clone the repository
git clone [https://github.com/andriilyspp2025-cmd/Stude-and-work-mentor.git](https://github.com/andriilyspp2025-cmd/Stude-and-work-mentor.git)

# 2. Navigate to project directory
cd Stude-and-work-mentor

# 3. Install dependencies
npm install

# 4. Setup Environment Variables
# Create a .env file in the root directory and add your Gemini API Key:
# VITE_GEMINI_API_KEY=your_key_here

# 5. Run the app
npm run dev
