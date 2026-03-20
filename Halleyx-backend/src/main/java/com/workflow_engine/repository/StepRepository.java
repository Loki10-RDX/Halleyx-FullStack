package com.workflow_engine.repository;

import com.workflow_engine.entity.Step;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StepRepository extends JpaRepository<Step, UUID> {

    List<Step> findByWorkflowId(UUID workflowId);

}