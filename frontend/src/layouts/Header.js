import React from 'react';
import { IoCodeSlash } from "react-icons/io5";
import '../Ziphyeonjeon.css';

const Header = () => {
    const navItems = [
        {
            label: '서비스 소개',
            link: '#',
            children: [
                { label: '서비스 개요', link: '#' },
                { label: '주요 기능', link: '#' }
            ]
        },
        {
            label: '공통',
            link: '#',
            children: [
                { label: 'Login', link: '/login' },
                { label: 'Registration', link: '/registration' }
            ]
        },
        {
            label: '위험 분석',
            link: '/risk/analysis',
            children: [
                { label: '종합 분석', link: '/risk/analysis' },
                { label: '리포트(분석필요)', link: '/risk/report' }
            ]
        },
        {
            label: '대출 추천',
            link: '/loan',
            children: [
                { label: '대출', link: '/loan' },
                { label: '대출 목록', link: '/loan/list' },
                { label: '대출 비교', link: '/loan/compare' },
                { label: '대출 상세', link: '/loan/detail' }
            ]
        },
        {
            label: '시세 조회',
            link: '/price-search',
            children: [
                { label: '통합 시세 조회', link: '/price-search' }
            ]
        }
    ];

    return (
        <header className="header">
            <div className="container header-content">
                <div className="logo-area"><a className="logo_link" href={`/`}>
                    <span className="material-symbols-outlined">
                        <img className="logo"
                            src={`/img/Logo_cropZIPHYEONJEONv1.png`}
                            alt={`Logo_ZIPHYEONJEONv1`}
                            style={{ height: '40px', width: 'auto' }}
                        />
                    </span>
                    집현전
                </a></div>

                {/* 내비게이션바 드랍다운*/}
                <nav className="nav-links">
                    {navItems.map((item, index) => (
                        <div key={index} className="nav-item dropdown">
                            <a href={item.link} className="nav-link">
                                {item.label}
                            </a>
                            {item.children && (
                                <div className="dropdown-menu">
                                    {item.children.map((child, childIndex) => (
                                        <a key={childIndex} href={child.link} className="dropdown-item">
                                            {child.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="header-buttons">
                    <a href="https://www.erdcloud.com/d/wHBL6BcoxjcspCNEt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-erd">
                        <span className="material-symbols-outlined"><IoCodeSlash /></span>
                        ERD
                    </a>
                    <a href="https://github.com/Jih00nJung/ZIPHYEONJEON.git"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-github">
                        Github
                    </a>
                </div>
            </div>
        </header>
    );
};

export default Header;
