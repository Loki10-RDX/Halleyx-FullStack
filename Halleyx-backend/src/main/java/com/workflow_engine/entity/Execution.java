package com.workflow_engine.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "executions")
public class Execution {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID workflowId;

    private UUID currentStepId;

    @Column(columnDefinition = "TEXT")
    private String data;

    @Column(columnDefinition = "TEXT")
    private String logs;

    private Integer retries;

    private String status;

    private String triggeredBy;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

}