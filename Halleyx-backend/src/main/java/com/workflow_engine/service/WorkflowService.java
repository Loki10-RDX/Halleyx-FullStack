package com.workflow_engine.service;



import com.fasterxml.jackson.databind.JsonNode;
import com.workflow_engine.dto.WorkflowResponseDTO;
import com.workflow_engine.entity.WorkFlow;
import com.workflow_engine.repository.WorkflowRepository;
import org.springframework.stereotype.Service;
import com.workflow_engine.dto.WorkflowRequestDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

@Service
public class WorkflowService {

    private final WorkflowRepository workflowRepository;

    public WorkflowService(WorkflowRepository workflowRepository) {
        this.workflowRepository = workflowRepository;
    }



    @Transactional
    public WorkflowResponseDTO createWorkflow(WorkflowRequestDTO request) {

        String workflowName = request.getName().trim().toLowerCase();

        boolean exists = workflowRepository.existsByNameIgnoreCase(workflowName);

        if (exists) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Workflow already exists. Use edit to create a new version."
            );
        }

        WorkFlow workflow = new WorkFlow();

        workflow.setName(workflowName);
        workflow.setVersion(1);
        workflow.setIsActive(true);

        ObjectMapper mapper = new ObjectMapper();

        try {
            workflow.setInputSchema(
                    mapper.writeValueAsString(request.getInputSchema())
            );
        } catch (Exception e) {
            workflow.setInputSchema("{}");
        }

        workflow.setCreatedAt(LocalDateTime.now());
        workflow.setUpdatedAt(LocalDateTime.now());

        workflowRepository.save(workflow);

        return new WorkflowResponseDTO(
                "Workflow created successfully",
                workflow.getName()
        );
    }

    public Page<WorkFlow> getAllWorkflows(Pageable pageable) {
        return workflowRepository.findAll(pageable);
    }
    public WorkFlow getWorkflowById(UUID id) {
        return workflowRepository.findById(id).orElseThrow();
    }

    @Transactional
    public WorkFlow updateWorkflow(UUID id, WorkflowRequestDTO request) {

        WorkFlow existing = workflowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));

        String workflowName = existing.getName();

        ObjectMapper mapper = new ObjectMapper();

        String newSchema;
        try {
            newSchema = mapper.writeValueAsString(request.getInputSchema());
        } catch (Exception e) {
            newSchema = "{}";
        }

        // 🔹 GET ALL VERSIONS
        List<WorkFlow> versions = workflowRepository.findByNameOrderByVersionDesc(workflowName);

        // 🔹 CHECK IF SCHEMA ALREADY EXISTS
        for (WorkFlow wf : versions) {

            try {

                JsonNode existingNode = mapper.readTree(wf.getInputSchema());
                JsonNode newNode = mapper.readTree(newSchema);

                if (existingNode.equals(newNode)) {

                    workflowRepository.deactivateOldVersions(workflowName);

                    wf.setIsActive(true);
                    wf.setUpdatedAt(LocalDateTime.now());

                    return workflowRepository.save(wf);
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // 🔹 CREATE NEW VERSION
        WorkFlow latest = versions.get(0);
        int newVersion = latest.getVersion() + 1;

        workflowRepository.deactivateOldVersions(workflowName);

        WorkFlow newWorkflow = new WorkFlow();

        newWorkflow.setName(workflowName);
        newWorkflow.setVersion(newVersion);
        newWorkflow.setIsActive(true);
        newWorkflow.setInputSchema(newSchema);
        newWorkflow.setCreatedAt(existing.getCreatedAt());
        newWorkflow.setUpdatedAt(LocalDateTime.now());

        return workflowRepository.save(newWorkflow);
    }
    @Transactional
    public void deleteWorkflow(UUID id) {

        WorkFlow wf = workflowRepository.findById(id)
                .orElseThrow();

        String name = wf.getName();

        if (wf.getIsActive()) {

            List<WorkFlow> versions =
                    workflowRepository.findByNameOrderByVersionDesc(name);

            if (versions.size() > 1) {

                WorkFlow next = versions.stream()
                        .filter(v -> !v.getId().equals(id))
                        .findFirst()
                        .orElseThrow();

                next.setIsActive(true);
                workflowRepository.save(next);
            }
        }

        workflowRepository.deleteById(id);
    }

    public List<WorkFlow> getWorkflowVersions(String name) {
        return workflowRepository.findByNameOrderByVersionDesc(name);
    }
    @Transactional
    public void deleteWorkflowByName(String name) {
        List<WorkFlow> versions = workflowRepository.findByNameIgnoreCase(name);
        workflowRepository.deleteAll(versions);
    }
}
