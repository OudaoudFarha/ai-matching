package com.resume.resume_service.Job;

// com.resume.resume.api.MatchController


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.resume_service.Job.Job;
import com.resume.resume_service.Job.JobRepository;
import com.resume.resume_service.resume.Resume;
import com.resume.resume_service.resume.ResumeRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/match")
public class MatchController {
    private final JobRepository jobRepo;
    private final ResumeRepository cvRepo;
    private final ObjectMapper om = new ObjectMapper();

    public MatchController(JobRepository jobRepo, ResumeRepository cvRepo) {
        this.jobRepo = jobRepo; this.cvRepo = cvRepo;
    }

    @GetMapping("/jobs/{jobId}/top")
    public List<Map<String,Object>> topForJob(@PathVariable Long jobId,
                                              @RequestParam(defaultValue = "10") int limit) throws Exception {
        Job job = jobRepo.findById(jobId).orElseThrow();
        float[] jobVec = toFloatArr(job.getEmbeddingJson());
        List<Map<String,Object>> out = new ArrayList<>();

        for (Resume r : cvRepo.findAll()) {
            if (r.getEmbeddingJson()==null) continue;
            float[] cv = toFloatArr(r.getEmbeddingJson());
            double score = cosine(jobVec, cv);
            Map<String,Object> m = new HashMap<>();
            m.put("resumeId", r.getId());
            m.put("filename", r.getFilename());
            m.put("score", score);
            out.add(m);
        }
        out.sort((a,b) -> Double.compare((double)b.get("score"), (double)a.get("score")));
        return out.stream().limit(limit).toList();
    }

    private float[] toFloatArr(String json) throws Exception {
        List<Double> list = om.readValue(json, new TypeReference<List<Double>>(){});
        float[] v = new float[list.size()];
        for (int i=0;i<v.length;i++) v[i] = list.get(i).floatValue();
        return v;
    }
    private double cosine(float[] a, float[] b){
        double dot=0,na=0,nb=0;
        int n=Math.min(a.length,b.length);
        for(int i=0;i<n;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
        return dot/(Math.sqrt(na)*Math.sqrt(nb)+1e-9);
    }
}

