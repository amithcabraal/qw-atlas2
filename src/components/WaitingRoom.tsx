import React from 'react';
import { Clock, Users } from 'lucide-react';
import PlayerList from './PlayerList';

interface WaitingRoomProps {
  players: Array<{
    id: string;
    initials: string;
    score: number;
    has_answered: boolean;
  }>;
}

export default function WaitingRoom({ players }: WaitingRoomProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <Clock className="mx-auto h-12 w-12 text-blue-400 animate-pulse" />
            <h1 className="mt-4 text-3xl font-bold text-white">Waiting for Host</h1>
            <p className="mt-2 text-gray-300">The game will begin shortly...</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-300" />
              <h2 className="text-xl font-semibold text-white">
                Players ({players.length})
              </h2>
            </div>
            <PlayerList players={players} />
          </div>

          <div className="text-center text-gray-300 text-sm">
            Get ready! The host will start the game when all players have joined.
          </div>
        </div>
      </div>
    </div>
  );
}
