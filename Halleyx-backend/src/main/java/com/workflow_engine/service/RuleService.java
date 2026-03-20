package com.workflow_engine.service;

import com.workflow_engine.entity.Rule;
import com.workflow_engine.repository.RuleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RuleService {

    private final RuleRepository ruleRepository;

    public RuleService(RuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    public Rule createRule(UUID stepId, Rule rule) {

        rule.setStepId(stepId);
        rule.setCreatedAt(LocalDateTime.now());
        rule.setUpdatedAt(LocalDateTime.now());

        return ruleRepository.save(rule);
    }

    public List<Rule> getRules(UUID stepId) {
        return ruleRepository.findByStepIdOrderByPriorityAsc(stepId);
    }

    public Rule updateRule(UUID id, Rule rule) {

        Rule existing = ruleRepository.findById(id).orElseThrow();

        existing.setCondition(rule.getCondition());
        existing.setNextStepId(rule.getNextStepId());
        existing.setPriority(rule.getPriority());
        existing.setUpdatedAt(LocalDateTime.now());

        return ruleRepository.save(existing);
    }

    public void deleteRule(UUID id) {
        ruleRepository.deleteById(id);
    }
}