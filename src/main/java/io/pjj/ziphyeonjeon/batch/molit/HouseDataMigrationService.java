package io.pjj.ziphyeonjeon.batch.molit;

import io.pjj.ziphyeonjeon.PriceSearch.entity.House;
import io.pjj.ziphyeonjeon.PriceSearch.repository.HouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HouseDataMigrationService {

    private final MolitAptSaleRawRepository aptSaleRepo;
    private final MolitAptRentRawRepository aptRentRepo;
    private final MolitVillaSaleRawRepository villaSaleRepo;
    private final MolitVillaRentRawRepository villaRentRepo;
    private final MolitOfficetelSaleRawRepository officetelSaleRepo;
    private final MolitOfficetelRentRawRepository officetelRentRepo;

    private final HouseRepository houseRepo;

    private static final int PAGE_SIZE = 10000;

    // @Transactional 어노테이션 제거: 전체를 하나의 트랜잭션으로 묶으면 메모리가 해제되지 않습니다.
    public void migrateAllDataToHouse() {
        log.info("=== Start Migrating RAW Data to HOUSE Table (All Years) ===");
        
        long totalAptSale = migrateAptSale();
        long totalAptRent = migrateAptRent();
        long totalVillaSale = migrateVillaSale();
        long totalVillaRent = migrateVillaRent();
        long totalOfficetelSale = migrateOfficetelSale();
        long totalOfficetelRent = migrateOfficetelRent();

        long total = totalAptSale + totalAptRent + totalVillaSale + totalVillaRent + totalOfficetelSale + totalOfficetelRent;
        log.info("=== Migration Complete! Total {} records migrated to HOUSE table ===", total);
    }

    private long migrateAptSale() {
        log.info("Migrating Apt Sale...");
        long count = 0;
        int page = 0;
        
        while (true) {
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<MolitAptSaleRawEntity> pageData = aptSaleRepo.findAll(pageable);
            if (pageData.isEmpty()) break;
            
            List<House> batch = new ArrayList<>();
            for (MolitAptSaleRawEntity raw : pageData) {
                House h = new House();
                h.setPropertyType("아파트");
                h.setDealType("매매");
                
                String[] locs = parseSigungu(raw.getSigungu(), raw.getEupmyeondong());
                h.setSido(locs[0]);
                h.setSigungu(locs[1]);
                h.setEmd(locs[2]);
                h.setRoadname(raw.getRoadName());
                h.setJibun(raw.getJibun());
                h.setBonbun(raw.getBonbun());
                h.setBubun(raw.getBubun());
                h.setArea(raw.getExclusiveAreaM2() != null ? new BigDecimal(raw.getExclusiveAreaM2().toString()) : null);
                h.setContractYm(raw.getContractYyyymm());
                h.setContractDay(raw.getContractDay() != null ? Integer.valueOf(raw.getContractDay()) : null);
                h.setTrade(raw.getDealAmountMan());
                h.setName(raw.getComplexName());
                h.setFloorNo(raw.getFloorNo() != null ? Integer.valueOf(raw.getFloorNo()) : null);
                h.setSourceTable("MOLIT_APT_SALE_RAW");
                h.setSourceRawId(raw.getId());

                batch.add(h);
                count++;
            }
            houseRepo.saveAll(batch);
            log.info("Apt Sale batch {} saved. Total: {}", page, count);
            page++;
        }
        log.info("Apt Sale Migrated: {}", count);
        return count;
    }

    private long migrateAptRent() {
        log.info("Migrating Apt Rent...");
        long count = 0;
        int page = 0;
        
        while (true) {
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<MolitAptRentRawEntity> pageData = aptRentRepo.findAll(pageable);
            if (pageData.isEmpty()) break;
            
            List<House> batch = new ArrayList<>();
            for (MolitAptRentRawEntity raw : pageData) {
                House h = new House();
                h.setPropertyType("아파트");
                long monthly = raw.getMonthlyRentMan() != null ? raw.getMonthlyRentMan() : 0L;
                h.setDealType(monthly > 0 ? "월세" : "전세");
                
                String[] locs = parseSigungu(raw.getSigungu(), raw.getEupmyeondong());
                h.setSido(locs[0]);
                h.setSigungu(locs[1]);
                h.setEmd(locs[2]);
                h.setRoadname(raw.getRoadName());
                h.setJibun(raw.getJibun());
                h.setBonbun(raw.getBonbun());
                h.setBubun(raw.getBubun());
                h.setArea(raw.getExclusiveAreaM2() != null ? new BigDecimal(raw.getExclusiveAreaM2().toString()) : null);
                h.setContractYm(raw.getContractYyyymm());
                h.setContractDay(raw.getContractDay() != null ? Integer.valueOf(raw.getContractDay()) : null);
                h.setDeposit(raw.getDepositMan());
                h.setRentfee(raw.getMonthlyRentMan());
                h.setName(raw.getComplexName());
                h.setFloorNo(raw.getFloorNo() != null ? Integer.valueOf(raw.getFloorNo()) : null);
                h.setSourceTable("MOLIT_APT_RENT_RAW");
                h.setSourceRawId(raw.getId());

                batch.add(h);
                count++;
            }
            houseRepo.saveAll(batch);
            log.info("Apt Rent batch {} saved. Total: {}", page, count);
            page++;
        }
        log.info("Apt Rent Migrated: {}", count);
        return count;
    }

    private long migrateVillaSale() {
        log.info("Migrating Villa Sale...");
        long count = 0;
        int page = 0;
        
        while (true) {
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<MolitVillaSaleRawEntity> pageData = villaSaleRepo.findAll(pageable);
            if (pageData.isEmpty()) break;
            
            List<House> batch = new ArrayList<>();
            for (MolitVillaSaleRawEntity raw : pageData) {
                House h = new House();
                h.setPropertyType("연립다세대");
                h.setDealType("매매");
                
                String[] locs = parseSigungu(raw.getSigungu(), null); // Villa entity doesn't have EMD field, parse from sigungu/beonji
                h.setSido(locs[0]);
                h.setSigungu(locs[1]);
                // Attempt to get Dong from Sigungu strings like "서울특별시 동작구 상도동"
                String emd = locs[2];
                if (emd == null || emd.isEmpty()) {
                     String fullSigungu = raw.getSigungu();
                     if (fullSigungu != null) {
                         String[] tokens = fullSigungu.split(" ");
                         if (tokens.length >= 3) {
                             emd = tokens[2];
                         }
                     }
                }
                h.setEmd(emd);

                h.setRoadname(raw.getRoadName());
                h.setJibun(raw.getBeonji());
                h.setBonbun(raw.getBonbun());
                h.setBubun(raw.getBubun());
                h.setArea(raw.getExclArea());
                h.setContractYm(raw.getContractYm() != null ? String.valueOf(raw.getContractYm()) : null);
                h.setContractDay(raw.getContractDay() != null ? Integer.valueOf(raw.getContractDay()) : null);
                h.setTrade(raw.getDealAmountMan());
                h.setName(raw.getBuildingName());
                h.setFloorNo(raw.getFloorNo() != null ? Integer.valueOf(raw.getFloorNo()) : null);
                h.setSourceTable("MOLIT_VILLA_SALE_RAW");
                h.setSourceRawId(raw.getId());

                batch.add(h);
                count++;
            }
            houseRepo.saveAll(batch);
            log.info("Villa Sale batch {} saved. Total: {}", page, count);
            page++;
        }
        log.info("Villa Sale Migrated: {}", count);
        return count;
    }

    private long migrateVillaRent() {
        log.info("Migrating Villa Rent...");
        long count = 0;
        int page = 0;
        
        while (true) {
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<MolitVillaRentRawEntity> pageData = villaRentRepo.findAll(pageable);
            if (pageData.isEmpty()) break;
            
            List<House> batch = new ArrayList<>();
            for (MolitVillaRentRawEntity raw : pageData) {
                House h = new House();
                h.setPropertyType("연립다세대");
                long monthly = raw.getMonthlyRentMan() != null ? raw.getMonthlyRentMan() : 0L;
                h.setDealType(monthly > 0 ? "월세" : "전세");
                
                String[] locs = parseSigungu(raw.getSigungu(), null);
                h.setSido(locs[0]);
                h.setSigungu(locs[1]);
                String emd = locs[2];
                if (emd == null || emd.isEmpty()) {
                     String fullSigungu = raw.getSigungu();
                     if (fullSigungu != null) {
                         String[] tokens = fullSigungu.split(" ");
                         if (tokens.length >= 3) {
                             emd = tokens[2];
                         }
                     }
                }
                h.setEmd(emd);

                h.setRoadname(raw.getRoadName());
                h.setJibun(raw.getBeonji());
                h.setBonbun(raw.getBonbun());
                h.setBubun(raw.getBubun());
                h.setArea(raw.getExclArea());
                h.setContractYm(raw.getContractYm() != null ? String.valueOf(raw.getContractYm()) : null);
                h.setContractDay(raw.getContractDay() != null ? Integer.valueOf(raw.getContractDay()) : null);
                h.setDeposit(raw.getDepositMan());
                h.setRentfee(raw.getMonthlyRentMan());
                h.setName(raw.getBuildingName());
                h.setFloorNo(raw.getFloorNo() != null ? Integer.valueOf(raw.getFloorNo()) : null);
                h.setSourceTable("MOLIT_VILLA_RENT_RAW");
                h.setSourceRawId(raw.getId());

                batch.add(h);
                count++;
            }
            houseRepo.saveAll(batch);
            log.info("Villa Rent batch {} saved. Total: {}", page, count);
            page++;
        }
        log.info("Villa Rent Migrated: {}", count);
        return count;
    }

    private long migrateOfficetelSale() {
        log.info("Migrating Officetel Sale...");
        long count = 0;
        int page = 0;
        
        while (true) {
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<MolitOfficetelSaleRawEntity> pageData = officetelSaleRepo.findAll(pageable);
            if (pageData.isEmpty()) break;
            
            List<House> batch = new ArrayList<>();
            for (MolitOfficetelSaleRawEntity raw : pageData) {
                House h = new House();
                h.setPropertyType("오피스텔");
                h.setDealType("매매");
                
                String[] locs = parseSigungu(raw.getSigungu(), null);
                h.setSido(locs[0]);
                h.setSigungu(locs[1]);
                String emd = locs[2];
                if (emd == null || emd.isEmpty()) {
                     String fullSigungu = raw.getSigungu();
                     if (fullSigungu != null) {
                         String[] tokens = fullSigungu.split(" ");
                         if (tokens.length >= 3) {
                             emd = tokens[2];
                         }
                     }
                }
                h.setEmd(emd);

                h.setRoadname(raw.getRoadName());
                h.setJibun(raw.getBeonji());
                h.setBonbun(raw.getBonbun());
                h.setBubun(raw.getBubun());
                h.setArea(raw.getExclArea());
                h.setContractYm(raw.getContractYm() != null ? String.valueOf(raw.getContractYm()) : null);
                h.setContractDay(raw.getContractDay() != null ? Integer.valueOf(raw.getContractDay()) : null);
                h.setTrade(raw.getDealAmountMan());
                h.setName(raw.getComplexName());
                h.setFloorNo(raw.getFloorNo() != null ? Integer.valueOf(raw.getFloorNo()) : null);
                h.setSourceTable("MOLIT_OFFICETEL_SALE_RAW");
                h.setSourceRawId(raw.getId());

                batch.add(h);
                count++;
            }
            houseRepo.saveAll(batch);
            log.info("Officetel Sale batch {} saved. Total: {}", page, count);
            page++;
        }
        log.info("Officetel Sale Migrated: {}", count);
        return count;
    }

    private long migrateOfficetelRent() {
        log.info("Migrating Officetel Rent...");
        long count = 0;
        int page = 0;
        
        while (true) {
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<MolitOfficetelRentRawEntity> pageData = officetelRentRepo.findAll(pageable);
            if (pageData.isEmpty()) break;
            
            List<House> batch = new ArrayList<>();
            for (MolitOfficetelRentRawEntity raw : pageData) {
                House h = new House();
                h.setPropertyType("오피스텔");
                long monthly = raw.getMonthlyRentMan() != null ? raw.getMonthlyRentMan() : 0L;
                h.setDealType(monthly > 0 ? "월세" : "전세");
                
                String[] locs = parseSigungu(raw.getSigungu(), null);
                h.setSido(locs[0]);
                h.setSigungu(locs[1]);
                String emd = locs[2];
                if (emd == null || emd.isEmpty()) {
                     String fullSigungu = raw.getSigungu();
                     if (fullSigungu != null) {
                         String[] tokens = fullSigungu.split(" ");
                         if (tokens.length >= 3) {
                             emd = tokens[2];
                         }
                     }
                }
                h.setEmd(emd);

                h.setRoadname(raw.getRoadName());
                h.setJibun(raw.getBeonji());
                h.setBonbun(raw.getBonbun());
                h.setBubun(raw.getBubun());
                h.setArea(raw.getExclArea());
                h.setContractYm(raw.getContractYm() != null ? String.valueOf(raw.getContractYm()) : null);
                h.setContractDay(raw.getContractDay() != null ? Integer.valueOf(raw.getContractDay()) : null);
                h.setDeposit(raw.getDepositMan());
                h.setRentfee(raw.getMonthlyRentMan());
                h.setName(raw.getComplexName());
                h.setFloorNo(raw.getFloorNo() != null ? Integer.valueOf(raw.getFloorNo()) : null);
                h.setSourceTable("MOLIT_OFFICETEL_RENT_RAW");
                h.setSourceRawId(raw.getId());

                batch.add(h);
                count++;
            }
            houseRepo.saveAll(batch);
            log.info("Officetel Rent batch {} saved. Total: {}", page, count);
            page++;
        }
        log.info("Officetel Rent Migrated: {}", count);
        return count;
    }

    private String[] parseSigungu(String rawSigungu, String rawEmd) {
        String sido = null;
        String sigungu = null;
        String emd = rawEmd;

        if (rawSigungu != null && !rawSigungu.isEmpty()) {
            String[] tokens = rawSigungu.split(" ");
            if (tokens.length > 0) {
                sido = tokens[0];
                sigungu = tokens[0];
            }
            if (tokens.length >= 2) {
                sigungu = tokens[0] + " " + tokens[1];
                
                if (tokens.length >= 3) {
                    // 예: "경기도 성남시 분당구 정자동"
                    if (tokens[1].endsWith("시") && tokens[2].endsWith("구")) {
                        sigungu = tokens[0] + " " + tokens[1] + " " + tokens[2];
                        if (tokens.length >= 4 && (emd == null || emd.isEmpty())) {
                            emd = tokens[3];
                        }
                    } else {
                        // 예: "서울특별시 은평구 진관동"
                        if (emd == null || emd.isEmpty()) {
                            emd = tokens[2];
                        }
                    }
                }
            }
        }
        return new String[] {sido, sigungu, emd};
    }
}
