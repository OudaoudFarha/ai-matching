package com.resume.resume_service.Job;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.resume_service.Job.Job;
import com.resume.resume_service.Job.JobRepository;
import com.resume.resume_service.nlp.NlpClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
public class JobController {
    private final JobRepository repo;
    private final NlpClient nlp;
    private final ObjectMapper om = new ObjectMapper();

    public JobController(JobRepository repo, NlpClient nlp) { this.repo = repo; this.nlp = nlp; }

    @PostMapping
    public Job create(@RequestBody Job job){
        job.setId(null);
        return repo.save(job);
    }

    @PostMapping("/{id}/index")
    public Job index(@PathVariable Long id) throws Exception {
        Job j = repo.findById(id).orElseThrow();
        float[] vec = nlp.embed(j.getTitle() + " " + j.getDescription());
        j.setEmbeddingJson(om.writeValueAsString(vec));
        return repo.save(j);
    }

    @GetMapping("/{id}")
    public Job get(@PathVariable Long id){ return repo.findById(id).orElseThrow(); }
}

