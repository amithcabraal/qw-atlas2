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
  answers: propAnswers,
  onNextQuestion,
  onRevealAnswers
}: HostViewProps) {
  const [showingAnswers, setShowingAnswers] = useState(false);
  const [displayedAnswers, setDisplayedAnswers] = useState<Answer[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const question = questions[currentQuestion];
  const allPlayersAnswered = players.length > 0 && players.every(p => p.has_answered);

  // Reset state when question changes
  useEffect(() => {
    console.log('Question changed, resetting state');
    setShowingAnswers(false);
    setDisplayedAnswers([]);
    setIsRevealing(false);
  }, [currentQuestion]);

  // Update displayed answers when answers prop changes and we're showing answers
  useEffect(() => {
    if (showingAnswers) {
      console.log('Updating displayed answers:', propAnswers);
      setDisplayedAnswers(propAnswers);
    }
  }, [propAnswers, showingAnswers]);

  // Prepare markers for the map
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
        label: player?.initials || 'Unknown'
      };
    })
  ] : [];

  const handleReveal = async () => {
    if (isRevealing) return;

    try {
      setIsRevealing(true);
      setShowingAnswers(true);
      
      // Notify parent to update game status
      onRevealAnswers();

      // Fetch answers directly
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId)
        .eq('question_id', currentQuestion);

      if (answersError) throw answersError;

      if (answersData) {
        console.log('Fetched answers on reveal:', answersData);
        setDisplayedAnswers(answersData);
      }
    } catch (err) {
      console.error('Error revealing answers:', err);
      setShowingAnswers(false);
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
        <div className="space-y-4">
          <QuestionCard question={question} showHint={true} />
          <div className="space-y-4">
            <button
              onClick={handleReveal}
              disabled={!allPlayersAnswered || isRevealing}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                       text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              {!allPlayersAnswered 
                ? 'Waiting for all players...' 
                : isRevealing 
                  ? 'Revealing...' 
                  : showingAnswers
                    ? 'Show Answers Again'
                    : 'Reveal Answers'}
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
          interactive={true}
          showLabels={false}
          showMarkerLabels={true}
        />
      </div>
    </div>
  );
}
