import * as React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, Loader } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getMaterials, saveMaterial, updateMaterial, deleteMaterial, getPublicUrl } from '../services/supabaseClient';
import { ProjectDataSync } from '../services/dataSync';
import { useAuth } from '../context/AuthContext';

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  billPhoto?: {
    name: string;
    dataUrl: string;
    uploadedAt: string;
  };
}

interface MaterialsProps { }

const Materials: React.FC<MaterialsProps> = () => {
  const { projectId } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: '',
    costPerUnit: 0,
    billPhoto: null as { name: string; dataUrl: string; uploadedAt: string } | null,
  });
  const [billPhotoFile, setBillPhotoFile] = useState<File | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ name: string; url: string } | null>(null);

  // Load materials from Supabase on component mount or project change
  useEffect(() => {
    if (projectId) {
      loadMaterials();
    }
  }, [projectId]);

  const loadMaterials = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await getMaterials(projectId);
      // Convert Supabase format to component format
      const formattedMaterials = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        costPerUnit: item.cost_per_unit || item.costPerUnit,
        billPhoto: item.bill_photo || item.billPhoto || undefined,
      }));
      setMaterials(formattedMaterials);
    } catch (error) {
      console.error('Failed to load materials:', error);
      // Fallback if needed
    } finally {
      setLoading(false);
    }
  };

  // Sync with Budget Tracking
  useEffect(() => {
    if (materials.length > 0) {
      ProjectDataSync.saveMaterials(materials);
    }
  }, [materials]);

  const totalCost = materials.reduce((sum, m) => sum + (m.quantity * m.costPerUnit), 0);

  const chartData = materials.map(m => ({
    name: m.name.substring(0, 12),
    cost: m.quantity * m.costPerUnit,
    quantity: m.quantity,
  }));

  const handleAdd = async () => {
    if (!formData.name || !formData.unit) return;
    try {
      const projectCode = ProjectDataSync.getCurrentProjectCode();
      // Attempt Supabase save
      await saveMaterial({
        project_id: projectId || undefined,
        project_code: projectCode || undefined,
        name: formData.name,
        quantity: formData.quantity,
        unit: formData.unit,
        cost_per_unit: formData.costPerUnit,
        bill_photo: formData.billPhoto ? {
          name: formData.billPhoto.name,
          url: formData.billPhoto.dataUrl,
          uploaded_at: formData.billPhoto.uploadedAt
        } : undefined,
      });

      // Reload materials from Supabase
      await loadMaterials();
      resetForm();
    } catch (error: any) {
      console.error('Failed to add material:', error);
      const errorMsg = error.message || 'Failed to save material.';
      alert(`❌ ${errorMsg}\n\nIf this is your first time, make sure to create the Supabase tables!`);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateMaterial(id, {
        name: formData.name,
        quantity: formData.quantity,
        unit: formData.unit,
        cost_per_unit: formData.costPerUnit,
        bill_photo: formData.billPhoto ? {
          name: formData.billPhoto.name,
          url: formData.billPhoto.dataUrl,
          uploaded_at: formData.billPhoto.uploadedAt
        } : undefined,
      } as any);
      // Reload materials from Supabase
      await loadMaterials();
      setEditingId(null);
      resetForm();
    } catch (error: any) {
      console.error('Failed to update material:', error);
      const errorMsg = error.message || 'Failed to update material.';
      alert(`❌ ${errorMsg}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this material?')) {
      try {
        await deleteMaterial(id);
        // Reload materials from Supabase
        await loadMaterials();
      } catch (error: any) {
        console.error('Failed to delete material:', error);
        const errorMsg = error.message || 'Failed to delete material.';
        alert(`❌ ${errorMsg}`);
      }
    }
  };

  const startEdit = (material: Material) => {
    setEditingId(material.id);
    setFormData({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      costPerUnit: material.costPerUnit,
      billPhoto: material.billPhoto || null,
    });
  };

  const resetForm = () => {
    setFormData({ name: '', quantity: 0, unit: '', costPerUnit: 0, billPhoto: null });
    setBillPhotoFile(null);
    setIsAdding(false);
    setIsAdding(false);
  };

  const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 rounded-3xl border border-slate-200 shadow-sm gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Materials Management</h2>
          <p className="text-slate-500 font-medium">Track materials, quantities, and costs</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Add Material
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-4 text-slate-600 font-bold">Loading materials...</span>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800">
                {editingId ? 'Edit Material' : 'Add New Material'}
              </h3>
              <button
                onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                  Material Name
                </label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cement"
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                    Unit
                  </label>
                  <input
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="bags, tons, etc."
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                  Cost Per Unit (₹)
                </label>
                <input
                  type="number"
                  value={formData.costPerUnit}
                  onChange={e => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              {/* Bill Photo Upload */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                  Bill/Receipt Photo (Optional)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBillPhotoFile(e.target.files?.[0] || null)}
                    className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <button
                    onClick={() => {
                      if (!billPhotoFile) return;
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setFormData({
                          ...formData,
                          billPhoto: {
                            name: billPhotoFile.name,
                            dataUrl: e.target?.result as string,
                            uploadedAt: new Date().toISOString(),
                          },
                        });
                        setBillPhotoFile(null);
                      };
                      reader.readAsDataURL(billPhotoFile);
                    }}
                    disabled={!billPhotoFile}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
                {formData.billPhoto && (
                  <div className="mt-3 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <img
                        src={(formData.billPhoto as any).dataUrl || (formData.billPhoto as any).url}
                        alt="Bill"
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                      <span className="text-sm font-bold text-slate-700 truncate">{formData.billPhoto.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFormData({ ...formData, billPhoto: null })}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 mt-4 hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? 'Save Changes' : 'Add Material'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Materials Table */}
      {!loading && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Material Name
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Quantity
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Unit
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Cost/Unit
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Cost
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Bill Photo
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {materials.map((material) => (
                  <tr key={material.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6 font-bold text-slate-800">{material.name}</td>
                    <td className="px-10 py-6 font-bold text-slate-600">{material.quantity.toLocaleString()}</td>
                    <td className="px-10 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">
                        {material.unit}
                      </span>
                    </td>
                    <td className="px-10 py-6 font-bold text-slate-600">₹{material.costPerUnit.toLocaleString()}</td>
                    <td className="px-10 py-6">
                      <div className="text-indigo-600 font-black text-lg">
                        ₹{(material.quantity * material.costPerUnit).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      {material.billPhoto ? (
                        <button
                          onClick={async () => {
                            const bp: any = material.billPhoto;
                            let url = bp.dataUrl || bp.url || '';
                            if (!url && bp.path && bp.bucket) {
                              url = getPublicUrl(bp.bucket, bp.path) || '';
                            } else if (!url && bp.path) {
                              url = getPublicUrl('bill-photos', bp.path) || getPublicUrl('work-photos', bp.path) || '';
                            }
                            setViewingPhoto({ name: bp.name || 'Photo', url });
                          }}
                          className="inline-block"
                        >
                          <img
                            src={(material.billPhoto as any).dataUrl || (material.billPhoto as any).url}
                            alt="Bill"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 hover:border-blue-500 transition-all cursor-pointer"
                            title={(material.billPhoto as any).name}
                          />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm font-bold">—</span>
                      )}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(material)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Cost Footer */}
          <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
            <div>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">
                Total Material Cost
              </p>
              <p className="text-3xl font-black">₹{totalCost.toLocaleString()}</p>
            </div>
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-indigo-500/20">
              Generate Report
            </button>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Breakdown Bar Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6">Cost Breakdown by Material</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Bar dataKey="cost" fill="#4f46e5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Distribution Pie Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6">Material Cost Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="cost"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `₹${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-3xl border border-indigo-200 shadow-sm">
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-2">Total Items</p>
          <p className="text-4xl font-black text-indigo-900">{materials.length}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-8 rounded-3xl border border-violet-200 shadow-sm">
          <p className="text-[10px] text-violet-600 font-black uppercase tracking-widest mb-2">Total Cost</p>
          <p className="text-4xl font-black text-violet-900">₹{(totalCost / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-3xl border border-orange-200 shadow-sm">
          <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-2">Avg. Cost/Item</p>
          <p className="text-4xl font-black text-orange-900">
            ₹{materials.length > 0 ? Math.round(totalCost / materials.length).toLocaleString() : 0}
          </p>
        </div>
      </div>
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
                src={viewingPhoto.url}
                alt={viewingPhoto.name}
                className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
              />
              <div className="mt-6 w-full text-center">
                <p className="text-slate-600 font-bold mb-3">{viewingPhoto.name}</p>
                <a
                  href={viewingPhoto.url}
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

export default Materials;
