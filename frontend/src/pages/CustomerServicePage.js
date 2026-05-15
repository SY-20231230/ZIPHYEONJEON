import React, { useState, useEffect, useRef } from 'react';
import apiClient from 'api/apiClient';
import ConfirmModal from 'components/common/ConfirmModal';

// SVG Icons
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="6" x2="21" y2="6"></line></svg>;
const XIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const ChevronDownIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const ChevronUpIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>;

const CustomerServicePage = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    // New States
    const [introData, setIntroData] = useState({ greeting: '', capabilities: [], categories: [] });
    const [rooms, setRooms] = useState([]);
    const [currentRoomId, setCurrentRoomId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Edit Title State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitleValue, setEditTitleValue] = useState('');

    // Category State
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState(null);

    const scrollRef = useRef(null);

    // Initial Fetch
    useEffect(() => {
        fetchIntro();
        fetchRooms();
    }, []);

    const fetchIntro = async () => {
        try {
            const res = await apiClient.get('/api/chat/intro');
            setIntroData(res.data);
        } catch (e) {
            console.error("Failed to fetch intro data", e);
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await apiClient.get('/api/chat/rooms');
            setRooms(res.data);
        } catch (e) {
            console.error("Failed to fetch chat rooms", e);
        }
    };

    const fetchMessages = async (roomId) => {
        try {
            const res = await apiClient.get(`/api/chat/rooms/${roomId}`);
            const formattedMessages = res.data.map(msg => ({
                id: msg.messageId,
                type: msg.senderType?.toUpperCase() === 'USER' ? 'user' : 'bot', // 💡 대소문자 안전 매핑
                text: msg.messageContent,
                references: msg.references || []
            }));
            setMessages(formattedMessages);
        } catch (e) {
            console.error("Failed to fetch messages", e);
        }
    };

    const handleRoomSelect = (roomId) => {
        setCurrentRoomId(roomId);
        fetchMessages(roomId);
        setIsSidebarOpen(false); // 모바일용 닫기
        setIsEditingTitle(false);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        const guideMsg = {
            id: Date.now(),
            type: 'bot',
            text: `[${category.label}]를 선택하셨습니다. 관련하여 궁금한 점을 말씀해 주세요.`
        };
        setMessages(prev => [...prev, guideMsg]);
    };

    const handleNewChat = () => {
        setCurrentRoomId(null);
        setMessages([]);
        setIsSidebarOpen(false);
        setIsEditingTitle(false);
        setSelectedCategory(null);
    };

    const handleDeleteClick = (roomId, e) => {
        e.stopPropagation();
        setRoomToDelete(roomId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roomToDelete) return;
        try {
            await apiClient.delete(`/api/chat/rooms/${roomToDelete}`);
            if (currentRoomId === roomToDelete) {
                handleNewChat();
            }
            fetchRooms();
        } catch (e) {
            console.error("Failed to delete room", e);
        } finally {
            setIsDeleteModalOpen(false);
            setRoomToDelete(null);
        }
    };

    const handleSendMessage = async (text, categoryLabel = null) => {
        const messageText = text || inputValue;
        if (!messageText.trim() || isChatLoading) return;

        const tempId = Date.now();
        setMessages(prev => [...prev, { id: tempId, type: 'user', text: messageText }]);
        setInputValue('');
        setIsChatLoading(true);

        try {
            let activeRoomId = currentRoomId;
            // 1. 방이 없으면 먼저 생성
            if (!activeRoomId) {
                const roomRes = await apiClient.post('/api/chat/rooms');
                activeRoomId = roomRes.data.roomId;
                setCurrentRoomId(activeRoomId);
            }

            // 2. 메시지 전송
            const payload = { message: messageText };
            if (categoryLabel || selectedCategory?.id) {
                payload.category = categoryLabel || selectedCategory?.id;
            }

            const res = await apiClient.post(`/api/chat/rooms/${activeRoomId}/messages`, payload);

            // 카테고리 사용 후 초기화
            setSelectedCategory(null);

            const botMsg = {
                id: res.data.messageId,
                type: 'bot',
                text: res.data.messageContent,
                references: res.data.references || []
            };
            setMessages(prev => [...prev, botMsg]);

            // 첫 메시지 전송 후 방 목록 갱신 (제목이 자동 갱신되었을 수 있으므로)
            fetchRooms();
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: "죄송합니다. 현재 AI 엔진 통신 중 오류가 발생했습니다."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleUpdateTitle = async () => {
        if (!editTitleValue.trim() || !currentRoomId) {
            setIsEditingTitle(false);
            return;
        }
        try {
            await apiClient.patch(`/api/chat/rooms/${currentRoomId}/title`, { title: editTitleValue });
            setIsEditingTitle(false);
            fetchRooms();
        } catch (e) {
            console.error("Failed to update title", e);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isChatLoading]);

    // Accordion Component for References
    const ReferenceAccordion = ({ references }) => {
        const [isOpen, setIsOpen] = useState(false);
        if (!references || references.length === 0) return null;

        return (
            <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 w-full max-w-[85%]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <span className="text-blue-600">📚</span>
                        관련 법령 및 출처 ({references.length}건)
                    </span>
                    {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {isOpen && (
                    <div className="p-3 border-t border-slate-200 space-y-3 bg-white">
                        {references.map((ref, idx) => (
                            <div key={idx} className="text-xs text-slate-700">
                                <p className="font-black text-slate-900 mb-1">{ref.title} <span className="text-slate-400 font-medium ml-1">({ref.source})</span></p>
                                <p className="leading-relaxed whitespace-pre-wrap">{ref.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // FAQ Item Component (Enhanced Design)
    const FaqItem = ({ question, answer }) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className={`group mb-4 rounded-[2rem] transition-all duration-500 overflow-hidden ${
                isOpen 
                ? 'bg-white shadow-[0_20px_50px_rgba(0,40,85,0.1)] border-blue-200' 
                : 'bg-white/60 hover:bg-white border-slate-100 hover:border-blue-100 hover:shadow-xl'
            } border`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-7 text-left transition-all"
                >
                    <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${
                            isOpen ? 'bg-blue-600 text-white rotate-[360deg]' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                        }`}>
                            Q
                        </div>
                        <span className={`text-base font-black tracking-tight transition-colors duration-300 ${
                            isOpen ? 'text-blue-700' : 'text-slate-700'
                        }`}>{question}</span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isOpen ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-slate-50 text-slate-300'
                    }`}>
                        <ChevronDownIcon />
                    </div>
                </button>
                <div className={`transition-all duration-500 ease-in-out ${
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    <div className="px-8 pb-8 pt-0">
                        <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <p className="text-sm font-bold text-slate-600 leading-relaxed relative z-10">
                                <span className="text-blue-600 font-black mr-2">A.</span>
                                {answer}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const currentRoom = rooms.find(r => r.roomId === currentRoomId);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-10 relative overflow-x-hidden">
            {/* Sidebar Drawer */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">대화 기록</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                        <XIcon />
                    </button>
                </div>

                <div className="p-4">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-[#002855] text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-md active:scale-[0.98]"
                    >
                        <PlusIcon /> 새 대화 시작
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 no-scrollbar">
                    {rooms.map(room => (
                        <div
                            key={room.roomId}
                            onClick={() => handleRoomSelect(room.roomId)}
                            className={`group relative p-4 rounded-xl cursor-pointer transition-all border ${currentRoomId === room.roomId
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                                }`}
                        >
                            <h3 className={`font-bold text-sm truncate pr-6 ${currentRoomId === room.roomId ? 'text-blue-700' : 'text-slate-700'}`}>
                                {room.title || '대화 중...'}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                                {new Date(room.createdAt).toLocaleDateString()}
                            </p>
                            <button
                                onClick={(e) => handleDeleteClick(room.roomId, e)}
                                className={`absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors ${currentRoomId === room.roomId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                    {rooms.length === 0 && (
                        <div className="text-center text-slate-400 text-sm py-10 font-medium">
                            대화 기록이 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <header className="max-w-7xl mx-auto mb-12 px-4">
                <span className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">부동산 법령 및 계약 정보 검색</span>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">집현전 챗봇 AI</h1>
            </header>

            <main className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 px-4">
                
                {/* [왼쪽: 대화 기록 사이드바 - 상시 노출] */}
                <aside className="lg:col-span-3 hidden lg:flex flex-col bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden h-[750px]">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h2 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <span className="text-blue-600">🕒</span> 대화 기록
                        </h2>
                    </div>
                    <div className="p-4">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center justify-center gap-2 bg-[#002855] text-white py-3 rounded-2xl font-bold text-xs hover:bg-blue-600 transition-all shadow-md"
                        >
                            <PlusIcon /> 새 대화 시작
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 no-scrollbar">
                        {rooms.map(room => (
                            <div
                                key={room.roomId}
                                onClick={() => handleRoomSelect(room.roomId)}
                                className={`group relative p-4 rounded-2xl cursor-pointer transition-all border ${currentRoomId === room.roomId
                                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                                    : 'bg-white border-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                <h3 className={`font-bold text-[13px] truncate pr-6 ${currentRoomId === room.roomId ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {room.title || '대화 중...'}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">
                                    {new Date(room.createdAt).toLocaleDateString()}
                                </p>
                                <button
                                    onClick={(e) => handleDeleteClick(room.roomId, e)}
                                    className={`absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors ${currentRoomId === room.roomId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                        {rooms.length === 0 && (
                            <div className="text-center text-slate-400 text-xs py-10 font-medium">
                                대화 기록이 없습니다.
                            </div>
                        )}
                    </div>
                </aside>

                {/* [중앙: AI 챗봇 모듈] */}
                <section className="lg:col-span-5 bg-white rounded-[56px] shadow-sm border border-slate-100 flex flex-col h-[750px] overflow-hidden relative">

                    {/* 챗봇 헤더 */}
                    <div className="p-6 bg-[#0F172A] text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <MenuIcon />
                            </button>
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-lg shadow-lg">🤖</div>
                            <div>
                                {isEditingTitle ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            autoFocus
                                            value={editTitleValue}
                                            onChange={(e) => setEditTitleValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                                            className="bg-white/10 border border-white/20 text-white px-2 py-1 rounded text-sm font-black outline-none focus:border-blue-400"
                                        />
                                        <button onClick={handleUpdateTitle} className="text-[10px] bg-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-500">저장</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                                            {currentRoomId ? (currentRoom?.title || '대화 중...') : '새로운 대화'}
                                        </h3>
                                        {currentRoomId && (
                                            <button
                                                onClick={() => {
                                                    setEditTitleValue(currentRoom?.title || '');
                                                    setIsEditingTitle(true);
                                                }}
                                                className="text-slate-400 hover:text-white transition-colors"
                                            >
                                                <EditIcon />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 메시지 영역 */}
                    <div
                        ref={scrollRef}
                        className="flex-grow p-6 overflow-y-auto space-y-6 bg-slate-50/50"
                    >
                        {messages.length > 0 ? (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[90%] p-4 rounded-[24px] text-[13px] font-bold shadow-sm ${msg.type === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                        }`}>
                                        <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                    </div>
                                    {msg.type === 'bot' && <ReferenceAccordion references={msg.references} />}
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                <div className="w-16 h-16 bg-white rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-center text-2xl mb-4">💬</div>
                                <h4 className="text-lg font-black text-slate-900 tracking-tighter whitespace-pre-line leading-tight">
                                    {introData.greeting || '어떤 도움이 필요하신가요?'}
                                </h4>
                                <p className="text-xs text-slate-400 font-medium mt-2 mb-6 max-w-[200px]">
                                    {introData.capabilities?.join(' / ') || '궁금한 점을 말씀해 주세요.'}
                                </p>

                                {introData.categories && introData.categories.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        {introData.categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat)}
                                                className="bg-white border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all p-3 rounded-xl text-left group"
                                            >
                                                <div className="text-lg mb-1">{cat.icon}</div>
                                                <div className="font-black text-slate-700 text-[11px] group-hover:text-blue-600">{cat.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {isChatLoading && (
                            <div className="flex justify-start items-start">
                                <div className="bg-white border border-slate-100 px-4 py-3 rounded-[24px] rounded-tl-none shadow-sm flex gap-2 items-center">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 하단 질문 선택 및 입력창 */}
                    <div className="p-6 bg-white border-t border-slate-100">
                        <div className="flex gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-[20px] focus-within:border-blue-400 transition-all">
                            <input
                                className="flex-grow px-4 py-3 bg-transparent outline-none font-bold text-xs text-slate-700 placeholder:text-slate-400"
                                placeholder="메시지를 입력하세요..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isChatLoading}
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={isChatLoading || !inputValue.trim()}
                                className="bg-[#002855] disabled:bg-slate-300 text-white px-6 py-3 rounded-[16px] font-black text-[11px] hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center"
                            >
                                전송
                            </button>
                        </div>
                        <div className="mt-4 px-2 text-[9px] text-slate-400 leading-relaxed text-center">
                            ⚠️ <strong>법적 고지:</strong> 본 AI 답변은 단순 정보 전달용이며 법적 효력이 없습니다.
                        </div>
                    </div>
                </section>

                {/* [오른쪽: FAQ 영역] */}
                <section className="lg:col-span-4 space-y-8">
                    <div className="bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-10 rounded-[56px] border border-slate-100 min-h-[750px] flex flex-col overflow-hidden shadow-[0_30px_60px_rgba(0,40,85,0.05)]">
                        <div className="mb-10 relative">
                            <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] block mb-2">FAQ</span>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-1">자주 묻는 질문</h2>
                            <div className="w-10 h-1 bg-blue-600 rounded-full mt-3"></div>
                        </div>

                        <div className="flex-grow space-y-2 overflow-y-auto pr-2 no-scrollbar">
                            {[
                                {
                                    q: "예측 서비스의 정확도는 어느 정도인가요?",
                                    a: "집현전의 AI 예측 모델은 국토교통부 실거래가와 KB국민은행 시세 등 신뢰도 높은 공공·민간 빅데이터를 기반으로 학습되었습니다. 과거 추세 분석과 시장 변동성을 종합적으로 고려하여 높은 신뢰도를 지향하지만, 부동산 시장은 정책 변화나 거시 경제 등 변수가 많으므로 예측 결과는 투자 참고용으로만 활용하시길 권장합니다."
                                },
                                {
                                    q: "다른 부동산 앱(직방, 호갱노노 등)과 어떤 차이점이 있나요?",
                                    a: "기존 앱들이 매물 정보 공유와 실거래가 확인에 집중한다면, 집현전은 '데이터 기반의 미래 예측'에 특화되어 있습니다. AI를 활용한 1·3·6개월 뒤의 시세 변동 예측, 경매를 위한 AI 적정 입찰가 제안, 그리고 복잡한 부동산 법령을 RAG 기반 챗봇으로 즉시 검색할 수 있는 지능형 의사결정 지원 도구라는 점이 가장 큰 차이점입니다."
                                },
                                {
                                    q: "원하는 지역의 아파트가 검색되지 않는데 이유가 무엇인가요?",
                                    a: "검색되지 않는 경우는 크게 두 가지입니다. 첫째, 신축 아파트 등 실거래 데이터가 충분히 쌓이지 않아 AI가 유의미한 예측 결과를 도출하기 어려운 단지일 수 있습니다. 둘째, 현재 서비스 고도화 단계에 따라 일부 지역의 데이터 인제스션(Ingestion)이 순차적으로 진행 중일 수 있습니다. 지속적인 업데이트를 통해 서비스 지역을 확대하고 있습니다."
                                },
                                {
                                    q: "부동산 법률 관련 답변은 법적 효력이 있나요?",
                                    a: "아니요, 법적 효력이 없습니다. 집현전 챗봇이 제공하는 답변은 공공 법령 및 참고 자료를 기반으로 한 '정보 전달' 목적의 가이드일 뿐입니다. 실제 계약이나 법적 분쟁 해결을 위해서는 반드시 전문 변호사나 공인중개사 등 관련 전문가와 상담하셔야 하며, 본 서비스의 답변을 근거로 행한 결정에 대해 서비스 제공자는 법적 책임을 지지 않습니다."
                                }
                            ].map((item, idx) => (
                                <FaqItem key={idx} question={item.q} answer={item.a} />
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* 채팅 삭제 확인 커스텀 모달 */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="채팅방 삭제"
                message={"이 채팅방을 삭제하시겠습니까?\n삭제된 대화 내용은 복구할 수 없습니다."}
                confirmText="삭제하기"
                cancelText="취소"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
};

export default CustomerServicePage;