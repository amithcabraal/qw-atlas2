import React, { useState, useEffect, useRef } from 'react';
import { Play, Eye, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import QuestionCard from './QuestionCard';
import PlayerList from './PlayerList';
import MapComponent from './MapComponent';

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
  lastScore?: number;
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
  question: Question;
}

export default function HostView({
  gameId,
  currentQuestion,
  players,
  answers: propAnswers,
  onNextQuestion,
  onRevealAnswers,
  question
}: HostViewProps) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [displayedAnswers, setDisplayedAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [playersWithScores, setPlayersWithScores] = useState<Player[]>(players);
  const mapRef = useRef<any>(null);
  
  const allPlayersAnswered = players.length > 0 && players.every(p => p.has_answered);
  const isLastQuestion = currentQuestion === 5;

  // Reset state when question changes
  useEffect(() => {
    setIsRevealing(false);
    setDisplayedAnswers([]);
    setError(null);
    setPlayersWithScores(players.map(player => ({
      ...player,
      lastScore: player.score
    })));
  }, [currentQuestion, players]);

  const revealAnswersSequentially = async () => {
    if (!mapRef.current || isRevealing) return;

    try {
      setIsRevealing(true);
      setDisplayedAnswers([]); // Clear existing markers

      console.log('Starting reveal sequence:', {
        questionId: question.id,
        currentQuestion,
        correctLocation: { lat: question.latitude, lng: question.longitude }
      });

      // First, fly to the correct location
      mapRef.current.flyTo({
        center: [question.longitude, question.latitude],
        zoom: 5,
        duration: 2000
      });

      // Wait for initial fly animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add correct answer marker
      const correctMarker = {
        id: 'correct',
        player_id: 'correct',
        game_id: gameId,
        question_id: question.id - 1,
        latitude: question.latitude,
        longitude: question.longitude,
        distance: 0,
        score: 1000
      };
      setDisplayedAnswers([correctMarker]);

      // Wait for correct marker to appear
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get and sort player answers
      const relevantAnswers = propAnswers
        .filter(a => a.question_id === question.id - 1)
        .sort((a, b) => b.score - a.score);

      console.log('Player answers to reveal:', {
        total: relevantAnswers.length,
        answers: relevantAnswers
      });

      // Reveal each player answer
      for (const answer of relevantAnswers) {
        const player = players.find(p => p.id === answer.player_id);
        console.log('Revealing answer:', {
          player: player?.initials,
          score: answer.score,
          location: { lat: answer.latitude, lng: answer.longitude }
        });

        // For top 3 scores, do a fly animation
        if (answer.score >= relevantAnswers[2]?.score) {
          mapRef.current.flyTo({
            center: [answer.longitude, answer.latitude],
            zoom: 4,
            duration: 1000
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setDisplayedAnswers(prev => [...prev, answer]);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Final overview
      mapRef.current.flyTo({
        center: [question.longitude, question.latitude],
        zoom: 3,
        duration: 1500
      });

    } catch (err) {
      console.error('Error in reveal sequence:', err);
      setError('Failed to reveal answers');
    }
  };

  const handleReveal = async () => {
    if (isRevealing || !allPlayersAnswered) return;

    try {
      await onRevealAnswers();
      revealAnswersSequentially();
    } catch (err) {
      console.error('Error revealing answers:', err);
      setError('Failed to reveal answers');
    }
  };

  // Transform displayed answers into markers
  const markers = displayedAnswers.map(answer => {
    if (answer.player_id === 'correct') {
      return {
        latitude: answer.latitude,
        longitude: answer.longitude,
        color: 'text-green-500',
        fill: true,
        label: 'Correct Location'
      };
    }

    const player = players.find(p => p.id === answer.player_id);
    return {
      latitude: answer.latitude,
      longitude: answer.longitude,
      color: 'text-red-500',
      fill: true,
      label: `${player?.initials || 'Unknown'} (${answer.score} pts)`
    };
  });

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <QuestionCard 
            question={question} 
            questionNumber={currentQuestion}
            showHint={true} 
          />
          <div className="mt-4 space-y-4">
            {allPlayersAnswered && !isRevealing && displayedAnswers.length === 0 && (
              <button
                onClick={handleReveal}
                disabled={isRevealing}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 
                         text-white rounded-lg font-medium transition-colors 
                         flex items-center justify-center gap-2
                         disabled:bg-blue-800 disabled:cursor-not-allowed"
              >
                <Eye className="w-5 h-5" />
                Reveal Answers
              </button>
            )}
            {displayedAnswers.length > 0 && !isRevealing && (
              <button
                onClick={onNextQuestion}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 
                         text-white rounded-lg font-medium transition-colors 
                         flex items-center justify-center gap-2"
              >
                {isLastQuestion ? (
                  <>
                    <Trophy className="w-5 h-5" />
                    Complete Game
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Next Question
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Players ({players.filter(p => p.has_answered).length}/{players.length} answered)
          </h2>
          <PlayerList 
            players={playersWithScores} 
            showAnswered={!isRevealing}
            isGameComplete={isLastQuestion && displayedAnswers.length > 0} 
          />
        </div>
      </div>
      <div className="h-[400px] rounded-xl overflow-hidden">
        <MapComponent 
          ref={mapRef}
          markers={markers}
          interactive={!isRevealing}
          showLabels={displayedAnswers.length > 0}
          showMarkerLabels={displayedAnswers.length > 0}
        />
      </div>
    </div>
  );
}
