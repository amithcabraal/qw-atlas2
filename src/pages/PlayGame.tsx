import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { questions } from '../data/questions';
import { Player, Game, Answer } from '../types';
import HostView from '../components/HostView';
import PlayerView from '../components/PlayerView';

export default function PlayGame() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const playerId = searchParams.get('playerId');

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      const { data: gameData } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single();

      if (gameData) {
        setGame(gameData);
      }

      const { data: playersData } = await supabase
        .from('players')
        .select()
        .eq('gameId', gameId);

      if (playersData) {
        setPlayers(playersData);
      }

      if (playerId) {
        const player = playersData?.find(p => p.id === playerId) || null;
        setCurrentPlayer(player);
      }
    };

    fetchGameData();

    // Set up real-time subscriptions
    const gameSubscription = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        setGame(payload.new as Game);
      })
      .subscribe();

    const playerSubscription = supabase
      .channel(`players:${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `gameId=eq.${gameId}`
      }, (payload) => {
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
      })
      .subscribe();

    return () => {
      gameSubscription.unsubscribe();
      playerSubscription.unsubscribe();
    };
  }, [gameId, playerId]);

  const handleNextQuestion = async () => {
    if (!game) return;

    const nextQuestion = game.currentQuestion + 1;
    if (nextQuestion >= questions.length) {
      await supabase
        .from('games')
        .update({ status: 'finished' })
        .eq('id', gameId);
    } else {
      await supabase
        .from('games')
        .update({
          currentQuestion: nextQuestion,
          status: 'playing'
        })
        .eq('id', gameId);

      await supabase
        .from('players')
        .update({ hasAnswered: false })
        .eq('gameId', gameId);

      setAnswers([]);
    }
  };

  const handleRevealAnswers = async () => {
    if (!gameId) return;

    await supabase
      .from('games')
      .update({ status: 'revealing' })
      .eq('id', gameId);

    const { data: answersData } = await supabase
      .from('answers')
      .select()
      .eq('gameId', gameId)
      .eq('questionId', questions[game?.currentQuestion || 0].id);

    if (answersData) {
      setAnswers(answersData);
    }
  };

  if (!game || !questions[game.currentQuestion]) {
    return <div>Loading...</div>;
  }

  if (role === 'host') {
    return (
      <HostView
        gameId={gameId!}
        currentQuestion={game.currentQuestion}
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
        question={questions[game.currentQuestion]}
        hasAnswered={currentPlayer.hasAnswered}
      />
    );
  }

  return <div>Invalid game state</div>;
}