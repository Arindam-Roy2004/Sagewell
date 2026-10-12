import { useEffect } from 'react';
import { Users, Activity, LogIn, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminStore } from '../../stores/adminStore';
import StatCard, { StatGrid } from './StatCard';
import SignInChart from './SignInChart';
import RecentSignIns from './RecentSignIns';
import UsersTable from './UsersTable';
import UserSheet from './UserSheet';
import { percentChange } from './admin-utils';

/** Accounts tab: headline numbers, sign-in trend and feed, then every account. */
export default function UsersView() {
  const { overview, signIns, refreshAll, openUser } = useAdminStore();

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const o = overview;
  return (
    <div className="space-y-3">
      {o ? (
        <StatGrid className="grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Users"
            value={o.users.total}
            trend={percentChange(o.users.new7d, o.users.newPrev7d)}
            note={`${o.users.new7d} new this week`}
          />
          <StatCard icon={Activity} label="Active today" value={o.active.today} note={`${o.active.online} online · ${o.active.week} this week`} />
          <StatCard
            icon={LogIn}
            label="Sign-ins this week"
            value={o.signIns.week}
            trend={percentChange(o.signIns.week, o.signIns.prevWeek)}
            note={`${o.signIns.prevWeek} last week`}
          />
          <StatCard
            icon={Zap}
            label="Credits used"
            value={Math.round(o.credits.spent)}
            note={`${o.credits.outOfCredits} out of credits`}
          />
        </StatGrid>
      ) : (
        <Skeleton className="h-[86px] rounded-xl" />
      )}

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {o ? <SignInChart series={o.series} /> : <Skeleton className="h-[220px] rounded-xl" />}
        </div>
        <div className="lg:col-span-2">
          <RecentSignIns signIns={signIns} onOpenUser={openUser} />
        </div>
      </div>

      <UsersTable />
      <UserSheet />
    </div>
  );
}
