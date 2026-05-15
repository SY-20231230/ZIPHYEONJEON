import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CommercialSubNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const tabs = [
        { name: '임대료 조회', path: '/search/commercial/rent' },
        { name: '유동인구 분석', path: '/search/commercial/population' },
        { name: '지역별 업황', path: '/search/commercial/industry' },
    ];

    return (
        <div className="flex space-x-2 bg-slate-200/50 p-1.5 rounded-2xl mb-8 w-max">
            {tabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                return (
                    <button
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        className={`px-6 py-3 rounded-xl font-black text-[15px] transition-all duration-300 flex items-center gap-2 ${
                            isActive 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                        }`}
                    >
                        {tab.name}
                    </button>
                );
            })}
        </div>
    );
};

export default CommercialSubNav;
