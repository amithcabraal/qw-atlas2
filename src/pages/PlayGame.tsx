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
          console.log('Game data loaded:', gameData);
        }

        // Fetch initial players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId);

        if (playersError) throw playersError;
        
        if (mounted) {
          setPlayers(playersData || []);
          console.log('Players loaded:', playersData);
          if (playerId && playersData) {
            const player = playersData.find(p => p.id === playerId);
            setCurrentPlayer(player || null);
          }
        }

        // Fetch current answers if in revealing state
        if (gameData.status === 'revealing') {
          const { data: answersData, error: answersError } = await supabase
            .from('answers')
            .select('*')
            .eq('game_id', gameId)
            .eq('question_id', gameData.current_question);

          if (answersError) throw answersError;

          if (mounted && answersData) {
            setAnswers(answersData);
            console.log('Answers loaded:', answersData);
          }
        }

      } catch (err) {
        console.error('Error in initial data fetch:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load game');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up real-time subscriptions
    const gameChannel = supabase.channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          console.log('Game update:', payload);
          if (mounted) {
            setGame(payload.new as Game);
            // Clear answers when moving to next question
            if (payload.new.current_question !== payload.old?.current_question) {
              setAnswers([]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
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
      );

    const answersChannel = supabase.channel(`answers:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'answers', filter: `game_id=eq.${gameId}` },
        (payload) => {
          console.log('Answers update:', payload);
          if (!mounted) return;

          if (payload.eventType === 'INSERT') {
            setAnswers(current => [...current, payload.new as Answer]);
          }
        }
      );

    // Start subscriptions and initial data fetch
    Promise.all([
      gameChannel.subscribe((status) => {
        console.log('Game channel status:', status);
      }),
      answersChannel.subscribe((status) => {
        console.log('Answers channel status:', status);
      }),
      setupSubscriptions()
    ]).catch(err => {
      console.error('Error in setup:', err);
      if (mounted) {
        setError('Failed to initialize game');
      }
    });

    return () => {
      mounted = false;
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(answersChannel);
    };
  }, [gameId, playerId]);

  const handleNextQuestion = async () => {
    if (!game || !gameId) return;

    try {
      const nextQuestion = game.current_question + 1;
      
      if (nextQuestion >= questions.length) {
        await supabase
          .from('games')
          .update({ status: 'finished' })
          .eq('id', gameId);
      } else {
        // Update game status first
        await supabase
          .from('games')
          .update({
            current_question: nextQuestion,
            status: 'playing'
          })
          .eq('id', gameId);

        // Then reset player answers
        await supabase
          .from('players')
          .update({ has_answered: false })
          .eq('game_id', gameId);

        setAnswers([]);
      }
    } catch (err) {
      console.error('Error advancing to next question:', err);
    }
  };

  const handleRevealAnswers = async () => {
    if (!gameId || !game) return;

    try {
      await supabase
        .from('games')
        .update({ status: 'revealing' })
        .eq('id', gameId);

      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId)
        .eq('question_id', game.current_question);

      if (answersError) throw answersError;

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
