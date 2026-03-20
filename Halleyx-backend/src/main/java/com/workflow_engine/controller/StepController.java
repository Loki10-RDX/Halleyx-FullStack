package com.workflow_engine.controller;

import com.workflow_engine.entity.Step;
import com.workflow_engine.service.StepService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class StepController {

    private final StepService stepService;

    public StepController(StepService stepService) {
        this.stepService = stepService;
    }

    @PostMapping("/workflows/{workflowId}/steps")
    public Step createStep(@PathVariable UUID workflowId, @RequestBody Step step) {
        return stepService.createStep(workflowId, step);
    }

    @GetMapping("/workflows/{workflowId}/steps")
    public List<Step> getSteps(@PathVariable UUID workflowId) {
        return stepService.getSteps(workflowId);
    }

    @PutMapping("/steps/{id}")
    public Step updateStep(@PathVariable UUID id, @RequestBody Step step) {
        return stepService.updateStep(id, step);
    }

    @DeleteMapping("/steps/{id}")
    public void deleteStep(@PathVariable UUID id) {
        stepService.deleteStep(id);
    }
}