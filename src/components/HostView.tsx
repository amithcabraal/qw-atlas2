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
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playersWithScores, setPlayersWithScores] = useState<Player[]>(players);
  const mapRef = useRef<any>(null);
  
  const allPlayersAnswered = players.length > 0 && players.every(p => p.has_answered);
  const isLastQuestion = currentQuestion === 5; // Since we're using 6 questions (0-5)

  useEffect(() => {
    setShowingAnswers(false);
    setDisplayedAnswers([]);
    setIsAnimating(false);
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
    if (!mapRef.current || isAnimating) return;

    console.log('Revealing answers for question:', {
      questionNumber: currentQuestion + 1,
      questionText: question.text,
      correctLocation: {
        latitude: question.latitude,
        longitude: question.longitude
      }
    });

    console.log('Answers to reveal:', propAnswers.filter(a => a.question_id === currentQuestion));

    try {
      setIsAnimating(true);

      // First, fly to the correct location
      console.log('Flying to correct location');
      mapRef.current.flyTo({
        center: [question.longitude, question.latitude],
        zoom: 5,
        duration: 2000
      });

      // Wait for the fly animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show the correct answer marker first
      console.log('Showing correct answer marker');
      const correctAnswer = {
        id: 'correct',
        player_id: 'correct',
        game_id: gameId,
        question_id: currentQuestion,
        latitude: question.latitude,
        longitude: question.longitude,
        distance: 0,
        score: 1000
      };
      setDisplayedAnswers([correctAnswer]);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter and sort answers for current question
      const relevantAnswers = propAnswers
        .filter(a => a.question_id === currentQuestion)
        .sort((a, b) => b.score - a.score);

      console.log('Starting to reveal player answers:', relevantAnswers.length);

      // Reveal answers one by one
      for (let i = 0; i < relevantAnswers.length; i++) {
        const answer = relevantAnswers[i];
        const player = players.find(p => p.id === answer.player_id);
        console.log('Revealing answer for player:', {
          player: player?.initials,
          score: answer.score,
          location: {
            latitude: answer.latitude,
            longitude: answer.longitude
          }
        });

        const isTopScore = i < 3;
        const delay = isTopScore ? 1000 : 500;

        // For top scores, adjust the map view
        if (isTopScore) {
          console.log('Flying to top score answer');
          mapRef.current.flyTo({
            center: [answer.longitude, answer.latitude],
            zoom: 4,
            duration: 1000
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Add this answer to the displayed answers
        setDisplayedAnswers(prev => [...prev, answer]);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Finally, show the full view
      console.log('Showing final overview');
      mapRef.current.flyTo({
        center: [question.longitude, question.latitude],
        zoom: 3,
        duration: 1500
      });
    } catch (error) {
      console.error('Animation error:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleReveal = async () => {
    if (isAnimating || !allPlayersAnswered) return;

    try {
      setIsAnimating(true);
      setError(null);
      await onRevealAnswers();
      setShowingAnswers(true);
    } catch (err) {
      console.error('Error revealing answers:', err);
      setError('Failed to reveal answers');
    } finally {
      setIsAnimating(false);
    }
  };

  // Calculate markers based on current state
  const markers = showingAnswers ? [
    // Correct location marker
    ...(displayedAnswers.some(a => a.player_id === 'correct') ? [{
      latitude: question.latitude,
      longitude: question.longitude,
      color: 'text-green-500',
      fill: true,
      label: 'Correct Location'
    }] : []),
    // Player answer markers
    ...displayedAnswers
      .filter(a => a.player_id !== 'correct')
      .map(answer => {
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
                disabled={isAnimating}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 
                         text-white rounded-lg font-medium transition-colors 
                         flex items-center justify-center gap-2
                         disabled:bg-blue-800 disabled:cursor-not-allowed"
              >
                <Eye className="w-5 h-5" />
                Reveal Answers
              </button>
            )}
            {showingAnswers && !isAnimating && (
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
