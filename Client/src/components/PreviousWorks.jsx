import { useState, useEffect, Fragment } from 'react';
import Skeleton from './Skeleton';
import AdBanner from './AdBanner';
import { apiGetPreviousWorks } from '../services/api';

export const WorkSkeletonCard = () => {
  return (
    <div className="w-[240px] sm:w-[300px] md:w-[340px] shrink-0 bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm skeleton-shimmer space-y-3">
      <Skeleton type="rect" className="h-28 sm:h-36 w-full rounded-xl sm:rounded-2xl" />
      <Skeleton type="heading" className="h-5 sm:h-6 w-3/4" />
      <Skeleton type="text" className="h-3.5 w-full" />
      <Skeleton type="text" className="h-3.5 w-4/5" />
      <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between">
        <Skeleton type="rect" className="h-8 w-20 rounded-lg" />
        <Skeleton type="rect" className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
};

export const PreviousWorks = ({ isLoading: propLoading, onViewAll }) => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchWorks = async () => {
      try {
        const res = await apiGetPreviousWorks();
        if (isMounted && res && res.success && res.works) {
          setWorks(res.works);
        }
      } catch (err) {
        console.warn('[PreviousWorks API]: Could not fetch previous works', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWorks();

    return () => {
      isMounted = false;
    };
  }, []);

  const isShowLoading = propLoading || loading;

  if (!isShowLoading && works.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[var(--text-main)]">
            Previous Works
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onViewAll && onViewAll()}
            className="text-xs sm:text-sm font-semibold font-poppins text-[var(--color-primary-600)] hover:underline cursor-pointer flex items-center space-x-1"
          >
            <span>View All ({works.length})</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Horizontal Row Flex Container */}
      <div className="flex flex-row overflow-x-auto no-scrollbar gap-4 sm:gap-6 py-2 px-1 scroll-smooth">
        {isShowLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <WorkSkeletonCard key={idx} />
            ))
          : works.map((work, idx) => {
              const workId = work._id || work.id;
              const gradientClass = work.gradient || 'from-blue-500 to-indigo-600';
              const showAdBefore = idx > 0 && idx % 2 === 0;

              return (
                <Fragment key={workId || idx}>
                  {showAdBefore && (
                    <div className="w-[260px] sm:w-[320px] shrink-0 self-stretch flex items-center">
                      <AdBanner placement="quiz_catalog_top" className="w-full h-full my-0" />
                    </div>
                  )}
                  <div
                    onClick={() => setSelectedWork(work)}
                    className="w-[230px] sm:w-[290px] md:w-[330px] shrink-0 group bg-[var(--bg-card)] border border-[var(--border-theme)] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
                  >
                    <div>
                      {/* Compact Banner Visual */}
                      <div className={`h-28 sm:h-36 rounded-xl sm:rounded-2xl bg-gradient-to-r ${gradientClass} p-3.5 sm:p-4 text-white flex flex-col justify-between mb-3 sm:mb-4 shadow-md relative overflow-hidden`}>
                        <div className="flex justify-between items-start z-10">
                          <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold font-poppins bg-black/25 backdrop-blur-md">
                            {work.badge || 'Completed'}
                          </span>
                          <span className="text-[10px] sm:text-xs font-medium font-lato bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-md">
                            🏆 {work.topWinner || 'Top Winner'}
                          </span>
                        </div>

                        <div className="z-10">
                          <div className="text-[10px] sm:text-xs font-lato opacity-80">
                            {work.category || 'Archived Challenge'}
                          </div>
                          <div className="font-poppins font-bold text-sm sm:text-base line-clamp-1">
                            {work.title}
                          </div>
                        </div>
                      </div>

                      <h3 className="font-poppins font-bold text-sm sm:text-base text-[var(--text-main)] group-hover:text-[var(--color-primary-600)] transition-colors mb-1.5 line-clamp-1">
                        {work.title}
                      </h3>

                      <p className="font-lato text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
                        {work.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-theme)] flex items-center justify-between">
                      <div className="text-[10px] sm:text-xs font-lato text-[var(--text-muted)] space-y-0.5">
                        <div className="font-medium text-[var(--text-main)]">{work.participantsCount || '1,200 Participants'}</div>
                        <div>{work.avgScore || '80% Avg'}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWork(work);
                        }}
                        className="px-3 py-1.5 rounded-xl font-poppins font-semibold text-[11px] sm:text-xs text-[var(--color-primary-600)] bg-[var(--color-primary-50)] hover:bg-[var(--color-primary-100)] dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
                      >
                        Results
                      </button>
                    </div>
                  </div>
                </Fragment>
              );
            })}
      </div>

      {/* QUICK WORK DETAILS MODAL */}
      {selectedWork && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-theme)] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedWork(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[var(--border-theme)] bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              ✕
            </button>

            {/* Gradient Header in Modal */}
            <div className={`h-36 rounded-2xl bg-gradient-to-r ${selectedWork.gradient || 'from-blue-500 to-indigo-600'} p-5 text-white flex flex-col justify-between mb-5 shadow-lg relative`}>
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold font-poppins bg-black/30 backdrop-blur-md">
                  {selectedWork.badge || 'Completed'}
                </span>
                <span className="text-xs font-medium font-lato bg-white/25 px-2.5 py-1 rounded-lg backdrop-blur-md">
                  🏆 Top Winner: {selectedWork.topWinner}
                </span>
              </div>
              <div>
                <span className="text-xs font-lato opacity-80">{selectedWork.category || 'Web Dev'}</span>
                <h3 className="font-poppins font-bold text-lg sm:text-xl">{selectedWork.title}</h3>
              </div>
            </div>

            <p className="font-lato text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">
              {selectedWork.description}
            </p>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5 font-lato text-xs">
              <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] p-3 rounded-xl">
                <div className="text-[var(--text-muted)] text-[10px] uppercase font-bold">Total Participants</div>
                <div className="font-bold font-poppins text-sm text-[var(--text-main)] mt-0.5">
                  {selectedWork.participantsCount || '1,000+'}
                </div>
              </div>
              <div className="bg-[var(--bg-main)] border border-[var(--border-theme)] p-3 rounded-xl">
                <div className="text-[var(--text-muted)] text-[10px] uppercase font-bold">Average Score</div>
                <div className="font-bold font-poppins text-sm text-emerald-500 mt-0.5">
                  {selectedWork.avgScore || '82%'}
                </div>
              </div>
            </div>

            {selectedWork.techStack && (
              <div className="mb-6">
                <span className="text-xs font-poppins font-bold text-[var(--text-muted)] uppercase block mb-2">
                  Skills & Tech Tested
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(selectedWork.techStack) ? selectedWork.techStack : String(selectedWork.techStack).split(','))
                    .map((tech, idx) => (
                      <span key={idx} className="text-xs font-lato px-2.5 py-1 rounded-lg bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-theme)] font-medium">
                        {tech.trim()}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedWork(null)}
              className="w-full py-3 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-poppins font-bold text-xs shadow-md cursor-pointer transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PreviousWorks;
