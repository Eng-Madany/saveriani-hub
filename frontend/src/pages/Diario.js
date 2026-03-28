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
  BookOpen, 
  Plus, 
  Heart, 
  Shield, 
  Wrench, 
  FileText,
  Loader2,
  Trash2,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const categories = [
  { id: 'Medico', icon: Heart, color: 'category-medical' },
  { id: 'Sicurezza', icon: Shield, color: 'category-security' },
  { id: 'Manutenzione', icon: Wrench, color: 'category-maintenance' },
  { id: 'Generale', icon: FileText, color: 'category-general' },
];

export const Diario = () => {
  const { currentUser, residents, API } = useApp();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterShift, setFilterShift] = useState('all');

  // Form state
  const [newLog, setNewLog] = useState({
    category: 'Generale',
    content: '',
    resident_id: '',
    shift: getCurrentShift()
  });

  function getCurrentShift() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'mattina';
    if (hour >= 14 && hour < 22) return 'pomeriggio';
    return 'notte';
  }

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `${API}/logs`;
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterShift !== 'all') params.append('shift', filterShift);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url);
      setLogs(response.data);
    } catch (error) {
      console.error('Errore caricamento log:', error);
      toast.error('Errore nel caricamento del diario');
    } finally {
      setIsLoading(false);
    }
  }, [API, filterCategory, filterShift]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newLog.content.trim()) {
      toast.error('Inserisci il contenuto della nota');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedResident = residents.find(r => r.id === newLog.resident_id);
      
      await axios.post(`${API}/logs`, {
        ...newLog,
        staff_id: currentUser.id,
        staff_name: currentUser.name,
        resident_name: selectedResident ? `${selectedResident.surname} ${selectedResident.name}` : null
      });

      toast.success('Nota aggiunta al diario');
      setNewLog({
        category: 'Generale',
        content: '',
        resident_id: '',
        shift: getCurrentShift()
      });
      setDialogOpen(false);
      loadLogs();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Eliminare questa nota?')) return;

    try {
      await axios.delete(`${API}/logs/${logId}`);
      toast.success('Nota eliminata');
      loadLogs();
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || categories[3];
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Diario Digitale
            </h1>
            <p className="text-zinc-500">
              Registro note mediche, sicurezza, manutenzione e generali
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-zinc-950 hover:bg-zinc-200" data-testid="add-log-button">
                <Plus size={20} className="mr-2" />
                Nuova Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">Aggiungi Nota al Diario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Categoria</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNewLog(prev => ({ ...prev, category: cat.id }))}
                          className={`p-3 flex items-center gap-2 border transition-colors ${
                            newLog.category === cat.id 
                              ? cat.color 
                              : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                          data-testid={`category-${cat.id.toLowerCase()}`}
                        >
                          <Icon size={18} />
                          <span>{cat.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shift Selection */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Turno</label>
                  <Select 
                    value={newLog.shift} 
                    onValueChange={(value) => setNewLog(prev => ({ ...prev, shift: value }))}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800" data-testid="shift-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="mattina">Mattina</SelectItem>
                      <SelectItem value="pomeriggio">Pomeriggio</SelectItem>
                      <SelectItem value="notte">Notte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resident Selection (optional) */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Residente (opzionale)</label>
                  <Select 
                    value={newLog.resident_id} 
                    onValueChange={(value) => setNewLog(prev => ({ ...prev, resident_id: value }))}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800" data-testid="resident-select">
                      <SelectValue placeholder="Seleziona residente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                      <SelectItem value="">Nessuno</SelectItem>
                      {residents.map((resident) => (
                        <SelectItem key={resident.id} value={resident.id}>
                          {resident.surname} {resident.name} - Camera {resident.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Contenuto</label>
                  <Textarea
                    value={newLog.content}
                    onChange={(e) => setNewLog(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Descrivi l'evento o la nota..."
                    className="bg-zinc-900 border-zinc-800 min-h-32 focus:border-white"
                    data-testid="log-content"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                  disabled={isSubmitting}
                  data-testid="submit-log-button"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Salva Nota
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-zinc-500" />
                <span className="text-sm text-zinc-500">Filtri:</span>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`category-pill ${filterCategory === 'all' ? 'active' : ''}`}
                  data-testid="filter-all"
                >
                  Tutti
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id)}
                    className={`category-pill ${filterCategory === cat.id ? 'active' : ''}`}
                    data-testid={`filter-${cat.id.toLowerCase()}`}
                  >
                    {cat.id}
                  </button>
                ))}
              </div>

              {/* Shift Filter */}
              <Select value={filterShift} onValueChange={setFilterShift}>
                <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800" data-testid="filter-shift">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">Tutti i turni</SelectItem>
                  <SelectItem value="mattina">Mattina</SelectItem>
                  <SelectItem value="pomeriggio">Pomeriggio</SelectItem>
                  <SelectItem value="notte">Notte</SelectItem>
                </SelectContent>
              </Select>

              {(filterCategory !== 'all' || filterShift !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterCategory('all'); setFilterShift('all'); }}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={16} className="mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-4" data-testid="logs-list">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Nessuna nota trovata</p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => {
              const catInfo = getCategoryInfo(log.category);
              const Icon = catInfo.icon;
              
              return (
                <Card 
                  key={log.id} 
                  className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
                  data-testid={`log-entry-${log.id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 ${catInfo.color}`}>
                        <Icon size={20} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <Badge className={catInfo.color}>{log.category}</Badge>
                          <Badge className={log.shift === 'notte' ? 'shift-notte' : 'shift-mattina'}>
                            {log.shift}
                          </Badge>
                          {log.resident_name && (
                            <Badge className="bg-zinc-800 text-zinc-300">
                              {log.resident_name}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-white whitespace-pre-wrap mb-3">{log.content}</p>
                        
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{log.staff_name} - {formatDateTime(log.created_at)}</span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(log.id)}
                            className="text-zinc-500 hover:text-red-500"
                            data-testid={`delete-log-${log.id}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};
