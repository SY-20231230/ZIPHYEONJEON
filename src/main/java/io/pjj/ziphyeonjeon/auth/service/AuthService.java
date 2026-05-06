package io.pjj.ziphyeonjeon.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.pjj.ziphyeonjeon.auth.dto.LoginRequest;
import io.pjj.ziphyeonjeon.auth.dto.SignupRequest;
import io.pjj.ziphyeonjeon.auth.dto.UserResponseDto;
import io.pjj.ziphyeonjeon.auth.entity.User;
import io.pjj.ziphyeonjeon.global.config.AppProperties;
import io.pjj.ziphyeonjeon.global.security.JwtProvider;
import io.pjj.ziphyeonjeon.auth.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
// 💡 핵심: UserDetailsService를 구현해야 Spring Security가 동규님의 설정을 인정해줍니다!
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AppProperties appProperties;

    /**
     * 💡 [Spring Security 필수 메서드] 유저 정보 로드
     * 이 메서드가 있어야 "Using generated security password" 로그가 사라집니다.
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("[Security] 유저 정보 조회: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("해당 이메일의 유저를 찾을 수 없습니다: " + email));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles("USER") // 기본 권한 부여
                .build();
    }

    /**
     * [회원가입]
     */
    @Transactional
    public void signup(SignupRequest dto) {
        log.info("[Signup] 회원가입 시도: {}", dto.getEmail());

        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalStateException("이미 가입된 이메일 계정입니다.");
        }

        // 💡 User.java에 복구한 필드들을 빌더에 태웁니다.
        User user = User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .userName(dto.getUserName())
                .userType("ROLE_USER")
                .creditScore(dto.getCreditScore())
                .familyType(dto.getFamilyType())
                .incomeLevel(dto.getIncomeLevel())
                .build();

        userRepository.save(user);
        log.info("[Signup] 회원가입 완료: {}", user.getEmail());
    }

    /**
     * [로그인]
     */
    @Transactional
    public Map<String, Object> login(LoginRequest dto) {
        log.info("[Login] 로그인 시도: {}", dto.getEmail());

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new NoSuchElementException("가입되지 않은 이메일입니다."));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtProvider.createToken(user.getEmail(), user.getUserType());
        String refreshToken = jwtProvider.createRefreshToken(user.getEmail());

        // Redis에 Refresh Token 저장 (RTR)
        redisTemplate.opsForValue().set(
                "RT:" + user.getEmail(),
                refreshToken,
                appProperties.getJwt().getRefreshTokenValidity(),
                TimeUnit.MILLISECONDS);

        log.info("[Login] 로그인 성공: {}", user.getEmail());

        Map<String, Object> result = new HashMap<>();
        result.put("accessToken", accessToken);
        result.put("refreshToken", refreshToken);

        return result;
    }

    /**
     * [토큰 재발급 - RTR]
     */
    @Transactional
    public Map<String, String> refresh(String requestRefreshToken) {
        if (!jwtProvider.validateToken(requestRefreshToken)) {
            throw new BadCredentialsException("세션이 만료되었습니다. 다시 로그인해주세요.");
        }

        String email = jwtProvider.getEmail(requestRefreshToken);
        String savedToken = (String) redisTemplate.opsForValue().get("RT:" + email);

        if (savedToken == null || !savedToken.equals(requestRefreshToken)) {
            redisTemplate.delete("RT:" + email);
            throw new BadCredentialsException("비정상 접근 감지. 다시 로그인하세요.");
        }

        String newAccessToken = jwtProvider.createToken(email, "ROLE_USER");
        String newRefreshToken = jwtProvider.createRefreshToken(email);

        redisTemplate.opsForValue().set(
                "RT:" + email,
                newRefreshToken,
                appProperties.getJwt().getRefreshTokenValidity(),
                TimeUnit.MILLISECONDS);

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", newAccessToken);
        tokens.put("refreshToken", newRefreshToken);

        return tokens;
    }

    /**
     * [로그아웃]
     */
    @Transactional
    public void logout(String email) {
        redisTemplate.delete("RT:" + email);
        log.info("[Logout] 로그아웃 완료: {}", email);
    }

    @Transactional(readOnly = true)
    public UserResponseDto getUserProfile(String email) {
        // 1. DB에서 이메일로 유저 엔티티를 찾습니다[cite: 2].
        // (userRepository가 주입되어 있어야 합니다.)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("해당 이메일을 가진 사용자를 찾을 수 없습니다: " + email));

        // 2. 엔티티 정보를 UserResponseDto로 정교하게 변환하여 반환합니다[cite: 3].
        return UserResponseDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .userName(user.getUserName()) // 👈 마이페이지 '홍길동' 출력의 핵심[cite: 3]
                .userType(user.getUserType())
                .creditScore(user.getCreditScore()) // 👈 신용점수 연동[cite: 3]
                .familyType(user.getFamilyType()) // 👈 가구형태 연동[cite: 3]
                .incomeLevel(user.getIncomeLevel()) // 👈 소득수준 연동[cite: 3]
                .lastLoginAt(user.getLastLoginAt())
                .createdTime(user.getCreatedTime())
                .build();
    }
}