package com.workflow_engine.controller;

import com.workflow_engine.entity.Rule;
import com.workflow_engine.service.RuleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class RuleController {

    private final RuleService ruleService;

    public RuleController(RuleService ruleService) {
        this.ruleService = ruleService;
    }

    @PostMapping("/steps/{stepId}/rules")
    public Rule createRule(@PathVariable UUID stepId, @RequestBody Rule rule) {
        return ruleService.createRule(stepId, rule);
    }

    @GetMapping("/steps/{stepId}/rules")
    public List<Rule> getRules(@PathVariable UUID stepId) {
        return ruleService.getRules(stepId);
    }

    @PutMapping("/rules/{id}")
    public Rule updateRule(@PathVariable UUID id, @RequestBody Rule rule) {
        return ruleService.updateRule(id, rule);
    }

    @DeleteMapping("/rules/{id}")
    public void deleteRule(@PathVariable UUID id) {
        ruleService.deleteRule(id);
    }
}