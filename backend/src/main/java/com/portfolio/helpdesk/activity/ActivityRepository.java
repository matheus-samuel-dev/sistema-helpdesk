package com.portfolio.helpdesk.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ActivityRepository extends JpaRepository<ActivityEvent, Long>, JpaSpecificationExecutor<ActivityEvent> {
}
