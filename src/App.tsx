import React, { useState, useEffect } from 'react';
import './App.css';

interface Player {
  name: string;
  score: number;
}

const difficulties = ['easy', 'medium', 'hard', 'impossible'];

const insults = [
  'You are a fucking moron!',
  'What the fuck is wrong with you?',
  'You are a fucking idiot!',
  'How the fuck did you mess that up?',
  'You are a fucking disgrace!',
  'You are a fucking imbecile!',
  'You are a fucking dumbass!',
  'You are a fucking clown!',
  'You are a fucking joke!',
  'You are a fucking failure!',
];

const praises = [
  'You are a fucking genius!',
  'You are a fucking legend!',
  'You are a fucking wizard!',
  'You are a fucking prodigy!',
  'You are a fucking mastermind!',
  'You are a fucking champion!',
  'You are a fucking superstar!',
  'You are a fucking hero!',
  'You are a fucking marvel!',
  'You are a fucking wonder!',
];

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [roundDifficulty, setRoundDifficulty] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());

  const speak = (text: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  const getRandomWord = async (difficulty: string) => {
    let attempts = 0;
    let word = 'default';
    do {
      attempts++;
      let url = 'https://api.datamuse.com/words?';
      if (difficulty === 'Imp') {
        url += 'sp=???????????&max=1';
      } else {
        url += `ml=${difficulty}&sp=?????????&max=1`;
      }
      url += `&timestamp=${new Date().getTime()}`;

      const response = await fetch(url);
      const data = await response.json();
      word = data[0]?.word || 'default';

      if (!usedWords.has(word)) {
        setUsedWords((prev) => new Set(prev).add(word));
        return word;
      }
    } while (attempts < 10);

    return word;
  };

  const handleStartGame = () => {
    if (players.length === 2 && players.every((player) => player.name)) {
      setGameStarted(true);
      startNewRound();
    }
  };

  const startNewRound = async () => {
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    setRoundDifficulty(randomDifficulty);
    const word = await getRandomWord(randomDifficulty);
    setCurrentWord(word);
    setTimeout(() => {
      speak(
        `It's ${players[currentPlayerIndex].name}'s turn. The difficulty is ${randomDifficulty}. The word is ${word}.`
      );
    }, 500);
  };

  const handleGuess = () => {
    if (inputValue.toLowerCase() === currentWord.toLowerCase()) {
      const newPlayers = [...players];
      newPlayers[currentPlayerIndex].score += 1;
      setPlayers(newPlayers);
      speak(praises[Math.floor(Math.random() * praises.length)]);
    } else {
      speak(insults[Math.floor(Math.random() * insults.length)]);
    }
    setInputValue('');
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
  };

  useEffect(() => {
    if (gameStarted) {
      // Start a new round when current player index changes
      startNewRound();
    }
  }, [currentPlayerIndex, gameStarted]);

  const handleGetWord = async () => {
    const word = await getRandomWord(roundDifficulty);
    setCurrentWord(word);
    speak(`The word is ${word}.`);
  };

  const handleRandomInsult = () => {
    speak(insults[Math.floor(Math.random() * insults.length)]);
  };

  const handleGameOver = () => {
    const maxScore = Math.max(...players.map((p) => p.score));
    const winningPlayer = players.find((p) => p.score === maxScore);
    setWinner(winningPlayer || null);
    setGameOver(true);
    speak(`Game over! The winner is ${winningPlayer?.name}. You are a fucking champion!`);
  };

  const handlePlayerNameBlur = (e: React.FocusEvent<HTMLInputElement>, index: number) => {
    const newName = e.target.value.trim();
    if (newName) {
      const isDuplicate = players.some((player) => player.name.toLowerCase() === newName.toLowerCase());
      if (!isDuplicate) {
        const updatedPlayers = [...players];
        if (updatedPlayers.length > index) {
          updatedPlayers[index].name = newName;
        } else {
          updatedPlayers.push({ name: newName, score: 0 });
        }
        setPlayers(updatedPlayers);
      } else {
        alert('Player name already exists. Please enter a unique name.');
        e.target.value = '';
      }
    }
  };

  return (
    <div className="app-container">
      <h1>Spelling Bee Game</h1>
      {!gameStarted ? (
        <div>
          <h2>Enter Player Names</h2>
          <input
            type="text"
            placeholder="Player 1 Name"
            onBlur={(e) => handlePlayerNameBlur(e, 0)}
          />
          <input
            type="text"
            placeholder="Player 2 Name"
            onBlur={(e) => handlePlayerNameBlur(e, 1)}
          />
          <button
            className="start-game-button"
            onClick={handleStartGame}
            disabled={players.length !== 2 || !players.every((player) => player.name)}
          >
            Start Game
          </button>
        </div>
      ) : (
        <div>
          <h2>Current Player: {players[currentPlayerIndex].name}</h2>
          <p className="text-xl font-semibold mb-4">Difficulty: {roundDifficulty}</p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your guess"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button onClick={handleGuess}>Submit Guess</button>
          <button onClick={handleGetWord} disabled={!gameStarted}>
            Get Word
          </button>
          <button onClick={handleRandomInsult}>Random Insult</button>
          <button onClick={handleGameOver} disabled={!gameStarted}>
            End Game
          </button>
          <div className="score-board">
            <h3>Scores</h3>
            {players.map((player, index) => (
              <p key={index}>
                {player.name}: {player.score}
              </p>
            ))}
          </div>
        </div>
      )}

      {gameOver && winner && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>
            The winner is {winner.name} with {winner.score} points!
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
