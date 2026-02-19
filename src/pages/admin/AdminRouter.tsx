import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { TapeList } from './tapes/TapeList';
import { TapeDetail } from './tapes/TapeDetail';
import { ShowList } from './shows/ShowList';
import { ShowDetail } from './shows/ShowDetail';
import { TalentList } from './talent/TalentList';

export default function AdminRouter() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="shows" element={<ShowList />} />
        <Route path="shows/:id" element={<ShowDetail />} />
        <Route path="tapes" element={<TapeList />} />
        <Route path="tapes/:id" element={<TapeDetail />} />
        <Route path="talent" element={<TalentList />} />
        <Route path="seasons" element={<Placeholder title="Seasons" />} />
      </Route>
    </Routes>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">Coming in Phase 2.</p>
    </div>
  );
}
