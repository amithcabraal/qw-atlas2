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
    const fetchGameData = async () => {
      if (!gameId) {
        setError('No game ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch game data
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();

        if (gameError) throw gameError;
        if (!gameData) throw new Error('Game not found');

        setGame(gameData);

        // Fetch players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId);

        if (playersError) throw playersError;
        setPlayers(playersData || []);

        // Set current player if in player mode
        if (playerId && playersData) {
          const player = playersData.find(p => p.id === playerId);
          setCurrentPlayer(player || null);
        }

        // Subscribe to real-time updates
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
              if (payload.eventType === 'INSERT') {
                setPlayers(current => [...current, payload.new as Player]);
              } else if (payload.eventType === 'UPDATE') {
                setPlayers(current =>
                  current.map(p => p.id === payload.new.id ? payload.new as Player : p)
                );
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
              if (payload.eventType === 'INSERT') {
                setAnswers(current => [...current, payload.new as Answer]);
              }
            }
          );

        gameChannel.subscribe((status) => {
          console.log('Game channel status:', status);
        });

      } catch (err) {
        console.error('Error fetching game data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, playerId]);

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
        onNextQuestion={async () => {
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
        }}
        onRevealAnswers={async () => {
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
        }}
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
