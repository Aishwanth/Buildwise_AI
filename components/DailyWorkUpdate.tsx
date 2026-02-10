import * as React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, Calendar, FileText, Image as ImageIcon, Download, Loader } from 'lucide-react';
import { getWorkEntries, saveWorkEntry, updateWorkEntry, deleteWorkEntry } from '../services/supabaseClient';
import { ProjectDataSync } from '../services/dataSync';
import { useAuth } from '../context/AuthContext';

export interface DailyWorkEntry {
  id: string;
  date: string;
  description: string;
  photos: {
    id: string;
    name: string;
    dataUrl: string;
    uploadedAt: string;
  }[];
  created_at?: string;
}

interface DailyWorkUpdateProps { }

const DailyWorkUpdate: React.FC<DailyWorkUpdateProps> = () => {
  const { projectId } = useAuth();
  const [workEntries, setWorkEntries] = useState<DailyWorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<DailyWorkEntry['photos']>([]);
  const [photoInput, setPhotoInput] = useState<File | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<DailyWorkEntry['photos'][0] | null>(null);

  // Load work entries from Supabase on component mount or project change
  useEffect(() => {
    if (projectId) {
      loadWorkEntries();
    }
  }, [projectId]);

  const loadWorkEntries = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const entries = await getWorkEntries(projectId);
      // Convert Supabase data format to component format
      const formattedEntries = entries.map((entry: any) => ({
        id: entry.id,
        date: entry.date,
        description: entry.description,
        photos: entry.photos || [],
        created_at: entry.created_at,
      }));
      setWorkEntries(formattedEntries);
    } catch (error) {
      console.error('Failed to load work entries:', error);
      // Fallback to ProjectDataSync (localStorage) if Supabase not set up or failed
      const entries = ProjectDataSync.getProjectWorkEntries();
      if (entries.length > 0) {
        setWorkEntries(entries);
        console.log('Loaded from ProjectDataSync fallback.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = () => {
    if (!photoInput) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const newPhoto = {
        id: Date.now().toString(),
        name: photoInput.name,
        dataUrl: e.target?.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setPhotos([...photos, newPhoto]);
      setPhotoInput(null);
    };
    reader.readAsDataURL(photoInput);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
  };

  const handleAddEntry = async () => {
    if (!selectedDate || !description.trim()) return;

    try {
      const projectCode = ProjectDataSync.getCurrentProjectCode();
      const entryData = {
        project_id: projectId || undefined,
        project_code: projectCode || undefined,
        date: selectedDate,
        description,
        photos,
      };

      // Save for current project in localStorage (isolated)
      ProjectDataSync.saveWorkEntry(entryData);

      // Attempt Supabase save
      await saveWorkEntry(entryData);

      // Reload entries from Supabase
      await loadWorkEntries();
      resetForm();
    } catch (error: any) {
      console.error('Failed to add work entry:', error);
      const errorMsg = error.message || 'Failed to save work entry.';
      alert(`❌ ${errorMsg}\n\nIf this is your first time, make sure to create the Supabase tables!`);
    }
  };

  const handleUpdateEntry = async (id: string) => {
    try {
      await updateWorkEntry(id, {
        date: selectedDate,
        description,
        photos,
      });
      // Reload entries from Supabase
      await loadWorkEntries();
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update work entry:', error);
      alert('Failed to update work entry. Please try again.');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Delete this work entry?')) {
      try {
        await deleteWorkEntry(id);
        // Reload entries from Supabase
        await loadWorkEntries();
      } catch (error) {
        console.error('Failed to delete work entry:', error);
        alert('Failed to delete work entry. Please try again.');
      }
    }
  };

  const startEditEntry = (entry: DailyWorkEntry) => {
    setEditingId(entry.id);
    setSelectedDate(entry.date);
    setDescription(entry.description);
    setPhotos([...entry.photos]);
  };

  const resetForm = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setPhotos([]);
    setPhotoInput(null);
    setIsAdding(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 rounded-3xl border border-slate-200 shadow-sm gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Daily Work Updates</h2>
          <p className="text-slate-500 font-medium">Document daily progress with descriptions and photos</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Add Work Update
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-4 text-slate-600 font-bold">Loading work entries...</span>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
            <div className="sticky top-0 bg-white flex justify-between items-center p-8 border-b border-slate-200">
              <h3 className="text-2xl font-black text-slate-800">
                {editingId ? 'Edit Work Update' : 'Add Daily Work Update'}
              </h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Step 1: Select Date */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>

              {/* Step 2: Describe Work */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Work Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the work done today... (e.g., Foundation concrete pouring, Steel reinforcement inspection, etc.)"
                  rows={5}
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold resize-none"
                />
              </div>

              {/* Step 3: Add Photos */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  Work Photos
                </label>

                <div className="flex gap-3 mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoInput(e.target.files?.[0] || null)}
                    className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleAddPhoto}
                    disabled={!photoInput}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    Add Photo
                  </button>
                </div>

                {/* Photo Preview */}
                {photos.length > 0 && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <p className="text-sm font-bold text-slate-600 mb-4">{photos.length} photo(s) selected</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group rounded-xl overflow-hidden border border-slate-200"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.name}
                            className="w-full h-32 object-cover"
                          />
                          <button
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 className="w-6 h-6 text-white" />
                          </button>
                          <p className="text-[10px] text-slate-500 mt-1 truncate">{photo.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={() => (editingId ? handleUpdateEntry(editingId) : handleAddEntry())}
                disabled={!selectedDate || !description.trim()}
                className={`w-full py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 transition-all ${selectedDate && description.trim()
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? 'Save Changes' : 'Create Work Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Work Entries Timeline */}
      {!loading && (
        <div className="space-y-6">
          {workEntries.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-bold">No work updates yet</p>
              <p className="text-slate-400">Start documenting daily progress by adding your first work update</p>
            </div>
          ) : (
            workEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Entry Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Work Date</p>
                      <h3 className="text-2xl font-black text-slate-800">{formatDate(entry.date)}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditEntry(entry)}
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Entry Content */}
                <div className="p-8">
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Description</p>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{entry.description}</p>
                  </div>

                  {/* Photos Section */}
                  {entry.photos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
                        Work Photos ({entry.photos.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {entry.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer"
                            onClick={() => setViewingPhoto(photo)}
                          >
                            <img
                              src={photo.dataUrl}
                              alt={photo.name}
                              className="w-full h-40 object-cover group-hover:scale-110 transition-transform"
                            />
                            <div
                              className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <div className="bg-white rounded-full p-3 shadow-lg">
                                <Download className="w-5 h-5 text-blue-600" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Entry Footer */}
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
                  <p className="text-[10px] text-slate-500 font-bold">
                    Created: {new Date(entry.created_at || new Date()).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute top-6 right-6 bg-white rounded-full p-2 shadow-lg hover:bg-slate-100 z-10"
            >
              <X className="w-6 h-6 text-slate-800" />
            </button>

            <div className="flex flex-col items-center justify-center p-8">
              <img
                src={viewingPhoto.dataUrl}
                alt={viewingPhoto.name}
                className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
              />
              <div className="mt-6 w-full text-center">
                <p className="text-slate-600 font-bold mb-3">{viewingPhoto.name}</p>
                <a
                  href={viewingPhoto.dataUrl}
                  download={viewingPhoto.name}
                  className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-black hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Download Photo
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyWorkUpdate;
