import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import axios from 'axios';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  WashingMachine, 
  AlertTriangle,
  Users,
  ClipboardCheck,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { currentUser, residents, API } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastEntry, setLastEntry] = useState(null);
  const [laundryToday, setLaundryToday] = useState(null);
  const [pendingHandovers, setPendingHandovers] = useState([]);
  const [isClocking, setIsClocking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [lastEntryRes, laundryRes, handoversRes] = await Promise.all([
        axios.get(`${API}/time-entries/last-entry/${currentUser.id}`).catch(() => ({ data: null })),
        axios.get(`${API}/laundry/today`),
        axios.get(`${API}/handovers?pending=true`)
      ]);

      setLastEntry(lastEntryRes.data);
      setLaundryToday(laundryRes.data);
      setPendingHandovers(handoversRes.data || []);
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [API, currentUser.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleClockInOut = async (type) => {
    setIsClocking(true);
    try {
      await axios.post(`${API}/time-entries`, {
        staff_id: currentUser.id,
        staff_name: currentUser.name,
        entry_type: type
      });
      
      toast.success(type === 'clock_in' ? 'Entrata registrata!' : 'Uscita registrata!');
      loadDashboardData();
    } catch (error) {
      toast.error('Errore nella registrazione');
    } finally {
      setIsClocking(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const getCurrentShift = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 14) return 'mattina';
    if (hour >= 14 && hour < 22) return 'pomeriggio';
    return 'notte';
  };

  const isClockedIn = lastEntry?.entry_type === 'clock_in';

  // Stats
  const totalResidents = residents.length;
  const presentResidents = residents.filter(r => r.status === 'presente').length;
  const isolationResidents = residents.filter(r => r.status === 'isolamento').length;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Time */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Dashboard
            </h1>
            <p className="text-zinc-500 capitalize">{formatDate(currentTime)}</p>
          </div>
          
          <div className="text-right">
            <p className="time-display text-4xl md:text-5xl text-white clock-pulse" data-testid="current-time">
              {formatTime(currentTime)}
            </p>
            <Badge 
              className={`mt-2 ${getCurrentShift() === 'notte' ? 'shift-notte' : 'shift-mattina'}`}
              data-testid="current-shift"
            >
              Turno {getCurrentShift()}
            </Badge>
          </div>
        </div>

        {/* Clock In/Out Section */}
        <Card className="bg-zinc-900 border-zinc-800" data-testid="clock-section">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock size={24} />
              Registrazione Presenza
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1">
                {lastEntry ? (
                  <p className="text-zinc-400">
                    Ultima registrazione: <span className="text-white font-medium">
                      {lastEntry.entry_type === 'clock_in' ? 'Entrata' : 'Uscita'}
                    </span> alle{' '}
                    <span className="text-white">
                      {new Date(lastEntry.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                ) : (
                  <p className="text-zinc-500">Nessuna registrazione oggi</p>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button
                  className="btn-clock-in"
                  onClick={() => handleClockInOut('clock_in')}
                  disabled={isClocking || isClockedIn}
                  data-testid="clock-in-button"
                >
                  {isClocking ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <LogIn className="w-5 h-5 mr-2" />
                  )}
                  ENTRATA
                </Button>
                
                <Button
                  className="btn-clock-out"
                  onClick={() => handleClockInOut('clock_out')}
                  disabled={isClocking || !isClockedIn}
                  data-testid="clock-out-button"
                >
                  {isClocking ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <LogOut className="w-5 h-5 mr-2" />
                  )}
                  USCITA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Residents Stats */}
          <Card className="bg-zinc-900 border-zinc-800" data-testid="residents-stats">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">Residenti</p>
                  <p className="text-3xl font-black text-white">{presentResidents}/{totalResidents}</p>
                  <p className="text-sm text-zinc-400">presenti</p>
                </div>
                <Users className="w-10 h-10 text-zinc-700" />
              </div>
            </CardContent>
          </Card>

          {/* Isolation Alert */}
          <Card className={`border ${isolationResidents > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-900 border-zinc-800'}`} data-testid="isolation-stats">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">Isolamento</p>
                  <p className={`text-3xl font-black ${isolationResidents > 0 ? 'text-red-500' : 'text-white'}`}>
                    {isolationResidents}
                  </p>
                  <p className="text-sm text-zinc-400">persone</p>
                </div>
                <AlertTriangle className={`w-10 h-10 ${isolationResidents > 0 ? 'text-red-500' : 'text-zinc-700'}`} />
              </div>
            </CardContent>
          </Card>

          {/* Pending Handovers */}
          <Card className={`border ${pendingHandovers.length > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-zinc-900 border-zinc-800'}`} data-testid="handover-stats">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">Consegne</p>
                  <p className={`text-3xl font-black ${pendingHandovers.length > 0 ? 'text-orange-500' : 'text-white'}`}>
                    {pendingHandovers.length}
                  </p>
                  <p className="text-sm text-zinc-400">da confermare</p>
                </div>
                <ClipboardCheck className={`w-10 h-10 ${pendingHandovers.length > 0 ? 'text-orange-500' : 'text-zinc-700'}`} />
              </div>
            </CardContent>
          </Card>

          {/* Laundry Today */}
          <Card className="bg-zinc-900 border-zinc-800" data-testid="laundry-stats">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">Lavanderia Oggi</p>
                  <p className="text-3xl font-black text-white">
                    {laundryToday ? [...laundryToday.shift_1, ...laundryToday.shift_2, ...laundryToday.shift_3].length : 0}
                  </p>
                  <p className="text-sm text-zinc-400">stanze</p>
                </div>
                <WashingMachine className="w-10 h-10 text-zinc-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Laundry Today Detail */}
        {laundryToday && (
          <Card className="bg-zinc-900 border-zinc-800" data-testid="laundry-today-detail">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <WashingMachine size={20} />
                Stanze Lavanderia Oggi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((shift) => {
                  const rooms = laundryToday[`shift_${shift}`] || [];
                  return (
                    <div key={shift} className="p-4 bg-zinc-800/50 border border-zinc-700">
                      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
                        Turno {shift}
                      </p>
                      {rooms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {rooms.map((room) => (
                            <Badge 
                              key={room} 
                              className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                            >
                              Camera {room}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm">Nessuna stanza</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Handovers Alert */}
        {pendingHandovers.length > 0 && (
          <Card className="bg-orange-500/10 border-orange-500/20" data-testid="pending-handovers-alert">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <AlertTriangle size={20} />
                Consegne da Confermare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingHandovers.slice(0, 3).map((handover) => (
                  <div key={handover.id} className="p-3 bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">
                        {handover.staff_name} - Turno {handover.shift}
                      </span>
                      <span className="text-xs text-zinc-500">{handover.date}</span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2">{handover.notes}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
