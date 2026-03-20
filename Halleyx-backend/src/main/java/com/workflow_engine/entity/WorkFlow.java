package com.workflow_engine.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(
        name = "work_flows",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"name","version"})
        }
)
public class WorkFlow {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;

    private Integer version;

    private Boolean isActive;

    @Column(columnDefinition = "TEXT")
    private String inputSchema;

    private UUID startStepId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}