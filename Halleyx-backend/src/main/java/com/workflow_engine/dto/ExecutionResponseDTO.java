package com.workflow_engine.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ExecutionResponseDTO {

    private UUID id;
    private UUID workflowId;
    private String workflowName; // 🔥 IMPORTANT
    private String status;
    private UUID currentStepId;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private String logs;
}