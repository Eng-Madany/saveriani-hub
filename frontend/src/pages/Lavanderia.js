import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import axios from 'axios';
import { 
  WashingMachine, 
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const Lavanderia = () => {
  const { currentUser, API } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/laundry/schedule?date=${selectedDate}`);
      setSchedule(response.data);
    } catch (error) {
      console.error('Errore caricamento lavanderia:', error);
    } finally {
      setIsLoading(false);
    }
  }, [API, selectedDate]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleCompleteShift = async (shift) => {
    try {
      await axios.post(`${API}/laundry/complete?date=${selectedDate}&shift=${shift}&staff_id=${currentUser.id}&staff_name=${currentUser.name}`);
      toast.success(`Turno ${shift} completato`);
      loadSchedule();
    } catch (error) {
      toast.error('Errore nel completamento');
    }
  };

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isSunday = new Date(selectedDate).getDay() === 0;

  // Generate week view
  const getWeekDates = () => {
    const dates = [];
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Start from Monday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Calendario Lavanderia
          </h1>
          <p className="text-zinc-500">
            Rotazione automatica lavanderia per 32 stanze
          </p>
        </div>

        {/* Date Navigation */}
        <Card className="bg-zinc-900 border-zinc-800" data-testid="date-navigation">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={() => changeDate(-7)}
                className="text-zinc-400 hover:text-white"
                data-testid="prev-week"
              >
                <ChevronLeft size={20} className="mr-1" />
                Settimana
              </Button>
              
              <div className="text-center">
                <p className="text-lg font-bold text-white capitalize">
                  {formatDate(selectedDate)}
                </p>
                {isToday && (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    Oggi
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                onClick={() => changeDate(7)}
                className="text-zinc-400 hover:text-white"
                data-testid="next-week"
              >
                Settimana
                <ChevronRight size={20} className="ml-1" />
              </Button>
            </div>

            {/* Week View */}
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date, index) => {
                const isSelected = date === selectedDate;
                const isTodayDate = date === new Date().toISOString().split('T')[0];
                const day = new Date(date).getDate();
                
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 text-center transition-colors ${
                      isSelected 
                        ? 'bg-white text-zinc-950' 
                        : isTodayDate
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                    data-testid={`day-${date}`}
                  >
                    <p className="text-xs mb-1">{dayNames[index]}</p>
                    <p className="text-lg font-bold">{day}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Display */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          </div>
        ) : isSunday ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-xl font-bold text-white mb-2">Domenica - Nessuna Lavanderia</p>
              <p className="text-zinc-500">La lavanderia è chiusa la domenica</p>
            </CardContent>
          </Card>
        ) : schedule && (
          <>
            {/* Shifts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="laundry-shifts">
              {[1, 2, 3].map((shift) => {
                const rooms = schedule[`shift_${shift}`] || [];
                const isCompleted = schedule[`shift_${shift}_completed`];
                
                return (
                  <Card 
                    key={shift} 
                    className={`border ${
                      isCompleted 
                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                    data-testid={`shift-${shift}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <span className={isCompleted ? 'text-emerald-500' : 'text-white'}>
                          Turno {shift}
                        </span>
                        {isCompleted && (
                          <CheckCircle2 size={20} className="text-emerald-500" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {rooms.length > 0 ? (
                        <>
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {rooms.map((room) => (
                              <div
                                key={room}
                                className={`p-2 text-center font-bold ${
                                  isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-zinc-800 text-white'
                                }`}
                              >
                                {room}
                              </div>
                            ))}
                          </div>
                          
                          {isCompleted ? (
                            <p className="text-xs text-emerald-500">
                              Completato da {schedule[`shift_${shift}_completed_by`]}
                            </p>
                          ) : isToday && (
                            <Button
                              onClick={() => handleCompleteShift(shift)}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                              data-testid={`complete-shift-${shift}`}
                            >
                              <CheckCircle2 size={16} className="mr-2" />
                              Segna Completato
                            </Button>
                          )}
                        </>
                      ) : (
                        <p className="text-zinc-500 text-center py-4">Nessuna stanza</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Room Overview */}
            <Card className="bg-zinc-900 border-zinc-800" data-testid="room-overview">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <WashingMachine size={20} />
                  Panoramica Stanze (32)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="planimetria-grid">
                  {[...Array(32)].map((_, i) => {
                    const roomNumber = i + 1;
                    const shift1Rooms = schedule?.shift_1 || [];
                    const shift2Rooms = schedule?.shift_2 || [];
                    const shift3Rooms = schedule?.shift_3 || [];
                    
                    let shiftNumber = null;
                    let bgColor = 'bg-zinc-800 text-zinc-500';
                    
                    if (shift1Rooms.includes(roomNumber)) {
                      shiftNumber = 1;
                      bgColor = schedule?.shift_1_completed 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-blue-500/20 text-blue-400';
                    } else if (shift2Rooms.includes(roomNumber)) {
                      shiftNumber = 2;
                      bgColor = schedule?.shift_2_completed 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-purple-500/20 text-purple-400';
                    } else if (shift3Rooms.includes(roomNumber)) {
                      shiftNumber = 3;
                      bgColor = schedule?.shift_3_completed 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-orange-500/20 text-orange-400';
                    }
                    
                    return (
                      <div
                        key={roomNumber}
                        className={`room-cell aspect-square flex flex-col items-center justify-center ${bgColor}`}
                        data-testid={`room-${roomNumber}`}
                      >
                        <span className="text-lg font-bold">{roomNumber}</span>
                        {shiftNumber && (
                          <span className="text-xs opacity-70">T{shiftNumber}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500/20" />
                    <span className="text-xs text-zinc-400">Turno 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500/20" />
                    <span className="text-xs text-zinc-400">Turno 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500/20" />
                    <span className="text-xs text-zinc-400">Turno 3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500/20" />
                    <span className="text-xs text-zinc-400">Completato</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-zinc-800" />
                    <span className="text-xs text-zinc-400">Non oggi</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};
