import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { 
  FileText, 
  Printer,
  Download,
  Users,
  UtensilsCrossed,
  Shield,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const Report = () => {
  const { API } = useApp();
  const [reportType, setReportType] = useState('attendance');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const printRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const months = [
    { value: '1', label: 'Gennaio' },
    { value: '2', label: 'Febbraio' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Aprile' },
    { value: '5', label: 'Maggio' },
    { value: '6', label: 'Giugno' },
    { value: '7', label: 'Luglio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Settembre' },
    { value: '10', label: 'Ottobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Dicembre' }
  ];

  const loadReport = async () => {
    setIsLoading(true);
    try {
      let endpoint = '';
      switch (reportType) {
        case 'attendance':
          endpoint = `/reports/attendance?year=${selectedYear}&month=${selectedMonth}`;
          break;
        case 'security':
          endpoint = `/reports/security?year=${selectedYear}&month=${selectedMonth}`;
          break;
        case 'food-waste':
          endpoint = `/reports/food-waste?year=${selectedYear}&month=${selectedMonth}`;
          break;
        default:
          return;
      }

      const response = await axios.get(`${API}${endpoint}`);
      setReportData(response.data);
    } catch (error) {
      toast.error('Errore nel caricamento del report');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getMonthLabel = (monthNum) => {
    return months.find(m => m.value === monthNum.toString())?.label || '';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header - No Print */}
        <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Report Sede Centrale
            </h1>
            <p className="text-zinc-500">
              Genera report professionali per la supervisione
            </p>
          </div>
        </div>

        {/* Controls - No Print */}
        <Card className="bg-zinc-900 border-zinc-800 no-print">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Report Type */}
              <div className="flex-1 min-w-48">
                <label className="text-sm text-zinc-400 mb-2 block">Tipo Report</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800" data-testid="report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="attendance">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        Presenze Staff e Residenti
                      </div>
                    </SelectItem>
                    <SelectItem value="security">
                      <div className="flex items-center gap-2">
                        <Shield size={16} />
                        Incidenti Sicurezza
                      </div>
                    </SelectItem>
                    <SelectItem value="food-waste">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed size={16} />
                        Sprechi Alimentari
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Month */}
              <div className="w-40">
                <label className="text-sm text-zinc-400 mb-2 block">Mese</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800" data-testid="report-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="w-32">
                <label className="text-sm text-zinc-400 mb-2 block">Anno</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800" data-testid="report-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={loadReport}
                className="bg-white text-zinc-950 hover:bg-zinc-200"
                disabled={isLoading}
                data-testid="generate-report"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <FileText size={16} className="mr-2" />
                )}
                Genera Report
              </Button>

              {/* Print Button */}
              {reportData && (
                <Button 
                  onClick={handlePrint}
                  variant="secondary"
                  className="border-zinc-700"
                  data-testid="print-report"
                >
                  <Printer size={16} className="mr-2" />
                  Stampa
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {reportData && (
          <div ref={printRef} className="print:bg-white print:text-black">
            {/* Report Header */}
            <div className="report-section bg-zinc-900 print:bg-white border border-zinc-800 print:border-black">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-black text-white print:text-black">SAVERIANI</h1>
                  <p className="text-zinc-400 print:text-gray-600">Centro di Accoglienza - Brescia</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white print:text-black">
                    {reportType === 'attendance' && 'REPORT PRESENZE'}
                    {reportType === 'security' && 'REPORT SICUREZZA'}
                    {reportType === 'food-waste' && 'REPORT SPRECHI ALIMENTARI'}
                  </p>
                  <p className="text-zinc-400 print:text-gray-600">
                    {getMonthLabel(selectedMonth)} {selectedYear}
                  </p>
                </div>
              </div>

              {/* Attendance Report */}
              {reportType === 'attendance' && (
                <div className="space-y-6" data-testid="attendance-report">
                  {/* Staff Hours */}
                  <div>
                    <h2 className="text-xl font-bold text-white print:text-black mb-4 pb-2 border-b border-zinc-700 print:border-black">
                      Ore Lavorative Staff
                    </h2>
                    <table className="report-table w-full">
                      <thead>
                        <tr>
                          <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Operatore</th>
                          <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Ore Totali</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reportData.staff_attendance || {}).map(([id, data]) => (
                          <tr key={id}>
                            <td className="text-zinc-300 print:text-black">{data.name}</td>
                            <td className="text-zinc-300 print:text-black font-bold">{data.hours} h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Resident Summary */}
                  <div>
                    <h2 className="text-xl font-bold text-white print:text-black mb-4 pb-2 border-b border-zinc-700 print:border-black">
                      Riepilogo Residenti
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-zinc-800 print:bg-gray-100 text-center">
                        <p className="text-3xl font-black text-white print:text-black">
                          {reportData.resident_count}
                        </p>
                        <p className="text-zinc-400 print:text-gray-600">Totale</p>
                      </div>
                      <div className="p-4 bg-emerald-500/20 print:bg-green-100 text-center">
                        <p className="text-3xl font-black text-emerald-500 print:text-green-700">
                          {reportData.residents_by_status?.presente || 0}
                        </p>
                        <p className="text-zinc-400 print:text-gray-600">Presenti</p>
                      </div>
                      <div className="p-4 bg-red-500/20 print:bg-red-100 text-center">
                        <p className="text-3xl font-black text-red-500 print:text-red-700">
                          {reportData.residents_by_status?.isolamento || 0}
                        </p>
                        <p className="text-zinc-400 print:text-gray-600">Isolamento</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Report */}
              {reportType === 'security' && (
                <div className="space-y-6" data-testid="security-report">
                  <div className="p-4 bg-zinc-800 print:bg-gray-100 mb-6">
                    <p className="text-3xl font-black text-white print:text-black">
                      {reportData.total_incidents} Incidenti
                    </p>
                    <p className="text-zinc-400 print:text-gray-600">registrati nel periodo</p>
                  </div>

                  {reportData.incidents?.length > 0 ? (
                    <table className="report-table w-full">
                      <thead>
                        <tr>
                          <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Data</th>
                          <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Turno</th>
                          <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Descrizione</th>
                          <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Operatore</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.incidents.map((incident) => (
                          <tr key={incident.id}>
                            <td className="text-zinc-300 print:text-black">
                              {new Date(incident.created_at).toLocaleDateString('it-IT')}
                            </td>
                            <td className="text-zinc-300 print:text-black capitalize">{incident.shift}</td>
                            <td className="text-zinc-300 print:text-black">{incident.content}</td>
                            <td className="text-zinc-300 print:text-black">{incident.staff_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-zinc-500 print:text-gray-500 text-center py-8">
                      Nessun incidente registrato nel periodo
                    </p>
                  )}
                </div>
              )}

              {/* Food Waste Report */}
              {reportType === 'food-waste' && (
                <div className="space-y-6" data-testid="food-waste-report">
                  {/* Statistics */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-zinc-800 print:bg-gray-100 text-center">
                      <p className="text-3xl font-black text-white print:text-black">
                        {reportData.statistics?.total_meals || 0}
                      </p>
                      <p className="text-zinc-400 print:text-gray-600">Pasti</p>
                    </div>
                    <div className="p-4 bg-zinc-800 print:bg-gray-100 text-center">
                      <p className="text-3xl font-black text-white print:text-black">
                        {reportData.statistics?.total_servings || 0}
                      </p>
                      <p className="text-zinc-400 print:text-gray-600">Porzioni</p>
                    </div>
                    <div className="p-4 bg-zinc-800 print:bg-gray-100 text-center">
                      <p className="text-3xl font-black text-amber-500 print:text-yellow-600">
                        {reportData.statistics?.avg_quality || 0}/5
                      </p>
                      <p className="text-zinc-400 print:text-gray-600">Qualità Media</p>
                    </div>
                    <div className="p-4 bg-red-500/20 print:bg-red-100 text-center">
                      <p className="text-3xl font-black text-red-500 print:text-red-700">
                        {reportData.statistics?.leftover_breakdown?.molti || 0}
                      </p>
                      <p className="text-zinc-400 print:text-gray-600">Avanzi "Molti"</p>
                    </div>
                  </div>

                  {/* Waste Breakdown */}
                  <div>
                    <h2 className="text-xl font-bold text-white print:text-black mb-4 pb-2 border-b border-zinc-700 print:border-black">
                      Riepilogo Avanzi
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-emerald-500/20 print:bg-green-100 text-center">
                        <p className="text-3xl font-black text-emerald-500 print:text-green-700">
                          {reportData.statistics?.leftover_breakdown?.nessuno || 0}
                        </p>
                        <p className="text-zinc-400 print:text-gray-600">Nessuno</p>
                      </div>
                      <div className="p-4 bg-amber-500/20 print:bg-yellow-100 text-center">
                        <p className="text-3xl font-black text-amber-500 print:text-yellow-600">
                          {reportData.statistics?.leftover_breakdown?.pochi || 0}
                        </p>
                        <p className="text-zinc-400 print:text-gray-600">Pochi</p>
                      </div>
                      <div className="p-4 bg-red-500/20 print:bg-red-100 text-center">
                        <p className="text-3xl font-black text-red-500 print:text-red-700">
                          {reportData.statistics?.leftover_breakdown?.molti || 0}
                        </p>
                        <p className="text-zinc-400 print:text-gray-600">Molti</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Records */}
                  {reportData.detailed_records?.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-white print:text-black mb-4 pb-2 border-b border-zinc-700 print:border-black">
                        Dettaglio Pasti
                      </h2>
                      <table className="report-table w-full">
                        <thead>
                          <tr>
                            <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Data</th>
                            <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Tipo</th>
                            <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Porzioni</th>
                            <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Qualità</th>
                            <th className="bg-zinc-800 print:bg-gray-100 text-white print:text-black">Avanzi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.detailed_records.slice(0, 20).map((record) => (
                            <tr key={record.id}>
                              <td className="text-zinc-300 print:text-black">
                                {new Date(record.date).toLocaleDateString('it-IT')}
                              </td>
                              <td className="text-zinc-300 print:text-black capitalize">{record.meal_type}</td>
                              <td className="text-zinc-300 print:text-black">{record.meal_count}</td>
                              <td className="text-zinc-300 print:text-black">{record.quality_rating}/5</td>
                              <td className="text-zinc-300 print:text-black capitalize">{record.leftover_status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-zinc-700 print:border-black text-center">
                <p className="text-sm text-zinc-500 print:text-gray-500">
                  Report generato il {new Date().toLocaleString('it-IT')}
                </p>
                <p className="text-sm text-zinc-500 print:text-gray-500">
                  Sistema Gestione Campo Saveriani - Brescia
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
