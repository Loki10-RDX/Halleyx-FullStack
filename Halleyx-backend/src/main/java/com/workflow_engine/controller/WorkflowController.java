package com.workflow_engine.controller;

import com.workflow_engine.dto.WorkflowRequestDTO;
import com.workflow_engine.dto.WorkflowResponseDTO;
import com.workflow_engine.entity.WorkFlow;
import com.workflow_engine.service.WorkflowService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/workflows")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping
    public ResponseEntity<?> createWorkflow(@RequestBody WorkflowRequestDTO request) {

        try {
            WorkflowResponseDTO response = workflowService.createWorkflow(request);
            return ResponseEntity.ok(response);

        } catch (ResponseStatusException ex) {

            Map<String, String> error = new HashMap<>();
            error.put("message", ex.getReason());

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error);
        }
    }
    @GetMapping
    public Page<WorkFlow> getAllWorkflows(Pageable pageable) {
        return workflowService.getAllWorkflows(pageable);
    }

    @GetMapping("/{id}")
    public WorkFlow getWorkflow(@PathVariable UUID id) {
        return workflowService.getWorkflowById(id);
    }

    @PutMapping("/{id}")
    public WorkFlow updateWorkflow(
            @PathVariable UUID id,
            @RequestBody WorkflowRequestDTO request) {

        return workflowService.updateWorkflow(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteWorkflow(@PathVariable UUID id) {
        workflowService.deleteWorkflow(id);
    }

    @GetMapping("/name/{name}")
    public List<WorkFlow> getWorkflowVersions(@PathVariable String name) {
        return workflowService.getWorkflowVersions(name);
    }
    @DeleteMapping("/name/{name}")
    public void deleteWorkflowByName(@PathVariable String name) {
        workflowService.deleteWorkflowByName(name);
    }
}