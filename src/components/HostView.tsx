import React, { useState, useEffect } from 'react';
import { Play, Eye } from 'lucide-react';
import QuestionCard from './QuestionCard';
import PlayerList from './PlayerList';
import MapComponent from './MapComponent';
import { questions } from '../data/questions';
import { supabase } from '../lib/supabase';

interface Player {
  id: string;
  initials: string;
  game_id: string;
  score: number;
  has_answered: boolean;
}

interface Answer {
  id: string;
  player_id: string;
  game_id: string;
  question_id: number;
  latitude: number;
  longitude: number;
  distance: number;
  score: number;
}

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
  const allPlayersAnswered = players.length > 0 && players.every(p => p.has_answered);

  const markers = showingAnswers
    ? [
        { 
          latitude: question.latitude, 
          longitude: question.longitude, 
          color: 'text-green-500' 
        },
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

  const handleNext = () => {
    setShowingAnswers(false);
    onNextQuestion();
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <QuestionCard question={question} showHint={true} />
          <div className="space-y-4">
            <button
              onClick={handleReveal}
              disabled={!allPlayersAnswered || showingAnswers}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                       text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              {allPlayersAnswered ? 'Reveal Answers' : 'Waiting for all players...'}
            </button>
            {showingAnswers && (
              <button
                onClick={handleNext}
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
          <h2 className="text-xl font-semibold text-white mb-4">
            Players ({players.length})
          </h2>
          <PlayerList players={players} showAnswered={true} />
        </div>
      </div>
      <div className="h-[400px] rounded-xl overflow-hidden">
        <MapComponent 
          markers={markers} 
          interactive={false}
          showLabels={false}
        />
      </div>
    </div>
  );
}
