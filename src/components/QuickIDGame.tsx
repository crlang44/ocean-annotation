import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Fish,
  CheckCircle,
  RefreshCcw,
  Trophy, AlertTriangle
} from "lucide-react";
import Timer from "./Timer";

// Import images
import sharkClear from "../data/images/shark_clear.jpg";
import kelpClear from "../data/images/kelp_clear.jpg";
import dolphinClear from "../data/images/dolphin_clear.jpg";
import sharkMedium from "../data/images/shark_medium.jpg";
import kelpMedium from "../data/images/kelp_medium.jpg";
import dolphinMedium from "../data/images/dolphin_medium.jpg";
import sharkHard from "../data/images/shark_hard.jpg";
import kelpHard from "../data/images/kelp_hard.jpg";
import dolphinHard from "../data/images/dolphin_hard.jpg";

// New images
import dolphinHard2 from "../data/images/dolphin_hard2.jpeg";
import dolphinHard3 from "../data/images/dolphin_hard3.avif";
import dolphinHard4 from "../data/images/dolphin_hard4.jpg";
import dolphinHard5 from "../data/images/dolphin_hard5.jpg";
import dolphinHard6 from "../data/images/dolphin_hard6.jpg";
import dolphinMedium2 from "../data/images/dolphin_medium2.jpg";
import dolphinMedium3 from "../data/images/dolphin_medium3.jpg";
import dolphinMedium4 from "../data/images/dolphin_medium4.jpg";
import kelpEasy2 from "../data/images/kelp_easy2.jpeg";
import kelpMedium2 from "../data/images/kelp_medium2.jpeg";
import kelpMedium3 from "../data/images/kelp_medium3.webp";
import sharkHard2 from "../data/images/shark_hard2.avif";
import sharkMedium2 from "../data/images/shark_medium2.jpg";
import sharkMedium3 from "../data/images/shark_medium3.webp";
import sharkHard3 from "../data/images/shark_hard3.jpg";
import sharkHard4 from "../data/images/shark_hard4.jpg";
import sharkMedium4 from "../data/images/shark_medium4.jpg";
import sharkMedium5 from "../data/images/shark_medium5.jpg";
import sharkEasy2 from "../data/images/shark_easy2.jpg";

// Game image interface
interface GameImage {
  id: string;
  imagePath: string;
  correctAnswer: "shark" | "kelp" | "dolphin";
}

interface QuickIDGameProps {
  onGameComplete?: (score: number, accuracy: number, allComplete: boolean) => void;
  showInstructions?: boolean;
  setShowInstructions?: (show: boolean) => void;
  resetGameRef?: React.MutableRefObject<(() => void) | null>;
}

// Sample game images - mixed order to avoid too many of the same answer in a row
const gameImages: GameImage[] = [
  // Easy images (shown first) - mixed order
  { id: "1", imagePath: sharkClear, correctAnswer: "shark" },
  { id: "2", imagePath: kelpClear, correctAnswer: "kelp" },
  { id: "3", imagePath: dolphinClear, correctAnswer: "dolphin" },
  { id: "21", imagePath: sharkEasy2, correctAnswer: "shark" },
  { id: "10", imagePath: kelpEasy2, correctAnswer: "kelp" },

  // Medium difficulty - mixed order
  { id: "4", imagePath: sharkMedium, correctAnswer: "shark" },
  { id: "6", imagePath: dolphinMedium, correctAnswer: "dolphin" },
  { id: "5", imagePath: kelpMedium, correctAnswer: "kelp" },
  { id: "14", imagePath: sharkMedium2, correctAnswer: "shark" },
  { id: "11", imagePath: dolphinMedium2, correctAnswer: "dolphin" },
  { id: "12", imagePath: kelpMedium2, correctAnswer: "kelp" },
  { id: "22", imagePath: sharkMedium4, correctAnswer: "shark" },
  { id: "19", imagePath: dolphinMedium3, correctAnswer: "dolphin" },
  { id: "13", imagePath: kelpMedium3, correctAnswer: "kelp" },
  { id: "15", imagePath: sharkMedium3, correctAnswer: "shark" },
  { id: "26", imagePath: dolphinMedium4, correctAnswer: "dolphin" },
  { id: "23", imagePath: sharkMedium5, correctAnswer: "shark" },

  // Hard (obscured/ambiguous) - mixed order
  { id: "7", imagePath: sharkHard, correctAnswer: "shark" },
  { id: "16", imagePath: dolphinHard2, correctAnswer: "dolphin" },
  { id: "8", imagePath: kelpHard, correctAnswer: "kelp" },
  { id: "18", imagePath: sharkHard2, correctAnswer: "shark" },
  { id: "17", imagePath: dolphinHard3, correctAnswer: "dolphin" },
  { id: "24", imagePath: sharkHard3, correctAnswer: "shark" },
  { id: "20", imagePath: dolphinHard4, correctAnswer: "dolphin" },
  { id: "25", imagePath: sharkHard4, correctAnswer: "shark" },
  { id: "27", imagePath: dolphinHard5, correctAnswer: "dolphin" },
  { id: "28", imagePath: dolphinHard6, correctAnswer: "dolphin" },
];

// No image cache needed - we're using DOM elements with display toggling

const QuickIDGame: React.FC<QuickIDGameProps> = ({ 
  onGameComplete,
  showInstructions: externalShowInstructions,
  setShowInstructions: externalSetShowInstructions,
  resetGameRef
}) => {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [timePerImage, setTimePerImage] = useState(5000); // Start with 5 seconds per image
  const [timeRemaining, setTimeRemaining] = useState(45); // Total game time in seconds
  const [currentImageStartTime, setCurrentImageStartTime] = useState(0); // Track when current image started
  
  // Use external state if provided, otherwise use local state
  const [internalShowInstructions, setInternalShowInstructions] = useState(() => {
    return localStorage.getItem("hasSeenQuickIDInstructions") !== "true";
  });
  
  // Use either external or internal state based on what's provided
  const showInstructions = externalShowInstructions !== undefined ? externalShowInstructions : internalShowInstructions;
  const setShowInstructions = externalSetShowInstructions || setInternalShowInstructions;
  // Add animation key state to force timer bar animation restart
  const [animationKey, setAnimationKey] = useState(0);
  // Add feedback state for showing checkmark/X
  const [showFeedback, setShowFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);
  // Track if all images have been seen
  const [seenImages, setSeenImages] = useState<Set<string>>(new Set());
  const [allImagesSeen, setAllImagesSeen] = useState(false);
  // State for image loading
  const [isImageLoading, setIsImageLoading] = useState(true);
  // Fixed: Initialize bestScore as 0 if no saved score exists
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem("quickIdBestScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isNewBestScore, setIsNewBestScore] = useState(false);
  // Store the final game score for display
  const [finalGameScore, setFinalGameScore] = useState(0);
  // Store whether the final game score was a new best
  const [finalGameWasNewBest, setFinalGameWasNewBest] = useState(false);

  // Refs
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Use refs to track game state for timer
  const gameStateRef = useRef({
    score: 0,
    totalAttempts: 0,
    correctAnswersCount: 0,
    allImagesSeen: false,
  });

  // Sync state with ref
  useEffect(() => {
    gameStateRef.current.score = score;
    gameStateRef.current.totalAttempts = totalAttempts;
    gameStateRef.current.correctAnswersCount = correctAnswersCount;
    gameStateRef.current.allImagesSeen = allImagesSeen;
  }, [score, totalAttempts, correctAnswersCount, allImagesSeen]);

  // Check if all images have been seen
  useEffect(() => {
    if (seenImages.size === gameImages.length && !allImagesSeen) {
      setAllImagesSeen(true);
    }
  }, [seenImages, allImagesSeen]);

  // Handle image timer when image index changes or game starts
  useEffect(() => {
    if (gameStarted && !gameOver) {
      setImageTimer(timePerImage);
    }
  }, [currentImageIndex, gameStarted]); // Trigger when image changes or game starts

  // Reset loading state when current image changes
  useEffect(() => {
    if (!gameStarted) return;
    
    // Images are already in the DOM, just reset loading state
    // The actual loading state is handled by the onLoad handler in each image element
    setIsImageLoading(false);
    
  }, [currentImageIndex, gameStarted]);

  // Initialize game
  const startGame = () => {
    // Expose the startGame function through the ref if provided
    if (resetGameRef) {
      resetGameRef.current = startGame;
    }
    setGameStarted(true);
    setGameOver(false);
    setCurrentImageIndex(0);
    setScore(0);
    setTotalAttempts(0);
    setCorrectAnswersCount(0);
    setTimePerImage(5000); // Start with 5 seconds
    setTimeRemaining(45);
    setAnimationKey(0); // Reset animation key
    setSeenImages(new Set());
    setAllImagesSeen(false);
    setIsImageLoading(false);
    setIsNewBestScore(false); // Reset new best score flag

    // Reset the game state ref
    gameStateRef.current = {
      score: 0,
      totalAttempts: 0,
      correctAnswersCount: 0,
      allImagesSeen: false,
    };

    // Reload best score from localStorage to ensure it's up to date
    const savedBestScore = localStorage.getItem("quickIdBestScore");
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore, 10));
    }

    // Timer is now handled by the Timer component

    // The image timer will be set by the useEffect
  };

  // Set timer for current image
  const setImageTimer = (delayMs: number) => {
    // Clear any existing timer
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    // Only set a new timer if the game is still active
    if (gameStarted && !gameOver) {
      // Increment animation key to force restart of animation
      setAnimationKey((prev) => prev + 1);

      // Record the start time for this image
      setCurrentImageStartTime(Date.now());

      // Set new timer for current image
      imageTimerRef.current = setTimeout(() => {
        // Time's up for this image - count as incorrect
        handleAnswer("timeout");
      }, delayMs);
    }
  };

  // Move to the next image
  const moveToNextImage = () => {
    // Clear any existing timer first
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    // Briefly set loading state for opacity transition
    setIsImageLoading(true);
    
    // Move to next image
    const nextIndex = (currentImageIndex + 1) % gameImages.length;
    
    // Images are already in the DOM, just toggle visibility
    setIsImageLoading(false);

    // Set next image
    setCurrentImageIndex(nextIndex);

    // Gradually decrease time per image as the game timer (timeRemaining) nears the end.
    // Starts at 5 seconds, goes down to 1 seconds.
    const initialGameDurationSeconds = 45;
    const maxTimePerImageMs = 5000;
    const minTimePerImageMs = 500;

    // Calculate game progress based on timeRemaining (0.0 at start, ~1.0 towards end)
    // timeRemaining is in seconds.
    const gameProgress = Math.min(
      1,
      (initialGameDurationSeconds - timeRemaining) / initialGameDurationSeconds
    );

    // Interpolate timePerImage based on gameProgress
    const calculatedTimePerImageMs =
      maxTimePerImageMs -
      gameProgress * (maxTimePerImageMs - minTimePerImageMs);

    // Ensure the delay is within the defined min/max bounds
    const newDelayMs = Math.max(
      minTimePerImageMs,
      Math.min(maxTimePerImageMs, calculatedTimePerImageMs)
    );
    setTimePerImage(newDelayMs); // Update state for UI or other logic

    // Don't set the timer here - let useEffect handle it
  };

  // Handle player's answer
  const handleAnswer = (answer: "shark" | "kelp" | "dolphin" | "timeout") => {
    // Clear the current image timer
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    const currentImage = gameImages[currentImageIndex];

    // Mark this image as seen
    setSeenImages((prev) => new Set([...prev, currentImage.id]));
    setTotalAttempts((prev) => prev + 1); // Common for all outcomes, attempt is made

    if (answer === "timeout") {
      // For timeouts, move to the next image directly.
      // The "X" feedback overlay is skipped for a quicker transition; toast is sufficient.
      moveToNextImage();
    } else {
      const isCorrect = answer === currentImage.correctAnswer;
      if (isCorrect) {
        // Calculate points based on time remaining
        const elapsedTime = Date.now() - currentImageStartTime;
        const timeRatio = Math.max(0, 1 - elapsedTime / timePerImage);
        const pointsEarned = Math.round(10 * timeRatio);

        setScore((prev) => prev + pointsEarned);
        setCorrectAnswersCount((prev) => prev + 1);
        setShowFeedback("correct");
      } else {
        setShowFeedback("incorrect");
      }

      // For explicit answers (correct or incorrect), show feedback overlay for a short duration.
      setTimeout(() => {
        setShowFeedback(null);
        moveToNextImage();
      }, 200);
    }
  };

  // Fixed: End the game with proper best score handling
  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);

    // Clear image timer
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
    }

    // Use the ref to get the current values
    const currentScore = gameStateRef.current.score;
    const currentBestScore = bestScore;
    const totalAttemptsValue = gameStateRef.current.totalAttempts;
    const correctAnswersValue = gameStateRef.current.correctAnswersCount;
    const allImagesSeenValue = gameStateRef.current.allImagesSeen;
    
    // Set the final score for display
    setFinalGameScore(currentScore);
    
    if (currentScore > currentBestScore) {
      // Update best score immediately
      setBestScore(currentScore);
      setIsNewBestScore(true);
      setFinalGameWasNewBest(true); // Set this for the game over display
      localStorage.setItem("quickIdBestScore", currentScore.toString());
      
      // Show toast after a slight delay to ensure state is updated
      setTimeout(() => {
      }, 100);
    } else {
      setIsNewBestScore(false);
      setFinalGameWasNewBest(false);
    }

    // Calculate final accuracy
    const accuracy =
      totalAttemptsValue > 0
        ? Math.round((correctAnswersValue / totalAttemptsValue) * 100)
        : 0;

    // Call the onGameComplete callback if provided - pass both score and accuracy
    if (onGameComplete) {
      onGameComplete(currentScore, accuracy, allImagesSeenValue);
    }

    // Show final toast with score
    setTimeout(() => {
    }, 150);
  };

  // Instructions component
  const Instructions = ({ onClose }: { onClose: () => void }) => (
    <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
      <h2 className="text-2xl font-bold text-ocean-dark mb-4">
        Quick ID
      </h2>

      <div className="space-y-4 mb-6">

        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="list-disc pl-5 text-gray-700 space-y-2">
            <li>Click the correct button for each image</li>
            <li>Choose: Shark, Kelp, or Dolphin</li>
            <li>45 seconds total - game gets faster!</li>
            <li>Faster answers = more points</li>
          </ul>
        </div>
      </div>

      <Button
        className="w-full bg-ocean-dark hover:bg-ocean-darker text-white"
        onClick={onClose}
      >
        Let's Play!
      </Button>
    </div>
  );

  return (
    <div>
      <div className="container mx-auto py-0 px-4 relative z-10">

        {/* Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Instructions
              onClose={() => {
                setShowInstructions(false);
                localStorage.setItem("hasSeenQuickIDInstructions", "true");
                if (!gameStarted && !gameOver) {
                  startGame();
                }
              }}
            />
          </div>
        )}

        <div className="w-full max-w-6xl mx-auto space-y-4">
          {/* Game Timer - Only show during active gameplay */}
          {gameStarted && (
            <div className="bg-white rounded-xl p-3 shadow-md">
              <Timer
                duration={45}
                onTimeUp={() => endGame()}
                isRunning={gameStarted && !gameOver}
                onTimerUpdate={(timeLeft) => setTimeRemaining(timeLeft)}
                label="Time Remaining:"
              />
            </div>
          )}

          {/* Main Game Layout - Conditional Horizontal */}
          <div className={gameStarted ? "flex gap-4" : "flex justify-center"}>
            {/* Game Area - Takes up most of the space or full width */}
            <div className={gameStarted ? "flex-1 relative aspect-[16/9] bg-white rounded-xl shadow-lg overflow-hidden flex items-center justify-center" : "w-full max-w-4xl relative aspect-[16/9] bg-white rounded-xl shadow-lg overflow-hidden flex items-center justify-center"}>
              {gameStarted ? (
                <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
                  {/* Current image with preloaded images */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Render all images but only show the current one */}
                    {gameImages.map((image, index) => (
                      <div
                        key={image.id}
                        className="absolute inset-0 max-h-full max-w-full h-full w-full"
                        style={{
                          display: index === currentImageIndex ? 'block' : 'none',
                          opacity: isImageLoading ? 0 : 1,
                          transition: 'opacity 200ms'
                        }}
                      >
                        <img 
                          src={image.imagePath}
                          alt={`${image.correctAnswer} image`}
                          className="h-full w-full object-cover"
                          style={{ objectPosition: 'center' }}
                          onLoad={() => {
                            if (index === currentImageIndex) {
                              setIsImageLoading(false);
                            }
                          }}
                        />
                      </div>
                    ))}

                    {/* Feedback overlay */}
                    {showFeedback && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                        {showFeedback === "correct" ? (
                          <div className="bg-green-500 rounded-full p-10">
                            <CheckCircle className="h-24 w-24 text-white" />
                          </div>
                        ) : (
                          <div className="bg-red-500 rounded-full p-10">
                            <AlertTriangle className="h-24 w-24 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timer indicator with key to force animation restart */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
                      <div
                        key={animationKey}
                        className="h-full bg-ocean-dark"
                        style={{
                          width: "100%",
                          animation: `shrink ${
                            timePerImage / 1000
                          }s linear forwards`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : gameOver ? (
                <div className="flex items-center justify-center h-full">
                  <div className="p-8 text-center">
                    <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-ocean-dark mb-2">
                      Game Over!
                    </h2>

                    <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto mb-6">
                      <div className="text-5xl font-bold text-ocean-dark mb-2">
                        {finalGameScore}
                      </div>
                      <p className="text-gray-700">Total Points</p>

                      {/* Fixed: Best Score Display */}
                      {finalGameWasNewBest ? (
                        <div className="mt-4 p-2 bg-yellow-100 rounded">
                          <p className="text-yellow-700 font-bold text-lg">
                            🏆 NEW BEST SCORE! 🏆
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <p className="text-gray-600">
                            Best Score: <span className="font-bold text-ocean-dark">{bestScore}</span>
                          </p>
                        </div>
                      )}

                      <div className="mt-4 text-sm text-gray-700">
                        <div className="flex justify-between mb-2">
                          <div>Accuracy:</div>
                          <div className="font-bold text-ocean-dark">
                            {totalAttempts > 0
                              ? Math.round(
                                  (correctAnswersCount / totalAttempts) * 100
                                )
                              : 0}
                            %
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div>Attempts:</div>
                          <div className="font-bold">{totalAttempts}</div>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="bg-ocean-dark hover:bg-ocean-darker text-white text-lg px-8 py-6 h-auto"
                      onClick={startGame}
                    >
                      <RefreshCcw className="h-5 w-5 mr-2" /> Play Again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="p-8 text-center">
                    <Fish className="h-16 w-16 text-ocean-dark mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-ocean-dark mb-4">
                      Ready to Test Your Quick ID Skills?
                    </h2>
                    <p className="text-gray-700 mb-6">
                      Identify sharks, kelp, and dolphins as quickly as possible!
                    </p>
                    <Button
                      className="bg-ocean-dark hover:bg-ocean-darker text-white text-lg px-8 py-6 h-auto"
                      onClick={startGame}
                    >
                      Start Game
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Controls and Score - Only show during active gameplay */}
            {gameStarted && (
              <div className="w-80 bg-white rounded-xl p-4 shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  {/* Current Score */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-ocean-dark">Current Score</h3>
                      <div className="text-3xl font-bold text-ocean-dark">
                        {score}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-700">Correct:</span>
                        <span className="font-bold text-green-600 ml-1">
                          {totalAttempts > 0
                            ? Math.round((correctAnswersCount / totalAttempts) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-700">Attempts:</span>
                        <span className="font-bold ml-1">{totalAttempts}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Best Score:</span>
                        <span className="font-bold text-ocean-dark">
                          {bestScore > 0 ? bestScore : "--"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Answer buttons */}
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-gray-700 text-center">
                      Click the correct identification for the image.
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button
                        className="h-16 text-lg bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => handleAnswer("shark")}
                      >
                        Shark
                      </Button>
                      <Button
                        className="h-16 text-lg bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleAnswer("kelp")}
                      >
                        Kelp
                      </Button>
                      <Button
                        className="h-16 text-lg bg-purple-500 hover:bg-purple-600 text-white"
                        onClick={() => handleAnswer("dolphin")}
                      >
                        Dolphin
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 text-center">
                      The faster you answer, the more points you get!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CSS for animation */}
        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default QuickIDGame;
