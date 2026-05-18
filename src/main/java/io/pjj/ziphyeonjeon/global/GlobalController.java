package io.pjj.ziphyeonjeon.global;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GlobalController {

    @GetMapping("/")
    public String renderResponse() {
        return "RenderResponse";
    }
}