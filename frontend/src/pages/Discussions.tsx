
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { MessageSquare, Plus, Search, ThumbsUp, Eye, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface Discussion {
  id: string;
  title: string;
  userId: string;
  views: number;
  user: {
    username: string;
    avatarUrl: string | null;
  };
  tags: string[];
  _count: {
    comments: number;
    votes: number;
  };
  createdAt: string;
}

export default function Discussions() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('newest'); // newest, popular, hot
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // const { token } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Discussion Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    fetchDiscussions();
  }, [filter, selectedTag]);

  const fetchDiscussions = async () => {
    setIsLoading(true);
    try {
      let url = `/discussions?sort=${filter}`;
      if (selectedTag) url += `&tag=${selectedTag}`;
      const { data } = await api.get(url);
      setDiscussions(data.discussions);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
      await api.post('/discussions', {
        title: newTitle,
        content: newContent,
        tags: tagsArray
      });
      toast.success('Discussion created!');
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      fetchDiscussions();
    } catch (error) {
      toast.error('Failed to create discussion');
    }
  };

  const tags = ['General', 'Interview Question', 'Compensation', 'Career', 'Study Guide'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-blue-600 text-white rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-blue-700 font-medium"
          >
            <Plus className="w-5 h-5" /> New Discussion
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedTag(null)}
                className={`w-full text-left px-3 py-2 rounded-md ${!selectedTag ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              >
                All Topics
              </button>
              {tags.map(tag => (
                 <button
                 key={tag}
                 onClick={() => setSelectedTag(tag)}
                 className={`w-full text-left px-3 py-2 rounded-md ${selectedTag === tag ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
               >
                 {tag}
               </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setFilter('newest')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium ${filter === 'newest' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                Newest
              </button>
              <button
                onClick={() => setFilter('popular')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium ${filter === 'popular' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                 Hot
              </button>
              <button
                onClick={() => setFilter('no_replies')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium ${filter === 'no_replies' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                 Unanswered
              </button>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search discussions..." 
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            {isLoading ? (
               <div className="p-8 text-center text-gray-500">Loading discussions...</div>
            ) : discussions.length === 0 ? (
               <div className="p-12 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No discussions found. Be the first to start one!</p>
               </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {discussions.map(d => (
                  <div key={d.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 text-center min-w-[60px]">
                        <img 
                          src={d.user.avatarUrl || `https://ui-avatars.com/api/?name=${d.user.username}`} 
                          alt={d.user.username}
                          className="w-10 h-10 rounded-full mx-auto mb-2" 
                        />
                      </div>
                      <div className="flex-1">
                        <Link to={`/discuss/${d.id}`} className="block">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400">
                            {d.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                          {/* We don't have snippets in API yet, assuming we'd strip markdown in future. For now, just title link */}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            {d.user.username}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(d.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 ml-auto">
                            <Eye className="w-3 h-3" /> {d.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> {d._count.votes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {d._count.comments}
                          </span>
                        </div>
                         <div className="mt-2 flex gap-2">
                          {d.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Start a Discussion</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="What's on your mind?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder="Interview, General, Help..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Content</label>
                  <textarea
                    required
                    rows={6}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Write your post here... Markdown is supported."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
