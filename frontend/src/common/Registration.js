import React, { useState } from 'react';
import './Registration.css';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import SocialDivider from '../components/common/SocialDivider';

const SignupPage = () => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <MainLayout>
            <div className="signup-page-container">
                <main className="signup-main">
                    <div className="form-card-container">
                        <Card glass padding="48px">
                            <header className="card-header">
                                <h2>계정 만들기</h2>
                                <p>집현전과 함께 안전한 부동산 거래를 시작하세요.</p>
                            </header>

                            {/* 가입 단계 표시 */}
                            <div className="stepper-v2">
                                <div className="step-unit-v2 active">
                                    <div className="step-num">1</div>
                                    <span className="step-txt">정보 입력</span>
                                </div>
                                <div className="step-line-v2"></div>
                                <div className="step-unit-v2">
                                    <div className="step-num">2</div>
                                    <span className="step-txt">본인 인증</span>
                                </div>
                                <div className="step-line-v2"></div>
                                <div className="step-unit-v2">
                                    <div className="step-num">3</div>
                                    <span className="step-txt">약관 동의</span>
                                </div>
                            </div>

                            <form className="signup-form-v2">
                                <div className="input-stack-v2">
                                    <Input label="이름" id="fullName" placeholder="성함을 입력해주세요" icon="person" />
                                    <Input label="이메일 주소" id="email" type="email" placeholder="example@email.com" icon="mail" />
                                    <Input
                                        label="비밀번호"
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="8자 이상의 영문, 숫자 조합"
                                        icon="lock"
                                        rightElement={
                                            <button type="button" className="eye-btn-v2" onClick={() => setShowPassword(!showPassword)}>
                                                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                            </button>
                                        }
                                    />
                                </div>

                                <Button variant="dark" size="lg" fullWidth className="mt-24">다음 단계로</Button>

                                <SocialDivider>또는 소셜 계정으로 가입</SocialDivider>

                                <div className="social-grid-v2">
                                    <Button variant="outline" fullWidth icon="chat_bubble" className="btn-kakao-v2">Kakao</Button>
                                    <Button variant="outline" fullWidth icon="grid_view" className="btn-google-v2">Google</Button>
                                </div>

                                <div className="terms-section-v2">
                                    <div className="terms-header-v2">
                                        <h3>서비스 이용 동의</h3>
                                        <label className="all-check-v2">
                                            <input type="checkbox" className="hidden-check-v2" />
                                            <span className="check-box-v2"><span className="material-symbols-outlined">check</span></span>
                                            <span>전체 동의</span>
                                        </label>
                                    </div>
                                    <div className="terms-list-v2">
                                        <div className="term-item-v2"><div className="dot-v2"></div> 서비스 이용약관 동의 (필수)</div>
                                        <div className="term-item-v2"><div className="dot-v2"></div> 개인정보 수집 및 이용 동의 (필수)</div>
                                        <div className="term-item-v2"><div className="dot-v2"></div> 마케팅 정보 수신 동의 (선택)</div>
                                    </div>
                                </div>
                            </form>
                        </Card>

                        <div className="login-prompt-v2">
                            계정이 이미 있으신가요? <a href="/login">로그인</a>
                        </div>

                        <div className="security-badges-v2">
                            <SecurityBadge icon="encrypted" label="데이터 암호화" color="blue" />
                            <SecurityBadge icon="verified_user" label="안전한 보안 접속" color="green" />
                            <SecurityBadge icon="policy" label="개인정보 보호 정책" color="gray" />
                        </div>
                    </div>
                </main>

                <footer className="footer-v2">
                    <p>© 2024 Jiphyeonjeon Team. All rights reserved.</p>
                    <div className="footer-nav-v2">
                        <a href="/privacy">개인정보처리방침</a>
                        <a href="/terms">이용약관</a>
                        <a href="/support">고객지원</a>
                    </div>
                </footer>
            </div>
        </MainLayout>
    );
};

const SecurityBadge = ({ icon, label, color }) => (
    <div className="badge-v2">
        <div className={`badge-icon-v2 ${color}`}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span>{label}</span>
    </div>
);

export default SignupPage;