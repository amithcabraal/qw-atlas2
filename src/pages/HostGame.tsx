import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PlayerList from '../components/PlayerList';
import { useSupabaseSubscription } from '../hooks/useSupabaseSubscription';
import type { Player, Game } from '../types';

export default function HostGame() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string>('');

  useEffect(() => {
    const createGame = async () => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: game } = await supabase
        .from('games')
        .insert({
          code,
          status: 'waiting',
          currentQuestion: 0,
          hostId: crypto.randomUUID()
        })
        .select()
        .single();

      if (game) {
        setGameCode(code);
        setGameId(game.id);
      }
    };

    createGame();
  }, []);

  useSupabaseSubscription(
    `game:${gameId}`,
    'player_joined',
    (payload) => {
      setPlayers((current) => [...current, payload.player]);
    }
  );

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/join/${gameCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my GeoQuiz game!',
          text: `Join my game with code: ${gameCode}`,
          url: shareUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      // Show toast notification (you might want to add a toast component)
    }
  };

  const startGame = async () => {
    await supabase
      .from('games')
      .update({ status: 'playing' })
      .eq('id', gameId);
    
    navigate(`/play/${gameId}?role=host`);
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-6">Host Game</h1>
        
        <div className="mb-8">
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
            <div>
              <p className="text-gray-300">Game Code:</p>
              <p className="text-4xl font-mono font-bold text-white">{gameCode}</p>
            </div>
            <button
              onClick={handleShare}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            >
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Players ({players.length})</h2>
          <PlayerList players={players} />
        </div>

        <button
          onClick={startGame}
          disabled={players.length === 0}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                   text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Start Game
        </button>
      </div>
    </div>
  );
}