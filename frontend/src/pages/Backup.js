import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from 'axios';
import { 
  Download, 
  Upload,
  Database,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileJson
} from 'lucide-react';
import { toast } from 'sonner';

export const Backup = () => {
  const { API, loadData } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get(`${API}/export`);
      const data = response.data;
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `saveriani_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setLastExport(new Date().toISOString());
      toast.success('Backup esportato con successo');
    } catch (error) {
      toast.error('Errore nell\'esportazione del backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Seleziona un file JSON valido');
      return;
    }

    const confirmImport = window.confirm(
      'ATTENZIONE: L\'importazione sovrascriverà TUTTI i dati esistenti.\n\n' +
      'Sei sicuro di voler procedere?'
    );

    if (!confirmImport) {
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      await axios.post(`${API}/import`, data);
      
      toast.success('Dati importati con successo');
      loadData(); // Refresh all data
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('File JSON non valido');
      } else {
        toast.error('Errore nell\'importazione dei dati');
      }
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Backup Dati
          </h1>
          <p className="text-zinc-500">
            Esporta e importa i dati per backup su chiavetta USB
          </p>
        </div>

        {/* Warning Card */}
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-amber-500 mb-2">Sistema Offline-First</h3>
                <p className="text-amber-300/80 text-sm">
                  I dati sono memorizzati localmente su questo computer. 
                  È consigliato effettuare backup regolari su una chiavetta USB per evitare perdite di dati.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Card */}
          <Card className="bg-zinc-900 border-zinc-800" data-testid="export-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Download size={20} />
                Esporta Dati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400 text-sm">
                Scarica tutti i dati del sistema in formato JSON. 
                Il file può essere salvato su una chiavetta USB come backup.
              </p>

              <div className="p-4 bg-zinc-800/50 border border-zinc-700">
                <p className="text-xs text-zinc-500 mb-2">Il backup include:</p>
                <ul className="text-sm text-zinc-300 space-y-1">
                  <li>• Staff e credenziali</li>
                  <li>• Database residenti</li>
                  <li>• Registrazioni presenze</li>
                  <li>• Diario digitale</li>
                  <li>• Passaggi consegne</li>
                  <li>• Registro pasti</li>
                  <li>• Dati lavanderia</li>
                </ul>
              </div>

              {lastExport && (
                <div className="flex items-center gap-2 text-sm text-emerald-500">
                  <CheckCircle2 size={16} />
                  <span>Ultimo export: {new Date(lastExport).toLocaleString('it-IT')}</span>
                </div>
              )}

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                data-testid="export-button"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download size={16} className="mr-2" />
                )}
                Esporta Backup JSON
              </Button>
            </CardContent>
          </Card>

          {/* Import Card */}
          <Card className="bg-zinc-900 border-zinc-800" data-testid="import-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Upload size={20} />
                Importa Dati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400 text-sm">
                Ripristina i dati da un file di backup JSON. 
                Questa operazione sovrascriverà tutti i dati esistenti.
              </p>

              <div className="p-4 bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">
                  <strong>ATTENZIONE:</strong> L'importazione eliminerà tutti i dati attuali e li sostituirà con quelli del backup.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                data-testid="import-input"
              />

              <Button
                onClick={handleImportClick}
                disabled={isImporting}
                variant="secondary"
                className="w-full border-zinc-700"
                data-testid="import-button"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload size={16} className="mr-2" />
                )}
                Seleziona File JSON
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database size={20} />
              Informazioni Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-800/50">
                <p className="text-2xl font-black text-white">
                  <FileJson className="inline w-6 h-6 mr-2" />
                  JSON
                </p>
                <p className="text-xs text-zinc-500">Formato backup</p>
              </div>
              <div className="p-4 bg-zinc-800/50">
                <p className="text-2xl font-black text-white">MongoDB</p>
                <p className="text-xs text-zinc-500">Database</p>
              </div>
              <div className="p-4 bg-zinc-800/50">
                <p className="text-2xl font-black text-emerald-500">Online</p>
                <p className="text-xs text-zinc-500">Stato sistema</p>
              </div>
              <div className="p-4 bg-zinc-800/50">
                <p className="text-2xl font-black text-white">v1.0</p>
                <p className="text-xs text-zinc-500">Versione</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
