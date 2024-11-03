import React, { useState } from 'react';
import { Question } from '../types';
import QuestionCard from './QuestionCard';
import MapComponent from './MapComponent';
import { supabase } from '../lib/supabase';
import { calculateDistance } from '../lib/utils';

interface PlayerViewProps {
  gameId: string;
  playerId: string;
  question: Question;
  hasAnswered: boolean;
}

export default function PlayerView({
  gameId,
  playerId,
  question,
  hasAnswered
}: PlayerViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  const handleMapClick = async (e: { lngLat: [number, number] }) => {
    if (hasAnswered) return;

    const [longitude, latitude] = e.lngLat;
    setSelectedLocation([longitude, latitude]);

    const distance = calculateDistance(
      latitude,
      longitude,
      question.latitude,
      question.longitude
    );

    // Calculate score based on distance (max 1000 points, minimum 0)
    const score = Math.max(0, Math.floor(1000 * Math.exp(-distance / 1000)));

    await supabase.from('answers').insert({
      playerId,
      gameId,
      questionId: question.id,
      latitude,
      longitude,
      distance,
      score
    });

    await supabase
      .from('players')
      .update({ hasAnswered: true, score: score })
      .eq('id', playerId);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <QuestionCard question={question} />
      <div className="h-[400px] rounded-xl overflow-hidden">
        <MapComponent
          onMapClick={hasAnswered ? undefined : handleMapClick}
          markers={selectedLocation ? [{ longitude: selectedLocation[0], latitude: selectedLocation[1] }] : []}
        />
      </div>
      {hasAnswered && (
        <div className="text-center text-white text-lg">
          Answer submitted! Waiting for other players...
        </div>
      )}
    </div>
  );
}