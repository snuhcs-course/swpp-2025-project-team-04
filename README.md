# LingoFit
App development project of the SNU Computer Science course SWPP (M1522.002400, 2025-02)

<img width="1198" height="275" alt="logo" src="https://github.com/user-attachments/assets/65c991e3-3d46-4079-b043-9fb5e0b6230f" />

**LingoFit** is a learning service that generates and provides **AI-based English listening content**.
It evaluates not only the user’s personal interests but also their English vocabulary and grammatical proficiency, and uses this information to create personalized content tailored to each user.

# Motivation
Without relying on explicit quizzes or tests, LingoFit analyzes users’ natural in-app interactions to automatically track their proficiency level.
Our goal is to provide a comfortable English listening experience that blends seamlessly into daily life, without making users feel evaluated or tested.


# Project Overview Poster
<img width="2226" height="3172" alt="poster" src="https://github.com/user-attachments/assets/8ba47cb8-6fcc-482c-9680-0bb6b15e39ab" />

## Features
- **Personalized Audio Generation**: Real-time generation of AI-powered English listening content tailored to the user’s proficiency level and interests, leveraging the GPT-4o API and ElevenLabs TTS.
- **Listening Content History & Audio Player**: Storage and retrieval of generated audio content, allowing users to replay previous listening sessions at any time.
- **Context-Aware Vocabulary System**: Context-locked word definitions tied to the original script, enabling accurate vocabulary learning without semantic distortion.
- **Adaptive Level Management**: A flexible proficiency management system combining level tests, session feedback, and manual level adjustment.
- **Onboarding & Initial Survey**: Reduced entry barriers through initial surveys and level-appropriate sample audio during onboarding.
- **Learning Statistics & Progress Tracking**: Visualization of learning time and activity data to reinforce user engagement and track long-term progress.

## System Architecture
<img width="7310" height="2860" alt="arch" src="https://github.com/user-attachments/assets/d64be8ef-56f1-4539-98fe-140f3118fc4e" />

**Frontend**: React Native–based mobile application for Android

**Backend**: FastAPI server deployed on AWS EC2

**AI**: GPT and ElevenLabs APIs for script generation and audio synthesis

## Getting Started
### Backend
#### Prerequisites
- Python 3.x 
- API keys: OPENAI_API_KEY, ELEVENLABS_API_KEY
- (Optional) Conda if you use the provided environment 
#### Installation
```
cd backend

./setup.sh              # one-time setup (if provided)
conda activate swpp-backend

# export OPENAI_API_KEY=...
# export ELEVENLABS_API_KEY=...

uvicorn app.main:app --reload --host 0.0.0.0 --port 3000  # http://localhost:3000
```

### Frontend
#### Prerequisites
- Node.js (LTS) + nvm
- Java 17 (LTS)
- Android Studio + Android SDK (or physical device + Expo Go)

#### Installation(on Emulator)
```
git clone git@github.com:snuhcs-course/swpp-2025-project-team-04.git
cd swpp-2025-project-team-04
git checkout iteration-5-demo

cd frontend
nvm use                 # use project-pinned Node version
npm install

# create frontend/.env
# EXPO_PUBLIC_API_URL=http://localhost:3000  # or deployed backend URL

npm run android         # or: npx expo run:android
```

## Demo video
[demo video link](https://www.youtube.com/shorts/hdms3r6pPyQ?feature=share)

## Technical Stack and Implementation Details
Detailed explanations of the system architecture, including CI/CD, testing strategies, and API design, are documented in the Wiki under the [**Design Documentation section**](https://github.com/snuhcs-course/swpp-2025-project-team-04/wiki/Design-Documentation).

## Research on User Level Management and Personalized Content Generation
We developed a proprietary level management logic grounded in HCI implicit user modeling research. This approach enables adaptive user-level tracking and personalized content generation without explicit testing. For further details, please refer to the [**Level Management System page**](https://github.com/snuhcs-course/swpp-2025-project-team-04/wiki/Level-Management-System) in the Wiki.
