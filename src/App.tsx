import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  ShieldAlert,
  UserCheck,
  Laptop,
  Wifi,
  Key,
  Monitor,
  AlertTriangle,
  Flame,
  Database as DatabaseIcon,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Staff {
  id: number;
  name: string;
  department: string;
  staff_info: string;
  remote_access: number;
  problem_type: string | null;
  other_details: string | null;
  updated_at: string;
}

const PROBLEM_TYPES = [
  { id: 'cert', label: 'Certificate Problem', icon: Key, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'vpn', label: 'VPN Problem', icon: Wifi, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'rdp', label: 'RDP Problem', icon: Monitor, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'burnt', label: 'Burn Computer', icon: Flame, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'other', label: 'Other Issue', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function App() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [modalRemoteAccess, setModalRemoteAccess] = useState<boolean | null>(null);
  const [modalProblemType, setModalProblemType] = useState<string>('');
  const [modalOtherDetails, setModalOtherDetails] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('database', file);

    try {
      const res = await fetch('/api/restore-db', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Database restored successfully! Refreshing...');
        window.location.reload();
      } else {
        alert('Failed to restore database: ' + data.error);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setShowDbModal(false);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      setStaff(data.staff);
      setLastUpdate(data.lastUpdate);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      setModalRemoteAccess(selectedStaff.remote_access === 1);
      setModalProblemType(selectedStaff.problem_type || '');
      setModalOtherDetails(selectedStaff.other_details || '');
    } else {
      setModalRemoteAccess(null);
      setModalProblemType('');
      setModalOtherDetails('');
    }
  }, [selectedStaff]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleStatusUpdate = async (id: number, remoteAccess: boolean, problemType?: string, otherDetails?: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remote_access: remoteAccess,
          problem_type: problemType,
          other_details: otherDetails
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setSelectedStaff(null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkVerify = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/staff/bulk-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setSelectedIds(new Set());
        setShowBulkConfirm(false);
      }
    } catch (err) {
      console.error('Failed bulk update:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleDept = (dept: string) => {
    const newCollapsed = new Set(collapsedDepts);
    if (newCollapsed.has(dept)) {
      newCollapsed.delete(dept);
    } else {
      newCollapsed.add(dept);
    }
    setCollapsedDepts(newCollapsed);
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.staff_info.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filterStatus === 'all') return true;
      if (filterStatus === 'ok') return s.remote_access === 1;
      if (filterStatus === 'cert') return s.problem_type === 'cert';
      if (filterStatus === 'vpn') return s.problem_type === 'vpn';
      if (filterStatus === 'rdp') return s.problem_type === 'rdp';
      if (filterStatus === 'burnt') return s.problem_type === 'burnt';
      if (filterStatus === 'pending') return s.problem_type === 'verification_requested';
      if (filterStatus === 'other') return s.problem_type === 'other';
      
      return true;
    });
  }, [staff, searchQuery, filterStatus]);

  const groupedStaff = useMemo(() => {
    const groups: Record<string, Staff[]> = {};
    filteredStaff.forEach(s => {
      if (!groups[s.department]) groups[s.department] = [];
      groups[s.department].push(s);
    });
    return groups;
  }, [filteredStaff]);

  const departments = Object.keys(groupedStaff).sort((a, b) => {
    const order = [
      "საბანკო სერვისების განვითარების დეპარტამენტი",
      "ციფრული ბანკინგის დეპარტამენტი",
      "ბიზნეს ანალიტიკისა და რეპორტინგის დეპარტამენტი (AI გუნდი)",
      "საკრედიტო სისტემების დეპარტამენტი",
      "DWH-ის დეპარტამენტი",
      "პროცესინგის დეპარტამენტი",
      "ავტომატიზაციის გუნდი"
    ];
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading BCP Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="text-emerald-600" />
              Liberty Bank BCP Tracker
            </h1>
            {lastUpdate && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Clock size={12} />
                Last Update Date Time: {formatDate(lastUpdate)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDbModal(true)}
              title="Database Management"
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
            >
              <DatabaseIcon size={20} />
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowBulkConfirm(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
              >
                <UserCheck size={16} />
                Request Verification ({selectedIds.size})
              </button>
            )}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          <button
            onClick={() => setFilterStatus('all')}
            title="დააჭირეთ დაფილტვრისთვის"
            className={`relative rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              filterStatus === 'all' 
                ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900 ring-offset-2' 
                : 'bg-white border border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`text-2xl font-bold ${filterStatus === 'all' ? 'text-white' : 'text-slate-900'}`}>
              {staff.length}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${filterStatus === 'all' ? 'text-slate-300' : 'text-zinc-400'}`}>ALL</div>
          </button>

          <button
            onClick={() => setFilterStatus('ok')}
            title="დააჭირეთ დაფილტვრისთვის"
            className={`relative rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              filterStatus === 'ok' 
                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-600 ring-offset-2' 
                : 'bg-white border border-emerald-100 hover:border-emerald-200'
            }`}
          >
            <div className={`text-2xl font-bold ${filterStatus === 'ok' ? 'text-white' : 'text-emerald-600'}`}>
              {staff.filter(s => s.remote_access === 1).length}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${filterStatus === 'ok' ? 'text-emerald-100' : 'text-zinc-400'}`}>Remote OK</div>
          </button>

          <button
            onClick={() => setFilterStatus('cert')}
            title="დააჭირეთ დაფილტვრისთვის"
            className={`relative rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              filterStatus === 'cert' 
                ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-600 ring-offset-2' 
                : 'bg-white border border-amber-100 hover:border-amber-200'
            }`}
          >
            <div className={`text-2xl font-bold ${filterStatus === 'cert' ? 'text-white' : 'text-amber-600'}`}>
              {staff.filter(s => s.problem_type === 'cert').length}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${filterStatus === 'cert' ? 'text-amber-100' : 'text-zinc-400'}`}>Cert Prob</div>
          </button>

          <button
            onClick={() => setFilterStatus('vpn')}
            title="დააჭირეთ დაფილტვრისთვის"
            className={`relative rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              filterStatus === 'vpn' 
                ? 'bg-orange-600 text-white border-orange-600 ring-2 ring-orange-600 ring-offset-2' 
                : 'bg-white border border-orange-100 hover:border-orange-200'
            }`}
          >
            <div className={`text-2xl font-bold ${filterStatus === 'vpn' ? 'text-white' : 'text-orange-600'}`}>
              {staff.filter(s => s.problem_type === 'vpn').length}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${filterStatus === 'vpn' ? 'text-orange-100' : 'text-zinc-400'}`}>VPN Prob</div>
          </button>

          <button
            onClick={() => setFilterStatus('rdp')}
            title="დააჭირეთ დაფილტვრისთვის"
            className={`relative rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              filterStatus === 'rdp' 
                ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-600 ring-offset-2' 
                : 'bg-white border border-purple-100 hover:border-purple-200'
            }`}
          >
            <div className={`text-2xl font-bold ${filterStatus === 'rdp' ? 'text-white' : 'text-purple-600'}`}>
              {staff.filter(s => s.problem_type === 'rdp').length}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${filterStatus === 'rdp' ? 'text-purple-100' : 'text-zinc-400'}`}>RDP Prob</div>
          </button>

          <button
            onClick={() => setFilterStatus('burnt')}
            title="დააჭირეთ დაფილტვრისთვის"
            className={`relative rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              filterStatus === 'burnt' 
                ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-600 ring-offset-2' 
                : 'bg-white border border-red-100 hover:border-red-200'
            }`}
          >
            <div className={`text-2xl font-bold ${filterStatus === 'burnt' ? 'text-white' : 'text-red-600'}`}>
              {staff.filter(s => s.problem_type === 'burnt').length}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${filterStatus === 'burnt' ? 'text-red-100' : 'text-zinc-400'}`}>Burn Comp</div>
          </button>

          <button
            onClick={() => setFilterStatus('pending')}
            title="დააჭირეთ დაფილტვრისთვის"
            className={`relative rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              filterStatus === 'pending' 
                ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-600 ring-offset-2' 
                : 'bg-white border border-blue-100 hover:border-blue-200'
            }`}
          >
            <div className={`text-2xl font-bold ${filterStatus === 'pending' ? 'text-white' : 'text-blue-600'}`}>
              {staff.filter(s => s.problem_type === 'verification_requested').length}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${filterStatus === 'pending' ? 'text-blue-100' : 'text-zinc-400'}`}>Pending Verify</div>
          </button>

          <button
            onClick={() => setFilterStatus('other')}
            title="დააჭირეთ დაფილტვრისთვის"
            className={`relative rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              filterStatus === 'other' 
                ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-600 ring-offset-2' 
                : 'bg-white border border-rose-100 hover:border-rose-200'
            }`}
          >
            <div className={`text-2xl font-bold ${filterStatus === 'other' ? 'text-white' : 'text-rose-600'}`}>
              {staff.filter(s => s.problem_type === 'other').length}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${filterStatus === 'other' ? 'text-rose-100' : 'text-zinc-400'}`}>Other Issue</div>
          </button>
        </div>

        {/* Staff List */}
        <div className="space-y-8">
          {departments.map(dept => (
            <section key={dept}>
              <button 
                onClick={() => toggleDept(dept)}
                className="w-full text-left text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: collapsedDepts.has(dept) ? 0 : 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight size={16} className="text-emerald-500" />
                  </motion.div>
                  {dept}
                  <span className="ml-2 text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full lowercase tracking-normal">
                    {groupedStaff[dept].length} staff
                  </span>
                </div>
              </button>
              
              <AnimatePresence initial={false}>
                {!collapsedDepts.has(dept) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3 pb-2">
                      {groupedStaff[dept].map(person => {
                        const isSelected = selectedIds.has(person.id);
                        const isPending = person.problem_type === 'verification_requested';
                        
                        return (
                          <motion.div
                            layout
                            key={person.id}
                            onClick={() => setSelectedStaff(person)}
                            className={`group relative bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between ${
                              person.remote_access === 1 ? 'border-emerald-100 bg-emerald-50/30' : 
                              isPending ? 'border-blue-100 bg-blue-50/30' :
                              person.problem_type ? 'border-rose-100 bg-rose-50/30' : 'border-slate-200'
                            } ${isSelected ? 'ring-2 ring-slate-900' : ''}`}
                          >
                            <div className="flex items-center gap-4">
                              <div 
                                onClick={(e) => toggleSelect(person.id, e)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                                  isSelected ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <CheckCircle2 size={14} className="text-white" />}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900">{person.name}</h3>
                                <p className="text-xs text-slate-500">{person.staff_info}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {person.remote_access === 1 ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full text-xs font-bold">
                                  <CheckCircle2 size={14} />
                                  REMOTE OK
                                </div>
                              ) : isPending ? (
                                <div className="flex items-center gap-1.5 text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-xs font-bold">
                                  <Clock size={14} />
                                  PENDING VERIFY
                                </div>
                              ) : person.problem_type ? (
                                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-100 px-3 py-1 rounded-full text-xs font-bold">
                                  <AlertCircle size={14} />
                                  {PROBLEM_TYPES.find(p => p.id === person.problem_type)?.label || 'ISSUE'}
                                </div>
                              ) : (
                                <div className="text-slate-400 text-xs font-bold px-3 py-1 border border-slate-200 rounded-full">
                                  NOT SET
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          ))}
        </div>
      </main>

      {/* Status Update Modal */}
      <AnimatePresence>
        {selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStaff(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedStaff.name}</h2>
                    <p className="text-slate-500">{selectedStaff.staff_info}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedStaff(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <AlertCircle className="rotate-45 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Do you have remote access?</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        disabled={saving}
                        onClick={() => {
                          setModalRemoteAccess(true);
                          handleStatusUpdate(selectedStaff.id, true);
                        }}
                        className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          modalRemoteAccess === true 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                            : 'border-slate-100 hover:border-emerald-200'
                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {saving && modalRemoteAccess === true ? (
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 size={20} />
                        )}
                        <span className="font-bold">YES</span>
                      </button>
                      <button
                        disabled={saving}
                        onClick={() => setModalRemoteAccess(false)}
                        className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          modalRemoteAccess === false
                            ? 'border-rose-500 bg-rose-50 text-rose-700' 
                            : 'border-slate-100 hover:border-rose-200'
                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <AlertCircle size={20} />
                        <span className="font-bold">NO</span>
                      </button>
                    </div>
                  </div>

                  {modalRemoteAccess === false && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">What is the problem?</label>
                        <select
                          disabled={saving}
                          value={modalProblemType}
                          onChange={(e) => setModalProblemType(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
                        >
                          <option value="">Select a problem...</option>
                          {PROBLEM_TYPES.filter(p => p.id !== 'verification_requested').map(prob => (
                            <option key={prob.id} value={prob.id}>{prob.label}</option>
                          ))}
                        </select>
                      </div>

                      {modalProblemType === 'other' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <label className="block text-sm font-bold text-slate-700 mb-2">Please specify</label>
                          <textarea
                            disabled={saving}
                            value={modalOtherDetails}
                            onChange={(e) => setModalOtherDetails(e.target.value)}
                            placeholder="Enter details here..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[100px] disabled:opacity-50"
                          />
                        </motion.div>
                      )}

                      <button
                        disabled={saving || !modalProblemType}
                        onClick={() => handleStatusUpdate(selectedStaff.id, false, modalProblemType, modalOtherDetails)}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        {saving ? 'Saving...' : 'Save Status'}
                      </button>
                    </motion.div>
                  )}

                  {selectedStaff.problem_type === 'verification_requested' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                      <div className="flex gap-3">
                        <Clock className="text-blue-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-blue-900">Verification Requested</p>
                          <p className="text-xs text-blue-700 mt-1">IT Support has fixed your issue. Please check your access and update your status to YES if it works.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Database Management Modal */}
      <AnimatePresence>
        {showDbModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDbModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <DatabaseIcon className="text-emerald-600" />
                Database Management
              </h2>

              <div className="space-y-4">
                <a
                  href="/api/download-db"
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Download className="text-slate-400 group-hover:text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-900">Download Backup</p>
                      <p className="text-xs text-slate-500">Save current data to your computer</p>
                    </div>
                  </div>
                </a>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleDbUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className={`flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl transition-all ${uploading ? 'opacity-50' : 'hover:bg-amber-50 hover:border-amber-200 group'}`}>
                    <div className="flex items-center gap-3">
                      <Upload className={`text-slate-400 ${!uploading && 'group-hover:text-amber-600'}`} />
                      <div>
                        <p className="font-bold text-slate-900">{uploading ? 'Uploading...' : 'Restore from Backup'}</p>
                        <p className="text-xs text-slate-500">Upload a previously saved backup.json file</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setShowDbModal(false)}
                  className="w-full py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Confirmation Modal */}
      <AnimatePresence>
        {showBulkConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
            >
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0" />
                  <p className="text-sm font-bold text-amber-900">
                    ამ მოქმედების საშუალება აქვთ მხოლოდ IT support specialist-ებს და გთხოვთ რომ თვითნებურად არ შეუცვალოთ სტატუსი
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">Request Verification?</h2>
              <p className="text-slate-500 mb-6">
                Are you sure you want to request verification for {selectedIds.size} selected staff members? Their status will be set to Pending Verification.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={handleBulkVerify}
                  className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {saving ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
