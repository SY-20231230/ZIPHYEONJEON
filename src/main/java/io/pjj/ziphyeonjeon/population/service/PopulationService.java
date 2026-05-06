package io.pjj.ziphyeonjeon.population.service;

import io.pjj.ziphyeonjeon.population.entity.Population;
import io.pjj.ziphyeonjeon.population.repository.PopulationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class PopulationService {

    private final PopulationRepository populationRepository;
    private static final String DIR_PATH = "D:\\dev\\JAVA_project\\ZIPHYEONJEON\\src\\main\\resources\\common\\local_people";

    public void syncLocalCsvFiles() {
        long totalStartTime = System.currentTimeMillis();
        Path dirPath = Paths.get(DIR_PATH);

        if (!Files.exists(dirPath) || !Files.isDirectory(dirPath)) {
            log.error("Directory does not exist: {}", DIR_PATH);
            return;
        }

        try (Stream<Path> paths = Files.list(dirPath)) {
            paths.filter(path -> path.toString().endsWith(".csv"))
                 .forEach(this::processCsvFile);
            
            long totalEndTime = System.currentTimeMillis();
            log.info("CSV files 저장 완료. 시간: {} ms", (totalEndTime - totalStartTime));
        } catch (Exception e) {
            log.error("Error while reading directory: {}", DIR_PATH, e);
            throw new RuntimeException("Failed to scan population CSV directory", e);
        }
    }

    private void processCsvFile(Path filePath) {
        log.info("Start processing file: {}", filePath.getFileName());
        long startTime = System.currentTimeMillis();
        int recordCount = 0;
        List<Population> batch = new ArrayList<>();

        try (BufferedReader reader = Files.newBufferedReader(filePath, StandardCharsets.UTF_8);
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {

            for (CSVRecord record : csvParser) {
                // columns: 기준일ID(0), 시간대구분(1), 행정동코드(2), 총생활인구수(3)
                String dateStr = record.get(0);
                String hourStr = record.get(1);
                String adstrdCd = record.get(2);
                String popCountStr = record.get(3);

                String sido = (adstrdCd != null && adstrdCd.length() >= 2) ? adstrdCd.substring(0, 2) : null;
                String sigungu = (adstrdCd != null && adstrdCd.length() >= 5) ? adstrdCd.substring(0, 5) : null;

                Population population = Population.builder()
                        .referenceDate(parseReferenceDate(dateStr))
                        .hours(parseInteger(hourStr))
                        .populationCount(parseDouble(popCountStr))
                        .sido(sido)
                        .sigungu(sigungu)
                        .adstrdCd(adstrdCd)
                        .build();

                batch.add(population);
                recordCount++;

                if (batch.size() >= 5000) {
                    populationRepository.batchInsert(batch);
                    batch.clear();
                }
            }

            if (!batch.isEmpty()) {
                populationRepository.batchInsert(batch);
            }

            long endTime = System.currentTimeMillis();
            log.info("Finished processing file: {}. Total {} rows inserted. Time taken: {} ms", 
                    filePath.getFileName(), recordCount, (endTime - startTime));

        } catch (Exception e) {
            log.error("Error parsing CSV file: {}", filePath.getFileName(), e);
            throw new RuntimeException("Failed to process CSV file", e);
        }
    }

    private Timestamp parseReferenceDate(String dateStr) {
        if (dateStr == null || dateStr.trim().length() != 8) return null;
        try {
            LocalDate date = LocalDate.parse(dateStr.trim(), DateTimeFormatter.ofPattern("yyyyMMdd"));
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
