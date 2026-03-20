package com.workflow_engine.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "rules")
public class Rule {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID stepId;

    private String condition;

    private UUID nextStepId;

    private Integer priority;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}