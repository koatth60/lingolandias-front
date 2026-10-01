import { useState, useEffect } from 'react';
import { getAllBoardsAdmin, getLists } from '../../data/trelloApi';
import { useSelector } from 'react-redux';
import { getBgStyle } from './trelloConfig';

const BoardPreviewModal = ({ board, onClose }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLists(board.id)
      .then(setLists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [board.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-ll-panel rounded-2xl shadow-2xl w-full max-w-3xl border border-ll-line overflow-hidden">
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ ...getBgStyle(board.background), fontFamily: board.fontFamily }}
        >
          <div>
            <h3 className="text-xl font-bold text-white drop-shadow">{board.name}</h3>
            <p className="text-white/70 text-sm mt-0.5">
              {lists.length} list{lists.length !== 1 ? 's' : ''} ·{' '}
              {lists.reduce((s, l) => s + (l.cards?.length || 0), 0)} cards
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 rounded-full border-4 border-ll-violet border-t-transparent animate-spin" />
            </div>
          ) : lists.length === 0 ? (
            <p className="text-center text-ll-ink3 py-8">No lists in this board</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <div key={list.id} className="bg-ll-subtle rounded-xl p-4 border border-ll-line">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-ll-ink text-sm">{list.name}</h4>
                    <span className="text-xs text-ll-ink3 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {list.cards?.length || 0}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(list.cards || []).slice(0, 5).map((card) => (
                      <div key={card.id} className="bg-ll-panel rounded-lg px-3 py-2 border border-ll-line">
                        {card.label && (
                          <div className="h-1.5 w-10 rounded-full mb-1.5" style={{ backgroundColor: card.label }} />
                        )}
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{card.name}</p>
                      </div>
                    ))}
                    {(list.cards?.length || 0) > 5 && (
                      <p className="text-xs text-ll-ink3 pl-1">
                        +{list.cards.length - 5} more cards
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ROLE_BADGE = {
  admin: { label: 'Admin', className: 'bg-ll-gold-tint text-ll-gold-ink' },
  teacher: { label: 'Teacher', className: 'bg-ll-violet-tint text-ll-violet-ink' },
};

const AdminTrelloPanel = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [search, setSearch] = useState('');
  const user = useSelector((state) => state.user.userInfo.user);

  useEffect(() => {
    getAllBoardsAdmin()
      .then((b) => setBoards(b || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group boards by userId — owner name/role now comes straight from the
  // backend (joined against the real user, whatever their role), so no
  // separate teachers-only lookup or truncated-UUID fallback is needed.
  const grouped = boards.reduce((acc, board) => {
    if (!acc[board.userId]) acc[board.userId] = [];
    acc[board.userId].push(board);
    return acc;
  }, {});

  const getTeacherName = (userId) => grouped[userId]?.[0]?.ownerName || 'Unknown user';
  const getTeacherRole = (userId) => grouped[userId]?.[0]?.ownerRole;

  const filteredBoards = boards.filter((b) => {
    const teacherName = getTeacherName(b.userId).toLowerCase();
    const matchTeacher = !filterTeacher || b.userId === filterTeacher;
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || teacherName.includes(search.toLowerCase());
    return matchTeacher && matchSearch;
  });

  const totalCards = boards.reduce((s, b) => s + (b.listCount || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ll-ink">Trello Admin</h1>
        <p className="text-ll-ink3 mt-1 text-[13.5px]">Overview of all teacher workspaces</p>
      </div>

      {/* Stats: one strip */}
      <div className="grid grid-cols-3 rounded-xl border border-ll-line bg-ll-panel divide-x divide-ll-line mb-6">
        {[
          { label: 'Total boards', value: boards.length },
          { label: 'Active teachers', value: Object.keys(grouped).length },
          { label: 'Avg boards / teacher', value: Object.keys(grouped).length ? (boards.length / Object.keys(grouped).length).toFixed(1) : 0 },
        ].map((stat) => (
          <div key={stat.label} className="px-3 sm:px-5 py-3 sm:py-4">
            <div className="font-mono text-[22px] font-medium leading-tight text-ll-ink">{stat.value}</div>
            <div className="text-[12px] text-ll-ink3 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="Search boards or teachers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 px-3 rounded-lg border border-ll-line2 bg-ll-panel text-ll-ink text-[13.5px] placeholder:text-ll-ink3 focus:outline-none focus:border-ll-violet/60 w-full sm:w-64"
        />
        <select
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
          className="h-9 px-3 rounded-lg border border-ll-line2 bg-ll-panel text-ll-ink text-[13.5px] focus:outline-none focus:border-ll-violet/60"
        >
          <option value="">All teachers</option>
          {Object.keys(grouped).map((userId) => (
            <option key={userId} value={userId}>{getTeacherName(userId)}</option>
          ))}
        </select>
        {(search || filterTeacher) && (
          <button onClick={() => { setSearch(''); setFilterTeacher(''); }} className="ll-btn ll-btn-secondary">
            Clear
          </button>
        )}
      </div>

      {/* Boards grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-[3px] border-ll-violet/30 border-t-ll-violet animate-spin" />
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[14px] font-semibold text-ll-ink">No boards found</p>
          <p className="text-[13px] text-ll-ink3 mt-1">Try a different search.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {Object.keys(grouped)
            .filter((userId) => !filterTeacher || userId === filterTeacher)
            .filter((userId) =>
              !search ||
              getTeacherName(userId).toLowerCase().includes(search.toLowerCase()) ||
              grouped[userId].some((b) => b.name.toLowerCase().includes(search.toLowerCase()))
            )
            .map((userId) => {
              const teacherBoards = grouped[userId].filter(
                (b) => !search || b.name.toLowerCase().includes(search.toLowerCase()) || getTeacherName(userId).toLowerCase().includes(search.toLowerCase())
              );
              if (!teacherBoards.length) return null;
              return (
                <div key={userId}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-ll-violet-tint text-ll-violet-ink flex items-center justify-center text-[12px] font-semibold">
                      {getTeacherName(userId).charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13.5px] font-semibold text-ll-ink">{getTeacherName(userId)}</h3>
                        {ROLE_BADGE[getTeacherRole(userId)] && (
                          <span className={`text-[11.5px] font-medium px-2 py-px rounded-full ${ROLE_BADGE[getTeacherRole(userId)].className}`}>
                            {ROLE_BADGE[getTeacherRole(userId)].label}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-ll-ink3">{teacherBoards.length} board{teacherBoards.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ml-11">
                    {teacherBoards.map((board) => (
                      <div
                        key={board.id}
                        className="relative group rounded-xl overflow-hidden cursor-pointer border border-ll-line hover:shadow-ll-2 transition-shadow duration-200 h-28"
                        style={{ ...getBgStyle(board.background), fontFamily: board.fontFamily }}
                        onClick={() => setSelectedBoard(board)}
                      >
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition" />
                        <div className="absolute inset-0 p-3 flex flex-col justify-between">
                          <h4 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow">{board.name}</h4>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-white/60 text-xs">View</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {selectedBoard && (
        <BoardPreviewModal
          board={selectedBoard}
          onClose={() => setSelectedBoard(null)}
        />
      )}
    </div>
  );
};

export default AdminTrelloPanel;
