import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { questions } from '../data/questions';
import { getRandomQuestions } from '../lib/gameUtils';
import HostView from '../components/HostView';
import PlayerView from '../components/PlayerView';
import GameComplete from '../components/GameComplete';
import { useGameActions } from '../hooks/useGameActions';

// Get 6 random questions for the game
const DEFAULT_QUESTIONS = getRandomQuestions(questions);

export default function PlayGame() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const playerId = searchParams.get('playerId');
  const navigate = useNavigate();

  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameQuestions, setGameQuestions] = useState(DEFAULT_QUESTIONS);

  const { handleNextQuestion, handleRevealAnswers, error: actionError } = useGameActions(gameId, gameQuestions.length);

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
        setGame(gameData);

        // Fetch players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select()
          .eq('game_id', gameId);

        if (playersError) throw playersError;
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
              const updatedGame = payload.new;
              setGame(updatedGame);
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
              if (payload.eventType === 'UPDATE') {
                setPlayers(current => 
                  current.map(p => 
                    p.id === payload.new.id ? payload.new : p
                  )
                );
                if (playerId && payload.new.id === playerId) {
                  setCurrentPlayer(payload.new);
                }
              } else if (payload.eventType === 'INSERT') {
                setPlayers(current => [...current, payload.new]);
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
              if (payload.eventType === 'INSERT') {
                setAnswers(current => [...current, payload.new]);
              }
            }
          );

        gameChannel.subscribe();
        return () => {
          supabase.removeChannel(gameChannel);
        };
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError('Failed to load game data');
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

  if (error || actionError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">{error || actionError}</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Game not found</div>
      </div>
    );
  }

  if (game.status === 'finished') {
    return <GameComplete players={players} />;
  }

  const currentQuestionData = gameQuestions[game.current_question];
  
  if (!currentQuestionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Invalid question state</div>
      </div>
    );
  }

  if (role === 'host') {
    return (
      <HostView
        gameId={gameId}
        currentQuestion={game.current_question}
        players={players}
        answers={answers}
        onNextQuestion={() => handleNextQuestion(game.current_question)}
        onRevealAnswers={() => handleRevealAnswers(game.current_question)}
        question={currentQuestionData}
      />
    );
  }

  if (role === 'player' && currentPlayer) {
    return (
      <PlayerView
        gameId={gameId}
        playerId={currentPlayer.id}
        question={currentQuestionData}
        questionNumber={game.current_question}
        hasAnswered={currentPlayer.has_answered}
        gameStatus={game.status}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-white text-xl">Invalid game state</div>
    </div>
  );
}
