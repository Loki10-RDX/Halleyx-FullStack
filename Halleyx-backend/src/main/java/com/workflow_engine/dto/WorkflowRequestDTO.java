package com.workflow_engine.dto;


import lombok.Data;

import java.util.Map;

@Data
public class WorkflowRequestDTO {

    private String name;

    private Boolean isActive;

    private Map<String, Object> inputSchema;

}