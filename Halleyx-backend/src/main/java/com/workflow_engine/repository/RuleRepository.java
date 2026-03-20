package com.workflow_engine.repository;
import com.workflow_engine.entity.Rule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RuleRepository extends JpaRepository<Rule, UUID> {
    List<Rule> findByStepIdOrderByPriorityAsc(UUID stepId);
    List<Rule> findByStepId(UUID stepId);
}