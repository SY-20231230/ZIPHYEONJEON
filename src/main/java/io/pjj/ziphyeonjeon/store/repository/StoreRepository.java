package io.pjj.ziphyeonjeon.store.repository;

import io.pjj.ziphyeonjeon.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    boolean existsBySigunguAndEmdAndJibunAndFloor(String sigungu, String emd, String jibun, String floor);
    List<Store> findBySigungu(String sigungu);
    List<Store> findBySigunguAndDealYearAndDealMonth(String sigungu, String dealYear, String dealMonth);
    List<Store> findBySggCd(String sggCd);
    List<Store> findBySggCdAndDealYearAndDealMonth(String sggCd, String dealYear, String dealMonth);
}
 