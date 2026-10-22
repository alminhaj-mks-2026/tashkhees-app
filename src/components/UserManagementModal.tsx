import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { collection, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export function UserManagementModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);

  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const addUser = async () => {
    if (!newUser.name || !newUser.email) return;
    setLoadingActions(prev => ({ ...prev, [newUser.email]: true }));
    try {
      const email = newUser.email.trim().toLowerCase().replace('@gaamil.com', '@gmail.com');
      await setDoc(doc(db, 'users', email), {
        name: newUser.name,
        email: email,
        status: 'active',
        isAdmin: false,
        authorizedAt: serverTimestamp()
      });
      setNewUser({ name: '', email: '' });
      setShowForm(false);
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'users');
    } finally {
      setLoadingActions(prev => ({ ...prev, [newUser.email]: false }));
    }
  };

  const updateStatus = async (userId: string, newStatus: string) => {
    setLoadingActions(prev => ({ ...prev, [userId]: true }));
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setLoadingActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const deleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const performDelete = async () => {
    if (!userToDelete) return;
    setLoadingActions(prev => ({ ...prev, [userToDelete]: true }));
    try {
        await deleteDoc(doc(db, 'users', userToDelete));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${userToDelete}`);
    } finally {
        setLoadingActions(prev => ({ ...prev, [userToDelete!]: false }));
        setUserToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      {userToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#10233F] p-6 rounded-2xl w-full max-w-sm border border-[#244A78]">
            <p className="mb-4 text-center">کیا آپ واقعی اس صارف کو ڈیلیٹ کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکے گا۔</p>
            <div className="flex gap-2">
              <button onClick={performDelete} className="bg-red-600 text-white px-4 py-2 rounded flex-1">ہاں، ڈیلیٹ کریں</button>
              <button onClick={() => setUserToDelete(null)} className="bg-gray-600 px-4 py-2 rounded flex-1">منسوخ کریں</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-[#10233F] p-6 rounded-2xl w-full max-w-md border border-[#244A78] flex flex-col max-h-[85vh]">
        {/* Fixed Top Area */}
        <div className="flex-shrink-0 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">صارفین کا ریکارڈ</h2>
            <button onClick={onClose}><X /></button>
          </div>
          
          <button onClick={async () => {
              const firestore = await import('firebase/firestore');
              const { db } = await import('../firebase');
              await firestore.setDoc(firestore.doc(db, 'users', 'younusroomi1122@gmail.com'), {
                name: 'Younus Roomi',
                email: 'younusroomi1122@gmail.com',
                status: 'active',
                isAdmin: false,
                authorizedAt: firestore.serverTimestamp()
              });
              await firestore.deleteDoc(firestore.doc(db, 'users', 'younusroomi1122@gaamil.com'));
              alert('Fixed!');
          }} className="w-full p-2 bg-yellow-600 text-white rounded mb-2">FIX USER</button>

          {showForm ? (
            <div className="bg-[#162B49] p-4 rounded-lg space-y-3">
              <input placeholder="صارف کا نام" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-[#071426] p-2 rounded" />
              <input placeholder="Gmail ایڈریس" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-[#071426] p-2 rounded" />
              <div className="flex gap-2">
                <button onClick={addUser} disabled={loadingActions[newUser.email || 'new']} className="bg-[#D6B56D] text-[#071426] px-4 py-2 rounded flex-1">
                  {loadingActions[newUser.email || 'new'] ? '...' : 'محفوظ کریں'}
                </button>
                <button onClick={() => setShowForm(false)} className="bg-gray-600 px-4 py-2 rounded flex-1">منسوخ کریں</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full p-3 border border-dashed border-[#D6B56D] rounded-lg flex items-center justify-center gap-2">
              <Plus /> صارف شامل کریں
            </button>
          )}
        </div>
        
        {/* Scrollable List */}
        <div className="space-y-4 overflow-y-auto flex-grow pr-2">
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
                    <button onClick={() => updateStatus(user.id, user.status === 'active' ? 'inactive' : 'active')} disabled={loadingActions[user.id]}>
                      {user.status === 'active' ? <XCircle size={18} className="text-red-500" /> : <CheckCircle size={18} className="text-green-500" />}
                    </button>
                    <button onClick={() => deleteUser(user.id)} disabled={loadingActions[user.id]}><Trash2 size={18} className="text-gray-500" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


