import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  UserCircle, 
  Activity, 
  Share2, 
  Search,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Tab = 'friends' | 'posts' | 'profile' | 'activity' | 'shared-splits';

const ComingSoonCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <Card className="border-slate-200 shadow-sm bg-slate-50/50">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="text-slate-400" size={20} />
          <CardTitle className="text-lg text-slate-700">{title}</CardTitle>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-maroon/10 text-maroon border border-maroon/20">
          <Clock size={12} />
          Coming Soon
        </span>
      </div>
      <CardDescription className="text-slate-500 mt-2">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-white">
        <p className="text-sm text-slate-400 text-center px-4">
          We're actively building this feature. Check back in a future update!
        </p>
      </div>
    </CardContent>
  </Card>
);

export default function Social() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'posts', label: 'Posts', icon: MessageSquare },
    { id: 'shared-splits', label: 'Shared Splits', icon: Share2 },
  ] as const;

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Social</h2>
        <p className="text-muted-foreground">Connect with friends and share your training.</p>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-border">
        <div className="flex space-x-6 px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive 
                    ? "border-maroon text-maroon" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'friends' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search athletes or friends..." 
                className="pl-10 bg-white"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Friends</CardTitle>
                    <CardDescription>Your training partners and connections.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                      <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">You haven't added any friends yet.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Pending Requests</CardTitle>
                    <CardDescription>People who want to connect with you.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                      <p className="text-sm text-slate-500">No pending requests.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Suggested Athletes</CardTitle>
                    <CardDescription>People you might know.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                      <UserCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">Suggestions will appear here soon.</p>
                    </div>
                  </CardContent>
                </Card>
                
                <p className="text-xs text-slate-400 text-center px-4">
                  The friend system is the first step in future social features.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <ComingSoonCard 
            title="Posts" 
            description="Share workout logs and progress updates."
            icon={MessageSquare}
          />
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Profile</CardTitle>
                <CardDescription>Your public training identity and shared stats.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <UserCircle className="h-12 w-12 text-slate-300" />
                  </div>
                  <div className="text-center md:text-left space-y-2 flex-1">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Your Name</h3>
                      <p className="text-sm font-medium text-maroon">@username</p>
                    </div>
                    <p className="text-sm text-slate-600 max-w-md">
                      Training, discipline, and progress.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                    <p className="text-2xl font-bold text-slate-800">0</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Friends</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                    <p className="text-2xl font-bold text-slate-800">0</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Posts</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                    <p className="text-2xl font-bold text-slate-800">0</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Shared Splits</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                    <p className="text-2xl font-bold text-slate-800">0</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Logs Shared</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Profile Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-maroon flex-shrink-0" />
                    Display name and username
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-maroon flex-shrink-0" />
                    Public stats and shared content
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-maroon flex-shrink-0" />
                    Social identity for future features
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'activity' && (
          <ComingSoonCard 
            title="Activity" 
            description="See friend updates and training activity."
            icon={Activity}
          />
        )}

        {activeTab === 'shared-splits' && (
          <ComingSoonCard 
            title="Shared Splits" 
            description="Browse and share training splits."
            icon={Share2}
          />
        )}
      </div>
    </div>
  );
}
