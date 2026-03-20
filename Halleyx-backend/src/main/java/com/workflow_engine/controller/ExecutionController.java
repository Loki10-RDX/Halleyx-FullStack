package com.workflow_engine.controller;

import com.workflow_engine.dto.ExecutionResponseDTO;
import com.workflow_engine.entity.Execution;
import com.workflow_engine.repository.ExecutionRepository;
import com.workflow_engine.service.ExecutionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ExecutionController {

    private final ExecutionService executionService;
    private final ExecutionRepository executionRepository;

    public ExecutionController(ExecutionService executionService,
                               ExecutionRepository executionRepository) {
        this.executionService = executionService;
        this.executionRepository = executionRepository;
    }

    // 🚀 START WORKFLOW
    @PostMapping("/workflows/{workflowId}/execute")
    public ExecutionResponseDTO startWorkflow(@PathVariable UUID workflowId,
                                              @RequestBody String data) {

        Execution execution = executionService.startWorkflow(workflowId, data);
        return executionService.mapToDTO(execution);
    }

    // 🔍 GET SINGLE EXECUTION
    @GetMapping("/executions/{id}")
    public ExecutionResponseDTO getExecution(@PathVariable UUID id) {
        return executionService.mapToDTO(executionService.getExecution(id));
    }

    // ❌ CANCEL
    @PostMapping("/executions/{id}/cancel")
    public ExecutionResponseDTO cancelExecution(@PathVariable UUID id) {
        return executionService.mapToDTO(executionService.cancelExecution(id));
    }

    // 🔁 RETRY
    @PostMapping("/executions/{id}/retry")
    public ExecutionResponseDTO retryExecution(@PathVariable UUID id) {
        return executionService.mapToDTO(executionService.retryExecution(id));
    }

    // ✅ COMPLETE STEP
    @PostMapping("/executions/{id}/complete-step")
    public ExecutionResponseDTO completeStep(@PathVariable UUID id) {
        return executionService.mapToDTO(executionService.completeStep(id));
    }

    // 📄 GET ALL EXECUTIONS
    @GetMapping("/executions")
    public List<ExecutionResponseDTO> getAllExecutions() {
        return executionRepository.findAll()
                .stream()
                .map(executionService::mapToDTO)
                .toList();
    }
}