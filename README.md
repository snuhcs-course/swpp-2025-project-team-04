# LingoFit

LingoFit is an AI-based learning tool designed to improve English listening comprehension for busy learners. Each day, it generates a unique audio track customized to the user's proficiency and personal interests, offering a low-pressure way to build foundational skills for stronger communication.

## Demo Video

[LingoFit Iteration 1 Demo Video (Youtube)](https://youtube.com/shorts/NZtx5q3hY98?feature=share)

[LingoFit Iteration 2 Demo Video (Youtube)](https://youtube.com/shorts/E36M5oZ0y3Y?feature=share)

[LingoFit Iteration 3 Demo Video (Youtube)](https://youtube.com/shorts/iPv2uiqF1O0?si=S59XPjY_LWDO_z9_)

[LingoFit Iteration 4 Demo Video (Youtube)](https://www.youtube.com/watch?v=zwApm8YWsXA)

[LingoFit Iteration 5 Demo Video (Youtube)](https://youtube.com/shorts/hdms3r6pPyQ?feature=share)

## Implemented Features

  - User authentication (Sign Up, Log In, Log Out)
  - Heuristic Level Management System
  - Level initialization
  - Audio generation
  - Audio session
  - Audio Difficulty Feedback
  - Vocab
  - Stat
  - Profile

## Getting Started

This guide will help you get a local copy of the project up and running.

### Prerequisites

Before you begin, ensure you have a complete React Native (Expo) development environment set up. For a detailed guide, please follow the official **[Expo Environment Setup Guide](https://docs.expo.dev/get-started/installation/)**.

Key requirements include:

  - **Node.js** (LTS version) - managed via nvm
  - **nvm** (Node Version Manager)
  - **Java 17.0.16 LTS**
  - **Git**
  - **Android Studio** with Android SDK (for Android Emulator) or Xcode (for iOS Simulator)
  - **Android Emulator** running or a physical device with the Expo Go app installed for testing

### Installation & Running the App

1.  **Clone the repository**

    ```sh
    git clone git@github.com:snuhcs-course/swpp-2025-project-team-04.git
    ```

2.  **Check out the demo branch**

    ```sh
    git checkout iteration-4-demo
    ```

3.  **Navigate to the frontend directory**

    ```sh
    cd frontend
    ```

4.  **Set up the correct Node.js version**

    ```sh
    nvm use
    ```

    Make sure you run this from inside the `frontend` directory. Using the wrong Node version will cause `command not found` and dependency errors.

5.  **Set up Environment Variables (Important!)**

    Create a `.env` file in the `frontend` directory. This file is required to connect to the backend API.

    ```
    EXPO_PUBLIC_API_URL=http://52.78.135.45:3000
    ```

6.  **Install dependencies**

    ```sh
    npm install
    ```

7.  **Fix react-native-track-player Kotlin compatibility issue**

    After `npm install`, you need to manually patch the library code:

    - Open: `node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt`
    - Replace the entire file with the fixed code from [this issue](https://github.com/snuhcs-course/swpp-2025-project-team-04/issues/51)

    Quick command to open the file:
    ```sh
    code node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt
    ```

8.  **Configure Android SDK path**

    Create `frontend/android/local.properties` if it doesn't exist:

    ```properties
    sdk.dir=/Users/<your-username>/Library/Android/sdk
    ```

    Replace `<your-username>` with your actual macOS username. You can find your SDK path in Android Studio → Preferences → Android SDK.

9.  **Start the development server**

    ```sh
    npm run android
    ```

    Or use:
    ```sh
    npx expo run:android
    ```

    After running the command, a QR code will appear in the terminal. Scan it with the Expo Go app on your phone, or press `a` or `i` to launch the Android Emulator or iOS Simulator.

## Troubleshooting

For detailed troubleshooting and build issues, see the [Frontend Build Guide](frontend/README.md).

Common issues:

- **Build fails after npm install:** Make sure you patched the react-native-track-player file and are using the correct Node version (`nvm use`)
- **SDK not found:** Check that `local.properties` exists with the correct SDK path
- **Gradle errors:** Verify Java version is 17.0.16 (`java -version`)
- **Can't find emulator:** Open Android Studio → Device Manager and start an emulator first
