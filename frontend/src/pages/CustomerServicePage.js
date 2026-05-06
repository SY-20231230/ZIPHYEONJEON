import React, { useState, useEffect, useRef } from 'react';
import apiClient from 'api/apiClient';

/**
 * [CustomerServicePage - Chatbot Focused]
 * 수리일: 2026. 04. 29
 * 핵심 수정: 데이터 독립형 챗봇 엔진 구축, 질문 선택형(Quick Select) 인터페이스 도입
 */
const CustomerServicePage = () => {
    // 💡 [Chatbot States] 페이지 데이터와 독립적으로 작용
    const [messages, setMessages] = useState([]); 
    const [inputValue, setInputValue] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const scrollRef = useRef(null);

    // 💡 [Quick Questions] 사용자가 선택할 수 있는 질문 리스트 (요구명세서 기반)
    const quickQuestions = [
        { id: 'q1', text: "현재 이 지역의 전세가율 위험도는 어떤가요?", category: "위험분석" },
        { id: 'q2', text: "상가 임대료 예측에 사용된 데이터는 무엇인가요?", category: "AI엔진" },
        { id: 'q3', text: "교통카드 데이터를 활용한 유동인구 분석을 보여주세요.", category: "빅데이터" },
        { id: 'q4', text: "매물 시세 비교 결과를 PDF로 받을 수 있나요?", category: "기능문의" }
    ];

    // 메시지가 추가될 때마다 하단으로 자동 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    /**
     * [handleSendMessage] 
     * 사용자가 직접 입력하거나 질문을 선택했을 때 실행되는 독립 로직
     */
    const handleSendMessage = async (text) => {
        const messageText = text || inputValue;
        if (!messageText.trim() || isChatLoading) return;

        // 1. 사용자 메시지 즉시 렌더링
        const userMsg = { id: Date.now(), type: 'user', text: messageText };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsChatLoading(true);

        try {
            // 💡 04.28/29 지침: 챗봇 전용 엔드포인트 호출 (POST /api/chatbot/ask)
            const response = await apiClient.post('/api/chatbot/ask', { 
                question: messageText,
                timestamp: new Date().toISOString()
            });

            // 2. 서버 응답 메시지 렌더링
            const botMsg = { id: Date.now() + 1, type: 'bot', text: response.data.answer };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            // 💡 에러 발생 시에도 챗봇의 독립적 반응 보장
            const errorMsg = { 
                id: Date.now() + 1, 
                type: 'bot', 
                text: "죄송합니다. 현재 AI 상담 엔진 점검 중입니다. 잠시 후 다시 시도해주세요." 
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-10">
            <header className="max-w-7xl mx-auto mb-12">
                <span className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">Service Architecture</span>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">집현전 AI 서비스 센터</h1>
            </header>

            <main className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
                
                {/* [AI 챗봇 모듈] 💡 다른 데이터와 무관하게 독자 작동 */}
                <section className="lg:col-span-6 bg-white rounded-[56px] shadow-sm border border-slate-100 flex flex-col h-[750px] overflow-hidden relative">
                    
                    {/* 챗봇 헤더 */}
                    <div className="p-8 bg-[#0F172A] text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">🤖</div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">지능형 분석 가이드</h3>
                                <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Always Active / Data Independent</p>
                            </div>
                        </div>
                    </div>

                    {/* 메시지 영역 */}
                    <div 
                        ref={scrollRef}
                        className="flex-grow p-8 overflow-y-auto space-y-6 bg-slate-50/50"
                    >
                        {messages.length > 0 ? (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-5 rounded-[32px] text-sm font-bold shadow-sm ${
                                        msg.type === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-10">
                                <div className="w-20 h-20 bg-white rounded-[32px] shadow-sm flex items-center justify-center text-3xl mb-6">💬</div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tighter">어떤 도움이 필요하신가요?</h4>
                                <p className="text-sm text-slate-400 font-medium mt-2">
                                    아래의 질문을 선택하시거나 <br/> 궁금한 점을 직접 입력해주세요.
                                </p>
                            </div>
                        )}
                        {isChatLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-slate-200 w-16 h-8 rounded-full"></div>
                            </div>
                        )}
                    </div>

                    {/* 하단 질문 선택 및 입력창 */}
                    <div className="p-8 bg-white border-t border-slate-100">
                        {/* 💡 질문 선택 칩 (Quick Select) */}
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                            {quickQuestions.map(q => (
                                <button 
                                    key={q.id}
                                    onClick={() => handleSendMessage(q.text)}
                                    className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-black text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all"
                                >
                                    <span className="text-blue-400 mr-1.5">#</span>{q.category}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 bg-slate-100 p-2 rounded-[24px]">
                            <input 
                                className="flex-grow px-6 py-4 bg-transparent outline-none font-bold text-sm text-slate-700"
                                placeholder="메시지를 입력하세요..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button 
                                onClick={() => handleSendMessage()}
                                disabled={isChatLoading}
                                className="bg-[#002855] text-white px-8 py-4 rounded-[20px] font-black text-xs hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-900/10"
                            >
                                전송
                            </button>
                        </div>
                    </div>
                </section>

                {/* [분석 도구 영역] 💡 챗봇 외 다른 기능들 */}
                <section className="lg:col-span-6 space-y-8">
                    <div className="bg-white p-10 rounded-[56px] border border-slate-100 h-64 flex flex-col justify-center items-center text-center">
                        <p className="text-slate-300 font-black italic tracking-widest text-xs uppercase">Analysis Data Mapping Space</p>
                        <h4 className="text-slate-200 text-3xl font-black mt-4">매물 비교 데이터 대기 중</h4>
                    </div>
                    <div className="bg-white p-10 rounded-[56px] border border-slate-100 h-96 flex flex-col justify-center items-center text-center">
                        <p className="text-slate-300 font-black italic tracking-widest text-xs uppercase">Past Trend Graph Space</p>
                        <h4 className="text-slate-200 text-3xl font-black mt-4">시세 추이 데이터 대기 중</h4>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default CustomerServicePage;