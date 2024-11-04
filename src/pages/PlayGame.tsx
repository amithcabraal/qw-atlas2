import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { questions } from '../data/questions';
import HostView from '../components/HostView';
import PlayerView from '../components/PlayerView';

interface Player {
  id: string;
  initials: string;
  game_id: string;
  score: number;
  has_answered: boolean;
}

interface Game {
  id: string;
  code: string;
  status: 'waiting' | 'playing' | 'revealing' | 'finished';
  current_question: number;
  host_id: string;
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

export default function PlayGame() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const playerId = searchParams.get('playerId');

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      try {
        setLoading(true);
        // Fetch game data
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select()
          .eq('id', gameId)
          .single();

        if (gameError) throw gameError;
        console.log('Game data loaded:', gameData);
        setGame(gameData);

        // Fetch players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select()
          .eq('game_id', gameId);

        if (playersError) throw playersError;
        console.log('Players loaded:', playersData);
        setPlayers(playersData || []);

        if (playerId) {
          const player = playersData?.find(p => p.id === playerId) || null;
          setCurrentPlayer(player);
        }

        // Set up real-time subscriptions
        const gameChannel = supabase.channel(`game-${gameId}`)
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'games',
              filter: `id=eq.${gameId}`
            },
            (payload) => {
              console.log('Game update:', payload);
              setGame(payload.new as Game);
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'players',
              filter: `game_id=eq.${gameId}`
            },
            (payload) => {
              console.log('Players update:', payload);
              setPlayers(current => {
                const updated = [...current];
                const index = updated.findIndex(p => p.id === payload.new.id);
                if (index >= 0) {
                  updated[index] = payload.new;
                } else {
                  updated.push(payload.new);
                }
                return updated;
              });
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
              console.log('Answers update:', payload);
              if (payload.eventType === 'INSERT') {
                setAnswers(current => [...current, payload.new as Answer]);
              }
            }
          );

        gameChannel.subscribe((status) => {
          console.log('Channel status:', status);
        });

        console.log('All subscriptions established');
      } catch (err) {
        console.error('Error fetching game data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, playerId]);

  const handleNextQuestion = async () => {
    if (!game || !gameId) return;

    try {
      console.log("Current Question : ", game.current_question);
      
      const nextQuestion = game.current_question + 1;
      console.log("Increased question number is : ", game.current_question);      

      if (nextQuestion >= questions.length) {
        await supabase
          .from('games')
          .update({ status: 'finished' })
          .eq('id', gameId);
      } else {
        // Clear answers first
        setAnswers([]);
        
        // Update game status and move to next question
        await supabase
          .from('games')
          .update({
            current_question: nextQuestion,
            status: 'playing'
          })
          .eq('id', gameId);

        // Reset player answers
        await supabase
          .from('players')
          .update({ has_answered: false })
          .eq('game_id', gameId);
      }
    } catch (err) {
      console.error('Error advancing to next question:', err);
    }
  };

  const handleRevealAnswers = async () => {
    if (!gameId || !game) return;

    try {
      // Update game status to revealing
      await supabase
        .from('games')
        .update({ status: 'revealing' })
        .eq('id', gameId);

      // Fetch answers for current question only

      console.log("Looking for answers for question id : ", game.current_question);
      
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId)
        .eq('question_id', game.current_question);

      if (answersError) throw answersError;
      console.log('Fetched answers for that question:', answersData);

      if (answersData) {
        setAnswers(answersData);
      }
    } catch (err) {
      console.error('Error revealing answers:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (!game || !questions[game.current_question]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Game not found or invalid state</div>
      </div>
    );
  }

  if (role === 'host') {
    return (
      <HostView
        gameId={gameId!}
        currentQuestion={game.current_question}
        players={players}
        answers={answers}
        onNextQuestion={handleNextQuestion}
        onRevealAnswers={handleRevealAnswers}
      />
    );
  }

  if (role === 'player' && currentPlayer) {
    return (
      <PlayerView
        gameId={gameId!}
        playerId={currentPlayer.id}
        question={questions[game.current_question]}
        hasAnswered={currentPlayer.has_answered}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-white text-xl">Invalid game state</div>
    </div>
  );
}
