package io.pjj.ziphyeonjeon.global.API.common;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "external")
public class ExternalApiProperties {

    private Vworld vworld = new Vworld();
    private Seoul seoul = new Seoul();
    private Gemini gemini = new Gemini();

    public Vworld getVworld() {
        return vworld;
    }

    public Seoul getSeoul() {
        return seoul;
    }

    public Gemini getGemini() {
        return gemini;
    }

    public static class Gemini {
        private String baseUrl;
        private String apiKey;

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }
    }

    public static class Vworld {
        private String baseUrl;
        private String searchBaseUrl;
        private String apiKey;

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getSearchBaseUrl() {
            return searchBaseUrl;
        }

        public void setSearchBaseUrl(String searchBaseUrl) {
            this.searchBaseUrl = searchBaseUrl;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }
    }

    public static class Seoul {
        private String baseUrl;
        private String apiKey;

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }
    }
}
