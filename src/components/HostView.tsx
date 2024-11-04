import React, { useState, useEffect } from 'react';
import { Play, Eye, Trophy } from 'lucide-react';
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
  const [playersWithScores, setPlayersWithScores] = useState<Player[]>(players);
  const [error, setError] = useState<string | null>(null);
  
  const question = questions[currentQuestion];
  const allPlayersAnswered = players.length > 0 && players.every(p => p.has_answered);
  const isLastQuestion = currentQuestion === questions.length - 1;

  useEffect(() => {
    setShowingAnswers(false);
    setDisplayedAnswers([]);
    setIsRevealing(false);
    setError(null);
    // Store current scores as lastScore when moving to next question
    setPlayersWithScores(players.map(player => ({
      ...player,
      lastScore: player.score
    })));
  }, [currentQuestion]);

  useEffect(() => {
    if (showingAnswers) {
      const relevantAnswers = propAnswers.filter(a => a.question_id === currentQuestion);
      setDisplayedAnswers(relevantAnswers);
    }
  }, [propAnswers, showingAnswers, currentQuestion]);

  // Auto-reveal answers when all players have submitted
  useEffect(() => {
    if (allPlayersAnswered && !showingAnswers && !isRevealing) {
      handleReveal();
    }
  }, [allPlayersAnswered]);

  // Update players with score changes
  useEffect(() => {
    setPlayersWithScores(players.map(player => ({
      ...player,
      lastScore: playersWithScores.find(p => p.id === player.id)?.lastScore
    })));
  }, [players]);

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

  const handleNext = async () => {
    try {
      setError(null);
      await onNextQuestion();
    } catch (err) {
      console.error('Error moving to next question:', err);
      setError('Failed to move to next question');
    }
  };

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <QuestionCard question={question} showHint={true} />
          <div className="mt-4 space-y-4">
            {showingAnswers && (
              <button
                onClick={handleNext}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 
                         text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
          markers={markers}
          interactive={true}
          showLabels={showingAnswers}
          showMarkerLabels={showingAnswers}
        />
      </div>
    </div>
  );
}
