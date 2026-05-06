package io.pjj.ziphyeonjeon.global.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

@Component
public class AddressCodeMap {
    private final Map<String, String> codeMap = new HashMap<>();

    @PostConstruct
    public void init() {
        InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream("common/address_codes.txt");

        if (is == null) {
            System.err.println("파일을 찾을 수 없습니다!");
            return;
        }

        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"))) {
            String line;
            br.readLine();

            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\t");
                if (parts.length >= 3) {
                    String code = parts[0].trim();
                    String address = parts[1].trim();
                    if (parts[2].contains("존재")) {
                        codeMap.put(address, code);
                    }
                }
            }
            System.out.println("address_codes.txt: " + codeMap.size() + "건");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public String getCode(String fullAddress) {
        return codeMap.get(fullAddress);
    }

    public java.util.Set<String> getAllSigunguCodes() {
        java.util.Set<String> sigunguCodes = new java.util.HashSet<>();
        for (String code : codeMap.values()) {
            if (code != null && code.length() >= 5) {
                sigunguCodes.add(code.substring(0, 5));
            }
        }
        return sigunguCodes;
    }

    public String getLawdCdBySigungu(String sigungu) {
        for (Map.Entry<String, String> entry : codeMap.entrySet()) {
            if (entry.getKey().contains(sigungu)) {
                String code = entry.getValue();
                if (code != null && code.length() >= 5) {
                    return code.substring(0, 5);
                }
            }
        }
        return null;
    }
}
