import React, { useState, useEffect } from 'react';
import { MapLayerMouseEvent } from 'react-map-gl';
import QuestionCard from './QuestionCard';
import MapComponent from './MapComponent';
import { supabase } from '../lib/supabase';
import { calculateDistance } from '../lib/utils';

interface Question {
  id: number;
  text: string;
  latitude: number;
  longitude: number;
  image?: string;
  hint?: string;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selected location when question changes
  useEffect(() => {
    setSelectedLocation(null);
  }, [question.id]);

  const handleMapClick = (e: MapLayerMouseEvent) => {
    if (hasAnswered || isSubmitting) return;
    
    // Safe access to coordinates
    const lng = e.lngLat?.lng;
    const lat = e.lngLat?.lat;
    
    if (typeof lng === 'number' && typeof lat === 'number') {
      setSelectedLocation([lng, lat]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLocation || hasAnswered || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const [longitude, latitude] = selectedLocation;

      const distance = calculateDistance(
        latitude,
        longitude,
        question.latitude,
        question.longitude
      );

      // Calculate score based on distance (max 1000 points, minimum 0)
      const score = Math.max(0, Math.floor(1000 * Math.exp(-distance / 1000)));

      // First update player status
      const { error: playerError } = await supabase
        .from('players')
        .update({ 
          has_answered: true,
          score: score 
        })
        .eq('id', playerId);

      if (playerError) throw playerError;

      // Then submit answer
      const { error: answerError } = await supabase
        .from('answers')
        .insert({
          player_id: playerId,
          game_id: gameId,
          question_id: question.id,
          latitude,
          longitude,
          distance,
          score
        });

      if (answerError) throw answerError;

    } catch (err) {
      console.error('Error submitting answer:', err);
      // Revert player status if answer submission fails
      await supabase
        .from('players')
        .update({ has_answered: false })
        .eq('id', playerId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <QuestionCard question={question} />
      <div className="h-[400px] rounded-xl overflow-hidden">
        <MapComponent
          onMapClick={hasAnswered ? undefined : handleMapClick}
          markers={selectedLocation ? [{ longitude: selectedLocation[0], latitude: selectedLocation[1] }] : []}
          showLabels={false}
        />
      </div>
      {selectedLocation && !hasAnswered && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800
                   text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      )}
      {hasAnswered && (
        <div className="text-center text-white text-lg bg-blue-500/20 rounded-lg p-4">
          Answer submitted! Waiting for other players...
        </div>
      )}
    </div>
  );
}
