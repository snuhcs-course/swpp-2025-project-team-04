# LingoFit

LingoFit is an AI-based learning tool designed to improve English listening comprehension for busy learners. Each day, it generates a unique audio track customized to the user's proficiency and personal interests, offering a low-pressure way to build foundational skills for stronger communication.

## Demo Video

[LingoFit Iteration 1 Demo Video (Youtube)](https://youtube.com/shorts/NZtx5q3hY98?feature=share)

## Implemented Features

  - User authentication (Sign Up, Log In, Log Out)

## Getting Started

This guide will help you get a local copy of the project up and running.

### Prerequisites

Before you begin, ensure you have a complete React Native (Expo) development environment set up. For a detailed guide, please follow the official **[Expo Environment Setup Guide](https://docs.expo.dev/get-started/installation/)**.

Key requirements include:

  - Node.js (LTS version)
  - Git
  - Android Studio (for Android Emulator) or Xcode (for iOS Simulator)
  - A physical device with the Expo Go app installed for testing

### Installation & Running the App

1.  **Clone the repository**

    ```sh
    git clone git@github.com:snuhcs-course/swpp-2025-project-team-04.git
    ```

2.  **Check out the demo branch**

    ```sh
    git checkout iteration-1-demo
    ```

3.  **Navigate to the project directory**

    ```sh
    cd frontend
    ```

4.  **Set up Environment Variables (Important\!)**
    Create a `.env` file in the `frontend` directory. This file is required to connect to the backend API.

    ```
    EXPO_PUBLIC_API_URL=http://52.78.135.45:3000
    ```

5.  **Install dependencies**

    ```sh
    npm install
    ```

6.  **Start the development server**

    ```sh
    npx expo start
    ```

    After running the command, a QR code will appear in the terminal. Scan it with the Expo Go app on your phone, or press `a` or `i` to launch the Android Emulator or iOS Simulator.
