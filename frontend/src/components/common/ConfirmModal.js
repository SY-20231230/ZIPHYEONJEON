import React from 'react';

/**
 * [ConfirmModal Component]
 * 작성일: 2026. 04. 29
 * 역할: 브라우저 기본 window.confirm을 대체하는 전문 다이얼로그
 */
const ConfirmModal = ({ 
    isOpen, 
    title, 
    message, 
    confirmText = "확인", 
    cancelText = "취소", 
    onConfirm, 
    onCancel,
    type = "primary" // primary (blue), danger (rose)
}) => {
    // 💡 모달이 닫혀있으면 아무것도 렌더링하지 않음
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
            {/* 1. Backdrop: 배경 블러 처리 및 클릭 시 닫기 */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fadeIn"
                onClick={onCancel}
            ></div>

            {/* 2. Modal Body: 물리적 가속도가 적용된 애니메이션 슬롯 */}
            <div className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 animate-modalUp">
                {/* 아이콘 섹션 */}
                <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl shadow-inner ${
                        type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-600'
                    }`}>
                        {type === 'danger' ? '⚠️' : '🔔'}
                    </div>
                </div>

                {/* 텍스트 섹션 */}
                <div className="text-center mb-10">
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>

                {/* 버튼 그룹: 04.29 디자인 가이드 반영 */}
                <div className="flex gap-3">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-xs rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className={`flex-1 py-4 text-white font-black text-xs rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest ${
                            type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-900/20' : 'bg-[#002855] hover:bg-blue-600 shadow-blue-900/20'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;