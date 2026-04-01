# AI-Powered Online Assessment Platform

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?size=24&duration=2800&color=58A6FF&center=true&vCenter=true&width=800&lines=AI+Assessment+Platform;MERN+Stack+Application;Smart+Anti-Cheating+System;Real-Time+Analytics+Dashboard" />
</p>

---

## Overview

A full-stack AI-powered assessment platform designed to modernize online examinations with security, automation, and deep analytics.

Built using the MERN stack, the system enables intelligent test creation, real-time monitoring, and performance-driven insights.

---

## Key Features

* AI-based question generation
* Secure exam environment with anti-cheating controls
* Real-time analytics and leaderboard system
* Role-based access (Admin / Student)
* Webcam-based AI monitoring

---

## System Architecture

```mermaid
flowchart LR
A[React Frontend] --> B[Node.js Backend]
B --> C[MongoDB Database]
A --> D[TensorFlow.js Monitoring]
B --> E[Analytics Engine]
```

---

## Core Modules

### Authentication

* Secure login for Admin and Students
* Role-based access control

---

### AI Question Generator

* Prompt-based MCQ generation
* Automatically creates options and answers
* Answers are securely stored and hidden from users

---

### Admin Dashboard

* Manage and publish assessments
* Monitor student activity
* Access analytics and reports

---

<details>
<summary><strong>Analytics Engine (Click to expand)</strong></summary>

* Total number of participants
* Average score
* Question-wise performance analysis
* Identification of difficult questions
* Student-level insights
* Leaderboard generation

</details>

---

<details>
<summary><strong>Leaderboard System (Click to expand)</strong></summary>

* Ranking based on score and accuracy
* Real-time updates
* Highlights top performers

</details>

---

### Student Panel

* Attempt assessments
* Timer-based exam interface
* Auto submission on completion

---

<details>
<summary><strong>Anti-Cheating System (Click to expand)</strong></summary>

* Tab switching detection
* Window focus tracking
* Fullscreen enforcement
* Copy/paste and right-click restrictions
* Automatic submission after violations

</details>

---

<details>
<summary><strong>AI Monitoring (Click to expand)</strong></summary>

* Webcam-based detection using TensorFlow.js
* Detects absence of face
* Detects multiple faces
* Generates a cheating score

</details>

---

### Result System

* Score and accuracy calculation
* Performance summary after submission

---

## Data Visualization

* Bar chart for score distribution
* Pie chart for correct vs incorrect answers

---

## Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,nodejs,express,mongodb,js" />
</p>

---

## Security Design

* Answers are never exposed on the client side
* Admin-only access to analytics
* Controlled exam environment
* Behavior monitoring for integrity

---

## Use Cases

* Educational institutions
* Online certification platforms
* Corporate assessment systems

---

<details>
<summary><strong>Future Enhancements (Click to expand)</strong></summary>

* Integration with LLMs (OpenAI / Gemini)
* Live proctoring with video recording
* Cloud deployment (AWS / Vercel)
* Mobile responsive interface

</details>

---

## Author

Arun M
AI & Data Science Student

---

## Final Note

<p align="center">
  <i>Designed to bring intelligence, fairness, and insight into digital assessments.</i>
</p>
