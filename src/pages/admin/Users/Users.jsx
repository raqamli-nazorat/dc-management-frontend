import { useState, useEffect, useCallback } from 'react'
import { MdArrowForward, MdDelete } from 'react-icons/md'
import { FaXmark } from 'react-icons/fa6'
import { usePageAction } from '../../../context/PageActionContext'
import { axiosAPI } from '../../../service/axiosAPI'
import CreateUser from './Modal/CreateUser'
import FilterSelect from '../Components/FilterSelect'
import { useNavigate } from 'react-router-dom'

const Roles = {
  superadmin: 'Bosh administrator',
  admin: 'Admin',
  manager: 'Menejer',
  employee: 'Xodim',
  auditor: 'Nazoratchi',
  accountant: 'Hisobchi',
}

function fmt(n) {
  if (n == null || n === '' || isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ── Main Page ── */
export default function UsersPage() {
  const navigate = useNavigate()
  
  const { registerAction, clearAction } = usePageAction()

  const [users, setUsers] = useState([])
  const [positions, setPositions] = useState([])

  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('Barcha lavozimlar')
  const [role, setRole] = useState('Barcha rollar')
  const [sort, setSort] = useState("")
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [activeUser, setActiveUser] = useState(null)

  const getUsers = async (params) => {
    try {
      const { data } = await axiosAPI.get(`users/`, { params })
      setUsers(data.data.results)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    const params = {}

    if (search) params.search = search
    if (position !== 'Barcha lavozimlar') params.position = position
    if (role !== 'Barcha rollar') params.roles = role
    if (sort) params.ordering = sort === 'A dan Z gacha' ? 'username' : '-username'

    getUsers(params)
  }, [search, position, role, sort])

  const getPositions = async () => {
    try {
      const { data } = await axiosAPI.get(`applications/positions/`)
      setPositions(data.data.results);
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getUsers()
    getPositions()
  }, [])

  const SORTS = ['A dan Z gacha', 'Z dan A gacha']


  useEffect(() => {
    if (activeUser) {
      clearAction()
    } else {
      registerAction({
        label: "Qo'shish",
        icon: <img src="/imgs/add-team.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
        onClick: () => setShowModal(true),
      })
    }
    return () => clearAction()
  }, [activeUser, registerAction, clearAction])

  const allSelected = users.length > 0 && users.every(u => selected.has(u.id))
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const s = new Set(prev); users.forEach(u => s.delete(u.id)); return s })
    else setSelected(prev => { const s = new Set(prev); users.forEach(u => s.add(u.id)); return s })
  }
  const toggleOne = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const startSelecting = () => { setSelecting(true); setSelected(new Set()) }
  const cancelSelecting = () => { setSelecting(false); setSelected(new Set()) }

  const showToast = useCallback((title, msg, type = 'success') => { setToast({ title, msg, type }); setTimeout(() => setToast(null), 3000) }, [])


  const statuses = (roles) => {
    if (!roles || roles.length === 0) return '—';

    const role = roles.map(r => r === "superadmin" ? "Superadmin" : r === "admin" ? "Admin" : r === "manager" ? "Meneger" : r === "employee" ? "Xodim" : "auditor" ? "Nazoratchi" : r)

    if (roles.length <= 2) return role.join(', ');
    return `${role.slice(0, 2).join(', ')} (+${roles.length - 2})`;
  }

  const handleDelete = () => {
    setUsers(prev => prev.filter(u => !selected.has(u.id)))
    showToast("Foydalanuvchi o'chirildi", "Tanlangan foydalanuvchi tizimdan muvaffaqiyatli o'chirildi")
    cancelSelecting()
  }
  const handleMove = () => { showToast("Ko'chirildi", "Tanlangan foydalanuvchi muvaffaqiyatli ko'chirildi"); cancelSelecting() }

  const handleDeleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id))
    setActiveUser(null)
    showToast("Foydalanuvchi o'chirildi", "Foydalanuvchi tizimdan muvaffaqiyatli o'chirildi")
  }

  // ── Detail view ──
  if (activeUser) {
    return (
      <UserDetail
        user={activeUser}
        onBack={() => setActiveUser(null)}
        onDelete={handleDeleteUser}
      />
    )
  }

  // ── List view ──
  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1
            className="text-[#1A1D2E] dark:text-[#FFFFFF]"
            style={{ fontSize: 24, fontWeight: 800 }}
          >
            Foydalanuvchilar
          </h1>
          {selecting ? (
            <button
              onClick={cancelSelecting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E] hover:bg-[#c8ceea]
              dark:bg-[#292A2A] dark:text-[#FFFFFF] dark:hover:bg-[#303131]"
            >
              <FaXmark size={14} />
              Bekor qilish
            </button>
          ) : (
            <button
              onClick={startSelecting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E] hover:bg-[#c8ceea]
              dark:bg-[#292A2A] dark:text-[#FFFFFF] dark:hover:bg-[#303131]"
            >
              <img src="/imgs/checkIcon.svg" alt="" className="w-4 h-4 dark:invert" />
              Tanlash
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#8E95B5]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Ism Sharifi bo'yicha izlash"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 outline-none transition-colors
              bg-white border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8]
              dark:bg-[#222323] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]"
              style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px 6px 32px', borderRadius: 12 }}
            />
          </div>
          <FilterSelect
            options={['Barcha lavozimlar', ...positions.map(pos => pos.name)]}
            value={positions.find(pos => pos.id === position)?.name || 'Barcha lavozimlar'}
            onChange={e => setPosition(positions.find(pos => pos.name === e)?.id || '')}
            width='160px'
          />
          <FilterSelect
            options={['Barcha rollar', ...Object.values(Roles)]}
            value={role === 'Barcha rollar' ? 'Barcha rollar' : Roles[role] || 'Barcha rollar'}
            onChange={e => {
              const foundKey = Object.keys(Roles).find(k => Roles[k] === e);
              console.log(foundKey);
              setRole(foundKey || 'Barcha rollar');
            }}
            width='130px'
          />
          <FilterSelect options={SORTS} value={sort} width='140px' onChange={setSort} />
        </div>

        {/* Table */}
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full" style={{ fontSize: 13 }}>
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-xs">
              <tr className="border-b border-[#EEF1F7] dark:border-[#292A2A]">
                <th className="px-4 py-3 text-left w-14" style={{ fontWeight: 500, color: '#5B6078' }}>
                  {selecting ? (
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer accent-[#3F57B3]" />
                      <span>ID</span>
                    </span>
                  ) : '№'}
                </th>
                <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: '#5B6078' }}>Ism Sharifi</th>
                <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: '#5B6078' }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" />
                    Lavozim
                  </span>
                </th>
                <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: '#5B6078' }}>
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0" />
                    Rol
                  </span>
                </th>
                <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: '#5B6078' }}>Oylik maosh (UZS)</th>
                <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: '#5B6078' }}>Balans (UZS)</th>
                <th className="px-4 py-3 text-center" style={{ fontWeight: 500, color: '#5B6078' }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u.id}
                  onClick={() => navigate(`/admin/users/detail/${u.id}`)}
                  className="transition-colors cursor-pointer border-b border-[#EEF1F7] dark:border-[#292A2A]"
                >
                  <td
                    className="px-4 py-3 w-14"
                    onClick={e => e.stopPropagation()}
                  >
                    {selecting ? (
                      <span
                        className="flex items-center gap-2 transition-all duration-150"
                        style={selected.has(u.id) ? { paddingLeft: 10 } : {}}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          onChange={() => toggleOne(u.id)}
                          className="cursor-pointer accent-[#3F57B3] shrink-0"
                        />
                        <span className="text-[#8F95A8]" style={{ fontWeight: 500 }}>{idx + 1}</span>
                      </span>
                    ) : (
                      <span className="text-[#8F95A8]" style={{ fontWeight: 500 }}>{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{u.name || u.username || '—'}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-white" style={{ fontWeight: 500 }}>{positions?.find(p => p.id === u.position)?.name || '—'}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white" style={{ fontWeight: 500 }}>
                    {statuses(u.roles)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white" style={{ fontWeight: 800 }}>{fmt(u.fixed_salary)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white" style={{ fontWeight: 500 }}>{fmt(u.balance)}</td>
                  <td className="px-4 py-3 text-center">
                    {u.is_active
                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                      : <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#E02D2D]"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Foydalanuvchilar topilmadi</div>
          )}
        </div>

        {/* Selection bar */}
        {selecting && selected.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl
          bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
            <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0] mr-1">{selected.size} ta tanlandi</span>
            <button onClick={handleMove} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-[#EEF1F7] text-[#1A1D2E] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:text-[#FFFFFF] dark:hover:bg-[#333434]">
              <MdArrowForward size={16} />
              Ko'chirish
            </button>
            <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-[#FFF2F2] text-[#E02D2D] hover:bg-[#F8D7DA] dark:bg-[#E02D2D]/10 dark:text-[#FA5252] dark:hover:bg-[#E02D2D]/20">
              <MdDelete size={16} />
              O'chirish
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <CreateUser
          onClose={() => setShowModal(false)}
          setUsers={setUsers}
          positions={positions}
          Roles={Roles}
        />
      )}
    </>
  )
}
