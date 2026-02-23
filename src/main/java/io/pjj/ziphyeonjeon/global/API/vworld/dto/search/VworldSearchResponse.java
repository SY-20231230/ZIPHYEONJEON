package io.pjj.ziphyeonjeon.global.API.vworld.dto.search;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class VworldSearchResponse {
    public Response response;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {
        public Result result;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {
        public List<Item> items;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        public String title;
        public String id; // This is PNU in parcel search
        public Address address;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Address {
        public String road;
        public String parcel;
        public String bldnm;
    }
}
