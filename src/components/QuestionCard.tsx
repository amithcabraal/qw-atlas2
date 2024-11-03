import React from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  showHint?: boolean;
}

export default function QuestionCard({ question, showHint = false }: QuestionCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl">
      {question.image && (
        <img
          src={question.image}
          alt={question.text}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}
      <h2 className="text-2xl font-bold text-white mb-2">{question.text}</h2>
      {showHint && question.hint && (
        <p className="text-blue-300 italic">{question.hint}</p>
      )}
    </div>
  );
}