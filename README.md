# CounselorBot: An AI-Powered Educational Guidance Tool

CounselorBot is an innovative AI-driven chatbot designed to assist students in interpreting self-assessment questionnaires and reflecting on their results. This tool combines advanced AI techniques with a user-friendly interface to provide personalized support and foster autonomous learning.

## Project Overview

### Abstract  
Artificial Intelligence (AI) is transforming education, offering new opportunities alongside significant challenges. Aligned with the EU's AI Act, which categorizes education as a high-risk domain, CounselorBot addresses these challenges responsibly. It helps students by analyzing questionnaire results, providing tailored insights, and promoting critical thinking and self-reflection.

## Features

- **Personalized Support**:  
  CounselorBot provides detailed feedback and actionable advice based on questionnaire outcomes.

- **Transparent and Verifiable Responses**:  
  Uses Retrieval-Augmented Generation (RAG) to ensure responses are based on reliable, retrievable sources.

- **Ethical AI Use**:  
  Designed to comply with the EU AI Act’s requirements for transparency, data quality, and human oversight.

## Technical Details

- **Backend**: Python  
  - Core library: [LangChain](https://python.langchain.com/) for integrating Large Language Models (LLMs) and managing advanced AI workflows.  
  - Retrieval-Augmented Generation (RAG) for context-aware AI responses.

- **Frontend**: JavaScript  
  - Current implementation focuses on functionality; responsive design is a planned enhancement.

- **AI Techniques**:  
  - Prompt Engineering and techniques like Chain of Thought (CoT) and Tree of Thoughts (ToT) are planned for future implementation to enhance reasoning and response quality.

## Installation Instructions

### Prerequisites
Before installing CounselorBot, ensure you have the following:
- **Python 3.8+**
- Basic familiarity with Python and JavaScript environments

### Steps to Install

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/nugh75/Counselorbot.git
   cd Counselorbot
   ```

2. **Setup the Backend**:
   - Create a virtual environment and activate it:
     ```bash
     python -m venv venv
     source venv/bin/activate  # On Windows, use venv\Scripts\activate
     ```
   - Install the required Python dependencies:
     ```bash
     pip install -r requirements.txt
     ```

3. **Run the Application**:
   - Start the backend server:
     ```bash
     python backend.py
     ```

## Development Status

CounselorBot is in active development. While some functionalities are operational, others are planned for future updates to expand and improve the tool.

### Features and Enhancements To Implement:

- [ ] **Responsive Design**:  
  Ensure the interface is accessible and usable across various devices, including mobile and tablets.

- [ ] **Chain of Thought (CoT) Integration**:  
  Implement advanced reasoning techniques to break down complex problems into intermediate steps.

- [ ] **Enhanced Frontend Interface**:  
  Create a more intuitive and visually appealing design, including improvements in navigation and user experience.

- [ ] **Integration of Tree of Thoughts (ToT)**:  
  Allow exploration of multiple reasoning paths to improve the flexibility and depth of responses.

- [ ] **User Authentication**:  
  Introduce login functionality to personalize the chatbot’s interactions and save progress.

- [ ] **Advanced Analytics Dashboard**:  
  Provide educators with insights on student interactions and performance trends.

- [ ] **Multi-Language Support**:  
  Expand accessibility by adding support for multiple languages in both the interface and responses.

- [ ] **Context-Aware Feedback**:  
  Enhance responses based on real-time context, including specific questionnaire results or user queries.

- [ ] **Expanded Database for RAG**:  
  Broaden the range of indexed resources to improve the chatbot’s ability to provide accurate and relevant information.

- [ ] **Debugging Tool for Users**:  
  Allow users to report issues directly through the interface and suggest improvements for chatbot outputs.

- [ ] **Gamification Elements**:  
  Introduce motivational features such as badges or progress tracking to encourage student engagement.

## Open Source and Collaboration

CounselorBot is open-source and released under the GPL license. Contributions are encouraged to help develop these features and refine existing functionalities.

## How to Contribute

1. Fork this repository.  
2. Create a branch for your feature or fix.  
3. Submit a pull request detailing your changes.
