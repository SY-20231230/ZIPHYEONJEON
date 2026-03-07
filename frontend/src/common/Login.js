import React, { useState } from 'react';
import './Login.css';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import SocialDivider from '../components/common/SocialDivider';

/**
 * LoginPage Component
 * 사용자 로그인 인터페이스 제공 (컴포넌트 기반 리팩토링)
 */
const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <MainLayout>
            <div className="login-page-container">
                <div className="login-wrapper">
                    <Card glass={true} padding="32px 48px">
                        <header className="card-header-v2">
                            <h2>Welcome Back</h2>
                            <p>계정에 로그인하여 안전한 분석을 시작하세요.</p>
                        </header>

                        <form className="login-form-v2">
                            <Input
                                label="Email / ID"
                                id="email"
                                placeholder="example@email.com"
                                icon="mail"
                                autoComplete="email"
                            />

                            <Input
                                label="Password"
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                icon="lock"
                                autoComplete="current-password"
                                rightElement={
                                    <button
                                        type="button"
                                        className="toggle-password-v2"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                }
                            />

                            <div className="form-options-v2">
                                <label className="custom-checkbox-v2">
                                    <input type="checkbox" className="hidden-checkbox-v2" />
                                    <span className="check-box-ui"><span className="material-symbols-outlined">check</span></span>
                                    <span className="label-text">로그인 상태 유지</span>
                                </label>
                                <a href="/forgot-password" className="forgot-password-v2">비밀번호 찾기</a>
                            </div>

                            <Button variant="primary" size="lg" fullWidth type="submit">
                                로그인하기
                            </Button>
                        </form>

                        <div className="signup-link-v2">
                            <p>계정이 없으신가요? <a href="/registration">회원가입</a></p>
                        </div>

                        <SocialDivider>Social Login</SocialDivider>

                        <div className="social-login-grid-v2">
                            <Button variant="outline" fullWidth icon="chat_bubble" className="btn-kakao-v2">카카오</Button>
                            <Button variant="outline" fullWidth icon="grid_view" className="btn-naver-v2">네이버</Button>
                        </div>
                    </Card>

                    <footer className="login-footer-v2">
                        <p>© 2024 Jiphyeonjeon Team. All rights reserved.</p>
                        <div className="footer-links-v2">
                            <a href="/privacy">Privacy Policy</a>
                            <a href="/terms">Terms of Service</a>
                        </div>
                    </footer>
                </div>
            </div>
        </MainLayout>
    );
};

export default LoginPage;