import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getPosts, getTagBySlug } from '../lib/api.js';
import Sidebar from '../components/Sidebar.jsx';
import { Tag, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

export default function TagPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [tag, setTag] = useState(null);
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      getTagBySlug(slug).catch(() => null),
      getPosts({ tagSlug: slug, page: pageParam, limit: 6, status: 'published' }).catch(() => ({
        posts: [],
        totalPages: 1,
        count: 0,
      })),
    ]).then(([tagData, postsData]) => {
      if (mounted) {
        setTag(tagData);
        setPosts(postsData.posts || []);
        setTotalPages(postsData.totalPages || 1);
        setTotalCount(postsData.count || 0);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [slug, pageParam]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ page: newPage.toString() });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <Link
            to="/"
            className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Articles</span>
          </Link>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <Tag className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tag</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            #{tag?.name || slug}
          </h1>
          <div className="mt-2 text-xs text-slate-400">
            {totalCount} {totalCount === 1 ? 'article tagged' : 'articles tagged'}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-xl border border-slate-200 p-6 dark:border-slate-800"
              >
                <div className="h-6 bg-slate-200 rounded w-2/3 mb-3 dark:bg-slate-800" />
                <div className="h-4 bg-slate-200 rounded w-full mb-2 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <p className="text-sm text-slate-500">
              No published articles found for this tag yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
                >
                  {post.cover_url && (
                    <Link
                      to={`/post/${post.slug}`}
                      className="w-full h-40 overflow-hidden bg-slate-100 dark:bg-slate-800"
                    >
                      <img
                        src={post.cover_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </Link>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        <Link to={`/post/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString()
                          : 'Draft'}
                      </span>
                      <span>{post.reading_time || 3}m read</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handlePageChange(pageParam - 1)}
                  disabled={pageParam <= 1}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="text-xs text-slate-500">
                  Page {pageParam} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(pageParam + 1)}
                  disabled={pageParam >= totalPages}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-300"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-4">
        <Sidebar />
      </div>
    </div>
  );
}
