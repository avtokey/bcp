import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertCircle, User, ShieldCheck, ShieldAlert, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Staff {
  id: number;
  name: string;
  department: string;
  staff_info: string | null;
  remote_access: number;
  problem_type: string | null;
  other_details: string | null;
  updated_at: string;
}

export default function App() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [lastGlobalUpdate, setLastGlobalUpdate] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Form state
  const [remoteAccess, setRemoteAccess] = useState<boolean>(true);
  const [problemType, setProblemType] = useState<string>('');
  const [otherDetails, setOtherDetails] = useState<string>('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      setStaff(data.staff);
      setLastGlobalUpdate(data.lastUpdate);
    } catch (err) {
      console.error('Failed to fetch staff', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStaff = (person: Staff) => {
    setSelectedStaff(person);
    setRemoteAccess(person.remote_access === 1);
    setProblemType(person.problem_type || '');
    setOtherDetails(person.other_details || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remote_access: remoteAccess,
          problem_type: remoteAccess ? null : problemType,
          other_details: remoteAccess ? null : otherDetails
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastGlobalUpdate(data.lastUpdate);
        await fetchStaff();
        setSelectedStaff(null);
      }
    } catch (err) {
      console.error('Update failed', err);
    } finally {
      setUpdating(false);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.department && s.department.toLowerCase().includes(search.toLowerCase())) ||
    (s.staff_info && s.staff_info.toLowerCase().includes(search.toLowerCase()))
  );

  // Group staff by department
  const groupedStaff = filteredStaff.reduce((acc, person) => {
    const dept = person.department || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(person);
    return acc;
  }, {} as Record<string, Staff[]>);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString('ka-GE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBulkVerify = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/staff/bulk-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (res.ok) {
        const data = await res.json();
        setLastGlobalUpdate(data.lastUpdate);
        await fetchStaff();
        setSelectedIds(new Set());
        setShowBulkConfirm(false);
      }
    } catch (err) {
      console.error('Bulk update failed', err);
    } finally {
      setUpdating(false);
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" />
              Liberty Bank BCP Tracker
            </h1>
            <div className="mt-1 space-y-0.5">
              <p className="text-zinc-500 text-sm">Incident Status Monitoring</p>
              <p className="text-zinc-400 text-xs font-medium">
                Last Update Date Time: <span className="text-zinc-600">{formatDate(lastGlobalUpdate)}</span>
              </p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Status</div>
                <div className="text-sm font-medium text-emerald-600">Active Monitoring</div>
              </div>
            </div>
            {selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setShowBulkConfirm(true)}
                className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 transition-all flex items-center gap-2"
              >
                <ShieldCheck size={16} />
                Request Verification ({selectedIds.size})
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {staff.filter(s => s.remote_access === 1).length}
            </div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Remote OK</div>
          </div>
          <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-rose-600">
              {staff.filter(s => s.problem_type === 'cert').length}
            </div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Cert Prob</div>
          </div>
          <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-rose-600">
              {staff.filter(s => s.problem_type === 'vpn').length}
            </div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">VPN Prob</div>
          </div>
          <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-rose-600">
              {staff.filter(s => s.problem_type === 'rdp').length}
            </div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">RDP Prob</div>
          </div>
          <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-rose-600">
              {staff.filter(s => s.problem_type === 'other').length}
            </div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Other Issue</div>
          </div>
          <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-blue-600">
              {staff.filter(s => s.problem_type === 'verification_requested').length}
            </div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Pending Verify</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, ID, email or department..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Staff List */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">Loading staff list...</div>
          ) : Object.keys(groupedStaff).length > 0 ? (
            (Object.entries(groupedStaff) as [string, Staff[]][]).map(([dept, members]) => (
              <div key={dept} className="space-y-3">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">
                  {dept}
                </h2>
                <div className="space-y-2">
                  {members.map((person) => (
                    <div key={person.id} className="flex items-center gap-2">
                      <div 
                        onClick={(e) => toggleSelect(person.id, e)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                          selectedIds.has(person.id) 
                            ? 'bg-zinc-900 border-zinc-900 text-white' 
                            : 'bg-white border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {selectedIds.has(person.id) && <CheckCircle2 size={14} />}
                      </div>
                      <motion.button
                        layout
                        onClick={() => handleSelectStaff(person)}
                        className={`flex-1 text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                          person.remote_access === 1 
                            ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100' 
                            : person.problem_type === 'verification_requested'
                              ? 'bg-blue-50 border-blue-100 hover:bg-blue-100'
                              : 'bg-white border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            person.remote_access === 1 
                              ? 'bg-emerald-200 text-emerald-700' 
                              : person.problem_type === 'verification_requested'
                                ? 'bg-blue-200 text-blue-700'
                                : 'bg-zinc-100 text-zinc-400'
                          }`}>
                            <User size={24} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">{person.name}</h3>
                            <p className="text-sm text-zinc-500 font-mono mt-0.5">{person.staff_info}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {person.remote_access === 1 ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-medium bg-emerald-100/50 px-3 py-1 rounded-full text-sm">
                              <CheckCircle2 size={16} />
                              <span className="hidden sm:inline">Remote Access OK</span>
                              <span className="sm:hidden">OK</span>
                            </div>
                          ) : person.problem_type === 'verification_requested' ? (
                            <div className="flex items-center gap-2 text-blue-600 font-medium bg-blue-100/50 px-3 py-1 rounded-full text-sm">
                              <ShieldCheck size={16} />
                              <span className="hidden sm:inline">Pending Verification</span>
                              <span className="sm:hidden">Verify</span>
                            </div>
                          ) : person.problem_type ? (
                            <div className="flex items-center gap-2 text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full text-sm">
                              <AlertCircle size={16} />
                              <span className="hidden sm:inline">Issue Reported</span>
                              <span className="sm:hidden">Issue</span>
                            </div>
                          ) : (
                            <div className="text-zinc-400 group-hover:text-zinc-600 transition-colors">
                              <ChevronRight size={20} />
                            </div>
                          )}
                        </div>
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-400">No staff members found matching your search.</div>
          )}
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showBulkConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkConfirm(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-6 bg-amber-50 border-b border-amber-100">
                <div className="flex items-center gap-3 text-amber-800">
                  <ShieldAlert size={24} />
                  <h2 className="text-lg font-bold">IT Support Specialist Warning</h2>
                </div>
                <p className="mt-2 text-sm text-amber-700 leading-relaxed">
                  ამ მოქმედების საშუალება აქვთ მხოლოდ IT support specialist-ებს და გთხოვთ რომ თვითნებურად არ შეუცვალოთ სტატუსი.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-zinc-600">
                  ნამდვილად გსურთ მონიშნული {selectedIds.size} თანამშრომლისთვის სტატუსის შეცვლა გადამოწმების მოთხოვნით?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBulkConfirm(false)}
                    className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                  >
                    გაუქმება
                  </button>
                  <button
                    onClick={handleBulkVerify}
                    disabled={updating}
                    className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    {updating ? 'მიმდინარეობს...' : 'დიახ, დადასტურება'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStaff(null)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
                  <p className="text-zinc-500 text-sm">{selectedStaff.department}</p>
                </div>
                <button 
                  onClick={() => setSelectedStaff(null)}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wider">
                    Remote Access Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRemoteAccess(true)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                        remoteAccess 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' 
                          : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      <ShieldCheck size={20} />
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoteAccess(false)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                        !remoteAccess 
                          ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold' 
                          : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      <ShieldAlert size={20} />
                      NO
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {!remoteAccess && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 mb-2">Problem Type</label>
                        <select
                          value={problemType}
                          onChange={(e) => setProblemType(e.target.value)}
                          required={!remoteAccess}
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        >
                          <option value="">Select a problem...</option>
                          <option value="cert">Certificate Problem</option>
                          <option value="vpn">VPN Connection Problem</option>
                          <option value="rdp">RDP Access Problem</option>
                          <option value="other">Other Issue</option>
                        </select>
                      </div>

                      {problemType === 'other' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <label className="block text-sm font-semibold text-zinc-700 mb-2">Details</label>
                          <textarea
                            value={otherDetails}
                            onChange={(e) => setOtherDetails(e.target.value)}
                            placeholder="Please describe the issue..."
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[100px]"
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-zinc-200"
                >
                  {updating ? 'Updating...' : 'Save Status'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-12 text-center text-zinc-400 text-sm">
        <p>© 2026 BCP Incident Management Team</p>
        <p className="mt-1 italic">Confidential - Internal Use Only</p>
      </footer>
    </div>
  );
}
