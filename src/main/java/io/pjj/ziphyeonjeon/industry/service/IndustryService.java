package io.pjj.ziphyeonjeon.industry.service;

import io.pjj.ziphyeonjeon.industry.entity.Industry;
import io.pjj.ziphyeonjeon.industry.repository.IndustryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IndustryService {

    private final IndustryRepository industryRepository;

    @Transactional
    public void syncLocalCsv() {
        String filePath = "D:\\dev\\JAVA_project\\ZIPHYEONJEON\\src\\main\\resources\\common\\서울시 상권분석서비스(점포-행정동).csv";
        long startTime = System.currentTimeMillis();

        if (industryRepository.count() > 0) {
            log.info("Industry table already has data. Deleting existing data before sync.");
            industryRepository.deleteAllInBatch();
        }

        List<Industry> batch = new ArrayList<>();
        
        try (Reader reader = Files.newBufferedReader(Paths.get(filePath), StandardCharsets.UTF_8);
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {

            int totalCount = 0;

            for (CSVRecord record : csvParser) {
                String yyqu = record.get("기준_년분기_코드");
                String adstrdCd = record.get("행정동_코드");
                String sggCd = (adstrdCd != null && adstrdCd.length() >= 5) ? adstrdCd.substring(0, 5) : null;

                Industry industry = Industry.builder()
                        .referenceDate(parseReferenceDate(yyqu))
                        .sggCd(sggCd)
                        .adstrdCd(adstrdCd)
                        .adstrdNm(record.get("행정동_코드_명"))
                        .svcIndutyCd(record.get("서비스_업종_코드"))
                        .svcIndutyNm(record.get("서비스_업종_코드_명"))
                        .shopCount(parseInteger(record.get("점포_수")))
                        .similarIndutyShopCount(parseInteger(record.get("유사_업종_점포_수")))
                        .opbizRt(parseDouble(record.get("개업_율")))
                        .opbizShopCount(parseInteger(record.get("개업_점포_수")))
                        .clsbizRt(parseDouble(record.get("폐업_률")))
                        .clsbizShopCount(parseInteger(record.get("폐업_점포_수")))
                        .frcShopCount(parseInteger(record.get("프랜차이즈_점포_수")))
                        .build();

                batch.add(industry);
                totalCount++;

                if (batch.size() >= 1000) {
                    industryRepository.batchInsert(batch);
                    batch.clear();
                }
            }

            if (!batch.isEmpty()) {
                industryRepository.batchInsert(batch);
            }

            long endTime = System.currentTimeMillis();
            log.info("CSV bulk insert 완료. 전체: {} rows. 시간: {} ms", totalCount, (endTime - startTime));

        } catch (Exception e) {
            log.error("Error during CSV parsing and syncing", e);
            throw new RuntimeException("Failed to sync CSV data", e);
        }
    }

    private Timestamp parseReferenceDate(String yyqu) {
        if (yyqu == null || yyqu.length() < 5) return null;
        try {
            int year = Integer.parseInt(yyqu.substring(0, 4));
            int quarter = Integer.parseInt(yyqu.substring(4, 5));
            int month = (quarter - 1) * 3 + 1; // Q1=1, Q2=4, Q3=7, Q4=10
            LocalDate date = LocalDate.of(year, month, 1);
            return Timestamp.valueOf(date.atStartOfDay());
        } catch (Exception e) {
            return null;
        }
    }

    private Integer parseInteger(String str) {
        if (str == null || str.trim().isEmpty() || str.equals("?")) return null;
        try {
            return Integer.parseInt(str.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private Double parseDouble(String str) {
        if (str == null || str.trim().isEmpty() || str.equals("?")) return null;
        try {
            return Double.parseDouble(str.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
