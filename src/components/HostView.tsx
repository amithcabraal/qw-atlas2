import React, { useState } from 'react';
import { Play, Eye } from 'lucide-react';
import { Question, Player, Answer } from '../types';
import QuestionCard from './QuestionCard';
import PlayerList from './PlayerList';
import MapComponent from './MapComponent';
import { questions } from '../data/questions';

interface HostViewProps {
  gameId: string;
  currentQuestion: number;
  players: Player[];
  answers: Answer[];
  onNextQuestion: () => void;
  onRevealAnswers: () => void;
}

export default function HostView({
  gameId,
  currentQuestion,
  players,
  answers,
  onNextQuestion,
  onRevealAnswers
}: HostViewProps) {
  const [showingAnswers, setShowingAnswers] = useState(false);
  const question = questions[currentQuestion];
  const allPlayersAnswered = players.every(p => p.hasAnswered);

  const markers = showingAnswers
    ? [
        { latitude: question.latitude, longitude: question.longitude, color: 'text-green-500' },
        ...answers.map(answer => ({
          latitude: answer.latitude,
          longitude: answer.longitude,
          color: 'text-red-500'
        }))
      ]
    : [];

  const handleReveal = () => {
    setShowingAnswers(true);
    onRevealAnswers();
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <QuestionCard question={question} showHint={true} />
          <div className="mt-4 space-y-4">
            <button
              onClick={handleReveal}
              disabled={!allPlayersAnswered || showingAnswers}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                       text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Reveal Answers
            </button>
            {showingAnswers && (
              <button
                onClick={() => {
                  setShowingAnswers(false);
                  onNextQuestion();
                }}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 
                         text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Next Question
              </button>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Players</h2>
          <PlayerList players={players} showAnswered={true} />
        </div>
      </div>
      <div className="h-[400px] rounded-xl overflow-hidden">
        <MapComponent markers={markers} interactive={false} />
      </div>
    </div>
  );
}