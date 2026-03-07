import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

// 챗봇 귀여운 아이콘 (SVG)
const RobotIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 12 2zm3 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-6 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 3h6v1.5a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5V16z" fill="white" />
    </svg>
);

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: '안녕하세요! 집현전의 똑똑한 AI 공인중개사입니다. 부동산 계약이나 현장 임장 등 궁금한 점이 있다면 무엇이든 물어보세요! 🤖' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const presetQuestions = [
        "전세계약 시 꼭 확인점",
        "매매계약 시 꼭 확인점",
        "월세계약 시 꼭 확인점",
        "매물 임장(방문) 체크리스트"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (text) => {
        if (!text.trim()) return;

        // Add User Message
        const newMessages = [...messages, { sender: 'user', text }];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            // Call Spring Boot API
            const response = await axios.post('/api/chat', { message: text });
            const botReply = response.data.reply;
            setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: '앗! 통신 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage(inputValue);
        }
    };

    const renderTextWithLineBreaks = (text) => {
        return text.split('\n').map((str, idx) => (
            <React.Fragment key={idx}>
                {str}
                <br />
            </React.Fragment>
        ));
    };

    return (
        <div className="chatbot-container">
            {/* Floating Button */}
            <button className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '✕' : <RobotIcon />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <RobotIcon />
                        <span className="chatbot-title">집현전 AI 중개사</span>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-bubble-wrapper ${msg.sender === 'user' ? 'user-wrapper' : 'bot-wrapper'}`}>
                                <div className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                                    {renderTextWithLineBreaks(msg.text)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-bubble-wrapper bot-wrapper">
                                <div className="chat-bubble bot-bubble loading-dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbot-presets">
                        {presetQuestions.map((q, idx) => (
                            <button key={idx} onClick={() => handleSendMessage(q)} className="preset-btn">
                                {q}
                            </button>
                        ))}
                    </div>

                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            placeholder="질문을 입력해주세요..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button onClick={() => handleSendMessage(inputValue)} disabled={isLoading || !inputValue.trim()}>
                            전송
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
