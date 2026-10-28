import { useState, useEffect } from 'react';
import { getCvData, getSiteSettings } from '../lib/api.js';
import { 
  Download, 
  Briefcase, 
  GraduationCap, 
  Code, 
  FolderGit2, 
  ExternalLink, 
  Mail, 
  Github, 
  Linkedin, 
  Printer 
} from 'lucide-react';

export default function CvPage() {
  const [sections, setSections] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getCvData(false).catch(() => []),
      getSiteSettings().catch(() => ({})),
    ]).then(([cvSections, siteSettings]) => {
      if (mounted) {
        setSections(cvSections || []);
        setSettings(siteSettings?.general || null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const getSectionIcon = (iconName) => {
    switch (iconName) {
      case 'briefcase':
        return <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'graduation-cap':
        return <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'folder-git-2':
        return <FolderGit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/3 dark:bg-slate-800" />
        <div className="h-32 bg-slate-200 rounded-xl dark:bg-slate-800" />
        <div className="space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4 dark:bg-slate-800" />
          <div className="h-20 bg-slate-200 rounded dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const authorName = settings?.author_name || 'Theara';
  const authorBio = settings?.author_bio || 'Senior Full-Stack Software Engineer';
  const cvPdfUrl = settings?.cv_pdf_url || '';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header & Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {authorName}
            </h1>
            <p className="text-base font-medium text-indigo-600 dark:text-indigo-400">
              {authorBio}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print CV</span>
            </button>

            {cvPdfUrl && (
              <a
                href={cvPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            )}
          </div>
        </div>

        {/* Contacts & Social Links */}
        <div className="pt-4 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
          {settings?.social_github && (
            <a
              href={settings.social_github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-indigo-600"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          )}
          {settings?.social_linkedin && (
            <a
              href={settings.social_linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-indigo-600"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
          )}
        </div>
      </div>

      {/* CV Sections Loop */}
      {sections.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-sm text-slate-500">
            No CV entries have been created yet. Add them in the Admin CV Editor!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                  {getSectionIcon(section.icon)}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {section.title}
                </h2>
              </div>

              {section.items && section.items.length > 0 ? (
                <div className="space-y-5">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-4 border-b border-slate-50 last:border-0 dark:border-slate-800/60"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                            {item.label}
                          </h3>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                              title="Visit link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {item.subtitle && (
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </p>
                        )}

                        {item.value && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-1 whitespace-pre-line">
                            {item.value}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No items listed in this section.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
