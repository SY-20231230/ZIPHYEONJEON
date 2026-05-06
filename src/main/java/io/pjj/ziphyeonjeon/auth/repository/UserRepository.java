package io.pjj.ziphyeonjeon.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import io.pjj.ziphyeonjeon.auth.entity.User;

import java.util.Optional;

/**
 * [집현전 프로젝트 - 사용자 데이터 접근 계층]
 * 분석: Spring Data JPA를 사용하여 USERS 테이블에 대한 CRUD 및 특수 쿼리를 수행합니다.
 * SQLD 관점: 인덱스가 걸린 EMAIL 컬럼을 활용하여 검색 최적화를 수행합니다.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 1. 이메일을 통한 사용자 조회
     * @param email 로그인 시 입력받은 고유 식별자
     * @return Optional<User>: NullPointerException을 방지하기 위한 전문적인 래퍼 객체
     * * 분석: SQL의 "SELECT * FROM USERS WHERE EMAIL = ?" 쿼리를 자동으로 생성합니다.
     */
    Optional<User> findByEmail(String email);

    /**
     * 2. 이메일 중복 존재 여부 확인
     * @param email 회원가입 시 입력한 이메일
     * @return 존재하면 true, 없으면 false
     * * 분석: SQL의 "SELECT COUNT(*) > 0 FROM USERS WHERE EMAIL = ?" 보다 효율적인 
     * "EXISTS" 쿼리를 내부적으로 실행합니다. (SQLD 성능 최적화 기법)
     */
    boolean existsByEmail(String email);

    /**
     * 3. 사용자 이름(닉네임) 중복 여부 확인
     * @param userName 동규님이 요구하신 필수 검증 항목
     * @return 존재 여부
     */
    boolean existsByUserName(String userName);
}