import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import ConfirmModal from '../../components/feature/ConfirmModal';

export default function CreatePrediction() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      window.REACT_APP_NAVIGATE('/login');
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Tu dois être connecté pour créer un marché');
      return;
    }

    // Validation 1: Titre requis
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }

    // Validation 2: Titre longueur min/max
    if (title.trim().length < 10) {
      setError('Le titre doit faire au moins 10 caractères');
      return;
    }

    if (title.trim().length > 200) {
      setError('Le titre ne peut pas dépasser 200 caractères');
      return;
    }

    // Validation 3: Description requise
    if (!description.trim()) {
      setError('La description est requise');
      return;
    }

    // Validation 4: Description longueur min/max
    if (description.trim().length < 20) {
      setError('La description doit faire au moins 20 caractères');
      return;
    }

    if (description.trim().length > 1000) {
      setError('La description ne peut pas dépasser 1000 caractères');
      return;
    }

    // Validation 5: Catégorie requise
    if (!category) {
      setError('La catégorie est requise');
      return;
    }

    // Validation 6: Date de fin requise
    if (!endDate) {
      setError('La date de fin est requise');
      return;
    }

    // Validation 7: Date dans le futur
    const selectedDate = new Date(endDate);
    const now = new Date();
    if (selectedDate <= now) {
      setError('La date de fin doit être dans le futur');
      return;
    }

    // Validation 8: Date minimum (au moins 1 heure dans le futur)
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    if (selectedDate < oneHourFromNow) {
      setError('La date de fin doit être au moins 1 heure dans le futur');
      return;
    }

    // Validation 9: Date maximum (max 1 an)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (selectedDate > oneYearFromNow) {
      setError('La date de fin ne peut pas dépasser 1 an');
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmCreateMarket = async () => {
    setShowConfirmModal(false);
    setCreating(true);
    setError('');

    try {
      const { data, error: insertError } = await supabase
        .from('markets')
        .insert({
          title: title.trim(),
          description: description.trim(),
          category,
          end_date: endDate,
          created_by: user!.id,
          status: 'active',
          yes_pool: 0,
          no_pool: 0,
          total_pool: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Erreur lors de la création du marché');
      }

      // Success! Navigate to the new market
      window.REACT_APP_NAVIGATE(`/market/${data.id}`);
    } catch (err: any) {
      console.error('Error creating market:', err);
      setError(err.message || 'Échec de la création. Réessaye.');
      setCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-2xl">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const categories = [
    { id: 'memecoin', emoji: '🪙', label: 'Memecoin' },
    { id: 'drama', emoji: '🎭', label: 'Drama' },
    { id: 'X', emoji: '🐦', label: 'X' },
    { id: 'chaos', emoji: '💥', label: 'Chaos' }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white border-4 border-black p-8">
          <h1 className="text-3xl font-bold text-black mb-6">CREATE NEW MARKET</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Titre du marché * (10-200 caractères)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setTitle(e.target.value);
                  }
                }}
                className="w-full px-4 py-2 border-2 border-black text-black font-mono focus:outline-none focus:border-yellow-400"
                placeholder="Bitcoin atteindra 100k$ en 2024 ?"
                maxLength={200}
                required
              />
              <p className="text-xs text-gray-600 mt-1">{title.length}/200</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Description * (20-1000 caractères)
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setDescription(e.target.value);
                  }
                }}
                className="w-full px-4 py-2 border-2 border-black text-black font-mono focus:outline-none focus:border-yellow-400 h-32 resize-none"
                placeholder="Décris les conditions du marché et les critères de résolution..."
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-600 mt-1">{description.length}/1000</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-4 py-3 border-2 border-black font-bold transition-colors whitespace-nowrap ${
                      category === cat.id
                        ? 'bg-yellow-400 text-black'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Date de fin * (min 1h, max 1 an)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                max={new Date(Date.now() + 31536000000).toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border-2 border-black text-black font-mono focus:outline-none focus:border-yellow-400"
                required
              />
              {endDate && (
                <p className="text-xs text-gray-600 mt-1">
                  Se termine le {new Date(endDate).toLocaleString('fr-FR')}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={creating || !title.trim() || !description.trim() || !category || !endDate}
                className="flex-1 px-6 py-3 bg-yellow-400 text-black font-bold border-4 border-black hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {creating ? 'CRÉATION...' : 'CRÉER LE MARCHÉ'}
              </button>
              <button
                type="button"
                onClick={() => window.REACT_APP_NAVIGATE('/home')}
                disabled={creating}
                className="px-6 py-3 bg-gray-300 text-black font-bold border-4 border-black hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                ANNULER
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCreateMarket}
        title="📊 CRÉER LE MARCHÉ"
        message={`Tu es sur le point de créer un nouveau marché de prédiction :\n\n"${title}"\n\nCatégorie: ${category}\nFin: ${new Date(endDate).toLocaleString('fr-FR')}\n\nTu es sûr ?`}
        confirmText="CRÉER"
        cancelText="ANNULER"
        type="info"
      />
    </div>
  );
}
