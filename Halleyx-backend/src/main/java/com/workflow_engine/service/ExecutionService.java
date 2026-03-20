package com.workflow_engine.service;

import com.workflow_engine.dto.ExecutionResponseDTO;
import com.workflow_engine.entity.Execution;
import com.workflow_engine.entity.Rule;
import com.workflow_engine.entity.Step;

import com.workflow_engine.repository.ExecutionRepository;
import com.workflow_engine.repository.RuleRepository;
import com.workflow_engine.repository.StepRepository;
import com.workflow_engine.repository.WorkflowRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ExecutionService {

    private final ExecutionRepository executionRepository;
    private final StepRepository stepRepository;
    private final RuleRepository ruleRepository;
    private final WorkflowRepository workflowRepository;

    // ✅ CLEAN CONSTRUCTOR
    public ExecutionService(ExecutionRepository executionRepository,
                            StepRepository stepRepository,
                            RuleRepository ruleRepository,
                            WorkflowRepository workflowRepository) {
        this.executionRepository = executionRepository;
        this.stepRepository = stepRepository;
        this.ruleRepository = ruleRepository;
        this.workflowRepository = workflowRepository;
    }

    // 🚀 START WORKFLOW
    public Execution startWorkflow(UUID workflowId, String data) {

        List<Step> steps = stepRepository.findByWorkflowId(workflowId);

        if (steps.isEmpty()) {
            throw new RuntimeException("No steps defined for workflow");
        }

        Step firstStep = steps.stream()
                .sorted(java.util.Comparator.comparingInt(Step::getStepOrder))
                .findFirst()
                .get();

        Execution execution = new Execution();

        execution.setWorkflowId(workflowId);
        execution.setCurrentStepId(firstStep.getId());
        execution.setData(data);
        execution.setStatus("IN_PROGRESS");
        execution.setRetries(0);
        execution.setStartedAt(LocalDateTime.now());

        return executionRepository.save(execution);
    }

    public Execution getExecution(UUID id) {
        return executionRepository.findById(id).orElseThrow();
    }

    public Execution cancelExecution(UUID id) {
        Execution execution = getExecution(id);
        execution.setStatus("CANCELLED");
        execution.setEndedAt(LocalDateTime.now());
        return executionRepository.save(execution);
    }

    public Execution retryExecution(UUID id) {
        Execution execution = getExecution(id);
        execution.setRetries(execution.getRetries() + 1);
        execution.setStatus("IN_PROGRESS");
        return executionRepository.save(execution);
    }

    // 🔥 CORE ENGINE
    public Execution completeStep(UUID executionId) {

        Execution execution = getExecution(executionId);

        UUID currentStepId = execution.getCurrentStepId();

        List<Rule> rules = ruleRepository.findByStepId(currentStepId);

        if (rules.isEmpty()) {
            execution.setStatus("COMPLETED");
            execution.setEndedAt(LocalDateTime.now());
            return executionRepository.save(execution);
        }

        Rule matchedRule = null;

        for (Rule rule : rules) {
            boolean result = evaluateCondition(rule.getCondition(), execution.getData());

            log(execution, rule.getCondition(), result);

            if (result) {
                matchedRule = rule;
                break;
            }
        }

        if (matchedRule == null) {
            execution.setStatus("FAILED");
            execution.setEndedAt(LocalDateTime.now());
            return executionRepository.save(execution);
        }

        Step nextStep = stepRepository.findById(matchedRule.getNextStepId()).orElseThrow();
        execution.setCurrentStepId(nextStep.getId());

        return executionRepository.save(execution);
    }

    // 🧠 CONDITION EVALUATION
    private boolean evaluateCondition(String condition, String data) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> map = mapper.readValue(data, new TypeReference<Map<String, Object>>() {});

            if (condition.contains(">")) {
                String[] parts = condition.split(">");
                String key = parts[0].trim();
                int value = Integer.parseInt(parts[1].trim());

                int actual = (int) map.get(key);
                return actual > value;
            }

        } catch (Exception e) {
            return false;
        }

        return false;
    }

    // 🧾 LOGGING
    private void log(Execution execution, String rule, boolean result) {
        String newLog = "[RULE] " + rule + " → " + result + "\n";

        if (execution.getLogs() == null) {
            execution.setLogs(newLog);
        } else {
            execution.setLogs(execution.getLogs() + newLog);
        }
    }

    // 🔥 DTO MAPPING (IMPORTANT)
    public ExecutionResponseDTO mapToDTO(Execution execution) {

        ExecutionResponseDTO dto = new ExecutionResponseDTO();

        dto.setId(execution.getId());
        dto.setWorkflowId(execution.getWorkflowId());
        dto.setStatus(execution.getStatus());
        dto.setCurrentStepId(execution.getCurrentStepId());
        dto.setStartedAt(execution.getStartedAt());
        dto.setEndedAt(execution.getEndedAt());
        dto.setLogs(execution.getLogs());

        // 🔥 fetch workflow name
        workflowRepository.findById(execution.getWorkflowId())
                .ifPresent(workflow -> dto.setWorkflowName(workflow.getName()));

        return dto;
    }
}