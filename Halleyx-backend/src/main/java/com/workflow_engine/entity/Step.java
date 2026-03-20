package com.workflow_engine.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "steps")
public class Step {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID workflowId;

    private String name;

    @Enumerated(EnumType.STRING)
    private StepType stepType;

    private Integer stepOrder;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
    private String assigneeEmail;
}