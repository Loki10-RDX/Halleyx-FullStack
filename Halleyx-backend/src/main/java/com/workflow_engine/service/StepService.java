package com.workflow_engine.service;

import com.workflow_engine.entity.Step;
import com.workflow_engine.repository.StepRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class StepService {

    private final StepRepository stepRepository;

    public StepService(StepRepository stepRepository) {
        this.stepRepository = stepRepository;
    }

    public Step createStep(UUID workflowId, Step step) {

        step.setWorkflowId(workflowId);
        step.setCreatedAt(LocalDateTime.now());
        step.setUpdatedAt(LocalDateTime.now());

        return stepRepository.save(step);
    }

    public List<Step> getSteps(UUID workflowId) {
        return stepRepository.findByWorkflowId(workflowId);
    }

    public Step updateStep(UUID id, Step step) {

        Step existing = stepRepository.findById(id).orElseThrow();

        existing.setName(step.getName());
        existing.setStepType(step.getStepType());
        existing.setStepOrder(step.getStepOrder());
        existing.setMetadata(step.getMetadata());
        existing.setUpdatedAt(LocalDateTime.now());

        return stepRepository.save(existing);
    }

    public void deleteStep(UUID id) {
        stepRepository.deleteById(id);
    }
}