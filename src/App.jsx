import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from '@/components/Login';
import MijnKastPage from '@/pages/MijnKast';
import ToevoegenPage from '@/pages/Toevoegen';
import KledingstukDetailPage from '@/pages/KledingstukDetail';
import OutfitVanDeDagPage from '@/pages/OutfitVanDeDag';
import HistoriePage from '@/pages/Historie';
import ProfielPage from '@/pages/Profiel';
import WeerPage from '@/pages/Weer';
import InstellingenPage from '@/pages/Instellingen';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Laadspinner terwijl de sessie/auth gecontroleerd wordt
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Niet ingelogd -> toon inlogscherm
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <Login />;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<MijnKastPage />} />
      <Route path="/toevoegen" element={<ToevoegenPage />} />
      <Route path="/kledingstuk/:id" element={<KledingstukDetailPage />} />
      <Route path="/outfit-van-de-dag" element={<OutfitVanDeDagPage />} />
      <Route path="/historie" element={<HistoriePage />} />
      <Route path="/profiel" element={<ProfielPage />} />
      <Route path="/weer" element={<WeerPage />} />
      <Route path="/instellingen" element={<InstellingenPage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
