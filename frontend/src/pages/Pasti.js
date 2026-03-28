import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { 
  UtensilsCrossed, 
  Plus, 
  Star,
  TrendingDown,
  Loader2,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export const Pasti = () => {
  const { currentUser, API } = useApp();
  const [meals, setMeals] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  const [newMeal, setNewMeal] = useState({
    date: today,
    meal_type: 'pranzo',
    meal_count: 21,
    quality_rating: 3,
    leftover_status: 'pochi',
    notes: ''
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mealsRes, statsRes] = await Promise.all([
        axios.get(`${API}/meals?month=${currentMonth}`),
        axios.get(`${API}/meals/waste-stats?month=${currentMonth}`)
      ]);
      setMeals(mealsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Errore caricamento pasti:', error);
    } finally {
      setIsLoading(false);
    }
  }, [API, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.post(`${API}/meals`, {
        ...newMeal,
        staff_id: currentUser.id,
        staff_name: currentUser.name
      });

      toast.success('Pasto registrato');
      setNewMeal({
        date: today,
        meal_type: 'pranzo',
        meal_count: 21,
        quality_rating: 3,
        leftover_status: 'pochi',
        notes: ''
      });
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getMealTypeLabel = (type) => {
    const labels = { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena' };
    return labels[type] || type;
  };

  const getLeftoverColor = (status) => {
    switch (status) {
      case 'nessuno': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pochi': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'molti': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Gestione Pasti
            </h1>
            <p className="text-zinc-500">
              Registro pasti Dussmann Service con feedback qualità e avanzi
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-zinc-950 hover:bg-zinc-200" data-testid="add-meal-button">
                <Plus size={20} className="mr-2" />
                Registra Pasto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">Registra Pasto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Data</label>
                  <input
                    type="date"
                    value={newMeal.date}
                    onChange={(e) => setNewMeal(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-2 focus:border-white focus:outline-none"
                    data-testid="meal-date"
                  />
                </div>

                {/* Meal Type */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Tipo Pasto</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['colazione', 'pranzo', 'cena'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewMeal(prev => ({ ...prev, meal_type: type }))}
                        className={`p-3 border transition-colors capitalize ${
                          newMeal.meal_type === type
                            ? 'bg-white text-zinc-950 border-white'
                            : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                        data-testid={`meal-type-${type}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meal Count */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Numero Pasti</label>
                  <input
                    type="number"
                    value={newMeal.meal_count}
                    onChange={(e) => setNewMeal(prev => ({ ...prev, meal_count: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-2 focus:border-white focus:outline-none"
                    data-testid="meal-count"
                  />
                </div>

                {/* Quality Rating */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Qualità Pasto</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setNewMeal(prev => ({ ...prev, quality_rating: rating }))}
                        className="p-2"
                        data-testid={`quality-${rating}`}
                      >
                        <Star
                          size={28}
                          className={`quality-star ${newMeal.quality_rating >= rating ? 'filled' : ''}`}
                          fill={newMeal.quality_rating >= rating ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leftover Status */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Avanzi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'nessuno', label: 'Nessuno', color: 'border-emerald-500 text-emerald-500' },
                      { value: 'pochi', label: 'Pochi', color: 'border-amber-500 text-amber-500' },
                      { value: 'molti', label: 'Molti', color: 'border-red-500 text-red-500' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewMeal(prev => ({ ...prev, leftover_status: option.value }))}
                        className={`p-3 border transition-colors ${
                          newMeal.leftover_status === option.value
                            ? option.color + ' bg-opacity-10'
                            : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                        data-testid={`leftover-${option.value}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Note (opzionale)</label>
                  <Textarea
                    value={newMeal.notes}
                    onChange={(e) => setNewMeal(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Note aggiuntive sul pasto..."
                    className="bg-zinc-900 border-zinc-800 focus:border-white"
                    data-testid="meal-notes"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                  disabled={isSubmitting}
                  data-testid="submit-meal-button"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Salva Pasto
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="meal-stats">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Pasti Registrati</p>
                <p className="text-3xl font-black text-white">{stats.total_meals}</p>
                <p className="text-sm text-zinc-400">questo mese</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Porzioni Totali</p>
                <p className="text-3xl font-black text-white">{stats.total_servings}</p>
                <p className="text-sm text-zinc-400">questo mese</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">Qualità Media</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-black text-amber-500">{stats.avg_quality}</p>
                  <Star size={24} className="text-amber-500" fill="currentColor" />
                </div>
                <p className="text-sm text-zinc-400">su 5</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Avanzi "Molti"</p>
                <p className={`text-3xl font-black ${stats.leftover_breakdown.molti > 3 ? 'text-red-500' : 'text-white'}`}>
                  {stats.leftover_breakdown.molti}
                </p>
                <p className="text-sm text-zinc-400">registrazioni</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waste Overview */}
        {stats && (
          <Card className="bg-zinc-900 border-zinc-800" data-testid="waste-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingDown size={20} />
                Riepilogo Avanzi Mese
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-3xl font-black text-emerald-500">{stats.leftover_breakdown.nessuno}</p>
                  <p className="text-sm text-emerald-400">Nessuno</p>
                </div>
                <div className="text-center p-4 bg-amber-500/10 border border-amber-500/20">
                  <p className="text-3xl font-black text-amber-500">{stats.leftover_breakdown.pochi}</p>
                  <p className="text-sm text-amber-400">Pochi</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 border border-red-500/20">
                  <p className="text-3xl font-black text-red-500">{stats.leftover_breakdown.molti}</p>
                  <p className="text-sm text-red-400">Molti</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meals List */}
        <Card className="bg-zinc-900 border-zinc-800" data-testid="meals-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <UtensilsCrossed size={20} />
              Registro Pasti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
              </div>
            ) : meals.length === 0 ? (
              <p className="text-zinc-500 text-center py-12">Nessun pasto registrato questo mese</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Porzioni</th>
                      <th>Qualità</th>
                      <th>Avanzi</th>
                      <th>Operatore</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meals.map((meal) => (
                      <tr key={meal.id} data-testid={`meal-row-${meal.id}`}>
                        <td className="text-white">{formatDate(meal.date)}</td>
                        <td>
                          <Badge className="bg-zinc-800 text-zinc-300">
                            {getMealTypeLabel(meal.meal_type)}
                          </Badge>
                        </td>
                        <td className="text-white font-medium">{meal.meal_count}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < meal.quality_rating ? 'text-amber-500' : 'text-zinc-700'}
                                fill={i < meal.quality_rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                        </td>
                        <td>
                          <Badge className={getLeftoverColor(meal.leftover_status)}>
                            {meal.leftover_status}
                          </Badge>
                        </td>
                        <td className="text-zinc-400">{meal.staff_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
