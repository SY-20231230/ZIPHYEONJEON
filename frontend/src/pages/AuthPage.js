import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login: authLogin, signup: authSignup } = useAuth();

    const [mode, setMode] = useState('login');
    const [scrollPercent, setScrollPercent] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const from = location.state?.from?.pathname || "/main";

    // 💡 1. 백엔드 DTO(SignupRequest)와 100% 일치하도록 필드 구성
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        userName: '', 
        creditScore: 0,
        familyType: '1인 가구', // 초기값 설정
        incomeLevel: '중'       // 💡 백엔드 필수 필드 추가
    });

    useEffect(() => {
        const handleScroll = () => {
            const winHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            setScrollPercent((window.scrollY / winHeight) * 100);
            document.querySelectorAll('.reveal').forEach(el => {
                if (el.getBoundingClientRect().top < window.innerHeight - 100) el.classList.add('active');
            });
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ 
            ...formData, 
            [name]: name === 'creditScore' ? Number(value) : value // 숫자형 변환 처리
        });
        if (errorMsg) setErrorMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            // 💡 2. 전송 직전 데이터를 콘솔에 찍어 확인합니다. (F12에서 확인 가능)
            console.log("🚀 백엔드로 전송 시도 데이터:", formData);

            if (mode === 'login') {
                const result = await authLogin(formData.email, formData.password);
                if (result.success) {
                    navigate(from, { replace: true });
                } else {
                    setErrorMsg(result.message);
                }
            } else {
                const result = await authSignup(formData);
                if (result.success) {
                    alert('권한 신청이 완료되었습니다. 승인 후 로그인 가능합니다.');
                    setMode('login');
                } else {
                    setErrorMsg(result.message);
                }
            }
        } catch (error) {
            // 💡 3. 여기가 핵심! 브라우저 F12 Console에 진짜 에러가 찍힙니다.
            console.error("🔥 [통신 실패] 상세 에러:", error);
            setErrorMsg("시스템 통신 오류가 발생했습니다. (F12 콘솔을 확인하세요)");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen font-sans bg-white text-slate-900">
            <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-700 to-cyan-500 z-50 transition-all duration-100" style={{ width: `${scrollPercent}%` }}></div>

            {/* [좌측 패널] - 기존 디자인 유지 */}
            <main className="lg:w-7/12 xl:w-8/12 bg-white relative overflow-y-auto">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />
                </div>

                <section className="relative z-10 p-12 lg:p-16 space-y-20">
                    <div className="reveal space-y-0">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-black rounded-full border border-blue-200 tracking-widest uppercase mb-7">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            2026.04.28 Ver. 9.0 — Live
                        </span>
                        <h1 className="text-8xl font-black tracking-tighter text-slate-900 leading-[0.88] mb-0">
                            집현전<br />
                            <span className="text-slate-200">ZIPHYEONJEON</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium max-w-lg leading-relaxed mt-6">
                            대한민국 모든 실거래가 데이터를{' '}
                            <span className="text-blue-600 font-bold">AI 엔진으로 실시간 분석</span>합니다.
                        </p>
                    </div>

                    {/* 대시보드 미리보기 등 기존 디자인 생략 (동규님 코드 그대로 사용) */}
                    <div className="reveal flex items-center justify-between border-t border-slate-100 pt-7 pb-8">
                        <span className="text-sm font-black text-slate-300 tracking-widest uppercase">Ziphyeonjeon · 집현전</span>
                    </div>
                </section>
            </main>

            {/* [우측 패널] - 스티키 인증 영역 */}
            <aside className="lg:w-5/12 xl:w-4/12 bg-[#0F172A] lg:sticky lg:top-0 lg:h-screen flex items-center justify-center p-8 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="w-full max-w-[420px] relative z-10">
                    <div className="bg-white/5 backdrop-blur-xl p-10 lg:p-12 rounded-[56px] border border-white/10 shadow-2xl">
                        <div className="flex bg-white/5 p-1.5 rounded-[24px] mb-12">
                            <button onClick={() => setMode('login')} className={`flex-1 py-4 rounded-[20px] text-sm font-black transition-all ${mode === 'login' ? 'bg-white text-[#001A3D]' : 'text-slate-500 hover:text-slate-300'}`}>로그인</button>
                            <button onClick={() => setMode('signup')} className={`flex-1 py-4 rounded-[20px] text-sm font-black transition-all ${mode === 'signup' ? 'bg-white text-[#001A3D]' : 'text-slate-500 hover:text-slate-300'}`}>회원가입</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tighter">{mode === 'login' ? '보안 인증' : '신규 권한 신청'}</h3>
                                {errorMsg && <p className="text-red-400 text-xs font-bold mt-2 animate-pulse">⚠ {errorMsg}</p>}
                            </div>

                            <div className="space-y-4">
                                <input name="email" type="email" placeholder="Access Email" required className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-medium" onChange={handleChange} />
                                <input name="password" type="password" placeholder="Passkey" required className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-medium" onChange={handleChange} />
                                
                                {mode === 'signup' && (
                                    <>
                                        <input name="userName" placeholder="Full Name" required className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-medium" onChange={handleChange} />
                                        <input name="creditScore" type="number" placeholder="Credit Score (e.g. 750)" className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none font-medium" onChange={handleChange} />
                                        
                                        <select name="familyType" className="w-full px-8 py-5 bg-[#1e293b] border border-white/10 rounded-2xl text-white outline-none" onChange={handleChange} value={formData.familyType}>
                                            <option value="1인 가구">1인 가구</option>
                                            <option value="2인 가구">2인 가구</option>
                                            <option value="다자녀 가구">다자녀 가구</option>
                                        </select>

                                        {/* 💡 4. 소득 수준 필드 추가 (백엔드 필수값) */}
                                        <select name="incomeLevel" className="w-full px-8 py-5 bg-[#1e293b] border border-white/10 rounded-2xl text-white outline-none" onChange={handleChange} value={formData.incomeLevel}>
                                            <option value="상">소득 수준: 상</option>
                                            <option value="중">소득 수준: 중</option>
                                            <option value="하">소득 수준: 하</option>
                                        </select>
                                    </>
                                )}
                            </div>

                            <button type="submit" disabled={isLoading} className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-lg ${isLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-900/40 hover:bg-blue-500 hover:-translate-y-1'}`}>
                                {isLoading ? "처리 중..." : (mode === 'login' ? '시스템 접속하기' : '가입 심사 요청')}
                            </button>
                        </form>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default AuthPage;