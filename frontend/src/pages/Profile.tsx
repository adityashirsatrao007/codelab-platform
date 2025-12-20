import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, Building, Users, UserPlus, UserCheck, MapPin, Link as LinkIcon, Github, Linkedin, Twitter } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  username: string
  createdAt: string
  isFollowing?: boolean
  followersCount: number
  followingCount: number
  profile?: {
    fullName?: string
    college?: string
    bio?: string
    location?: string
    githubUrl?: string
    linkedinUrl?: string
    twitterUrl?: string
    websiteUrl?: string
    solvedCount: number
    rank?: number
  }
  stats: {
    totalSolved: number
    totalProblems: number
    rank: number
  }
  difficultyCounts: {
    easy: number
    medium: number
    hard: number
  }
  totalByDifficulty: {
    easy: number
    medium: number
    hard: number
  }
  activityHeatmap: Array<{ date: string; count: number }>
  recentSubmissions: Array<{
    id: string
    status: string
    language: string
    createdAt: string
    problemTitle: string
    problemSlug: string
  }>
}

export default function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const { user: currentUser } = useAuthStore()

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/${username}`)
      setProfile(response.data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!profile) return;
    if (!currentUser) {
      toast.error('Please login to follow users');
      return;
    }
    
    setFollowLoading(true);
    try {
      const response = await api.post(`/users/${profile.username}/follow`);
      setProfile(prev => prev ? ({
        ...prev,
        isFollowing: response.data.isFollowing,
        followersCount: response.data.isFollowing 
          ? prev.followersCount + 1 
          : prev.followersCount - 1
      }) : null);
      toast.success(response.data.isFollowing ? 'Followed!' : 'Unfollowed');
    } catch (error) {
      console.error('Follow action failed:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };







  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lc-accent"></div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">User not found</div>
  )

  const solvedTotal = profile.difficultyCounts.easy + profile.difficultyCounts.medium + profile.difficultyCounts.hard;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Sidebar: User Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-lc-layer-2 rounded-xl p-6 border border-lc-border shadow-sm">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-lc-accent rounded-lg flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg">
                {profile.username[0].toUpperCase()}
              </div>
              <h1 className="text-xl font-bold text-lc-text-primary">{profile.profile?.fullName || profile.username}</h1>
              <p className="text-lc-text-secondary text-sm">@{profile.username}</p>
              
              <div className="w-full mt-4 flex items-center justify-center space-x-2">
                 <span className="text-sm font-medium text-lc-text-primary">Rank</span>
                 <span className="text-lg font-bold text-lc-text-primary">#{profile.stats?.rank.toLocaleString()}</span>
              </div>

              {currentUser && currentUser.username !== profile.username && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`w-full mt-6 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    profile.isFollowing
                      ? 'bg-lc-layer-3 text-lc-text-secondary border border-lc-border'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {profile.isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  <span>{profile.isFollowing ? 'Following' : 'Follow'}</span>
                </button>
              )}

               {currentUser && currentUser.username === profile.username && (
                <button className="w-full mt-6 px-4 py-2 bg-lc-layer-3 text-lc-text-green hover:bg-lc-layer-4 rounded-lg font-medium transition-colors text-green-500 border border-current">
                  Edit Profile
                </button>
              )}

              <div className="w-full mt-6 space-y-3">
                 {profile.profile?.location && (
                    <div className="flex items-center text-gray-400 text-sm">
                        <MapPin className="h-4 w-4 mr-2" /> {profile.profile.location}
                    </div>
                 )}
                 {profile.profile?.college && (
                    <div className="flex items-center text-gray-400 text-sm">
                        <Building className="h-4 w-4 mr-2" /> {profile.profile.college}
                    </div>
                 )}
                 {profile.createdAt && (
                    <div className="flex items-center text-gray-400 text-sm">
                        <Calendar className="h-4 w-4 mr-2" /> Joined {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                 )}
              </div>

              <div className="w-full mt-6 pt-6 border-t border-lc-border space-y-3">
                 <div className="flex items-center text-gray-400 text-sm">
                    <Users className="h-4 w-4 mr-2" /> 
                    <span className="text-lc-text-primary font-bold mr-1">{profile.followersCount}</span> Followers
                 </div>
                 <div className="flex items-center text-gray-400 text-sm ml-6">
                    <span className="text-lc-text-primary font-bold mr-1">{profile.followingCount}</span> Following
                 </div>
              </div>

              <div className="w-full mt-4 flex space-x-4 justify-center">
                  {profile.profile?.githubUrl && <a href={profile.profile.githubUrl} target="_blank" className="text-gray-400 hover:text-white"><Github className="h-5 w-5"/></a>}
                  {profile.profile?.linkedinUrl && <a href={profile.profile.linkedinUrl} target="_blank" className="text-gray-400 hover:text-white"><Linkedin className="h-5 w-5"/></a>}
                  {profile.profile?.twitterUrl && <a href={profile.profile.twitterUrl} target="_blank" className="text-gray-400 hover:text-white"><Twitter className="h-5 w-5"/></a>}
                  {profile.profile?.websiteUrl && <a href={profile.profile.websiteUrl} target="_blank" className="text-gray-400 hover:text-white"><LinkIcon className="h-5 w-5"/></a>}
              </div>
            </div>
          </div>
          
          {/* Skills / Languages */}
          <div className="bg-lc-layer-2 rounded-xl p-4 border border-lc-border">
             <h3 className="text-sm font-bold text-lc-text-secondary mb-3">Community Stats</h3>
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Views</span>
                    <span className="text-white">0</span>
                </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Solution</span>
                    <span className="text-white">0</span>
                </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Discuss</span>
                    <span className="text-white">0</span>
                </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Reputation</span>
                    <span className="text-white">0</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="md:col-span-3 space-y-6">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Solved Problems */}
                <div className="bg-lc-layer-2 rounded-xl p-4 border border-lc-border">
                    <h3 className="text-sm font-bold text-gray-400 mb-4">Solved Problems</h3>
                    <div className="flex items-center">
                        {/* Circle Graph */}
                        <div className="relative w-28 h-28 mr-6 flex-shrink-0">
                           <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                              <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                              <path className="text-green-500" strokeDasharray={`${(profile.difficultyCounts.easy / profile.totalByDifficulty.easy) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                               <span className="text-2xl font-bold text-white">{solvedTotal}</span>
                               <span className="text-xs text-gray-400">Solved</span>
                           </div>
                        </div>
                        
                        {/* Detailed Stats */}
                        <div className="flex-1 space-y-3">
                             <div className="flex items-center justify-between p-2 rounded-lg bg-lc-layer-3 hover:bg-lc-layer-4 transition-colors">
                                 <span className="text-sm text-gray-400 font-medium w-16">Easy</span>
                                 <div className="flex-1 mx-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                     <div className="h-full bg-green-500" style={{ width: `${(profile.difficultyCounts.easy / (profile.totalByDifficulty.easy || 1)) * 100}%` }}></div>
                                 </div>
                                 <span className="text-sm font-bold text-gray-200">
                                     {profile.difficultyCounts.easy}<span className="text-gray-500 text-xs ml-1">/ {profile.totalByDifficulty.easy}</span>
                                 </span>
                             </div>
                             <div className="flex items-center justify-between p-2 rounded-lg bg-lc-layer-3 hover:bg-lc-layer-4 transition-colors">
                                 <span className="text-sm text-gray-400 font-medium w-16">Medium</span>
                                 <div className="flex-1 mx-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                     <div className="h-full bg-yellow-500" style={{ width: `${(profile.difficultyCounts.medium / (profile.totalByDifficulty.medium || 1)) * 100}%` }}></div>
                                 </div>
                                 <span className="text-sm font-bold text-gray-200">
                                     {profile.difficultyCounts.medium}<span className="text-gray-500 text-xs ml-1">/ {profile.totalByDifficulty.medium}</span>
                                 </span>
                             </div>
                             <div className="flex items-center justify-between p-2 rounded-lg bg-lc-layer-3 hover:bg-lc-layer-4 transition-colors">
                                 <span className="text-sm text-gray-400 font-medium w-16">Hard</span>
                                 <div className="flex-1 mx-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                     <div className="h-full bg-red-500" style={{ width: `${(profile.difficultyCounts.hard / (profile.totalByDifficulty.hard || 1)) * 100}%` }}></div>
                                 </div>
                                 <span className="text-sm font-bold text-gray-200">
                                     {profile.difficultyCounts.hard}<span className="text-gray-500 text-xs ml-1">/ {profile.totalByDifficulty.hard}</span>
                                 </span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Badges (Mock) */}
                <div className="bg-lc-layer-2 rounded-xl p-4 border border-lc-border">
                    <h3 className="text-sm font-bold text-gray-400 mb-4">Badges</h3>
                    <div className="flex flex-wrap gap-4 justify-center items-center h-40">
                         <div className="text-center opacity-50">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2 mx-auto">
                                <AwardIcon className="w-8 h-8 text-gray-600" />
                            </div>
                            <span className="text-xs text-gray-500">Upcoming Badge</span>
                         </div>
                         <div className="text-center opacity-50">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2 mx-auto">
                                <AwardIcon className="w-8 h-8 text-gray-600" />
                            </div>
                            <span className="text-xs text-gray-500">Upcoming Badge</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Submission Heatmap */}
            <div className="bg-lc-layer-2 rounded-xl p-4 border border-lc-border">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-bold text-gray-400">{profile.stats.totalSolved} submissions in the last year</h3>
                     <div className="flex items-center space-x-4 text-xs text-gray-400">
                         <span>Total Active Days: 0</span>
                         <span>Max Streak: 0</span>
                     </div>
                </div>
                {/* Heatmap Grid */}
                <div className="w-full overflow-x-auto">
                    <div className="min-w-[700px]">
                        <div className="grid grid-rows-7 grid-flow-col gap-1">
                            {Array.from({ length: 365 }).map((_, i) => {
                                // Create mocked date logic (last 365 days)
                                const d = new Date();
                                d.setDate(d.getDate() - (364 - i));
                                const dateStr = d.toISOString().split('T')[0];
                                
                                const activity = profile.activityHeatmap.find(h => h.date === dateStr);
                                const count = activity ? activity.count : 0;
                                
                                let bgClass = 'bg-lc-layer-3';
                                if (count > 0) bgClass = 'bg-accent/30';
                                if (count > 2) bgClass = 'bg-accent/60';
                                if (count > 5) bgClass = 'bg-accent';

                                return (
                                    <div 
                                        key={dateStr} 
                                        className={`w-3 h-3 rounded-sm ${bgClass}`} 
                                        title={`${count} submissions on ${dateStr}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    {/* Months Label Row (Optional complexity, skipping for simplicity) */}
                </div>
            </div>
            
            {/* Recent Submissions Table */}
            <div className="bg-lc-layer-2 rounded-xl p-4 border border-lc-border">
                <h3 className="text-sm font-bold text-gray-400 mb-4">Recent Submissions</h3>
                <div className="space-y-1">
                    {profile.recentSubmissions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 hover:bg-lc-layer-3 rounded-lg transition-colors cursor-pointer text-sm">
                            <div className="flex flex-col">
                                <span className="text-lc-text-primary font-medium">{sub.problemTitle}</span>
                                <span className="text-xs text-gray-500">{new Date(sub.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={`flex items-center space-x-4`}>
                                <div className="flex items-center space-x-2">
                                    <div className={`px-2 py-1 rounded-full text-xs font-bold bg-lc-layer-4 uppercase ${
                                        sub.language === 'python' ? 'text-blue-400' : 'text-yellow-400'
                                    }`}>
                                        {sub.language}
                                    </div>
                                    <span className={`font-bold ${
                                        sub.status === 'accepted' ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        {sub.status === 'accepted' ? 'Accepted' : 'Wrong Answer'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {profile.recentSubmissions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No recent submissions.</div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}

function AwardIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    )
}
