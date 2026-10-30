/**
 * @file src/components/client/DocumentVault.tsx
 * @description Bóveda Digital del Cliente con filtrado estricto `visible_to_client === true`,
 * carga real de archivos (PDF, imágenes, Word) con sincronización en la nube y visor seguro.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { FileItem } from '../../types';
import { getFiles, uploadFile, subscribeToChanges } from '../../firebase/firestoreService';
import { downloadFile } from '../../utils/fileDownload';
import { 
  FolderLock, 
  FileText, 
  Download, 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  X,
  FileCheck,
  AlertCircle,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';

interface DocumentVaultProps {
  clientId: string;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ clientId }) => {
  const { showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Estados de archivo a subir
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'Identificación' | 'Formularios' | 'Evidencias' | 'Notificaciones USCIS' | 'Otros'>('Identificación');
  const [isUploading, setIsUploading] = useState(false);

  // Modal de previsualización
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Carga con rol 'client': filtrará automáticamente visible_to_client === true
  const loadVaultFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const clientFiles = await getFiles(clientId, 'client');
      setFiles(clientFiles);
    } catch (err) {
      console.error(err);
      showToast('Error al cargar la bóveda de documentos', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [clientId, showToast]);

  useEffect(() => {
    loadVaultFiles();
    const unsub = subscribeToChanges(() => {
      loadVaultFiles();
    });
    return () => unsub();
  }, [loadVaultFiles]);

  // Manejo de selección de archivo en disco
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast('El archivo excede el límite permitido de 25 MB', 'error');
      return;
    }

    setSelectedFile(file);
    setUploadFileName(file.name);

    // Leer como Base64 Data URL
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Manejo de subida a la nube
  const handleClientUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !uploadFileName.trim()) {
      showToast('Por favor seleccione un archivo para subir', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const sanitizedName = uploadFileName.trim() || selectedFile?.name || 'Documento_Civil.pdf';
      const sizeStr = selectedFile 
        ? (selectedFile.size > 1024 * 1024 
            ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` 
            : `${Math.round(selectedFile.size / 1024)} KB`)
        : '1.2 MB';

      const created = await uploadFile({
        client_id: clientId,
        file_name: sanitizedName,
        file_url: `/uploads/${encodeURIComponent(sanitizedName)}`,
        file_size: sizeStr,
        category: uploadCategory,
        uploaded_by: 'client',
        uploaded_at: new Date().toISOString(),
        visible_to_client: true,
        file_data: fileBase64 || undefined
      });

      setFiles(prev => [created, ...prev.filter(f => f.id !== created.id)]);
      setSelectedFile(null);
      setFileBase64('');
      setUploadFileName('');
      setIsUploadOpen(false);
      showToast('Documento radicado y guardado en la bóveda con éxito', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al subir el documento', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
      
      {/* Encabezado de la Bóveda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <FolderLock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
              Bóveda Digital de Documentos
            </h2>
            <p className="text-xs text-slate-500">
              Expediente cifrado con certificados oficiales y formularios de su caso
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsUploadOpen(!isUploadOpen);
            setSelectedFile(null);
            setFileBase64('');
            setUploadFileName('');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4 text-amber-400" />
          <span>Subir Documento</span>
        </button>
      </div>

      {/* Formulario para que el Cliente Suba Documentos Reales */}
      {isUploadOpen && (
        <form onSubmit={handleClientUpload} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-amber-600" />
              Adjuntar Archivo para Lic. Ronny Peña | ConsularVisa
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Cifrado Seguro SSL
            </span>
          </div>

          {/* Selector de Archivo de Computadora */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Seleccionar Archivo de su Computadora o Dispositivo *
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer bg-white transition-colors"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3 text-slate-800">
                  <FileCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Documento'}
                    </p>
                  </div>
                  <span className="text-xs text-amber-600 font-semibold underline ml-2">Cambiar</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Haga clic aquí para examinar archivos en su computadora
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Formatos admitidos: PDF, JPG, PNG, DOCX (máx. 25 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Descripción o Nombre en Bóveda *
              </label>
              <input
                type="text"
                required
                placeholder="ej. Pasaporte_Vigente_Pagina_Datos.pdf"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Categoría de Evidencia
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Identificación">Identificación (Pasaporte, DNI, Licencia)</option>
                <option value="Evidencias">Pruebas / Solvencia Económica / Cartas</option>
                <option value="Formularios">Formulario Firmado</option>
                <option value="Notificaciones USCIS">Notificaciones Recibidas</option>
                <option value="Otros">Otros Documentos</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || (!selectedFile && !uploadFileName.trim())}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{isUploading ? 'Guardando en la Nube...' : 'Cargar a la Bóveda Segura'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Documentos Disponibles para el Cliente */}
      {isLoading ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Cargando documentos verificados de la nube...
        </div>
      ) : files.length === 0 ? (
        <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FolderLock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No hay documentos públicos por ahora</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            El Lic. Ronny Peña | ConsularVisa publicará aquí las copias autorizadas y notificaciones de USCIS una vez aprobadas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400/60 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-800 group-hover:bg-amber-100 transition-colors shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      {file.category || 'Expediente'}
                    </span>
                    {file.file_size && (
                      <span className="text-[10px] text-slate-400">{file.file_size}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 text-[10px]">
                  {new Date(file.uploaded_at).toLocaleDateString()}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    title="Ver documento"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      downloadFile(file);
                      showToast(`Descargando copia segura: ${file.file_name}`, 'info');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
                    title="Descargar a su computadora"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Previsualización de Documento */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold truncate">{previewFile.file_name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {previewFile.file_data && previewFile.file_data.startsWith('data:image/') ? (
                <img 
                  src={previewFile.file_data} 
                  alt={previewFile.file_name}
                  className="max-h-[60vh] max-w-full mx-auto rounded-lg object-contain shadow-xs" 
                />
              ) : previewFile.file_data && previewFile.file_data.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewFile.file_data}
                  title={previewFile.file_name}
                  className="w-full h-[55vh] rounded-lg border border-slate-200"
                />
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <FileText className="w-12 h-12 text-amber-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">{previewFile.file_name}</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Documento certificado radicado en la bóveda de Consularvisa bajo la categoría <strong>{previewFile.category || 'Expediente'}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tamaño: {previewFile.file_size || '1.2 MB'} • Fecha: {new Date(previewFile.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Expediente Oficial Consularvisa</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadFile(previewFile);
                    showToast(`Descargando copia segura: ${previewFile.file_name}`, 'info');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Descargar Archivo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nota de Privacidad Legal */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <p>
          Todos los archivos visibles en esta bóveda cumplen con los estándares de privacidad y confidencialidad abogado-cliente de Consularvisa.
        </p>
      </div>

    </div>
  );
};
