import { useState } from "react";
import { HISTORY_KEY, loadHistory, saveLocal } from "../lib/storage";
import {
  Settings as SettingsIcon,
  History as HistoryIcon,
} from "lucide-react";
import logo from "../assets/Logotitle.svg";
import type { ExerciseSettings, CompletedExercise, Screen } from "../types";
import Settings from "./Settings";
import Exercise from "./Exercise";
import History from "./History";
import Footer from "./Footer";
import styles from "./Main.module.css";

export default function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("settings");
  const [currentSettings, setCurrentSettings] =
    useState<ExerciseSettings | null>(null);
  const [initialHistory] = useState(loadHistory);
  const [exercises, setExercises] = useState(initialHistory.exercises);
  const [storageError, setStorageError] = useState(initialHistory.error);

  const handleStartExercise = (settings: ExerciseSettings) => {
    setCurrentSettings(settings);
    setCurrentScreen("exercise");
  };

  const handleCompleteExercise = (exercise: CompletedExercise) => {
    const updated = [exercise, ...exercises];
    const saved = saveLocal(HISTORY_KEY, updated);
    setStorageError(saved ? null : "This exercise could not be saved to your browser. It is available only in this session.");
    setExercises(updated);
    setCurrentScreen("settings");
  };

  const handleClearHistory = () => {
    if (!saveLocal(HISTORY_KEY, [])) {
      setStorageError("History could not be cleared from your browser. Please try again.");
      return;
    }
    setExercises([]);
    setStorageError(null);
  };

  const handleCancelExercise = () => {
    setCurrentScreen("settings");
  };

  const handleBackFromHistory = () => {
    setCurrentScreen("settings");
  };

  return (
    <div className={styles.app}>
      <nav className={styles.navbar}>
  <img src={logo} alt="FootSpeed Logo" className={styles.logoImage} />

  <div className={styles.navButtons}>
    <div className={styles.navLeft}>
      <button
        className={`${styles.navBtn} ${
          currentScreen === "settings" ? styles.active : ""
        }`}
        onClick={() => setCurrentScreen("settings")}
        disabled={currentScreen === "exercise"}
      >
        <SettingsIcon size={18} />
        <span>Settings</span>
      </button>

      <button
        className={`${styles.navBtn} ${
          currentScreen === "history" ? styles.active : ""
        }`}
        onClick={() => setCurrentScreen("history")}
        disabled={currentScreen === "exercise"}
      >
        <HistoryIcon size={18} />
        <span>History</span>
      </button>
    </div>

  </div>
</nav>

      <main className={styles.content}>
        {storageError && <p role="alert">{storageError}</p>}
        {currentScreen === "settings" && (
          <Settings onStartExercise={handleStartExercise} />
        )}

        {currentScreen === "exercise" && currentSettings && (
          <Exercise
            settings={currentSettings}
            onComplete={handleCompleteExercise}
            onCancel={handleCancelExercise}
          />
        )}

        {currentScreen === "history" && (
          <History
            exercises={exercises}
            onBack={handleBackFromHistory}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>
      < Footer />
    </div>
  );
}