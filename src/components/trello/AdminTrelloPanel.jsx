import { useState, useEffect } from 'react';
import { getAllBoardsAdmin, getLists } from '../../data/trelloApi';
import { useSelector } from 'react-redux';
import { getBgStyle } from './trelloConfig';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:2000';

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
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-[#9E2FD0]/30 overflow-hidden">
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
              <div className="h-8 w-8 rounded-full border-4 border-[#9E2FD0] border-t-transparent animate-spin" />
            </div>
          ) : lists.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">No lists in this board</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <div key={list.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{list.name}</h4>
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {list.cards?.length || 0}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(list.cards || []).slice(0, 5).map((card) => (
                      <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                        {card.label && (
                          <div className="h-1.5 w-10 rounded-full mb-1.5" style={{ backgroundColor: card.label }} />
                        )}
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{card.name}</p>
                      </div>
                    ))}
                    {(list.cards?.length || 0) > 5 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 pl-1">
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

const AdminTrelloPanel = () => {
  const [boards, setBoards] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [search, setSearch] = useState('');
  const user = useSelector((state) => state.user.userInfo.user);

  useEffect(() => {
    Promise.all([
      getAllBoardsAdmin(),
      fetch(BACKEND_URL + '/users/teachers', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
      })
        .then((r) => r.json())
        .catch(() => []),
    ])
      .then(([b, u]) => {
        setBoards(b || []);
        setUsers(Array.isArray(u) ? u : (u.users || u.data || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group boards by userId
  const grouped = boards.reduce((acc, board) => {
    if (!acc[board.userId]) acc[board.userId] = [];
    acc[board.userId].push(board);
    return acc;
  }, {});

  const getTeacherName = (userId) => {
    const u = users.find((u) => u.id === userId);
    return u ? u.name + ' ' + u.lastName : userId.slice(0, 8) + '...';
  };

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trello Admin</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Overview of all teacher workspaces</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total boards', value: boards.length, icon: '📋' },
          { label: 'Active teachers', value: Object.keys(grouped).length, icon: '👩‍🏫' },
          { label: 'Avg boards / teacher', value: Object.keys(grouped).length ? (boards.length / Object.keys(grouped).length).toFixed(1) : 0, icon: '📊' },
          { label: 'Boards this session', value: boards.length, icon: '✨' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-brand-dark-secondary rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search boards or teachers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2FD0] w-64"
        />
        <select
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]"
        >
          <option value="">All teachers</option>
          {Object.keys(grouped).map((userId) => (
            <option key={userId} value={userId}>{getTeacherName(userId)}</option>
          ))}
        </select>
        {(search || filterTeacher) && (
          <button
            onClick={() => { setSearch(''); setFilterTeacher(''); }}
            className="px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-gray-700 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Boards grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-[#9E2FD0] border-t-transparent animate-spin" />
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 dark:text-gray-400">No boards found</p>
        </div>
      ) : (
        <div className="space-y-8">
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9E2FD0] to-[#F6B82E] flex items-center justify-center text-white text-sm font-bold">
                      {getTeacherName(userId).charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{getTeacherName(userId)}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{teacherBoards.length} board{teacherBoards.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ml-11">
                    {teacherBoards.map((board) => (
                      <div
                        key={board.id}
                        className="relative group rounded-xl overflow-hidden cursor-pointer shadow hover:shadow-lg transition-all duration-200 h-28"
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
