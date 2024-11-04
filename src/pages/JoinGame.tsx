import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from 'lucide-react';

export default function JoinGame() {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [initials, setInitials] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (initials.length < 2 || initials.length > 3) {
      setError('Initials must be 2-3 characters');
      return;
    }

    try {
      setIsJoining(true);
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('code', gameCode)
        .single();

      if (gameError || !game) {
        setError('Game not found');
        return;
      }

      if (game.status !== 'waiting') {
        setError('Game has already started');
        return;
      }

      const playerId = crypto.randomUUID();
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          id: playerId,
          initials: initials.toUpperCase(),
          game_id: game.id,
          score: 0,
          has_answered: false
        });

      if (playerError) {
        throw playerError;
      }

      navigate(`/play/${game.id}?role=player&playerId=${playerId}`);
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
        <div className="text-center mb-8">
          <User className="mx-auto h-12 w-12 text-blue-400" />
          <h1 className="text-3xl font-bold text-white mt-4">Join Game</h1>
          <p className="text-gray-300 mt-2">Game Code: {gameCode}</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label htmlFor="initials" className="block text-sm font-medium text-gray-300">
              Enter your initials
            </label>
            <input
              type="text"
              id="initials"
              maxLength={3}
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              className="mt-1 block w-full px-3 py-2 bg-white/5 border border-gray-600 
                       rounded-md text-white placeholder-gray-400 focus:outline-none 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ABC"
              disabled={isJoining}
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isJoining}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 
                     text-white rounded-lg font-medium transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
}
