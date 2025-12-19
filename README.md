# KeyMash - Multiplayer Typing Battle

KeyMash is a real-time multiplayer typing game where players compete in various challenges to test their typing speed and accuracy. Built with modern web technologies, it offers a seamless and engaging experience for friends and competitive typists alike.

## 🚀 Features

*   **Real-time Multiplayer**: Compete against other players in real-time rooms.
*   **Multiple Game Modes**:
    *   **Typing Race**: Type words as fast as you can! (40s)
    *   **Keyboard Repair**: Drag and drop missing keys to fix the keyboard. (25s)
*   **Live Metrics**: See real-time WPM (Words Per Minute) and progress bars.
*   **Dynamic Rooms**: Create private rooms, set player limits, and customize target scores.
*   **Bot Support**: Add AI bots to practice or fill empty slots.
*   **Multi-language Support**: Play in English or Turkish.
*   **Responsive Design**: Works beautifully on desktop and tablet.

## 🛠️ Technology Stack

*   **Frontend**: [React](https://reactjs.org/) (v19) with [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [TailwindCSS](https://tailwindcss.com/)
*   **Backend/Database**: [Firebase Realtime Database](https://firebase.google.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/YOUR_USERNAME/keymash.git
    cd keymash
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Firebase**
    *   Create a project at [Firebase Console](https://console.firebase.google.com/).
    *   Enable **Realtime Database** (Start in Test Mode).
    *   Create a `.env` file (or `.env.local`) in the root directory and add your config:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🎮 Usage

1.  Open the app in your browser.
2.  **Create a Room**: Enter your name, choose an avatar, and adjust settings.
3.  **Share Code**: Share the 6-character room code with friends.
4.  **Start Game**: The host starts the game once everyone is ready.
5.  **Win**: Be the fastest and most accurate to claim the trophy!

## 🌐 Live Demo

[Link to Live Demo](https://keymash-demo.com) *(Replace with your value)*

---
*Developed with ❤️ using React & Firebase.*
