package io.pjj.ziphyeonjeon.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("집현전 API 문서")
                        .version("1.0.0")
                        .description("[집현전](https://ziphyeonjeon.pages.dev/)은 부동산 관련 서비스를 제공하는 플랫폼입니다.\n")


                );
    }
}