import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PlayerList from '../components/PlayerList';
import ShareButton from '../components/ShareButton';
import { useSupabaseSubscription } from '../hooks/useSupabaseSubscription';
import { useGameSharing } from '../hooks/useGameSharing';
import type { Player } from '../types';

function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function HostGame() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { shareGame, copied } = useGameSharing();

  useEffect(() => {
    const createGame = async () => {
      try {
        setIsLoading(true);
        const code = generateGameCode();
        const hostId = crypto.randomUUID();
        
        const { data: game, error: insertError } = await supabase
          .from('games')
          .insert({
            code,
            status: 'waiting',
            current_question: 0,
            host_id: hostId
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        if (game) {
          setGameCode(code);
          setGameId(game.id);
        } else {
          throw new Error('Failed to create game');
        }
      } catch (err) {
        setError('Failed to create game. Please try again.');
        console.error('Error creating game:', err);
      } finally {
        setIsLoading(false);
      }
    };

    createGame();
  }, []);

  useSupabaseSubscription(
    gameId ? `game:${gameId}` : null,
    'player_joined',
    (payload) => {
      setPlayers((current) => [...current, payload.player]);
    }
  );

  const handleShare = async () => {
    if (!gameCode) {
      setError('No game code available to share');
      return;
    }
    await shareGame(gameCode);
  };

  const startGame = async () => {
    if (!gameId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('games')
        .update({ status: 'playing' })
        .eq('id', gameId);

      if (updateError) throw updateError;
      
      navigate(`/play/${gameId}?role=host`);
    } catch (err) {
      setError('Failed to start game. Please try again.');
      console.error('Error starting game:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <Users className="mx-auto h-12 w-12 text-blue-400" />
            <h1 className="mt-4 text-3xl font-bold text-white">Host Game</h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <div className="mb-8">
            <div className="bg-white/5 p-6 rounded-lg text-center">
              <p className="text-gray-300 mb-2">Game Code:</p>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-white/10 rounded mb-4"></div>
                </div>
              ) : (
                <p className="text-5xl font-mono font-bold text-white tracking-wider mb-4">
                  {gameCode}
                </p>
              )}
              <ShareButton 
                onClick={handleShare} 
                copied={copied} 
                disabled={!gameCode || isLoading}
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Players ({players.length})
            </h2>
            <PlayerList players={players} />
          </div>

          <button
            onClick={startGame}
            disabled={players.length === 0 || !gameCode || isLoading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                     text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Game ({players.length} {players.length === 1 ? 'player' : 'players'})
          </button>
        </div>
      </div>
    </div>
  );
}
