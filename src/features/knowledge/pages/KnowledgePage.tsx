import { FaBook, FaSearch } from 'react-icons/fa';

const categories = [
  { name: 'Architecture', count: 12, color: 'from-blue-500 to-blue-600' },
  { name: 'API Reference', count: 8, color: 'from-green-500 to-green-600' },
  { name: 'Best Practices', count: 15, color: 'from-purple-500 to-purple-600' },
  { name: 'Tutorials', count: 22, color: 'from-orange-500 to-orange-600' },
];

const recentArticles = [
  { title: 'Getting Started with Tauri v2', date: '2 days ago', readTime: '5 min' },
  { title: 'State Management with Zustand', date: '1 week ago', readTime: '8 min' },
  { title: 'SQLite Integration Patterns', date: '2 weeks ago', readTime: '6 min' },
];

export function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-text">Knowledge</h1>
        <p className="text-sm text-theme-text/60 mt-1">Documentation and learning resources</p>
      </div>

      <div className="relative max-w-md">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text/40" />
        <input
          type="text"
          placeholder="Search knowledge base..."
          className="w-full pl-10 pr-4 py-2.5 bg-theme-surface border border-theme-border/30 rounded-xl text-sm text-theme-text placeholder-theme-text/40 focus:outline-none focus:border-theme-icon/50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 hover:border-theme-border/60 transition-colors cursor-pointer">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3`}>
              <FaBook className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-theme-text">{cat.name}</h3>
            <p className="text-xs text-theme-text/40 mt-1">{cat.count} articles</p>
          </div>
        ))}
      </div>

      <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-theme-text mb-4">Recent Articles</h3>
        <div className="space-y-3">
          {recentArticles.map((article) => (
            <div key={article.title} className="flex items-center justify-between py-2 border-b border-theme-border/10 last:border-0">
              <div>
                <p className="text-sm text-theme-text">{article.title}</p>
                <p className="text-xs text-theme-text/40 mt-0.5">{article.date}</p>
              </div>
              <span className="text-xs text-theme-text/40">{article.readTime}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
