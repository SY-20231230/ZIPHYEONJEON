package io.pjj.ziphyeonjeon.RiskAnalysis.service;

import io.pjj.ziphyeonjeon.RiskAnalysis.dto.OcrDTO;
import io.pjj.ziphyeonjeon.RiskAnalysis.entity.AnalysisTargetDoc;
import io.pjj.ziphyeonjeon.RiskAnalysis.entity.Users;
import io.pjj.ziphyeonjeon.RiskAnalysis.repository.RiskUploadRepository;
import io.pjj.ziphyeonjeon.global.API.ApiNaverOcr;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class RiskOcrService {

    @PersistenceContext
    private EntityManager em;

    // 파일 업로드 경로
    private final String UPLOAD_PATH = Paths.get(System.getProperty("user.dir"), "src", "main", "resources", "uploads").toString();

    // 정규표현식
    // 표\s*제\s*부 : '표제부' 사이에 공백(\s*)이 몇 개든 찾음
    // .*?기\s*타\s*사\s*항 : 각 부 뒤에 '기타사항' 이후부터 찾음
    // [^가-힣a-zA-Z0-9]* : 문자와 숫자만 가져옴
    // (.*?) : 아무 문자나 모든 문자열, group(1)으로 가져옴
    // (?=갑\s*구|을\s*구|이\s*하\s*여\s*백|$) : 조건만 확인, 다음 섹션이나 '이하 여백'이 나오면 멈춤
    private static final String[] SECTION_REGEX = {
            "표\\s*제\\s*부.*?기\\s*타\\s*사\\s*항[^가-힣a-zA-Z0-9]*(.*?)(?=갑\\s*구|을\\s*구|이\\s*하\\s*여\\s*백|$)",
            "갑\\s*구.*?기\\s*타\\s*사\\s*항[^가-힣a-zA-Z0-9]*(.*?)(?=을\\s*구|이\\s*하\\s*여\\s*백|$)",
            "을\\s*구.*?기\\s*타\\s*사\\s*항[^가-힣a-zA-Z0-9]*(.*?)(?=이\\s*하\\s*여\\s*백|$)"
    };

    private static final Logger log = LoggerFactory.getLogger(RiskOcrService.class);

    private final ApiNaverOcr apiNaverOcr;
    private final ObjectMapper objectMapper;
    private final RiskUploadRepository riskUploadRepository;

    public RiskOcrService(ApiNaverOcr apiNaverOcr, ObjectMapper objectMapper, RiskUploadRepository riskUploadRepository) {
        this.apiNaverOcr = apiNaverOcr;
        this.objectMapper = objectMapper;
        this.riskUploadRepository = riskUploadRepository;
    }

    // 파일 업로드
    @Transactional
    public String saveFile(String address, String requestId, MultipartFile file) throws IOException {
        File directory = new File(UPLOAD_PATH);
        if (!directory.exists()) directory.mkdirs();

        String originalName = file.getOriginalFilename();
        String saveName = requestId + "_" + originalName;
        Path targetPath = Paths.get(UPLOAD_PATH, saveName);
        file.transferTo(targetPath);

        Users tempUser = em.getReference(Users.class, 1L);

        AnalysisTargetDoc targetDoc = new AnalysisTargetDoc(tempUser, address, saveName);
        riskUploadRepository.save(targetDoc);

        return saveName;
    }

    // OCR API
    public OcrDTO requestOcrApi(String message, MultipartFile file) {
        try {
            String rawJson = apiNaverOcr.callNaverOcr(message, file);
            String fullText = mergeTextFromJson(rawJson);
            List<String> extractedSections = extractRegex(fullText);

            return new OcrDTO(extractedSections, rawJson);
        } catch (Exception e) {
            log.error("OCR 분석 과정 중 오류 발생", e);
            throw new RuntimeException("OCR 분석 실패: " + e.getMessage());
        }
    }

    // 전체 텍스트 합치기
    private String mergeTextFromJson(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            JsonNode fields = root.path("images").get(0).path("fields");

            StringBuilder sb = new StringBuilder();
            for (JsonNode field : fields) {
                sb.append(field.path("inferText").asText("")).append(" ");
            }
            return sb.toString().trim();
        } catch (Exception e) {
            log.error("JSON에서 텍스트 추출 실패", e);
            throw new RuntimeException("JSON 파싱 오류");
        }
    }

    // 정규식으로 텍스트 추출
    private List<String> extractRegex(String fullText) {
        List<String> extracted = new ArrayList<>();
        for (String regex : SECTION_REGEX) {
            extracted.add(findMatch(fullText, regex));
        }
        return extracted;
    }

    // 정규식 매칭
    private String findMatch(String text, String regex) {
        Pattern pattern = Pattern.compile(regex, Pattern.DOTALL);
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            return matcher.group(1).trim().replaceFirst("^[^가-힣a-zA-Z0-9]*", "");
        }
        return "데이터를 찾을 수 없음";
    }
}