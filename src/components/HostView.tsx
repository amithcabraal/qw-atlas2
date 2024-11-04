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
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);
  const [currentAnswers, setCurrentAnswers] = useState<Answer[]>([]);
  const question = questions[currentQuestion];
  const allPlayersAnswered = localPlayers.length > 0 && localPlayers.every(p => p.has_answered);

  // Update local players when props change
  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  // Update current answers when answers prop changes or showingAnswers changes
  useEffect(() => {
    if (showingAnswers) {
      const filteredAnswers = answers.filter(a => a.question_id === question.id);
      console.log('Setting current answers:', filteredAnswers);
      setCurrentAnswers(filteredAnswers);
    }
  }, [answers, question.id, showingAnswers]);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up host view subscriptions');
    
    const channel = supabase.channel(`host-view-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Player update received:', payload);
          if (payload.eventType === 'UPDATE') {
            setLocalPlayers(current => 
              current.map(p => 
                p.id === payload.new.id ? { ...p, ...payload.new } : p
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setLocalPlayers(current => [...current, payload.new as Player]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Answer update received:', payload);
          if (payload.eventType === 'INSERT' && showingAnswers) {
            const newAnswer = payload.new as Answer;
            if (newAnswer.question_id === question.id) {
              setCurrentAnswers(current => [...current, newAnswer]);
            }
          }
        }
      );

    channel.subscribe((status) => {
      console.log('Host view subscription status:', status);
    });

    return () => {
      console.log('Cleaning up host view subscriptions');
      supabase.removeChannel(channel);
    };
  }, [gameId, question.id, showingAnswers]);

  // Prepare markers for the map
  const markers = showingAnswers
    ? [
        { 
          latitude: question.latitude, 
          longitude: question.longitude, 
          color: 'text-green-500',
          fill: true,
          label: 'Correct Location'
        },
        ...currentAnswers.map(answer => {
          const player = localPlayers.find(p => p.id === answer.player_id);
          return {
            latitude: answer.latitude,
            longitude: answer.longitude,
            color: 'text-red-500',
            fill: true,
            label: player?.initials || 'Unknown'
          };
        })
      ]
    : [];

  const handleNext = () => {
    setShowingAnswers(false);
    setCurrentAnswers([]);
    onNextQuestion();
  };

  const handleReveal = async () => {
    // First set the state
    setShowingAnswers(true);
    
    try {
      // Then fetch all answers for the current question
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId)
        .eq('question_id', question.id);

      if (answersError) throw answersError;

      if (answersData) {
        console.log('Fetched answers on reveal:', answersData);
        setCurrentAnswers(answersData);
      }

      // Finally notify parent
      onRevealAnswers();
    } catch (err) {
      console.error('Error fetching answers:', err);
    }
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
            Players ({localPlayers.length})
          </h2>
          <PlayerList players={localPlayers} showAnswered={true} />
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
