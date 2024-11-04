import React, { useState, useEffect } from 'react';
import { Play, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import QuestionCard from './QuestionCard';
import PlayerList from './PlayerList';
import MapComponent from './MapComponent';
import { questions } from '../data/questions';

interface Question {
  id: number;
  text: string;
  latitude: number;
  longitude: number;
  image?: string;
  hint?: string;
}

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
  answers: propAnswers,
  onNextQuestion,
  onRevealAnswers
}: HostViewProps) {
  const [showingAnswers, setShowingAnswers] = useState(false);
  const [displayedAnswers, setDisplayedAnswers] = useState<Answer[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const question = questions[currentQuestion];
  const allPlayersAnswered = players.length > 0 && players.every(p => p.has_answered);

  useEffect(() => {
    setShowingAnswers(false);
    setDisplayedAnswers([]);
    setIsRevealing(false);
  }, [currentQuestion]);

  useEffect(() => {
    if (showingAnswers) {
      const relevantAnswers = propAnswers.filter(a => a.question_id === currentQuestion);
      setDisplayedAnswers(relevantAnswers);
    } else {
     // setDisplayedAnswers([]);
    }
  }, [propAnswers, showingAnswers, currentQuestion]);

  const markers = showingAnswers ? [
    { 
      latitude: question.latitude, 
      longitude: question.longitude, 
      color: 'text-green-500',
      fill: true,
      label: 'Correct Location'
    },
    ...displayedAnswers.map(answer => {
      const player = players.find(p => p.id === answer.player_id);
      return {
        latitude: answer.latitude,
        longitude: answer.longitude,
        color: 'text-red-500',
        fill: true,
        label: `${player?.initials || 'Unknown'} (${answer.score} pts)`
      };
    })
  ] : [];

  const handleReveal = async () => {
    if (isRevealing || !allPlayersAnswered) return;

    try {
      setIsRevealing(true);
      await onRevealAnswers();
      setShowingAnswers(true);
    } catch (err) {
      console.error('Error revealing answers:', err);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleNext = () => {
    setShowingAnswers(false);
    setDisplayedAnswers([]);
    onNextQuestion();
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <QuestionCard question={question} showHint={true} />
          <div className="mt-4 space-y-4">
            <button
              onClick={handleReveal}
              disabled={!allPlayersAnswered || showingAnswers || isRevealing}
              className={`w-full py-3 px-4 ${
                allPlayersAnswered && !showingAnswers
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-600'
              } text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
            >
              <Eye className="w-5 h-5" />
              {isRevealing ? 'Revealing...' : 'Reveal Answers'}
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
            Players ({players.filter(p => p.has_answered).length}/{players.length} answered)
          </h2>
          <PlayerList players={players} showAnswered={true} />
        </div>
      </div>
      <div className="h-[400px] rounded-xl overflow-hidden">
        <MapComponent 
          markers={markers} 
          interactive={true}
          showLabels={showingAnswers}
          showMarkerLabels={showingAnswers}
        />
      </div>
    </div>
  );
}
