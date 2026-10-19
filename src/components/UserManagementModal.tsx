import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function UserManagementModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchUsers(); }, []);

  const addUser = async () => {
    if (!newUser.name || !newUser.email) return;
    if (users.find(u => u.email === newUser.email)) return;
    await addDoc(collection(db, 'users'), {
      ...newUser,
      status: 'active',
      isAdmin: false,
      authorizedAt: serverTimestamp()
    });
    setNewUser({ name: '', email: '' });
    setShowForm(false);
    fetchUsers();
  };

  const updateStatus = async (userId: string, newStatus: string) => {
    await updateDoc(doc(db, 'users', userId), { status: newStatus });
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (confirm('کیا آپ واقعی اس صارف کو حذف کرنا چاہتے ہیں؟')) {
      await deleteDoc(doc(db, 'users', userId));
      fetchUsers();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#10233F] p-8 rounded-2xl w-full max-w-md border border-[#244A78]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl">صارفین کا ریکارڈ</h2>
          <button onClick={onClose}><X /></button>
        </div>
        
        <div className="space-y-4 mb-6">
          {users.map(user => (
            <div key={user.id} className="flex justify-between items-center p-3 bg-[#162B49] rounded-lg">
              <div>
                <p>{user.name}</p>
                <p className="text-sm text-[#B8C6D9]">{user.email}</p>
                <p className="text-xs">{user.status === 'active' ? 'فعال' : 'غیر فعال'}</p>
              </div>
              <div className="flex gap-2">
                {user.email !== 'abdulhafeeza871@gmail.com' && (
                  <>
                    <button onClick={() => updateStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}>
                      {user.status === 'active' ? <XCircle size={18} className="text-red-500" /> : <CheckCircle size={18} className="text-green-500" />}
                    </button>
                    <button onClick={() => deleteUser(user.id)}><Trash2 size={18} className="text-gray-500" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {showForm ? (
          <div className="bg-[#162B49] p-4 rounded-lg space-y-3">
            <input placeholder="صارف کا نام" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-[#071426] p-2 rounded" />
            <input placeholder="Gmail ایڈریس" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-[#071426] p-2 rounded" />
            <div className="flex gap-2">
              <button onClick={addUser} className="bg-[#D6B56D] text-[#071426] px-4 py-2 rounded flex-1">محفوظ کریں</button>
              <button onClick={() => setShowForm(false)} className="bg-gray-600 px-4 py-2 rounded flex-1">منسوخ کریں</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="w-full p-3 border border-dashed border-[#D6B56D] rounded-lg flex items-center justify-center gap-2">
            <Plus /> صارف شامل کریں
          </button>
        )}
      </div>
    </div>
  );
}
