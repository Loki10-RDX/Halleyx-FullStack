package com.workflow_engine.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.workflow_engine.entity.WorkFlow;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowRepository extends JpaRepository<WorkFlow, UUID> {

    Page<WorkFlow> findAll(Pageable pageable);

    List<WorkFlow> findByNameOrderByVersionDesc(String name);
    List<WorkFlow> findByNameIgnoreCase(String name);
    @Modifying
    @Query("UPDATE WorkFlow w SET w.isActive = false WHERE w.name = :name")
    void deactivateOldVersions(@Param("name") String name);
    boolean existsByNameIgnoreCase(String name);
    Optional<WorkFlow> findTopByNameOrderByVersionDesc(String name);

}