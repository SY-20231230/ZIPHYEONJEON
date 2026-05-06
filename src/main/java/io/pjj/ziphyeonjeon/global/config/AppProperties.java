package io.pjj.ziphyeonjeon.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "app") // yml의 app: 키와 매핑
@Getter
@Setter
public class AppProperties {
    
    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private Long accessTokenValidity;
        private Long refreshTokenValidity;
    }

    @Getter
    @Setter
    public static class Cors {
        private String allowedOrigins;
    }
}