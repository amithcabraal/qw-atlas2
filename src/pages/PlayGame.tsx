import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const role = searchParams.get('role');
  const playerId = searchParams.get('playerId');

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setError('No game ID provided');
      setLoading(false);
      return;
    }

    let mounted = true;
    let gameChannel: any = null;

    const setupSubscriptions = async () => {
      try {
        // Fetch initial game data
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();

        if (gameError) throw gameError;
        if (!gameData) throw new Error('Game not found');
        
        if (mounted) {
          setGame(gameData);
        }

        // Fetch initial players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId);

        if (playersError) throw playersError;
        
        if (mounted) {
          setPlayers(playersData || []);
          if (playerId && playersData) {
            const player = playersData.find(p => p.id === playerId);
            setCurrentPlayer(player || null);
          }
        }

        // Set up real-time subscriptions
        gameChannel = supabase.channel(`game:${gameId}`)
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
              if (mounted) {
                setGame(payload.new as Game);
              }
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
              if (!mounted) return;

              if (payload.eventType === 'INSERT') {
                setPlayers(current => [...current, payload.new as Player]);
              } else if (payload.eventType === 'UPDATE') {
                setPlayers(current =>
                  current.map(p => p.id === payload.new.id ? payload.new as Player : p)
                );
                if (playerId && payload.new.id === playerId) {
                  setCurrentPlayer(payload.new as Player);
                }
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
              console.log('Answers update:', payload);
              if (!mounted) return;
              
              if (payload.eventType === 'INSERT') {
                setAnswers(current => [...current, payload.new as Answer]);
              }
            }
          );

        await gameChannel.subscribe();
        console.log('All subscriptions established');

      } catch (err) {
        console.error('Error in setup:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load game');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    return () => {
      mounted = false;
      if (gameChannel) {
        console.log('Cleaning up subscriptions');
        supabase.removeChannel(gameChannel);
      }
    };
  }, [gameId, playerId]);

  const handleNextQuestion = async () => {
    if (!game || !gameId) return;

    const nextQuestion = game.current_question + 1;
    if (nextQuestion >= questions.length) {
      await supabase
        .from('games')
        .update({ status: 'finished' })
        .eq('id', gameId);
    } else {
      await supabase
        .from('games')
        .update({
          current_question: nextQuestion,
          status: 'playing'
        })
        .eq('id', gameId);

      await supabase
        .from('players')
        .update({ has_answered: false })
        .eq('game_id', gameId);

      setAnswers([]);
    }
  };

  const handleRevealAnswers = async () => {
    if (!gameId || !game) return;

    await supabase
      .from('games')
      .update({ status: 'revealing' })
      .eq('id', gameId);

    const { data: answersData } = await supabase
      .from('answers')
      .select('*')
      .eq('game_id', gameId)
      .eq('question_id', questions[game.current_question].id);

    if (answersData) {
      setAnswers(answersData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">Game not found</div>
      </div>
    );
  }

  if (!questions[game.current_question]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Game finished!</div>
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
      <div className="text-red-400 text-xl">Invalid game state</div>
    </div>
  );
}
