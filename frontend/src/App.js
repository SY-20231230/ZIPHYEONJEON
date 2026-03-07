import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Ziphyeonjeon from "./Ziphyeonjeon"
import Login from "./common/Login";
import Registration from "./common/Registration";
import Chatbot from "./Chatbot/Chatbot";

import RiskAnalysis from "./RiskAnalysis/RiskAnalysis";
import RiskReport from "./RiskAnalysis/RiskReport";
import Loan from "./LoanRecommendation/Loan";
import LoanList from "./LoanRecommendation/LoanList";
import LoanCompare from "./LoanRecommendation/LoanCompare";
import LoanDetail from "./LoanRecommendation/LoanDetail";
import PriceSearch from "./PriceSearch/PriceSearch";

// router 설정 페이지입니다. 라우터 연결만!!

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Ziphyeonjeon />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registration" element={<Registration />} />

                {/* Risk Analysis */}
                <Route path="/risk/analysis" element={<RiskAnalysis />} />
                <Route path="/risk/report" element={<RiskReport />} />

                {/* Loan Recommendation */}
                <Route path="/loan" element={<Loan />} />
                <Route path="/loan/list" element={<LoanList />} />
                <Route path="/loan/compare" element={<LoanCompare />} />
                <Route path="/loan/detail/:snq" element={<LoanDetail />} />

                <Route path="/price-search" element={<PriceSearch />} />

            </Routes>
            <Chatbot />
        </BrowserRouter>
    );
}

export default App;