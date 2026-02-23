package io.pjj.ziphyeonjeon.batch.molit;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.File;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.file.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static io.pjj.ziphyeonjeon.batch.molit.MolitCsvUtils.*;

@Service
@RequiredArgsConstructor
public class MolitAptCsvIngestService {

    private final MolitAptSaleRawRepository saleRepo;
    private final MolitAptRentRawRepository rentRepo;
    private final MolitVillaRentRawRepository villaRentRepo;
    private final MolitVillaSaleRawRepository villaSaleRepo;
    private final MolitOfficetelRentRawRepository officetelRentRepo;
    private final MolitOfficetelSaleRawRepository officetelSaleRepo;

    @Value("${molit.ingest.root:data/molit}")
    private String ingestRoot;

    private static final Pattern YEAR_PATTERN = Pattern.compile(".*[\\\\/](\\d{4})[\\\\/].*");
    private static final Pattern MONTH_PATTERN = Pattern.compile(".*[\\\\/](\\d{2})\\.csv$");

    public void ingestAllApt() throws Exception {
        Path root = Paths.get(ingestRoot);

        if (!Files.exists(root)) {
            throw new IllegalStateException("INGEST ROOT NOT FOUND: " + root.toAbsolutePath());
        }

        Files.walk(root)
                .filter(p -> p.toString().endsWith(".csv"))
                .filter(p -> {
                    String s = p.toString();
                    // 아파트, 빌라, 오피스텔 모두 포함
                    return s.contains(File.separator + "apt" + File.separator) ||
                            s.contains(File.separator + "villa" + File.separator) ||
                            s.contains(File.separator + "officetel" + File.separator);
                })
                .forEach(p -> {
                    try {
                        String s = p.toString();
                        if (s.contains(File.separator + "villa" + File.separator)) {
                            if (s.contains(File.separator + "sale" + File.separator))
                                ingestVillaSale(p);
                            else if (s.contains(File.separator + "rent" + File.separator))
                                ingestVillaRent(p);
                        } else if (s.contains(File.separator + "officetel" + File.separator)) {
                            if (s.contains(File.separator + "sale" + File.separator))
                                ingestOfficetelSale(p);
                            else if (s.contains(File.separator + "rent" + File.separator))
                                ingestOfficetelRent(p);
                        } else if (s.contains(File.separator + "apt" + File.separator)) {
                            if (s.contains(File.separator + "sale" + File.separator))
                                ingestAptSale(p);
                            else if (s.contains(File.separator + "rent" + File.separator))
                                ingestAptRent(p);
                        }
                    } catch (Exception e) {
                        throw new RuntimeException("INGEST FAIL: " + p + " / " + e.getMessage(), e);
                    }
                });
    }

    // ... (helper methods like parseYear, parseMonth, openReader, findHeader remain
    // matching original if not shown here)

    // [New Methods for Villa/Officetel]

    private void ingestVillaSale(Path csvPath) throws Exception {
        int year = parseYear(csvPath);
        int month = parseMonth(csvPath);
        List<MolitVillaSaleRawEntity> batch = new ArrayList<>();
        int totalCount = 0;

        try (BufferedReader br = openReader(csvPath)) {
            Map<String, Integer> header = findHeader(br, "거래금액(만원)");
            if (header == null)
                throw new IllegalStateException("VILLA SALE HEADER NOT FOUND");

            String line;
            while ((line = br.readLine()) != null) {
                List<String> row = splitCsvLine(line);
                String no = row.size() > 0 ? row.get(0) : null;
                if (no == null || !no.trim().matches("\\d+"))
                    continue;

                MolitVillaSaleRawEntity e = new MolitVillaSaleRawEntity();
                e.setDataYear(year);
                e.setDataMonth(month);
                e.setSourceFile(csvPath.toString());

                e.setSigungu(get(header, row, "시군구"));
                e.setBeonji(get(header, row, "번지"));
                e.setBonbun(get(header, row, "본번"));
                e.setBubun(get(header, row, "부번"));
                e.setBuildingName(get(header, row, "건물명"));
                e.setExclArea(toDecimal(get(header, row, "전용면적(㎡)", "전용면적")));
                e.setLandRightArea(toDecimal(get(header, row, "대지권면적(㎡)", "대지권면적")));
                e.setContractYm(toInt(get(header, row, "계약년월")));
                e.setContractDay(toInt(get(header, row, "계약일")));
                e.setDealAmountMan(toLongAmount(get(header, row, "거래금액(만원)")));
                e.setFloorNo(toInt(get(header, row, "층")));
                e.setBuyerType(get(header, row, "매수자"));
                e.setSellerType(get(header, row, "매도자"));
                e.setBuiltYear(toInt(get(header, row, "건축년도")));
                e.setRoadName(get(header, row, "도로명"));
                e.setCancelReason(get(header, row, "해제사유발생일"));
                e.setDealType(get(header, row, "거래유형"));
                e.setBrokerLoc(get(header, row, "중개사소재지"));
                e.setRegDate(get(header, row, "등기일자"));

                batch.add(e);
                totalCount++;

                if (batch.size() >= 2000) {
                    villaSaleRepo.saveAll(batch);
                    batch.clear();
                    System.out.println("[MOLIT VILLA SALE] Processing " + csvPath.getFileName() + " ... " + totalCount
                            + " saved.");
                }
            }
        }
        if (!batch.isEmpty())
            villaSaleRepo.saveAll(batch);
    }

    private void ingestVillaRent(Path csvPath) throws Exception {
        int year = parseYear(csvPath);
        int month = parseMonth(csvPath);
        List<MolitVillaRentRawEntity> batch = new ArrayList<>();
        int totalCount = 0;

        try (BufferedReader br = openReader(csvPath)) {
            Map<String, Integer> header = findHeader(br, "보증금(만원)");
            if (header == null)
                header = findHeader(br, "보증금액(만원)");
            if (header == null)
                throw new IllegalStateException("VILLA RENT HEADER NOT FOUND");

            String line;
            while ((line = br.readLine()) != null) {
                List<String> row = splitCsvLine(line);
                String no = row.size() > 0 ? row.get(0) : null;
                if (no == null || !no.trim().matches("\\d+"))
                    continue;

                MolitVillaRentRawEntity e = new MolitVillaRentRawEntity();
                e.setDataYear(year);
                e.setDataMonth(month);
                e.setSourceFile(csvPath.toString());

                e.setSigungu(get(header, row, "시군구"));
                e.setBeonji(get(header, row, "번지"));
                e.setBonbun(get(header, row, "본번"));
                e.setBubun(get(header, row, "부번"));
                e.setBuildingName(get(header, row, "건물명"));
                String rentType = get(header, row, "전월세구분");
                if (rentType == null) {
                    Long monthly = toLongAmount(get(header, row, "월세(만원)", "월세금(만원)"));
                    rentType = (monthly != null && monthly > 0) ? "WOLSE" : "JEONSE";
                } else {
                    if (rentType.contains("월"))
                        rentType = "WOLSE";
                    else
                        rentType = "JEONSE";
                }
                e.setRentType(rentType);
                e.setExclArea(toDecimal(get(header, row, "전용면적(㎡)", "전용면적")));
                e.setContractYm(toInt(get(header, row, "계약년월")));
                e.setContractDay(toInt(get(header, row, "계약일")));
                e.setDepositMan(toLongAmount(get(header, row, "보증금(만원)", "보증금액(만원)")));
                e.setMonthlyRentMan(toLongAmount(get(header, row, "월세(만원)", "월세금(만원)")));
                e.setFloorNo(toInt(get(header, row, "층")));
                e.setBuiltYear(toInt(get(header, row, "건축년도")));
                e.setRoadName(get(header, row, "도로명"));
                e.setContractPeriod(get(header, row, "계약기간"));
                e.setContractType(get(header, row, "계약구분"));
                e.setRenewalReqRight(get(header, row, "갱신요구권사용"));
                e.setPrevContract(get(header, row, "종전계약")); // 원문 그대로
                e.setHouseType(get(header, row, "주택유형")); // 연립다세대 등

                batch.add(e);
                totalCount++;

                if (batch.size() >= 2000) {
                    villaRentRepo.saveAll(batch);
                    batch.clear();
                    System.out.println("[MOLIT VILLA RENT] Processing " + csvPath.getFileName() + " ... " + totalCount
                            + " saved.");
                }
            }
        }
        if (!batch.isEmpty())
            villaRentRepo.saveAll(batch);
    }

    private void ingestOfficetelSale(Path csvPath) throws Exception {
        int year = parseYear(csvPath);
        int month = parseMonth(csvPath);
        List<MolitOfficetelSaleRawEntity> batch = new ArrayList<>();
        int totalCount = 0;

        try (BufferedReader br = openReader(csvPath)) {
            Map<String, Integer> header = findHeader(br, "거래금액(만원)");
            if (header == null)
                throw new IllegalStateException("OFFICETEL SALE HEADER NOT FOUND");

            String line;
            while ((line = br.readLine()) != null) {
                List<String> row = splitCsvLine(line);
                String no = row.size() > 0 ? row.get(0) : null;
                if (no == null || !no.trim().matches("\\d+"))
                    continue;

                MolitOfficetelSaleRawEntity e = new MolitOfficetelSaleRawEntity();
                e.setDataYear(year);
                e.setDataMonth(month);
                e.setSourceFile(csvPath.toString());

                e.setSigungu(get(header, row, "시군구"));
                e.setBeonji(get(header, row, "번지"));
                e.setBonbun(get(header, row, "본번"));
                e.setBubun(get(header, row, "부번"));
                e.setComplexName(get(header, row, "단지명"));
                e.setExclArea(toDecimal(get(header, row, "전용면적(㎡)", "전용면적")));
                e.setContractYm(toInt(get(header, row, "계약년월")));
                e.setContractDay(toInt(get(header, row, "계약일")));
                e.setDealAmountMan(toLongAmount(get(header, row, "거래금액(만원)")));
                e.setFloorNo(toInt(get(header, row, "층")));
                e.setBuyerType(get(header, row, "매수자"));
                e.setSellerType(get(header, row, "매도자"));
                e.setBuiltYear(toInt(get(header, row, "건축년도")));
                e.setRoadName(get(header, row, "도로명"));
                e.setCancelReason(get(header, row, "해제사유발생일"));
                e.setDealType(get(header, row, "거래유형"));
                e.setBrokerLoc(get(header, row, "중개사소재지"));

                batch.add(e);
                totalCount++;

                if (batch.size() >= 2000) {
                    officetelSaleRepo.saveAll(batch);
                    batch.clear();
                    System.out.println("[MOLIT OFFICETEL SALE] Processing " + csvPath.getFileName() + " ... "
                            + totalCount + " saved.");
                }
            }
        }
        if (!batch.isEmpty())
            officetelSaleRepo.saveAll(batch);
    }

    private void ingestOfficetelRent(Path csvPath) throws Exception {
        int year = parseYear(csvPath);
        int month = parseMonth(csvPath);
        List<MolitOfficetelRentRawEntity> batch = new ArrayList<>();
        int totalCount = 0;

        try (BufferedReader br = openReader(csvPath)) {
            Map<String, Integer> header = findHeader(br, "보증금(만원)");
            if (header == null)
                header = findHeader(br, "보증금액(만원)");
            if (header == null)
                throw new IllegalStateException("OFFICETEL RENT HEADER NOT FOUND");

            String line;
            while ((line = br.readLine()) != null) {
                List<String> row = splitCsvLine(line);
                String no = row.size() > 0 ? row.get(0) : null;
                if (no == null || !no.trim().matches("\\d+"))
                    continue;

                MolitOfficetelRentRawEntity e = new MolitOfficetelRentRawEntity();
                e.setDataYear(year);
                e.setDataMonth(month);
                e.setSourceFile(csvPath.toString());

                e.setSigungu(get(header, row, "시군구"));
                e.setBeonji(get(header, row, "번지"));
                e.setBonbun(get(header, row, "본번"));
                e.setBubun(get(header, row, "부번"));
                e.setComplexName(get(header, row, "단지명"));
                String rentType = get(header, row, "전월세구분");
                if (rentType == null) {
                    Long monthly = toLongAmount(get(header, row, "월세(만원)", "월세금(만원)"));
                    rentType = (monthly != null && monthly > 0) ? "WOLSE" : "JEONSE";
                } else {
                    if (rentType.contains("월"))
                        rentType = "WOLSE";
                    else
                        rentType = "JEONSE";
                }
                e.setRentType(rentType);
                e.setExclArea(toDecimal(get(header, row, "전용면적(㎡)", "전용면적")));
                e.setContractYm(toInt(get(header, row, "계약년월")));
                e.setContractDay(toInt(get(header, row, "계약일")));
                e.setDepositMan(toLongAmount(get(header, row, "보증금(만원)", "보증금액(만원)")));
                e.setMonthlyRentMan(toLongAmount(get(header, row, "월세(만원)", "월세금(만원)")));
                e.setFloorNo(toInt(get(header, row, "층")));
                e.setBuiltYear(toInt(get(header, row, "건축년도")));
                e.setRoadName(get(header, row, "도로명"));
                e.setContractPeriod(get(header, row, "계약기간"));
                e.setContractType(get(header, row, "계약구분"));
                e.setRenewalReqRight(get(header, row, "갱신요구권사용"));
                e.setPrevContract(get(header, row, "종전계약"));
                e.setPrevMonthlyRentMan(toLongAmount(get(header, row, "종전월세(만원)", "종전월세금(만원)")));

                batch.add(e);
                totalCount++;

                if (batch.size() >= 2000) {
                    officetelRentRepo.saveAll(batch);
                    batch.clear();
                    System.out.println("[MOLIT OFFICETEL RENT] Processing " + csvPath.getFileName() + " ... "
                            + totalCount + " saved.");
                }
            }
        }
        if (!batch.isEmpty())
            officetelRentRepo.saveAll(batch);
    }

    private int parseYear(Path p) {
        Matcher m = YEAR_PATTERN.matcher(p.toString());
        if (m.matches())
            return Integer.parseInt(m.group(1));
        return 0;
    }

    private int parseMonth(Path p) {
        Matcher m = MONTH_PATTERN.matcher(p.toString());
        if (m.matches())
            return Integer.parseInt(m.group(1));
        return 0;
    }

    /** 어떤 인코딩인지 모르니 후보 인코딩으로 돌려서 header 찾히는 걸로 채택 */
    private BufferedReader openReader(Path p) throws Exception {
        byte[] bytes = Files.readAllBytes(p);

        for (Charset cs : CANDIDATE_CHARSETS) {
            try {
                return new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(bytes), cs));
            } catch (Exception ignore) {
            }
        }
        // 최후
        return Files.newBufferedReader(p, Charset.forName("UTF-8"));
    }

    /** 안내문 스킵하고 헤더 행 찾기 */
    private Map<String, Integer> findHeader(BufferedReader br, String requiredCol) throws Exception {
        String line;
        while ((line = br.readLine()) != null) {
            List<String> cols = splitCsvLine(line);
            if (cols.size() >= 5 && cols.contains(requiredCol)) {
                return buildHeaderIndex(cols);
            }
        }
        return null;
    }

    private void ingestAptSale(Path csvPath) throws Exception {
        int year = parseYear(csvPath);
        int month = parseMonth(csvPath);

        List<MolitAptSaleRawEntity> batch = new ArrayList<>();
        int totalCount = 0;

        try (BufferedReader br = openReader(csvPath)) {
            Map<String, Integer> header = findHeader(br, "거래금액(만원)");
            if (header == null) {
                throw new IllegalStateException("SALE HEADER NOT FOUND (거래금액(만원))");
            }

            String line;
            while ((line = br.readLine()) != null) {
                List<String> row = splitCsvLine(line);
                // 데이터 아닌 줄 스킵: NO가 숫자 아니면 패스
                String no = row.size() > 0 ? row.get(0) : null;
                if (no == null || !no.trim().matches("\\d+"))
                    continue;

                MolitAptSaleRawEntity e = new MolitAptSaleRawEntity();
                e.setDataYear(year);
                e.setDataMonth(month);
                e.setSourceFile(csvPath.toString());

                e.setSigungu(get(header, row, "시군구"));
                e.setJibun(get(header, row, "번지", "지번"));
                e.setBonbun(get(header, row, "본번"));
                e.setBubun(get(header, row, "부번"));
                e.setComplexName(get(header, row, "단지명"));
                e.setExclusiveAreaM2(toDecimal(get(header, row, "전용면적(㎡)", "전용면적")));
                e.setContractYyyymm(get(header, row, "계약년월"));
                e.setContractDay(toInt(get(header, row, "계약일")));
                e.setDealAmountMan(toLongAmount(get(header, row, "거래금액(만원)")));
                e.setFloorNo(toInt(get(header, row, "층")));
                e.setBuyerType(get(header, row, "매수자"));
                e.setSellerType(get(header, row, "매도자"));
                e.setBuiltYear(toInt(get(header, row, "건축년도")));
                e.setRoadName(get(header, row, "도로명"));

                e.setCancelDate(get(header, row, "해제사유발생일"));
                e.setDealType(get(header, row, "거래유형"));
                e.setBrokerLocation(get(header, row, "중개사소재지"));
                e.setRegistrationDate(get(header, row, "중개사소재지일자", "중개사소재지등록일"));

                batch.add(e);
                totalCount++;

                if (batch.size() >= 2000) {
                    saleRepo.saveAll(batch);
                    batch.clear();
                    System.out.println(
                            "[MOLIT SALE] Processing " + csvPath.getFileName() + " ... " + totalCount + " rows saved.");
                }
            }
        }

        if (!batch.isEmpty()) {
            saleRepo.saveAll(batch);
        }
    }

    private void ingestAptRent(Path csvPath) throws Exception {
        int year = parseYear(csvPath);
        int month = parseMonth(csvPath);

        List<MolitAptRentRawEntity> batch = new ArrayList<>();
        int totalCount = 0;

        try (BufferedReader br = openReader(csvPath)) {
            // 전월세는 보통 '보증금(만원)' 또는 '보증금액(만원)'이 있음
            Map<String, Integer> header = findHeader(br, "보증금(만원)");
            if (header == null)
                header = findHeader(br, "보증금액(만원)");
            if (header == null) {
                throw new IllegalStateException("RENT HEADER NOT FOUND (보증금(만원)/보증금액(만원))");
            }

            String line;
            while ((line = br.readLine()) != null) {
                List<String> row = splitCsvLine(line);
                String no = row.size() > 0 ? row.get(0) : null;
                if (no == null || !no.trim().matches("\\d+"))
                    continue;

                MolitAptRentRawEntity e = new MolitAptRentRawEntity();
                e.setDataYear(year);
                e.setDataMonth(month);
                e.setSourceFile(csvPath.toString());

                e.setSigungu(get(header, row, "시군구"));
                e.setJibun(get(header, row, "번지", "지번"));
                e.setBonbun(get(header, row, "본번"));
                e.setBubun(get(header, row, "부번"));
                e.setComplexName(get(header, row, "단지명"));
                e.setExclusiveAreaM2(toDecimal(get(header, row, "전용면적(㎡)", "전용면적")));
                e.setContractYyyymm(get(header, row, "계약년월"));
                e.setContractDay(toInt(get(header, row, "계약일")));
                e.setFloorNo(toInt(get(header, row, "층")));
                e.setBuiltYear(toInt(get(header, row, "건축년도")));
                e.setRoadName(get(header, row, "도로명"));

                Long deposit = toLongAmount(get(header, row, "보증금(만원)", "보증금액(만원)"));
                Long monthly = toLongAmount(get(header, row, "월세(만원)", "월세금(만원)"));

                e.setDepositMan(deposit);
                e.setMonthlyRentMan(monthly);

                // 월세가 0이면 전세로 보자(단, 파일에 '전월세구분' 컬럼이 있으면 그걸 우선)
                String rentType = get(header, row, "전월세구분", "임대구분");
                if (rentType == null) {
                    rentType = (monthly != null && monthly > 0) ? "WOLSE" : "JEONSE";
                } else {
                    // "전세"/"월세" 텍스트 대응
                    if (rentType.contains("월"))
                        rentType = "WOLSE";
                    else
                        rentType = "JEONSE";
                }
                e.setRentType(rentType);

                e.setCancelDate(get(header, row, "해제사유발생일"));
                e.setDealType(get(header, row, "거래유형"));
                e.setBrokerLocation(get(header, row, "중개사소재지"));

                // 갱신요구권/종전금액(있을 때만)
                e.setRenewalRightUsed(get(header, row, "갱신요구권사용", "갱신요구권"));
                e.setPrevDepositMan(toLongAmount(get(header, row, "종전보증금(만원)", "종전보증금액(만원)")));
                e.setPrevMonthlyRentMan(toLongAmount(get(header, row, "종전월세(만원)", "종전월세금(만원)")));

                batch.add(e);
                totalCount++;

                if (batch.size() >= 2000) {
                    rentRepo.saveAll(batch);
                    batch.clear();
                    System.out.println(
                            "[MOLIT RENT] Processing " + csvPath.getFileName() + " ... " + totalCount + " rows saved.");
                }
            }
        }

        if (!batch.isEmpty()) {
            rentRepo.saveAll(batch);
        }
    }
}
