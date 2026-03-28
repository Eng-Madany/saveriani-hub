import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { 
  ClipboardList, 
  Plus, 
  CheckCircle2,
  Clock,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export const Consegne = () => {
  const { currentUser, API } = useApp();
  const [handovers, setHandovers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [newHandover, setNewHandover] = useState({
    date: today,
    shift: getCurrentShift(),
    notes: ''
  });

  function getCurrentShift() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'mattina';
    if (hour >= 14 && hour < 22) return 'pomeriggio';
    return 'notte';
  }

  const loadHandovers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/handovers`);
      setHandovers(response.data);
    } catch (error) {
      console.error('Errore caricamento consegne:', error);
      toast.error('Errore nel caricamento delle consegne');
    } finally {
      setIsLoading(false);
    }
  }, [API]);

  useEffect(() => {
    loadHandovers();
  }, [loadHandovers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newHandover.notes.trim()) {
      toast.error('Inserisci le note del turno');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API}/handovers`, {
        ...newHandover,
        staff_id: currentUser.id,
        staff_name: currentUser.name
      });

      toast.success('Consegna registrata');
      setNewHandover({
        date: today,
        shift: getCurrentShift(),
        notes: ''
      });
      setDialogOpen(false);
      loadHandovers();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!confirmChecked) {
      toast.error('Conferma di aver letto le consegne');
      return;
    }

    try {
      await axios.put(`${API}/handovers/${selectedHandover.id}/acknowledge`, {
        staff_id: currentUser.id,
        staff_name: currentUser.name
      });

      toast.success('Consegna confermata');
      setConfirmDialogOpen(false);
      setSelectedHandover(null);
      setConfirmChecked(false);
      loadHandovers();
    } catch (error) {
      toast.error('Errore nella conferma');
    }
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

  const pendingHandovers = handovers.filter(h => !h.acknowledged_by);
  const completedHandovers = handovers.filter(h => h.acknowledged_by);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Passaggio Consegne
            </h1>
            <p className="text-zinc-500">
              Note turno e conferma lettura per il cambio turno
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-zinc-950 hover:bg-zinc-200" data-testid="add-handover-button">
                <Plus size={20} className="mr-2" />
                Nuova Consegna
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">Scrivi Consegna Turno</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Data</label>
                  <input
                    type="date"
                    value={newHandover.date}
                    onChange={(e) => setNewHandover(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-2 focus:border-white focus:outline-none"
                    data-testid="handover-date"
                  />
                </div>

                {/* Shift */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Turno</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['mattina', 'pomeriggio', 'notte'].map((shift) => (
                      <button
                        key={shift}
                        type="button"
                        onClick={() => setNewHandover(prev => ({ ...prev, shift }))}
                        className={`p-3 flex items-center justify-center gap-2 border transition-colors ${
                          newHandover.shift === shift
                            ? shift === 'notte' ? 'shift-notte' : 'shift-mattina'
                            : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                        data-testid={`shift-${shift}`}
                      >
                        {shift === 'notte' ? <Moon size={16} /> : <Sun size={16} />}
                        <span className="capitalize">{shift}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Note Turno</label>
                  <Textarea
                    value={newHandover.notes}
                    onChange={(e) => setNewHandover(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Scrivi le note importanti per il turno successivo..."
                    className="bg-zinc-900 border-zinc-800 min-h-48 focus:border-white"
                    data-testid="handover-notes"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                  disabled={isSubmitting}
                  data-testid="submit-handover-button"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Salva Consegna
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Handovers */}
        <Card className="bg-orange-500/10 border-orange-500/20" data-testid="pending-handovers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <Clock size={20} />
              Consegne da Confermare ({pendingHandovers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
              </div>
            ) : pendingHandovers.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Nessuna consegna in attesa</p>
            ) : (
              <div className="space-y-4">
                {pendingHandovers.map((handover) => (
                  <div 
                    key={handover.id} 
                    className="p-4 bg-zinc-900/50 border border-zinc-800"
                    data-testid={`pending-handover-${handover.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{handover.staff_name}</span>
                        <Badge className={handover.shift === 'notte' ? 'shift-notte' : 'shift-mattina'}>
                          {handover.shift}
                        </Badge>
                      </div>
                      <span className="text-sm text-zinc-500">{handover.date}</span>
                    </div>
                    
                    <p className="text-zinc-300 whitespace-pre-wrap mb-4">{handover.notes}</p>
                    
                    <Button
                      onClick={() => {
                        setSelectedHandover(handover);
                        setConfirmDialogOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      data-testid={`confirm-handover-${handover.id}`}
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      Conferma Lettura
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Handovers */}
        <Card className="bg-zinc-900 border-zinc-800" data-testid="completed-handovers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle2 size={20} className="text-emerald-500" />
              Consegne Confermate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedHandovers.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Nessuna consegna confermata</p>
            ) : (
              <div className="space-y-4">
                {completedHandovers.slice(0, 10).map((handover) => (
                  <div 
                    key={handover.id} 
                    className="p-4 bg-zinc-800/50 border border-zinc-700"
                    data-testid={`completed-handover-${handover.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{handover.staff_name}</span>
                        <Badge className={handover.shift === 'notte' ? 'shift-notte' : 'shift-mattina'}>
                          {handover.shift}
                        </Badge>
                      </div>
                      <span className="text-sm text-zinc-500">{handover.date}</span>
                    </div>
                    
                    <p className="text-zinc-300 whitespace-pre-wrap mb-3">{handover.notes}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-emerald-500">
                      <CheckCircle2 size={14} />
                      <span>
                        Confermato da {handover.acknowledged_name} - {formatDateTime(handover.acknowledged_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Conferma Lettura Consegna</DialogTitle>
            </DialogHeader>
            
            {selectedHandover && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-white">{selectedHandover.staff_name}</span>
                    <Badge className={selectedHandover.shift === 'notte' ? 'shift-notte' : 'shift-mattina'}>
                      {selectedHandover.shift}
                    </Badge>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap">{selectedHandover.notes}</p>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20">
                  <Checkbox
                    id="confirm-read"
                    checked={confirmChecked}
                    onCheckedChange={setConfirmChecked}
                    className="mt-1"
                    data-testid="confirm-checkbox"
                  />
                  <label 
                    htmlFor="confirm-read" 
                    className="text-sm text-orange-300 cursor-pointer"
                  >
                    Confermo di aver letto e compreso tutte le note del turno precedente
                  </label>
                </div>

                <Button
                  onClick={handleAcknowledge}
                  disabled={!confirmChecked}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                  data-testid="submit-acknowledge-button"
                >
                  <CheckCircle2 size={16} className="mr-2" />
                  Conferma Lettura
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
