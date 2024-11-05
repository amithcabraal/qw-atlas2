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
  const [showingAnswers, setShowingAnswers] = useState(false);
  const [displayedAnswers, setDisplayedAnswers] = useState<Answer[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [playersWithScores, setPlayersWithScores] = useState<Player[]>(players);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  
  const allPlayersAnswered = players.length > 0 && players.every(p => p.has_answered);
  const isLastQuestion = currentQuestion === 5; // Since we're using 6 questions (0-5)

  useEffect(() => {
    setShowingAnswers(false);
    setDisplayedAnswers([]);
    setIsRevealing(false);
    setError(null);
    setPlayersWithScores(players.map(player => ({
      ...player,
      lastScore: player.score
    })));
  }, [currentQuestion]);

  useEffect(() => {
    if (showingAnswers) {
      revealAnswersSequentially();
    }
  }, [showingAnswers]);

  const revealAnswersSequentially = async () => {
    if (!mapRef.current) return;

    // First, fly to the correct location
    mapRef.current.flyTo({
      center: [question.longitude, question.latitude],
      zoom: 5,
      duration: 2000
    });

    // Wait for the fly animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const relevantAnswers = propAnswers
      .filter(a => a.question_id === currentQuestion)
      .sort((a, b) => b.distance - a.distance); // Sort by distance, furthest first

    // Reveal answers one by one
    for (let i = 0; i < relevantAnswers.length; i++) {
      const isTopFive = i >= relevantAnswers.length - 5;
      const delay = isTopFive ? 1000 : 500; // Longer delay for top 5

      // If it's a top 5 answer, adjust the map view
      if (isTopFive) {
        const answer = relevantAnswers[i];
        mapRef.current.flyTo({
          center: [answer.longitude, answer.latitude],
          zoom: 4,
          duration: 1000
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setDisplayedAnswers(prev => [...prev, relevantAnswers[i]]);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Finally, show the full view
    mapRef.current.flyTo({
      center: [question.longitude, question.latitude],
      zoom: 3,
      duration: 1500
    });
  };

  const handleReveal = async () => {
    if (isRevealing || !allPlayersAnswered) return;

    try {
      setIsRevealing(true);
      setError(null);
      await onRevealAnswers();
      setShowingAnswers(true);
    } catch (err) {
      console.error('Error revealing answers:', err);
      setError('Failed to reveal answers');
    } finally {
      setIsRevealing(false);
    }
  };

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
            {allPlayersAnswered && !showingAnswers && (
              <button
                onClick={handleReveal}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 
                         text-white rounded-lg font-medium transition-colors 
                         flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Reveal Answers
              </button>
            )}
            {showingAnswers && (
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
            showAnswered={!showingAnswers}
            isGameComplete={isLastQuestion && showingAnswers} 
          />
        </div>
      </div>
      <div className="h-[400px] rounded-xl overflow-hidden">
        <MapComponent 
          ref={mapRef}
          markers={markers}
          interactive={true}
          showLabels={showingAnswers}
          showMarkerLabels={showingAnswers}
        />
      </div>
    </div>
  );
}
