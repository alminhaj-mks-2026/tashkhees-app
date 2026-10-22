import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, BookOpen, AlertCircle, X, ChevronDown, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, onSnapshot } from 'firebase/firestore';
import { UserManagementModal } from './components/UserManagementModal';


const ABJAD_MAP: Record<string, number> = {
  'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ہ': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9, 'ی': 10,
  'ک': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90, 'ق': 100,
  'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000,
  'آ': 1, 'ٹ': 400, 'ڈ': 4, 'ڑ': 200, 'ے': 10
};

const DAY_VALUES: Record<string, number> = {
  'ہفتہ': 357, 'اتوار': 387, 'پیر': 367, 'منگل': 422, 'بدھ': 566, 'جمعہ': 118, 'جمعرات': 412
};

const MONTHS = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
const DAYS = ['ہفتہ', 'اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ'];

const RESULTS = [
  "جسمانی مرض ہے۔", "نفسیاتی بیماریاں ہیں۔", "کسی کی بد دعا لگی ہوئی ہے۔", "کوئی منت مانگی تھی جو پوری نہیں کی اس کا نتیجہ ہے۔",
  "نظرِ بدِ انسانی لگی ہے۔", "آسیبی اثرات ہیں۔", "نظرِ بدِ جناتی لگی ہے۔", "بندش لگی ہوئی ہے۔",
  "رجعت کے معاملات ہیں۔", "سحر و جادو کیا گیا ہے۔", "تعویذات جو آگ میں جلائے گئے ہیں۔", "تعویذات جو ہوا میں لٹکائے گئے ہیں۔",
  "تعویذات جو پلائے یا بہائے گئے ہیں۔", "تعویذات جو دفنائے گئے ہیں۔", "تعویذات جو پلائے اور دفنائے گئے ہیں۔", "جناتی معاملات ہیں۔",
  "کسی بات کو لے کر فکر و شدید ٹینشن ہے، کوئی روحانی مرض نہیں۔", "روحانی و نفسیاتی امراض۔", "کسی عمل کے ذریعہ جنات بھیجے گئے ہیں۔", "کوئی اور مسئلہ نہیں، اللہ تعالیٰ کی طرف سے آزمائش و مصیبتیں ہیں۔"
];

function calculateAbjad(text: string): number {
  return text.split('').reduce((sum, char) => sum + (ABJAD_MAP[char] || 0), 0);
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', age: '', motherName: '', day: '', hour: '1', minute: '00', ampm: 'AM', year: '2026', month: 'جنوری'
  });
  const [result, setResult] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let unsubscribeUser: any;
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (unsubscribeUser) unsubscribeUser();
      
      if (currentUser) {
        unsubscribeUser = onSnapshot(doc(db, 'users', currentUser.email!.toLowerCase()), (docSnapshot) => {
          const isAdminUser = currentUser.email?.toLowerCase() === 'abdulhafeeza871@gmail.com';
          if ((docSnapshot.exists() && docSnapshot.data().status === 'active') || isAdminUser) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            setAuthError("آپ اس ایپ تک رسائی کے مجاز نہیں ہیں یا آپ کا اکاؤنٹ غیر فعال ہے۔");
          }
          setLoading(false);
        }, (error) => {
          setIsAuthorized(false);
          setAuthError("رسائی کی تصدیق میں خرابی۔");
          setLoading(false);
        });
      } else {
        setIsAuthorized(false);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoginError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed", error);
      setLoginError(`Login failed: ${error.code} - ${error.message}`);
    }
  };

  const isAdmin = user?.email === 'abdulhafeeza871@gmail.com';

  const handleCalculate = () => {
    const total = calculateAbjad(formData.name) + parseInt(formData.age || '0') + calculateAbjad(formData.motherName) +
                  (DAY_VALUES[formData.day] || 0) + parseInt(formData.hour) + parseInt(formData.minute) +
                  parseInt(formData.year) + (MONTHS.indexOf(formData.month) + 1) + 161;
    let remainder = total % 20;
    if (remainder === 0) remainder = 20;
    setResult(RESULTS[remainder - 1]);
  };

  const handleReset = () => {
    setFormData({ name: '', age: '', motherName: '', day: '', hour: '1', minute: '00', ampm: 'AM', year: '2026', month: 'جنوری' });
    setResult(null);
  };

  if (loading) return <div className="min-h-screen bg-[#071426] flex items-center justify-center">Loading...</div>;

  if (!user) return (
    <div className="min-h-screen bg-[#071426] flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-[#D6B56D] mb-8">تشخیص ایپ</h1>
      <button onClick={handleLogin} className="flex items-center gap-2 bg-[#D6B56D] text-[#071426] px-6 py-3 rounded-xl font-bold hover:bg-[#b59958] transition">
        <LogIn size={20} />
        گوگل کے ساتھ لاگ ان کریں
      </button>
      {loginError && <p className="text-red-500 mt-4 text-center">{loginError}</p>}
    </div>
  );

  if (!isAuthorized) return (
    <div className="min-h-screen bg-[#071426] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-red-500 mb-4">{authError}</p>
      <button onClick={() => signOut(auth)} className="bg-[#D6B56D] text-[#071426] px-6 py-3 rounded-xl font-bold">لاگ آؤٹ</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#071426] text-[#F7F3E8] p-4 md:p-8 font-sans" dir="rtl">
      <header className="flex justify-between items-center pb-6 border-b border-[#244A78] mb-8">
        <h1 className="text-3xl font-bold text-[#D6B56D]">تشخیص ایپ</h1>
        <div className="flex gap-4 items-center">
          {isAdmin && <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 border border-[#D6B56D] text-[#D6B56D] rounded-lg hover:bg-[#D6B56D] hover:text-[#071426] transition">صارفین کا ریکارڈ</button>}
          <button onClick={() => signOut(auth)} className="text-sm text-[#B8C6D9]">لاگ آؤٹ</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-[#B8C6D9]">تشخیص فارم</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#10233F] p-6 rounded-2xl shadow-inner border border-[#162B49]">
          {[ {label: 'مریض کا نام', key: 'name', type: 'text'}, {label: 'عمر', key: 'age', type: 'number'}, {label: 'والدہ کا نام', key: 'motherName', type: 'text'} ].map(f => (
            <div key={f.key}>
              <label className="block text-sm text-[#B8C6D9] mb-2">{f.label}</label>
              <input type={f.type} value={formData[f.key as keyof typeof formData]} onChange={e => setFormData({...formData, [f.key]: e.target.value})} className="w-full bg-[#162B49] p-3 rounded-lg border border-[#244A78] focus:border-[#D6B56D] outline-none" />
            </div>
          ))}
          
          <div>
            <label className="block text-sm text-[#B8C6D9] mb-2">دن</label>
            <select value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} className="w-full bg-[#162B49] p-3 rounded-lg border border-[#244A78] outline-none">
              <option value="">منتخب کریں</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[ {label: 'گھنٹہ', key: 'hour', options: Array.from({length: 12}, (_, i) => i + 1)}, {label: 'منٹ', key: 'minute', options: Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'))}, {label: 'AM/PM', key: 'ampm', options: ['AM', 'PM']} ].map(f => (
              <div key={f.key}>
                <label className="block text-sm text-[#B8C6D9] mb-1">{f.label}</label>
                <select value={formData[f.key as keyof typeof formData]} onChange={e => setFormData({...formData, [f.key]: e.target.value})} className="w-full bg-[#162B49] p-2 rounded-lg border border-[#244A78] outline-none">
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          
          <div>
            <label className="block text-sm text-[#B8C6D9] mb-2">شمسی سال</label>
            <select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full bg-[#162B49] p-3 rounded-lg border border-[#244A78] outline-none">
              {Array.from({length: 975}, (_, i) => 2026 + i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#B8C6D9] mb-2">مہینہ</label>
            <select value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} className="w-full bg-[#162B49] p-3 rounded-lg border border-[#244A78] outline-none">
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={handleCalculate} className="flex-1 bg-[#244A78] text-[#D6B56D] p-4 rounded-xl font-bold hover:bg-[#162B49] transition border border-[#D6B56D]">تشخیص کریں</button>
          <button onClick={handleReset} className="flex-1 bg-transparent border border-[#244A78] p-4 rounded-xl text-[#B8C6D9] hover:bg-[#162B49] transition">صاف کریں</button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-[#10233F] rounded-2xl border-2 border-[#D6B56D] text-center">
            <h3 className="text-xl text-[#D6B56D] mb-4">تشخیصی نتیجہ</h3>
            <p className="text-2xl">{result}</p>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && isAdmin && (
          <UserManagementModal onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
