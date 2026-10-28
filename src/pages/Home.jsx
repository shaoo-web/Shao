import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPosts } from '../lib/api.js';
import Sidebar from '../components/Sidebar.jsx';
import { Calendar, Clock, Eye, ChevronLeft, ChevronRight, BookOpen, ArrowRight } from 'lucide-react';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getPosts({ page: pageParam, limit: 6, status: 'published' })
      .then((res) => {
        if (mounted) {
          setPosts(res.posts || []);
          setTotalPages(res.totalPages || 1);
          setTotalCount(res.count || 0);
        }
      })
      .catch((err) => {
        console.warn('Failed to load posts:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pageParam]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ page: newPage.toString() });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const featuredPost = posts.find((p) => p.is_featured) || (pageParam === 1 ? posts[0] : null);
  const standardPosts = featuredPost && pageParam === 1
    ? posts.filter((p) => p.id !== featuredPost.id)
    : posts;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Articles Feed */}
      <div className="lg:col-span-8 space-y-8">
        {/* Page Title & Intro */}
        <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Engineering & Web Insights
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Real software architecture, front-end craftsmanship, and production post-mortems.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-xl border border-slate-200 p-6 dark:border-slate-800"
              >
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-4 dark:bg-slate-800" />
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3 dark:bg-slate-800" />
                <div className="h-4 bg-slate-200 rounded w-full mb-2 dark:bg-slate-800" />
                <div className="h-4 bg-slate-200 rounded w-2/3 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No Published Posts Yet
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Articles published from the Admin Portal will appear here. Log in to create your first post!
            </p>
            <Link
              to="/admin/posts/new"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Write First Post →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Post Banner on Page 1 */}
            {featuredPost && pageParam === 1 && (
              <article className="group relative rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900">
                {featuredPost.cover_url && (
                  <div className="w-full h-64 sm:h-80 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={featuredPost.cover_url}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {featuredPost.category && (
                      <Link
                        to={`/category/${featuredPost.category.slug}`}
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                      >
                        {featuredPost.category.name}
                      </Link>
                    )}
                    <span className="text-xs text-amber-600 font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400">
                      ★ Featured Story
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-400">
                    <Link to={`/post/${featuredPost.slug}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>

                  {featuredPost.excerpt && (
                    <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-300 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-4">
                      {featuredPost.published_at && (
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          {new Date(featuredPost.published_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {featuredPost.reading_time || 3} min read
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        {featuredPost.views || 0}
                      </span>
                    </div>

                    <Link
                      to={`/post/${featuredPost.slug}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 dark:text-indigo-400"
                    >
                      <span>Read article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* Standard Post Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {standardPosts.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
                >
                  {post.cover_url && (
                    <Link
                      to={`/post/${post.slug}`}
                      className="w-full h-44 overflow-hidden bg-slate-100 dark:bg-slate-800"
                    >
                      <img
                        src={post.cover_url}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        {post.category ? (
                          <Link
                            to={`/category/${post.category.slug}`}
                            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            {post.category.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">Uncategorized</span>
                        )}
                        <span className="text-slate-400">
                          {post.reading_time || 3}m read
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-400 line-clamp-2">
                        <Link to={`/post/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>

                      {post.excerpt && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Draft'}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {post.views || 0} views
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handlePageChange(pageParam - 1)}
                  disabled={pageParam <= 1}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page <strong className="text-slate-800 dark:text-slate-200">{pageParam}</strong> of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(pageParam + 1)}
                  disabled={pageParam >= totalPages}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-4">
        <Sidebar />
      </div>
    </div>
  );
}
