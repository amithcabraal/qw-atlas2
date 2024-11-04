// Previous imports remain the same...

export default function PlayGame() {
  // Previous state and hooks remain the same...

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
        // Clear answers first
        setAnswers([]);
        
        // Update game status and move to next question
        await supabase
          .from('games')
          .update({
            current_question: nextQuestion,
            status: 'playing'
          })
          .eq('id', gameId);

        // Reset player answers
        await supabase
          .from('players')
          .update({ has_answered: false })
          .eq('game_id', gameId);
      }
    } catch (err) {
      console.error('Error advancing to next question:', err);
    }
  };

  const handleRevealAnswers = async () => {
    if (!gameId || !game) return;

    try {
      // Update game status to revealing
      await supabase
        .from('games')
        .update({ status: 'revealing' })
        .eq('id', gameId);

      // Fetch answers for current question only
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId)
        .eq('question_id', game.current_question);

      if (answersError) throw answersError;
      console.log('Fetched answers:', answersData);

      if (answersData) {
        setAnswers(answersData);
      }
    } catch (err) {
      console.error('Error revealing answers:', err);
    }
  };

  // Rest of the component remains the same...
}
