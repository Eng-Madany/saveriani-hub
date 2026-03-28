import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  Search,
  MapPin,
  AlertCircle,
  Shield,
  Loader2,
  Edit2,
  Trash2,
  X,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const nationalities = [
  'Afghanistan', 'Bangladesh', 'Costa D\'Avorio', 'Egitto', 'Eritrea', 
  'Etiopia', 'Gambia', 'Ghana', 'Guinea', 'Mali', 'Nigeria', 
  'Pakistan', 'Senegal', 'Somalia', 'Sudan', 'Altro'
];

const statusOptions = [
  { value: 'presente', label: 'Presente', color: 'status-presente' },
  { value: 'assente', label: 'Assente', color: 'status-assente' },
  { value: 'isolamento', label: 'Isolamento', color: 'status-isolamento' }
];

export const Residenti = () => {
  const { residents, refreshResidents, API } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedResident, setSelectedResident] = useState(null);

  const [formData, setFormData] = useState({
    surname: '',
    name: '',
    nationality: '',
    room_number: 1,
    status: 'presente',
    medical_alerts: [],
    security_notes: []
  });

  const [newAlert, setNewAlert] = useState('');
  const [newSecurityNote, setNewSecurityNote] = useState('');

  const resetForm = () => {
    setFormData({
      surname: '',
      name: '',
      nationality: '',
      room_number: 1,
      status: 'presente',
      medical_alerts: [],
      security_notes: []
    });
    setEditingResident(null);
    setNewAlert('');
    setNewSecurityNote('');
  };

  const handleEdit = (resident) => {
    setEditingResident(resident);
    setFormData({
      surname: resident.surname,
      name: resident.name,
      nationality: resident.nationality,
      room_number: resident.room_number,
      status: resident.status,
      medical_alerts: resident.medical_alerts || [],
      security_notes: resident.security_notes || []
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.surname || !formData.name || !formData.nationality) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    setIsLoading(true);
    try {
      if (editingResident) {
        await axios.put(`${API}/residents/${editingResident.id}`, formData);
        toast.success('Residente aggiornato');
      } else {
        await axios.post(`${API}/residents`, formData);
        toast.success('Residente aggiunto');
      }
      
      setDialogOpen(false);
      resetForm();
      refreshResidents();
    } catch (error) {
      toast.error('Errore nel salvataggio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (residentId) => {
    if (!window.confirm('Eliminare questo residente?')) return;
    
    try {
      await axios.delete(`${API}/residents/${residentId}`);
      toast.success('Residente eliminato');
      refreshResidents();
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const addMedicalAlert = () => {
    if (newAlert.trim()) {
      setFormData(prev => ({
        ...prev,
        medical_alerts: [...prev.medical_alerts, newAlert.trim()]
      }));
      setNewAlert('');
    }
  };

  const removeMedicalAlert = (index) => {
    setFormData(prev => ({
      ...prev,
      medical_alerts: prev.medical_alerts.filter((_, i) => i !== index)
    }));
  };

  const addSecurityNote = () => {
    if (newSecurityNote.trim()) {
      setFormData(prev => ({
        ...prev,
        security_notes: [...prev.security_notes, newSecurityNote.trim()]
      }));
      setNewSecurityNote('');
    }
  };

  const removeSecurityNote = (index) => {
    setFormData(prev => ({
      ...prev,
      security_notes: prev.security_notes.filter((_, i) => i !== index)
    }));
  };

  // Filter residents
  const filteredResidents = residents.filter(resident => {
    const matchesSearch = 
      resident.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoom = filterRoom === 'all' || resident.room_number === parseInt(filterRoom);
    const matchesStatus = filterStatus === 'all' || resident.status === filterStatus;
    return matchesSearch && matchesRoom && matchesStatus;
  });

  // Group by room for planimetria
  const roomOccupancy = {};
  residents.forEach(r => {
    if (!roomOccupancy[r.room_number]) {
      roomOccupancy[r.room_number] = [];
    }
    roomOccupancy[r.room_number].push(r);
  });

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Database Residenti
            </h1>
            <p className="text-zinc-500">
              {residents.length} residenti registrati
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-white text-zinc-950 hover:bg-zinc-200" data-testid="add-resident-button">
                <Plus size={20} className="mr-2" />
                Nuovo Residente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingResident ? 'Modifica Residente' : 'Nuovo Residente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Cognome *</label>
                    <Input
                      value={formData.surname}
                      onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                      className="bg-zinc-900 border-zinc-800"
                      data-testid="resident-surname"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Nome *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-zinc-900 border-zinc-800"
                      data-testid="resident-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Nazionalità *</label>
                    <Select 
                      value={formData.nationality} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800" data-testid="resident-nationality">
                        <SelectValue placeholder="Seleziona..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {nationalities.map((nat) => (
                          <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Camera</label>
                    <Select 
                      value={formData.room_number.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, room_number: parseInt(value) }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800" data-testid="resident-room">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                        {[...Array(32)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>Camera {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Stato</label>
                  <div className="grid grid-cols-3 gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                        className={`p-2 border transition-colors ${
                          formData.status === status.value
                            ? status.color
                            : 'border-zinc-800 text-zinc-400'
                        }`}
                        data-testid={`status-${status.value}`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medical Alerts */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                    <Heart size={14} className="text-red-500" />
                    Allerte Mediche
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newAlert}
                      onChange={(e) => setNewAlert(e.target.value)}
                      placeholder="Aggiungi allerta medica..."
                      className="bg-zinc-900 border-zinc-800"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedicalAlert())}
                    />
                    <Button type="button" variant="secondary" onClick={addMedicalAlert}>
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.medical_alerts.map((alert, i) => (
                      <Badge key={i} className="category-medical flex items-center gap-1">
                        {alert}
                        <button type="button" onClick={() => removeMedicalAlert(i)}>
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Security Notes */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                    <Shield size={14} className="text-orange-500" />
                    Note Sicurezza
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSecurityNote}
                      onChange={(e) => setNewSecurityNote(e.target.value)}
                      placeholder="Aggiungi nota sicurezza..."
                      className="bg-zinc-900 border-zinc-800"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecurityNote())}
                    />
                    <Button type="button" variant="secondary" onClick={addSecurityNote}>
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.security_notes.map((note, i) => (
                      <Badge key={i} className="category-security flex items-center gap-1">
                        {note}
                        <button type="button" onClick={() => removeSecurityNote(i)}>
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                  disabled={isLoading}
                  data-testid="submit-resident-button"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingResident ? 'Aggiorna' : 'Aggiungi'} Residente
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Planimetria */}
        <Card className="bg-zinc-900 border-zinc-800" data-testid="planimetria">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MapPin size={20} />
              Planimetria - 32 Camere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="planimetria-grid">
              {[...Array(32)].map((_, i) => {
                const roomNumber = i + 1;
                const occupants = roomOccupancy[roomNumber] || [];
                const hasOccupants = occupants.length > 0;
                const hasIsolation = occupants.some(o => o.status === 'isolamento');
                const hasMedicalAlert = occupants.some(o => o.medical_alerts?.length > 0);
                
                let bgColor = 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30';
                if (!hasOccupants) {
                  bgColor = 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700';
                } else if (hasIsolation) {
                  bgColor = 'bg-red-500/20 text-red-400 hover:bg-red-500/30';
                } else if (hasMedicalAlert) {
                  bgColor = 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30';
                }
                
                return (
                  <button
                    key={roomNumber}
                    onClick={() => setSelectedResident(occupants.length > 0 ? occupants : null)}
                    className={`room-cell aspect-square flex flex-col items-center justify-center cursor-pointer ${bgColor}`}
                    data-testid={`planimetria-room-${roomNumber}`}
                  >
                    <span className="text-lg font-bold">{roomNumber}</span>
                    <span className="text-xs">{occupants.length}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500/20" />
                <span className="text-xs text-zinc-400">Occupata</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500/20" />
                <span className="text-xs text-zinc-400">Allerta medica</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/20" />
                <span className="text-xs text-zinc-400">Isolamento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-zinc-800" />
                <span className="text-xs text-zinc-400">Vuota</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Room Detail */}
        {selectedResident && selectedResident.length > 0 && (
          <Card className="bg-zinc-800/50 border-zinc-700" data-testid="room-detail">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">
                Camera {selectedResident[0].room_number} - {selectedResident.length} occupanti
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedResident(null)}>
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedResident.map((resident) => (
                  <div key={resident.id} className="p-3 bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{resident.surname} {resident.name}</p>
                      <p className="text-sm text-zinc-400">{resident.nationality}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge className={getStatusInfo(resident.status).color}>
                          {getStatusInfo(resident.status).label}
                        </Badge>
                        {resident.medical_alerts?.map((alert, i) => (
                          <Badge key={i} className="category-medical text-xs">{alert}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(resident)}>
                        <Edit2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <Input
                    placeholder="Cerca per nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-900 border-zinc-800"
                    data-testid="search-residents"
                  />
                </div>
              </div>
              
              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800" data-testid="filter-room">
                  <SelectValue placeholder="Camera" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                  <SelectItem value="all">Tutte le camere</SelectItem>
                  {[...Array(32)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>Camera {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800" data-testid="filter-status">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Residents List */}
        <Card className="bg-zinc-900 border-zinc-800" data-testid="residents-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users size={20} />
              Lista Residenti ({filteredResidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Camera</th>
                    <th>Cognome Nome</th>
                    <th>Nazionalità</th>
                    <th>Stato</th>
                    <th>Allerte</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((resident) => (
                    <tr key={resident.id} data-testid={`resident-row-${resident.id}`}>
                      <td className="font-bold text-white">{resident.room_number}</td>
                      <td className="text-white">{resident.surname} {resident.name}</td>
                      <td className="text-zinc-400">{resident.nationality}</td>
                      <td>
                        <Badge className={getStatusInfo(resident.status).color}>
                          {getStatusInfo(resident.status).label}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {resident.medical_alerts?.length > 0 && (
                            <Heart size={16} className="text-red-500" />
                          )}
                          {resident.security_notes?.length > 0 && (
                            <Shield size={16} className="text-orange-500" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(resident)}
                            data-testid={`edit-resident-${resident.id}`}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-400"
                            onClick={() => handleDelete(resident.id)}
                            data-testid={`delete-resident-${resident.id}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
