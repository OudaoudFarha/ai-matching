package com.resume.resume_service.parser;
// com.resume.resume.parser.PdfParserService

import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import java.io.InputStream;

@Service
public class PdfParserService {
    private final Tika tika = new Tika();
    public String extractText(InputStream pdf) throws Exception {
        String raw = tika.parseToString(pdf);
        return raw.replaceAll("\\s+", " ").trim();
    }
}

